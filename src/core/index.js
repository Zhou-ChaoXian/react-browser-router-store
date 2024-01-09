"use strict";

export {createBrowserRouter, createHashRouter, createReducerHandle, useRouter} from "./browserRouter.js";
export {makeEffect, makeMemo, makeCallback} from "./make.js";
export {lazy, lazyWithStore, createComponentWithStore} from "./lazy.js";
export * from "./optimize.js";
export {
  global,
  enhancer,
  wrapper,
  transition,
  keepalive,
  store,
  start,
  guardError,
  redirect,
  alias,
  max,
  views,
} from "./handleRoutes.js";