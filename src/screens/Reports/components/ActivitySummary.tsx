import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
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

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({
  stats,
  stepGoal,
  dateFilter,
}) => {
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
  const avgSteps = isMultipleDays ? Math.round(summary.totalSteps / summary.count) : summary.totalSteps;
  const avgDistance = isMultipleDays ? summary.totalDistance / summary.count : summary.totalDistance;
  const avgCalories = isMultipleDays ? Math.round(summary.totalCalories / summary.count) : summary.totalCalories;
  const goalProgress = avgSteps / stepGoal;

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

  return (
    <Surface style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Daily Activity</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text variant="bodyLarge" style={styles.progressText}>
            {Math.round(goalProgress * 100)}% of Goal
          </Text>
          <Text variant="bodySmall" style={styles.goalText}>
            Goal: {stepGoal.toLocaleString()} steps
          </Text>
        </View>
        <ProgressBar
          progress={Math.min(goalProgress, 1)}
          color="#4CAF50"
          style={styles.progressBar}
        />
      </View>

      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color={item.color}
              style={styles.icon}
            />
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
          <Text variant="bodySmall" style={styles.totalText}>
            Period Totals: {summary.totalSteps.toLocaleString()} steps • {summary.totalDistance.toFixed(1)} km • {summary.totalCalories.toLocaleString()} cal
          </Text>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    color: '#666',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  goalText: {
    color: '#666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
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
  icon: {
    marginBottom: 4,
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
  totalText: {
    color: '#666',
    textAlign: 'center',
  },
}); 