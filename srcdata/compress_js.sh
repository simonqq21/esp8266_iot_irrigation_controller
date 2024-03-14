#!/bin/bash 
uglifyjs script.js -mo s.js 
uglifyjs configModule.mjs -mo cfgMod.mjs
uglifyjs websocketModule.mjs -mo wsMod.mjs
uglifyjs uiControllerModule.mjs -mo uicMod.mjs
uglifyjs callbackModule.mjs -mo cbMod.mjs