import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Meal-related functions
export const addMeal = async (mealData: any) => {
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

// Shopping list functions
export const saveShoppingList = async (items: { name: string; checked: boolean }[]) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');
  // Remove all previous items for this user
  await supabase.from('shopping_list').delete().eq('user_id', user.id);
  // Insert new items
  const { data, error } = await supabase
    .from('shopping_list')
    .insert(items.map(item => ({
      name: item.name,
      checked: item.checked,
      user_id: user.id,
      created_at: new Date().toISOString(),
    })));
  if (error) throw error;
  return data;
};

export const getShoppingList = async () => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('shopping_list')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}; 