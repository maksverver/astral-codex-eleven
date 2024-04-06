class CommentComponent {
  constructor(commentDiv) {
    this.commentDiv = commentDiv;
    this.expanded = undefined;
  }

  setExpanded(expanded) {
    expanded = Boolean(expanded);
    this.expanded = expanded;
    this.commentDiv.classList.toggle('collapsed', !expanded);
    this.commentDiv.classList.toggle('expanded', expanded);
  }

  toggleExpanded() {
    this.setExpanded(!this.expanded);
  }
}

async function fetchComments(jsonPath) {
  const fetchResponse = await fetch(jsonPath);
  const responseJson = await fetchResponse.json();
  return responseJson?.comments;
}

const REPLACE_COMMENTS_DEFAULT_OPTIONS = Object.freeze({
    // If greater than 0, comments at the given depth are collapsed (recursively).
    // Recommend values are 0 or 3.
    collapseDepth: 0,
});

function replaceComments(rootElem, comments, options=REPLACE_COMMENTS_DEFAULT_OPTIONS) {
  const {collapseDepth} = options;

  function createElement(parent, tag, className) {
    const elem = document.createElement(tag);
    parent.appendChild(elem);
    if (className) elem.className = className;
    return elem;
  }

  function createCommentDiv(parentElem, comment, depth) {
    const commentDiv = createElement(parentElem, 'div', 'comment');
    const borderDiv = createElement(commentDiv, 'div', 'border');
    createElement(borderDiv, 'div', 'line');
    const contentDiv = createElement(commentDiv, 'div', 'content');
    const commentHeader = createElement(contentDiv, 'header', 'comment-meta');
    const authorSpan = createElement(commentHeader, 'span', 'commenter-name');
    authorSpan.appendChild(document.createTextNode(
        comment.name ?? (comment.deleted ? "<deleted>" : "<unavailable>")));
    const postDateLink = createElement(commentHeader, 'a', 'comment-timestamp');
    postDateLink.href = `${document.URL}/comment/${comment.id}`;
    postDateLink.rel = 'nofollow';
    postDateLink.target = '_blank';

    postDateLink.appendChild(document.createTextNode(new Date(comment.date).toLocaleString()));
    postDateLink.title = comment.date;

    const commentMain = createElement(contentDiv, 'div', 'main');
    // Substack assigns special rendering to <p> and class="comment-body"
    const commentBody = createElement(commentMain, 'p', 'text comment-body');
    commentBody.appendChild(document.createTextNode(
      comment.body ?? (comment.deleted ? "<deleted>" : "<unavailable>")));

    const commentComponent = new CommentComponent(commentDiv);
    commentComponent.setExpanded(
        depth === 0 || !options.collapseDepth || depth % options.collapseDepth !== 0);
    borderDiv.onclick = commentComponent.toggleExpanded.bind(commentComponent);

    for (const childComment of comment.children) {
      createCommentDiv(commentMain, childComment, depth + 1);
    }
  }

  rootElem.replaceChildren();
  for (const comment of comments) {
    createCommentDiv(rootElem, comment, 0);
  }
}
