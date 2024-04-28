'use strict';

/**
 * This file holds all options that are implemented with the options API. This
 * API can be used to modify comments or run functions on page load. To add a
 * new option, create an object with the following fields and add it to
 * optionArray.
 *
 * The value of `this` is set to the calling ExtCommentComponent object. As
 * such, API functions should not use arrow function expressions.
 *
 * The value of the option must be truthy in order for processHeader and
 * processComment to be run. onLoad is called for every option when the page is
 * first loaded, and is passed the current value, so checking that the option is
 * set is required.
 *
 * The order when processing a comment is:
 *   - processHeader
 *   - processComment
 */

const templateOption = {
  /**
   * (Required)
   * The key for this option. Must be unique, and will be how the option is
   * stored in local storage and accessed from the popup.
   */
  key: "template-key",

  /**
   * (Required)
   * The default value for the option. This will be the value of the option the
   * first time the user loads the extension.
   */
  default: true,

  /**
   * (Optional)
   * This will be called any time the option changes value.
   * @param {*} newValue - the new value of the option
   */
  onValueChange: function(newValue) {},

  /**
   * (Optional)
   * Runs immediately when a page is first opened, even if the value of the
   * option is falsy. Useful for applying custom CSS styling.
   * @param {*} currentValue - the current value of the option
   */
  onStart: function(currentValue) {},

  /**
   * (Optional)
   * Runs when a page is fully loaded, after DOM creation and the rest of the
   * extension changes, even if the value of the option is falsy.
   * @param {*} currentValue - the current value of the option
   */
  onLoad: function(currentValue) {},

  /**
   * (Optional)
   * Applied to the header DOM element of each comment. The element itself
   * should be modified directly, as any return value is discarded. This only
   * runs if the current value of the option is truthy.
   * @param commentData - the current comment data as JSON
   * @param {Element} headerElem - the DOM element of the header
   */
  processHeader: function(commentData, headerElem) {},

  /**
   * (Optional)
   * Applied to the comment DOM element of each comment. The element itself
   * should be modified directly, as any return value is discarded. This only
   * runs if the current value of the option is truthy.
   * @param commentData - the current comment data as JSON
   * @param {Element} commentElem - the DOM element of the comment
   */
  processComment: function(commentData, commentElem) {}
};

const removeNagsOptions = {
  key: 'removeNags',
  default: false,
  onStart: function(currentValue) {
    addStyle(this.key);
    setStyleEnabled(this.key, currentValue);
  },
  onValueChange: function(newValue) {
    setStyleEnabled(this.key, newValue);
  }
};

// All options should be added here.
const optionArray = [
  // templateOption,
  removeNagsOptions,
];

const LOG_OPTION_TAG = '[Astral Codex Eleven] [Option]';
const OPTION_KEY = "acxi-options";

class OptionApiFuncs {
  constructor(headerFuncs, commentFuncs) {
    this.headerFuncs = headerFuncs ?? [];
    this.commentFuncs = commentFuncs ?? [];
  }
}

// Reprocess all comments with the given option key.
function reprocessComments(key) {
  commentListRoot.processAllChildren([key]);
}

// Stores a local copy of the current option values. It should not be modified
// directly, instead setOption below should be used.
let optionShadow = {};

async function loadSavedOptions() {
  const v = await chrome.storage.local.get(OPTION_KEY).catch((e) => {
    console.error(LOG_OPTION_TAG, e);
    return undefined;
  });
  optionShadow = v?.[OPTION_KEY] ?? {};
}

async function saveOptions() {
  await chrome.storage.local.set({[OPTION_KEY]: optionShadow}).catch((e) => {
    console.error(LOG_OPTION_TAG, e);
  });
}

async function setOption(key, value) {
  optionShadow[key] = value;
  return await saveOptions();
}

function initializeOptionValues() {
  for (const [key, option] of Object.entries(OPTIONS)) {
    if (!optionShadow.hasOwnProperty(key)) {
      optionShadow[key] = option.default;
    }

    if (typeof option.onStart === 'function') {
      option.onStart(optionShadow[key]);
    }
  }
  saveOptions();
}

function runOptionsOnLoad() {
  for (const [key, option] of Object.entries(OPTIONS)) {
    if (typeof option.onLoad === 'function') {
      option.onLoad(optionShadow[key]);
    }
  }
}

function storageChangeHandler(changes, namespace) {
  if (namespace !== 'local' || !changes[OPTION_KEY]
      || typeof changes[OPTION_KEY].newValue !== 'object') {
    return;
  }

  for (const [key, newValue] of Object.entries(changes[OPTION_KEY].newValue)) {
    // stringify is a simple way to compare values that may be dicts, and
    // performance isn't a concern here since the function doesn't run often.
    const newValueString = JSON.stringify(newValue);
    const oldValueString = JSON.stringify(optionShadow[key]);

    if (newValueString !== oldValueString) {
      optionShadow[key] = newValue;
      OPTIONS[key]?.onValueChange?.(newValue);
    }
  }
}

function isValidOption(option) {
  if (typeof option.key !== 'string') {
    return [false, 'must contain property "key" as a string'];
  }

  if (!option.hasOwnProperty('default')) {
    return [false, 'must contain a default value'];
  }

  if (option.hasOwnProperty('onValueChange') && typeof option.onValueChange !== 'function') {
    return [false, 'onValueChange must be a function if defined'];
  }

  if (option.hasOwnProperty('onStart') && typeof option.onStart !== 'function') {
    return [false, 'onStart must be a function if defined'];
  }

  if (option.hasOwnProperty('onLoad') && typeof option.onLoad !== 'function') {
    return [false, 'onLoad must be a function if defined'];
  }

  if (option.hasOwnProperty('processComment') && typeof option.processComment !== 'function') {
    return [false, 'processComment must be a function if defined'];
  }

  if (option.hasOwnProperty('processHeader') && typeof option.processHeader !== 'function') {
    return [false, 'processHeader must be a function if defined'];
  }

  return [true, undefined];
}

// OPTIONS maps option keys to option objects.
const OPTIONS = Object.fromEntries(optionArray.filter((e) => {
  const [valid, reason] = isValidOption(e);
  if (!valid) {
    console.error(LOG_OPTION_TAG, 'Invalid option:', reason, e);
  }
  return valid;
}).map((e) => [e.key, e]));
