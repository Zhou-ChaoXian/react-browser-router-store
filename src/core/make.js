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

function makeMemo(depsHandle, computeHandle, isFactory = true) {
  let value;
  addEffect((store) => [
    depsHandle(store),
    (newValue, oldValue) => {
      value = isFactory ? computeHandle(newValue, oldValue) : () => computeHandle(newValue, oldValue);
    }
  ]);
  return Object.defineProperty(Object.create(null), "value", {get: () => value});
}

function makeCallback(depsHandle, functor) {
  return makeMemo(depsHandle, functor, false);
}