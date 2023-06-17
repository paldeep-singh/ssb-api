
docker compose -f scripts/recipeDb/docker-compose.recipe.db.yml up -d

while ! curl http://localhost:7474/
do
  echo "$(date) - still trying"
  sleep 1
done
echo "$(date) - connected successfully"

docker exec --interactive recipe_db_local cypher-shell --file /var/lib/neo4j/import/1.recipeImport.cypher -u neo4j -p pleaseletmein