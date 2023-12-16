"use strict";

import {createElement, Suspense} from "react";
import {Await} from "react-router-dom";

export {
  lazy,
  lazyWithStore,
  isLazyComponentWithStore,
  createComponentWithStore,
  ComponentWithStore,
  StoreState,
};

const tag = Symbol();

function lazy(factory, name = undefined, loading = false, error = false) {
  let component = null;

  return function LazyComponent(props) {
    let resolve;
    if (component === null) {
      resolve = factory().catch(error => {
        throw error;
      });
    } else {
      resolve = component;
    }
    return createElement(Suspense, {fallback: loading},
      createElement(Await, {resolve, errorElement: error}, module => {
        if (component === null) {
          component = name ? (module[name] ?? module.default) : module.default;
        }
        return createElement(component, props);
      })
    );
  }
}

function lazyWithStore(factory, name = undefined) {
  return Object.defineProperties(function LazyComponentWithStore(props) {
    return createElement(Reflect.get(LazyComponentWithStore, "component"), props);
  }, {
    displayName: {value: "LazyComponentWithStore"},
    tag: {value: tag},
    factory: {
      value: name ?
        () => factory().then(module => ({default: module[name] ?? module.default})) :
        factory
    },
    component: {value: null, writable: true},
    storeState: {value: null, writable: true},
  });
}

function isLazyComponentWithStore(component) {
  return Reflect.get(component, "tag") === tag;
}

class StoreState {
  constructor(factory) {
    this.factory = factory;
    this.store = null;
    this.error = null;
  }
}

class ComponentWithStore {
  constructor(component, store) {
    this.component = component;
    this.store = store;
  }
}

function createComponentWithStore(component, store) {
  return new ComponentWithStore(component, store);
}