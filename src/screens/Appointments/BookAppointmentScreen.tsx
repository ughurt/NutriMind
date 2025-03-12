import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Card, TextInput, SegmentedButtons } from 'react-native-paper';
import { format } from 'date-fns';

const BookAppointmentScreen = ({ navigation }) => {
  const [appointmentType, setAppointmentType] = useState('nutritionist');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');

  const handleBooking = () => {
    // TODO: Implement appointment booking logic
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Book Appointment
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Appointment Type</Text>
          <SegmentedButtons
            value={appointmentType}
            onValueChange={setAppointmentType}
            buttons={[
              { value: 'nutritionist', label: 'Nutritionist' },
              { value: 'trainer', label: 'Trainer' },
              { value: 'coach', label: 'Coach' },
            ]}
            style={styles.segmentedButtons}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Date & Time
          </Text>
          <Text>{format(selectedDate, 'MMMM d, yyyy')}</Text>
          
          <View style={styles.timeSlots}>
            {['9:00', '10:00', '11:00', '14:00', '15:00'].map((time) => (
              <Button
                key={time}
                mode={selectedTime === time ? 'contained' : 'outlined'}
                onPress={() => setSelectedTime(time)}
                style={styles.timeSlot}
              >
                {time}
              </Button>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={handleBooking}
            style={styles.bookButton}
          >
            Book Appointment
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
  },
  card: {
    margin: 8,
  },
  segmentedButtons: {
    marginTop: 10,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  timeSlot: {
    marginBottom: 8,
  },
  bookButton: {
    marginTop: 20,
  },
});

export default BookAppointmentScreen; 