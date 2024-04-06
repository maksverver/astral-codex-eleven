'use strict';

(async function(){
  const LOG_PREFIX = '[ACX Comment Viewer extension]';

  console.info(LOG_PREFIX, 'Starting.');

  const preloads = window._preloads;
  if (!preloads) {
    console.warn(LOG_PREFIX, "window._preloads not defined! Can't continue.");
    return;
  }

  const postId = preloads.post?.id;
  if (!postId) {
    console.warn(LOG_PREFIX, "post.id is not defined! Can't continue.");
    return;
  }

  const commentsPage = document.querySelector('.comments-page');
  if (!commentsPage) {
    console.warn(LOG_PREFIX, "Element comments-page not found! Can't continue.");
    return;
  } else {
    console.info(LOG_PREFIX, 'Hiding comments-page element.');
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
    if (!comments?.length) console.warn(LOG_PREFIX, 'No comments found!');
  } catch (e) {
    console.warn(LOG_PREFIX, 'Failed to fetch comments!', e);
    return;
  }
  if (comments?.length) replaceComments(rootDiv, comments);
})();

