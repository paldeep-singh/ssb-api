
//Import Recipes, ingredients and tags, create ingredient relationships, and create tag relationships
CALL apoc.load.csv("file:///data/testRecipes.csv", {header: true,
    mapping:{
        idMeal: {type: 'int'},
        ingredientList: {array:true, arraySep: ','},
        tags: {array:true, arraySep: ','},
        unitsList: {array:true, arraySep: ',', nullValues:['na'] },
        amountList: {array:true, arraySep:',', nullValues:['na'] },
        ingredientPrep: {array:true, arraySep: ',', nullValues:['na'] },
        mainIngredients: {array:true, arraySep: ','}
    }
})
YIELD map
WITH collect(map) AS recipe_collection
FOREACH (rc IN recipe_collection | 
    MERGE (r:Recipe {name: rc.name})
    FOREACH (ing IN range(0,size(rc.ingredientList)-1,1) |
        MERGE (i:Ingredient {name: rc.ingredientList[ing]})
        MERGE (r) - [c:CONTAINS_INGREDIENT] -> (i)
        SET c.unit = rc.unitsList[ing], c.preparation = rc.ingredientPrep[ing], c.amount = rc.amountList[ing], i.id = apoc.create.uuid()
        )
    FOREACH (tag in range(0,size(rc.tags)-1,1) |
        MERGE (t:Tag {name: rc.tags[tag]})
        MERGE (r) - [:HAS_TAG] -> (t) 
        SET t.id = apoc.create.uuid()
        )
    FOREACH (mainIng in range(0,size(rc.mainIngredients)-1,1) | 
        MERGE (mi:Ingredient {name: rc.mainIngredients[mainIng]})
        MERGE (r) - [:HAS_MAIN_INGREDIENT] -> (mi)
        SET mi.id = apoc.create.uuid()
        )
    SET r.id = apoc.create.uuid(), r.method = rc.steps, r.picture = rc.pictureLink
    );

// //Import tag categories
// CALL apoc.load.csv("file:///data/testTags.csv", {header: true,
//     mapping:{
//        categoryName : {type: 'str'},
//        tagName: {type: 'str'}
//     }
// })
// YIELD map
// WITH collect(map) AS tag_collection
// MATCH 
// FOREACH (tc IN tag_collection |
//     MERGE (c:Category {name: tc.categoryName})
//     MERGE (t:Tag {name: tc.tagName})
//     ON MATCH SET (t) - [:IS_A] -> (c)
//     ON CREATE SET (t) - [:IS_A] -> (c)
//     SET  c.id = apoc.create.uuid()
//     );

LOAD CSV WITH HEADERS FROM "file:///data/testTags.csv" AS row
MATCH (t:Tag {name: row.tagName})
MERGE (c:Category {name: row.categoryName})
MERGE (t) - [:IS_A] -> (c)
