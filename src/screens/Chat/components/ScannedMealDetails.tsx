import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface, Chip, Button, useTheme, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MealData } from '../../../types/MealData'; // Assuming MealData type exists or needs to be created
import { RootStackParamList } from '../../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the type for the component props
interface ScannedMealDetailsProps {
  mealData: MealData;
  onAddToDiary: (mealType: string) => void;
  onCancel: () => void;
}

// Define the component
export const ScannedMealDetails = ({ mealData, onAddToDiary, onCancel }: ScannedMealDetailsProps) => {
  const theme = useTheme();
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);

  // Calculate macronutrient distribution
  const totalMacros = mealData.protein + mealData.carbs + mealData.fat;
  const macroDistribution = totalMacros === 0 ? 
    { protein: 0, carbs: 0, fat: 0 } : 
    {
      protein: ((mealData.protein * 4) / ((mealData.protein * 4) + (mealData.carbs * 4) + (mealData.fat * 9))) * 100, // Using 4kcal/g for protein/carbs, 9kcal/g for fat
      carbs: ((mealData.carbs * 4) / ((mealData.protein * 4) + (mealData.carbs * 4) + (mealData.fat * 9))) * 100,
      fat: ((mealData.fat * 9) / ((mealData.protein * 4) + (mealData.carbs * 4) + (mealData.fat * 9))) * 100,
    };

  // Nutritional Information Items
  const nutritionItems = [
    { name: 'Calories', value: mealData.calories, unit: 'kcal', icon: 'fire', color: theme.colors.error },
    { name: 'Protein', value: mealData.protein, unit: 'g', icon: 'food-steak', color: theme.colors.primary },
    { name: 'Carbs', value: mealData.carbs, unit: 'g', icon: 'bread-slice', color: theme.colors.secondary },
    { name: 'Fat', value: mealData.fat, unit: 'g', icon: 'oil', color: theme.colors.tertiary },
  ];

  // Meal Types for selection
  const mealTypes = [
    { label: 'Breakfast', value: 'breakfast', icon: 'coffee' },
    { label: 'Lunch', value: 'lunch', icon: 'food' },
    { label: 'Dinner', value: 'dinner', icon: 'food-turkey' },
    { label: 'Snack', value: 'snack', icon: 'food-apple' },
  ];

  return (
    <Surface style={styles.container} elevation={2}>
      {/* Nutritional Information */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Nutritional Information</Text>
      <View style={styles.nutritionGrid}>
        {nutritionItems.map((item) => (
          <Surface key={item.name} style={styles.nutritionCard} elevation={1}>
            <View style={[styles.nutrientIconContainer, { backgroundColor: `${item.color}20` }]}>
              <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.nutritionValue}>{Math.round(item.value)}</Text>
            <Text style={styles.nutritionLabel}>{item.unit}</Text>
            <Text style={styles.nutritionName}>{item.name}</Text>
          </Surface>
        ))}
      </View>

      {/* Macronutrient Distribution */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Macronutrient Distribution</Text>
      <View style={styles.macroDistributionContainer}>
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
          {totalMacros > 0 && (
            <>
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
            </>
          )}
        </View>
      </View>

      {/* Add to Meal Diary Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Add to meal diary:</Text>
      <View style={styles.mealTypeContainer}>
        {mealTypes.map((type) => (
          <Chip
            key={type.value}
            icon={type.icon as any}
            selected={selectedMealType === type.value}
            onPress={() => setSelectedMealType(type.value)}
            style={styles.mealTypeChip}
            selectedColor={theme.colors.primary}
          >
            {type.label}
          </Chip>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <Button 
          mode="contained" 
          onPress={() => onAddToDiary(selectedMealType || '')}
          disabled={!selectedMealType}
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
        >
          Add to...
        </Button>
        <Button 
          mode="outlined" 
          onPress={onCancel}
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
        >
          Cancel
        </Button>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
    marginTop: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  nutritionCard: {
    width: '48%', // Adjust width for two cards per row
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nutrientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  nutritionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  macroDistributionContainer: {
    marginBottom: 24,
  },
  macroBar: {
    height: 20,
    flexDirection: 'row'
  },
  macroSegment: {
    height: '100%',
  },
  macroLegend: {
    flexDirection: 'row'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#555',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  mealTypeChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonLabel: {

  },
}); 