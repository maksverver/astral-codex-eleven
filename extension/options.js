'use strict';

/**
 * This file holds all options that are implemented with the options API. This
 * API can be used to modify comments or run functions on page load. To add a
 * new option, create an object with the following fields and add it to
 * optionArray.
 *
 * The value of the option must be truthy in order for processHeader and
 * processComment to be run. onLoad is called for every option when the page is
 * first loaded, and is passed the current value, so checking that the option is
 * set is required.
 *
 * The order when processing a comment is:
 *   - processComment
 *   - processHeader
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
  onValueChange: (newValue) => {},

  /**
   * (Optional)
   * Runs whenever a page is first loaded, even if the value of the option is
   * falsy. Useful for applying custom CSS styling.
   * @param {*} currentValue - the current value of the option
   */
  onLoad: (currentValue) => {},

  /**
   * (Optional)
   * Applied to the comment DOM element of each comment. The element itself
   * should be modified directly, as any return value is discarded. This only
   * runs if the current value of the option is truthy.
   * @param {Element} commentElem - the DOM element of the comment
   */
  processComment: (commentElem) => {},

  /**
   * (Optional)
   * Applied to the header DOM element of each comment. The element itself
   * should be modified directly, as any return value is discarded. This only
   * runs if the current value of the option is truthy.
   * @param {Element} headerElem - the DOM element of the header
   */
  processHeader: (headerElem) => {}
};

// All options should be added here.
const optionArray = [
  // templateOption,
];

const LOG_OPTION_TAG = '[Astral Codex Eleven] [Option]';

// Stores a local copy of the current option values.
const optionShadow = {};

function isValidOption(option) {
  if (typeof(option.key) !== 'string') {
    return [false, 'must contain property "key" as a string'];
  }

  if (!option.hasOwnProperty('default')) {
    return [false, 'must contain a default value'];
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
