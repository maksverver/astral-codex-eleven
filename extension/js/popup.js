'use strict';

function addDescription(optionElement) {
  const id = optionElement.id;
  const label = optionElement.querySelector('label');
  label.textContent = OPTIONS[id]?.descriptionShort;
}

function addHovertext(optionElement) {
  const id = optionElement.id;
  const iconUri = chrome.runtime.getURL('images/questionmark.svg');
  const icon = document.createElement('img');
  icon.src = iconUri;
  icon.className = 'help-icon';
  const tooltip = document.createElement('span');
  tooltip.id = `${id}-tooltip`;
  tooltip.className = 'tooltip';
  tooltip.textContent = OPTIONS[id]?.descriptionLong;
  tooltip.style.display = 'none';
  optionElement.appendChild(icon);
  document.getElementById('tooltips').appendChild(tooltip);

  icon.addEventListener('mouseover', function() {
    tooltip.style.display = 'inline';

    const windowHeight = window.innerHeight;
    const tooltipHeight = tooltip.offsetHeight;
    const iconTop = this.getBoundingClientRect().top;
    const iconBottom = this.getBoundingClientRect().bottom;
    const topSpace = iconTop - tooltipHeight;
    const bottomSpace = windowHeight - iconBottom - tooltipHeight;

    if (topSpace >= 8) {
      tooltip.style.top = `${iconTop - tooltipHeight - 4}px`;
    } else if (bottomSpace >= 8) {
      tooltip.style.top = `${iconBottom + 4}px`;
    } else {
      tooltip.style.top = '4px';
    }
  });

  icon.addEventListener('mouseout', () => {
    tooltip.style.display = 'none';
  });
}

function setInitialState(optionElement) {
  const id = optionElement.id;
  const input = optionElement.querySelector('.trigger');
  const setValue = getOption(id);

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
  await loadOptionValues();

  // Wait for the DOM to load fully before continuing.
  if (document.readyState === 'loading') {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve));
  }

  for (const optionElement of document.querySelectorAll('.option')) {
    addDescription(optionElement);
    addHovertext(optionElement);
    setInitialState(optionElement);
    createChangeHandler(optionElement);
  }
})();
