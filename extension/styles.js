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
      width: 32px;
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
  useOldStyling: `
    /* Global default font and look */

    :root {
      --web_bg_color: #ffffff !important;
      --background_contrast_1: #f7f7f7 !important;
      --background_contrast_2: #ededed !important;
      --background_contrast_3: #d6d6d6 !important;
    }

    html {
      background: url(${chrome.runtime.getURL('images/mochaGrunge.png')}) !important;
    }

    body {
      padding-left: 20px;
      padding-right: 20px;
    }

    #entry {
      max-width: 1242px;
      min-width: 572px;
      margin: 0 auto;
      margin-top: 40px;
      margin-bottom: 20px;
      overflow: auto;
      border-radius: 6px;
      box-shadow: 0 0 10px black;
    }

    #entry #main {
      -webkit-font-smoothing: auto !important;
      background-color: #f0f0f0 !important;
    }

    .post-end-cta-full {
      display: none !important;
    }



    /* Topbar */

    .main-menu-content .topbar-content {
      background: linear-gradient(to bottom, rgba(139,171,232,1) 0%, rgba(79,115,193,1) 100%) !important;
      text-decoration: none !important;
    }

    .topbar-content .navbar-title {
      font-size: 43px !important;
      max-height: 100px !important;
      font-family: 'Raleway', Open Sans, Arial, sans-serif !important;
      font-weight: normal !important;
      text-align: center !important;
      letter-spacing: 2px !important;
      text-decoration: none !important;
      -webkit-font-smoothing: auto !important;
    }

    .topbar-content .navbar-title .navbar-title-link {
      color: white !important;
    }

    .topbar-content .navbar-buttons svg {
      filter: invert(100%) sepia(91%) saturate(38%) hue-rotate(321deg) brightness(110%) contrast(110%);
    }

    .topbar-spacer {
      display: none;
    }

    button.user-indicator.signed-in {
      background-color: #00000000 !important;
    }

    .user-indicator-icon {
      stroke: white !important;
    }

    .notification-container {
      transform: scale(.8) !important;
    }



    /* Footer */

    .subscribe-footer {
      display: none;
    }

    .single-post-section {
      display: none;
    }

    .footer-wrap {
      height: 30px !important;
      background: linear-gradient(to bottom, rgba(139,171,232,1) 0%, rgba(79,115,193,1) 100%);
    }

    .footer-wrap .footer {
      display: none;
    }



    /* Title and post info */

    .post-title {
      font-size: 16px !important;
      line-height: 1.3em !important;
      margin-bottom: 6px !important;
      text-transform: uppercase !important;
      letter-spacing: 1px !important;
      font-family: Georgia, "Bitstream Charter", serif !important;
      font-weight: normal !important;
      -webkit-font-smoothing: auto !important;
    }

    .subtitle {
      font: 12px/20px Verdana, sans-serif !important;
      margin-top: 0 !important;
    }

    .post-header > .pencraft > .pencraft:first-child > .pencraft > .pencraft > .pencraft > .pencraft {
      padding: 5px 7px;
      font-size: 10px;
      font-family: Verdana, sans-serif;
      letter-spacing: 1px;
      background: #f9f9f9;
      border: 1px solid #eee;
      text-transform: uppercase;
      line-height: normal;
    }

    .post-header > .pencraft > .pencraft:first-child > .pencraft > .pencraft > .pencraft > .pencraft:before {
      content: "Posted on ";
    }

    .post-header > .pencraft > .pencraft:first-child > .pencraft > .pencraft > .pencraft > .pencraft:after {
      content: " by Scott Alexander";
    }



    /* Post content */

    .single-post-container {
      background: #f0f0f0 !important;
      padding: 10px 0px !important;
    }

    @media screen and (min-width: 800px) {
      .single-post-container > .container {
        margin: 0 auto;
        width: 780px;
      }
    }

    .single-post {
      border: 1px solid #d5d5d5 !important;
      border-radius: 10px !important;
      background: #fff !important;
      padding: 20px 28px !important;
      margin-bottom: 10px !important;
    }

    article {
      padding: 0 !important;
    }

    article .available-content p, article .available-content li {
      color: #333 !important;
      font: 12px/20px Verdana, sans-serif !important;
    }

    figcaption {
      font: 12px/20px Verdana, sans-serif !important;
    }

    article .available-content p a {
      color: #0066cc !important;
      text-decoration: underline !important;
    }

    blockquote {
      border-left: 4px solid #ddd !important;
      margin: 0 2em !important;
      padding: 0 1em !important;
    }

    blockquote p {
      margin-left: 0 !important;
      font-family: Georgia, "Bitstream Charter", serif !important;
      font-style: italic !important;
      font-size: 13px !important;
      line-height: 24px !important;
      color: #333 !important;
    }



    /* Comments container */

    .ext-comments {
      box-sizing: border-box;
      background-color: white;
      justify-content: center;
      border: 1px solid #d5d5d5;
      border-radius: 10px;
      padding: 17px;
      padding-bottom: 25px;
    }

    /* TODO don't hard code */
    .ext-comments .content {
      /*max-width: 695px;*/
    }

    .ext-comments .comments-heading-holder {
      margin-top: 0 !important;
      font-family: Georgia, "Bitstream Charter", serif !important;
      font-size: 16px !important;
      font-weight: normal !important;
      letter-spacing: 1px !important;
      text-transform: uppercase;
    }

    .ext-comments .top-level-reply-holder {
      display: flex;
      justify-content: center;
    }

    .ext-comments .comment-editor {
      width: 100%;
    }

    .ext-comments .comment-editor textarea {
      font-family: var(--font_family_ui, var(--font-family-text));
      padding-top: 6.66px;
      border: 0;
      outline: 1px solid #cbd5e3;
      resize: vertical !important;
    }

    @media screen and (min-width: 800px) {
      .ext-comments.container {
        width: 780px !important;
      }
    }



    /* Comment box form */

    .ext-comments .comment {
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 10px;
      flex-grow: 1;
      background-color: #fafafa;
      box-sizing: border-box;
    }

    .ext-comments .comment:focus {
      background-color: #f2f2f2;
      border: 1px solid var(--background_pop) !important;
    }

    .ext-comments .avatar {
      display: block;
      border-radius: 0px;
      height: 41px;
      width: 41px;
    }

    .ext-comments .comment-thread {
      padding: 0;
    }

    .ext-comments .comment-thread > .comment-head {
      margin-right: 8px !important;
    }

    .ext-comments .comment-thread > .comment-head > .border {
      margin-top: 4px;
      height: calc(100% - 41px - 4px);
      width: 41px;
    }

    .ext-comments .comment-thread > .comment-head > .border:hover > .line {
      width: 2px;
      background: #ddd;
    }



    /* Comment meta */

    .ext-comments .comment .comment-meta {
      font: 12px Verdana, sans-serif;
      row-gap: 8px;
      column-gap: 8px;
    }

    .ext-comments .comment .comment-meta .commenter-name {
      width: 100%;
    }

    .ext-comments .comment .comment-meta .reply,
    .ext-comments .comment .comment-meta .reply-sep {
      display: none !important;
    }

    .ext-comments .comment .comment-meta > * {
      padding-top: 0 !important;
    }

    .ext-comments .comment .comment-meta .commenter-name {
      font-weight: bold;
      color: black;
    }

    .ext-comments .comment .comment-meta .commenter-name:after {
      content: " says:";
      font-weight: normal;
      font-style: italic;
      color: #333;
    }

    .ext-comments .comment .comment-meta > :not(.commenter-name) {
      font-family: Georgia, "Bitstream Charter", serif;
      color: #888;
      text-decoration: none;
    }



    /* Comment content */

    .ext-comments .comment .comment-body {
      padding-top: 8px;
    }

    .ext-comments .comment-body p {
      font: 12px/20px Verdana, sans-serif;
      color: #333;
    }



    /* Comment actions */

    .ext-comments .comment .comment-footer {
      margin-top: 6px;
    }

    .ext-comments .comment .comment-footer > * {
      font: 12px Georgia, "Bitstream Charter", serif;
      color: #888;
    }

    .ext-comments .comment-thread.collapsed .comment .comment-footer {
      display: none;
    }



    /* Expand comment button */

    .comment-collapse-toggle {
      font-weight: normal !important;
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
