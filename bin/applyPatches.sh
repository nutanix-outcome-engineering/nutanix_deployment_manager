#!/bin/bash
patch -u -b  node_modules/@tus/server/dist/handlers/PatchHandler.js -i patchFiles/tus-patchHandler.patch
