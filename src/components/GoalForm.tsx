import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, TextInput, Portal, Modal, Text, SegmentedButtons, HelperText, Surface, IconButton } from 'react-native-paper';
import { Goal } from '../hooks/useGoals';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSave: (goal: Partial<Goal>) => void;
  onDelete?: () => void;
  initialValues?: Goal;
}

export const GoalForm = ({ visible, onDismiss, onSave, onDelete, initialValues }: Props) => {
  const [type, setType] = useState(initialValues?.type || 'weight');
  const [target, setTarget] = useState(initialValues?.target?.toString() || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setType(initialValues.type);
      setTarget(initialValues.target.toString());
    } else {
      setType('weight');
      setTarget('');
    }
    setError('');
  }, [initialValues, visible]);

  const validateTarget = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) {
      setError('Please enter a valid number');
      return false;
    }

    const limits = {
      weight: { min: 20, max: 300 },
      calories: { min: 500, max: 5000 },
      protein: { min: 10, max: 300 },
      steps: { min: 1000, max: 50000 }
    };

    const { min, max } = limits[type];
    if (num < min || num > max) {
      setError(`Value must be between ${min} and ${max}`);
      return false;
    }

    setError('');
    return true;
  };

  const handleSave = () => {
    if (!target.trim()) {
      setError('Please enter a target value');
      return;
    }

    if (!validateTarget(target)) {
      return;
    }

    onSave({
      type,
      target: Number(target),
    });
    onDismiss();
  };

  const getUnitLabel = (goalType: Goal['type']) => {
    switch (goalType) {
      case 'weight':
        return 'kg';
      case 'calories':
        return 'cal';
      case 'steps':
        return 'steps';
      default:
        return 'g';
    }
  };

  const getGoalDescription = (goalType: Goal['type']) => {
    const limits = {
      weight: { min: 20, max: 300 },
      calories: { min: 500, max: 5000 },
      protein: { min: 10, max: 300 },
      steps: { min: 1000, max: 50000 }
    };

    switch (goalType) {
      case 'weight':
        return `Set your target weight (${limits.weight.min}-${limits.weight.max}kg)`;
      case 'calories':
        return `Set your daily calorie goal (${limits.calories.min}-${limits.calories.max})`;
      case 'protein':
        return `Set your daily protein target (${limits.protein.min}-${limits.protein.max}g)`;
      case 'steps':
        return `Set your daily steps goal (${limits.steps.min.toLocaleString()}-${limits.steps.max.toLocaleString()})`;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Surface style={styles.surface}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <IconButton
                icon="close"
                size={24}
                onPress={onDismiss}
              />
              <Text variant="titleLarge" style={styles.title}>
                {initialValues ? 'Edit Goal' : 'Set New Goal'}
              </Text>
              {initialValues && onDelete && (
                <IconButton
                  icon="delete"
                  size={24}
                  iconColor="#ef5350"
                  onPress={onDelete}
                />
              )}
              {!initialValues && (
                <View style={{ width: 40 }} />
              )}
            </View>

            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.label}>Goal Type</Text>
              <SegmentedButtons
                value={type}
                onValueChange={value => {
                  setType(value as Goal['type']);
                  setTarget('');
                  setError('');
                }}
                buttons={[
                  { value: 'weight', label: 'Weight', icon: 'scale-bathroom' },
                  { value: 'calories', label: 'Calories', icon: 'fire' },
                  { value: 'protein', label: 'Protein', icon: 'egg' },
                  { value: 'steps', label: 'Steps', icon: 'walk' },
                ]}
                style={styles.typeSelector}
              />
              <HelperText type="info" style={styles.helperText}>
                {getGoalDescription(type)}
              </HelperText>
            </View>

            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.label}>Target Value</Text>
              <TextInput
                mode="outlined"
                value={target}
                onChangeText={(text) => {
                  setTarget(text);
                  if (text.trim()) {
                    validateTarget(text);
                  } else {
                    setError('');
                  }
                }}
                placeholder={`Enter target ${getUnitLabel(type)}`}
                keyboardType="decimal-pad"
                error={!!error}
                style={styles.input}
                right={<TextInput.Affix text={getUnitLabel(type)} />}
              />
              {error ? (
                <HelperText type="error" visible={!!error}>
                  {error}
                </HelperText>
              ) : null}
            </View>

            <View style={styles.buttons}>
              <Button 
                mode="contained" 
                onPress={handleSave}
                disabled={!target.trim() || !!error}
                style={styles.button}
              >
                {initialValues ? 'Update' : 'Save'}
              </Button>
            </View>
          </ScrollView>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    maxHeight: '80%',
  },
  surface: {
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    textAlign: 'center',
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    marginBottom: 8,
    color: '#666',
    fontWeight: '500',
  },
  typeSelector: {
    marginBottom: 8,
  },
  helperText: {
    marginVertical: 4,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  button: {
    minWidth: 120,
    borderRadius: 20,
  },
}); 