#!/usr/bin/env bash

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
export VERTX_HOME="$BASE_DIR/vert.x-1.3.1.final"

echo "PWD: $PWD"
echo "VERTX_HOME: $VERTX_HOME"

if [ -z "$TORQUEBOX_HOST" ]; then
  TORQUEBOX_HOST="bam.keynote.projectodd.org"
fi

echo "Using '$TORQUEBOX_HOST' as the TorqueBox host. Override via TORQUEBOX_HOST"

export JAVA_OPTS="$JAVA_OPTS -DtorqueboxHost=$TORQUEBOX_HOST"

cd $BASE_DIR
$VERTX_HOME/bin/vertx run  ./server.js  -cluster -cluster-port 25502 -cluster-host 127.0.0.1 
