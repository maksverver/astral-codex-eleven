'use strict';

(async function(){
  const LOG_TAG = '[ACX Comment Viewer extension]';
  console.info(LOG_TAG, 'Starting.');

  // Exfiltrate the _preloads global variable from the real page, using a custom
  // script append to the document body after the DOM is complete. This is
  // necessary because in the ISOLATED world we don't have direct access to the
  // page's global variables.
  const preloads = await new Promise((resolve) => {
    document.addEventListener('acx-page-load', (ev) => resolve(ev.detail._preloads));

    const scriptElem = document.createElement('script');
    scriptElem.textContent = "document.dispatchEvent(new CustomEvent('acx-page-load', {detail: {_preloads}}));";
    document.body.appendChild(scriptElem);
  });

  if (!preloads) {
    console.warn(LOG_TAG, "preloads not defined! Can't continue.");
    return;
  }

  const postId = preloads.post?.id;
  if (!postId) {
    console.warn(LOG_TAG, "post.id is not defined! Can't continue.");
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
    // Note that I use ?no-filter& to bypass the filter rule that redirects
    // requests from the real page!
    comments = await fetchComments(
        `/api/v1/post/${postId}/comments/?no-filter&all_comments=true&sort=oldest_first`);
    if (!comments?.length) console.warn(LOG_TAG, 'No comments found!');
  } catch (e) {
    console.warn(LOG_TAG, 'Failed to fetch comments!', e);
    return;
  }
  if (comments?.length) {
    console.info(LOG_TAG, `${comments.length} top-level comments found.`);
    replaceComments(rootDiv, comments);
  } else {
    console.info(LOG_TAG, 'No comments found!');
  }
})();
