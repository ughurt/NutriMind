import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Portal, Dialog, TextInput, Button, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export interface Reminder {
  id: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
  type?: 'meal' | 'workout' | 'water' | 'sleep' | 'custom';
}

interface ReminderDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (reminder: Omit<Reminder, 'id'>) => void;
  initialValues?: Reminder;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type ReminderType = {
  icon: "food" | "run" | "water" | "sleep" | "bell";
  label: string;
  value: Reminder['type'];
  color: string;
};

const REMINDER_TYPES: ReminderType[] = [
  { icon: 'food', label: 'Meal', value: 'meal', color: '#FF9800' },
  { icon: 'run', label: 'Workout', value: 'workout', color: '#4CAF50' },
  { icon: 'water', label: 'Water', value: 'water', color: '#2196F3' },
  { icon: 'sleep', label: 'Sleep', value: 'sleep', color: '#9C27B0' },
  { icon: 'bell', label: 'Custom', value: 'custom', color: '#795548' },
];

export const ReminderDialog: React.FC<ReminderDialogProps> = ({
  visible,
  onDismiss,
  onSave,
  initialValues,
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [type, setType] = useState<Reminder['type']>('custom');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && initialValues) {
      setTitle(initialValues.title);
      const [hours, minutes] = initialValues.time.split(':').map(Number);
      const newTime = new Date();
      newTime.setHours(hours);
      newTime.setMinutes(minutes);
      setTime(newTime);
      setSelectedDays(initialValues.days);
      setType(initialValues.type || 'custom');
    } else if (visible) {
      resetForm();
    }
  }, [visible, initialValues]);

  const resetForm = () => {
    setTitle('');
    setTime(new Date());
    setSelectedDays([]);
    setType('custom');
    setError('');
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      title: title.trim(),
      time: format(time, 'HH:mm'),
      days: selectedDays,
      enabled: true,
      type,
    });

    resetForm();
  };

  const toggleDay = (day: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
    setError('');
  };

  const handleTypeSelect = (newType: Reminder['type']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setType(newType);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <LinearGradient
          colors={['#E7F5F5', '#FFFFFF']}
          style={styles.gradient}
        >
          <View style={styles.handle} />
          
          <Dialog.Title style={styles.title}>
            <MaterialCommunityIcons 
              name={REMINDER_TYPES.find(t => t.value === type)?.icon || 'bell'} 
              size={24} 
              color="#006A6A" 
              style={styles.titleIcon}
            />
            {initialValues ? 'Edit Reminder' : 'New Reminder'}
          </Dialog.Title>

          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView>
              <TextInput
                label="Title"
                value={title}
                onChangeText={text => {
                  setTitle(text);
                  setError('');
                }}
                mode="outlined"
                error={!!error}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.timeContainer}>
                <Text variant="bodyMedium" style={styles.label}>Reminder Time</Text>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowTimePicker(!showTimePicker);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  icon="clock"
                  style={styles.timeButton}
                >
                  {format(time, 'h:mm a')}
                </Button>

                {showTimePicker && (
                  <View style={styles.timePickerContainer}>
                    <DateTimePicker
                      value={time}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleTimeChange}
                      style={styles.timePicker}
                    />
                    {Platform.OS === 'ios' && (
                      <Button 
                        mode="contained"
                        onPress={() => setShowTimePicker(false)}
                        style={styles.doneButton}
                      >
                        Done
                      </Button>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.typeContainer}>
                <Text variant="bodyMedium" style={styles.label}>Reminder Type</Text>
                <View style={styles.typeGrid}>
                  {REMINDER_TYPES.map(reminderType => (
                    <Chip
                      key={reminderType.value}
                      selected={type === reminderType.value}
                      onPress={() => handleTypeSelect(reminderType.value)}
                      style={[
                        styles.typeChip,
                        type === reminderType.value && { backgroundColor: reminderType.color }
                      ]}
                      textStyle={[
                        styles.typeText,
                        type === reminderType.value && styles.selectedTypeText
                      ]}
                      icon={() => (
                        <MaterialCommunityIcons
                          name={reminderType.icon}
                          size={18}
                          color={type === reminderType.value ? 'white' : '#666'}
                        />
                      )}
                    >
                      {reminderType.label}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.daysContainer}>
                <Text variant="bodyMedium" style={styles.label}>Repeat on</Text>
                <View style={styles.daysGrid}>
                  {DAYS.map(day => (
                    <Chip
                      key={day}
                      selected={selectedDays.includes(day)}
                      onPress={() => toggleDay(day)}
                      style={[
                        styles.dayChip,
                        selectedDays.includes(day) && styles.selectedDayChip
                      ]}
                      textStyle={[
                        styles.dayText,
                        selectedDays.includes(day) && styles.selectedDayText
                      ]}
                    >
                      {day}
                    </Chip>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button 
              onPress={onDismiss}
              textColor="#006A6A"
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSave}
              style={styles.saveButton}
            >
              Save
            </Button>
          </Dialog.Actions>
        </LinearGradient>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: 'transparent',
    borderRadius: 28,
    maxHeight: '85%',
    width: '95%',
    alignSelf: 'center',
  },
  gradient: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    width: 32,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  title: {
    textAlign: 'center',
    color: '#006A6A',
    fontWeight: '600',
  },
  titleIcon: {
    marginRight: 8,
  },
  scrollArea: {
    paddingHorizontal: 20,
    maxHeight: Platform.OS === 'ios' ? '75%' : '85%',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: '#006A6A',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 4,
  },
  timeContainer: {
    marginVertical: 16,
  },
  label: {
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  timeButton: {
    borderColor: '#006A6A',
    borderRadius: 12,
    marginBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  timePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    padding: Platform.OS === 'ios' ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timePicker: {
    backgroundColor: 'white',
  },
  doneButton: {
    backgroundColor: '#006A6A',
    marginTop: 8,
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  typeText: {
    color: '#666',
  },
  selectedTypeText: {
    color: 'white',
  },
  daysContainer: {
    marginBottom: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  selectedDayChip: {
    backgroundColor: '#006A6A',
  },
  dayText: {
    color: '#666',
  },
  selectedDayText: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#006A6A',
  },
}); 