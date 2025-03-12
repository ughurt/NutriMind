import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface WorkoutStats {
  date: string;
  distance: number;
  movingTime: number;
  calories: number;
}

interface WorkoutSummaryProps {
  stats: WorkoutStats[];
  dateFilter: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek';
}

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  stats,
  dateFilter,
}) => {
  // Calculate totals and averages
  const summary = stats.reduce(
    (acc, stat) => ({
      totalDistance: acc.totalDistance + stat.distance,
      totalTime: acc.totalTime + stat.movingTime,
      totalCalories: acc.totalCalories + stat.calories,
      count: acc.count + 1,
    }),
    { totalDistance: 0, totalTime: 0, totalCalories: 0, count: 0 }
  );

  const isMultipleDays = ['thisWeek', 'lastWeek'].includes(dateFilter);
  const distance = isMultipleDays ? summary.totalDistance : summary.totalDistance;
  const movingTime = isMultipleDays ? summary.totalTime : summary.totalTime;
  const calories = isMultipleDays ? summary.totalCalories : summary.totalCalories;

  // Format moving time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const statItems = [
    {
      icon: 'map-marker-distance',
      value: distance.toFixed(2),
      label: isMultipleDays ? 'Total Distance' : 'Distance',
      unit: 'km',
      color: '#2196F3',
    },
    {
      icon: 'clock-outline',
      value: formatTime(movingTime),
      label: isMultipleDays ? 'Total Time' : 'Moving Time',
      color: '#9C27B0',
    },
    {
      icon: 'fire',
      value: calories.toLocaleString(),
      label: isMultipleDays ? 'Total Calories' : 'Calories',
      unit: 'kcal',
      color: '#FF9800',
    },
  ];

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="run"
          size={24}
          color="#006A6A"
          style={styles.headerIcon}
        />
        <Text variant="titleMedium" style={styles.title}>Workout Activity</Text>
      </View>

      {stats.length > 0 ? (
        <>
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
                  {item.unit && (
                    <Text variant="bodySmall" style={styles.unit}>
                      {' '}{item.unit}
                    </Text>
                  )}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {isMultipleDays && summary.count > 0 && (
            <View style={styles.averageContainer}>
              <Text variant="bodySmall" style={styles.averageText}>
                Average per workout: {(summary.totalDistance / summary.count).toFixed(2)} km • {formatTime(summary.totalTime / summary.count)} • {Math.round(summary.totalCalories / summary.count)} kcal
              </Text>
              <Text variant="bodySmall" style={styles.workoutCount}>
                {summary.count} workout{summary.count !== 1 ? 's' : ''} this period
              </Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noDataText}>
          No workouts recorded for this period
        </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    color: '#006A6A',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  unit: {
    color: '#666',
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  averageContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  averageText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  workoutCount: {
    color: '#006A6A',
    textAlign: 'center',
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
}); 