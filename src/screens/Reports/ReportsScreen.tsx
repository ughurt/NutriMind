import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View, Dimensions, Platform } from 'react-native';
import { Text, SegmentedButtons, Surface, ActivityIndicator, useTheme, Divider, Chip } from 'react-native-paper';
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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
  const [isLoading, setIsLoading] = useState(false);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutHistoryItem[]>([]);
  const [activeSection, setActiveSection] = useState<'nutrition' | 'activity' | 'workouts'>('nutrition');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const theme = useTheme();
  const navigation = useNavigation();
  const { goals, loadGoals } = useGoals();
  const { fetchMealsForDateRange } = useMeals(new Date());
  const { 
    steps, 
    isPedometerAvailable, 
    settings,
    saveSettings,
    caloriesBurned, 
    weeklyStats,
    distance,
    loadWeeklyStats
  } = usePedometer();
  const { stats: currentWorkoutStats, getHistory } = useWorkoutStats();

  const calorieGoal = goals.find(g => g.type === 'calories')?.target || 2000;

  // Load activity stats
  const loadActivityStats = useCallback(() => {
    if (!weeklyStats || !settings) return;
    
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
        goalProgress: (dayStat?.steps || 0) / (settings.stepGoal || 1),
      };
    });

    setActivityStats(stats);
  }, [weeklyStats, settings]);

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

  // Load all data
  const loadAllData = useCallback(async () => {
    if (isLoading) return;
      setIsLoading(true);
      try {
        await Promise.all([
          loadMeals(),
          loadGoals(),
        loadWeeklyStats(),
          loadWorkoutStats(),
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
    }
        setIsLoading(false);
      setInitialLoadComplete(true);
  }, [loadMeals, loadGoals, loadWeeklyStats, loadWorkoutStats, isLoading]);

  // Initial load and focus handler
  useEffect(() => {
    loadAllData();
    const unsubscribe = navigation.addListener('focus', loadAllData);
    return () => unsubscribe();
  }, [navigation, loadAllData]);

  // Update activity stats when pedometer data changes
  useEffect(() => {
    if (weeklyStats && settings) {
      loadActivityStats();
    }
  }, [weeklyStats, settings, loadActivityStats]);

  // Periodic updates for weekly stats
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (!isLoading) {
        loadWeeklyStats();
      }
    }, 30000);
    return () => clearInterval(updateInterval);
  }, [loadWeeklyStats, isLoading]);

  const onRefresh = useCallback(() => {
    if (!isLoading) {
      loadAllData();
    }
  }, [loadAllData, isLoading]);

  const filteredData = useMemo(() => {
    if (allMeals.length === 0 || activityStats.length === 0) {
      return {
        meals: [],
        activity: [],
        workouts: [],
      };
    }

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

  // Memoize the active section components for better performance
  const nutritionSection = useMemo(() => {
    // Always render content even when loading, to avoid flashing
  return (
      <>
          <SummaryCard meals={filteredData.meals} goals={goals} />
          
        <Surface style={styles.chartSection} elevation={0}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Calories</Text>
          {isLoading && !initialLoadComplete ? (
            <ActivityIndicator size="small" color="#006A6A" style={styles.inlineLoader} />
          ) : filteredData.meals.length > 0 ? (
              <CaloriesChart 
                meals={filteredData.meals} 
                dateFilter={dateFilter}
                calorieGoal={calorieGoal}
              />
            ) : (
              <Text style={styles.noDataText}>No meals recorded for this period</Text>
            )}
          </Surface>

        <Surface style={styles.chartSection} elevation={0}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Macronutrients</Text>
          {isLoading && !initialLoadComplete ? (
            <ActivityIndicator size="small" color="#006A6A" style={styles.inlineLoader} />
          ) : filteredData.meals.length > 0 ? (
              <MacrosChart meals={filteredData.meals} />
            ) : (
              <Text style={styles.noDataText}>No meals recorded for this period</Text>
            )}
          </Surface>

        <Surface style={styles.chartSection} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Meal Distribution</Text>
          {isLoading && !initialLoadComplete ? (
            <ActivityIndicator size="small" color="#006A6A" style={styles.inlineLoader} />
          ) : filteredData.meals.length > 0 ? (
            <MealDistributionChart meals={filteredData.meals} />
          ) : (
            <Text style={styles.noDataText}>No meals recorded for this period</Text>
          )}
          </Surface>
        </>
    );
  }, [filteredData.meals, goals, dateFilter, calorieGoal, isLoading, initialLoadComplete]);

  const activitySection = useMemo(() => {
    // Instead of passing isLoading prop which doesn't exist in component
    if (isLoading && !initialLoadComplete && filteredData.activity.length === 0) {
      return (
        <Surface style={styles.chartSection} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Activity Stats</Text>
          <ActivityIndicator size="small" color="#006A6A" style={styles.inlineLoader} />
        </Surface>
      );
    }
    
    return (
      <ActivitySummary
        stats={filteredData.activity}
        stepGoal={settings?.stepGoal}
        dateFilter={dateFilter}
      />
    );
  }, [filteredData.activity, settings?.stepGoal, dateFilter, isLoading, initialLoadComplete]);

  const workoutsSection = useMemo(() => {
    // Instead of passing isLoading prop which doesn't exist in component
    if (isLoading && !initialLoadComplete && filteredData.workouts.length === 0) {
      return (
        <Surface style={styles.chartSection} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Workout Stats</Text>
          <ActivityIndicator size="small" color="#006A6A" style={styles.inlineLoader} />
        </Surface>
      );
    }
    
    return (
      <WorkoutSummary
        stats={filteredData.workouts}
        dateFilter={dateFilter}
      />
    );
  }, [filteredData.workouts, dateFilter, isLoading, initialLoadComplete]);

  // Optimize the renderActiveSection function to use memoized components
  const renderActiveSection = () => {
    if (isLoading && !initialLoadComplete) {
      return <ActivityIndicator size="large" style={styles.loader} color="#006A6A" />;
    }

    switch (activeSection) {
      case 'nutrition':
        return nutritionSection;
      case 'activity':
        return activitySection;
      case 'workouts':
        return workoutsSection;
      default:
        return null;
    }
  };

  const { width: screenWidth } = Dimensions.get('window');

  // Restore the getDateRangeDescription function
  const getDateRangeDescription = () => {
    const today = new Date();
    
    switch (dateFilter) {
      case 'today':
        return format(today, 'MMMM d, yyyy');
      case 'yesterday':
        return format(subDays(today, 1), 'MMMM d, yyyy');
      case 'thisWeek': {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM d')} - ${format(today, 'MMM d, yyyy')}`;
      }
      case 'lastWeek': {
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
        return `${format(lastWeekStart, 'MMM d')} - ${format(lastWeekEnd, 'MMM d, yyyy')}`;
      }
      default:
        return format(today, 'MMMM d, yyyy');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={0}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Health Reports</Text>
          <Text style={styles.headerSubtitle}>{getDateRangeDescription()}</Text>
          </View>
        </View>

        {/* Date Filter */}
        <View style={styles.dateFilterContainer}>
          <SegmentedButtons
            value={dateFilter}
            onValueChange={value => setDateFilter(value as DateFilter)}
            buttons={[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: 'thisWeek', label: 'This Week' },
              { value: 'lastWeek', label: 'Last Week' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
      </Surface>

      {/* Section Tabs */}
      <View style={styles.sectionTabs}>
        <Chip
          selected={activeSection === 'nutrition'}
          onPress={() => setActiveSection('nutrition')}
          style={[
            styles.sectionChip,
            activeSection === 'nutrition' && styles.selectedChip
          ]}
          textStyle={activeSection === 'nutrition' ? styles.selectedChipText : styles.chipText}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="food-apple" size={size} color={color} />
          )}
        >
          Nutrition
        </Chip>
        <Chip
          selected={activeSection === 'activity'}
          onPress={() => setActiveSection('activity')}
          style={[
            styles.sectionChip,
            activeSection === 'activity' && styles.selectedChip
          ]}
          textStyle={activeSection === 'activity' ? styles.selectedChipText : styles.chipText}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="shoe-print" size={size} color={color} />
          )}
        >
          Activity
        </Chip>
        <Chip
          selected={activeSection === 'workouts'}
          onPress={() => setActiveSection('workouts')}
          style={[
            styles.sectionChip,
            activeSection === 'workouts' && styles.selectedChip
          ]}
          textStyle={activeSection === 'workouts' ? styles.selectedChipText : styles.chipText}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="run" size={size} color={color} />
          )}
        >
          Workouts
        </Chip>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            colors={['#006A6A']}
            tintColor={'#006A6A'}
          />
        }
      >
        {renderActiveSection()}
    </ScrollView>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    borderBottomWidth: 0,
  },
  headerContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  dateFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  sectionTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionChip: {
    backgroundColor: '#f8f8f8',
    marginHorizontal: 4,
    flex: 1,
    borderColor: 'transparent',
  },
  selectedChip: {
    backgroundColor: '#006A6A15',
    borderColor: '#006A6A',
  },
  chipText: {
    color: '#666666',
    fontSize: 13,
  },
  selectedChipText: {
    color: '#006A6A',
    fontWeight: '500',
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  chartSection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.4,
  },
  loader: {
    marginTop: 32,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666666',
    padding: 24,
    fontSize: 15,
  },
  errorText: {
    textAlign: 'center',
    color: '#ef5350',
    padding: 24,
    fontSize: 15,
  },
  inlineLoader: {
    padding: 24,
  },
});

export default ReportsScreen; 