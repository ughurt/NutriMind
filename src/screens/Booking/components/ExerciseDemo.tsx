import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Exercise {
  name: string;
  description: string;
  duration: string;
  emoji: string;
  tips: string[];
}

const exercises: Exercise[] = [
  {
    name: 'Warm-Up Walk',
    description: 'Light walking in place to increase blood flow',
    duration: '3 mins',
    emoji: '🚶‍♂️',
    tips: ['Start at a comfortable pace', 'Swing arms naturally', 'Breathe normally']
  },
  {
    name: 'Arm & Shoulder Stretches',
    description: 'Simple arm circles and shoulder rolls',
    duration: '2 mins',
    emoji: '🙆‍♂️',
    tips: ['Roll shoulders back and forth', 'Make small circles, then larger', 'Keep movements gentle']
  },
  {
    name: 'Basic Squats',
    description: 'Simple squats with focus on form',
    duration: '5 mins',
    emoji: '🏋️‍♂️',
    tips: ['Keep feet shoulder-width apart', 'Lower only as far as comfortable', 'Keep your back straight']
  },
  {
    name: 'Standing Knee Lifts',
    description: 'Alternating knee raises for core and balance',
    duration: '5 mins',
    emoji: '🦵',
    tips: ['Hold onto wall if needed', 'Lift knees to comfortable height', 'Keep a steady pace']
  },
  {
    name: 'Cool-Down Stretches',
    description: 'Gentle full-body stretches to finish',
    duration: '5 mins',
    emoji: '🧘‍♂️',
    tips: ['Hold each stretch for 15-20 seconds', 'Breathe deeply', 'Never bounce or force stretches']
  }
];

export const ExerciseDemo = () => {
  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <MaterialCommunityIcons name="run" size={24} color="#006A6A" />
        <View style={styles.headerText}>
          <Text variant="titleLarge" style={styles.title}>Exercise Guide</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Follow along with these demonstrations</Text>
        </View>
      </Surface>

      <ScrollView style={styles.exercisesContainer}>
        {exercises.map((exercise, index) => (
          <Surface key={index} style={styles.exerciseCard} elevation={1}>
            <View style={styles.exerciseImage}>
              <Text style={styles.emoji}>{exercise.emoji}</Text>
            </View>
            <View style={styles.exerciseContent}>
              <View style={styles.exerciseHeader}>
                <Text variant="titleMedium" style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.durationChip}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#006A6A" />
                  <Text style={styles.durationText}>{exercise.duration}</Text>
                </View>
              </View>
              
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Key Tips:</Text>
                {exercise.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Surface>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  subtitle: {
    color: '#666666',
  },
  exercisesContainer: {
    paddingHorizontal: 16,
  },
  exerciseCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 100,
  },
  exerciseContent: {
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    color: '#006A6A',
    fontWeight: '600',
    flex: 1,
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  durationText: {
    color: '#006A6A',
    fontSize: 12,
    marginLeft: 4,
  },
  exerciseDescription: {
    color: '#666666',
    marginBottom: 12,
  },
  tipsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  tipsTitle: {
    color: '#333333',
    fontWeight: '600',
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tipText: {
    color: '#333333',
    fontSize: 14,
    marginLeft: 8,
  },
}); 