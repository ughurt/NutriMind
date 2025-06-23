import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Dialog, Text, Button, TextInput, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSave: (data: {
    bedTime: string;
    wakeTime: string;
    sleepHours: number;
    sleepQuality: number;
  }) => void;
  initialValues?: {
    bedTime: string;
    wakeTime: string;
    sleepQuality: number;
  };
}

export const SleepDialog = ({ visible, onDismiss, onSave, initialValues }: Props) => {
  const [bedTime, setBedTime] = useState(initialValues?.bedTime || '22:00');
  const [wakeTime, setWakeTime] = useState(initialValues?.wakeTime || '07:00');
  const [quality, setQuality] = useState(initialValues?.sleepQuality || 0);
  const [showBedTimePicker, setShowBedTimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  const handleSave = () => {
    // Calculate sleep hours
    const [bedHour, bedMinute] = bedTime.split(':').map(Number);
    const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
    
    let sleepHours = wakeHour - bedHour;
    if (sleepHours < 0) sleepHours += 24;
    
    const minuteDiff = wakeMinute - bedMinute;
    sleepHours += minuteDiff / 60;

    onSave({
      bedTime,
      wakeTime,
      sleepHours: Number(sleepHours.toFixed(1)),
      sleepQuality: quality,
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Track Sleep</Dialog.Title>
        <Dialog.Content>
          <View style={styles.timeInputs}>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Bedtime</Text>
              <Button
                mode="outlined"
                onPress={() => setShowBedTimePicker(true)}
                style={styles.timeButton}
                icon="clock-outline"
              >
                {bedTime}
              </Button>
              {showBedTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${bedTime}:00`)}
                  mode="time"
                  is24Hour={true}
                  onChange={(event, date) => {
                    setShowBedTimePicker(false);
                    if (date) {
                      setBedTime(format(date, 'HH:mm'));
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.timeInput}>
              <Text style={styles.label}>Wake time</Text>
              <Button
                mode="outlined"
                onPress={() => setShowWakeTimePicker(true)}
                style={styles.timeButton}
                icon="clock-outline"
              >
                {wakeTime}
              </Button>
              {showWakeTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${wakeTime}:00`)}
                  mode="time"
                  is24Hour={true}
                  onChange={(event, date) => {
                    setShowWakeTimePicker(false);
                    if (date) {
                      setWakeTime(format(date, 'HH:mm'));
                    }
                  }}
                />
              )}
            </View>
          </View>

          <View style={styles.qualityContainer}>
            <Text style={styles.label}>Sleep Quality</Text>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, index) => (
                <IconButton
                  key={index}
                  icon={index < quality ? "star" : "star-outline"}
                  iconColor={index < quality ? "#FFD700" : "#CCCCCC"}
                  size={32}
                  onPress={() => setQuality(index + 1)}
                />
              ))}
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button mode="contained" onPress={handleSave}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
  },
  timeInputs: {
    marginBottom: 24,
  },
  timeInput: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  timeButton: {
    width: '100%',
  },
  qualityContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
}); 