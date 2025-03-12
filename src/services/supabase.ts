import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { MealData } from '../types/meal';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Meal-related functions
export const addMeal = async (mealData: MealData) => {
  const { data, error } = await supabase
    .from('meals')
    .insert([{
      name: mealData.name,
      meal_type: mealData.meal_type,
      date: mealData.date,
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fat: mealData.fat,
      serving_size: mealData.serving_size || '1 serving',
      user_id: (await supabase.auth.getUser()).data.user?.id,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserMeals = async (date?: string) => {
  let query = supabase
    .from('meals')
    .select('*')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .order('created_at', { ascending: false });

  if (date) {
    // Add date filter if provided
    query = query.eq('date', date);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const deleteMeal = async (mealId: string) => {
  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', mealId)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

  if (error) throw error;
  return true;
}; 