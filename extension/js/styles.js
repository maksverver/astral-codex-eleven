'use strict';

const {
  setStyleEnabled,
} = (() => {
  const STYLE_ELEMS = {};

  function setStyleEnabled(key, enabled) {
    let link = STYLE_ELEMS[key];
    if (!link) {
      // Tiny optimization: don't add <link> element until style is enabled.
      if (!enabled) return;
      link = document.createElement('link');
      link.href = chrome.runtime.getURL(`css/options/${key}.css`);
      link.type = 'text/css';
      link.rel = 'stylesheet';
      document.body.appendChild(link);
      STYLE_ELEMS[key] = link;
    }
    link.disabled = !enabled;
  }

  return {
    setStyleEnabled,
  };
})();
