#!/usr/bin/env bash

cd $(dirname $0)
npm run build:app
cp src/config.js dist
cd dist
http-server -p 4000
