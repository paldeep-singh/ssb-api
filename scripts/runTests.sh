#!/bin/bash
set -e

STATUS=0

function runIntegrationTests {
  # Setup local DynamoDB instance
  docker compose -f ./docker/admin-user.db.yml up -d 

  # If the test fails, we still want the teardown to run.
  # So we set STATUS to 1 and allow the script to proceed.
  yarn run jest "$@" --testRegex=\\.integration.test\\.ts$

  # Teardown local DynamoDB instance
  docker-compose -f ./docker/admin-user.db.yml down
}

function runUnitTests {
  yarn run jest "$@" --testRegex=\\.test\\.ts$ --testPathIgnorePatterns=..*/__tests__/.*/.*.test.ts || STATUS=1
}

function runAllTests {
  # Setup local DynamoDB instance
  docker compose -f ./docker/admin-user.db.yml up -d 

  # If the test fails, we still want the teardown to run.
  # So we set STATUS to 1 and allow the script to proceed.
  yarn run jest "$@" --testPathPattern=.*.test.ts || STATUS=1

  # Teardown local DynamoDB instance
  docker-compose -f ./docker/admin-user.db.yml down
}

if (( "$#" != 0 ))
then
  TEST_TYPE="$1"
  shift
  if [ $TEST_TYPE = "integration" ] 
  then
    runIntegrationTests "$@"
  elif [ $TEST_TYPE = "unit" ] 
  then
    runUnitTests "$@"
  elif [ $TEST_TYPE = "all" ] 
  then
    runAllTests "$@"
  else
    STATUS=1
    echo "Valid values for test type are 'unit', 'integration', or 'all', but '$TEST_TYPE' was received"
  fi
else
  STATUS=1
  echo "Must pass in an argument for test type ('unit', 'integration', or 'all')"
fi


exit $STATUS