"use strict";

export {
  routerStoreRequestHookPlugin,
  getRequestBeforeHandles,
  getRequestAfterHandles,
  getRequestErrorHandles,
  routerStoreEffectPlugin,
  addEffect,
  getEffects,
};

const requestBeforeHandles = Symbol();
const requestAfterHandles = Symbol();
const requestErrorHandles = Symbol();
const routerStoreRequestHookPlugin = {
  name: "routerStoreRequestHookPlugin",
  install: store => {
    Object.defineProperties(store.detail, {
      [requestBeforeHandles]: {value: []},
      [requestAfterHandles]: {value: []},
      [requestErrorHandles]: {value: []},
    });
  }
};

function getRequestBeforeHandles(store) {
  return Reflect.get(store.detail, requestBeforeHandles);
}

function getRequestAfterHandles(store) {
  return Reflect.get(store.detail, requestAfterHandles);
}

function getRequestErrorHandles(store) {
  return Reflect.get(store.detail, requestErrorHandles);
}

const effects = Symbol();
const getFlag = Symbol();
const routerStoreEffects = [];
const routerStoreEffectPlugin = {
  name: "routerStoreEffectPlugin",
  install: store => {
    Object.defineProperties(store.detail, {
      [effects]: {value: []},
      [getFlag]: {value: false, writable: true},
    });
    store.detail[requestBeforeHandles].push(() => {
      if (routerStoreEffects.length > 0) {
        routerStoreEffects.splice(0);
      }
    });
    store.detail[requestAfterHandles].push(() => {
      if (routerStoreEffects.length > 0 && store.detail[effects].length === 0) {
        store.detail[effects].push(...routerStoreEffects.splice(0));
      }
    });
  }
}

function addEffect(effect) {
  routerStoreEffects.push(effect);
}

function getEffects(store) {
  if (!store.detail[getFlag]) {
    store.detail[getFlag] = true;
    return [
      Reflect.get(store.detail, effects),
      () => store.detail[getFlag] = false
    ];
  }
  return [[], null];
}