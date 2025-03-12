import { useState, useEffect, useCallback } from 'react';
import { Pedometer } from 'expo-sensors';
import { startOfWeek, eachDayOfInterval, format, addDays, differenceInMinutes } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivitySettings } from '../components/ActivitySettingsDialog';
import * as Notifications from 'expo-notifications';

interface WeeklyStats {
  date: string;
  steps: number;
  calories: number;
  distance: number;
}

const DEFAULT_SETTINGS: ActivitySettings = {
  stepGoal: 10000,
  showCalories: true,
  showDistance: true,
  weeklyStatsEnabled: true,
  distanceUnit: 'km',
  calorieCalculation: 'basic',
  activityReminders: false,
  reminderFrequency: '2hours',
  inactivityAlert: false,
  inactivityThreshold: 60,
};

// Advanced calorie calculation factors
const MET = 3.5; // Metabolic Equivalent for walking
const WEIGHT = 70; // Default weight in kg (can be customized in future)

export const usePedometer = () => {
  const [steps, setSteps] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const [settings, setSettings] = useState<ActivitySettings>(DEFAULT_SETTINGS);
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());

  // Calculate calories burned with advanced option
  const calculateCalories = useCallback((steps: number) => {
    if (settings.calorieCalculation === 'basic') {
      const caloriesPerStep = 0.04;
      return Math.round(steps * caloriesPerStep);
    } else {
      // Advanced calculation using MET formula
      const duration = (steps / 100) * 1; // Assuming 100 steps per minute
      const caloriesBurned = (duration * MET * 3.5 * WEIGHT) / 200;
      return Math.round(caloriesBurned);
    }
  }, [settings.calorieCalculation]);

  // Calculate distance with unit conversion
  const calculateDistance = useCallback((steps: number) => {
    const strideLength = 0.762; // meters
    const distanceInMeters = steps * strideLength;
    const distanceInKm = Number((distanceInMeters / 1000).toFixed(2));
    
    return settings.distanceUnit === 'km' 
      ? distanceInKm 
      : Number((distanceInKm * 0.621371).toFixed(2)); // Convert to miles
  }, [settings.distanceUnit]);

  // Handle activity reminders
  const setupActivityReminders = useCallback(async () => {
    if (!settings.activityReminders) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    await Notifications.requestPermissionsAsync();

    // Calculate reminder interval in minutes
    const intervalMinutes = settings.reminderFrequency === 'hourly' 
      ? 60 
      : settings.reminderFrequency === '2hours' 
        ? 120 
        : 240;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Move!",
        body: `Stay active and healthy - take a walk to reach your ${settings.stepGoal.toLocaleString()} steps goal!`,
      },
      trigger: {
        seconds: intervalMinutes * 60,
        repeats: true,
        type: 'timeInterval',
      },
    });
  }, [settings.activityReminders, settings.reminderFrequency, settings.stepGoal]);

  // Handle inactivity alerts
  const checkInactivity = useCallback(() => {
    if (!settings.inactivityAlert) return;

    const now = new Date();
    const inactiveMinutes = differenceInMinutes(now, lastActivityTime);

    if (inactiveMinutes >= settings.inactivityThreshold) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: "You've been inactive!",
          body: `You haven't moved in ${settings.inactivityThreshold} minutes. Time for a quick walk!`,
        },
        trigger: null,
      });
    }
  }, [settings.inactivityAlert, settings.inactivityThreshold, lastActivityTime]);

  const saveStepsToStorage = async (date: string, steps: number) => {
    try {
      await AsyncStorage.setItem(`steps_${date}`, steps.toString());
    } catch (error) {
      console.error('Error saving steps:', error);
    }
  };

  const loadWeeklyStats = async () => {
    try {
      const today = new Date();
      // Start from Monday of current week
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      
      // Create array for all 7 days of the week
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

      const stats = await Promise.all(
        weekDays.map(async (date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          const isFutureDate = date > today;

          try {
            let steps = 0;

            if (!isFutureDate) {
              // For today, get live pedometer data
              if (isToday) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                const result = await Pedometer.getStepCountAsync(start, end);
                steps = result.steps;
              } else {
                // For past days, get from storage
                const savedSteps = await AsyncStorage.getItem(`steps_${dateStr}`);
                steps = savedSteps ? parseInt(savedSteps) : 0;

                // If no stored data, try to get from pedometer
                if (!savedSteps) {
                  const start = new Date(date);
                  start.setHours(0, 0, 0, 0);
                  const end = new Date(date);
                  end.setHours(23, 59, 59, 999);
                  
                  try {
                    const result = await Pedometer.getStepCountAsync(start, end);
                    steps = result.steps;
                    // Save to storage for future reference
                    await saveStepsToStorage(dateStr, steps);
                  } catch (e) {
                    console.log(`Could not get historical data for ${dateStr}`);
                  }
                }
              }
            }

            return {
              date: format(date, 'EEE'),
              steps,
              calories: calculateCalories(steps),
              distance: calculateDistance(steps)
            };
          } catch (error) {
            console.error(`Error getting steps for ${dateStr}:`, error);
            return {
              date: format(date, 'EEE'),
              steps: 0,
              calories: 0,
              distance: 0
            };
          }
        })
      );

      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
      // Set default empty week if error occurs
      const emptyWeek = Array.from({ length: 7 }, (_, i) => ({
        date: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), 'EEE'),
        steps: 0,
        calories: 0,
        distance: 0
      }));
      setWeeklyStats(emptyWeek);
    }
  };

  // Load settings from storage
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('activity_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading activity settings:', error);
    }
  };

  // Save settings to storage
  const saveSettings = async (newSettings: ActivitySettings) => {
    try {
      await AsyncStorage.setItem('activity_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Update reminders when settings change
      setupActivityReminders();
    } catch (error) {
      console.error('Error saving activity settings:', error);
    }
  };

  useEffect(() => {
    let subscription: any;
    let inactivityCheck: NodeJS.Timeout;

    const subscribe = async () => {
      try {
        // Load saved settings
        await loadSettings();

        const isAvailable = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(isAvailable);

        if (!isAvailable) {
          console.log('Pedometer not available');
          return;
        }

        // Set up notifications
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        // Initialize activity reminders
        await setupActivityReminders();

        // Start inactivity check
        if (settings.inactivityAlert) {
          inactivityCheck = setInterval(checkInactivity, 60000); // Check every minute
        }

        // Get today's steps
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date();
        
        const { steps: todaySteps } = await Pedometer.getStepCountAsync(start, end);
        setSteps(todaySteps);
        
        // Save today's steps
        const todayStr = format(today, 'yyyy-MM-dd');
        await saveStepsToStorage(todayStr, todaySteps);

        // Subscribe to step counter updates
        subscription = Pedometer.watchStepCount(result => {
          const newSteps = result.steps;
          setSteps(prev => {
            if (newSteps > prev) {
              setLastActivityTime(new Date());
            }
            return newSteps;
          });
          
          // Update weekly stats
          setWeeklyStats(prev => {
            const todayIndex = prev.findIndex(stat => 
              stat.date === format(today, 'EEE')
            );
            if (todayIndex >= 0) {
              const updated = [...prev];
              updated[todayIndex] = {
                date: format(today, 'EEE'),
                steps: newSteps,
                calories: calculateCalories(newSteps),
                distance: calculateDistance(newSteps)
              };
              return updated;
            }
            return prev;
          });
        });

        // Load weekly stats
        await loadWeeklyStats();
      } catch (error) {
        console.error('Pedometer error:', error);
      }
    };

    subscribe();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (inactivityCheck) {
        clearInterval(inactivityCheck);
      }
    };
  }, [settings.inactivityAlert]);

  return {
    steps,
    weeklyStats,
    isPedometerAvailable,
    settings,
    saveSettings,
    caloriesBurned: calculateCalories(steps),
    distance: calculateDistance(steps),
    calculateDistance,
    loadWeeklyStats,
  };
}; 