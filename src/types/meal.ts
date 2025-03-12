export interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  nutritionalHighlights: string[];
  prepTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tips: string[];
  alternatives: string[];