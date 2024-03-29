var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        console.log("user: "+ req.user_id +" just login");
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    const recipeFrom = req.body.recipeFrom;
    await user_utils.markAsFavorite(user_id,recipe_id,recipeFrom);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    if (recipes_id_array.length==0) {
      throw { status: 204, message: "No favorite recipes"};
    }
    const results = await recipe_utils.getRecipesPreview(recipes_id_array, user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

/**
 * This path returns the last watched recipes that were viewed by the logged-in user
 */
 router.get('/lastWatchedRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let last_watched_recipes = {};
    const recipes_id = await user_utils.getLastWatchedRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map(async(element) => recipes_id_array.push(element.recipeID)); //extracting the recipe ids into array
    if (recipes_id_array.length==0) {
      throw { status: 204, message: "No last watched recipes"};
    }
    const results = await recipe_utils.getRecipesPreview(recipes_id_array, user_id);
    
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
 router.get('/views', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    console.log("looking for user *" + user_id +"* last views");
    const views_recipes_id = await user_utils.getLastViewsRecipes(user_id);
    let views_recipes_id_array = [];
    for(i=0; i< views_recipes_id.length; i++)
    {
      console.log("i = " + i +":" + await views_recipes_id[i]['recipeID']);
      views_recipes_id_array.push(views_recipes_id[i]['recipeID']);
    }
    console.log("views_recipes_id_array" + views_recipes_id_array);
    //views_recipes_id.map((element) => views_recipes_id_array.push(element['recipeID'])); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(views_recipes_id_array, user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

router.post("/MyRecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    let user_details = {
      userID: user_id,
      title: req.body.title,
      readyInMinutes: req.body.readyInMinutes,
      image: req.body.image,
      popularity: req.body.popularity,
      vegan: req.body.vegan,
      vegetarian: req.body.vegetarian,
      glutenFree: req.body.glutenFree,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      servings: req.body.servings,
    }
    console.log(user_details);

    console.log("add new recipe to DB");
    await DButils.execQuery(
      `INSERT INTO myrecipes(userID, title, readyInMinutes, image, popularity, vegan, vegetarian, glutenFree, extendedIngredients, instructions, servings, favorite, view) 
      VALUES ('${user_details.userID}', '${user_details.title}', '${user_details.readyInMinutes}', '${user_details.image}','${user_details.popularity}','${user_details.vegan}','${user_details.vegetarian}', '${user_details.glutenFree} ', '${user_details.ingredients}', '${user_details.instructions} ', '${user_details.servings}', '0', '0')`
    );
    res.status(201).send({ message: "new recipe added", success: true });
  } catch (error) {
    next(error);
  }
});


/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
 router.get('/MyRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    console.log("looking for user *" + user_id +"* - private recipes!");
    const myRecipes = await user_utils.getMyRecipes(user_id);
    if (myRecipes.length==0) {
      throw { status: 204, message: "No my recipes"};
    }
    for(i=0; i< myRecipes.length; i++)
    {
      console.log("i = " + i +":" + await myRecipes[i]['id']);
    }
    res.status(200).send(myRecipes);
  } catch(error){
    next(error); 
  }
});
// ## Information: single id ###
/**
 * This path returns a full details of a recipe by its id
 */
 router.get("/recipe", async (req, res, next) => {

  try {
    const user_id = req.session.user_id;
    const recipe_id = req.query.recipeId;
    try{
      const recipe = await user_utils.getRecipeDetails(recipe_id);
     /* if(user_id !=undefined){
        //if(!user_id){
           console.log(user_id);
           await user_utils.markAsViewed(user_id,recipe_id);
        }*/
        res.send(recipe);
    }
    catch (error) {
      throw { status: 404, message: "recipe not found"};
    }
    
    
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the family recipes that were saved by the logged-in user
 */
 router.get('/familyRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    //let favorite_recipes = {};
    const recipes = await user_utils.getFamilyRecipes(user_id);
   // let recipes_id_array = [];
    //recipes.map((element) => recipes_id_array.push(''+element.recipe_id)); //extracting the recipe ids into array
    //const results = await recipe_utils.getRecipesPreview(recipes_id_array, user_id);
    res.status(200).send(recipes);
  } catch(error){
    next(error); 
  }
});

module.exports = router;
