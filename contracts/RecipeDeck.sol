// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RecipeDeck
 * @notice Decentralized recipe-sharing platform where users publish their favourite recipes
 *         and explore meals shared by others on-chain.
 * Tagline: "Good Food. Shared Stories."
 */
contract RecipeDeck {
    struct Recipe {
        uint256 id;
        address author;
        string title;
        string description;
        string category;
        string ingredients;
        string instructions;
        string imageUrl;
        uint256 timestamp;
        uint256 likesCount;
        bool exists;
        bool isDeleted;
    }

    uint256 private _recipeIdCounter;
    uint256 public totalActiveRecipes;
    uint256 public totalLikesCount;

    // recipeId => Recipe
    mapping(uint256 => Recipe) private _recipes;

    // recipeId => user address => bool
    mapping(uint256 => mapping(address => bool)) private _hasLiked;

    // Events
    event RecipePublished(
        uint256 indexed id,
        address indexed author,
        string title,
        string category,
        uint256 timestamp
    );
    event RecipeLiked(
        uint256 indexed id,
        address indexed liker,
        uint256 newLikesCount
    );
    event RecipeUnliked(
        uint256 indexed id,
        address indexed unliker,
        uint256 newLikesCount
    );
    event RecipeRemoved(
        uint256 indexed id,
        address indexed author,
        uint256 timestamp
    );

    // Custom Errors
    error RecipeNotFound();
    error RecipeAlreadyDeleted();
    error NotAuthor();
    error EmptyTitle();
    error EmptyCategory();
    error EmptyIngredients();
    error EmptyInstructions();
    error AlreadyLiked();
    error NotLikedYet();

    /**
     * @notice Publish a new recipe to RecipeDeck.
     * @param title Title of the recipe.
     * @param description Brief culinary description or story.
     * @param category Food category (e.g., Breakfast, Lunch, Dinner, Dessert, Vegetarian, etc.).
     * @param ingredients Formatted ingredients list.
     * @param instructions Step-by-step cooking instructions.
     * @param imageUrl Optional image URL or photo reference.
     * @return id The generated unique recipe ID.
     */
    function publishRecipe(
        string memory title,
        string memory description,
        string memory category,
        string memory ingredients,
        string memory instructions,
        string memory imageUrl
    ) external returns (uint256) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(category).length == 0) revert EmptyCategory();
        if (bytes(ingredients).length == 0) revert EmptyIngredients();
        if (bytes(instructions).length == 0) revert EmptyInstructions();

        unchecked {
            _recipeIdCounter++;
        }
        uint256 newId = _recipeIdCounter;

        Recipe storage r = _recipes[newId];
        r.id = newId;
        r.author = msg.sender;
        r.title = title;
        r.description = description;
        r.category = category;
        r.ingredients = ingredients;
        r.instructions = instructions;
        r.imageUrl = imageUrl;
        r.timestamp = block.timestamp;
        r.likesCount = 0;
        r.exists = true;
        r.isDeleted = false;

        totalActiveRecipes++;

        emit RecipePublished(newId, msg.sender, title, category, block.timestamp);
        return newId;
    }

    /**
     * @notice Like a published recipe. Duplicate likes from the same wallet are prevented.
     * @param recipeId The ID of the recipe to like.
     */
    function likeRecipe(uint256 recipeId) external {
        Recipe storage recipe = _recipes[recipeId];
        if (!recipe.exists) revert RecipeNotFound();
        if (recipe.isDeleted) revert RecipeAlreadyDeleted();
        if (_hasLiked[recipeId][msg.sender]) revert AlreadyLiked();

        _hasLiked[recipeId][msg.sender] = true;
        recipe.likesCount++;
        totalLikesCount++;

        emit RecipeLiked(recipeId, msg.sender, recipe.likesCount);
    }

    /**
     * @notice Unlike a previously liked recipe.
     * @param recipeId The ID of the recipe to unlike.
     */
    function unlikeRecipe(uint256 recipeId) external {
        Recipe storage recipe = _recipes[recipeId];
        if (!recipe.exists) revert RecipeNotFound();
        if (recipe.isDeleted) revert RecipeAlreadyDeleted();
        if (!_hasLiked[recipeId][msg.sender]) revert NotLikedYet();

        _hasLiked[recipeId][msg.sender] = false;
        if (recipe.likesCount > 0) {
            recipe.likesCount--;
        }
        if (totalLikesCount > 0) {
            totalLikesCount--;
        }

        emit RecipeUnliked(recipeId, msg.sender, recipe.likesCount);
    }

    /**
     * @notice Remove a recipe. Only the original author can remove their recipe.
     * @param recipeId The ID of the recipe to remove.
     */
    function removeRecipe(uint256 recipeId) external {
        Recipe storage recipe = _recipes[recipeId];
        if (!recipe.exists) revert RecipeNotFound();
        if (recipe.isDeleted) revert RecipeAlreadyDeleted();
        if (recipe.author != msg.sender) revert NotAuthor();

        recipe.isDeleted = true;
        if (totalActiveRecipes > 0) {
            totalActiveRecipes--;
        }

        emit RecipeRemoved(recipeId, msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieve a single recipe by its ID.
     * @param recipeId ID of the recipe.
     */
    function getRecipe(uint256 recipeId) external view returns (Recipe memory) {
        Recipe memory recipe = _recipes[recipeId];
        if (!recipe.exists) revert RecipeNotFound();
        return recipe;
    }

    /**
     * @notice Retrieve all active (non-deleted) published recipes.
     * @return activeRecipes An array containing all currently active recipes.
     */
    function getAllRecipes() external view returns (Recipe[] memory) {
        uint256 activeCount = totalActiveRecipes;
        Recipe[] memory activeRecipes = new Recipe[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= _recipeIdCounter; i++) {
            if (_recipes[i].exists && !_recipes[i].isDeleted) {
                activeRecipes[currentIndex] = _recipes[i];
                currentIndex++;
                if (currentIndex == activeCount) {
                    break;
                }
            }
        }

        return activeRecipes;
    }

    /**
     * @notice Check if a user has liked a specific recipe.
     * @param recipeId ID of the recipe.
     * @param user Address of the user.
     */
    function hasUserLiked(uint256 recipeId, address user) external view returns (bool) {
        return _hasLiked[recipeId][user];
    }

    /**
     * @notice Get recipes published by a specific author.
     * @param author Address of the author.
     */
    function getRecipesByAuthor(address author) external view returns (Recipe[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= _recipeIdCounter; i++) {
            if (_recipes[i].exists && !_recipes[i].isDeleted && _recipes[i].author == author) {
                count++;
            }
        }

        Recipe[] memory authorRecipes = new Recipe[](count);
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= _recipeIdCounter; i++) {
            if (_recipes[i].exists && !_recipes[i].isDeleted && _recipes[i].author == author) {
                authorRecipes[currentIndex] = _recipes[i];
                currentIndex++;
            }
        }

        return authorRecipes;
    }

    /**
     * @notice Get platform wide statistics.
     */
    function getPlatformStats() external view returns (
        uint256 activeRecipes,
        uint256 totalLikes,
        uint256 totalPublishedEver
    ) {
        return (totalActiveRecipes, totalLikesCount, _recipeIdCounter);
    }
}
