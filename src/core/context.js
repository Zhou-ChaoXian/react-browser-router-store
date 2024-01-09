"use strict";

import {createContext} from "react";

export {
  Context,
  RouteContext,
  defaultFunction,
  RouteViewsContext,
};

const Context = createContext(null);
const RouteContext = createContext(null);
const defaultFunction = (_ => _);
const RouteViewsContext = createContext(null);