import OpenAI from 'openai';
import Config from '../config/env';
import { MealPlanOptions, MealPlanResponse, Meal, NutritionalSummary, DietaryRestriction } from '../types/mealPlan';
import { MealSuggestion } from '../types/meal';
import * as FileSystem from 'expo-file-system';

interface FoodPrediction {
  className: string;
  probability: number;
}

interface FoodAnalysis {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  nutritionalHighlights: string[];
  tips: string[];
  // UI enhancement fields
  emoji: string;
  color: string;
  confidence: {
    score: number;
    message: string;
    color: string;
  };
  visualization: {
    macroChart: {
      protein: number;
      carbs: number;
      fat: number;
    };
    servingSize: {
      visual: string;
      comparison: string;
    };
  };
  feedback: {
    message: string;
    type: 'success' | 'warning' | 'info';
    suggestions: string[];
  };
  badges: Array<{
    text: string;
    color: string;
    icon: string;
  }>;
}

interface SimpleFoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  confidence: number;
}

interface DetailedFoodAnalysis {
  mainDish: string;
  ingredients: Array<{
    name: string;
    amount: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  servingSize: string;
  confidence: number;
}

class AiService {
  private client: OpenAI;
  private static instance: AiService;
  private lastAnalyzedMeal: DetailedFoodAnalysis | null = null;
  private messageHistory: { role: 'user' | 'assistant' | 'system', content: string }[] = [];

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

  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  private async generatePrompt(query: string, category?: string): Promise<string> {
    if (category === 'meal-plan') {
      return `As a nutrition expert, provide a unique and creative meal suggestion based on this query: "${query}".
Please avoid repeating previous suggestions and ensure variety in your recommendations.
Consider the time of day, dietary preferences mentioned, and aim for diverse cuisines and ingredients.

Please provide a response in this JSON format:
{
  "name": "Recipe name",
  "description": "Brief description of the meal",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "time",
  "difficulty": "Easy|Medium|Hard",
  "nutritionalHighlights": ["highlight 1", "highlight 2"],
  "tips": ["tip 1", "tip 2"],
  "alternatives": ["alternative 1", "alternative 2"]
}`;
    }

    return `As a nutrition and health expert, provide a helpful response to: "${query}". 
Focus on being informative, practical, and evidence-based. 
If discussing nutrition, include specific details about nutrients, benefits, and practical tips.
If discussing workouts, include specific exercise recommendations and safety considerations.
Keep the response clear, concise, and actionable.
Consider the context of our previous conversation to provide more relevant and personalized advice.`;
  }

  public async generateResponse(
    query: string, 
    category?: string,
    conversationHistory?: { role: 'user' | 'assistant' | 'system', content: string }[]
  ): Promise<string | MealSuggestion> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = await this.generatePrompt(query, category);
        
        // Combine provided history with existing history
        const fullHistory = [
          ...(conversationHistory || []),
          { role: 'user' as const, content: prompt }
        ];

        // Keep only the last 10 messages to maintain context without overloading
        const limitedHistory = fullHistory.slice(-10);

        const completion = await this.client.chat.completions.create({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            {
              role: 'system' as const,
              content: 'You are a professional nutritionist and health expert providing specific, practical advice. Maintain context from previous messages and ensure variety in meal suggestions.'
            },
            ...limitedHistory.map(msg => ({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: msg.content
            }))
          ],
          ...Config.API_CONFIG.parameters.general,
          temperature: 0.8, // Increased temperature for more variety
          presence_penalty: 0.6, // Increased to reduce repetition
          frequency_penalty: 0.6, // Increased to encourage diverse vocabulary
        });

        const responseText = completion.choices[0]?.message?.content?.trim();
        
        if (!responseText) {
          throw new Error('Empty response from AI model');
        }

        // For meal plan requests, try to parse as JSON
        if (category === 'meal-plan') {
          try {
            // First check if the response contains a JSON structure
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              // If no JSON found, treat as regular text response
              return responseText;
            }
            
            const parsed = JSON.parse(jsonMatch[0]);
            return this.validateMealSuggestion(parsed);
          } catch (error) {
            console.log('JSON parse error:', error);
            // If JSON parsing fails, return the text response
            return responseText;
          }
        }

        // For other categories, return the text response directly
        return responseText;

      } catch (error) {
        console.log('AI service error:', error);
        const apiError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt === maxRetries) {
          throw new Error(`Failed to generate response: ${apiError.message}`);
        }
        lastError = apiError;
      }
    }

    throw lastError || new Error('Failed to generate response');
  }

  private validateMealSuggestion(suggestion: any): MealSuggestion {
    return {
      name: String(suggestion.name || ''),
      description: String(suggestion.description || ''),
      calories: Number(suggestion.calories) || 0,
      protein: Number(suggestion.protein) || 0,
      carbs: Number(suggestion.carbs) || 0,
      fat: Number(suggestion.fat) || 0,
      ingredients: Array.isArray(suggestion.ingredients) ? suggestion.ingredients.map(String) : [],
      instructions: Array.isArray(suggestion.instructions) ? suggestion.instructions.map(String) : [],
      nutritionalHighlights: Array.isArray(suggestion.nutritionalHighlights) ? suggestion.nutritionalHighlights.map(String) : [],
      prepTime: String(suggestion.prepTime || '15 minutes'),
      difficulty: ['Easy', 'Medium', 'Hard'].includes(suggestion.difficulty) ? suggestion.difficulty : 'Medium',
      tips: Array.isArray(suggestion.tips) ? suggestion.tips.map(String) : [],
      alternatives: Array.isArray(suggestion.alternatives) ? suggestion.alternatives.map(String) : [],
    };
  }

  private getDietaryGuidelines(dietType?: string, restrictions?: string[]): string {
    const guidelines: string[] = [];

    if (dietType) {
      switch (dietType.toLowerCase()) {
        case 'vegan':
          guidelines.push('No animal products including meat, dairy, eggs, and honey');
          break;
        case 'vegetarian':
          guidelines.push('No meat or fish, but can include dairy and eggs');
          break;
        case 'low-carb':
          guidelines.push('Limited carbohydrates (under 100g per day), focus on protein and healthy fats');
          break;
        case 'keto':
          guidelines.push('Very low carb (under 50g), high fat (70-80%), moderate protein (20-25%)');
          break;
        case 'paleo':
          guidelines.push('No processed foods, grains, legumes, or dairy. Focus on meat, fish, vegetables, fruits, and nuts');
          break;
      }
    }

    if (restrictions?.length) {
      restrictions.forEach(restriction => {
        switch (restriction.toLowerCase()) {
          case 'gluten-free':
            guidelines.push('No wheat, barley, rye, or any gluten-containing ingredients');
            break;
          case 'dairy-free':
            guidelines.push('No milk, cheese, yogurt, or any dairy products');
            break;
          case 'nut-free':
            guidelines.push('No nuts or nut-derived ingredients');
            break;
          case 'soy-free':
            guidelines.push('No soy or soy-derived ingredients');
            break;
        }
      });
    }

    return guidelines.join('. ');
  }

  private calculateMacroDistribution(targetCalories: number, dietType?: string): {
    protein: number;
    carbs: number;
    fat: number;
  } {
    let distribution = {
      protein: 0.25,
      carbs: 0.45,
      fat: 0.3
    };

    switch (dietType?.toLowerCase()) {
      case 'keto':
        distribution = { protein: 0.25, carbs: 0.05, fat: 0.7 };
        break;
      case 'low-carb':
        distribution = { protein: 0.3, carbs: 0.25, fat: 0.45 };
        break;
      case 'vegan':
      case 'vegetarian':
        distribution = { protein: 0.2, carbs: 0.55, fat: 0.25 };
        break;
      case 'paleo':
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
    const mealTypes = options.mealTypes || ['breakfast', 'lunch', 'dinner', 'snack'];

    return `Generate a meal plan with these requirements:

Target: ${targetCalories} calories
Macros: ${macros.protein}g protein, ${macros.carbs}g carbs, ${macros.fat}g fat
Restrictions: ${guidelines}
${options.nutritionalFocus?.length ? `Focus: ${options.nutritionalFocus.join(', ')}` : ''}
${options.excludeIngredients?.length ? `Exclude: ${options.excludeIngredients.join(', ')}` : ''}

For each meal, provide:
1. Specific recipe name
2. Exact nutrition (calories, protein, carbs, fat)
3. Ingredients with measurements
4. Cooking instructions
5. Prep time and difficulty

Return a JSON object with this structure for ${mealTypes.join(', ')}:
{
  "breakfast": [{
    "name": "specific recipe name",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": ["step 1", "step 2"],
    "prepTime": "time",
    "difficulty": "Easy|Medium|Hard",
    "tags": []
  }],
  "lunch": [/* same structure */],
  "dinner": [/* same structure */],
  "snack": [/* same structure */],
  "nutritionalSummary": {
    "totalCalories": number,
    "totalProtein": number,
    "totalCarbs": number,
    "totalFat": number
  }
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
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = await this.generateMealPlanPrompt(options);
        
        const completion = await this.client.chat.completions.create({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            {
              role: 'system',
              content: 'You are a professional nutritionist creating specific meal plans. Always return complete, valid JSON with specific recipe names and exact nutritional values.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: attempt === 1 ? 0.7 : 0.5,
          max_tokens: 3000,
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
        } catch (error) {
          const parseError = error instanceof Error ? error : new Error('JSON parse error');
          if (attempt === maxRetries) {
            throw new Error(`Failed to parse AI response: ${parseError.message}`);
          }
          lastError = parseError;
          continue;
        }
      } catch (error) {
        const apiError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt === maxRetries) {
          throw new Error(`Failed to generate meal plan after ${maxRetries} attempts: ${apiError.message}`);
        }
        lastError = apiError;
      }
    }

    throw lastError || new Error('Failed to generate meal plan');
  }

  private async estimateCalories(predictions: FoodPrediction[]): Promise<number> {
    // Basic calorie estimation logic
    const calorieEstimates: { [key: string]: number } = {
      'plate': 0,
      'meal': 600,
      'dish': 500,
      'food': 400,
      'salad': 200,
      'dessert': 300,
      'fruit': 100,
      'vegetable': 50
    };

    let totalCalories = 0;
    let confidenceSum = 0;

    predictions.forEach(pred => {
      Object.entries(calorieEstimates).forEach(([key, calories]) => {
        if (pred.className.toLowerCase().includes(key)) {
          totalCalories += calories * pred.probability;
          confidenceSum += pred.probability;
        }
      });
    });

    return confidenceSum > 0 ? Math.round(totalCalories / confidenceSum) : 400;
  }

  private getNutritionDatabases(): string[] {
    return [
      'USDA National Nutrient Database',
      'European Food Information Resource (EuroFIR)',
      'Japanese Food Composition Database (MEXT)',
      'Canadian Nutrient File (CNF)',
      'Australian Food Composition Database'
    ];
  }

  private getCommonFoodCategories(): { [key: string]: { 
    calorieFactor: number,
    proteinRange: [number, number],
    carbsRange: [number, number],
    fatRange: [number, number],
    servingSizeGrams: number,
    caloriesPerServing: [number, number],
    visualCues: string[],
    examples: string[]
  }} {
    return {
      'apple': {
        calorieFactor: 0.52,
        proteinRange: [0.2, 0.5],
        carbsRange: [13, 16],
        fatRange: [0.1, 0.3],
        servingSizeGrams: 182, // Medium apple
        caloriesPerServing: [90, 110],
        visualCues: ['round shape', 'smooth skin', 'stem or leaf', 'depression at top/bottom'],
        examples: ['Red Delicious', 'Gala', 'Fuji', 'Granny Smith']
      },
      'banana': {
        calorieFactor: 0.89,
        proteinRange: [1.0, 1.5],
        carbsRange: [22, 28],
        fatRange: [0.2, 0.4],
        servingSizeGrams: 118, // Medium banana
        caloriesPerServing: [100, 120],
        visualCues: ['curved elongated shape', 'yellow skin', 'brown spots when ripe', 'stem end'],
        examples: ['Cavendish', 'Baby Banana', 'Plantain']
      },
      'orange': {
        calorieFactor: 0.47,
        proteinRange: [0.7, 1.2],
        carbsRange: [11, 14],
        fatRange: [0.1, 0.3],
        servingSizeGrams: 131, // Medium orange
        caloriesPerServing: [60, 80],
        visualCues: ['round shape', 'orange color', 'dimpled peel', 'navel end'],
        examples: ['Navel', 'Valencia', 'Mandarin']
      },
      'chicken_breast': {
        calorieFactor: 1.65,
        proteinRange: [25, 35],
        carbsRange: [0, 2],
        fatRange: [2, 6],
        servingSizeGrams: 172, // 6 oz
        caloriesPerServing: [160, 200],
        visualCues: ['white/pale color', 'muscle striations', 'uniform thickness'],
        examples: ['Grilled Chicken Breast', 'Baked Chicken Breast', 'Pan-Seared Chicken']
      },
      'salmon': {
        calorieFactor: 2.08,
        proteinRange: [20, 25],
        carbsRange: [0, 1],
        fatRange: [10, 15],
        servingSizeGrams: 178, // 6 oz
        caloriesPerServing: [350, 400],
        visualCues: ['pink/orange color', 'white lines', 'flaky texture'],
        examples: ['Atlantic Salmon', 'Sockeye Salmon', 'Coho Salmon']
      },
      'rice': {
        calorieFactor: 1.3,
        proteinRange: [4, 5],
        carbsRange: [44, 48],
        fatRange: [0.5, 1],
        servingSizeGrams: 158, // 1 cup cooked
        caloriesPerServing: [200, 220],
        visualCues: ['white/brown grains', 'fluffy texture', 'individual grains visible'],
        examples: ['White Rice', 'Brown Rice', 'Jasmine Rice']
      },
      'broccoli': {
        calorieFactor: 0.34,
        proteinRange: [2.5, 3.5],
        carbsRange: [6, 8],
        fatRange: [0.3, 0.5],
        servingSizeGrams: 91, // 1 cup
        caloriesPerServing: [30, 40],
        visualCues: ['green florets', 'tree-like structure', 'thick stem'],
        examples: ['Raw Broccoli', 'Steamed Broccoli', 'Roasted Broccoli']
      },
      'mixed_salad': {
        calorieFactor: 0.25,
        proteinRange: [1, 3],
        carbsRange: [3, 7],
        fatRange: [0.2, 2],
        servingSizeGrams: 100,
        caloriesPerServing: [15, 30],
        visualCues: ['mixed greens', 'various colors', 'leafy texture'],
        examples: ['Garden Salad', 'Spring Mix', 'Caesar Salad']
      }
    };
  }

  private getFoodEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'apple': '🍎',
      'banana': '🍌',
      'orange': '🍊',
      'chicken_breast': '🍗',
      'salmon': '🐟',
      'rice': '🍚',
      'broccoli': '🥦',
      'mixed_salad': '🥗'
    };
    return emojiMap[category] || '🍽';
  }

  private getFoodColor(category: string): string {
    const colorMap: { [key: string]: string } = {
      'apple': '#FF6B6B',
      'banana': '#FFD93D',
      'orange': '#FF9F43',
      'chicken_breast': '#FF8787',
      'salmon': '#FDA7DF',
      'rice': '#F8F9FA',
      'broccoli': '#6BCB77',
      'mixed_salad': '#95CD41'
    };
    return colorMap[category] || '#4A90E2';
  }

  private getConfidenceDetails(score: number): { message: string; color: string } {
    if (score >= 0.9) {
      return { message: 'Very confident', color: '#4CAF50' };
    } else if (score >= 0.7) {
      return { message: 'Confident', color: '#2196F3' };
    } else if (score >= 0.5) {
      return { message: 'Moderately confident', color: '#FFC107' };
    } else {
      return { message: 'Low confidence', color: '#F44336' };
    }
  }

  private generateBadges(analysis: any, categoryInfo: any): Array<{ text: string; color: string; icon: string }> {
    const badges = [];
    
    // Nutritional badges
    if (analysis.nutritionalValues.protein > categoryInfo.proteinRange[1] * 0.8) {
      badges.push({ text: 'High Protein', color: '#4CAF50', icon: '💪' });
    }
    if (analysis.nutritionalValues.carbs < categoryInfo.carbsRange[1] * 0.5) {
      badges.push({ text: 'Low Carb', color: '#2196F3', icon: '🥖' });
    }
    if (analysis.nutritionalValues.fat < categoryInfo.fatRange[1] * 0.5) {
      badges.push({ text: 'Low Fat', color: '#FFC107', icon: '🥑' });
    }

    // Quality badges
    if (analysis.confidence.identificationScore > 0.9) {
      badges.push({ text: 'Clear Photo', color: '#4CAF50', icon: '📸' });
    }
    if (analysis.portionAnalysis.confidence > 0.8) {
      badges.push({ text: 'Accurate Portion', color: '#2196F3', icon: '⚖️' });
    }

    return badges;
  }

  private getFeedback(analysis: any, categoryInfo: any): { message: string; type: 'success' | 'warning' | 'info'; suggestions: string[] } {
    const confidenceScore = analysis.confidence || 0;
    
    if (confidenceScore > 0.8) {
      return {
        message: 'Great photo! Analysis is highly accurate.',
        type: 'success',
        suggestions: ['Keep taking clear, well-lit photos like this!']
      };
    } else if (confidenceScore > 0.6) {
      return {
        message: 'Good photo, but could be better.',
        type: 'info',
        suggestions: [
          'Try taking the photo from directly above',
          'Ensure good lighting',
          'Include the entire plate in the frame'
        ]
      };
    } else {
      return {
        message: 'Photo quality could be improved for better analysis.',
        type: 'warning',
        suggestions: [
          'Ensure good lighting',
          'Center the food in the frame',
          'Avoid blurry photos',
          'Use a solid-colored plate for better contrast'
        ]
      };
    }
  }

  public async analyzeFoodPhoto(uri: string): Promise<FoodAnalysis> {
    try {
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await this.client.chat.completions.create({
        model: Config.API_CONFIG.models.nutrition,
        messages: [
          {
            role: 'system',
            content: 'You are a precise food analysis AI. Your task is to analyze food images and return nutritional information. Focus only on identifying ingredients and their nutritional values. You must ONLY return a JSON object with no additional text, no markdown formatting, and no explanations.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food photo. Return ONLY a JSON object with this EXACT structure, no other text:\n{\n  "mainDish": string,\n  "ingredients": [{\n    "name": string,\n    "amount": string,\n    "calories": number,\n    "protein": number,\n    "carbs": number,\n    "fat": number\n  }],\n  "totalNutrition": {\n    "calories": number,\n    "protein": number,\n    "carbs": number,\n    "fat": number\n  },\n  "servingSize": string,\n  "confidence": number\n}'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      let responseText = response.choices[0]?.message?.content?.trim() || '';
      
      if (!responseText) {
        throw new Error('Empty response from AI');
      }

      // Clean up the response text to ensure we get valid JSON
      try {
        // Remove any markdown code blocks
        responseText = responseText.replace(/```json\s*|\s*```/g, '');
        
        // Find the first { and last }
        const startIndex = responseText.indexOf('{');
        const endIndex = responseText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
          throw new Error('No JSON object found in response');
        }
        
        // Extract just the JSON part
        const jsonStr = responseText.slice(startIndex, endIndex + 1);
        
        // Parse the JSON
        const analysis: DetailedFoodAnalysis = JSON.parse(jsonStr);
        
        // Validate the required fields
        if (!analysis.mainDish || !Array.isArray(analysis.ingredients) || !analysis.totalNutrition) {
          throw new Error('Invalid response structure');
        }
        
        // Store the analysis for future questions
        this.lastAnalyzedMeal = analysis;
        
        return this.processAnalysis(analysis);
      } catch (error: any) {
        console.error('Error parsing response:', error, 'Raw response:', responseText);
        throw new Error(`Failed to parse AI response: ${error.message}`);
      }

    } catch (error: any) {
      console.error('Error in analyzeFoodPhoto:', error);
      this.lastAnalyzedMeal = null;
      return this.getSimpleFallbackResponse(error.message || 'Failed to analyze photo');
    }
  }

  private processAnalysis(analysis: DetailedFoodAnalysis): FoodAnalysis {
    // Ensure analysis is a valid object
    if (!analysis || typeof analysis !== 'object') {
      return this.getSimpleFallbackResponse('Invalid analysis format');
    }

    // Create a validated analysis object with default values
    const validatedAnalysis = {
      mainDish: String(analysis.mainDish || 'Unknown Dish'),
      ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients.map(ing => ({
        name: String(ing?.name || 'Unknown'),
        amount: String(ing?.amount || 'Unknown'),
        calories: Number(ing?.calories) || 0,
        protein: Number(ing?.protein) || 0,
        carbs: Number(ing?.carbs) || 0,
        fat: Number(ing?.fat) || 0
      })) : [],
      totalNutrition: {
        calories: Number(analysis.totalNutrition?.calories) || 0,
        protein: Number(analysis.totalNutrition?.protein) || 0,
        carbs: Number(analysis.totalNutrition?.carbs) || 0,
        fat: Number(analysis.totalNutrition?.fat) || 0
      },
      servingSize: String(analysis.servingSize || 'Unknown'),
      confidence: Number(analysis.confidence) || 0.5
    };

    // Calculate total calories if not provided
    const totalCalories = validatedAnalysis.totalNutrition.calories || 
      validatedAnalysis.ingredients.reduce((sum, ing) => sum + ing.calories, 0);

    // Create the final FoodAnalysis object with safe defaults
    return {
      name: this.getFoodEmoji(validatedAnalysis.mainDish) + ' ' + validatedAnalysis.mainDish,
      description: `${validatedAnalysis.mainDish}

📊 Nutritional Information
┌──────────────────────
│ Calories: ${Math.round(totalCalories)} kcal
│ Protein:  ${Math.round(validatedAnalysis.totalNutrition.protein)}g
│ Carbs:    ${Math.round(validatedAnalysis.totalNutrition.carbs)}g
│ Fat:      ${Math.round(validatedAnalysis.totalNutrition.fat)}g
└──────────────────────

🥗 Ingredients:
${validatedAnalysis.ingredients.map(i => `• ${i.name} (${i.amount}): ${i.calories} cal`).join('\n')}

Would you like me to add this meal to your diary?`,
      calories: Math.round(totalCalories),
      protein: Math.round(validatedAnalysis.totalNutrition.protein * 10) / 10,
      carbs: Math.round(validatedAnalysis.totalNutrition.carbs * 10) / 10,
      fat: Math.round(validatedAnalysis.totalNutrition.fat * 10) / 10,
      servingSize: validatedAnalysis.servingSize,
      nutritionalHighlights: [
        ...this.getDetailedHighlights(validatedAnalysis.totalNutrition),
        ...validatedAnalysis.ingredients.map(ing => 
          `${ing.name}: ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`
        )
      ],
      tips: [
        `Total calories: ${Math.round(totalCalories)} cal`,
        `Protein: ${Math.round(validatedAnalysis.totalNutrition.protein)}g`,
        `Carbs: ${Math.round(validatedAnalysis.totalNutrition.carbs)}g`,
        `Fat: ${Math.round(validatedAnalysis.totalNutrition.fat)}g`
      ],
      emoji: this.getFoodEmoji(validatedAnalysis.mainDish),
      color: this.getFoodColor(validatedAnalysis.mainDish),
      confidence: {
        score: validatedAnalysis.confidence,
        message: this.getConfidenceDetails(validatedAnalysis.confidence).message,
        color: this.getConfidenceDetails(validatedAnalysis.confidence).color
      },
      visualization: {
        macroChart: {
          protein: Math.round((validatedAnalysis.totalNutrition.protein * 4 / (totalCalories || 1)) * 100),
          carbs: Math.round((validatedAnalysis.totalNutrition.carbs * 4 / (totalCalories || 1)) * 100),
          fat: Math.round((validatedAnalysis.totalNutrition.fat * 9 / (totalCalories || 1)) * 100)
        },
        servingSize: {
          visual: this.getFoodEmoji(validatedAnalysis.mainDish),
          comparison: validatedAnalysis.servingSize
        }
      },
      feedback: this.getFeedback(validatedAnalysis, this.getCommonFoodCategories()[validatedAnalysis.mainDish]),
      badges: this.getDetailedBadges(validatedAnalysis)
    };
  }

  private getDetailedHighlights(nutrition: { calories: number; protein: number; carbs: number; fat: number }): string[] {
    const highlights = [];
    
    if (nutrition.protein >= 20) highlights.push('Very high in protein');
    else if (nutrition.protein >= 10) highlights.push('Good source of protein');
    
    if (nutrition.carbs < 20) highlights.push('Low carb meal');
    else if (nutrition.carbs >= 50) highlights.push('High carb meal');
    
    if (nutrition.fat < 10) highlights.push('Low fat meal');
    else if (nutrition.fat >= 20) highlights.push('High fat meal');
    
    return highlights;
  }

  private getDetailedBadges(analysis: DetailedFoodAnalysis): Array<{ text: string; color: string; icon: string }> {
    const badges = [];
    
    // Nutritional badges
    if (analysis.totalNutrition.protein >= 20) {
      badges.push({ text: 'High Protein', color: '#4CAF50', icon: '💪' });
    }
    if (analysis.totalNutrition.carbs < 20) {
      badges.push({ text: 'Low Carb', color: '#2196F3', icon: '🥖' });
    }
    if (analysis.totalNutrition.fat < 10) {
      badges.push({ text: 'Low Fat', color: '#FFC107', icon: '🥑' });
    }
    
    // Ingredient count badge
    if (analysis.ingredients.length >= 5) {
      badges.push({ text: 'Complex Dish', color: '#9C27B0', icon: '👨‍🍳' });
    }
    
    // Confidence badge
    if (analysis.confidence >= 0.8) {
      badges.push({ text: 'Accurate Analysis', color: '#4CAF50', icon: '✅' });
    }
    
    return badges;
  }

  private getEmoji(foodName: string): string {
    const name = foodName.toLowerCase();
    if (name.includes('apple')) return '🍎';
    if (name.includes('banana')) return '🍌';
    if (name.includes('orange')) return '🍊';
    if (name.includes('chicken')) return '🍗';
    if (name.includes('salad')) return '🥗';
    if (name.includes('rice')) return '🍚';
    if (name.includes('bread')) return '🍞';
    if (name.includes('egg')) return '🥚';
    if (name.includes('meat') || name.includes('beef')) return '🥩';
    if (name.includes('fish') || name.includes('salmon')) return '🐟';
    return '🍽';
  }

  private getSimpleFallbackResponse(error: string): FoodAnalysis {
    return {
      name: '❌ Analysis Failed',
      description: error,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: 'Unknown',
      nutritionalHighlights: ['Analysis failed'],
      tips: [
        'Please try again with a clearer photo',
        'Ensure good lighting',
        'Take photo from directly above'
      ],
      emoji: '❌',
      color: '#F44336',
      confidence: {
        score: 0,
        message: 'Analysis failed',
        color: '#F44336'
      },
      visualization: {
        macroChart: { protein: 0, carbs: 0, fat: 0 },
        servingSize: { visual: '❌', comparison: 'Unknown' }
      },
      feedback: {
        message: 'Analysis failed',
        type: 'warning',
        suggestions: ['Please try again with a better photo']
      },
      badges: []
    };
  }

  public async askAboutMeal(question: string): Promise<string> {
    if (!this.lastAnalyzedMeal) {
      return "Please analyze a meal first before asking questions.";
    }

    try {
      const mealData = {
        dish: this.lastAnalyzedMeal.mainDish,
        ingredients: this.lastAnalyzedMeal.ingredients.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          nutrition: `${ing.calories}cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`
        })),
        total: {
          calories: this.lastAnalyzedMeal.totalNutrition.calories,
          protein: this.lastAnalyzedMeal.totalNutrition.protein,
          carbs: this.lastAnalyzedMeal.totalNutrition.carbs,
          fat: this.lastAnalyzedMeal.totalNutrition.fat
        },
        serving: this.lastAnalyzedMeal.servingSize
      };

      const response = await this.client.chat.completions.create({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: `You are a specialized meal analysis assistant. Your ONLY role is to answer questions about the specific meal that was just analyzed.

RESPONSE FORMATTING RULES:
1. For bold text, use <b>text</b> instead of asterisks
2. For headers, use <h2>Header</h2> instead of ##
3. For bullet points, use • at the start of the line
4. For measurements, use <code>number</code>

RESPONSE STRUCTURE:
1. Always include these sections:
   • <h2>Summary</h2> - Brief answer
   • <h2>Details</h2> - Specific values and ingredients
   • <h2>Additional Info</h2> - (only if using meal data)

CONTENT RULES:
1. ONLY use the meal data provided - no external knowledge
2. ALWAYS reference specific ingredients or values from the meal data
3. NO generic advice or suggestions
4. NO asking for more information
5. If you cannot answer using ONLY the meal data, say "I can only answer questions about the specific ingredients and nutrition values provided in the analysis."
6. Keep responses under 3 sections unless giving specific cooking steps`
          },
          {
            role: 'user',
            content: `ANALYZED MEAL DATA:
Main Dish: ${mealData.dish}
Serving Size: ${mealData.serving}

Ingredients and Their Nutrition:
${mealData.ingredients.map(ing => `• ${ing.name} (${ing.amount}): ${ing.nutrition}`).join('\n')}

Total Nutrition:
• Calories: ${mealData.total.calories}
• Protein: ${mealData.total.protein}g
• Carbs: ${mealData.total.carbs}g
• Fat: ${mealData.total.fat}g

Question about this specific meal: ${question}

Remember: 
1. Use HTML tags for formatting (<b>, <h2>, <code>)
2. Use • for bullet points
3. ONLY use the above meal data to answer
4. NO generic responses or external information`
          }
        ],
        temperature: 0.1,
        max_tokens: 250,
        presence_penalty: 0.6,
        frequency_penalty: 0.6
      });

      let answer = response.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';
      
      // Convert HTML-style formatting to proper Markdown
      answer = answer
        .replace(/<h2>(.*?)<\/h2>/g, '## $1') // Convert <h2> to ##
        .replace(/<b>(.*?)<\/b>/g, '**$1**') // Convert <b> to **
        .replace(/<code>(.*?)<\/code>/g, '`$1`') // Convert <code> to `
        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
        .replace(/- /g, '• ') // Convert basic bullets to fancy bullets
        .replace(/\*\*([\s\S]*?)\*\*/g, (match, p1) => `**${p1.trim()}**`) // Clean up bold text
        .trim();

      return answer;
    } catch (error: any) {
      console.error('Error in askAboutMeal:', error);
      return `Failed to answer question: ${error.message}`;
    }
  }

  public clearMealContext(): void {
    this.lastAnalyzedMeal = null;
  }
}

// Export a singleton instance
export const aiService = AiService.getInstance(); 