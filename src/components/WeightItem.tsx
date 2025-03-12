import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { format } from 'date-fns';
import { WeightEntry } from '../hooks/useWeight';

interface Props {
  entry: WeightEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export const WeightItem = ({ entry, onEdit, onDelete }: Props) => {
  return (
    <Surface style={styles.container}>
      <View style={styles.content}>
        <View style={styles.weightInfo}>
          <Text variant="titleMedium">{entry.weight} kg</Text>
          <Text variant="bodySmall" style={styles.date}>
            {format(new Date(entry.date), 'MMM d, yyyy')}
          </Text>
          {entry.note && (
            <Text variant="bodySmall" style={styles.note}>
              {entry.note}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={onEdit}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor="#ef5350"
            onPress={onDelete}
          />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  weightInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: '#666',
    marginTop: 4,
  },
  note: {
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 