"use strict";

import {sync} from "glob";
import {rmSync, lstatSync, copyFileSync} from "node:fs";

sync("./dist/*").forEach(file => {
  lstatSync(file).isDirectory() && rmSync(file, {recursive: true, force: true});
});
copyFileSync("./src/index.d.ts", "./dist/index.d.ts");
process.exit(0);