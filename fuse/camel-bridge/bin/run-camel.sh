#!/usr/bin/env bash

export CAMEL_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "PWD: $PWD"
echo "CAMEL_HOME: $CAMEL_HOME"

if [ -z "$TORQUEBOX_HOST" ]; then
  TORQUEBOX_HOST="bam.keynote.projectodd.org"
fi

echo "Using '$TORQUEBOX_HOST' as the TorqueBox host. Override via TORQUEBOX_HOST"

export MAVEN_OPTS="$JAVA_OPTS"
cd $CAMEL_HOME
mvn jetty:run -DbrokerHost="$TORQUEBOX_HOST" 

