import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { AppointmentList } from './components/AppointmentList';
import { format } from 'date-fns';

const AppointmentsScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text variant="headlineMedium" style={styles.title}>
          My Appointments
        </Text>

        <Card style={styles.card}>
          <Card.Title title="Upcoming Appointments" />
          <Card.Content>
            <AppointmentList />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Available Time Slots" />
          <Card.Content>
            <Text variant="bodyMedium">
              {format(selectedDate, 'MMMM d, yyyy')}
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('BookAppointment')}
              style={styles.button}
            >
              Book New Appointment
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('BookAppointment')}
      />
    </View>
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
  button: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AppointmentsScreen; 