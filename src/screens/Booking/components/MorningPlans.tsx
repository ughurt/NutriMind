import React, { useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Text, Surface, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExerciseDemo } from './ExerciseDemo';

interface MorningPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  intensity: string;
  calories: string;
  exercises: string[];
  imageUrl: string;
}

const morningPlans: MorningPlan[] = [
  {
    id: 'morning-1',
    title: 'Morning Energy Boost',
    description: 'A simple warm-up and exercise routine to start your day',
    duration: '20 mins',
    intensity: 'Low to Medium',
    calories: '120-150',
    exercises: [
      'Warm-up walk',
      'Arm & shoulder stretches',
      'Basic squats',
      'Standing knee lifts',
      'Cool-down stretches'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: 'morning-2',
    title: 'Sunrise Yoga Flow',
    description: 'Gentle morning yoga routine with mindful nutrition guidance',
    duration: '45 mins',
    intensity: 'Low',
    calories: '150-200',
    exercises: [
      'Sun salutations',
      'Balance poses',
      'Breathing exercises',
      'Meditation'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=500&auto=format&fit=crop'
  }
];

export const MorningPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const theme = useTheme();

  if (selectedPlan === 'morning-1') {
    return <ExerciseDemo />;
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <MaterialCommunityIcons name="white-balance-sunny" size={24} color="#FF9800" />
        <View style={styles.headerText}>
          <Text variant="titleLarge" style={styles.title}>Morning Plans</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Start your day right with these curated plans</Text>
        </View>
      </Surface>

      <View style={styles.plansContainer}>
        {morningPlans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <Surface style={styles.cardContent} elevation={1}>
              <Image
                source={{ uri: plan.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardBody}>
                <Text variant="titleMedium" style={styles.planTitle}>{plan.title}</Text>
                <Text variant="bodyMedium" style={styles.planDescription}>{plan.description}</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                    <Text variant="bodyMedium" style={styles.statText}>{plan.duration}</Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="lightning-bolt" size={20} color="#666" />
                    <Text variant="bodyMedium" style={styles.statText}>{plan.intensity}</Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="fire" size={20} color="#666" />
                    <Text variant="bodyMedium" style={styles.statText}>{plan.calories} cal</Text>
                  </View>
                </View>

                <View style={styles.exerciseList}>
                  {plan.exercises.map((exercise, i) => (
                    <View key={i} style={styles.exerciseItem}>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                      <Text variant="bodyMedium" style={styles.exerciseText}>{exercise}</Text>
                    </View>
                  ))}
                </View>

                <Button
                  mode="contained"
                  style={styles.button}
                  buttonColor="#006A6A"
                  textColor="white"
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {plan.id === 'morning-1' ? 'View Exercises' : 'Start Plan'}
                </Button>
              </View>
            </Surface>
          </View>
        ))}
      </View>
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
  plansContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardBody: {
    padding: 16,
  },
  planTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginBottom: 8,
  },
  planDescription: {
    color: '#666666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#666666',
    fontSize: 13,
  },
  exerciseList: {
    gap: 8,
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseText: {
    color: '#333333',
    fontSize: 14,
  },
  button: {
    borderRadius: 8,
  },
}); 