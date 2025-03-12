import { USDA_API_KEY } from '../config/keys';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface FoodItem {
  fdcId: string;
  description: string;
  servingSize?: number;
  servingSizeUnit?: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const foodApi = {
  async searchFoods(query: string): Promise<FoodItem[]> {
    try {
      console.log('Searching with query:', query); // Debug log
      
      const response = await fetch(
        `${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=25&dataType=Survey (FNDDS)`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        return [];
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      if (!data.foods || !Array.isArray(data.foods)) {
        console.error('Unexpected API response format:', data);
        return [];
      }

      return data.foods
        .map((food: any) => {
          try {
            const nutrients = {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
            };

            food.foodNutrients?.forEach((nutrient: any) => {
              switch (nutrient.nutrientId) {
                case 1008: // Energy (kcal)
                  nutrients.calories = Math.round(nutrient.value || 0);
                  break;
                case 1003: // Protein
                  nutrients.protein = Math.round(nutrient.value || 0);
                  break;
                case 1005: // Carbohydrates
                  nutrients.carbs = Math.round(nutrient.value || 0);
                  break;
                case 1004: // Total lipids (fat)
                  nutrients.fat = Math.round(nutrient.value || 0);
                  break;
              }
            });

            return {
              fdcId: food.fdcId?.toString() || '',
              description: food.description || 'Unknown Food',
              servingSize: 100,
              servingSizeUnit: 'g',
              nutrients,
            };
          } catch (error) {
            console.error('Error parsing food item:', error);
            return null;
          }
        })
        .filter((food): food is FoodItem => 
          food !== null && 
          food.fdcId !== '' && 
          food.nutrients.calories > 0
        );
    } catch (error) {
      console.error('Error searching foods:', error);
      return [];
    }
  },

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing API connection...'); // Debug log
      const results = await this.searchFoods('apple');
      console.log('Test search results:', results);
      return results.length > 0;
    } catch (error) {
      console.error('API test failed:', error);
      return false;
    }
  },
}; 