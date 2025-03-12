import { useState, useEffect, useRef } from 'react';
import { Pedometer } from 'expo-sensors';
import { startOfDay, differenceInSeconds } from 'date-fns';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WorkoutStats {
  distance: number;
  movingTime: number; // in minutes
  avgPace: number; // in seconds per 100m
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  calories: number;
  isWatchConnected: boolean;
  currentSpeed: number; // current speed in km/h
  elevationGain: number; // in meters
  totalPauseDuration: number; // in minutes
  lastPauseTime: Date | null;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
  speed: number | null;
}

const STORAGE_KEYS = {
  WORKOUT_HISTORY: 'workout_history',
  USER_SETTINGS: 'workout_settings',
};

export const useWorkoutStats = () => {
  const [stats, setStats] = useState<WorkoutStats>({
    distance: 0,
    movingTime: 0,
    avgPace: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    calories: 0,
    isWatchConnected: false,
    currentSpeed: 0,
    elevationGain: 0,
    totalPauseDuration: 0,
    lastPauseTime: null,
  });

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);
  
  // Use refs for tracking location history and settings
  const locationHistory = useRef<LocationPoint[]>([]);
  const userSettings = useRef({
    weight: 70, // kg
    height: 170, // cm
    age: 30,
    gender: 'male',
    movingThreshold: 0.3, // minimum speed in m/s to be considered moving
  });

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
        if (savedSettings) {
          userSettings.current = { ...userSettings.current, ...JSON.parse(savedSettings) };
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let watchSubscription: any = null;
    let speedUpdateInterval: NodeJS.Timeout | null = null;

    const startTracking = async () => {
      try {
        // Request permissions with highest accuracy
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        // Configure location tracking with high accuracy
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 2, // Update every 2 meters
          },
          (location) => {
            if (!isPaused) {
              processNewLocation(location);
            }
          }
        );

        // Update current speed more frequently
        speedUpdateInterval = setInterval(() => {
          if (!isPaused && locationHistory.current.length > 0) {
            updateCurrentSpeed();
          }
        }, 2000);

        // Try to connect to smartwatch
        checkWatchConnection();

      } catch (error) {
        console.error('Error starting tracking:', error);
      }
    };

    const processNewLocation = (location: Location.LocationObject) => {
      const newPoint: LocationPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        timestamp: location.timestamp,
        speed: location.coords.speed,
      };

      locationHistory.current.push(newPoint);

      if (lastLocation) {
        // Calculate new stats
        const distance = calculateDistance(
          lastLocation.coords.latitude,
          lastLocation.coords.longitude,
          location.coords.latitude,
          location.coords.longitude
        );

        const elevationChange = calculateElevationChange(
          lastLocation.coords.altitude,
          location.coords.altitude
        );

        const timeElapsed = (location.timestamp - lastLocation.timestamp) / 1000; // in seconds
        const speed = (distance * 3600) / timeElapsed; // km/h

        setStats((prev) => {
          const newDistance = prev.distance + distance;
          const newMovingTime = calculateMovingTime(startTime, prev.totalPauseDuration);
          const newPace = calculatePace(newDistance, newMovingTime);

          return {
            ...prev,
            distance: newDistance,
            movingTime: newMovingTime,
            avgPace: newPace,
            currentSpeed: speed,
            elevationGain: prev.elevationGain + (elevationChange > 0 ? elevationChange : 0),
            calories: calculateCalories(newDistance, newMovingTime, prev.elevationGain),
          };
        });
      }
      setLastLocation(location);
    };

    const updateCurrentSpeed = () => {
      const recentLocations = locationHistory.current.slice(-5);
      if (recentLocations.length >= 2) {
        const timeWindow = (recentLocations[recentLocations.length - 1].timestamp - recentLocations[0].timestamp) / 1000;
        let totalDistance = 0;

        for (let i = 1; i < recentLocations.length; i++) {
          totalDistance += calculateDistance(
            recentLocations[i-1].latitude,
            recentLocations[i-1].longitude,
            recentLocations[i].latitude,
            recentLocations[i].longitude
          );
        }

        const averageSpeed = (totalDistance * 3600) / timeWindow; // km/h
        setStats(prev => ({ ...prev, currentSpeed: averageSpeed }));
      }
    };

    if (isTracking && !locationSubscription) {
      setStartTime(new Date());
      startTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (watchSubscription) {
        watchSubscription.remove();
      }
      if (speedUpdateInterval) {
        clearInterval(speedUpdateInterval);
      }
    };
  }, [isTracking, isPaused, lastLocation]);

  const startWorkout = () => {
    setIsTracking(true);
    setStartTime(new Date());
    locationHistory.current = [];
  };

  const pauseWorkout = () => {
    setIsPaused(true);
    setStats(prev => ({
      ...prev,
      lastPauseTime: new Date()
    }));
  };

  const resumeWorkout = () => {
    setIsPaused(false);
    if (stats.lastPauseTime) {
      const pauseDuration = differenceInSeconds(new Date(), stats.lastPauseTime) / 60; // Convert to minutes
      setStats(prev => ({
        ...prev,
        totalPauseDuration: prev.totalPauseDuration + pauseDuration,
        lastPauseTime: null
      }));
    }
  };

  const stopWorkout = async () => {
    setIsTracking(false);
    setIsPaused(false);
    setStartTime(null);
    setLastLocation(null);

    // Save workout to history
    try {
      const workoutHistory = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
      const history = workoutHistory ? JSON.parse(workoutHistory) : [];
      history.push({
        ...stats,
        date: new Date().toISOString(),
        locationPoints: locationHistory.current,
      });
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const resetStats = () => {
    setStats({
      distance: 0,
      movingTime: 0,
      avgPace: 0,
      avgHeartRate: null,
      maxHeartRate: null,
      calories: 0,
      isWatchConnected: false,
      currentSpeed: 0,
      elevationGain: 0,
      totalPauseDuration: 0,
      lastPauseTime: null,
    });
    locationHistory.current = [];
  };

  // Enhanced helper functions
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c / 1000; // Convert to kilometers
  };

  const calculateElevationChange = (alt1: number | null, alt2: number | null): number => {
    if (alt1 === null || alt2 === null) return 0;
    return alt2 - alt1;
  };

  const calculateMovingTime = (start: Date | null, pauseDuration: number): number => {
    if (!start) return 0;
    const totalTime = (new Date().getTime() - start.getTime()) / 60000; // Convert to minutes
    return Math.max(0, totalTime - pauseDuration);
  };

  const calculatePace = (distance: number, time: number): number => {
    if (distance === 0 || time === 0) return 0;
    return (time * 60) / (distance * 10); // seconds per 100m
  };

  const calculateCalories = (distance: number, time: number, elevationGain: number): number => {
    const { weight, gender, age } = userSettings.current;
    const MET = calculateMET(stats.currentSpeed, elevationGain / (time / 60));
    const BMR = gender === 'male' 
      ? 88.362 + (13.397 * weight) + (4.799 * userSettings.current.height) - (5.677 * age)
      : 447.593 + (9.247 * weight) + (3.098 * userSettings.current.height) - (4.330 * age);

    const caloriesPerHour = (MET * 3.5 * weight) / 200;
    return Math.round(caloriesPerHour * (time / 60));
  };

  const calculateMET = (speed: number, elevationGainPerHour: number): number => {
    // Base MET values for different speeds
    let baseMET = 2.0; // walking slowly
    if (speed > 5.5) baseMET = 3.5; // walking briskly
    if (speed > 8.0) baseMET = 7.0; // jogging
    if (speed > 11.0) baseMET = 11.5; // running
    if (speed > 16.0) baseMET = 16.0; // running fast

    // Add MET for elevation gain
    const elevationMET = elevationGainPerHour / 100; // Additional MET per 100m/hour of elevation gain

    return baseMET + elevationMET;
  };

  const checkWatchConnection = async () => {
    // Placeholder - implement actual smartwatch connection check
    setStats(prev => ({ ...prev, isWatchConnected: false }));
  };

  const getHistory = async () => {
    try {
      const workoutHistory = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
      return workoutHistory ? JSON.parse(workoutHistory) : [];
    } catch (error) {
      console.error('Error loading workout history:', error);
      return [];
    }
  };

  return {
    stats,
    isTracking,
    isPaused,
    startWorkout,
    stopWorkout,
    pauseWorkout,
    resumeWorkout,
    resetStats,
    getHistory,
  };
}; 