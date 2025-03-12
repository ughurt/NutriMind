import React, { useState, useEffect } from 'react';
import { Portal, Dialog, TextInput, Button, Text } from 'react-native-paper';
import { Goal } from '../hooks/useGoals';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onUpdate: (value: number) => void;
  goal: Goal | null;
}

export const ProgressUpdateDialog = ({ visible, onDismiss, onUpdate, goal }: Props) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal) {
      setValue(goal.current.toString());
    }
  }, [goal]);

  const handleUpdate = () => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      setError('Please enter a valid number');
      return;
    }
    onUpdate(num);
    onDismiss();
  };

  if (!goal) return null;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Update Progress</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Current Value"
            value={value}
            onChangeText={(text) => {
              setValue(text);
              setError('');
            }}
            keyboardType="decimal-pad"
            error={!!error}
            right={<TextInput.Affix text={goal.type === 'weight' ? 'kg' : goal.type === 'calories' ? 'cal' : 'g'} />}
          />
          {error ? <Text style={{ color: '#B00020', fontSize: 12 }}>{error}</Text> : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleUpdate}>Update</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}; 