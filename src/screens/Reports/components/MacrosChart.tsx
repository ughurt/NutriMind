import React from 'react';
import { View, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Text } from 'react-native-paper';
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

  const data = [
    {
      name: 'Protein',
      population: totals.protein,
      color: '#FF6B6B',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Carbs',
      population: totals.carbs,
      color: '#4ECDC4',
      legendFontColor: '#7F7F7F',
    },
    {
      name: 'Fat',
      population: totals.fat,
      color: '#FFD93D',
      legendFontColor: '#7F7F7F',
    },
  ];

  return (
    <View>
      {Object.values(totals).some(value => value > 0) ? (
        <PieChart
          data={data}
          width={Dimensions.get('window').width - 64}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      ) : (
        <Text style={{ textAlign: 'center', marginVertical: 20 }}>No data available</Text>
      )}
    </View>
  );
}; 