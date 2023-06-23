import neo4j, { Node, Relationship, Integer } from 'neo4j-driver'

type ITagNode = Node<
  Integer,
  {
    name: string
    id: string
  }
>

export type ITag = ITagNode['properties']

export type IIngredientNode = Node<
  Integer,
  {
    name: string
    id: string
  }
>

export type IIngredient = IIngredientNode['properties']

export type ICategoryNode = Node<
  Integer,
  {
    name: string
    id: string
  }
>

export type ICategory = ICategoryNode['properties']

export type IRecipeNode = Node<
  Integer,
  {
    name: string
    method: string
    picture: string
    id: string
  }
>

export type IRecipe = IRecipeNode['properties']

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
