// This script is injected in the main page, where it has access to the global
// variables, while the main part of the extension runs in an “isolated world”.

(function() {
  const LOG_TAG = '[Astral Codex Eleven]';

  // Find the current post id in the _preloads variable. This is needed to fetch
  // comments via the v1 API. (typeof is necessary because the _preloads variable
  // might not exist, which is different from having the value undefined!)
  if (typeof _preloads === 'object') {
    const postId = _preloads.post?.id;
    if (!postId) {
      // This is expected on the homepage or any page that's not a post page.
      console.info(LOG_TAG, "Post id not defined.");
    } else {
      const userId = _preloads.user?.id;
      const commentSort =
          _preloads.post?.default_comment_sort ||
          _preloads.pub?.default_comment_sort ||
          'oldest_first';
      const detail = {postId, userId, commentSort};
      console.info(LOG_TAG, `Broadcasting`, detail);
      document.dispatchEvent(new CustomEvent('ACXI-load-comments', {detail}));
    }
  }

  // Hack to force a proper page load whenever the URL changes, which is
  // necessary to trigger the extension script properly. This is easier than
  // rerunning the extension script, because:
  //
  //  1. when this happens, the post page might not have been loaded yet
  //  2. it's difficult to figure out the post id of the loaded page
  //
  // I did not intercept replaceState(), which is not used to redirect to posts.
  const originalPushState = window.history.pushState;
  window.history.pushState = (state, unused, url) => {
    if (!url) {
      originalPushState(state, unused, url);
    } else {
      // URL changed! Force a real page load, to trigger the extension script.
      document.location.href = url;
    }
  }
})();
