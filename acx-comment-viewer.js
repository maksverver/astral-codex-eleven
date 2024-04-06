'use strict';

console.info('[ACX Comment Viewer extension]', 'Waiting on load...')
window.addEventListener('load', async () => {
  const LOG_TAG = '[ACX Comment Viewer extension]';
  console.info(LOG_TAG, 'Loaded!');

  const preloads = window._preloads;
  if (!preloads) {
    console.warn(LOG_TAG, "window._preloads not defined! Can't continue.");
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
    // Note that I use ?no-filter& to bypass the filter rule that redirects
    // requests from the real page!
    comments = await fetchComments(
        `/api/v1/post/${postId}/comments/?no-filter&all_comments=true&sort=oldest_first`);
    if (!comments?.length) console.warn(LOG_TAG, 'No comments found!');
  } catch (e) {
    console.warn(LOG_TAG, 'Failed to fetch comments!', e);
    return;
  }
  if (comments?.length) replaceComments(rootDiv, comments);
});
