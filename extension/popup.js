'use strict';

function setInitialState(optionElement) {
  const id = optionElement.id;
  const input = optionElement.querySelector('.trigger');
  const setValue = optionShadow[id];

  if (input.classList.contains('check')) {
    input.checked = setValue;
  } else if (input.classList.contains('text') || input.classList.contains('number')) {
    input.value = setValue;
  }
}

function createChangeHandler(optionElement) {
  const id = optionElement.id;
  const input = optionElement.querySelector('.trigger');

  if (input.classList.contains('check')) {
    input.addEventListener('change', () => {
      setOption(id, input.checked);
    });
  } else if (input.classList.contains('text')) {
    input.addEventListener('change', () => {
      setOption(id, input.value);
    });
  } else if (input.classList.contains('number')) {
    input.addEventListener('change', () => {
      const value = parseInt(input.value);
      if (!isNaN(value)) {
        setOption(id, value);
      }
    });
  }
}

// Looks for structures in popup.html of the form:
//
// <div id="templateKey" class="option">
//   <input type="checkbox" id="templateKeyCheck" class="trigger check">
//   <label for="templateKeyCheck">Option description</label>
// </div>
//
// Option wrappers have the class `option`, and the input element has the class
// `trigger` plus one of `check` or `text` depending on if the value is a bool
// or a string. The label is optionally used for checkbox inputs.
(async function() {
  await loadSavedOptions();

  // Wait for the DOM to load fully before continuing.
  if (document.readyState === 'loading') {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve));
  }

  for (const optionElement of document.querySelectorAll('.option')) {
    setInitialState(optionElement);
    createChangeHandler(optionElement);
  }
})();
