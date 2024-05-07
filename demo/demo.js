'use strict';

const fileInput = document.getElementById('file-input');;
const rootDiv = document.getElementById('ext-comments');
let comments = undefined;

function setUpCommentOptions() {
  const optionContainer = document.getElementById('comment-options');
  for (const [key, option] of Object.entries(OPTIONS)) {
    // only add options that modify comments
    if (!option.processHeader && !option.processComment) return;

    optionShadow[key] = option.default;
    const input = document.createElement('input');
    if (typeof option.default === 'boolean') {
      input.type = 'checkbox';
    } else {
      input.type = 'text';
    }
    input.id = `${key}-input`;
    input.addEventListener('change', (event) => {
      optionShadow[key] = event.target.value;
      // slight hack to not run handlers if no comments have been loaded
      if (commentListRoot) option?.onValueChange(event.target.value);
    });
    const label = document.createElement('label');
    label.textContent = key;
    label.htmlFor = `${key}-input`;
    optionContainer.append(input, label);
  }
}

function isCommentApiEnabled() {
  return document.getElementById('comment-api-enabled').checked;
}

const longerDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit'});

let replaceCommentOptions = {
  ...REPLACE_COMMENTS_DEFAULT_OPTIONS,
  collapseDepth: 3,
  dateFormatShort: longerDateFormat,
  newFirst: false,
  commentApi: {
    async createComment(parentId, body) {
      if (!isCommentApiEnabled()) {
        throw new Error("Can't create comment. Comment API is disabled.");
      }
      return {
        "id": Math.round(Math.random()*1e9),
        "user_id": replaceCommentOptions.userId,
        "name": "User",
        "date": new Date().toISOString(),
        "body": body,
        "children": [],
      };
    },

    async editComment(id, body) {
      if (!isCommentApiEnabled()) {
        throw new Error("Can't edit comment. Comment API is disabled.");
      }
      return {id, body};
    },

    async deleteComment(id) {
      if (!isCommentApiEnabled()) {
        throw new Error("Can't delete comment. Comment API is disabled.");
      }
      return {};
    },
  }
};

function repopulate() {
  if (comments) {
    const options = Object.values(OPTIONS);
    const headerFuncs = options.filter((e) => e.hasOwnProperty('processHeader'));
    const commentFuncs = options.filter((e) => e.hasOwnProperty('processComment'));
    const optionApiFuncs = new OptionApiFuncs(headerFuncs, commentFuncs);
    replaceCommentOptions.optionApiFuncs = optionApiFuncs;
    replaceComments(rootDiv, comments, replaceCommentOptions);
  }
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

function setCommentOrder(value) {
  replaceCommentOptions.newFirst = value === 'most_recent_first';
  repopulate();
}

function setCollapseDepth(value) {
  replaceCommentOptions.collapseDepth = Number(value);
  repopulate();
}

function setUserId(value) {
  replaceCommentOptions.userId = value;
  repopulate();
}

(function() {
  setUpCommentOptions();
}())
