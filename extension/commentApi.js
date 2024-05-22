// Skeleton for the implementation of the comments API. Will be replaced in the
// extension with a real instance, and in the demo page with a fake instance for
// local testing. This object exists to show the expected interface.
const COMMENT_API_UNIMPLEMENTED = Object.freeze({
  // Create a new comment with the given body text.
  //
  // parentId is the numeric id of the comment to reply to, or undefined to
  // create a top-level comment.
  //
  // Returns a new comment object, or throws an error on failure.
  async createComment(parentId, body) {
    throw new Error('createComment() not implemented');
  },

  // Edits an existing comment with the given body text.
  //
  // Returns an updated comment object, or throws an error on failure.
  async editComment(id, body) {
    throw new Error('editComment() not implemented');
  },

  // Deletes an existing comment.
  //
  // Returns an empty object, or throws an error on failure.
  async deleteComment(id) {
    throw new Error('deleteComment() not implemented');
  },
});

// This class implements the real, live Substack comment API.
class SubstackCommentApi {
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
