import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Meal } from '../../../hooks/useMeals';
import { Goal } from '../../../hooks/useGoals';

interface Props {
  meals: Meal[];
  goals: Goal[];
}

export const SummaryCard = ({ meals, goals }: Props) => {
  // Calculate totals
  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fat: acc.fat + (meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Get goals
  const calorieGoal = goals.find(g => g.type === 'calories')?.target || 2000;
  const proteinGoal = goals.find(g => g.type === 'protein')?.target || 150;
  const carbsGoal = goals.find(g => g.type === 'carbs')?.target || 250;
  const fatGoal = goals.find(g => g.type === 'fat')?.target || 70;

  const nutritionItems = [
    {
      label: 'Calories',
      value: totals.calories,
      goal: calorieGoal,
      unit: 'kcal',
      icon: 'fire',
      color: '#FF9800',
    },
    {
      label: 'Protein',
      value: totals.protein,
      goal: proteinGoal,
      unit: 'g',
      icon: 'food-steak',
      color: '#F44336',
    },
    {
      label: 'Carbs',
      value: totals.carbs,
      goal: carbsGoal,
      unit: 'g',
      icon: 'bread-slice',
      color: '#4CAF50',
    },
    {
      label: 'Fat',
      value: totals.fat,
      goal: fatGoal,
      unit: 'g',
      icon: 'oil',
      color: '#FFC107',
    },
  ];

  return (
    <Surface style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Nutrition Summary</Text>
      <View style={styles.grid}>
        {nutritionItems.map((item) => (
          <View key={item.label} style={styles.gridItem}>
            <MaterialCommunityIcons 
              name={item.icon} 
              size={24} 
              color={item.color} 
              style={styles.icon}
            />
            <Text variant="titleMedium" style={styles.value}>
              {item.value}/{item.goal} {item.unit}
            </Text>
            <Text variant="bodySmall" style={styles.label}>{item.label}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min((item.value / item.goal) * 100, 100)}%`,
                    backgroundColor: item.color,
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
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
    marginBottom: 16,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },
  icon: {
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
}); 