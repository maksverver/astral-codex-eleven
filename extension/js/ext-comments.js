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

// Holds the root ExtCommentListComponent.
let commentListRoot;

// Holds the CommentOrderComponent.
let commentOrderComponent;

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

// getUserIconUrl({photo_url, user_id}) generates an image URL to be used as
// a user icon, based on either `photo_url` (if defined), or a default picture
// based on `user_id` instead.
const getUserIconUrl = (() => {
  const colorUrls = Object.freeze([
    'https://substack.com/img/avatars/purple.png',
    'https://substack.com/img/avatars/yellow.png',
    'https://substack.com/img/avatars/orange.png',
    'https://substack.com/img/avatars/green.png',
    'https://substack.com/img/avatars/black.png',
  ]);
  const loggedOutUrl =
    'https://substack.com/img/avatars/logged-out.png';

  // Generate a default user icon from a user id, in the same way that Substack
  // does. (Thanks Pycea for figuring out the userId % 5 logic.)
  function getDefaultUserIcon(userId) {
    return userId ? colorUrls[userId % colorUrls.length] : loggedOutUrl;
  }

  // Device pixel ratio. In theory, this can change during the lifetime of the
  // window, but in practice it's probably rare enough not to care about it.
  const pixelRatio = typeof window === 'object' && window.devicePixelRatio || 1;

  // Base URL for user icons. The stylesheet scales these to 32x32 px, so we
  // need to request an image with corresponding resolution. The image URL
  // seems to support Cloudinary transformation parameters:
  // https://cloudinary.com/documentation/transformation_reference
  const size = Math.round(32 * pixelRatio);
  const baseUrl = `https://substackcdn.com/image/fetch/w_${size},h_${size},c_fill/`;

  return (commentData) => {
    const photoUrl = commentData.photo_url ?? getDefaultUserIcon(commentData.user_id);
    return baseUrl + encodeURIComponent(photoUrl);
  };
})();

function createElement(parent, tag, className, textContent) {
  const elem = document.createElement(tag);
  if (parent) parent.appendChild(elem);
  if (className) elem.className = className;
  if (textContent != null) elem.appendChild(document.createTextNode(textContent));
  return elem;
}

function createTextNode(parent, text) {
  const node = document.createTextNode(text);
  parent.appendChild(node);
  return node;
}

// Formats `date` as a string like "5 mins ago" or "1 hr ago" if it is
// between `now` and `now` minus 24 hours, or returns undefined otherwise.
function formatRecentDate(now, date) {
  const minuteMillis = 60 * 1000;
  const hourMillis = 60 * minuteMillis;
  const dayMillis = 24 * hourMillis;
  const timeAgoMillis = now - date;
  if (timeAgoMillis < 0) return undefined; // date is in the future?!
  if (timeAgoMillis < hourMillis) {
    const mins = Math.floor(timeAgoMillis / minuteMillis);
    return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
  }
  if (timeAgoMillis < dayMillis) {
    const hrs = Math.floor(timeAgoMillis / hourMillis);
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ago`;
  }
  return undefined; // date is more than a day ago.
}

class ExtDateComponent {
  constructor(parentElem, dateString) {
    parentElem.classList.add('date');
    parentElem.tabIndex = 0;
    this.dateString = dateString;
    this.shortDateSpan = createElement(parentElem, 'span', 'short', dateString);
    this.longDateSpan = createElement(parentElem, 'span', 'long', dateString);
  }

  setDateFormat(shortFormat, longFormat) {
    // We could also convert to Date in the constructor instead of here, but I
    // think the current solution is more memory-efficient, and typically
    // setting the date format only happens once.
    const date = new Date(this.dateString);
    this.shortDateSpan.textContent = formatRecentDate(Date.now(), date) || shortFormat.format(date);
    this.longDateSpan.textContent = longFormat.format(date);
  }
}

class ExtCommentListComponent {
  static assignSiblings(children) {
    const n = children.length;
    for (let i = 0; i < n; ++i) {
      children[i].prevSibling = children[i - 1];
      children[i].nextSibling = children[i + 1];
    }
  }

  constructor(parentElem, commentObjects, parentCommentComponent, options) {
    // Substack uses class names "comments" and "comments-list" and applies
    // extra styling that I don't want, so I use "ext-comments-list" instead.
    const div = createElement(parentElem, 'div', 'ext-comments-list');
    const childComponents = commentObjects.map(
        (comment) => new ExtCommentComponent(div, comment, parentCommentComponent, options));
    this.commentsHolder = div;
    this.children = childComponents;
    this.commentOrder = options.commentOrder;
    ExtCommentListComponent.assignSiblings(this.children);
  }

  addComment(comment, parentCommentComponent, options) {
    // This is a bit of a hack to ensure that comments are added at the top in
    // the new-first ordering. It's kinda slow for large threads, but I don't
    // know if it's worth it to try to make it faster.
    const reverse = this.commentOrder === CommentOrder.NEW_FIRST;
    if (reverse) this.reverseSelfOnly();
    const commentComponent = new ExtCommentComponent(this.commentsHolder, comment, parentCommentComponent, options);
    if (this.children.length > 0) {
      const prevSibling = this.children[this.children.length - 1];
      prevSibling.nextSibling = commentComponent;
      commentComponent.prevSibling = prevSibling;
    }
    this.children.push(commentComponent);
    if (reverse) this.reverseSelfOnly();
    processSingleComment(commentComponent);
    return commentComponent;
  }

  reverseSelfOnly() {
    this.commentOrder = 1 - this.commentOrder;
    this.commentsHolder.replaceChildren(
        ...Array.from(this.commentsHolder.childNodes).reverse());
    ExtCommentListComponent.assignSiblings(this.children.reverse());
  }

  reverse() {
    this.reverseSelfOnly();
    for (const child of this.children) child.reverse();
  }

  *descendants() {
    for (let child of this.children) {
      yield child;
      yield* child.childList.descendants();
    }
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

    const depth = parentCommentComponent ? parentCommentComponent.depth + 1 : 0;

    const threadDiv = createElement(parentElem, 'div', 'comment-thread');

    // Create div for the border. This can be clicked to collapse/expand comments.
    const borderDiv = createElement(threadDiv, 'div', 'border');
    borderDiv.onclick = this.toggleExpandedInteractive.bind(this);
    // Add profile picture to the top of the border.
    createElement(borderDiv, 'img', 'user-icon')
        .src = getUserIconUrl(comment);
    // Finally, add a vertical line that covers the remaining space.
    createElement(borderDiv, 'div', 'line');

    const contentDiv = createElement(threadDiv, 'div', 'content');
    const commentDiv = createElement(contentDiv, 'div', 'comment');;
    commentDiv.tabIndex = 0;
    commentDiv.onkeydown = this.handleKeyDown.bind(this);
    const commentHeader = createElement(commentDiv, 'header', 'comment-meta');
    const authorSpan = createElement(commentHeader, 'span', 'commenter-name');
    const profileUrl = makeProfileUrl(comment.user_id, comment.name);
    if (profileUrl) {
      createElement(authorSpan, 'a', undefined, comment.name).href = profileUrl;
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
    const postDate = new ExtDateComponent(postDateLink, comment.date);

    let editDate = null;
    if (typeof comment.edited_at === 'string') {
      createTextNode(commentHeader, '·');
      const editedIndicator = createElement(commentHeader, 'span', 'edited-indicator', 'edited ');
      editDate = new ExtDateComponent(editedIndicator, comment.edited_at);
    }

    // Substack assigns special rendering to class="comment-body"
    const commentBody = createElement(commentDiv, 'div', 'comment-body');
    if (comment.body == null) {
      createTextNode(commentBody, comment.deleted ? "deleted" : "unavailable");
      commentBody.classList.add('missing');
    } else {
      this.appendCommentText(commentBody, comment.body);
    }

    const replyHolder = createElement(contentDiv, 'div', 'reply-holder');
    const editHolder = createElement(contentDiv, 'div', 'edit-holder');

    this.options     = options;
    this.postDate    = postDate;
    this.editDate    = editDate;
    this.commentData = comment;
    this.threadDiv   = threadDiv;
    this.headerDiv   = commentHeader;
    this.commentDiv  = commentDiv;
    this.depth       = depth;
    this.parent      = parentCommentComponent;
    this.expanded    = true;
    this.prevSibling = undefined;
    this.nextSibling = undefined;
    this.childList =
        new ExtCommentListComponent(contentDiv, comment.children ?? [], this, options);

    if (!comment.deleted && options.userId) {
      const replySeparator = createElement(commentHeader, 'span', 'reply-sep', '·');
      const replyLink = createElement(commentHeader, 'a', 'reply', 'reply');
      replyLink.href = '#';

      let headerButtons = [replySeparator, replyLink];
      this.connectReplyButton(replyHolder, replyLink, headerButtons);

      if (options.userId === comment.user_id) {
        const editSeparator = createElement(commentHeader, 'span', 'edit-sep', '·');
        const editLink = createElement(commentHeader, 'a', 'edit', 'edit');
        editLink.href = '#';

        const deleteSeparator = createElement(commentHeader, 'span', 'delete-sep', '·');
        const deleteLink = createElement(commentHeader, 'a', 'delete', 'delete');
        deleteLink.href = '#';

        headerButtons.push(editSeparator, editLink, deleteSeparator, deleteLink);
        this.connectEditButton(editHolder, editLink, commentBody, headerButtons);
        this.connectDeleteButton(deleteLink, commentBody, headerButtons);
      }
    }
  }

  setDateFormat(shortFormat, longFormat) {
    this.postDate.setDateFormat(shortFormat, longFormat);
    this.editDate?.setDateFormat(shortFormat, longFormat);
  }

  connectReplyButton(replyHolder, replyLink, toHide) {
    replyLink.onclick = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      new CommentEditorComponent(replyHolder, toHide, '', async (body) => {
        if (body) {
          const comment = await this.options.commentApi.createComment(this.commentData.id, body);
          this.childList.addComment(comment, this, this.options).focus();
        }
      });
    };
  }

  connectEditButton(editHolder, editLink, commentBodyDiv, toHide) {
    editLink.onclick = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      new CommentEditorComponent(editHolder, toHide, this.commentData.body, async (body) => {
        if (body && body !== this.commentData.body) {
          const newCommentData = await this.options.commentApi.editComment(this.commentData.id, body);
          commentBodyDiv.replaceChildren();
          this.appendCommentText(commentBodyDiv, newCommentData.body);
          this.commentData = newCommentData;
        }
      });
    };
  }

  connectDeleteButton(deleteLink, commentBodyDiv, toDelete) {
    deleteLink.onclick = async (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      if (confirm('Are you sure you want to delete this comment?')) {
        try {
          await this.options.commentApi.deleteComment(this.commentData.id);
          commentBodyDiv.textContent = 'deleted';
          commentBodyDiv.classList.add('missing');
          for (const elem of toDelete) elem.remove();
        } catch (e) {
          console.warn(e);
          alert('Failed to delete comment!\n\nSee the JavaScript console for details.');
        }
      }
    };
  }

  // Creates DOM nodes for the given comment text, and appends them to the
  // given parent element. This tries to mirror how Substack seems to process
  // comments:
  //
  //  - Splits text into paragraphs based on newline sequences.
  //  - Turns http/https URLs into clickable links.
  //  - Turn email addresses into clickable mailto: links.
  //
  appendCommentText(parentElem, text) {
    function createLink(parentElem, text, href) {
      const a = createElement(parentElem, 'a', 'linkified', text);
      a.href = href;
      a.target = '_blank';
      a.rel = 'nofollow ugc noopener';
      return a;
    }

    for (const paragraph of text.split(/\n+/)) {
      if (!paragraph) continue;
      const p = createElement(parentElem, 'p');
      splitByUrl(paragraph).forEach((part, i) => {
        if (i % 2 === 0) {
          splitByEmail(part).forEach((part, i) => {
            if (i % 2 === 0) {
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

  setExpanded(expanded) {
    expanded = Boolean(expanded);
    if (expanded === this.expanded) return;
    this.expanded = expanded;
    this.threadDiv.classList.toggle('collapsed', !expanded);
    this.threadDiv.classList.toggle('expanded', expanded);
  }

  // Toggle expanded state trigged by a user action. Besides flipping the
  // expanded state, this scrolls the top of the comment into view, to avoid
  // scrolling past comments below the collapsed thread:
  // https://github.com/maksverver/astral-codex-eleven/issues/3
  toggleExpandedInteractive() {
    this.setExpanded(!this.expanded);
    this.scrollIntoView();
  }

  focus() {
    this.commentDiv.focus();
    this.scrollIntoView();
  }

  scrollIntoView() {
    // Make sure the top of the comment is visible after it is focused:
    if (this.commentDiv.getBoundingClientRect().top < 0) {
      this.commentDiv.scrollIntoView();
    }
  }

  get firstVisibleChild() {
    return this.expanded ? this.childList.children[0] : undefined;
  }

  get lastVisibleChild() {
    return this.expanded ? this.childList.children[this.childList.children.length - 1] : undefined;
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
    switch (ev.code) {
      case 'Enter':
      case 'NumpadEnter':
        this.toggleExpandedInteractive();
        break;

      case 'KeyH':
        if (ev.shiftKey) {
          // Move to top-level comment
          let root = this;
          while (root.parent) root = root.parent;
          root.focus();
        } else {
          // Move to parent
          if (this.parent) this.parent.focus();
        }
        break;

      case 'KeyJ':
        if (ev.shiftKey) {
          // Move to next sibling
          if (this.nextSibling) this.nextSibling.focus();
        } else {
          // Move to next comment
          const next = this.findNext();
          if (next) next.focus();
        }
        break;

      case 'KeyK':
        if (ev.shiftKey) {
          // Move to previous sibling
          if (this.prevSibling) this.prevSibling.focus();
        } else {
          // Move to previous comment
          const prev = this.findPrevious();
          if (prev) prev.focus();
        }
        break;

      default:
        // Unrecognized key; return without stopping propagation.
        return;
    }
    ev.stopPropagation();
    ev.preventDefault();
  }

  reverse() {
    this.childList.reverse();
  }
}

class RadioButtonsComponent {
  constructor(parentElem, labels, onChange) {
    const div = document.createElement('div');
    div.className = 'radio-buttons';
    this.buttons = labels.map((label, index) => {
      const button = createElement(div, 'button', 'inactive', label);
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
    if (this.onChange instanceof Function) this.onChange(index);
  }
}

class CommentOrder {
  static CHRONOLOGICAL = 0;
  static NEW_FIRST = 1;
};

class CommentOrderComponent {
  constructor(parentElem, initialOrder) {
    let currentOrder = initialOrder;
    this.buttons = new RadioButtonsComponent(
      createElement(parentElem, 'div', 'comment-order', 'Order: '),
      ['Chronological', 'New First'],
      (i) => {
        if (i === 1 - currentOrder) {
          commentListRoot.reverse();
          currentOrder = i;
        }
      });
    this.setOrder(initialOrder);
  }

  setOrder(newOrder) {
    this.buttons.change(newOrder);
  }
}

class CommentEditorComponent {
  constructor(parentElem, elemsToHide, initialText, exitCallback) {
    for (const elem of elemsToHide) elem.style.setProperty('display', 'none');

    const rootDiv = createElement(parentElem, 'div', 'comment-editor');
    const textarea = createElement(rootDiv, 'textarea');
    textarea.value = initialText;
    textarea.placeholder = 'Write a comment…';
    textarea.focus();
    const buttons = createElement(rootDiv, 'div', 'buttons');
    const submitButton = createElement(buttons, 'button', 'button primary', 'Post');
    const discardButton = createElement(buttons, 'button', 'button cancel', 'Cancel');

    this.elemsToHide = elemsToHide;
    this.initialText = initialText;
    this.rootDiv = rootDiv;
    this.textarea = textarea;
    this.exitCallback = exitCallback;

    submitButton.onclick = () => this.handleButtonClick(textarea.value);

    discardButton.onclick = () => {
      if (!this.dirty || confirm('Are you sure you want to discard your comment?\n\n\
Push OK to discard, or Cancel to keep editing.')) {
        this.handleButtonClick(undefined);
      }
    };

    this.beforeUnloadHandler = (ev) => {
      if (this.dirty) {
        // This causes the browser to ask for confirmation before navigating away.
        ev.preventDefault();
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  async handleButtonClick(textValue) {
    try {
      await this.exitCallback(textValue);
      this.close();
    } catch (e) {
      console.warn(e);
      alert(`Failed to post comment!\n\nSee the JavaScript console for details.`);
    }
  }

  get dirty() {
    return this.textarea.value !== this.initialText;
  }

  close() {
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    this.rootDiv.parentElement.removeChild(this.rootDiv);
    for (const elem of this.elemsToHide) elem.style.removeProperty('display');
  }
}

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

// Default options for replaceComments(). Callers should override the fields
// they want to customize.
const REPLACE_COMMENTS_DEFAULT_OPTIONS = Object.freeze({
  // Set to NEW_FIRST when comments are provided in reverse chronological order.
  commentOrder: CommentOrder.CHRONOLOGICAL,

  // Set to the numeric id of the currently logged-in user, to enable commenting.
  userId: undefined,

  // Interface used to created/update/delete comments.
  commentApi: COMMENT_API_UNIMPLEMENTED
});

function replaceComments(rootElem, comments, options=REPLACE_COMMENTS_DEFAULT_OPTIONS) {
  // Clear out the original root.
  rootElem.replaceChildren();

  // Add the comment header which contains the total comment count, and
  // the comment order radio buttons.
  let addCommentLink = undefined;
  {
    const holderDiv = createElement(rootElem, 'div', 'comments-heading-holder');
    createElement(holderDiv, 'div', 'comments-heading',
        `${countCommentsInArray(comments)} Comments`);

    if (options.userId) {
      addCommentLink = createElement(holderDiv, 'a', undefined, 'add a top-level comment');
      addCommentLink.href = '#';
    }

    commentOrderComponent = new CommentOrderComponent(holderDiv, options.commentOrder);
  }

  const replyHolder = createElement(rootElem, 'div', 'top-level-reply-holder');

  // Add the top-level comments list.
  commentListRoot = new ExtCommentListComponent(rootElem, comments, undefined, options);
  processAllComments();

  if (addCommentLink) {
    addCommentLink.onclick = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      new CommentEditorComponent(replyHolder, [addCommentLink], '', async (body) => {
        if (body) {
          const comment = await options.commentApi.createComment(undefined, body);
          commentListRoot.addComment(comment, undefined, options);
        }
      });
    };
  }
}
