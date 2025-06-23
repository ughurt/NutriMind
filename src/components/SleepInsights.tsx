import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  sleepHours: number;
  sleepQuality: number;
  bedTime: string;
  wakeTime: string;
  streak: number;
}

export const SleepInsights = ({ sleepHours, sleepQuality, bedTime, wakeTime, streak }: Props) => {
  const getSleepScore = () => {
    // Calculate sleep score based on duration and quality
    const durationScore = Math.min((sleepHours / 8) * 50, 50);
    const qualityScore = (sleepQuality / 5) * 50;
    return Math.round(durationScore + qualityScore);
  };

  const getInsight = () => {
    const insights = [];
    
    // Sleep duration insights
    if (sleepHours < 6) {
      insights.push({
        icon: 'alert-circle' as const,
        color: '#F44336',
        message: "You're getting less than the recommended 7-9 hours of sleep",
        tip: 'Try going to bed 30 minutes earlier tonight',
      });
    } else if (sleepHours > 9) {
      insights.push({
        icon: 'information' as const,
        color: '#FFC107',
        message: 'You might be oversleeping',
        tip: 'Consider gradually reducing sleep duration',
      });
    }

    // Sleep schedule insights
    const [bedHour] = bedTime.split(':').map(Number);
    if (bedHour < 22 || bedHour > 23) {
      insights.push({
        icon: 'clock-outline' as const,
        color: '#2196F3',
        message: 'Your bedtime is outside the optimal window (10 PM - 11 PM)',
        tip: 'Try to maintain a consistent sleep schedule',
      });
    }

    // Sleep quality insights
    if (sleepQuality < 3) {
      insights.push({
        icon: 'star-outline' as const,
        color: '#FF9800',
        message: 'Your sleep quality could be improved',
        tip: 'Consider reducing screen time before bed and keeping your room cool and dark',
      });
    }

    return insights;
  };

  const sleepScore = getSleepScore();
  const insights = getInsight();

  return (
    <Surface style={styles.container}>
      {/* Sleep Score */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{sleepScore}</Text>
          <Text style={styles.scoreLabel}>Sleep Score</Text>
        </View>
        {streak > 0 && (
          <View style={styles.streakContainer}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF9800" />
            <Text style={styles.streakText}>{streak} day streak!</Text>
          </View>
        )}
      </View>

      {/* Sleep Insights */}
      <View style={styles.insightsContainer}>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <MaterialCommunityIcons 
                name={insight.icon} 
                size={24} 
                color={insight.color} 
              />
              <Text style={[styles.insightMessage, { color: insight.color }]}>
                {insight.message}
              </Text>
            </View>
            <Text style={styles.insightTip}>{insight.tip}</Text>
          </View>
        ))}
      </View>

      {/* Sleep Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-time-eight" size={20} color="#666" />
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{sleepHours} hours</Text>
          <ProgressBar 
            progress={Math.min(sleepHours / 9, 1)} 
            color="#2196F3"
            style={styles.progressBar}
          />
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star" size={20} color="#666" />
          <Text style={styles.statLabel}>Quality</Text>
          <Text style={styles.statValue}>{sleepQuality}/5</Text>
          <ProgressBar 
            progress={sleepQuality / 5} 
            color="#4CAF50"
            style={styles.progressBar}
          />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 20,
  },
  streakText: {
    marginLeft: 4,
    color: '#FF9800',
    fontWeight: '600',
  },
  insightsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightMessage: {
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  insightTip: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    width: 100,
  },
}); 