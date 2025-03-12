import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, IconButton, Surface, Portal, Dialog, useTheme, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGoals } from '../../../hooks/useGoals';
import * as Haptics from 'expo-haptics';

type GoalType = 'calories' | 'protein' | 'carbs' | 'fat';

interface Goal {
  id?: string;
  user_id?: string;
  type: GoalType;
  target: number;
}

interface Props {
  onDismiss: () => void;
  currentGoals: Goal[];
}

interface ValidationErrors {
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

interface PresetGoals {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const GOAL_PRESETS: PresetGoals[] = [
  {
    name: 'Weight Loss',
    description: 'Lower calories with higher protein for preserving muscle',
    calories: 1800,
    protein: 150,
    carbs: 180,
    fat: 60,
  },
  {
    name: 'Maintenance',
    description: 'Balanced macronutrients for maintaining weight',
    calories: 2200,
    protein: 130,
    carbs: 275,
    fat: 73,
  },
  {
    name: 'Muscle Gain',
    description: 'Higher calories and protein for muscle growth',
    calories: 2800,
    protein: 180,
    carbs: 350,
    fat: 78,
  },
];

const DEFAULT_GOALS = {
  calories: '2200',
  protein: '130',
  carbs: '275',
  fat: '73',
};

const RECOMMENDED_RANGES = {
  calories: { min: 1200, max: 8000, unit: 'kcal' },
  protein: { min: 30, max: 400, unit: 'g' },
  carbs: { min: 50, max: 600, unit: 'g' },
  fat: { min: 20, max: 200, unit: 'g' },
};

export const EditGoalsForm = ({ onDismiss, currentGoals }: Props) => {
  const { updateGoals, loadGoals } = useGoals();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPresets, setShowPresets] = useState(false);
  const [showInfo, setShowInfo] = useState<GoalType | null>(null);
  const [activityLevel, setActivityLevel] = useState('moderate');

  const [values, setValues] = useState({
    calories: currentGoals.find(g => g.type === 'calories')?.target.toString() || DEFAULT_GOALS.calories,
    protein: currentGoals.find(g => g.type === 'protein')?.target.toString() || DEFAULT_GOALS.protein,
    carbs: currentGoals.find(g => g.type === 'carbs')?.target.toString() || DEFAULT_GOALS.carbs,
    fat: currentGoals.find(g => g.type === 'fat')?.target.toString() || DEFAULT_GOALS.fat,
  });

  // Calculate macronutrient distribution
  const totalMacroCalories = 
    (parseInt(values.protein) * 4) + 
    (parseInt(values.carbs) * 4) + 
    (parseInt(values.fat) * 9);

  const macroDistribution = {
    protein: ((parseInt(values.protein) * 4) / totalMacroCalories) * 100,
    carbs: ((parseInt(values.carbs) * 4) / totalMacroCalories) * 100,
    fat: ((parseInt(values.fat) * 9) / totalMacroCalories) * 100,
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.entries(RECOMMENDED_RANGES).forEach(([type, range]) => {
      const value = parseInt(values[type as GoalType]);
      if (!value || value < range.min || value > range.max) {
        newErrors[type as GoalType] = `Please enter a valid ${type} goal between ${range.min} and ${range.max}${range.unit}`;
        isValid = false;
      }
    });

    // Validate macronutrient distribution
    if (Math.abs(totalMacroCalories - parseInt(values.calories)) > 100) {
      newErrors.calories = 'Total calories from macronutrients should approximately match calorie goal';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      const newGoals: Omit<Goal, 'id' | 'user_id'>[] = [
        { type: 'calories', target: parseInt(values.calories) },
        { type: 'protein', target: parseInt(values.protein) },
        { type: 'carbs', target: parseInt(values.carbs) },
        { type: 'fat', target: parseInt(values.fat) },
      ];

      await updateGoals(newGoals);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDismiss();
    } catch (error) {
      console.error('Failed to update goals:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Show error to user
      setErrors(prev => ({
        ...prev,
        calories: 'Failed to update goals. Please try again.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof values, value: string) => {
    if (value && !/^\d*$/.test(value)) return;
    
    setValues(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const applyPreset = (preset: PresetGoals) => {
    setValues({
      calories: preset.calories.toString(),
      protein: preset.protein.toString(),
      carbs: preset.carbs.toString(),
      fat: preset.fat.toString(),
    });
    setShowPresets(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const resetToDefaults = () => {
    setValues(DEFAULT_GOALS);
    setErrors({});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getInfoContent = (type: GoalType) => {
    switch (type) {
      case 'calories':
        return 'Your daily calorie goal should be based on your age, weight, height, activity level, and goals.';
      case 'protein':
        return 'Protein is essential for muscle maintenance and growth. Aim for 1.6-2.2g per kg of body weight.';
      case 'carbs':
        return 'Carbohydrates are your body\'s main energy source. The amount needed varies based on activity level.';
      case 'fat':
        return 'Healthy fats are essential for hormone production and nutrient absorption. Aim for 20-35% of total calories.';
      default:
        return '';
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>Edit Daily Goals</Text>
          <View style={styles.headerButtons}>
            <IconButton
              icon="refresh"
              size={24}
              onPress={resetToDefaults}
            />
            <IconButton
              icon="lightning-bolt"
              size={24}
              onPress={() => setShowPresets(true)}
            />
          </View>
        </View>

        <Surface style={styles.activitySection} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Activity Level</Text>
          <SegmentedButtons
            value={activityLevel}
            onValueChange={setActivityLevel}
            buttons={[
              { value: 'sedentary', label: 'Low' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'active', label: 'High' },
            ]}
          />
        </Surface>

        <Surface style={styles.macroDistribution} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Macronutrient Distribution</Text>
          <View style={styles.macroBar}>
            <View style={[styles.macroSegment, { width: `${macroDistribution.protein}%`, backgroundColor: theme.colors.primary }]} />
            <View style={[styles.macroSegment, { width: `${macroDistribution.carbs}%`, backgroundColor: theme.colors.secondary }]} />
            <View style={[styles.macroSegment, { width: `${macroDistribution.fat}%`, backgroundColor: theme.colors.tertiary }]} />
          </View>
          <View style={styles.macroLegend}>
            <Text variant="bodySmall">Protein {Math.round(macroDistribution.protein)}%</Text>
            <Text variant="bodySmall">Carbs {Math.round(macroDistribution.carbs)}%</Text>
            <Text variant="bodySmall">Fat {Math.round(macroDistribution.fat)}%</Text>
          </View>
        </Surface>

        {Object.entries(RECOMMENDED_RANGES).map(([type, range]) => (
          <Surface key={type} style={styles.inputSurface} elevation={0}>
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Text style={styles.label}>{type.charAt(0).toUpperCase() + type.slice(1)} ({range.unit})</Text>
                <IconButton
                  icon="information"
                  size={20}
                  onPress={() => setShowInfo(type as GoalType)}
                />
              </View>
              <TextInput
                value={values[type as GoalType]}
                onChangeText={text => handleInputChange(type as GoalType, text)}
                keyboardType="numeric"
                mode="outlined"
                error={!!errors[type as GoalType]}
                style={styles.input}
                right={<TextInput.Affix text={range.unit} />}
              />
              <HelperText type="error" visible={!!errors[type as GoalType]}>
                {errors[type as GoalType]}
              </HelperText>
              <Text variant="bodySmall" style={styles.rangeText}>
                Recommended: {range.min} - {range.max} {range.unit}
              </Text>
            </View>
          </Surface>
        ))}
      </ScrollView>

      <Surface style={styles.bottomBar} elevation={4}>
        <View style={styles.buttons}>
          <Button 
            mode="outlined" 
            onPress={onDismiss} 
            style={styles.button}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSave}
            loading={loading}
            style={[styles.button, styles.saveButton]}
          >
            Save Changes
          </Button>
        </View>
      </Surface>

      <Portal>
        <Dialog visible={showPresets} onDismiss={() => setShowPresets(false)}>
          <Dialog.Title>Quick Presets</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <ScrollView style={styles.presetScroll}>
              {GOAL_PRESETS.map((preset, index) => (
                <Surface
                  key={index}
                  style={styles.presetCard}
                  elevation={1}
                  onTouchEnd={() => applyPreset(preset)}
                >
                  <Text variant="titleMedium">{preset.name}</Text>
                  <Text variant="bodySmall" style={styles.presetDescription}>
                    {preset.description}
                  </Text>
                  <View style={styles.presetValues}>
                    <Text variant="bodySmall">
                      {preset.calories} kcal • {preset.protein}g protein • {preset.carbs}g carbs • {preset.fat}g fat
                    </Text>
                  </View>
                </Surface>
              ))}
            </ScrollView>
          </Dialog.Content>
        </Dialog>

        <Dialog visible={!!showInfo} onDismiss={() => setShowInfo(null)}>
          <Dialog.Title>
            {showInfo && showInfo.charAt(0).toUpperCase() + showInfo.slice(1)} Information
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{showInfo && getInfoContent(showInfo)}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInfo(null)}>Got it</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
    minHeight: 500,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#006A6A',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  activitySection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#666',
  },
  macroDistribution: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  macroBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  macroSegment: {
    height: '100%',
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  inputSurface: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  inputContainer: {
    marginBottom: 0,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
  },
  rangeText: {
    color: '#666',
    marginTop: 4,
  },
  bottomBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    width: '100%',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 25,
  },
  saveButton: {
    backgroundColor: '#006A6A',
  },
  presetCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  presetDescription: {
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  presetValues: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  dialogContent: {
    paddingHorizontal: 0,
    maxHeight: 400,
  },
  presetScroll: {
    paddingHorizontal: 20,
  },
}); 