import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, subDays, parseISO, getHours } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Meal } from '../../../hooks/useMeals';

interface Props {
  meals: Meal[];
  dateFilter: string;
  calorieGoal: number;
}

interface TimeDistribution {
  morning: number;   // 6-11
  afternoon: number; // 11-17
  evening: number;   // 17-22
  night: number;     // 22-6
}

interface MealSize {
  small: number;  // <300 cal
  medium: number; // 300-600 cal
  large: number;  // >600 cal
}

export const CaloriesChart = ({ meals, dateFilter, calorieGoal = 2000 }: Props) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const theme = useTheme();

  // Get date range based on filter
  const getDateRange = () => {
    switch (dateFilter) {
      case 'today':
        return [today];
      case 'yesterday':
        return [subDays(today, 1)];
      case 'thisWeek': {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: today });
      }
      case 'lastWeek': {
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: lastWeekStart, end: lastWeekEnd });
      }
      default:
        return [today];
    }
  };

  const dateRange = getDateRange();

  // Group meals by date
  const mealsByDate = meals.reduce((acc, meal) => {
    const date = meal.date;
    if (!acc[date]) {
      acc[date] = {
        total: 0,
        meals: [],
        byType: {} as Record<string, number>,
      };
    }
    acc[date].total += Number(meal.calories || 0);
    acc[date].meals.push(meal);
    acc[date].byType[meal.meal_type] = (acc[date].byType[meal.meal_type] || 0) + Number(meal.calories || 0);
    return acc;
  }, {} as Record<string, { total: number; meals: Meal[]; byType: Record<string, number> }>);

  // Calculate statistics
  const totalCalories = Object.values(mealsByDate).reduce((sum, day) => sum + day.total, 0);
  const daysWithMeals = Object.keys(mealsByDate).length || 1;
  const dailyAverage = totalCalories / daysWithMeals;
  const goalDifference = dailyAverage - calorieGoal;
  const goalAchievement = (dailyAverage / calorieGoal) * 100;

  const getProgressColor = (calories: number) => {
    const ratio = calories / calorieGoal;
    if (ratio > 1.1) return '#E74C3C'; // Too much
    if (ratio >= 0.9 && ratio <= 1.1) return '#2ECC71'; // Just right
    if (ratio >= 0.7) return '#F1C40F'; // Getting there
    return '#95A5A6'; // Too low
  };

  // Calculate time-based distribution
  const getMealTypeTime = (type: string): number => {
    switch (type) {
      case 'breakfast': return 8;  // 8 AM
      case 'lunch': return 13;     // 1 PM
      case 'dinner': return 19;    // 7 PM
      case 'snack': return 15;     // 3 PM
      default: return 12;          // Default to noon
    }
  };

  // Calculate peak eating times based on meal type
  const peakMealTimes = meals.reduce((acc, meal) => {
    const hour = getMealTypeTime(meal.meal_type);
    acc[hour] = (acc[hour] || 0) + Number(meal.calories || 0);
    return acc;
  }, {} as Record<number, number>);

  const getPeakMealTime = () => {
    const maxHour = Object.entries(peakMealTimes)
      .sort(([, a], [, b]) => b - a)[0];
    if (!maxHour) return 'N/A';
    
    // Format the hour to AM/PM
    const hour = parseInt(maxHour[0]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:00 ${ampm}`;
  };

  // Analyze meal sizes
  const mealSizes = meals.reduce((acc, meal) => {
    const calories = Number(meal.calories || 0);

    if (calories < 300) acc.small++;
    else if (calories <= 600) acc.medium++;
    else acc.large++;

    return acc;
  }, { small: 0, medium: 0, large: 0 } as MealSize);

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <Surface style={styles.statsCard}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={24} color="#666666" />
            <Text style={styles.statLabel}>Daily Average</Text>
            <Text style={styles.statValue}>{Math.round(dailyAverage)} cal</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name={goalAchievement >= 90 ? "target" : "target-variant"} 
              size={24}
              color="#666666" 
            />
            <Text style={styles.statLabel}>Goal Progress</Text>
            <Text style={styles.statValue}>{Math.round(goalAchievement)}%</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialCommunityIcons 
              name={goalDifference > 0 ? "trending-up" : "trending-down"} 
              size={24} 
              color="#666666" 
            />
            <Text style={styles.statLabel}>vs Goal</Text>
            <Text style={styles.statValue}>{Math.abs(Math.round(goalDifference))} cal</Text>
        </View>
        </View>
      </Surface>

      {/* Eating Patterns Card */}
      <Surface style={styles.patternCard}>
        <Text variant="titleMedium" style={styles.title}>Eating Patterns</Text>
        
        <View style={styles.patternGrid}>
          <View style={styles.patternItem}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#666666" />
            <Text style={styles.patternLabel}>Peak Time</Text>
            <Text style={styles.patternValue}>{getPeakMealTime()}</Text>
          </View>

          <View style={styles.patternItem}>
            <MaterialCommunityIcons name="food-outline" size={24} color="#666666" />
            <Text style={styles.patternLabel}>Most Common</Text>
            <Text style={styles.patternValue}>
              {Object.entries(mealSizes)
                .sort(([, a], [, b]) => b - a)[0][0]} meals
          </Text>
          </View>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 2,
  },
  patternCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  title: {
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 16,
  },
  patternGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  patternItem: {
    alignItems: 'center',
    flex: 1,
  },
  patternLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  patternValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginTop: 2,
  },
}); 