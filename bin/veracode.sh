#!/bin/bash

wget https://downloads.veracode.com/securityscan/pipeline-scan-LATEST.zip -O pipeline-scan-latest.zip
unzip -n pipeline-scan-latest.zip
java -jar pipeline-scan.jar --veracode_api_id ${VERACODE_ID} --veracode_api_key ${VERACODE_TOKEN} --file ndm.tar.gz -bf bin/veracode_baseline.json
