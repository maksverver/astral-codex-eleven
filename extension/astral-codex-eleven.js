'use strict';

(async function(){
  const LOG_TAG = '[Astral Codex Eleven]';
  console.info(LOG_TAG, 'Starting extension.');

  // Exfiltrate the _preloads.post.id global variable from the real page, using
  // a custom script append to the document body after the DOM is complete. This
  // is necessary because in the ISOLATED world we don't have direct access to
  // the main page's global variables.
  const {postId} = await new Promise((resolve) => {
    document.addEventListener('acx-page-load', (ev) => resolve(ev.detail));

    const scriptElem = document.createElement('script');
    scriptElem.src = chrome.runtime.getURL('main-script.js');
    document.body.appendChild(scriptElem);
  });

  if (!postId) {
    console.warn(LOG_TAG, "postId not defined! Can't continue.");
    return;
  }

  const commentsPage = document.querySelector('.comments-page');
  if (!commentsPage) {
    console.warn(LOG_TAG, "Element comments-page not found! Can't continue.");
    return;
  } else {
    console.info(LOG_TAG, 'Hiding comments-page element.');
    commentsPage.style.display = 'none';
  }

  const rootDiv = document.createElement('div');
  rootDiv.innerHTML = `<p>Loading comments...</p>`;
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
        `/api/v1/post/${postId}/comments/?no-filter&all_comments=true&sort=oldest_first`);
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

  {
    console.info(LOG_TAG, `${comments.length} top-level comments found.`);
    const start = performance && performance.now();
    replaceComments(rootDiv, comments);
    const duration = performance && Math.round(performance.now() - start);
    console.info(LOG_TAG, `DOM updated in ${duration} ms.`)
  }
})();
