import { USDA_API_KEY } from '../config/keys';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface FoodItem {
  fdcId: string;
  description: string;
  servingSize?: number;
  servingSizeUnit?: string;
  category?: string;
  isCommon?: boolean;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Common foods database for quick access to frequently used items
const COMMON_FOODS: FoodItem[] = [
  {
    fdcId: 'common-egg-1',
    description: 'Egg, whole, raw, fresh',
    servingSize: 50,
    servingSizeUnit: 'g',
    category: 'Eggs',
    isCommon: true,
    nutrients: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5.0 }
  },
  {
    fdcId: 'common-egg-2',
    description: 'Egg, whole, cooked, hard-boiled',
    servingSize: 50,
    servingSizeUnit: 'g',
    category: 'Eggs',
    isCommon: true,
    nutrients: { calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 }
  },
  {
    fdcId: 'common-chicken-1',
    description: 'Chicken breast, cooked, roasted',
    servingSize: 100,
    servingSizeUnit: 'g',
    category: 'Poultry',
    isCommon: true,
    nutrients: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }
  },
  {
    fdcId: 'common-chicken-2',
    description: 'Chicken leg, cooked, roasted',
    servingSize: 100,
    servingSizeUnit: 'g',
    category: 'Poultry',
    isCommon: true,
    nutrients: { calories: 184, protein: 26, carbs: 0, fat: 8.5 }
  },
  {
    fdcId: 'common-beef-1',
    description: 'Ground beef, 85% lean, cooked',
    servingSize: 100,
    servingSizeUnit: 'g',
    category: 'Meat',
    isCommon: true,
    nutrients: { calories: 218, protein: 26, carbs: 0, fat: 13 }
  },
  {
    fdcId: 'common-apple-1',
    description: 'Apple, raw, with skin',
    servingSize: 100,
    servingSizeUnit: 'g',
    category: 'Fruits',
    isCommon: true,
    nutrients: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 }
  },
  {
    fdcId: 'common-banana-1',
    description: 'Banana, raw',
    servingSize: 100,
    servingSizeUnit: 'g',
    category: 'Fruits',
    isCommon: true,
    nutrients: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }
  },
  {
    fdcId: 'common-rice-1',
    description: 'Rice, white, cooked',
    servingSize: 100,
    servingSizeUnit: 'g',
    category: 'Grains',
    isCommon: true,
    nutrients: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }
  },
  {
    fdcId: 'common-bread-1',
    description: 'Bread, whole wheat',
    servingSize: 30,
    servingSizeUnit: 'g',
    category: 'Grains',
    isCommon: true,
    nutrients: { calories: 81, protein: 4, carbs: 13.8, fat: 1.1 }
  },
  {
    fdcId: 'common-milk-1',
    description: 'Milk, whole, 3.25% milkfat',
    servingSize: 240,
    servingSizeUnit: 'ml',
    category: 'Dairy',
    isCommon: true,
    nutrients: { calories: 149, protein: 7.7, carbs: 11.7, fat: 7.9 }
  }
];

// Helper function to clean and normalize food descriptions
const normalizeDescription = (description: string): string => {
  return description
    .toLowerCase()
    .replace(/,\s*(raw|cooked|prepared|fried|boiled|roasted|baked)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper function to categorize foods
const categorizeFood = (description: string): string => {
  const lowerDesc = description.toLowerCase();
  
  if (/\begg(s)?\b/.test(lowerDesc)) return 'Eggs';
  if (/\b(chicken|turkey|duck|poultry)\b/.test(lowerDesc)) return 'Poultry';
  if (/\b(beef|pork|lamb|veal|steak)\b/.test(lowerDesc)) return 'Meat';
  if (/\b(apple|banana|orange|grape|berry|fruit)\b/.test(lowerDesc)) return 'Fruits';
  if (/\b(vegetable|carrot|broccoli|spinach|lettuce|tomato)\b/.test(lowerDesc)) return 'Vegetables';
  if (/\b(rice|bread|pasta|cereal|grain|wheat|oat)\b/.test(lowerDesc)) return 'Grains';
  if (/\b(milk|cheese|yogurt|dairy)\b/.test(lowerDesc)) return 'Dairy';
  if (/\b(fish|salmon|tuna|shrimp|seafood)\b/.test(lowerDesc)) return 'Seafood';
  if (/\b(oil|butter|margarine)\b/.test(lowerDesc)) return 'Fats & Oils';
  if (/\b(sugar|honey|syrup|sweet)\b/.test(lowerDesc)) return 'Sweeteners';
  if (/\b(nut|seed|almond|peanut)\b/.test(lowerDesc)) return 'Nuts & Seeds';
  if (/\b(bean|legume|lentil|pea)\b/.test(lowerDesc)) return 'Legumes';
  
  return 'Other';
};

export const foodApi = {
  async searchFoods(query: string): Promise<FoodItem[]> {
    try {
      console.log('Searching with query:', query);
      
      // First check common foods for a match
      const normalizedQuery = query.toLowerCase().trim();
      const commonFoodMatches = COMMON_FOODS.filter(food => 
        food.description.toLowerCase().includes(normalizedQuery)
      );
      
      // If we have good common food matches, include them but still fetch from API
      // Only return immediately for very specific short queries like "egg"
      if (commonFoodMatches.length > 0 && normalizedQuery.length > 2 && normalizedQuery.length < 5 && 
          commonFoodMatches.some(food => food.description.toLowerCase().startsWith(normalizedQuery))) {
        console.log('Found exact common food matches, but still fetching from API');
        // Don't return here, continue to API search
      }
      
      // Otherwise proceed with API search
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
        return commonFoodMatches; // Return common foods if API fails
      }

      const data = await response.json();
      
      if (!data.foods || !Array.isArray(data.foods)) {
        console.error('Unexpected API response format:', data);
        return commonFoodMatches; // Return common foods if API response is invalid
      }

      // Process and deduplicate foods
      const processedFoods = data.foods
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

            // Categorize the food
            const category = categorizeFood(food.description);
            
            // Clean up the description
            const cleanDescription = food.description
              .replace(/,\s*UPC.*$/, '') // Remove UPC codes
              .replace(/,\s*GTIN.*$/, '') // Remove GTIN codes
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();

            return {
              fdcId: food.fdcId?.toString() || '',
              description: cleanDescription || 'Unknown Food',
              servingSize: 100,
              servingSizeUnit: 'g',
              category,
              nutrients,
            };
          } catch (error) {
            console.error('Error parsing food item:', error);
            return null;
          }
        })
        .filter((food: any): food is FoodItem => 
          food !== null && 
          food.fdcId !== '' && 
          food.nutrients.calories > 0
        );
      
      // Less aggressive deduplication - only deduplicate exact matches
      const uniqueFoods = this.deduplicateFoods(processedFoods);
      
      // Combine with common foods if we have any matches
      const allFoods = [...commonFoodMatches, ...uniqueFoods];
      
      // Sort by relevance and limit to a reasonable number (max 15-20 items)
      const sortedResults = this.sortByRelevance(allFoods, normalizedQuery);
      return sortedResults.slice(0, 20); // Limit to 20 results for better UX
    } catch (error) {
      console.error('Error searching foods:', error);
      return [];
    }
  },
  
  // Helper method to deduplicate similar food items
  deduplicateFoods(foods: FoodItem[]): FoodItem[] {
    // Group by exact description match only
    const foodGroups = foods.reduce((groups: Record<string, FoodItem[]>, food: FoodItem) => {
      const key = food.description.toLowerCase();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(food);
      return groups;
    }, {});
    
    // For each group, keep just one item (the one with the most complete data)
    return Object.values(foodGroups).map(group => {
      // If there's only one item, return it
      if (group.length === 1) return group[0];
      
      // Otherwise, find the one with the most complete nutritional data
      return group.reduce((best, current) => {
        const bestScore = 
          (best.nutrients.calories > 0 ? 1 : 0) +
          (best.nutrients.protein > 0 ? 1 : 0) +
          (best.nutrients.carbs > 0 ? 1 : 0) +
          (best.nutrients.fat > 0 ? 1 : 0);
        
        const currentScore = 
          (current.nutrients.calories > 0 ? 1 : 0) +
          (current.nutrients.protein > 0 ? 1 : 0) +
          (current.nutrients.carbs > 0 ? 1 : 0) +
          (current.nutrients.fat > 0 ? 1 : 0);
        
        return currentScore > bestScore ? current : best;
      }, group[0]);
    });
  },
  
  // Helper method to sort foods by relevance to query
  sortByRelevance(foods: FoodItem[], query: string): FoodItem[] {
    return foods.sort((a, b) => {
      // Common foods always come first
      if (a.isCommon && !b.isCommon) return -1;
      if (!a.isCommon && b.isCommon) return 1;
      
      const aDesc = a.description.toLowerCase();
      const bDesc = b.description.toLowerCase();
      
      // Exact matches come first
      const aExactMatch = aDesc === query;
      const bExactMatch = bDesc === query;
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Starts with query comes next
      const aStartsWith = aDesc.startsWith(query);
      const bStartsWith = bDesc.startsWith(query);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Then sort by description length (shorter is better)
      return a.description.length - b.description.length;
    });
  },

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing API connection...');
      const results = await this.searchFoods('apple');
      console.log('Test search results:', results);
      return results.length > 0;
    } catch (error) {
      console.error('API test failed:', error);
      return false;
    }
  },
}; 