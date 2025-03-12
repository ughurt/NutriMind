import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, ProgressBar } from 'react-native-paper';
import { Meal } from '../../../hooks/useMeals';

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

  return (
    <Surface style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Daily Nutrition</Text>

      <View style={styles.nutrientRow}>
        <View style={styles.labelContainer}>
          <Text variant="bodyMedium">Calories</Text>
          <Text variant="bodySmall">{`${Math.round(totals.calories)} / ${calorieGoal}`}</Text>
        </View>
        <ProgressBar 
          progress={Math.min(totals.calories / calorieGoal, 1)}
          color={getProgressColor(totals.calories, calorieGoal)}
          style={styles.progressBar}
        />
      </View>

      <View style={styles.nutrientRow}>
        <View style={styles.labelContainer}>
          <Text variant="bodyMedium">Protein</Text>
          <Text variant="bodySmall">{`${Math.round(totals.protein)}g / ${proteinGoal}g`}</Text>
        </View>
        <ProgressBar 
          progress={Math.min(totals.protein / proteinGoal, 1)}
          color={getProgressColor(totals.protein, proteinGoal)}
          style={styles.progressBar}
        />
      </View>

      <View style={styles.nutrientRow}>
        <View style={styles.labelContainer}>
          <Text variant="bodyMedium">Carbs</Text>
          <Text variant="bodySmall">{`${Math.round(totals.carbs)}g / ${carbsGoal}g`}</Text>
        </View>
        <ProgressBar 
          progress={Math.min(totals.carbs / carbsGoal, 1)}
          color={getProgressColor(totals.carbs, carbsGoal)}
          style={styles.progressBar}
        />
      </View>

      <View style={styles.nutrientRow}>
        <View style={styles.labelContainer}>
          <Text variant="bodyMedium">Fat</Text>
          <Text variant="bodySmall">{`${Math.round(totals.fat)}g / ${fatGoal}g`}</Text>
        </View>
        <ProgressBar 
          progress={Math.min(totals.fat / fatGoal, 1)}
          color={getProgressColor(totals.fat, fatGoal)}
          style={styles.progressBar}
        />
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
  },
  nutrientRow: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
}); 