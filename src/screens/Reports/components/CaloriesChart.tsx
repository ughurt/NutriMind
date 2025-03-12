import React from 'react';
import { View, Dimensions, StyleSheet, Animated, ScrollView } from 'react-native';
import { Text, Surface, ProgressBar, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Meal } from '../../../hooks/useMeals';

interface Props {
  meals: Meal[];
  dateFilter: string;
  calorieGoal: number;
}

interface ChartDataset {
  data: number[];
  color?: (opacity: number) => string;
  withDots?: boolean;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

type IconName = 'chart-timeline-variant' | 'target' | 'arrow-up-bold' | 'arrow-down-bold';

interface StatItem {
  icon: IconName;
  value: string;
  label: string;
  color: string;
}

export const CaloriesChart = ({ meals, dateFilter, calorieGoal = 2000 }: Props) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const theme = useTheme();

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 48; // Adjust for margins
  const chartHeight = 180; // Reduced height

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

  // Group meals by date and calculate meal type distribution
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
  const maxCalories = Math.max(...Object.values(mealsByDate).map(day => day.total), 0);
  const minCalories = Math.min(...Object.values(mealsByDate).filter(day => day.total > 0).map(day => day.total), calorieGoal);
  const goalDifference = dailyAverage - calorieGoal;
  const goalAchievement = (dailyAverage / calorieGoal) * 100;

  // Calculate streak of days meeting goal
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  dateRange.forEach(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTotal = mealsByDate[dateStr]?.total || 0;
    if (Math.abs(dayTotal - calorieGoal) / calorieGoal <= 0.1) { // Within 10% of goal
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
      if (date <= today) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  });

  // Prepare chart data
  const chartData: ChartData = {
    labels: dateRange.map(date => format(date, dateRange.length > 2 ? 'EEE' : 'MMM d')),
    datasets: [{
      data: dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return mealsByDate[dateStr]?.total || 0;
      }),
    }],
  };

  // Add goal line
  if (dateRange.length > 1) {
    chartData.datasets.push({
      data: new Array(dateRange.length).fill(calorieGoal),
      color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
      withDots: false,
    });
  }

  const statItems: StatItem[] = [
    {
      icon: 'chart-timeline-variant',
      value: Math.round(dailyAverage).toLocaleString(),
      label: 'Daily Average',
      color: '#006A6A',
    },
    {
      icon: 'target',
      value: calorieGoal.toLocaleString(),
      label: 'Daily Goal',
      color: '#E74C3C',
    },
    {
      icon: goalDifference > 0 ? 'arrow-up-bold' : 'arrow-down-bold',
      value: `${Math.abs(Math.round(goalDifference)).toLocaleString()}`,
      label: `${goalDifference > 0 ? 'Above' : 'Below'} Goal`,
      color: goalDifference > 0 ? '#E74C3C' : '#2ECC71',
    },
  ];

  return (
    <View>
      <Surface style={styles.summaryCard}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.summaryItem}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={item.color}
              style={styles.icon}
            />
            <Text variant="titleLarge" style={[styles.summaryValue, { color: item.color }]}>
              {item.value}
            </Text>
            <Text variant="bodyMedium" style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </Surface>

      <Surface style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text variant="titleMedium" style={styles.progressTitle}>
            Goal Progress
          </Text>
          <Text variant="bodyLarge" style={[
            styles.progressPercentage,
            { color: Math.abs(100 - goalAchievement) <= 10 ? '#4CAF50' : '#E74C3C' }
          ]}>
            {Math.round(goalAchievement)}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(goalAchievement, 100)}%`,
                backgroundColor: Math.abs(100 - goalAchievement) <= 10 ? '#4CAF50' : '#E74C3C'
              }
            ]}
          />
        </View>
        <View style={styles.streakContainer}>
          <Text variant="bodySmall" style={styles.streakText}>
            Current Streak: {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </Text>
          <Text variant="bodySmall" style={styles.streakText}>
            Best Streak: {bestStreak} day{bestStreak !== 1 ? 's' : ''}
          </Text>
        </View>
      </Surface>

      <Surface style={styles.chartCard}>
        <Text variant="titleMedium" style={styles.chartTitle}>Calorie Trends</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          <LineChart
            data={chartData}
            width={dateRange.length > 3 ? Math.max(chartWidth, dateRange.length * 60) : chartWidth}
            height={chartHeight}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 106, 106, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#006A6A',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                strokeWidth: 1,
              },
              formatYLabel: (value) => Math.round(Number(value)).toString(),
              formatXLabel: (label) => label.substring(0, 3),
              count: 5, // Number of Y-axis labels
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            yAxisLabel=""
            yAxisSuffix=" cal"
            segments={5}
          />
        </ScrollView>

        {dateRange.length > 1 && (
          <View style={styles.chartFooter}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#006A6A' }]} />
              <Text style={styles.legendText}>Daily Calories</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E74C3C' }]} />
              <Text style={styles.legendText}>Goal</Text>
            </View>
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text variant="bodySmall" style={styles.statsText}>
            Highest: {maxCalories.toLocaleString()} kcal
          </Text>
          <Text variant="bodySmall" style={styles.statsText}>
            Lowest: {minCalories.toLocaleString()} kcal
          </Text>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 4,
  },
  summaryValue: {
    marginVertical: 4,
    fontWeight: '600',
  },
  label: {
    color: '#666',
    textAlign: 'center',
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    color: '#666',
  },
  progressPercentage: {
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  streakText: {
    color: '#666',
  },
  chartCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  chartTitle: {
    color: '#666',
    marginBottom: 16,
  },
  chartScrollContainer: {
    paddingRight: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#666',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statsText: {
    color: '#666',
  },
}); 