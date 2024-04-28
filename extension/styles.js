'use strict';

// Holds dynamically enabled styling for use in options.
const STYLES = {
  removeNags: `
    button[data-testid='noncontributor-cta-button'],
    .end-of-post-recommend-cta-container,
    .post-end-cta-full {
      display: none;
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
