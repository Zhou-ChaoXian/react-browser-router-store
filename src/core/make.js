"use strict";

import {addEffect} from "../store";

export {
  makeEffect,
  makeMemo,
  makeCallback,
};

function makeEffect(effect) {
  addEffect(effect);
}

function makeMemo(depsHandle, computedHandle, isFactory = true) {
  let value;
  addEffect((store) => [
    depsHandle(store),
    (newValue, oldValue) => {
      value = isFactory ?
        computedHandle(newValue, oldValue) :
        (...args) => computedHandle.apply(undefined, [...args, newValue, oldValue]);
    }
  ]);
  return Object.defineProperty(Object.create(null), "value", {get: () => value});
}

function makeCallback(depsHandle, functor) {
  return makeMemo(depsHandle, functor, false);
}