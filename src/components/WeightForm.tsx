import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, TextInput, Portal, Modal, Text } from 'react-native-paper';
import { WeightEntry } from '../hooks/useWeight';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSave: (weight: number, note?: string) => void;
  onEdit?: (id: string, weight: number, note?: string) => void;
  currentWeight?: number;
  editingEntry?: WeightEntry;
}

export const WeightForm = ({ visible, onDismiss, onSave, onEdit, currentWeight, editingEntry }: Props) => {
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingEntry) {
      setWeight(editingEntry.weight.toString());
      setNote(editingEntry.note || '');
    } else {
      setWeight(currentWeight?.toString() || '');
      setNote('');
    }
  }, [editingEntry, currentWeight, visible]);

  const handleSave = () => {
    const weightNum = Number(weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      setError('Please enter a valid weight');
      return;
    }

    if (editingEntry) {
      console.log('Editing weight:', { id: editingEntry.id, weight: weightNum, note });
      onEdit?.(editingEntry.id, weightNum, note.trim() || undefined);
    } else {
      console.log('Adding new weight:', { weight: weightNum, note });
      onSave(weightNum, note.trim() || undefined);
    }
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Text variant="titleLarge" style={styles.title}>
          {editingEntry ? 'Edit Weight Entry' : 'Log Weight'}
        </Text>

        <TextInput
          mode="outlined"
          label="Weight (kg)"
          value={weight}
          onChangeText={(text) => {
            setWeight(text);
            setError('');
          }}
          keyboardType="decimal-pad"
          error={!!error}
          style={styles.input}
          right={<TextInput.Affix text="kg" />}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          mode="outlined"
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          style={styles.input}
          multiline
          numberOfLines={2}
        />

        <View style={styles.buttons}>
          <Button onPress={onDismiss} style={styles.button}>
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSave} 
            style={styles.button}
          >
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    marginLeft: 8,
  },
}); 