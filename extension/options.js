'use strict';

/**
 * This file holds all options that are implemented with the options API. This
 * API can be used to modify comments or run functions on page load. To add a
 * new option, create an object with the following fields and add it to
 * optionArray.
 *
 * The value of `this` in each function will refer to the option object itself
 * as long as arrow function expressions are not used. For this reason, arrow
 * expressions are discouraged when defining options.
 *
 * The value of the option must be truthy in order for processComment to be run.
 * onStart and onLoad are called for every option when the page is first loaded,
 * and are passed the current value, so checking the current value of the option
 * is required.
 */

const templateOption = {
  /**
   * (Required)
   * The key for this option. Must be unique, and will be how the option is
   * stored in local storage and accessed from the popup.
   */
  key: 'templateKey',

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
  onValueChange(newValue) {},

  /**
   * (Optional)
   * Runs immediately when a page is first opened, even if the value of the
   * option is falsy. Useful for applying custom CSS styling.
   * @param {*} currentValue - the current value of the option
   */
  onStart(currentValue) {},

  /**
   * (Optional)
   * Runs when a page is fully loaded, after the DOM is created and the rest of
   * the extension changes are made, even if the value of the option is falsy.
   * @param {*} currentValue - the current value of the option
   */
  onLoad(currentValue) {},

  /**
   * (Optional)
   * Applied to each ExtCommentComponent. From that, the comment element itself
   * can be accessed and modified, as well as other state. Any return value is
   * discarded. This only runs if the current value of the option is truthy.
   * @param commentComponent - the ExtCommentComponent that represents the given
   * comment
   */
  processComment(commentComponent) {}
};

const removeNagsOptions = {
  key: 'removeNags',
  default: false,
  onStart(currentValue) {
    addStyle(this.key);
    setStyleEnabled(this.key, currentValue);
  },
  onValueChange(newValue) {
    setStyleEnabled(this.key, newValue);
  }
};

const zenModeOption = {
  key: 'zenMode',
  default: false,
  onStart(currentValue) {
    addStyle(this.key);
    setStyleEnabled(this.key, currentValue);
  },
  onValueChange(newValue) {
    setStyleEnabled(this.key, newValue);
  }
};

const defaultSortOption = {
  key: 'defaultSort',
  default: 'auto',
  onLoad(currentValue) {
    if (currentValue === 'chrono') {
      commentOrderComponent.setOrder(CommentOrder.CHRONOLOGICAL);
    } else if (currentValue === 'new') {
      commentOrderComponent.setOrder(CommentOrder.NEW_FIRST);
    }
  }
};

const showFullDateOption = {
  key: 'showFullDate',
  default: false,
  onStart(currentValue) {
    addStyle(this.key);
    setStyleEnabled(this.key, currentValue);
  },
  onValueChange(newValue) {
    setStyleEnabled(this.key, newValue);
  }
};

const use24HourOption = {
  key: 'use24Hour',
  default: false
};

const hideUsersOption = {
  key: 'hideUsers',
  default: '',
  createCachedSet(userString) {
    this.cachedSet = new Set(userString.split(',').map((e) => e.trim()).filter((x) => x));
  },
  onValueChange(newValue) {
    this.createCachedSet(newValue);
    reprocessComments(this.key);
  },
  onStart(currentValue) {
    this.createCachedSet(currentValue);
  },
  processComment(commentComponent) {
    const commentData = commentComponent.commentData;
    const commentElem = commentComponent.threadDiv;
    commentElem.classList.toggle('hidden', this.cachedSet.has(commentData.name));
  }
};

// All options should be added here.
const optionArray = [
  // templateOption,
  removeNagsOptions,
  zenModeOption,
  defaultSortOption,
  showFullDateOption,
  use24HourOption,
  hideUsersOption,
];

const LOG_OPTION_TAG = '[Astral Codex Eleven] [Option]';
const OPTION_KEY = 'acxi-options';

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
  await saveOptions();
}

function initializeOptionValues() {
  for (const [key, option] of Object.entries(OPTIONS)) {
    if (!optionShadow.hasOwnProperty(key)) {
      optionShadow[key] = option.default;
    }

    if (option.onStart instanceof Function) {
      option.onStart(optionShadow[key]);
    }
  }
  saveOptions();
}

async function loadOptions() {
  await loadSavedOptions();
  initializeOptionValues();
  chrome.storage.onChanged.addListener(storageChangeHandler);
}

function runOptionsOnLoad() {
  for (const [key, option] of Object.entries(OPTIONS)) {
    if (option.onLoad instanceof Function) {
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
  if (typeof option.key !== 'string' || option.key.length === 0) {
    return [false, 'must contain property "key" as a string'];
  }

  if (!Object.hasOwn(option, 'default')) {
    return [false, 'must contain a default value'];
  }

  if (Object.hasOwn(option, 'onValueChange') && !(option.onValueChange instanceof Function)) {
    return [false, 'onValueChange must be a function if defined'];
  }

  if (Object.hasOwn(option, 'onStart') && !(option.onStart instanceof Function)) {
    return [false, 'onStart must be a function if defined'];
  }

  if (Object.hasOwn(option, 'onLoad') && !(option.onLoad instanceof Function)) {
    return [false, 'onLoad must be a function if defined'];
  }

  if (Object.hasOwn(option, 'processComment') && !(option.processComment instanceof Function)) {
    return [false, 'processComment must be a function if defined'];
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
