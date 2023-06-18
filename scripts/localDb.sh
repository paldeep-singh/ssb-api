cp -r ./localRecipeDb/import ./localRecipeDb/neo4j/import || echo "Could not copy import folder, delete the folder if it already exists"

docker compose -f ./docker/recipe.db.yml up -d


  echo "Waiting for neo4j to start"
while ! curl http://localhost:7474/ >> /dev/null 2>&1;
do
  sleep 1
done
echo "neo4j started"

echo "importing data"
docker exec --interactive recipe_db_local cypher-shell --file import/1.recipeImport.cypher -u neo4j -p pleaseletmein
echo "imported data"