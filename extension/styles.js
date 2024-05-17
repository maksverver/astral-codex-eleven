'use strict';

// Holds dynamically enabled styling for use in options.
const STYLES = {
  useOldStyling: `
    /* Global default font and look */

    :root {
      --web_bg_color: #f0f0f0;
      --print_on_web_bg_color: #333;

      /* link color */
      --print_pop: #0066cc;

      /* active comment link color */
      --background_pop_darken: #0066cc;

      /* active comment border color, active element underline color, main button color */
      --background_pop: #0066cc;
    }

    html {
      /* !important necessary to override inline style */
      background: url(${chrome.runtime.getURL('images/mochaGrunge.png')}) !important;
    }

    body {
      padding-left: 20px;
      padding-right: 20px;
      font: 12px/20px Verdana, sans-serif;
      -webkit-font-smoothing: auto;
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
      min-height: auto;
    }

    #entry #main .container {
      flex-grow: 1;
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

    .main-menu .topbar .section-bar .overflow-items .menu-item.menu-item:hover {
      background-color: #f4f4f4;
    }

    .main-menu .topbar .section-bar .overflow-items .menu-item:has(a:focus) {
      background-color: #f4f4f4;
    }

    .main-menu .topbar .section-bar .overflow-items .menu-item a:focus {
      /* !important necessary to override existing important style */
      text-decoration: none !important;
    }

    .about-page .about-content-wrap .content-about > .body {
      font: 12px/20px Verdana, sans-serif;
    }



    /* Topbar */

    .main-menu .main-menu-content .topbar .topbar-content {
      box-sizing: border-box;
      height: 152px;
      padding: 16px 20px;
      column-gap: 0;
      border: none;
      background: linear-gradient(to bottom, rgba(139,171,232,1) 0%, rgba(79,115,193,1) 100%);
      text-decoration: none;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-logo-container {
      flex: 1 0 auto;
      /* !important necessary to override inline style */
      width: auto !important;
      padding-right: 32px;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-logo-container a {
      display: inline;
      pointer-events: none;
      user-select: none;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-logo-container a .navbar-logo {
      height: 64px;
      float: right;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-title {
      flex: 0 1 auto;
      font-size: 64px;
      font-family: Arial, sans-serif;
      font-weight: normal;
      text-align: center;
      line-height: normal;
      letter-spacing: 2px;
      text-decoration: none;
      -webkit-font-smoothing: auto;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-title.loading {
      position: static;
      transform: none;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-title .navbar-title-link {
      display: inline-block;
      color: white;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-title .navbar-title-link:focus {
      /* !important necessary to override existing important style */
      text-decoration: solid underline currentcolor 2px !important;
      text-underline-offset: 4px;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-title .navbar-title-link:focus-visible {
      text-decoration: solid underline currentcolor 2px;
      text-underline-offset: 4px;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-title .navbar-title-link:active {
      opacity: 1;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-buttons {
      flex: 1 0 0;
      align-self: start;
      justify-content: end;
    }

    .main-menu .main-menu-content .topbar .topbar-content .navbar-buttons svg {
      filter: invert(100%) sepia(91%) saturate(38%) hue-rotate(321deg) brightness(110%) contrast(110%);
    }

    .topbar-spacer {
      display: none;
    }

    .user-indicator-dropdown-menu .dropdown-menu.tooltip.active {
      top: 100px;
    }

    @media screen and (max-width: 1100px) {
      .main-menu .main-menu-content .topbar .topbar-content .navbar-title {
        font-size: 48px;
      }

      .main-menu .main-menu-content .topbar .topbar-content .navbar-logo-container a .navbar-logo {
        height: 48px;
      }
    }

    @media screen and (max-width: 950px) {
      .main-menu .main-menu-content .topbar .topbar-content .navbar-title {
        font-size: 34px;
      }

      .main-menu .main-menu-content .topbar .topbar-content .navbar-logo-container a .navbar-logo {
        height: 34px;
      }
    }



    /* Footer */

    .subscribe-footer {
      display: none;
    }

    .single-post-section {
      display: none;
    }

    .footer-wrap.publication-footer {
      height: 33px;
      background: linear-gradient(to bottom, rgba(139,171,232,1) 0%, rgba(79,115,193,1) 100%);
    }

    .footer-wrap .footer {
      display: none;
    }



    /* Title and post info */

    .post .post-header .post-title {
      font-size: 16px;
      line-height: 1.3em;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-family: Georgia, "Bitstream Charter", serif;
      font-weight: normal;
      -webkit-font-smoothing: auto;
    }

    .post .post-header .subtitle {
      font: 12px/20px Verdana, sans-serif;
      margin-top: 0;
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
      padding: 10px 0px;
    }

    .single-post-container :focus {
      outline: auto;
      outline-offset: 1px;
    }

    @media screen and (min-width: 800px) {
      .single-post-container > .container {
        margin: 0 auto;
        width: 780px;
      }
    }

    .single-post {
      border: 1px solid #d5d5d5;
      border-radius: 10px;
      background: #fff;
      padding: 20px 28px;
      margin-bottom: 10px;
    }

    .post {
      padding: 0;
    }

    .post .available-content p a {
      /* !important used as the text-decoration rules are a mess */
      text-decoration: underline !important;
    }

    .post .available-content .captioned-image-container figure {
      color: #7b8086;
    }

    .post .available-content .captioned-image-container figure a {
      color: #7b8086;
      text-decoration: underline;
    }

    .post .available-content .captioned-image-container figure a:focus {
      outline-color: #7b8086;
      /* !important necessary to override existing important style */
      text-decoration: solid underline #7b8086 1px !important;
    }

    .post .available-content .captioned-image-container figcaption {
      font: 12px/20px Verdana, sans-serif;
    }

    .post .available-content h1 {
      font-size: 24px;
      color: #333;
    }

    .post .available-content h2 {
      font-size: 22px;
      color: #333;
    }

    .post .available-content h3 {
      font-size: 20px;
      color: #333;
    }

    .post .available-content h4 {
      font-size: 18px;
      color: #333;
    }

    .post .available-content h5 {
      font-size: 16px;
      color: #333;
    }

    .post .available-content blockquote {
      border-left: 4px solid #ddd;
      margin: 0 2em;
      padding: 0 1em;
    }

    .post .available-content blockquote p {
      margin-left: 0;
      font-family: Georgia, "Bitstream Charter", serif;
      font-style: italic;
      font-size: 13px;
      line-height: 24px;
      color: #333;
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

    .ext-comments .comments-heading-holder {
      margin-top: 0;
      font-family: Georgia, "Bitstream Charter", serif;
      font-size: 16px;
      font-weight: normal;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .ext-comments .comments-heading-holder .add-top-level-comment:focus {
      /* !important necessary to override existing important style */
      text-decoration: none !important;
      outline-color: #555;
    }

    .ext-comments .comments-heading-holder .comment-order {
      font-family: Georgia, "Bitstream Charter", serif;
      text-transform: none;
    }

    .ext-comments .radio-buttons button:focus {
      outline: none;
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
      resize: vertical;
    }

    @media screen and (min-width: 800px) {
      .ext-comments.container {
        width: 780px;
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
      margin-right: 8px;
      margin-top: 4px;
      width: 41px;
    }

    .ext-comments .comment-thread > .border > .line {
      background: #ccc;
    }

    .ext-comments .comment-thread > .border:hover > .line {
      width: 2px;
      background: #ddd;
    }

    .ext-comments .comment-thread > .border:hover > img.user-icon {
      height: 41px;
      margin-bottom: 8px;
    }

    .ext-comments .comment-thread.collapsed > .border .line {
      display: none;
    }

    .ext-comments .comment-thread.collapsed > .border img.user-icon {
      display: initial;
    }



    /* Comment meta */

    .ext-comments .comment .comment-meta {
      font: 12px Verdana, sans-serif;
      row-gap: 8px;
      column-gap: 8px;
    }

    .ext-comments .comment .comment-meta a:focus {
      /* !important necessary to override existing important style */
      text-decoration: none !important;
    }

    .ext-comments .comment .comment-meta .commenter-name {
      width: 100%;
    }

    .ext-comments .comment .comment-meta .commenter-name a:focus {
      outline-color: #555;
    }

    .ext-comments .comment .comment-meta .reply-sep,
    .ext-comments .comment .comment-meta .reply,
    .ext-comments .comment .comment-meta .edit-sep,
    .ext-comments .comment .comment-meta .edit,
    .ext-comments .comment .comment-meta .delete-sep,
    .ext-comments .comment .comment-meta .delete {
      display: none;
    }

    .ext-comments .comment .comment-meta > * {
      padding-top: 0;
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
      outline-color: #888;
    }

    .ext-comments .comment .comment-body {
      padding-top: 8px;
      font: 12px/20px Verdana, sans-serif;
      color: #333;
    }

    .ext-comments .comment .comment-body a {
      text-decoration: underline;
    }


    .ext-comments .comment .comment-body a:focus {
      /* !important necessary to override existing important style */
      text-decoration: underline !important;
    }



    /* Comment actions */

    .ext-comments .comment .comment-footer {
      display: flex;
      column-gap: 12px;
      margin-top: 6px;
    }

    .ext-comments .comment .comment-footer a:focus {
      /* !important necessary to override existing important style */
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
      outline: none;
    }

    .ext-comments .comment-editor button.primary:focus {
      border-color: #000;
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
