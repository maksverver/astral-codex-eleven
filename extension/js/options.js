'use strict';

// Keep this list in sync with the object at the bottom of the file.
const {
  OPTIONS,
  processSingleComment,
  processAllComments,
  getOption,
  setOption,
  loadOptionValues,
  startOptions,
  runOptionsOnLoad,
} = (() => {
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
   * The value of the option must be truthy in order for processComment to be
   * run. onStart and onLoad are called for every option when the page is first
   * loaded, and are passed the current value, so checking the current value of
   * the option is required.
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
     * The default value for the option. This will be the value of the option
     * the first time the user loads the extension.
     */
    default: true,

    /**
     * (Required)
     * A short description of the option to identify it on the option popup.
     */
    descriptionShort: 'A short description',

    /**
     * (Required)
     * Text that describes what the option does in more detail. This will be
     * shown in the option panel when the user hovers over the help icon.
     */
    descriptionLong: 'A longer description of the option with more detail than the name alone.',

    /**
     * (Optional)
     * This will be called any time the option changes value.
     * @param {*} newValue - the new value of the option
     */
    onValueChange(newValue) {},

    /**
     * (Optional)
     * Runs immediately when a page is first opened, Useful for applying custom
     * CSS styling.
     * @param {*} currentValue - the current value of the option
     */
    onStart(currentValue) {},

    /**
     * (Optional)
     * Runs when a page is fully loaded, after the DOM is created and the rest
     * of the extension changes are made.
     * @param {*} currentValue - the current value of the option
     */
    onLoad(currentValue) {},

    /**
     * (Optional)
     * Applied to each ExtCommentComponent. From that, the comment element
     * itself can be accessed and modified, as well as other state. Any return
     * value is discarded.
     * @param currentValue - the current value of the option
     * @param commentComponent - the ExtCommentComponent that represents the
     * given comment
     */
    processComment(currentValue, commentComponent) {}
  };

  const removeNagsOptions = {
    key: 'removeNags',
    default: false,
    descriptionShort: 'Remove Substack nags',
    descriptionLong: 'Remove Substack prompts to subscribe or share posts.',
    onStart(currentValue) {
      setStyleEnabled(this.key, currentValue);
    },
    onValueChange(newValue) {
      setStyleEnabled(this.key, newValue);
    }
  };

  const zenModeOption = {
    key: 'zenMode',
    default: false,
    descriptionShort: 'Zen Mode',
    descriptionLong: 'Remove all like, share, and subscribe buttons in the post.',
    onStart(currentValue) {
      setStyleEnabled(this.key, currentValue);
    },
    onValueChange(newValue) {
      setStyleEnabled(this.key, newValue);
    }
  };

  const defaultSortOption = {
    key: 'defaultSort',
    default: 'auto',
    descriptionShort: 'Default comment sorting',
    descriptionLong: 'Force the comment sorting to always be the same. Leave on Auto to use the default Substack sorting.',
    onLoad(currentValue) {
      if (currentValue === 'chrono') {
        commentOrderComponent.setOrder(CommentOrder.CHRONOLOGICAL);
      } else if (currentValue === 'new') {
        commentOrderComponent.setOrder(CommentOrder.NEW_FIRST);
      }
    }
  };

  const collapseDepthOption = {
    key: 'collapseDepth',
    default: 0,
    descriptionShort: 'Automatic collapse depth',
    descriptionLong: "Collapse comments greater than the given depth. If 0, then don't collapse any comments.",
    processComment(currentValue, commentComponent) {
      if (currentValue > 0 && commentComponent.depth > 0 && commentComponent.depth % currentValue === 0) {
        commentComponent.setExpanded(false);
      }
    }
  };

  const hideUsersOption = {
    key: 'hideUsers',
    default: '',
    descriptionShort: 'Hide user comments',
    descriptionLong: 'Hide comments from the listed users, in a comma separated list.',
    createCachedSet(userString) {
      this.cachedSet = new Set(userString.split(',').map((e) => e.trim()).filter((x) => x));
    },
    onValueChange(newValue) {
      this.createCachedSet(newValue);
      processComments(this);
    },
    onStart(currentValue) {
      this.createCachedSet(currentValue);
    },
    processComment(currentValue, commentComponent) {
      const commentData = commentComponent.commentData;
      const commentElem = commentComponent.threadDiv;
      commentElem.classList.toggle('hidden', this.cachedSet.has(commentData.name));
    }
  };

  // This will handle formatting the comment time, but will use the value of
  // other options and not be directly settable itself.
  const dateFormatOption = {
    key: 'dateFormat',
    default: null,
    descriptionShort: 'Time formatting',
    descriptionLong: 'Time formatting but long.',
    onStart(currentValue) {
      this.shortFormat = new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric'});
      this.longFormat = new Intl.DateTimeFormat('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit',
        minute: '2-digit', second: '2-digit', timeZoneName: 'short'});
    },

    processComment(currentValue, commentComponent) {
      commentComponent.setDateFormat(this.shortFormat, this.longFormat);
    }
  };

  // All options should be added here.
  const optionArray = [
    // templateOption,
    removeNagsOptions,
    zenModeOption,
    defaultSortOption,
    collapseDepthOption,
    hideUsersOption,
    dateFormatOption,
  ];

  const LOG_TAG = '[Astral Codex Eleven] [Option]';
  const STORAGE_KEY = 'acxi-options';
  const OPTIONS = Object.fromEntries(optionArray.filter((e) => {
    const [valid, reason] = isValidOption(e);
    if (!valid) console.error(LOG_TAG, 'Invalid option:', reason, e);
    return valid;
  }).map((e) => [e.key, e]));

  // Apply `processComment` from the given key to all ExtCommentComponents
  function processComments(option) {
    if (!(option.processComment instanceof Function)) {
      console.warn(`No processComment function for key '${option.key}'`);
      return;
    }

    const value = getOption(option.key);
    for (let child of commentListRoot.descendants()) {
      option.processComment(value, child);
    }
  }

  // Apply `processComment` from all keys to the given ExtCommentComponent
  function processSingleComment(comment) {
    for (const option of Object.values(OPTIONS)) {
      if (Object.hasOwn(option, 'processComment')) {
        const value = getOption(option.key);
        option.processComment(value, comment);
      }
    }
  }

  // Apply `processComment` from all keys to all ExtCommentComponents
  function processAllComments() {
    for (const option of Object.values(OPTIONS)) {
      if (Object.hasOwn(option, 'processComment')) {
        processComments(option);
      }
    }
  }

  // Stores a local copy of the current option values. It should not be used
  // directly, instead getOption and setOption below should be used. Initialized
  // by loadOptionValues(), which is also called by startOptions().
  let optionValues = undefined;

  function getOption(key) {
    return optionValues.hasOwnProperty(key) ? optionValues[key] : OPTIONS[key]?.default;
  }

  async function setOption(key, value) {
    optionValues[key] = value;
    await saveOptions();
  }

  // Loads option values and nothing else. After this completes, getOption()
  // and setOption() can be called.
  async function loadOptionValues() {
    const v = await chrome.storage.local.get(STORAGE_KEY).catch((e) => {
      console.error(LOG_TAG, e);
      return undefined;
    });
    optionValues = v?.[STORAGE_KEY] ?? {};
    console.info(LOG_TAG, 'Loaded option values', optionValues);
  }

  // Loads option values and then calls onStart() on all options that have it.
  async function startOptions() {
    await loadOptionValues();
    chrome.storage.onChanged.addListener(storageChangeHandler);
    for (const [key, option] of Object.entries(OPTIONS)) {
      if (option.onStart instanceof Function) {
        option.onStart(getOption(key));
      }
    }
  }

  // Calls onLoad() on all options that have it.
  function runOptionsOnLoad() {
    for (const [key, option] of Object.entries(OPTIONS)) {
      if (option.onLoad instanceof Function) {
        option.onLoad(getOption(key));
      }
    }
  }

  async function saveOptions() {
    await chrome.storage.local.set({[STORAGE_KEY]: optionValues}).catch((e) => {
      console.error(LOG_TAG, e);
    });
  }

  function storageChangeHandler(changes, namespace) {
    if (namespace !== 'local' || !changes[STORAGE_KEY]
        || typeof changes[STORAGE_KEY].newValue !== 'object') {
      return;
    }

    for (const [key, newValue] of Object.entries(changes[STORAGE_KEY].newValue)) {
      // stringify is a simple way to compare values that may be dicts, and
      // performance isn't a concern here since the function doesn't run often.
      const newValueString = JSON.stringify(newValue);
      const oldValueString = JSON.stringify(getOption(key));

      if (newValueString !== oldValueString) {
        optionValues[key] = newValue;
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

    if (typeof option.descriptionShort !== 'string' || option.descriptionShort.length === 0) {
      return [false, 'short description is required'];
    }

    if (typeof option.descriptionLong !== 'string' || option.descriptionLong.length === 0) {
      return [false, 'long description is required'];
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

  // Keep this list in sync with the object at the top of the file.
  return {
    OPTIONS,
    processSingleComment,
    processAllComments,
    getOption,
    setOption,
    loadOptionValues,
    startOptions,
    runOptionsOnLoad,
  };
})();
