"use strict";

import {createContext} from "react";

export {
  Context,
  RouteContext,
  defaultFunction,
  judgeUseKeepalive,
  isUseKeepAlive,
};

const Context = createContext(null);
const RouteContext = createContext(null);
const defaultFunction = (_ => _);
const judgeUseKeepalive = {flag: true};
const isUseKeepAlive = Symbol();