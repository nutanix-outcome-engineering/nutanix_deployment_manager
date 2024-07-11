#!/bin/bash

PROJECT_ROOT=$(git rev-parse --show-toplevel)

tar -C ${PROJECT_ROOT} -czf ndm.tar.gz bin/ src/ package.json package-lock.json
tar -C ${PROJECT_ROOT} -czf dependencies.tar.gz node_modules
