container_id=$(docker run \
        -it --rm --detach \
        --publish=7474:7474 --publish=7687:7687 \
        --volume=$HOME/neo4j/data:/data \
        --volume=$PWD/import:/import \
        --env=NEO4J_PLUGINS='["apoc"]' \
        --env NEO4J_AUTH=none \
        neo4j
    )

echo "Container ID: $container_id"

# docker cp ./import/1.recipeImport.cypher $container_id:/import/1.recipeImport.cypher

# docker exec --interactive --tty ec053523c7867d0c293d3cc70e1f632e620186e8c0246a0474d53593fb8aa336 cypher-shell --file /import/1.recipeImport.cypher

# docker exec --interactive --tty $container_id \
#     cypher-shell -u neo4j -p neo4j \
#     --file /migrations/1.recipeImport.cypher

docker stop $container_id
