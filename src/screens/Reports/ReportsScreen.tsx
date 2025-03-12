import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, SegmentedButtons, Surface, ActivityIndicator } from 'react-native-paper';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useMeals, Meal } from '../../hooks/useMeals';
import { useGoals } from '../../hooks/useGoals';
import { usePedometer } from '../../hooks/usePedometer';
import { useWorkoutStats, WorkoutStats } from '../../hooks/useWorkoutStats';
import { SummaryCard } from './components/SummaryCard';
import { CaloriesChart } from './components/CaloriesChart';
import { MacrosChart } from './components/MacrosChart';
import { MealDistributionChart } from './components/MealDistributionChart';
import { ActivitySummary } from './components/ActivitySummary';
import { WorkoutSummary } from './components/WorkoutSummary';

type DateFilter = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek';

interface ActivityStats {
  date: string;
  steps: number;
  distance: number;
  caloriesBurned: number;
  goalProgress: number;
}

interface WorkoutHistoryItem extends WorkoutStats {
  date: string;
}

const ReportsScreen = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutHistoryItem[]>([]);
  
  const { goals, loadGoals } = useGoals();
  const { fetchMealsForDateRange } = useMeals(new Date());
  const { settings: pedometerSettings, weeklyStats } = usePedometer();
  const { stats: currentWorkoutStats, getHistory } = useWorkoutStats();

  const calorieGoal = goals.find(g => g.type === 'calories')?.target || 2000;

  // Load activity stats
  const loadActivityStats = useCallback(async () => {
    if (!weeklyStats || !pedometerSettings) return;
    
    const today = new Date();
    const twoWeeksAgo = subDays(today, 14);
    const startDate = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 });
    
    const dateRange = eachDayOfInterval({ start: startDate, end: today });
    
    const stats = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayStat = weeklyStats.find(stat => stat.date === format(date, 'EEE'));
      return {
        date: dateStr,
        steps: dayStat?.steps || 0,
        distance: dayStat?.distance || 0,
        caloriesBurned: dayStat?.calories || 0,
        goalProgress: (dayStat?.steps || 0) / (pedometerSettings.stepGoal || 1),
      };
    });

    setActivityStats(stats);
  }, [weeklyStats, pedometerSettings?.stepGoal]);

  // Load workout stats
  const loadWorkoutStats = useCallback(async () => {
    try {
      const history = await getHistory();
      if (!history) return;
      
      const stats = history.map((workout: WorkoutHistoryItem) => ({
        date: format(new Date(workout.date), 'yyyy-MM-dd'),
        distance: workout.distance,
        movingTime: workout.movingTime,
        calories: workout.calories,
      }));
      setWorkoutStats(stats);
    } catch (error) {
      console.error('Error loading workout stats:', error);
      setWorkoutStats([]);
    }
  }, [getHistory]);

  // Fetch meals for the entire date range
  const loadMeals = useCallback(async () => {
    try {
      const today = new Date();
      const twoWeeksAgo = subDays(today, 14);
      const startDate = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 });
      
      const dateRange = eachDayOfInterval({ 
        start: startDate,
        end: today 
      });
      
      const allMealsData = await Promise.all(
        dateRange.map(date => fetchMealsForDateRange(date))
      );
      
      const sortedMeals = allMealsData
        .flat()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setAllMeals(sortedMeals);
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  }, [fetchMealsForDateRange]);

  // Split the loading functions into separate effects
  useEffect(() => {
    loadActivityStats();
  }, [loadActivityStats]);

  useEffect(() => {
    loadWorkoutStats();
  }, [loadWorkoutStats]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Handle loading state
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadMeals(),
          loadGoals(),
          loadActivityStats(),
          loadWorkoutStats(),
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []); // Run only on mount

  // Remove loadData callback since we're handling loading differently now
  const onRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMeals(),
        loadGoals(),
        loadActivityStats(),
        loadWorkoutStats(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadMeals, loadGoals, loadActivityStats, loadWorkoutStats]);

  const filteredData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate = today;

    switch (dateFilter) {
      case 'today':
        startDate = today;
        break;
      case 'yesterday':
        startDate = subDays(today, 1);
        endDate = startDate;
        break;
      case 'thisWeek':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'lastWeek':
        const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        startDate = subDays(thisWeekStart, 7);
        endDate = subDays(thisWeekStart, 1);
        break;
      default:
        startDate = today;
    }

    const filterByDateRange = (items: any[]) => {
      return items.filter(item => {
        const itemDate = new Date(item.date + 'T00:00:00');
        return itemDate >= startDate && itemDate <= endDate;
      });
    };

    return {
      meals: filterByDateRange(allMeals),
      activity: filterByDateRange(activityStats),
      workouts: filterByDateRange(workoutStats),
    };
  }, [allMeals, activityStats, workoutStats, dateFilter]);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
        />
      }
    >
      <Surface style={styles.filterSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Time Period</Text>
        <SegmentedButtons
          value={dateFilter}
          onValueChange={value => setDateFilter(value as DateFilter)}
          buttons={[
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'thisWeek', label: 'This Week' },
            { value: 'lastWeek', label: 'Last Week' },
          ]}
        />
      </Surface>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <>
          <ActivitySummary
            stats={filteredData.activity}
            stepGoal={pedometerSettings.stepGoal}
            dateFilter={dateFilter}
          />

          <WorkoutSummary
            stats={filteredData.workouts}
            dateFilter={dateFilter}
          />

          <SummaryCard meals={filteredData.meals} goals={goals} />
          
          <Surface style={styles.chartSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Calories</Text>
            {filteredData.meals.length > 0 ? (
              <CaloriesChart 
                meals={filteredData.meals} 
                dateFilter={dateFilter}
                calorieGoal={calorieGoal}
              />
            ) : (
              <Text style={styles.noDataText}>No meals recorded for this period</Text>
            )}
          </Surface>

          <Surface style={styles.chartSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Macronutrients</Text>
            {filteredData.meals.length > 0 ? (
              <MacrosChart meals={filteredData.meals} />
            ) : (
              <Text style={styles.noDataText}>No meals recorded for this period</Text>
            )}
          </Surface>

          <Surface style={styles.chartSection}>
            <MealDistributionChart meals={filteredData.meals} />
          </Surface>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  chartSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#666',
  },
  loader: {
    marginTop: 32,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: '#ef5350',
    padding: 20,
  },
});

export default ReportsScreen; 