import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Portal, Dialog, Text, Button, TextInput, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSave: (data: {
    mood: string;
    note: string;
  }) => void;
  initialValues?: {
    mood: string;
    note: string;
  };
}

const MOODS = [
  { label: 'Great', icon: 'emoticon-excited', color: '#4CAF50' },
  { label: 'Good', icon: 'emoticon-happy', color: '#8BC34A' },
  { label: 'Okay', icon: 'emoticon-neutral', color: '#FFC107' },
  { label: 'Bad', icon: 'emoticon-sad', color: '#FF9800' },
  { label: 'Awful', icon: 'emoticon-cry', color: '#F44336' },
];

export const MoodDialog = ({ visible, onDismiss, onSave, initialValues }: Props) => {
  const [selectedMood, setSelectedMood] = useState(initialValues?.mood || '');
  const [note, setNote] = useState(initialValues?.note || '');

  const handleSave = () => {
    if (!selectedMood) return;
    onSave({
      mood: selectedMood,
      note,
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>How are you feeling?</Dialog.Title>
        <Dialog.Content>
          <ScrollView>
            <View style={styles.moodGrid}>
              {MOODS.map((mood) => (
                <View key={mood.label} style={styles.moodOption}>
                  <IconButton
                    icon={mood.icon}
                    size={48}
                    iconColor={selectedMood === mood.label ? mood.color : '#CCCCCC'}
                    onPress={() => setSelectedMood(mood.label)}
                    style={[
                      styles.moodButton,
                      selectedMood === mood.label && {
                        backgroundColor: `${mood.color}15`,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.moodLabel,
                      selectedMood === mood.label && {
                        color: mood.color,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </View>
              ))}
            </View>

            <TextInput
              label="Add a note (optional)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button 
            mode="contained" 
            onPress={handleSave}
            disabled={!selectedMood}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  moodOption: {
    alignItems: 'center',
    marginVertical: 8,
  },
  moodButton: {
    margin: 0,
  },
  moodLabel: {
    marginTop: 4,
    color: '#666666',
  },
  noteInput: {
    backgroundColor: 'transparent',
  },
}); 