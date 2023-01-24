#!/bin/bash

source mocha_setup.sh

if [ $# -gt 0 ]; then
  mocha --require=`dirname $0`/mocha_init.js $*
else
  mocha --require=`dirname $0`/mocha_init.js "$DIR"'/**/*.spec.js'
fi


# NOTE: This file was copied from tests/server/mocha_wrapper.sh (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
