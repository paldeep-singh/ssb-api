import neo4j, { Node, Relationship, Integer } from 'neo4j-driver'

export type ITag = Node<
  Integer,
  {
    name: string
    id: string
  }
>

export type IIngredient = Node<
  Integer,
  {
    name: string
    id: string
  }
>

export type ICategory = Node<
  Integer,
  {
    name: string
    id: string
  }
>

export type IRecipe = Node<
  Integer,
  {
    name: string
    method: string
    picture: string
    id: string
  }
>

export type IRecipeIngredient = Relationship<
  Integer,
  {
    unit: string
    preparation: string
    amount: number
    id: string
  }
>

const driver = neo4j.driver(
  'neo4j://localhost',
  neo4j.auth.basic('neo4j', 'pleaseletmein')
)

export default driver
