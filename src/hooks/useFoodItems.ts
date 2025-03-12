export interface FoodItem {
  fdcId: string;
  description: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const useFoodItems = () => {
  // Implementation will come later
  return {
    searchFoods: async (query: string): Promise<FoodItem[]> => {
      return [];
    }
  };
}; 