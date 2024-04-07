'use strict';

function countCommentsInObject(comment) {
  return 1 + countCommentsInArray(comment.children);
}

function countCommentsInArray(comments) {
  let n = 0;
  for (const comment of comments) n += countCommentsInObject(comment);
  return n;
}

class ExtCommentComponent {
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

    // Date formatting options, as accepted by Intl.DateTimeFormat().
    // Can also be set to null to use the default formatting.
    dateFormat: Object.freeze({month: 'short', day: 'numeric'}),
});

function replaceComments(rootElem, comments, options=REPLACE_COMMENTS_DEFAULT_OPTIONS) {
  const {collapseDepth, dateFormat} = options;

  function createElement(parent, tag, className) {
    const elem = document.createElement(tag);
    parent.appendChild(elem);
    if (className) elem.className = className;
    return elem;
  }

  function createTextNode(parent, text) {
    const node = document.createTextNode(text);
    parent.appendChild(node);
    return node;
  }

  // Creates DOM nodes for the given comment text, and appends them to the
  // given parent element. This tries to mirror how Substack seems to process
  // comments:
  //
  //  - Splits text into paragraphs based on newline sequences.
  //  - Turns http/https URLs into clickable links.
  //  - Turn email addresses into clickable mailto: links.
  //
  function appendComment(parentElem, text) {
    function createLink(parent, text, href) {
      const a = createElement(parent, 'a', 'linkified');
      a.href = href;
      a.target = '_blank';
      a.rel = 'nofollow ugc noopener'
      createTextNode(a, text);
      return a;
    }

    for (const paragraph of text.split(/\n+/)) {
      if (!paragraph) continue;
      const p = createElement(parentElem, 'p');
      paragraph.split(/(https?:\/\/[^\s]+)/i).forEach((part, i) => {
        if (i%2 == 0) {
          part.split(/([^\s]+@[^\s]+.\w+)/).forEach((part, i) => {
            if (i%2 == 0) {
              createTextNode(p, part);
            } else {
              createLink(p, part, 'mailto:' + part);
            }
          });
        } else {
          createLink(p, part, part);
        }
      });
    }
  }

  // Constructs a Substack profile link from a user id and name.
  //
  // I don't know the exact algorithm, but based on observation, I determined
  // that the username is transformed into a suffix as follows:
  //
  //  - characters other than ASCII letters, digits, underscores, and hyphens
  //    are deleted (notably, letters in foreign scripts are stripped, as are
  //    periods, which are technically URL-safe).
  //  - spaces are converted to hyphens, except leading/trailing spaces, which
  //    are trimmed.
  //  - letters are converted to lower case
  //
  // For example:
  //
  // "TimW"            -> https://substack.com/profile/1234567-timw
  // "A.M. Charlebois" -> https://substack.com/profile/1234567-am-charlebois
  // "Анна Musk"       -> https://substack.com/profile/1234567-musk
  //
  // There are some details I don't know:
  //
  //  - are consecutive spaces mapped to a single hyphen, or multiple?
  //  - if the suffix is empty, is the trailing hyphen omitted?
  //
  // Nevertheless, the algorithm implemented here seems to work for most users.
  function makeProfileUrl(id, name) {
    if (!Number.isInteger(id)) return undefined;
    if (typeof(name) !== 'string') return undefined;
    const suffix = name.replaceAll(/[^0-9a-zA-Z _-]/g, '')
        .trim().replaceAll(/ +/g, '-').toLowerCase();
    return `https://substack.com/profile/${id}-${suffix}`;
  }

  function createCommentDiv(parentElem, comment, depth) {
    const commentDiv = createElement(parentElem, 'div', 'comment');
    const borderDiv = createElement(commentDiv, 'div', 'border');
    createElement(borderDiv, 'div', 'line');
    const contentDiv = createElement(commentDiv, 'div', 'content');
    const commentHeader = createElement(contentDiv, 'header', 'comment-meta');
    const authorSpan = createElement(commentHeader, 'span', 'commenter-name');
    const profileUrl = makeProfileUrl(comment.user_id, comment.name);
    if (profileUrl) {
      const authorLink = createElement(authorSpan, 'a');
      authorLink.href = profileUrl;
      createTextNode(authorLink, comment.name);
    } else if (typeof comment.name === 'string') {
      // Not sure if this can happen: name is present but id is missing.
      createTextNode(authorSpan, comment.name);
    } else {
      createTextNode(authorSpan, comment.deleted ? 'deleted' : 'unavailable');
      authorSpan.classList.add('missing');
    }
    const postDateLink = createElement(commentHeader, 'a', 'comment-timestamp');
    postDateLink.href = `${document.location.pathname}/comment/${comment.id}`;
    postDateLink.rel = 'nofollow';
    createTextNode(postDateLink, new Date(comment.date).toLocaleString('en-US', dateFormat));
    postDateLink.title = comment.date;

    if (typeof comment.edited_at === 'string') {
      const seperator = createElement(commentHeader, 'span', 'comment-publication-name-separator');
      createTextNode(seperator, '·');
      const editedIndicator = createElement(commentHeader, 'span', 'edited-indicator');
      createTextNode(editedIndicator,
          'edited ' + new Date(comment.edited_at).toLocaleString('en-US', dateFormat));
      editedIndicator.title = comment.edited_at;
    }

    const commentMain = createElement(contentDiv, 'div', 'main');
    // Substack assigns special rendering to <p> and class="comment-body"
    const commentBody = createElement(commentMain, 'div', 'text comment-body');
    if (comment.body == null) {
      createTextNode(commentBody, comment.deleted ? "deleted" : "unavailable");
      commentBody.classList.add('missing');
    } else {
      appendComment(commentBody, comment.body);
    }
    const commentComponent = new ExtCommentComponent(commentDiv);
    commentComponent.setExpanded(
        depth === 0 || !collapseDepth || depth % collapseDepth !== 0);
    borderDiv.onclick = commentComponent.toggleExpanded.bind(commentComponent);

    for (const childComment of comment.children) {
      createCommentDiv(commentMain, childComment, depth + 1);
    }
  }

  rootElem.replaceChildren();

  createTextNode(
    createElement(rootElem, 'div', 'comments-heading'),
    `${countCommentsInArray(comments)} Comments`);

  for (const comment of comments) {
    createCommentDiv(rootElem, comment, 0);
  }
}
