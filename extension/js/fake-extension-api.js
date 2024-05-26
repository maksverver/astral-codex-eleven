// This file contains a minimal implementation of the chrome extension API.
//
// It's designed to allow including the popup on the demo page for local
// testing, and not much more.

'use strict';

class FakeStorageArea {
  constructor(namespace, listeners, items) {
    this.namespace = namespace;
    this.listeners = listeners;
    this.items = items;

    // The following logic propagates changes from an iframe to its parent, as
    // in demo.html, which embeds popup.html in an iframe.
    if (window.parent === window) {
      window.addEventListener('message', (ev) => {
        if (ev.data.acxiStorageChanged) this.set(ev.data.acxiStorageChanged);
      });
    } else {
      listeners.push(() => {
        window.parent.postMessage({acxiStorageChanged: this.items}, '*');
      });
    }
  }

  async get() {
    return this.items;
  }

  async set(newItems) {
    if (typeof newItems !== 'object') throw new Error('newItems must be an object');

    const oldItems = this.items;
    this.items = {...oldItems, ...newItems};

    const changes = {};
    for (const key in this.items) {
      if (oldItems[key] !== newItems[key]) {
        changes[key] = {
          oldValue: oldItems[key],
          newValue: newItems[key],
        };
      }
    }

    for (const listener of this.listeners) {
      listener(changes, this.namespace);
    }
  }
}

class FakeStorageOnChanged {
  constructor(listeners) {
    this.listeners = listeners;
  }

  addListener(listener) {
    if (!(listener instanceof Function)) throw new Error('listener must be callable');
    this.listeners.push(listener);
  }
}

class FakeStorageImpl {
  constructor() {
    const listeners = [];
    this.local = new FakeStorageArea('local', listeners, {});
    this.onChanged = new FakeStorageOnChanged(listeners);
  }
}

class FakeRuntimeImpl {
  getURL(path) {
    return '../extension/' + path;
  }
};

if (window.chrome == null) {
  window.chrome = {};
}

if (window.chrome.storage == null) {
  console.info('Using fake chrome.storage implementation.');
  window.chrome.storage = new FakeStorageImpl();
}

if (window.chrome.runtime == null) {
  console.info('Using fake chrome.runtime implementation.');
  window.chrome.runtime = new FakeRuntimeImpl();
}
