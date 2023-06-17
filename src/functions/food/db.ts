import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  'neo4j://localhost',
  neo4j.auth.basic('neo4j', 'pleaseletmein')
)

export default driver
