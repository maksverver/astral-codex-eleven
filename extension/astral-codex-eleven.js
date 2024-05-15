'use strict';

(async function() {
  const LOG_TAG = '[Astral Codex Eleven]';
  console.info(LOG_TAG, 'Starting extension.');

  // Start loading options asynchronously (this doesn't depend on the DOM).
  const loadOptionsResult = loadOptions();

  // Wait for the DOM to load fully before continuing.
  if (document.readyState === 'loading') {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve));
  }

  // Hack to keep the displayed number of comments correct. As all of substack's
  // API requests are redirected, it thinks there's only 1 comment. If we just
  // change the content of the element, then substack overwrites our changes, so
  // we clone the element and hide the original.
  function makeSubstackProofClone(element) {
    const cloned = element.cloneNode(true);
    element.style.display = 'none';
    element.after(cloned);
  }

  for (const commentButton of document.querySelectorAll(`
      .post-header .post-ufi-comment-button,
      .post-footer .post-ufi-comment-button`)) {
    makeSubstackProofClone(commentButton);
  }

  // Exfiltrate the _preloads.post.id global variable from the real page, using
  // a custom script append to the document body after the DOM is complete. This
  // is necessary because in the ISOLATED world we don't have direct access to
  // the main page's global variables.
  const {postId, userId, commentSort} = await new Promise((resolve) => {
    document.addEventListener('ACXI-load-comments', (ev) => resolve(ev.detail));

    const scriptElem = document.createElement('script');
    scriptElem.src = chrome.runtime.getURL('main-script.js');
    document.body.appendChild(scriptElem);
  });

  if (!postId) {
    console.warn(LOG_TAG, "postId not defined! Can't continue.");
    return;
  }

  if (!userId) {
    console.info(LOG_TAG, 'userId not defined! Commenting will be disabled.');
  }

  if (commentSort !== 'oldest_first' && commentSort !== 'most_recent_first') {
    console.info(LOG_TAG, 'Invalid value for commentSort! Will default to oldest_first.');
    commentSort = 'oldest_first';
  }
  const commentOrder = commentSort === 'most_recent_first' ?
    CommentOrder.NEW_FIRST : CommentOrder.CHRONOLOGICAL;

  const commentsPage = document.querySelector('.comments-page');
  if (!commentsPage) {
    console.warn(LOG_TAG, "Element comments-page not found! Can't continue.");
    return;
  } else {
    console.info(LOG_TAG, 'Hiding comments-page element.');
    commentsPage.style.display = 'none';
  }

  const rootDiv = document.createElement('div');
  rootDiv.innerHTML = `<p>Astral Codex Eleven extension loading comments...</p>`;
  // The 'container' causes Substack to limit the width of the div.
  rootDiv.className = 'ext-comments container';
  commentsPage.parentElement.insertBefore(rootDiv, commentsPage);

  let comments = undefined;
  try {
    console.info(LOG_TAG, 'Fetching comments...');
    const start = performance && performance.now();
    // Note that I use ?no-filter& to bypass the filter rule that redirects
    // requests from the real page!
    comments = await fetchComments(
        `/api/v1/post/${postId}/comments/?no-filter&all_comments=true&sort=${commentSort}`);
    const duration = performance && Math.round(performance.now() - start);
    console.info(LOG_TAG, `fetch() completed in ${duration} ms.`)
  } catch (e) {
    console.warn(LOG_TAG, 'Failed to fetch comments!', e);
    return;
  }
  if (!Array.isArray(comments)) {
    console.warn(LOG_TAG, "comments is not an Array! Can't continue.");
    return;
  }
  console.info(LOG_TAG, `${comments.length} top-level comments found.`);

  const commentApi = new SubstackCommentApi(postId);

  // Wait for options to finish loading.
  await loadOptionsResult;

  {
    const start = performance && performance.now();
    replaceComments(rootDiv, comments, {userId, commentApi, commentOrder});
    const duration = performance && Math.round(performance.now() - start);
    console.info(LOG_TAG, `DOM updated in ${duration} ms.`);
  }

  runOptionsOnLoad();
})();
