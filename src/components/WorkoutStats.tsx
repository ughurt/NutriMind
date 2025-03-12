import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutStats as WorkoutStatsType } from '../hooks/useWorkoutStats';

interface WorkoutStatsProps {
  stats: WorkoutStatsType;
  isTracking: boolean;
  onStartStop: () => void;
  onReset: () => void;
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes * 60) % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatPace = (pace: number): string => {
  if (pace === 0) return '--';
  const minutes = Math.floor(pace / 60);
  const seconds = Math.floor(pace % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/100m`;
};

export const WorkoutStats: React.FC<WorkoutStatsProps> = ({
  stats,
  isTracking,
  onStartStop,
  onReset,
}) => {
  return (
    <Surface style={styles.surface}>
      <LinearGradient
        colors={['#E7F5F5', '#FFFFFF']}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="run" size={24} color="#006A6A" />
            <Text variant="titleMedium" style={styles.title}>Today's Workout</Text>
          </View>
          <View style={styles.actions}>
            <IconButton
              icon={isTracking ? "stop" : "play"}
              mode="contained"
              containerColor={isTracking ? "#B00020" : "#006A6A"}
              iconColor="white"
              size={20}
              onPress={onStartStop}
            />
            {!isTracking && (
              <IconButton
                icon="refresh"
                mode="contained"
                containerColor="#666"
                iconColor="white"
                size={20}
                onPress={onReset}
                style={styles.resetButton}
              />
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color="#006A6A" />
            <Text variant="titleMedium" style={styles.statValue}>
              {stats.distance.toFixed(2)} km
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#006A6A" />
            <Text variant="titleMedium" style={styles.statValue}>
              {formatTime(stats.movingTime)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Moving Time</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="speedometer" size={20} color="#006A6A" />
            <Text variant="titleMedium" style={styles.statValue}>
              {formatPace(stats.avgPace)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Avg Pace</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#006A6A" />
            <Text variant="titleMedium" style={styles.statValue}>
              {stats.avgHeartRate ?? '--'} bpm
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Avg Heart Rate</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="fire" size={20} color="#006A6A" />
            <Text variant="titleMedium" style={styles.statValue}>
              {stats.calories}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Calories</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart" size={20} color="#006A6A" />
            <Text variant="titleMedium" style={styles.statValue}>
              {stats.maxHeartRate ?? '--'} bpm
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>Max Heart Rate</Text>
          </View>
        </View>

        {!stats.isWatchConnected && (
          <View style={styles.watchStatus}>
            <MaterialCommunityIcons name="watch" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.watchStatusText}>
              Smartwatch not connected - some metrics unavailable
            </Text>
          </View>
        )}
      </LinearGradient>
    </Surface>
  );
};

const styles = StyleSheet.create({
  surface: {
    borderRadius: 16,
    elevation: 2,
    margin: 16,
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#006A6A',
    fontWeight: '600',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statItem: {
    width: '33.33%',
    padding: 8,
    alignItems: 'center',
  },
  statValue: {
    marginTop: 4,
    marginBottom: 2,
    fontWeight: '500',
  },
  statLabel: {
    color: '#666',
  },
  watchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    marginTop: 8,
  },
  watchStatusText: {
    color: '#666',
    marginLeft: 4,
  },
}); 