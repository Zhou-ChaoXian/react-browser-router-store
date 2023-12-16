"use strict";

import {sync} from "glob";
import {rmSync, lstatSync} from "node:fs";

sync("../dist/*").forEach(file => {
  lstatSync(file).isDirectory() && rmSync(file, {recursive: true, force: true});
});