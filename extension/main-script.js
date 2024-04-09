// This script is injected in the main page, where it has access to the global
// variables, while the main part of the extension runs in an “isolated world”.

(function() {
  const LOG_TAG = '[Astral Codex Eleven]';

  // Find the current post id in the _preloads variable. This is needed to fetch
  // comments via the v1 API. (typeof is necessary because the _preloads variable
  // might not exist, which is different from having the value undefined!)
  const postId = typeof _preloads !== 'undefined' && _preloads?.post?.id;
  if (!postId) {
    // This is expected on the homepage or any page that's not a post page.
    console.info(LOG_TAG, "Post id not defined.");
  } else {
    console.info(LOG_TAG, 'Broadcasting post id', postId);
    document.dispatchEvent(new CustomEvent('acx-page-load', {detail: {postId}}));
  }
})();
