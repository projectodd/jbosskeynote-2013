#!/usr/bin/env bash

if [ "$TORQUEBOX_HOME" = "" ]; then
    echo "\$TORQUEBOX_HOME not set. exiting."
    exit 1
fi

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

JRUBY_HOME=$TORQUEBOX_HOME/jruby

$JRUBY_HOME/bin/jruby -S bundle install
$JRUBY_HOME/bin/jruby -S rake db:setup
$JRUBY_HOME/bin/jruby -S torquebox deploy

