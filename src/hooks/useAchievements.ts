import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ACHIEVEMENT_TYPES } from '../constants/achievements';
import type { DailyStats } from './useDailyStats';
import * as Notifications from 'expo-notifications';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
};

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(3);

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showAchievementNotification = async (title: string, description: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Achievement Unlocked!',
        body: `${title}\n${description}`,
      },
      trigger: null, // Show immediately
    });
  };

  const awardAchievement = async (achievementType: keyof typeof ACHIEVEMENT_TYPES) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', ACHIEVEMENT_TYPES[achievementType].title)
        .gte('date', today)
        .limit(1);

      if (!existing?.length) {
        const achievement = ACHIEVEMENT_TYPES[achievementType];
        const { error } = await supabase
          .from('achievements')
          .insert([{
            user_id: user.id,
            ...achievement,
          }]);

        if (error) throw error;
        await showAchievementNotification(achievement.title, achievement.description);
        await fetchAchievements();
      }
    } catch (error) {
      console.error('Error awarding achievement:', error.message);
    }
  };

  const checkDailyAchievements = async (stats: DailyStats) => {
    if (!user) return;

    // Check water goal
    if (stats.water.consumed >= stats.water.goal) {
      await awardAchievement('DAILY_WATER');
    }

    // Check steps goal
    if (stats.steps.count >= stats.steps.goal) {
      await awardAchievement('DAILY_STEPS');
    }

    // Check calorie goal
    if (stats.calories.consumed <= stats.calories.goal) {
      await awardAchievement('CALORIE_GOAL');
    }

    // Check first log (if this is their first entry)
    const { data: firstLog } = await supabase
      .from('daily_stats')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (firstLog?.length === 1) {
      await awardAchievement('FIRST_LOG');
    }

    // Check week streak
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: weekLogs } = await supabase
      .from('daily_stats')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString())
      .order('date');

    if (weekLogs && weekLogs.length >= 7) {
      await awardAchievement('STREAK_WEEK');
    }
  };

  const checkWeightAchievement = async (currentWeight: number, goalWeight: number) => {
    if (!user) return;

    // Check if weight goal is reached
    if (goalWeight > 0 && Math.abs(currentWeight - goalWeight) <= 0.5) {
      await awardAchievement('WEIGHT_GOAL');
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  return {
    achievements,
    loading,
    checkDailyAchievements,
    checkWeightAchievement,
    refreshAchievements: fetchAchievements,
  };
}; 