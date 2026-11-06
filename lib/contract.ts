export const RECIPEDECK_ABI = [
  {
    type: "function",
    name: "publishRecipe",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "category", type: "string" },
      { name: "ingredients", type: "string" },
      { name: "instructions", type: "string" },
      { name: "imageUrl", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "likeRecipe",
    stateMutability: "nonpayable",
    inputs: [{ name: "recipeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "unlikeRecipe",
    stateMutability: "nonpayable",
    inputs: [{ name: "recipeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "removeRecipe",
    stateMutability: "nonpayable",
    inputs: [{ name: "recipeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getAllRecipes",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "author", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "category", type: "string" },
          { name: "ingredients", type: "string" },
          { name: "instructions", type: "string" },
          { name: "imageUrl", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "likesCount", type: "uint256" },
          { name: "exists", type: "bool" },
          { name: "isDeleted", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getRecipe",
    stateMutability: "view",
    inputs: [{ name: "recipeId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "author", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "category", type: "string" },
          { name: "ingredients", type: "string" },
          { name: "instructions", type: "string" },
          { name: "imageUrl", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "likesCount", type: "uint256" },
          { name: "exists", type: "bool" },
          { name: "isDeleted", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getRecipesByAuthor",
    stateMutability: "view",
    inputs: [{ name: "author", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "author", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "category", type: "string" },
          { name: "ingredients", type: "string" },
          { name: "instructions", type: "string" },
          { name: "imageUrl", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "likesCount", type: "uint256" },
          { name: "exists", type: "bool" },
          { name: "isDeleted", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "hasUserLiked",
    stateMutability: "view",
    inputs: [
      { name: "recipeId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getPlatformStats",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "activeRecipes", type: "uint256" },
      { name: "totalLikes", type: "uint256" },
      { name: "totalPublishedEver", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "totalActiveRecipes",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalLikesCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "RecipePublished",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "author", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "category", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RecipeLiked",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "liker", type: "address", indexed: true },
      { name: "newLikesCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RecipeUnliked",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "unliker", type: "address", indexed: true },
      { name: "newLikesCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RecipeRemoved",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "author", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export interface RawRecipe {
  id: bigint;
  author: `0x${string}`;
  title: string;
  description: string;
  category: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  timestamp: bigint;
  likesCount: bigint;
  exists: boolean;
  isDeleted: boolean;
}

export interface FormattedRecipe {
  id: number;
  author: `0x${string}`;
  title: string;
  description: string;
  category: string;
  ingredients: string[];
  instructions: string[];
  rawIngredients: string;
  rawInstructions: string;
  imageUrl: string;
  timestamp: number;
  likesCount: number;
}

// Fallback address or configured address
export const DEFAULT_CONTRACT_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_RECIPEDECK_ADDRESS as `0x${string}`) ||
  "0x18222C792493bb0593bbce49bF3b8CBE77CBe106";

