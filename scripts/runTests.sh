#!/bin/bash
set -e

STATUS=0

function runIntegrationTests {
  # Setup local DynamoDB instance
  docker compose -f ./docker/admin-user.db.yml up -d 
  ./scripts/localDb.sh

  # If the test fails, we still want the teardown to run.
  # So we set STATUS to 1 and allow the script to proceed.
  yarn run jest "$@" --testRegex=\\.integration.test\\.ts$ || STATUS=1

  # Teardown local DynamoDB instance
  docker-compose -f ./docker/admin-user.db.yml -f ./docker/recipe.db.yml down 
}

function runUnitTests {
  yarn run jest "$@" --testRegex=\\.test\\.ts$ --testPathIgnorePatterns=..*/__tests__/.*/.*.test.ts || STATUS=1
}

function runAllTests {
  # Setup local DynamoDB and Neo4J instances
  docker compose -f ./docker/admin-user.db.yml -f ./docker/recipe.db.yml up -d 
  ./scripts/localDb.sh

  # If the test fails, we still want the teardown to run.
  # So we set STATUS to 1 and allow the script to proceed.
  yarn run jest "$@" --testPathPattern=.*.test.ts || STATUS=1

  # Teardown local DynamoDB instance
  docker-compose -f ./docker/admin-user.db.yml -f ./docker/recipe.db.yml down
}

function runDynamoDBIntegrationTests {
  # Setup local DynamoDB instance
  docker compose -f ./docker/admin-user.db.yml up -d 

  # If the test fails, we still want the teardown to run.
  # So we set STATUS to 1 and allow the script to proceed.
  yarn run jest "$@" --testRegex=.*dynamodb\.integration\.test\.ts$ || STATUS=1

  # Teardown local DynamoDB instance
  docker-compose -f ./docker/admin-user.db.yml down
}

function runNeo4JTests {
  # Setup local Neo4J instance
  docker compose -f ./docker/recipe.db.yml up -d 
  ./scripts/localDb.sh

  # If the test fails, we still want the teardown to run.
  # So we set STATUS to 1 and allow the script to proceed.
  yarn run jest "$@" --testRegex=.*neo4j\.integration\.test\.ts$ || STATUS=1

  # Teardown local Neo4J instance
  docker-compose -f ./docker/recipe.db.yml down
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
  elif [ $TEST_TYPE = "dynamodb" ] 
  then
    runDynamoDBIntegrationTests "$@"
  elif [ $TEST_TYPE = "neo4j" ] 
  then
    runNeo4JTests "$@"
  else
    STATUS=1
    echo "Valid values for test type are 'unit', 'integration','all', 'dynamodb' or 'neo4j', but '$TEST_TYPE' was received"
  fi
else
  STATUS=1
  echo "Must pass in an argument for test type ('unit', 'integration', or 'all')"
fi


exit $STATUS