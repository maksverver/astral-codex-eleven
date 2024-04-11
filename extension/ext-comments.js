'use strict';

async function fetchComments(jsonPath) {
  const fetchResponse = await fetch(jsonPath);
  const responseJson = await fetchResponse.json();
  return responseJson?.comments;
}

function countCommentsInObject(comment) {
  return 1 + countCommentsInArray(comment.children);
}

function countCommentsInArray(comments) {
  let n = 0;
  for (const comment of comments) n += countCommentsInObject(comment);
  return n;
}

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

class ExtCommentListComponent {
  constructor(parentElem, commentObjects, parentCommentComponent, options) {
    // Substack uses class names "comments" and "comments-list" and applies
    // extra styling that I don't want, so I use "comments-holder" instead.
    const div = createElement(parentElem, 'div', 'comments-holder');
    const childComponents = commentObjects.map(
        (comment) => new ExtCommentComponent(div, comment, parentCommentComponent, options));
    for (let i = 0; i + 1 < childComponents.length; ++i) {
      childComponents[i].nextSibling = childComponents[i + 1];
      childComponents[i + 1].prevSibling = childComponents[i];
    }
    this.children = childComponents;
  }
}

class ExtCommentComponent {
  // Constructs the DOM elements to represent a single comment thread.
  //
  //  - parentElem is the DOM element that is the parent of this comment.
  //  - comment is an object describing the comment, from the JSON object
  //    returned by the comments API. It contains fields like:
  //    user_id, name, date, edited_at, deleted, body, children.
  //  - parentCommentComponent is the ExtCommentComponent corresponding to this
  //    comments parent, or undefined if this is a toplevel comment.
  //  - options is the object passed to replaceComments().
  //
  constructor(parentElem, comment, parentCommentComponent, options) {
    const {collapseDepth, dateFormatShort, dateFormatLong} = options;

    // Creates DOM nodes for the given comment text, and appends them to the
    // given parent element. This tries to mirror how Substack seems to process
    // comments:
    //
    //  - Splits text into paragraphs based on newline sequences.
    //  - Turns http/https URLs into clickable links.
    //  - Turn email addresses into clickable mailto: links.
    //
    function appendCommentText(parentElem, text) {
      function createLink(parentElem, text, href) {
        const a = createElement(parentElem, 'a', 'linkified');
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

    const depth = parentCommentComponent ? parentCommentComponent.depth + 1 : 0;
    const expanded = depth === 0 || !collapseDepth || depth % collapseDepth !== 0;

    const threadDiv = createElement(parentElem, 'div', 'comment-thread');
    threadDiv.classList.add(expanded ? 'expanded' : 'collapsed');

    const borderDiv = createElement(threadDiv, 'div', 'border');
    createElement(borderDiv, 'div', 'line');
    // Collapse/expand comment by clicking on the left border line.
    borderDiv.onclick = this.toggleExpanded.bind(this);

    const contentDiv = createElement(threadDiv, 'div', 'content');
    const commentDiv = createElement(contentDiv, 'div', 'comment');;
    commentDiv.tabIndex = 0;
    commentDiv.onkeydown = this.handleKeyDown.bind(this);
    const commentHeader = createElement(commentDiv, 'header', 'comment-meta');
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

    // Substack assigns special rendering to class="comment-body"
    const commentBody = createElement(commentDiv, 'div', 'comment-body');
    if (comment.body == null) {
      createTextNode(commentBody, comment.deleted ? "deleted" : "unavailable");
      commentBody.classList.add('missing');
    } else {
      appendCommentText(commentBody, comment.body);
    }

    this.threadDiv   = threadDiv;
    this.commentDiv  = commentDiv;
    this.depth       = depth;
    this.parent      = parentCommentComponent;
    this.expanded    = expanded;
    this.prevSibling = undefined;
    this.nextSibling = undefined;
    this.childList   = !comment.children?.length ? undefined :
        new ExtCommentListComponent(contentDiv, comment.children, this, options);
  }

  setExpanded(expanded) {
    expanded = Boolean(expanded);
    this.expanded = expanded;
    this.threadDiv.classList.toggle('collapsed', !expanded);
    this.threadDiv.classList.toggle('expanded', expanded);
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

  get firstVisibleChild() {
    return this.childList && this.expanded ?
        this.childList.children[0] : undefined;
  }

  get lastVisibleChild() {
    return this.childList && this.expanded ?
        this.childList.children[this.childList.children.length - 1] : undefined;
  }

  findNext() {
    // If this node has visible children, then the next node is its first child.
    const child = this.firstVisibleChild;
    if (child) return child;
    // Otherwise, the next node is its next sibling, or the next sibling of the
    // nearest ancestor that has one.
    let node = this;
    while (node && !node.nextSibling) node = node.parent;
    return node && node.nextSibling;
  }

  findPrevious() {
    // If this node is its parent's first child, then the previous node is the parent.
    if (!this.prevSibling) return this.parent;
    // Otherwise, the previous node is is the last descendant of its previous sibling:
    let node = this.prevSibling, child;
    while ((child = node.lastVisibleChild)) node = child;
    return node;
  }

  handleKeyDown(ev) {
    // Don't handle key events when the comment div itself does not have focus.
    // This happens when activating a link within the comment.
    if (ev.target !== this.commentDiv) return;
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

class RadioButtonsComponent {
  constructor(parentElem, labels, onChange) {
    const div = document.createElement('div');
    div.className = 'radio-buttons';
    this.buttons = labels.map((label, index) => {
      const button = createElement(div, 'button', 'inactive');
      createTextNode(button, label);
      button.onclick = this.change.bind(this, index);
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

function replaceComments(rootElem, comments, options=REPLACE_COMMENTS_DEFAULT_OPTIONS) {
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
  new ExtCommentListComponent(rootElem, comments, undefined, options);
}
