'use strict';

const fileInput = document.getElementById('file-input');;
const rootDiv = document.getElementById('ext-comments');
let comments = undefined;

function repopulate() {
  replaceComments(rootDiv, comments, {
        ...REPLACE_COMMENTS_DEFAULT_OPTIONS,
        collapseDepth: 0,
        dateFormatShort: new Intl.DateTimeFormat('en-US', {
          month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'}),
      });
}

function handleFileChange() {
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      comments = JSON.parse(reader.result).comments;
      repopulate();
    };
    reader.readAsText(file);
  }
}

fileInput.addEventListener('change', handleFileChange);

// Trigger once at startup, in case the file input is already populated, which
// can happen when navigating forward and back after selecting a file.
handleFileChange();
