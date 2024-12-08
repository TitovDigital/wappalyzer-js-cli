#!/bin/sh

google-chrome-stable 2>/dev/null &

/bin/sh /lambda-entrypoint.sh "lambda.handler"