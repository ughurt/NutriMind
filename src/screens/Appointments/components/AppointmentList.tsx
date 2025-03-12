import React from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Text, Divider } from 'react-native-paper';
import { format } from 'date-fns';

type Appointment = {
  id: string;
  date: Date;
  professional: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};

const mockAppointments: Appointment[] = [
  {
    id: '1',
    date: new Date(2024, 2, 15, 14, 30),
    professional: 'Dr. Smith',
    type: 'Nutritionist Consultation',
    status: 'scheduled',
  },
  {
    id: '2',
    date: new Date(2024, 2, 17, 10, 0),
    professional: 'Coach Johnson',
    type: 'Fitness Assessment',
    status: 'scheduled',
  },
];

export const AppointmentList = () => {
  return (
    <View style={styles.container}>
      {mockAppointments.map((appointment, index) => (
        <React.Fragment key={appointment.id}>
          <List.Item
            title={appointment.type}
            description={`${format(appointment.date, 'PPp')} with ${
              appointment.professional
            }`}
            left={props => <List.Icon {...props} icon="calendar" />}
            right={props => (
              <Text
                {...props}
                style={[
                  styles.status,
                  { color: appointment.status === 'scheduled' ? 'green' : 'grey' },
                ]}
              >
                {appointment.status}
              </Text>
            )}
          />
          {index < mockAppointments.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  status: {
    alignSelf: 'center',
    textTransform: 'capitalize',
  },
}); 