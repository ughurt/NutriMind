import React from 'react';
import { View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Text } from 'react-native-paper';
import { Meal } from '../../../hooks/useMeals';

interface Props {
  meals: Meal[];
}

export const NutrientsChart = ({ meals }: Props) => {
  const totals = meals.reduce((acc, meal) => ({
    fiber: acc.fiber + Number(meal.fiber || 0),
    sugar: acc.sugar + Number(meal.sugar || 0),
    sodium: acc.sodium + Number(meal.sodium || 0),
    calcium: acc.calcium + Number(meal.calcium || 0),
  }), { fiber: 0, sugar: 0, sodium: 0, calcium: 0 });

  const data = {
    labels: ['Fiber', 'Sugar', 'Sodium', 'Calcium'],
    datasets: [{
      data: [
        totals.fiber,
        totals.sugar,
        totals.sodium / 1000, // Convert to grams
        totals.calcium / 1000, // Convert to grams
      ],
    }],
  };

  return (
    <View>
      <BarChart
        data={data}
        width={Dimensions.get('window').width - 64}
        height={220}
        yAxisSuffix="g"
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 106, 106, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.7,
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
        {Object.entries(totals).map(([key, value]) => (
          <View key={key} style={styles.nutrientItem}>
            <Text variant="bodyLarge">
              {key === 'sodium' || key === 'calcium' 
                ? `${(value / 1000).toFixed(1)}g`
                : `${Math.round(value)}g`
              }
            </Text>
            <Text variant="bodySmall" style={styles.nutrientLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = {
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientLabel: {
    color: '#666',
    marginTop: 4,
  },
}; 