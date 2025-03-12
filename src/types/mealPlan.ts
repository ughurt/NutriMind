import { MealSuggestion } from '../types/meal';

export type DietType = 'Regular Diet' | 'Vegan' | 'Vegetarian' | 'Low-Carb' | 'Keto' | 'Paleo';

export type DietaryRestriction = 'Gluten-Free' | 'Dairy-Free' | 'Nut-Free' | 'Soy-Free';

export interface MealPlanOptions {
  targetCalories?: number;
  dietType?: DietType;
  dietaryRestrictions?: DietaryRestriction[];
  nutritionalFocus?: string[];
  mealsPerDay?: number;
  excludeIngredients?: string[];
  randomSeed?: number;
  timestamp?: number;
  mealTypes?: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'>;
}

export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  ingredients: string[];
  instructions: string[];
  nutritionalHighlights: string[];
  servingSize: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tags: string[];
}

export interface NutritionalSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealsCount: number;
  averageCaloriesPerMeal: number;
  macroPercentages: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MealPlanResponse {
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
  snack: Meal[];
  nutritionalSummary: NutritionalSummary;
  tips: string[];
  shoppingList: {
    category: string;
    items: string[];
  }[];
  warnings?: string[];
} 