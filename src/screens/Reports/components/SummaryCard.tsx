import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar, useTheme } from 'react-native-paper';
import { Meal } from '../../../hooks/useMeals';

interface SummaryCardProps {
  meals: Meal[];
  goals: any[];
}

export const SummaryCard = ({ meals, goals }: SummaryCardProps) => {
  const theme = useTheme();

  // Calculate total nutrients from meals
  const nutritionSummary = meals.reduce(
    (acc, meal) => {
      return {
        calories: acc.calories + Number(meal.calories || 0),
        protein: acc.protein + Number(meal.protein || 0),
        carbs: acc.carbs + Number(meal.carbs || 0),
        fat: acc.fat + Number(meal.fat || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Get goals from provided goals array
  const calorieGoal = goals.find(g => g.type === 'calories')?.target || 2000;
  const proteinGoal = goals.find(g => g.type === 'protein')?.target || 150;
  const carbsGoal = goals.find(g => g.type === 'carbs')?.target || 250;
  const fatGoal = goals.find(g => g.type === 'fat')?.target || 70;

  // Calculate progress percentages
  const calorieProgress = nutritionSummary.calories / calorieGoal;
  const proteinProgress = nutritionSummary.protein / proteinGoal;
  const carbsProgress = nutritionSummary.carbs / carbsGoal;
  const fatProgress = nutritionSummary.fat / fatGoal;

  // Calculate macronutrient distribution
  const totalMacroCalories = 
    (nutritionSummary.protein * 4) + 
    (nutritionSummary.carbs * 4) + 
    (nutritionSummary.fat * 9);
  
  const macroDistribution = totalMacroCalories === 0 ? 
    { protein: 0, carbs: 0, fat: 0 } : 
    {
      protein: ((nutritionSummary.protein * 4) / totalMacroCalories) * 100,
      carbs: ((nutritionSummary.carbs * 4) / totalMacroCalories) * 100,
      fat: ((nutritionSummary.fat * 9) / totalMacroCalories) * 100,
    };

  const getProgressColor = (progress: number) => {
    if (progress > 1) return '#FF5252';
    if (progress > 0.9) return '#FFC107';
    return '#4CAF50';
  };

  const nutrientItems = [
    {
      name: 'Calories',
      current: nutritionSummary.calories,
      goal: calorieGoal,
      unit: 'kcal',
      progress: calorieProgress,
      color: getProgressColor(calorieProgress),
    },
    {
      name: 'Protein',
      current: nutritionSummary.protein,
      goal: proteinGoal,
      unit: 'g',
      progress: proteinProgress,
      color: theme.colors.primary, 
    },
    {
      name: 'Carbs',
      current: nutritionSummary.carbs,
      goal: carbsGoal,
      unit: 'g',
      progress: carbsProgress,
      color: theme.colors.secondary,
    },
    {
      name: 'Fat',
      current: nutritionSummary.fat,
      goal: fatGoal,
      unit: 'g',
      progress: fatProgress,
      color: theme.colors.tertiary,
    },
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      <Text variant="titleMedium" style={styles.title}>Nutrition Summary</Text>
      
      <View style={styles.totalCaloriesContainer}>
        <View style={styles.calorieDisplay}>
          <Text style={styles.calorieValue}>{Math.round(nutritionSummary.calories)}</Text>
          <Text style={styles.calorieUnit}>calories</Text>
        </View>
        <View style={styles.calorieGoalContainer}>
          <Text style={styles.calorieGoalText}>
            {Math.round((calorieProgress) * 100)}% of Daily Goal
          </Text>
          <View style={styles.calorieProgressBarContainer}>
            <View 
              style={[
                styles.calorieProgressBar, 
                { 
                  width: `${Math.min(calorieProgress * 100, 100)}%`,
                  backgroundColor: getProgressColor(calorieProgress)
                }
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.macroDistributionContainer}>
        <Text style={styles.sectionLabel}>Macronutrient Distribution</Text>
        <View style={styles.macroBar}>
          <View 
            style={[
              styles.macroSegment, 
              { 
                width: `${macroDistribution.protein}%`, 
                backgroundColor: theme.colors.primary 
              }
            ]} 
          />
          <View 
            style={[
              styles.macroSegment, 
              { 
                width: `${macroDistribution.carbs}%`, 
                backgroundColor: theme.colors.secondary 
              }
            ]} 
          />
              <View 
                style={[
              styles.macroSegment, 
                  { 
                width: `${macroDistribution.fat}%`, 
                backgroundColor: theme.colors.tertiary 
                  }
                ]} 
              />
        </View>
        <View style={styles.macroLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>Protein {Math.round(macroDistribution.protein)}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.secondary }]} />
            <Text style={styles.legendText}>Carbs {Math.round(macroDistribution.carbs)}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.tertiary }]} />
            <Text style={styles.legendText}>Fat {Math.round(macroDistribution.fat)}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.nutrientsContainer}>
        <Text style={styles.sectionLabel}>Daily Goals Progress</Text>
        {nutrientItems.map((item, index) => (
          <View key={index} style={styles.nutrientRow}>
            <View style={styles.nutrientHeader}>
              <Text style={styles.nutrientName}>{item.name}</Text>
              <Text style={styles.nutrientValues}>
                {Math.round(item.current)} / {item.goal} {item.unit}
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(item.progress, 1)}
              color={item.color}
              style={styles.progressBar}
            />
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
    borderRadius: 16,
  },
  title: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 16,
  },
  totalCaloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  calorieDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006A6A10',
    borderRadius: 12,
    padding: 12,
    width: 110,
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006A6A',
  },
  calorieUnit: {
    fontSize: 14,
    color: '#006A6A',
    opacity: 0.8,
  },
  calorieGoalContainer: {
    flex: 1,
    marginLeft: 16,
  },
  calorieGoalText: {
    color: '#444',
    marginBottom: 8,
    fontWeight: '500',
  },
  calorieProgressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  calorieProgressBar: {
    height: '100%',
  },
  macroDistributionContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  macroBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  macroSegment: {
    height: '100%',
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  nutrientsContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  nutrientRow: {
    marginBottom: 16,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutrientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  nutrientValues: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
}); 