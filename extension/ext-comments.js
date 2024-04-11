'use strict';

// Below is a beautiful regex to match URLs that may occur in text. It's tricky
// because we want to allow characters that occur in URLs that are technically
// reserved, while excluding characters that are likely intended as punctuation.
// For example:
//
//   - "(http://example.com/)" should match "http://example.com/" without the
//      surrounding parentheses.
//
//   - "http://example.com/(bla)" should match "http://example.com/(bla)" with
//      the parentheses included in the URL.
//
//   - "Read http://the-manual.com!" should match "http://the-manual.com"
//      without the exclamation mark.
//
// and so on. This is achieved by dividing the ASCII characters into the ones
// that are most likely part of the URL:
//
//    #$%&'*+-/<=>@&_|~ (as well as letters and digits)
//
// And those that are likely part of the punctuation, not the URL:
//
//    "!()*,.:;?`  (as well as non-ASCII Unicode characters like — or “”)
//
// And those that are part of the URL only if they are occur in pairs:
//
//    () {} []
//
// (so that "http://example.com/foo+(bar)?a[1]=2" is parsed as a single URL).
//
// Additionally, we want to support backslash escapes, so that
// "http://example.com/a\ b\)c" matches as a single URL. Only non-alphanumeric
// characters can be escaped, so that we can unescape simply by dropping the
// slashes (\\ -> \, \; -> ;, etc.), without having to deal with complex
// sequences like \n, \0, \040, \x10 etc.
//
// Putting it together, the URL regex first matches http:// or https:// (other
// protocols are intentionally not supported) and the rest of the string can be
// divided into parts that are either:
//
//  - A two-character escape sequence (\ followed by a non-alphanumeric char).
//  - A sequence of non-space characters that ends with a character that is
//    likely part of the URL (#, _, etc.)
//  - A balanced bracket sequence like "(bla)" or "[bla]" or "{bla}". Within,
//    these sequences, escapes are allowed (e.g. "(bla\)bla)" or "[\ ]").
//    Nested bracket sequences are not parsed; that's impossible. So "[[]]"
//    matches only the first three characters; to match all four you must write
//    "[[\]]" (note that escaping characters unnecessarily is always allowed, so
//    the same sequence can be safely written as "\[\[\]\]").
//
const URL_REGEX = /(https?:\/\/(?:\\[^A-Z0-9]|[^\s(){}\[\]]*[A-Z0-9#$%&'+\-\/<=>@&_|~]|\((?:\\[^A-Z0-9]|[^\s)])*\)|\[(?:\\[^A-Z0-9]|[^\s\]])*\]|{(?:\\[^A-Z0-9]|[^\s}])*})+)/i;

function splitByUrl(s) {
  return s.split(URL_REGEX);
}

function unescapeUrl(s) {
  return s.replace(/\\([^A-Z0-9])/ig, '$1');
}

// The email regex is much simpler, since I assume it always ends with a TLD
// that consists of alphanumeric characters or hyphens. This is not perfect, but
// I'm not going to support esoteric features like embedded comments, IP-based
// hosts, quoted usernames, non-Latin usernames, and so on.
const EMAIL_REGEX = /([A-Z0-9!#$%&'*+\-/=?^_`{|}~.]+@[^\s]+\.[A-Z0-9\-]*[A-Z]+)/i;

function splitByEmail(s) {
  return s.split(EMAIL_REGEX);
}

function countCommentsInObject(comment) {
  return 1 + countCommentsInArray(comment.children);
}

function countCommentsInArray(comments) {
  let n = 0;
  for (const comment of comments) n += countCommentsInObject(comment);
  return n;
}

class ExtCommentComponent {
  constructor(commentDiv, parent, collapseDepth) {
    const depth = parent ? parent.depth + 1 : 0;
    const expanded = depth === 0 || !collapseDepth || depth % collapseDepth !== 0;
    this.commentDiv  = commentDiv;
    this.depth       = depth;
    this.parent      = parent;
    this.children    = undefined;
    this.prevSibling = undefined;
    this.nextSibling = undefined;
    this.expanded    = expanded;
    commentDiv.tabIndex = 0;
    commentDiv.onkeydown = this.handleKeyDown.bind(this);
    commentDiv.classList.add(expanded ? 'expanded' : 'collapsed');
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

  focus() {
    this.commentDiv.focus();
    // Make sure the top of the comment is visible after it is focused:
    if (this.commentDiv.getBoundingClientRect().top < 0) {
      this.commentDiv.scrollIntoView();
    }
  }

  findNext() {
    if (this.expanded && this.children.length > 0) {
      // If this node has children, then the next node is its first child.
      return this.children[0];
    } else {
      // If this node does not have children, then the next node is its next
      // sibling, or the next sibling of the nearest ancestor that has one.
      let node = this;
      while (node && !node.nextSibling) node = node.parent;
      return node && node.nextSibling;
    }
  }

  findPrevious() {
    if (!this.prevSibling) {
      // If this node is its parent's first child, then the previous node is the parent.
      return this.parent;
    } else {
      // If this node is not its parent's first child, then the previous node is
      // the last descendant of its previous sibling:
      let node = this.prevSibling;
      while (node.expanded && node.children.length > 0) {
        node = node.children[node.children.length - 1];
      }
      return node;
    }
  }

  handleKeyDown(ev) {
    // Don't handle key events when one of these modifiers is held:
    if (ev.altKey || ev.ctrlKey || ev.isComposing || ev.metaKey) return;
    switch (ev.key) {
      case 'Enter':
        this.toggleExpanded();
        break;

      case 'H':  // Move to top-level comment
        let root = this;
        while (root.parent) root = root.parent;
        root.focus();
        break;

      case 'J': // Move to next sibling
        if (this.nextSibling) this.nextSibling.focus();
        break;

      case 'K': // Move to previous sibling
        if (this.prevSibling) this.prevSibling.focus();
        break;

      case 'h':  // Move to parent
        if (this.parent) this.parent.focus();
        break;

      case 'j': // Move to next comment
        const next = this.findNext();
        if (next) next.focus();
        break;

      case 'k':  // Move to previous comment
        const prev = this.findPrevious();
        if (prev) prev.focus();
        break;

      default:
        // Unrecognized key; return without stopping propagation.
        return;
    }
    ev.stopPropagation();
    ev.preventDefault();
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
    dateFormatShort: new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric'}),
    dateFormatLong: new Intl.DateTimeFormat('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZoneName: 'short'}),
});

class RadioButtonsComponent {
  constructor(parentElem, labels, onChange) {
    const div = document.createElement('div');
    div.className = 'radio-buttons';
    this.buttons = labels.map((label, index) => {
      const button = document.createElement('button');
      button.className = 'inactive';
      button.appendChild(document.createTextNode(label));
      button.onclick = this.change.bind(this, index);
      div.appendChild(button);
      return button;
    });
    parentElem.appendChild(div);
    this.elem = div;
    this.onChange = onChange;
    this.activeIndex = -1;
  }

  // Changes the active button index without invoking the onChange callback.
  activate(index) {
    const oldButton = this.buttons[this.activeIndex];
    const newButton = this.buttons[index];
    if (oldButton) {
      oldButton.classList.remove('active');
      oldButton.classList.add('inactive');
    }
    if (newButton) {
      newButton.classList.remove('inactive');
      newButton.classList.add('active');
    }
    this.activeIndex = index;
  }

  // Changes the active button index and invokes the onChange callback if
  // the new index is different from the old index.
  change(index) {
    if (this.activeIndex === index) return;
    this.activate(index);
    if (typeof this.onChange === 'function') this.onChange(index);
  }
}

function replaceComments(rootElem, comments, options=REPLACE_COMMENTS_DEFAULT_OPTIONS) {
  const {collapseDepth, dateFormatShort, dateFormatLong} = options;

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
      splitByUrl(paragraph).forEach((part, i) => {
        if (i%2 === 0) {
          splitByEmail(part).forEach((part, i) => {
            if (i%2 === 0) {
              if (part) createTextNode(p, part);
            } else {
              createLink(p, part, 'mailto:' + encodeURIComponent(part));
            }
          });
        } else {
          createLink(p, part, unescapeUrl(part));
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

  function createDate(parentElem, dateString) {
    parentElem.classList.add('date');
    parentElem.tabIndex = 0;
    const date = new Date(dateString);
    createTextNode(
      createElement(parentElem, 'span', 'short'),
      dateFormatShort.format(date));
    createTextNode(
      createElement(parentElem, 'span', 'long'),
      dateFormatLong.format(date));
  }

  function createComment(parentElem, comment, parentComponent) {
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
    createDate(postDateLink, comment.date);

    if (typeof comment.edited_at === 'string') {
      const seperator = createElement(commentHeader, 'span', 'comment-publication-name-separator');
      createTextNode(seperator, '·');
      const editedIndicator = createElement(commentHeader, 'span', 'edited-indicator');
      createTextNode(editedIndicator, 'edited ');
      createDate(editedIndicator, comment.edited_at);
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

    const commentComponent = new ExtCommentComponent(commentDiv, parentComponent, collapseDepth);

    // Collapse/expand comment by clicking on the left border line.
    borderDiv.onclick = () => commentComponent.toggleExpanded();

    commentComponent.children = createCommentsList(commentMain, comment.children, commentComponent);
    return commentComponent;
  }

  function createCommentsList(parentElem, comments, parentComponent) {
    // Substack uses class names "comments" and "comments-list" and applies
    // extra styling that I don't want, so I use "comments-holder" instead.
    const div = createElement(parentElem, 'div', 'comments-holder');
    const commentComponents = comments.map((comment) => createComment(div, comment, parentComponent));
    for (let i = 0; i + 1 < commentComponents.length; ++i) {
      commentComponents[i].nextSibling = commentComponents[i + 1];
      commentComponents[i + 1].prevSibling = commentComponents[i];
    }
    return commentComponents;
  }

  // Clear out the original root.
  rootElem.replaceChildren();

  // Add the comment header which contains the total comment count, and
  // the comment order radio buttons.
  {
    const holderDiv = createElement(rootElem, 'div', 'comments-heading-holder');

    const commentsHeading = createElement(holderDiv, 'div', 'comments-heading');
    createTextNode(commentsHeading, `${countCommentsInArray(comments)} Comments`);

    const orderDiv = createElement(holderDiv, 'div');
    createTextNode(orderDiv, 'Order: ');
    new RadioButtonsComponent(orderDiv, ['Chronological', 'New First'], (i) => {
      rootElem.classList.toggle('order-chronological', i === 0);
      rootElem.classList.toggle('order-new-first',     i === 1);
    }).change(0);
  }

  // Add the top-level comments list.
  createCommentsList(rootElem, comments, 0);
}
