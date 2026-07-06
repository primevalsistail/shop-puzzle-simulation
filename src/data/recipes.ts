import type { RecipeDef } from '../components/items/ItemRegistry.js'

export const ALL_RECIPES: RecipeDef[] = [
  {
    id: 'recipe_bread',
    name: 'パンを焼く',
    outputItemId: 'bread',
    outputQuantity: 3,
    ingredients: [{ itemId: 'flour', quantity: 2 }],
    durationMinutes: 5,
  },
  {
    id: 'recipe_wine',
    name: 'ワインを醸造する',
    outputItemId: 'wine',
    outputQuantity: 2,
    ingredients: [{ itemId: 'grape', quantity: 3 }],
    durationMinutes: 8,
  },
  {
    id: 'recipe_tomato_sauce',
    name: 'トマトソースを作る',
    outputItemId: 'tomato_sauce',
    outputQuantity: 3,
    ingredients: [{ itemId: 'tomato', quantity: 2 }],
    durationMinutes: 4,
  },
  {
    id: 'recipe_sandwich',
    name: 'サンドイッチを作る',
    outputItemId: 'sandwich',
    outputQuantity: 2,
    ingredients: [
      { itemId: 'bread', quantity: 1 },
      { itemId: 'tomato', quantity: 1 },
    ],
    durationMinutes: 3,
  },
  {
    id: 'recipe_book',
    name: '本を作る',
    outputItemId: 'book',
    outputQuantity: 1,
    ingredients: [
      { itemId: 'wood', quantity: 2 },
      { itemId: 'fabric', quantity: 1 },
    ],
    durationMinutes: 10,
  },
]
