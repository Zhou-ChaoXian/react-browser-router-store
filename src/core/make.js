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

function makeMemo(depsHandle, computeHandle, set, isFactory = true) {
  addEffect(({state, detail, options}) => [
    depsHandle(state),
    (newValue, oldValue) => {
      const value = isFactory ? computeHandle(newValue, oldValue) : () => computeHandle(newValue, oldValue);
      set({detail, options, value});
    }
  ]);
}

function makeCallback(depsHandle, functor, set) {
  makeMemo(depsHandle, functor, set, false);
}