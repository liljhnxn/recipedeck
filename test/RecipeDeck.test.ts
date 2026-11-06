import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { RecipeDeck } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RecipeDeck Smart Contract", function () {
  let recipeDeck: RecipeDeck;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const RecipeDeckFactory = await ethers.getContractFactory("RecipeDeck");
    recipeDeck = await RecipeDeckFactory.deploy();
    await recipeDeck.waitForDeployment();
  });

  describe("Publishing Recipes", function () {
    it("should publish a recipe successfully and emit RecipePublished event", async function () {
      const title = "Rustic Sourdough Boule";
      const description = "Artisanal crusty golden sourdough with airy crumb.";
      const category = "Bakery";
      const ingredients = "500g Bread Flour\n350g Lukewarm Water\n100g Active Starter\n10g Sea Salt";
      const instructions = "1. Autolyse flour and water.\n2. Fold in starter and salt.\n3. Bulk ferment 4h with stretch & folds.\n4. Shape and bake in Dutch oven at 230°C.";
      const imageUrl = "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80";

      const tx = await recipeDeck.connect(user1).publishRecipe(
        title,
        description,
        category,
        ingredients,
        instructions,
        imageUrl
      );

      await expect(tx)
        .to.emit(recipeDeck, "RecipePublished")
        .withArgs(1, user1.address, title, category, (await ethers.provider.getBlock("latest"))?.timestamp);

      const recipe = await recipeDeck.getRecipe(1);
      expect(recipe.id).to.equal(1n);
      expect(recipe.author).to.equal(user1.address);
      expect(recipe.title).to.equal(title);
      expect(recipe.description).to.equal(description);
      expect(recipe.category).to.equal(category);
      expect(recipe.ingredients).to.equal(ingredients);
      expect(recipe.instructions).to.equal(instructions);
      expect(recipe.imageUrl).to.equal(imageUrl);
      expect(recipe.likesCount).to.equal(0n);
      expect(recipe.isDeleted).to.be.false;

      const stats = await recipeDeck.getPlatformStats();
      expect(stats.activeRecipes).to.equal(1n);
      expect(stats.totalPublishedEver).to.equal(1n);
    });

    it("should revert if required fields are empty", async function () {
      await expect(
        recipeDeck.connect(user1).publishRecipe("", "desc", "Dinner", "ingr", "instr", "")
      ).to.be.revertedWithCustomError(recipeDeck, "EmptyTitle");

      await expect(
        recipeDeck.connect(user1).publishRecipe("Title", "desc", "", "ingr", "instr", "")
      ).to.be.revertedWithCustomError(recipeDeck, "EmptyCategory");

      await expect(
        recipeDeck.connect(user1).publishRecipe("Title", "desc", "Dinner", "", "instr", "")
      ).to.be.revertedWithCustomError(recipeDeck, "EmptyIngredients");

      await expect(
        recipeDeck.connect(user1).publishRecipe("Title", "desc", "Dinner", "ingr", "", "")
      ).to.be.revertedWithCustomError(recipeDeck, "EmptyInstructions");
    });
  });

  describe("Retrieving Recipes", function () {
    it("should return all active recipes", async function () {
      await recipeDeck.connect(user1).publishRecipe("Recipe A", "Desc A", "Breakfast", "Eggs", "Scramble", "");
      await recipeDeck.connect(user2).publishRecipe("Recipe B", "Desc B", "Lunch", "Bread", "Toast", "");

      const all = await recipeDeck.getAllRecipes();
      expect(all.length).to.equal(2);
      expect(all[0].title).to.equal("Recipe A");
      expect(all[1].title).to.equal("Recipe B");
    });

    it("should filter by author correctly", async function () {
      await recipeDeck.connect(user1).publishRecipe("Recipe 1", "Desc", "Lunch", "Salad", "Toss", "");
      await recipeDeck.connect(user2).publishRecipe("Recipe 2", "Desc", "Dinner", "Steak", "Sear", "");
      await recipeDeck.connect(user1).publishRecipe("Recipe 3", "Desc", "Dessert", "Chocolate", "Melt", "");

      const user1Recipes = await recipeDeck.getRecipesByAuthor(user1.address);
      expect(user1Recipes.length).to.equal(2);
      expect(user1Recipes[0].title).to.equal("Recipe 1");
      expect(user1Recipes[1].title).to.equal("Recipe 3");
    });
  });

  describe("Liking and Unliking", function () {
    beforeEach(async function () {
      await recipeDeck.connect(user1).publishRecipe("Creamy Risotto", "Mushroom risotto", "Dinner", "Rice, broth", "Stir", "");
    });

    it("should allow a user to like a recipe and emit RecipeLiked event", async function () {
      const tx = await recipeDeck.connect(user2).likeRecipe(1);
      await expect(tx)
        .to.emit(recipeDeck, "RecipeLiked")
        .withArgs(1, user2.address, 1n);

      const recipe = await recipeDeck.getRecipe(1);
      expect(recipe.likesCount).to.equal(1n);

      const hasLiked = await recipeDeck.hasUserLiked(1, user2.address);
      expect(hasLiked).to.be.true;

      const stats = await recipeDeck.getPlatformStats();
      expect(stats.totalLikes).to.equal(1n);
    });

    it("should prevent duplicate likes from the same wallet", async function () {
      await recipeDeck.connect(user2).likeRecipe(1);

      await expect(
        recipeDeck.connect(user2).likeRecipe(1)
      ).to.be.revertedWithCustomError(recipeDeck, "AlreadyLiked");
    });

    it("should allow unliking a previously liked recipe and emit RecipeUnliked event", async function () {
      await recipeDeck.connect(user2).likeRecipe(1);

      const tx = await recipeDeck.connect(user2).unlikeRecipe(1);
      await expect(tx)
        .to.emit(recipeDeck, "RecipeUnliked")
        .withArgs(1, user2.address, 0n);

      const recipe = await recipeDeck.getRecipe(1);
      expect(recipe.likesCount).to.equal(0n);

      const hasLiked = await recipeDeck.hasUserLiked(1, user2.address);
      expect(hasLiked).to.be.false;

      const stats = await recipeDeck.getPlatformStats();
      expect(stats.totalLikes).to.equal(0n);
    });

    it("should revert if unliking when not liked yet", async function () {
      await expect(
        recipeDeck.connect(user2).unlikeRecipe(1)
      ).to.be.revertedWithCustomError(recipeDeck, "NotLikedYet");
    });
  });

  describe("Removing Recipes", function () {
    beforeEach(async function () {
      await recipeDeck.connect(user1).publishRecipe("Tiramisu", "Classic dessert", "Dessert", "Mascarpone", "Layer", "");
    });

    it("should allow only the author to remove the recipe and emit RecipeRemoved", async function () {
      const tx = await recipeDeck.connect(user1).removeRecipe(1);
      await expect(tx)
        .to.emit(recipeDeck, "RecipeRemoved")
        .withArgs(1, user1.address, (await ethers.provider.getBlock("latest"))?.timestamp);

      const all = await recipeDeck.getAllRecipes();
      expect(all.length).to.equal(0);

      const stats = await recipeDeck.getPlatformStats();
      expect(stats.activeRecipes).to.equal(0n);
      expect(stats.totalPublishedEver).to.equal(1n);

      const recipe = await recipeDeck.getRecipe(1);
      expect(recipe.isDeleted).to.be.true;
    });

    it("should revert if non-author tries to remove the recipe", async function () {
      await expect(
        recipeDeck.connect(user2).removeRecipe(1)
      ).to.be.revertedWithCustomError(recipeDeck, "NotAuthor");
    });

    it("should revert if trying to remove an already deleted recipe", async function () {
      await recipeDeck.connect(user1).removeRecipe(1);
      await expect(
        recipeDeck.connect(user1).removeRecipe(1)
      ).to.be.revertedWithCustomError(recipeDeck, "RecipeAlreadyDeleted");
    });
  });
});
