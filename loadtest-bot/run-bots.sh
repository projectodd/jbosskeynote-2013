#!/bin/bash

export MAVEN_OPTS="-Xmx8192m"

mvn clean install exec:java -Dbot.count=${1-100} -Dstart.interval=${2-120} -Djava.util.logging.config.file=logging.properties
