# ssb-api

## Additional set up requirements
1. Docker
2. A default aws config to run local DynamoDB intgeration tests: https://github.com/dynamoose/dynamoose/issues/1534
3. Serverless-dynamodb-local requirements: https://www.serverless.com/plugins/serverless-dynamodb-local (we don't use Docker for this yet)
4. localRecipeDb/neo4j/import folder must be created for running against local neo4j and if contents need to be updated, it must be manually deleted using sudo
5. apoc and apoc extended jar files in localRecipeDb/plugins

## TODO
1. Migrate from Serverless to Terraform
    a. Improve the Neo4j docker setup
    b. Deploy Neo4j to ECS? 
3. Create Recipe database API routes
    a. Ingredients
    c. Recipes
    d. Categories
4. Think more about migrating to self-hosting Redis instance instead of Upstash? Is it worth it?
