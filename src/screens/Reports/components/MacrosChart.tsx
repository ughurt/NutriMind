import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Meal } from '../../../hooks/useMeals';

interface Props {
  meals: Meal[];
}

export const MacrosChart = ({ meals }: Props) => {
  const totals = meals.reduce((acc, meal) => ({
    protein: acc.protein + Number(meal.protein || 0),
    carbs: acc.carbs + Number(meal.carbs || 0),
    fat: acc.fat + Number(meal.fat || 0),
  }), { protein: 0, carbs: 0, fat: 0 });

  const totalCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fat * 9);
  
  const macroPercentages = {
    protein: totalCalories > 0 ? ((totals.protein * 4) / totalCalories) * 100 : 0,
    carbs: totalCalories > 0 ? ((totals.carbs * 4) / totalCalories) * 100 : 0,
    fat: totalCalories > 0 ? ((totals.fat * 9) / totalCalories) * 100 : 0,
  };

  const recommendedRanges = {
    protein: { min: 10, max: 35 },
    carbs: { min: 45, max: 65 },
    fat: { min: 20, max: 35 },
  };

  const getStatusColor = (macro: keyof typeof macroPercentages) => {
    const percentage = macroPercentages[macro];
    const range = recommendedRanges[macro];
    
    if (percentage < range.min) return '#FF9800'; // Under
    if (percentage > range.max) return '#F44336'; // Over
    return '#4CAF50'; // Good
  };

  const macroData = [
    {
      name: 'Protein',
      amount: totals.protein,
      percentage: macroPercentages.protein,
      color: '#FF6B6B',
      unit: 'g',
      calories: totals.protein * 4,
    },
    {
      name: 'Carbs',
      amount: totals.carbs,
      percentage: macroPercentages.carbs,
      color: '#4ECDC4',
      unit: 'g',
      calories: totals.carbs * 4,
    },
    {
      name: 'Fat',
      amount: totals.fat,
      percentage: macroPercentages.fat,
      color: '#FFD93D',
      unit: 'g',
      calories: totals.fat * 9,
    },
  ];

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>Macronutrient Distribution</Text>
        <Text style={styles.subtitle}>
          {totalCalories > 0 
            ? `${Math.round(totalCalories)} calories total`
            : 'No data available'}
        </Text>
      </View>

      {macroData.map((macro) => (
        <View key={macro.name} style={styles.macroItem}>
          <View style={styles.macroHeader}>
            <View style={styles.macroTitleContainer}>
              <View style={[styles.colorDot, { backgroundColor: macro.color }]} />
              <Text style={styles.macroName}>{macro.name}</Text>
            </View>
            <View style={styles.macroValues}>
              <Text style={styles.macroAmount}>
                {Math.round(macro.amount)}{macro.unit}
              </Text>
              <Text style={styles.macroPercentage}>
                {Math.round(macro.percentage)}%
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressBar,
                  { 
                    width: `${Math.min(macro.percentage, 100)}%`,
                    backgroundColor: macro.color,
                  }
                ]} 
              />
              {/* Recommended range indicator */}
              <View 
                style={[
                  styles.recommendedRange,
                  {
                    left: `${recommendedRanges[macro.name.toLowerCase() as keyof typeof recommendedRanges].min}%`,
                    width: `${recommendedRanges[macro.name.toLowerCase() as keyof typeof recommendedRanges].max - recommendedRanges[macro.name.toLowerCase() as keyof typeof recommendedRanges].min}%`,
                  }
                ]}
              />
            </View>
          </View>

          <Text style={[styles.status, { color: getStatusColor(macro.name.toLowerCase() as keyof typeof macroPercentages) }]}>
            {macro.percentage < recommendedRanges[macro.name.toLowerCase() as keyof typeof recommendedRanges].min
              ? 'Below recommended range'
              : macro.percentage > recommendedRanges[macro.name.toLowerCase() as keyof typeof recommendedRanges].max
              ? 'Above recommended range'
              : 'Within recommended range'}
          </Text>
        </View>
      ))}

      <View style={styles.legend}>
        <Text style={styles.legendText}>Recommended ranges:</Text>
        <Text style={styles.legendDetail}>Protein: 10-35%</Text>
        <Text style={styles.legendDetail}>Carbs: 45-65%</Text>
        <Text style={styles.legendDetail}>Fat: 20-35%</Text>
    </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666666',
    fontSize: 13,
  },
  macroItem: {
    marginBottom: 24,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  macroName: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  macroValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroAmount: {
    fontSize: 15,
    color: '#1A1A1A',
    marginRight: 8,
  },
  macroPercentage: {
    fontSize: 15,
    color: '#666666',
    width: 45,
    textAlign: 'right',
  },
  progressContainer: {
    marginBottom: 6,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  recommendedRange: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#00000010',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#00000020',
  },
  status: {
    fontSize: 12,
    marginTop: 4,
  },
  legend: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  legendText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  legendDetail: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
}); 