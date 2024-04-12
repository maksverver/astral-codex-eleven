'use strict';

const fileInput = document.getElementById('file-input');;
const rootDiv = document.getElementById('ext-comments');
let comments = undefined;

const longerDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit'});

let replaceCommentOptions = {
  ...REPLACE_COMMENTS_DEFAULT_OPTIONS,
  collapseDepth: 3,
  dateFormatShort: longerDateFormat,
};

function repopulate() {
  if (comments) replaceComments(rootDiv, comments, replaceCommentOptions);
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

function setDateFormat(value) {
  replaceCommentOptions.dateFormatShort =
      value === 'longer'
          ? longerDateFormat
          : REPLACE_COMMENTS_DEFAULT_OPTIONS.dateFormatShort;
  repopulate();
}

function setCollapseDepth(value) {
  replaceCommentOptions.collapseDepth = Number(value);
  repopulate();
}
