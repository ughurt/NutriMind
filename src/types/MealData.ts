export interface MealData {
  name: string;
  meal_type: string; // Or a more specific type if meal types are fixed
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string; // Optional
  // Add any other relevant fields from the AI analysis response
} 