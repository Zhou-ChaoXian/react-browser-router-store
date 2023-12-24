"use strict";

import {createContext} from "react";

export {
  Context,
  RouteContext,
  defaultFunction,
};

const Context = createContext(null);
const RouteContext = createContext(null);
const defaultFunction = (_ => _);