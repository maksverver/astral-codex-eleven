'use strict';

function optionKeyToCssId(key) {
  return `${key}-css`;
}

// Adds a style tag with values from the given key in the STYLES dict.
function addStyle(key) {
  const link = document.createElement('link');
  link.href = chrome.runtime.getURL(`css/options/${key}.css`);
  link.id = optionKeyToCssId(key);
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.body.appendChild(link);
}

// Enables or disables the style created with the given key.
function setStyleEnabled(key, enabled) {
  const style = document.getElementById(optionKeyToCssId(key));
  if (style) style.disabled = !enabled;
}
