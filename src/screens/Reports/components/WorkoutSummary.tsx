import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
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
  dateFilter: string;
}

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  stats,
  dateFilter,
}) => {
  const theme = useTheme();

  // Calculate summary stats
  const summary = stats.reduce(
    (acc, stat) => ({
      totalDistance: acc.totalDistance + (stat.distance || 0),
      totalTime: acc.totalTime + (stat.movingTime || 0),
      totalCalories: acc.totalCalories + (stat.calories || 0),
      count: acc.count + 1,
    }),
    { totalDistance: 0, totalTime: 0, totalCalories: 0, count: 0 }
  );

  const isMultipleDays = ['thisWeek', 'lastWeek'].includes(dateFilter);
  const workoutCount = stats.length;
  const hasWorkouts = workoutCount > 0;

  // Format time from seconds to hours:minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const statItems = [
    {
      icon: 'run',
      value: workoutCount,
      label: isMultipleDays ? 'Total Workouts' : 'Workouts',
      color: '#006A6A',
    },
    {
      icon: 'map-marker-distance',
      value: hasWorkouts ? summary.totalDistance.toFixed(1) : '0',
      label: 'Distance (km)',
      color: '#2196F3',
    },
    {
      icon: 'clock-outline',
      value: hasWorkouts ? formatTime(summary.totalTime) : '0h 0m',
      label: 'Active Time',
      color: '#9C27B0',
    },
    {
      icon: 'fire',
      value: hasWorkouts ? Math.round(summary.totalCalories).toLocaleString() : '0',
      label: 'Calories Burned',
      color: '#FF9800',
    },
  ];

  // Create recent workouts list if available
  const recentWorkouts = [...stats]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Surface style={styles.summaryCard} elevation={2}>
        <Text variant="titleMedium" style={styles.cardTitle}>Workout Summary</Text>
        
        {hasWorkouts ? (
        <>
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
            <View style={styles.averageContainer}>
                <Text variant="bodySmall" style={styles.averageLabel}>
                  Daily Averages: 
                </Text>
              <Text variant="bodySmall" style={styles.averageText}>
                  {(summary.totalDistance / summary.count).toFixed(1)} km •&nbsp;
                  {formatTime(summary.totalTime / summary.count)} •&nbsp;
                  {Math.round(summary.totalCalories / summary.count)} cal
              </Text>
            </View>
          )}
        </>
      ) : (
          <View style={styles.noDataContainer}>
            <MaterialCommunityIcons name="run-fast" size={48} color="#CCCCCC" />
            <Text style={styles.noDataText}>No workout data for this period</Text>
          </View>
        )}
      </Surface>
      
      {hasWorkouts && (
        <Surface style={styles.recentWorkoutsCard} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Recent Workouts</Text>
          
          {recentWorkouts.map((workout, index) => (
            <View key={index} style={[
              styles.workoutItem,
              index < recentWorkouts.length - 1 && styles.workoutItemBorder
            ]}>
              <View style={styles.workoutDate}>
                <Text style={styles.dateText}>{format(new Date(workout.date), 'MMM d')}</Text>
                <Text style={styles.yearText}>{format(new Date(workout.date), 'yyyy')}</Text>
              </View>
              
              <View style={styles.workoutDetails}>
                <Text style={styles.workoutTitle}>Workout</Text>
                <View style={styles.workoutStats}>
                  <View style={styles.workoutStat}>
                    <MaterialCommunityIcons name="map-marker-distance" size={16} color="#2196F3" />
                    <Text style={styles.workoutStatText}>{workout.distance.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.workoutStat}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#9C27B0" />
                    <Text style={styles.workoutStatText}>{formatTime(workout.movingTime)}</Text>
                  </View>
                  <View style={styles.workoutStat}>
                    <MaterialCommunityIcons name="fire" size={16} color="#FF9800" />
                    <Text style={styles.workoutStatText}>{Math.round(workout.calories)} cal</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
    </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  recentWorkoutsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
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
  averageContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  averageLabel: {
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  averageText: {
    color: '#666',
  },
  noDataContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    marginTop: 12,
    color: '#888',
    textAlign: 'center',
  },
  workoutItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  workoutItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  workoutDate: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006A6A10',
    borderRadius: 8,
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006A6A',
  },
  yearText: {
    fontSize: 12,
    color: '#006A6A80',
  },
  workoutDetails: {
    flex: 1,
    marginLeft: 16,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  workoutStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  workoutStatText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
}); 