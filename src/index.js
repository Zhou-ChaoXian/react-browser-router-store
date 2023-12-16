"use strict";

import {registerGlobalPlugin, routerStoreRequestHookPlugin, routerStoreEffectPlugin} from "./store";

export * from "./components";
export * from "./core";
export {createRouterStore, registerGlobalPlugin} from "./store";

registerGlobalPlugin(routerStoreRequestHookPlugin);
registerGlobalPlugin(routerStoreEffectPlugin);