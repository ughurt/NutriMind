import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { cache } from '../services/cache';

interface DailyStats {
  calories_consumed: number;
  calories_goal: number;
  protein_consumed: number;
  protein_goal: number;
  carbs_consumed: number;
  carbs_goal: number;
  fat_consumed: number;
  fat_goal: number;
}

export const useDailyStats = () => {
  const [stats, setStats] = useState<DailyStats>({
    calories_consumed: 0,
    calories_goal: 2000,
    protein_consumed: 0,
    protein_goal: 150,
    carbs_consumed: 0,
    carbs_goal: 250,
    fat_consumed: 0,
    fat_goal: 70,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDailyStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Try to get from cache first
      const cachedStats = await cache.get<DailyStats>(`dailyStats_${user.id}`);
      if (cachedStats) {
        setStats(cachedStats);
        setLoading(false);
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const newStats = {
          calories_consumed: data.calories_consumed,
          calories_goal: data.calories_goal,
          protein_consumed: data.protein_consumed,
          protein_goal: data.protein_goal,
          carbs_consumed: data.carbs_consumed,
          carbs_goal: data.carbs_goal,
          fat_consumed: data.fat_consumed,
          fat_goal: data.fat_goal,
        };
        setStats(newStats);
        await cache.set(`dailyStats_${user.id}`, newStats);
      }
    } catch (error) {
      console.error('Error fetching daily stats:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async (newStats: Partial<DailyStats>) => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Ensure all values are valid numbers
      const updateData = {
        user_id: user.id,
        date: today,
        calories_consumed: Math.max(0, Number(newStats.calories_consumed ?? stats.calories_consumed) || 0),
        calories_goal: Math.max(1, Number(newStats.calories_goal ?? stats.calories_goal) || 2000),
        protein_consumed: Math.max(0, Number(newStats.protein_consumed ?? stats.protein_consumed) || 0),
        protein_goal: Math.max(1, Number(newStats.protein_goal ?? stats.protein_goal) || 150),
        carbs_consumed: Math.max(0, Number(newStats.carbs_consumed ?? stats.carbs_consumed) || 0),
        carbs_goal: Math.max(1, Number(newStats.carbs_goal ?? stats.carbs_goal) || 250),
        fat_consumed: Math.max(0, Number(newStats.fat_consumed ?? stats.fat_consumed) || 0),
        fat_goal: Math.max(1, Number(newStats.fat_goal ?? stats.fat_goal) || 70),
        updated_at: new Date().toISOString(),
      };

      // First, try to get the existing record
      const { data: existingData, error: fetchError } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      let error;
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('daily_stats')
          .update(updateData)
          .eq('id', existingData.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('daily_stats')
          .insert([updateData]);
        error = insertError;
      }

      if (error) throw error;
      await fetchDailyStats();
    } catch (error) {
      console.error('Error updating daily stats:', error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchDailyStats();
  }, [user]);

  return {
    stats,
    loading,
    updateStats,
    refreshStats: fetchDailyStats,
  };
}; 