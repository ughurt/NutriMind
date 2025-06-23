import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Database } from '../types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  meal_type: MealType;
  date: string;
  created_at: string;
}

export interface PreviousMeal extends Omit<Meal, 'user_id'> {
  lastUsed: string;
}

export interface NewMeal {
  name: string;
  calories: string;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  meal_type: MealType;
  date?: string;
}

export interface EditMeal extends NewMeal {
  id: string;
}

export type MealUpdate = Partial<NewMeal>;

const PREVIOUS_MEALS_KEY = 'previous_meals';

export const useMeals = (initialDate: Date) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [previousMeals, setPreviousMeals] = useState<PreviousMeal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadPreviousMeals = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('previous_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Ensure all dates are properly formatted
      const formattedData = data?.map(meal => ({
        ...meal,
        last_used: meal.last_used ? new Date(meal.last_used).toISOString() : new Date().toISOString(),
        created_at: meal.created_at ? new Date(meal.created_at).toISOString() : new Date().toISOString()
      })) || [];
      
      setPreviousMeals(formattedData);
    } catch (err) {
      console.error('Error loading previous meals:', err);
    }
  }, [user]);

  const savePreviousMeal = useCallback(async (meal: Meal) => {
    if (!user) return;
    try {
      const previousMeal = {
        id: meal.id,
        user_id: user.id,
        name: meal.name,
        calories: Math.round(Number(meal.calories)),
        protein: meal.protein !== null ? Math.round(Number(meal.protein)) : null,
        carbs: meal.carbs !== null ? Math.round(Number(meal.carbs)) : null,
        fat: meal.fat !== null ? Math.round(Number(meal.fat)) : null,
        meal_type: meal.meal_type,
        date: meal.date,
        created_at: meal.created_at,
        last_used: new Date().toISOString()
      };

      console.log('Saving previous meal:', previousMeal);

      const { error } = await supabase
        .from('previous_meals')
        .upsert(previousMeal, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) throw error;
      await loadPreviousMeals();
    } catch (err) {
      console.error('Error saving previous meal:', err);
    }
  }, [user, loadPreviousMeals]);

  const fetchMealsForDateRange = useCallback(async (date: Date) => {
    if (!user) return [];

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    }
  }, [user]);

  const refreshMeals = useCallback(async (date: Date = initialDate) => {
    const data = await fetchMealsForDateRange(date);
    setMeals(data);
  }, [fetchMealsForDateRange, initialDate]);

  const addMeal = useCallback(async (meal: NewMeal) => {
    if (!user) return;

    try {
      const { data, error: insertError } = await supabase
        .from('meals')
        .insert([{
          ...meal,
          calories: Math.round(Number(meal.calories)),
          protein: meal.protein ? Math.round(Number(meal.protein)) : null,
          carbs: meal.carbs ? Math.round(Number(meal.carbs)) : null,
          fat: meal.fat ? Math.round(Number(meal.fat)) : null,
          user_id: user.id,
          date: meal.date || format(new Date(), 'yyyy-MM-dd'),
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        await savePreviousMeal(data);
      }
      await refreshMeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal');
      throw err;
    }
  }, [user, refreshMeals, savePreviousMeal]);

  const updateMeal = useCallback(async (id: string, updates: MealUpdate) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      await refreshMeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meal');
      throw err;
    }
  }, [user, refreshMeals]);

  const deleteMeal = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      await refreshMeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal');
      throw err;
    }
  }, [user, refreshMeals]);

  useEffect(() => {
    loadPreviousMeals();
  }, [loadPreviousMeals]);

  useEffect(() => {
    refreshMeals(initialDate);
  }, [refreshMeals, initialDate]);

  return {
    meals,
    previousMeals,
    error,
    refreshMeals,
    addMeal,
    updateMeal,
    deleteMeal,
    clearError: () => setError(null),
    fetchMealsForDateRange,
  };
}; 