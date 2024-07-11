#!/bin/sh

echo "Downloading Blackduck script detect.sh"
wget ${BLACKDUCK_DETECT_URL} -O detect.sh
/bin/bash ./detect.sh --blackduck.url=${BLACKDUCK_URL} --blackduck.api.token=${BLACKDUCK_TOKEN} \
 --blackduck.trust.cert=true --detect.project.name=${CI_PROJECT_NAMESPACE}/${CI_PROJECT_NAME} \
 --detect.project.version.name=${CI_PIPELINE_ID} --detect.tools=DETECTOR --blackduck.timeout=1200
