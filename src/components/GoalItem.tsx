import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Goal } from '../hooks/useGoals';

interface GoalItemProps {
  goal: Goal;
}

const getGoalIcon = (type: string) => {
  switch (type) {
    case 'calories':
      return { name: 'fire', color: '#FF9800' };
    case 'protein':
      return { name: 'food-steak', color: '#F44336' };
    case 'carbs':
      return { name: 'bread-slice', color: '#4CAF50' };
    case 'fat':
      return { name: 'oil', color: '#FFC107' };
    default:
      return { name: 'target', color: '#2196F3' };
  }
};

const getUnitLabel = (type: string) => {
  switch (type) {
    case 'calories':
      return 'kcal';
    default:
      return 'g';
  }
};

export const GoalItem = ({ goal }: GoalItemProps) => {
  const icon = getGoalIcon(goal.type);
  const unit = getUnitLabel(goal.type);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name={icon.name} 
        size={24} 
        color={icon.color} 
        style={styles.icon}
      />
      <Text variant="titleMedium" style={styles.value}>
        {goal.target}{unit}
      </Text>
      <Text variant="bodySmall" style={styles.label}>
        {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
    elevation: 2,
  },
  icon: {
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 18,
  },
  label: {
    color: '#666',
    fontSize: 12,
  },
}); 