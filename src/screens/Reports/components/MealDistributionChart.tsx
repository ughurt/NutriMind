import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { Meal, MealType } from '../../../hooks/useMeals';

interface Props {
  meals: Meal[];
}

export const MealDistributionChart = ({ meals }: Props) => {
  const mealTypeColors = {
    breakfast: '#FFB74D',
    lunch: '#4FC3F7',
    dinner: '#FF8A65',
    snack: '#B39DDB',
  };

  const mealTypeTotals = meals.reduce((acc, meal) => {
    const type = meal.meal_type;
    acc[type] = (acc[type] || 0) + Number(meal.calories || 0);
    return acc;
  }, {} as Record<MealType, number>);

  const data = Object.entries(mealTypeTotals).map(([type, calories]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    calories,
    color: mealTypeColors[type as MealType],
    legendFontColor: '#666',
  }));

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Meal Distribution</Text>
      {data.length > 0 ? (
        <>
          <PieChart
            data={data}
            width={Dimensions.get('window').width - 64}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="calories"
            backgroundColor="transparent"
            paddingLeft="15"
          />
          <View style={styles.legend}>
            {data.map(item => (
              <View key={item.name} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text variant="bodySmall">{item.name}</Text>
                <Text variant="bodySmall">{Math.round(item.calories)} cal</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.noDataText}>No meal data available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  legend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
}); 