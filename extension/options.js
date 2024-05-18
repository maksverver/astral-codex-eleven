'use strict';

// Keep this list in sync with the object at the bottom of the file.
const {
  OPTIONS,
  processSingleComment,
  processAllComments,
  getOption,
  setOption,
  loadSavedOptions,
  loadOptions,
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
    descriptionShort: 'Zen Mode',
    descriptionLong: 'Remove all like, share, and subscribe buttons in the post.',
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

  // All options should be added here.
  const optionArray = [
    // templateOption,
    removeNagsOptions,
    zenModeOption,
    defaultSortOption,
    hideUsersOption,
  ];

  const logger = new Logger('[Astral Codex Eleven] [Options]');

  const STORAGE_KEY = 'acxi-options';
  const OPTIONS = Object.fromEntries(optionArray.filter((e) => {
    const [valid, reason] = isValidOption(e);
    if (!valid) logger.error('Invalid option:', reason, e);
    return valid;
  }).map((e) => [e.key, e]));

  // Apply `processComment` from the given key to all ExtCommentComponents
  function processComments(option) {
    if (!(option.processComment instanceof Function)) {
      logger.warn(`No processComment function for key '${option.key}'`);
      return;
    }

    const perfTimer = new Timer();
    const value = getOption(option.key);
    for (let child of commentListRoot.descendants()) {
      option.processComment(value, child);
    }
    logger.info(`processComments() for '${option.key}' ran in ${perfTimer.totalTime()}ms`);
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
  // directly, instead getOption and setOption below should be used.
  let optionShadow = {};

  function getOption(key) {
    return optionShadow.hasOwnProperty(key) ? optionShadow[key] : OPTIONS[key]?.default;
  }

  async function setOption(key, value) {
    optionShadow[key] = value;
    await saveOptions();
  }

  async function loadSavedOptions() {
    const v = await chrome.storage.local.get(STORAGE_KEY).catch((e) => {
      logger.error('Error loading options:', e);
      return undefined;
    });
    optionShadow = v?.[STORAGE_KEY] ?? {};
    logger.info('Loaded option values', optionShadow);
  }

  async function loadOptions() {
    await loadSavedOptions();
    chrome.storage.onChanged.addListener(storageChangeHandler);
    const perfTimer = new Timer();
    for (const [key, option] of Object.entries(OPTIONS)) {
      if (option.onStart instanceof Function) {
        perfTimer.restart();
        option.onStart(getOption(key));
        logger.info(`onStart() for '${key}' ran in ${perfTimer.totalTime()}ms`);
      }
    }
  }

  function runOptionsOnLoad() {
    const perfTimer = new Timer();
    for (const [key, option] of Object.entries(OPTIONS)) {
      if (option.onLoad instanceof Function) {
        perfTimer.restart();
        option.onLoad(getOption(key));
        logger.info(`onLoad() for '${key}' ran in ${perfTimer.totalTime()}ms`);
      }
    }
  }

  async function saveOptions() {
    await chrome.storage.local.set({[STORAGE_KEY]: optionShadow}).catch((e) => {
      logger.error('Error saving options:', e);
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
        optionShadow[key] = newValue;
        const onValueChange = OPTIONS[key]?.onValueChange;
        if (onValueChange) {
          const perfTimer = new Timer();
          onValueChange(newValue);
          logger.info(`onValueChange() for '${key}' ran in ${perfTimer.totalTime()}ms`);
        }
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

  // Keep this list in sync with the object at the top of the file.
  return {
    OPTIONS,
    processSingleComment,
    processAllComments,
    getOption,
    setOption,
    loadSavedOptions,
    loadOptions,
    runOptionsOnLoad,
  };
})();
