'use strict';

// This class implements the real, live Substack comment API.
class CommentApi {
  constructor(postId) {
    this.postId = postId;
  }

  async executeRpc(method, path, request) {
    if (typeof request !== 'object') throw new Error('request is not an object');
    const fetchResult = await fetch(path, {method, headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'},
      body: JSON.stringify(request)});
    if (!fetchResult.ok) {
      throw new Error(`fetch ${path} failed with status code ${fetchResult.status}`);
    }
    const response = await fetchResult.json();
    if (typeof response !== 'object') throw new Error('response is not an object');
    return response;
  }

  async createComment(parentId, body) {
    if (typeof body !== 'string') throw new Error('body must be a string');
    const request = {body};
    if (parentId) {
      if (!Number.isInteger(parentId)) throw new Error('parentId must be an integer');
      request.parent_id = parentId;
    }
    return await this.executeRpc('POST', `/api/v1/post/${this.postId}/comment`, request);
  }

  async editComment(id, body) {
    if (!Number.isInteger(id)) throw new Error('id must be an integer');
    if (typeof body !== 'string') throw new Error('body must be a string');
    const response = await this.executeRpc('PATCH', `/api/v1/comment/${id}`, {body});
    if (typeof response.edited !== 'object') throw new Error('response.edited is not an object');
    return response.edited;
  }

  async deleteComment(id) {
    if (!Number.isInteger(id)) throw new Error('id must be an integer');
    return await this.executeRpc('DELETE', `/api/v1/comment/${id}`, {});
  }
}

(async function() {
  Logging.info('Starting extension.');

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
    Logging.warn("postId not defined! Can't continue.");
    return;
  }

  if (!userId) {
    Logging.info('userId not defined! Commenting will be disabled.');
  }

  if (commentSort !== 'oldest_first' && commentSort !== 'most_recent_first') {
    Logging.info('Invalid value for commentSort! Will default to oldest_first.');
    commentSort = 'oldest_first';
  }
  const commentOrder = commentSort === 'most_recent_first' ?
    CommentOrder.NEW_FIRST : CommentOrder.CHRONOLOGICAL;

  const commentsPage = document.querySelector('.comments-page');
  if (!commentsPage) {
    Logging.warn("Element comments-page not found! Can't continue.");
    return;
  } else {
    Logging.info('Hiding comments-page element.');
    commentsPage.style.display = 'none';
  }

  const rootDiv = document.createElement('div');
  rootDiv.innerHTML = `<p>Astral Codex Eleven extension loading comments...</p>`;
  // The 'container' causes Substack to limit the width of the div.
  rootDiv.className = 'ext-comments container';
  commentsPage.parentElement.insertBefore(rootDiv, commentsPage);

  const perfTimer = new Timer();
  let comments = undefined;
  try {
    Logging.info('Fetching comments...');
    perfTimer.restart();
    // Note that I use ?no-filter& to bypass the filter rule that redirects
    // requests from the real page!
    comments = await fetchComments(
        `/api/v1/post/${postId}/comments/?no-filter&all_comments=true&sort=${commentSort}`);
    Logging.info(`fetch() completed in ${perfTimer.totalTime()} ms.`)
  } catch (e) {
    Logging.warn('Failed to fetch comments!', e);
    return;
  }
  if (!Array.isArray(comments)) {
    Logging.warn("comments is not an Array! Can't continue.");
    return;
  }
  Logging.info(`${comments.length} top-level comments found.`);

  const commentApi = new CommentApi(postId);

  // Wait for options to finish loading.
  await loadOptionsResult;

  {
    perfTimer.restart();
    replaceComments(rootDiv, comments,
        {...REPLACE_COMMENTS_DEFAULT_OPTIONS, userId, commentApi, commentOrder});
    Logging.info(`DOM updated in ${perfTimer.totalTime()} ms.`);
  }

  runOptionsOnLoad();
})();
