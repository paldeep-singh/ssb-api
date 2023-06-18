cp -r ./localRecipeDb/import ./localRecipeDb/neo4j/import || echo "Could not copy import folder, delete the folder if it already exists"

docker compose -f ./docker/recipe.db.yml up -d

while ! curl http://localhost:7474/
do
  echo "$(date) - still trying"
  sleep 1
done
echo "$(date) - connected successfully"

docker exec --interactive recipe_db_local cypher-shell --file import/1.recipeImport.cypher -u neo4j -p pleaseletmein