import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, ProgressBar, useTheme } from 'react-native-paper';
import { Meal } from '../../../hooks/useMeals';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface Props {
  meals: Meal[];
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export const DailyNutrition = ({ 
  meals, 
  calorieGoal,
  proteinGoal,
  carbsGoal,
  fatGoal 
}: Props) => {
  const theme = useTheme();
  
  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + Number(meal.calories || 0),
    protein: acc.protein + Number(meal.protein || 0),
    carbs: acc.carbs + Number(meal.carbs || 0),
    fat: acc.fat + Number(meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const getProgressColor = (current: number, goal: number) => {
    const ratio = current / goal;
    if (ratio > 1) return '#ef5350';
    if (ratio > 0.9) return '#ffa726';
    return '#4caf50';
  };
  
  const nutrientInfo = [
    {
      name: 'Protein',
      current: totals.protein,
      goal: proteinGoal,
      unit: 'g',
      icon: 'food-steak' as IconName,
      color: theme.colors.primary
    },
    {
      name: 'Carbs',
      current: totals.carbs,
      goal: carbsGoal,
      unit: 'g',
      icon: 'barley' as IconName,
      color: theme.colors.secondary
    },
    {
      name: 'Fat',
      current: totals.fat,
      goal: fatGoal,
      unit: 'g',
      icon: 'oil' as IconName,
      color: theme.colors.tertiary
    }
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>Nutrition Summary</Text>
      </View>

      <View style={styles.nutrientCards}>
        {nutrientInfo.map((nutrient) => (
          <Surface key={nutrient.name} style={styles.nutrientCard} elevation={1}>
            <View style={[styles.nutrientIconContainer, { backgroundColor: `${nutrient.color}15` }]}>
              <MaterialCommunityIcons 
                name={nutrient.icon} 
                size={22} 
                color={nutrient.color} 
        />
      </View>
            <View style={styles.nutrientInfo}>
              <Text variant="labelLarge" style={styles.nutrientName}>{nutrient.name}</Text>
              <View style={styles.nutrientValueRow}>
                <Text variant="bodyLarge" style={styles.nutrientValue}>
                  {Math.round(nutrient.current)}
                  <Text variant="bodySmall" style={styles.nutrientUnit}>/{nutrient.goal}{nutrient.unit}</Text>
                </Text>
        </View>
        <ProgressBar 
                progress={Math.min(nutrient.current / nutrient.goal, 1)}
                color={getProgressColor(nutrient.current, nutrient.goal)}
          style={styles.progressBar}
        />
      </View>
          </Surface>
        ))}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#006A6A',
    padding: 16,
  },
  title: {
    color: 'white',
    fontWeight: '600',
  },
  nutrientCards: {
    padding: 16,
    gap: 12,
  },
  nutrientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  nutrientIconContainer: {
    padding: 10,
    borderRadius: 50,
    marginRight: 16,
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontWeight: '500',
    marginBottom: 4,
  },
  nutrientValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  nutrientValue: {
    fontWeight: '600',
  },
  nutrientUnit: {
    color: '#666',
    marginLeft: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
}); 