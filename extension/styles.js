'use strict';

// Holds dynamically enabled styling for use in options.
const STYLES = {
  showUserAvatars: `
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 16px;
    }

    .ext-comments .comment-thread > .comment-head > .border {
      height: calc(100% - 32px);
      width: 32px !important;
    }

    .ext-comments .comment-thread > .comment-head {
      margin-right: 16px;
    }

    .ext-comments .comment-thread.collapsed > .comment-head > .border {
      display: none;
    }

    .ext-comments .comment-thread > .content > .comment-collapse-toggle {
      display: none;
      cursor: pointer;
      font-size: 12px;
      height: 25px;
      padding: 0 10px;
      margin-top: 8px;
      margin-bottom: -8px;
    }

    .ext-comments .comment-thread.collapsed > .content > .comment-collapse-toggle {
      display: inline-block;
    }
  `,
};

// Adds a style tag with values from the given key in the STYLES dict.
function addStyle(key) {
  const css = STYLES[key];
  const style = document.createElement('style');
  style.id = `${key}-css`;
  style.textContent = css;
  document.documentElement.appendChild(style);
}

// Enables or disables the style created with the given key.
function setStyleEnabled(key, enabled) {
  const style = document.getElementById(`${key}-css`);
  if (style) style.disabled = !enabled;
}
