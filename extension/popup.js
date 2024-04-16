'use strict';

async function setInitialState(optionElement) {
  let id = optionElement.id;
  let input = optionElement.querySelector('.trigger');
  let setValue = optionShadow[id];

  if (input.classList.contains('check')) {
    input.checked = setValue;
  } else if (input.classList.contains('text')) {
    input.value = setValue;
  }
}

function createChangeHandler(optionElement) {
  let id = optionElement.id;
  let input = optionElement.querySelector('.trigger');

  if (input.classList.contains('check')) {
    input.addEventListener('change', () => {
      setOption(id, input.checked);
    });
  } else if (input.classList.contains('text')) {
    input.addEventListener('change', () => {
      setOption(id, input.value);
    });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadSavedOptions();

  for (const optionElement of document.querySelectorAll('.option')) {
    setInitialState(optionElement);
    createChangeHandler(optionElement);
  }
});
