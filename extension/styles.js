'use strict';

// Holds dynamically enabled styling for use in options.
const STYLES = {
  useOldStyling: `
    /* Global default font and look */

    :root {
      --web_bg_color: #f0f0f0 !important;
      --background_contrast_1: #f7f7f7 !important;
      --background_contrast_2: #ededed !important;
      --background_contrast_3: #d6d6d6 !important;

      /* link color */
      --print_pop: #0066cc !important;

      /* active comment link color */
      --background_pop_darken: #0066cc !important;

      /* active comment border color, active element underline color, main button color */
      --background_pop: #0066cc !important;
    }

    html {
      background: url(${chrome.runtime.getURL('images/mochaGrunge.png')}) !important;
    }

    body {
      padding-left: 20px;
      padding-right: 20px;
    }

    #entry {
      display: flex;
      flex-direction: column;
      max-width: 1242px;
      min-width: 572px;
      min-height: calc(100vh - 80px);
      margin: 0 auto;
      margin-top: 40px;
      margin-bottom: 40px;
      overflow: auto;
      border-radius: 6px;
      box-shadow: 0 0 10px black;
    }

    #entry #main {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      -webkit-font-smoothing: auto !important;
      background-color: #f0f0f0 !important;
      min-height: auto;
    }

    #entry #main .container {
      flex-grow: 1;
    }

    .post-end-cta-full {
      display: none !important;
    }

    /* Home page */

    .main-menu .topbar .section-bar {
      border-top: none;
      border-color: #ccc;
      background-color: #fafafa;
    }

    .main-menu .topbar .section-bar .overflow-items .menu-item {
      background-color: #fafafa;
    }

    .main-menu .topbar .section-bar .overflow-items .menu-item:hover {
      background-color: #f4f4f4 !important;
    }

    .main-menu .topbar .section-bar .overflow-items .menu-item:has(a:focus) {
      background-color: #f4f4f4;
    }

    .main-menu .topbar .section-bar .overflow-items .menu-item a:focus {
      text-decoration: none !important;
    }



    /* Topbar */

    .main-menu-content .topbar-content {
      box-sizing: border-box;
      height: 152px;
      padding: 16px 20px !important;
      column-gap: 0 !important;
      border: none !important;
      background: linear-gradient(to bottom, rgba(139,171,232,1) 0%, rgba(79,115,193,1) 100%) !important;
      text-decoration: none !important;
    }

    .topbar-content .navbar-logo-container {
      flex: 1 0 auto;
      width: auto !important;
      padding-right: 32px;
    }

    .topbar-content .navbar-logo-container a {
      display: inline !important;
      pointer-events: none;
      user-select: none;
    }

    .topbar-content .navbar-logo-container .navbar-logo {
      height: 64px !important;
      float: right;
    }

    .topbar-content .navbar-title {
      position: static !important;
      transform: none !important;
      flex: 0 1 auto !important;
      font-size: 64px !important;
      font-family: 'Raleway', Open Sans, Arial, sans-serif !important;
      font-weight: normal !important;
      text-align: center !important;
      line-height: normal !important;
      letter-spacing: 2px !important;
      text-decoration: none !important;
      -webkit-font-smoothing: auto !important;
    }

    .topbar-content .navbar-title .navbar-title-link {
      display: inline-block;
      color: white !important;
    }

    .topbar-content .navbar-title .navbar-title-link:focus {
      text-decoration: none !important;
    }

    .topbar-content .navbar-title .navbar-title-link:focus-visible {
      text-decoration: solid underline currentcolor 2px !important;
      text-underline-offset: 4px;
    }

    .topbar-content .navbar-title .navbar-title-link:active {
      opacity: 1;
    }

    .topbar-content .navbar-buttons {
      flex: 1 0 0;
      align-self: start;
      justify-content: end;
    }

    .topbar-content .navbar-buttons svg {
      filter: invert(100%) sepia(91%) saturate(38%) hue-rotate(321deg) brightness(110%) contrast(110%);
    }

    .topbar-spacer {
      display: none;
    }

    .user-indicator-dropdown-menu .dropdown-menu.tooltip.active {
      top: 100px;
    }

    @media screen and (max-width: 1100px) {
      .topbar-content .navbar-title {
        font-size: 48px !important;
      }

      .topbar-content .navbar-logo-container .navbar-logo {
        height: 48px !important;
      }
    }

    @media screen and (max-width: 950px) {
      .topbar-content .navbar-title {
        font-size: 34px !important;
      }

      .topbar-content .navbar-logo-container .navbar-logo {
        height: 34px !important;
      }
    }



    /* Footer */

    .subscribe-footer {
      display: none;
    }

    .single-post-section {
      display: none;
    }

    .footer-wrap {
      height: 33px !important;
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

    .single-post-container :focus {
      outline: auto !important;
      outline-offset: 1px;
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

    article .available-content p a {
      color: #0066cc !important;
      text-decoration: underline !important;
    }

    article .available-content figure a {
      color: var(--print_secondary) !important;
      text-decoration: underline !important;
    }

    article .available-content figure a:focus {
      outline-color: var(--print_pop) !important;
    }

    article .available-content figcaption {
      font: 12px/20px Verdana, sans-serif !important;
    }

    article .available-content h1 {
      font-size: 24px;
      color: #333 !important;
    }

    article .available-content h2 {
      font-size: 22px;
      color: #333 !important;
    }

    article .available-content h3 {
      font-size: 20px;
      color: #333 !important;
    }

    article .available-content h4 {
      font-size: 18px;
      color: #333 !important;
    }

    article .available-content h5 {
      font-size: 16px;
      color: #333 !important;
    }

    article .available-content blockquote {
      border-left: 4px solid #ddd !important;
      margin: 0 2em !important;
      padding: 0 1em !important;
    }

    article .available-content blockquote p {
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
    }

    .ext-comments .comments-heading-holder {
      text-transform: uppercase;
    }

    .ext-comments .comments-heading-holder .add-top-level-comment:focus {
      text-decoration: none !important;
      outline-color: #555 !important;
    }

    .ext-comments .comments-heading-holder .comment-order {
      font-family: Georgia, "Bitstream Charter", serif;
      text-transform: none;
    }

    .ext-comments .radio-buttons button:focus {
      outline: none !important;
    }

    .ext-comments .radio-buttons button {
      font: 14px Georgia, "Bitstream Charter", serif;
    }

    .ext-comments .top-level-reply-holder {
      display: flex;
      justify-content: center;
    }

    .ext-comments .comment-editor {
      width: 100%;
    }

    .ext-comments .comment-editor textarea {
      font: 12px Verdana, sans-serif;
      padding-top: 6.66px;
      border: 0;
      border-radius: 10px;
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
      margin: 0;
      flex-grow: 1;
      background-color: #fafafa;
      box-sizing: border-box;
    }

    .ext-comments .comment:focus {
      background-color: #f2f2f2;
      border: 1px solid var(--background_pop) !important;
    }

    .ext-comments .border img.user-icon {
      display: block;
      border-radius: 0px;
      height: 41px;
      width: 41px;
    }

    .ext-comments .comment-thread {
      padding: 0;
    }

    .ext-comments .comment-thread > .border {
      margin-right: 8px !important;
      margin-top: 4px;
      width: 41px;
    }

    .ext-comments .comment-thread > .border:hover > .line {
      width: 2px;
      background: #ddd;
    }

    .ext-comments .comment-thread > .border:hover > img.user-icon {
      height: 41px !important;
      margin-bottom: 8px !important;
    }

    .ext-comments .comment-thread.collapsed > .border .line {
      display: none;
    }

    .ext-comments .comment-thread.collapsed > .border .user-icon {
      display: initial !important;
    }



    /* Comment meta */

    .ext-comments .comment .comment-meta {
      font: 12px Verdana, sans-serif;
      row-gap: 8px;
      column-gap: 8px;
    }

    .ext-comments .comment .comment-meta a:focus {
      text-decoration: none !important;
    }

    .ext-comments .comment .comment-meta .commenter-name {
      width: 100%;
    }

    .ext-comments .comment .comment-meta .commenter-name a:focus {
      outline-color: #555 !important;
    }

    .ext-comments .comment .comment-meta .reply-sep,
    .ext-comments .comment .comment-meta .reply,
    .ext-comments .comment .comment-meta .edit-sep,
    .ext-comments .comment .comment-meta .edit,
    .ext-comments .comment .comment-meta .delete-sep,
    .ext-comments .comment .comment-meta .delete {
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

    .ext-comments .comment:focus {
      outline-color: #888 !important;
    }

    .ext-comments .comment .comment-body {
      padding-top: 8px;
      font: 12px/20px Verdana, sans-serif;
      color: #333;
    }

    .ext-comments .comment .comment-body a {
      text-decoration: underline !important;
    }



    /* Comment actions */

    .ext-comments .comment .comment-footer {
      display: flex;
      column-gap: 12px;
      margin-top: 6px;
    }

    .ext-comments .comment .comment-footer a:focus {
      text-decoration: underline !important;
    }

    .ext-comments .comment .comment-footer > * {
      font: 12px Georgia, "Bitstream Charter", serif;
      color: #888;
    }

    .ext-comments .comment-thread.collapsed .comment .comment-footer {
      display: none;
    }

    .ext-comments .comment-editor .buttons {
      justify-content: left;
    }

    .ext-comments .comment-editor button {
      height: 30px;
      padding: 0px 20px;
      font-family: verdana;
      font-weight: normal;
    }

    .ext-comments .comment-editor button:focus {
      padding: 0px 18px;
      outline: none !important;
    }

    .ext-comments .comment-editor button.primary:focus {
      border-color: #000 !important;
    }



    /* Expand comment button */

    .comment-collapse-toggle {
      font-weight: normal !important;
    }
  `,
  removeNags: `
    button[data-testid='noncontributor-cta-button'],
    .end-of-post-recommend-cta-container,
    .post-end-cta-full,
    .subscribe-footer {
      display: none !important;
    }
  `,
  zenMode: `
    .end-of-post-recommend-cta-container,
    .post-end-cta-full,
    .subscribe-footer,
    .post-header .post-ufi,
    .post-footer,
    .single-post-section,
    .post div:has(.available-content) > div:not(.available-content),
    .footer .footer-buttons,
    .footer .footer-slogan-blurb {
      display: none !important;
    }

    .ext-comments {
      border-top: 1px solid var(--color-detail-themed);
      margin-top: 20px;
      padding-top: 20px;
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
