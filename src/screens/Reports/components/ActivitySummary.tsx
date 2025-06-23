import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface ActivityStats {
  date: string;
  steps: number;
  distance: number;
  caloriesBurned: number;
  goalProgress: number;
}

interface ActivitySummaryProps {
  stats: ActivityStats[];
  stepGoal: number;
  dateFilter: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek';
}

export const ActivitySummary: React.FC<ActivitySummaryProps> = React.memo(({
  stats,
  stepGoal,
  dateFilter,
}) => {
  const theme = useTheme();

  // Memoize calculations to prevent unnecessary re-renders
  const { 
    avgSteps, 
    avgDistance, 
    avgCalories, 
    goalProgress, 
    progressColor, 
    statItems,
    summary,
    isMultipleDays
  } = React.useMemo(() => {
    if (!stats.length || !stepGoal) {
      return {
        avgSteps: 0,
        avgDistance: 0,
        avgCalories: 0,
        goalProgress: 0,
        progressColor: '#FF5722',
        statItems: [],
        summary: { totalSteps: 0, totalDistance: 0, totalCalories: 0, count: 0 },
        isMultipleDays: false,
      };
    }

  // Calculate averages and totals based on the date filter
  const summary = stats.reduce(
    (acc, stat) => ({
      totalSteps: acc.totalSteps + stat.steps,
      totalDistance: acc.totalDistance + stat.distance,
      totalCalories: acc.totalCalories + stat.caloriesBurned,
      count: acc.count + 1,
    }),
    { totalSteps: 0, totalDistance: 0, totalCalories: 0, count: 0 }
  );

  const isMultipleDays = ['thisWeek', 'lastWeek'].includes(dateFilter);
  const avgSteps = isMultipleDays ? Math.round(summary.totalSteps / (summary.count || 1)) : summary.totalSteps;
  const avgDistance = isMultipleDays ? summary.totalDistance / (summary.count || 1) : summary.totalDistance;
  const avgCalories = isMultipleDays ? Math.round(summary.totalCalories / (summary.count || 1)) : summary.totalCalories;
  const goalProgress = avgSteps / (stepGoal || 1);

  // Color based on percentage of goal
  const getProgressColor = (progress: number) => {
    if (progress >= 1) return '#4CAF50';
    if (progress >= 0.7) return '#8BC34A';
    if (progress >= 0.4) return '#FFC107';
    return '#FF5722';
  };

  const progressColor = getProgressColor(goalProgress);

  const statItems = [
    {
      icon: 'shoe-print',
      value: avgSteps.toLocaleString(),
      label: isMultipleDays ? 'Avg Steps/Day' : 'Steps',
      color: '#4CAF50',
    },
    {
      icon: 'map-marker-distance',
      value: avgDistance.toFixed(1),
      label: isMultipleDays ? 'Avg Distance/Day' : 'Distance (km)',
      color: '#2196F3',
    },
    {
      icon: 'fire',
      value: avgCalories.toLocaleString(),
      label: isMultipleDays ? 'Avg Calories/Day' : 'Calories Burned',
      color: '#FF9800',
    },
  ];

    return {
      avgSteps,
      avgDistance,
      avgCalories,
      goalProgress,
      progressColor,
      statItems,
      summary,
      isMultipleDays,
    };
  }, [stats, stepGoal, dateFilter]);

  // Memoize the progress circle render
  const renderProgressCircle = React.useMemo(() => (
          <View style={styles.progressCircle}>
            <View style={styles.progressInnerCircle}>
              <Text style={styles.progressPercentage}>{Math.round(goalProgress * 100)}%</Text>
            </View>
            <View 
              style={[
                styles.progressArc,
                { 
                  borderColor: progressColor,
                  transform: [
                    { rotate: `-${90 - Math.min(goalProgress, 1) * 180}deg` }
                  ]
                }
              ]} 
            />
          </View>
  ), [goalProgress, progressColor]);

  if (!stats.length || !stepGoal) {
    return (
      <View style={styles.container}>
        <Surface style={styles.progressCard} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>No Activity Data</Text>
        </Surface>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.progressCard} elevation={2}>
        <Text variant="titleMedium" style={styles.cardTitle}>Goal Progress</Text>
      
        <View style={styles.progressContainer}>
          {renderProgressCircle}
          
          <View style={styles.progressDetails}>
            <Text variant="titleLarge" style={styles.stepsCount}>
              {avgSteps.toLocaleString()}
          </Text>
            <Text variant="bodyMedium" style={styles.stepsLabel}>steps</Text>
          <Text variant="bodySmall" style={styles.goalText}>
            Goal: {stepGoal.toLocaleString()} steps
          </Text>
        </View>
      </View>
      </Surface>

      <Surface style={styles.statsCard} elevation={2}>
        <Text variant="titleMedium" style={styles.cardTitle}>Activity Stats</Text>

      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statItem}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
            <MaterialCommunityIcons
              name={item.icon as any}
                  size={28}
              color={item.color}
            />
              </View>
            <Text variant="titleLarge" style={styles.statValue}>
              {item.value}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {isMultipleDays && (
        <View style={styles.totalContainer}>
            <Text variant="titleSmall" style={styles.totalTitle}>
              Period Totals
            </Text>
            <View style={styles.totalGrid}>
              <View style={styles.totalItem}>
                <Text variant="titleMedium" style={styles.totalValue}>
                  {summary.totalSteps.toLocaleString()}
                </Text>
                <Text variant="bodySmall" style={styles.totalLabel}>steps</Text>
              </View>
              <View style={styles.totalSeparator} />
              <View style={styles.totalItem}>
                <Text variant="titleMedium" style={styles.totalValue}>
                  {summary.totalDistance.toFixed(1)}
                </Text>
                <Text variant="bodySmall" style={styles.totalLabel}>km</Text>
              </View>
              <View style={styles.totalSeparator} />
              <View style={styles.totalItem}>
                <Text variant="titleMedium" style={styles.totalValue}>
                  {summary.totalCalories.toLocaleString()}
          </Text>
                <Text variant="bodySmall" style={styles.totalLabel}>calories</Text>
              </View>
            </View>
        </View>
      )}
    </Surface>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  progressInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  progressArc: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
  },
  progressDetails: {
    alignItems: 'center',
  },
  stepsCount: {
    fontWeight: 'bold',
    fontSize: 26,
    color: '#006A6A',
  },
  stepsLabel: {
    color: '#666',
    marginBottom: 4,
  },
  goalText: {
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 50,
    marginBottom: 8,
  },
  statValue: {
    fontWeight: '600',
    marginVertical: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  totalContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalTitle: {
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  totalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontWeight: '600',
    color: '#006A6A',
  },
  totalLabel: {
    color: '#666',
  },
  totalSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
}); 