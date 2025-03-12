import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Goal {
  id?: string;
  type: 'calories' | 'protein' | 'carbs' | 'fat';
  target: number;
  user_id?: string;
  current?: number;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { user } = useAuth();

  const loadGoals = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadGoals();

      // Subscribe to real-time changes
      const subscription = supabase
        .channel('goals_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'goals',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            // Handle different types of changes
            switch (payload.eventType) {
              case 'INSERT':
              case 'UPDATE':
              case 'DELETE':
                // Reload goals for any change
                await loadGoals();
                break;
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, loadGoals]);

  const updateGoals = async (newGoals: Omit<Goal, 'id' | 'user_id'>[]) => {
    if (!user) return;

    try {
      // Start a transaction
      const { error: deleteError } = await supabase
        .from('goals')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert new goals
      const { data, error: insertError } = await supabase
        .from('goals')
        .insert(
          newGoals.map(goal => ({
            ...goal,
            user_id: user.id
          }))
        )
        .select();

      if (insertError) throw insertError;

      // Update local state immediately
      setGoals(data || []);
      return data;
    } catch (error) {
      console.error('Error updating goals:', error);
      // Reload goals in case of error to ensure consistency
      await loadGoals();
      throw error;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  const addGoal = async (goalData: Partial<Goal>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
          type: goalData.type,
          target: goalData.target,
          current: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      await loadGoals();
      return data;
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  const updateGoalProgress = async (goalId: string, current: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({ current })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  };

  const getUnitLabel = (type: Goal['type']) => {
    switch (type) {
      case 'calories':
        return 'cal';
      default:
        return 'g';
    }
  };

  return {
    goals,
    loadGoals,
    updateGoals,
    updateGoal,
    addGoal,
    deleteGoal,
    updateGoalProgress,
  };
}; 