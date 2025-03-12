import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { format, parse, isBefore } from 'date-fns';

export interface Reminder {
  id: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
  notificationIds?: string[];
}

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const scheduleNotification = async (reminder: Reminder) => {
    if (!reminder.enabled) return [];

    // Cancel existing notifications for this reminder
    if (reminder.notificationIds) {
      await Promise.all(
        reminder.notificationIds.map(id => 
          Notifications.cancelScheduledNotificationAsync(id)
        )
      );
    }

    // Schedule new notifications for each selected day
    const notificationIds = await Promise.all(
      reminder.days.map(async day => {
        const [hours, minutes] = reminder.time.split(':').map(Number);
        const daysMap: Record<string, number> = {
          'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
        };

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'NutriMind Reminder',
            body: reminder.title,
          },
          trigger: {
            weekday: daysMap[day] + 1, // Notification API uses 1-7 for days
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });

        return id;
      })
    );

    return notificationIds;
  };

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem('reminders');
      if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const saveReminders = async (newReminders: Reminder[]) => {
    try {
      await AsyncStorage.setItem('reminders', JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'notificationIds'>) => {
    const newReminder = {
      ...reminder,
      id: Date.now().toString(),
    };

    const notificationIds = await scheduleNotification(newReminder as Reminder);
    const reminderWithNotifications = {
      ...newReminder,
      notificationIds,
    };

    await saveReminders([...reminders, reminderWithNotifications]);
  };

  const updateReminder = async (reminder: Reminder) => {
    const notificationIds = await scheduleNotification(reminder);
    const updatedReminder = { ...reminder, notificationIds };
    
    const updated = reminders.map(r => 
      r.id === reminder.id ? updatedReminder : r
    );
    await saveReminders(updated);
  };

  const deleteReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder?.notificationIds) {
      await Promise.all(
        reminder.notificationIds.map(notificationId =>
          Notifications.cancelScheduledNotificationAsync(notificationId)
        )
      );
    }
    
    const filtered = reminders.filter(r => r.id !== id);
    await saveReminders(filtered);
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const updatedReminder = { ...reminder, enabled: !reminder.enabled };
    await updateReminder(updatedReminder);
  };

  useEffect(() => {
    // Request notification permissions
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }
    };

    setupNotifications();
    loadReminders();
  }, []);

  return {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
  };
}; 