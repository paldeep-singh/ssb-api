# ssb-api

Also see [ssb-backend-web-app](https://github.com/paldeep-singh/ssb-backend-web-app).

## Additional set up requirements
1. Docker
2. A default aws config to run local DynamoDB intgeration tests: https://github.com/dynamoose/dynamoose/issues/1534
3. Serverless-dynamodb-local requirements: https://www.serverless.com/plugins/serverless-dynamodb-local (we don't use Docker for this yet)
4. localRecipeDb/neo4j/import folder must be created for running against local neo4j and if contents need to be updated, it must be manually deleted using sudo
5. apoc and apoc extended jar files for neo4j must be downloaded and placed in localRecipeDb/plugins

## TODO
1. Migrate from Serverless to Terraform
    - Improve the Neo4j docker setup
    - Deploy Neo4j to ECS? 
3. Create Recipe database API routes
    - Ingredients
    - Recipes
    - Categories
4. Think more about migrating to self-hosting Redis instance instead of Upstash? Is it worth it?
5. Think more about expanding database schema


Current schema:
<br>
<img src="https://i.imgur.com/eaebdOb.png" height=600px></img>


Expanded schema:
<br>
<img src="https://i.imgur.com/oUG9AJ6.png" height=600px></img>
