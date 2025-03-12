import OpenAI from 'openai';
import Config from '../config/env';
import { 
  MealPlanOptions, 
  MealPlanResponse, 
  Meal, 
  NutritionalSummary,
  DietType,
  DietaryRestriction 
} from '../types/mealPlan';

class MealPlanService {
  private client: OpenAI;
  private static instance: MealPlanService;

  private constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: Config.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://nutrimind.app',
        'X-Title': 'NutriMind',
      },
    });
  }

  public static getInstance(): MealPlanService {
    if (!MealPlanService.instance) {
      MealPlanService.instance = new MealPlanService();
    }
    return MealPlanService.instance;
  }

  private getDietaryGuidelines(dietType?: DietType, restrictions?: DietaryRestriction[]): string {
    const guidelines: string[] = [];

    if (dietType) {
      switch (dietType) {
        case 'Vegan':
          guidelines.push('No animal products including meat, dairy, eggs, and honey');
          break;
        case 'Vegetarian':
          guidelines.push('No meat or fish, but can include dairy and eggs');
          break;
        case 'Low-Carb':
          guidelines.push('Limited carbohydrates (under 100g per day), focus on protein and healthy fats');
          break;
        case 'Keto':
          guidelines.push('Very low carb (under 50g), high fat (70-80%), moderate protein (20-25%)');
          break;
        case 'Paleo':
          guidelines.push('No processed foods, grains, legumes, or dairy. Focus on meat, fish, vegetables, fruits, and nuts');
          break;
      }
    }

    if (restrictions?.length) {
      restrictions.forEach(restriction => {
        switch (restriction) {
          case 'Gluten-Free':
            guidelines.push('No wheat, barley, rye, or any gluten-containing ingredients');
            break;
          case 'Dairy-Free':
            guidelines.push('No milk, cheese, yogurt, or any dairy products');
            break;
          case 'Nut-Free':
            guidelines.push('No nuts or nut-derived ingredients');
            break;
          case 'Soy-Free':
            guidelines.push('No soy or soy-derived ingredients');
            break;
        }
      });
    }

    return guidelines.join('. ');
  }

  private calculateMacroDistribution(targetCalories: number, dietType?: DietType): {
    protein: number;
    carbs: number;
    fat: number;
  } {
    let distribution = {
      protein: 0.25,
      carbs: 0.45,
      fat: 0.3
    };

    switch (dietType) {
      case 'Keto':
        distribution = { protein: 0.25, carbs: 0.05, fat: 0.7 };
        break;
      case 'Low-Carb':
        distribution = { protein: 0.3, carbs: 0.25, fat: 0.45 };
        break;
      case 'Vegan':
      case 'Vegetarian':
        distribution = { protein: 0.2, carbs: 0.55, fat: 0.25 };
        break;
      case 'Paleo':
        distribution = { protein: 0.35, carbs: 0.35, fat: 0.3 };
        break;
    }

    return {
      protein: Math.round((targetCalories * distribution.protein) / 4),
      carbs: Math.round((targetCalories * distribution.carbs) / 4),
      fat: Math.round((targetCalories * distribution.fat) / 9)
    };
  }

  private async generateMealPlanPrompt(options: MealPlanOptions): Promise<string> {
    const targetCalories = options.targetCalories || 2000;
    const macros = this.calculateMacroDistribution(targetCalories, options.dietType);
    const guidelines = this.getDietaryGuidelines(options.dietType, options.dietaryRestrictions);
    const mealTypes = options.mealTypes || ['breakfast', 'lunch', 'dinner', 'snacks'];
    const mealsPerDay = options.mealsPerDay || mealTypes.length;

    const excludedIngredients = options.excludeIngredients?.length
      ? `\nExclude these ingredients: ${options.excludeIngredients.join(', ')}`
      : '';

    const nutritionalFocus = options.nutritionalFocus?.length
      ? `\nNutritional focus areas: ${options.nutritionalFocus.join(', ')}`
      : '';

    return `Create a detailed meal plan as a JSON object with specific meals for ${mealTypes.join(', ')}.

DIETARY REQUIREMENTS:
- Target daily calories: ${targetCalories} calories
- Daily macro targets: ${macros.protein}g protein, ${macros.carbs}g carbs, ${macros.fat}g fat
- Number of meals: ${mealsPerDay}
- Diet type and restrictions: ${guidelines}${excludedIngredients}${nutritionalFocus}

For EACH MEAL, provide:
1. A SPECIFIC recipe name (not generic terms like "healthy breakfast" or "protein lunch")
2. Exact nutritional values (calories, protein, carbs, fat)
3. Detailed ingredients with precise measurements
4. Step-by-step cooking instructions
5. Preparation and cooking times
6. Serving size
7. Difficulty level
8. Relevant tags (e.g., "high-protein", "quick-prep", "vegetarian")

Additional requirements:
- Each meal should be realistic and practical to prepare
- Include variety in ingredients and cooking methods
- Balance the daily nutritional targets across all meals
- Consider preparation time and complexity
- Include practical tips for meal prep and storage

Return ONLY a JSON object with this structure:
{
  "breakfast": [{
    "name": string,
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "description": string,
    "ingredients": string[],
    "instructions": string[],
    "nutritionalHighlights": string[],
    "servingSize": string,
    "prepTime": string,
    "cookTime": string,
    "totalTime": string,
    "difficulty": "Easy" | "Medium" | "Hard",
    "mealType": "breakfast",
    "tags": string[]
  }],
  "lunch": [/* same structure as breakfast */],
  "dinner": [/* same structure as breakfast */],
  "snacks": [/* same structure as breakfast */],
  "nutritionalSummary": {
    "totalCalories": number,
    "totalProtein": number,
    "totalCarbs": number,
    "totalFat": number,
    "mealsCount": number,
    "averageCaloriesPerMeal": number,
    "macroPercentages": {
      "protein": number,
      "carbs": number,
      "fat": number
    }
  },
  "tips": string[],
  "shoppingList": [{
    "category": string,
    "items": string[]
  }],
  "warnings": string[]
}`;
  }

  private validateMeal(meal: any): Meal {
    return {
      name: String(meal.name || ''),
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      carbs: Number(meal.carbs) || 0,
      fat: Number(meal.fat) || 0,
      description: String(meal.description || ''),
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients.map(String) : [],
      instructions: Array.isArray(meal.instructions) ? meal.instructions.map(String) : [],
      nutritionalHighlights: Array.isArray(meal.nutritionalHighlights) ? meal.nutritionalHighlights.map(String) : [],
      servingSize: String(meal.servingSize || '1 serving'),
      prepTime: String(meal.prepTime || '15 minutes'),
      cookTime: String(meal.cookTime || '20 minutes'),
      totalTime: String(meal.totalTime || '35 minutes'),
      difficulty: ['Easy', 'Medium', 'Hard'].includes(meal.difficulty) ? meal.difficulty : 'Medium',
      mealType: ['breakfast', 'lunch', 'dinner', 'snack'].includes(meal.mealType) ? meal.mealType : 'snack',
      tags: Array.isArray(meal.tags) ? meal.tags.map(String) : []
    };
  }

  private validateNutritionalSummary(summary: any): NutritionalSummary {
    return {
      totalCalories: Number(summary.totalCalories) || 0,
      totalProtein: Number(summary.totalProtein) || 0,
      totalCarbs: Number(summary.totalCarbs) || 0,
      totalFat: Number(summary.totalFat) || 0,
      mealsCount: Number(summary.mealsCount) || 0,
      averageCaloriesPerMeal: Number(summary.averageCaloriesPerMeal) || 0,
      macroPercentages: {
        protein: Number(summary.macroPercentages?.protein) || 0,
        carbs: Number(summary.macroPercentages?.carbs) || 0,
        fat: Number(summary.macroPercentages?.fat) || 0
      }
    };
  }

  private validateResponse(response: any): MealPlanResponse {
    return {
      breakfast: Array.isArray(response.breakfast) ? response.breakfast.map((m: any) => this.validateMeal(m)) : [],
      lunch: Array.isArray(response.lunch) ? response.lunch.map((m: any) => this.validateMeal(m)) : [],
      dinner: Array.isArray(response.dinner) ? response.dinner.map((m: any) => this.validateMeal(m)) : [],
      snack: Array.isArray(response.snack) ? response.snack.map((m: any) => this.validateMeal(m)) : [],
      nutritionalSummary: this.validateNutritionalSummary(response.nutritionalSummary || {}),
      tips: Array.isArray(response.tips) ? response.tips.map(String) : [],
      shoppingList: Array.isArray(response.shoppingList) ? response.shoppingList.map((category: { category: string; items: string[] }) => ({
        category: String(category.category || ''),
        items: Array.isArray(category.items) ? category.items.map(String) : []
      })) : [],
      warnings: Array.isArray(response.warnings) ? response.warnings.map(String) : []
    };
  }

  public async generateMealPlan(options: MealPlanOptions): Promise<MealPlanResponse> {
    try {
      const prompt = await this.generateMealPlanPrompt(options);

      const completion = await this.client.chat.completions.create({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: `You are a professional nutritionist and chef specializing in creating detailed, practical meal plans. 
Your expertise includes:
- Creating specific, named recipes (never generic names)
- Calculating precise nutritional values
- Providing detailed, measured ingredients
- Writing clear, step-by-step instructions
- Balancing nutrition across meals
- Considering preparation time and difficulty
- Organizing shopping lists by category

Always provide complete, realistic meal plans that follow the exact format requested.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const responseText = completion.choices[0]?.message?.content?.trim();

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      try {
        const parsed = JSON.parse(responseText);
        return this.validateResponse(parsed);
      } catch (parseError) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          return this.validateResponse(extracted);
        }
        
        // If JSON parsing fails, try one more time with a simplified prompt
        const retryCompletion = await this.client.chat.completions.create({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            {
              role: 'system',
              content: 'You are a chef. Generate a meal plan following the exact JSON format requested.'
            },
            {
              role: 'user',
              content: `Generate a simplified meal plan with one meal for each type (breakfast, lunch, dinner, snack).
Each meal should include name, calories, macros, ingredients, and instructions.
Return ONLY valid JSON matching the format shown in the structure below:
${prompt.split('Return ONLY a JSON object with this structure:')[1]}`
            }
          ],
          temperature: 0.5,
          max_tokens: 4000
        });

        const retryText = retryCompletion.choices[0]?.message?.content?.trim();
        if (!retryText) {
          throw new Error('Failed to generate meal plan after retry');
        }

        const retryParsed = JSON.parse(retryText);
        return this.validateResponse(retryParsed);
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const mealPlanService = MealPlanService.getInstance(); 