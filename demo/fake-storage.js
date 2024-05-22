// This file contains a minimal implementation of the chrome.storage API
// available in the extension. It's designed to allow including the popup on the
// demo page for local testing, and not much more.

'use strict';

class FakeStorageArea {
  constructor(namespace, listeners, items) {
    this.namespace = namespace;
    this.listeners = listeners;
    this.items = items;
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

window.chrome = window.chrome ?? {};
window.chrome.storage = new FakeStorageImpl();
