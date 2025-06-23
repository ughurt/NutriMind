import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Pressable, RefreshControl, Animated, Modal, Platform } from 'react-native';
import { Text, Card, Surface, ProgressBar, IconButton, Button, FAB, Switch, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../hooks/useMeals';
import { useGoals } from '../../hooks/useGoals';
import { format } from 'date-fns';
import { usePedometer } from '../../hooks/usePedometer';
import { useReminders } from '../../hooks/useReminders';
import { ReminderDialog } from '../../components/ReminderDialog';
import { ActivitySettingsDialog } from '../../components/ActivitySettingsDialog';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';
import { WorkoutStats } from '../../components/WorkoutStats';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { ChatScreen } from '../Chat/ChatScreen';
import { defaultTheme } from '../../utils/theme';
import { SleepDialog } from '../../components/SleepDialog';
import { MoodDialog } from '../../components/MoodDialog';
import { SleepInsights } from '../../components/SleepInsights';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Reminder {
  id: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
}

interface MoodEntry {
  mood: string;
  note: string;
  timestamp: Date;
}

const HomeScreen = () => {
  // Use our custom theme instead of useTheme()
  const theme = defaultTheme;
  
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const today = new Date();
  const { meals } = useMeals(today);
  const { goals, loadGoals } = useGoals();
  const { 
    steps, 
    isPedometerAvailable, 
    settings,
    saveSettings,
    caloriesBurned, 
    weeklyStats,
    distance
  } = usePedometer();
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();
  const [reminderDialogVisible, setReminderDialogVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | undefined>();
  const [activitySettingsVisible, setActivitySettingsVisible] = useState(false);
  const [progressAnimation] = useState(new Animated.Value(0));
  const [showGoalReached, setShowGoalReached] = useState(false);
  const { 
    stats: workoutStats,
    isTracking,
    startWorkout,
    stopWorkout,
    resetStats,
  } = useWorkoutStats();
  const [isLoading, setIsLoading] = useState(false);
  const [showGoalReachedDialog, setShowGoalReachedDialog] = useState(false);
  const [goalReachedType, setGoalReachedType] = useState<'steps' | 'calories' | 'protein'>('steps');
  const [chatVisible, setChatVisible] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2500);
  const [waterGoalReached, setWaterGoalReached] = useState(false);
  const [sleepHours, setSleepHours] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(0);
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepDialogVisible, setSleepDialogVisible] = useState(false);
  const [currentMood, setCurrentMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [moodTimestamp, setMoodTimestamp] = useState(new Date());
  const [moodDialogVisible, setMoodDialogVisible] = useState(false);
  const [sleepStreak, setSleepStreak] = useState(0);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

  // Load goals when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadGoals();
    });

    return unsubscribe;
  }, [navigation, loadGoals]);

  // Initial load of goals
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    // Animate progress when steps change
    Animated.spring(progressAnimation, {
      toValue: steps / settings.stepGoal,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();

    // Check if goal is reached
    if (steps >= settings.stepGoal && !showGoalReached) {
      setShowGoalReached(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [steps, settings.stepGoal]);

  // Calculate daily totals
  const dailyTotals = meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fat: acc.fat + (meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const nutritionItems = [
    {
      label: 'Calories',
      value: dailyTotals.calories,
      goal: goals.find(g => g.type === 'calories')?.target || 2000,
      unit: 'kcal',
      icon: 'fire' as const,
      color: '#FF9800',
    },
    {
      label: 'Protein',
      value: dailyTotals.protein,
      goal: goals.find(g => g.type === 'protein')?.target || 150,
      unit: 'g',
      icon: 'food-steak' as const,
      color: '#F44336',
    },
    {
      label: 'Carbs',
      value: dailyTotals.carbs,
      goal: goals.find(g => g.type === 'carbs')?.target || 250,
      unit: 'g',
      icon: 'bread-slice' as const,
      color: '#4CAF50',
    },
    {
      label: 'Fat',
      value: dailyTotals.fat,
      goal: goals.find(g => g.type === 'fat')?.target || 70,
      unit: 'g',
      icon: 'oil' as const,
      color: '#FFC107',
    },
  ];

  const handleAddMeal = () => {
    navigation.navigate('DiaryTab' as any);
  };

  const handleViewDiary = () => {
    navigation.navigate('DiaryTab' as any);
  };

  const renderNutrientProgress = (
    label: string,
    value: number,
    target: number,
    icon: 'fire' | 'food-steak' | 'bread-slice' | 'oil',
    unit: string = ''
  ) => (
    <Surface style={styles.nutritionCard} elevation={1}>
      <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.nutritionValue}>
        {value.toFixed(0)}{unit} / {target}{unit}
      </Text>
      <ProgressBar
        progress={Math.min(value / target, 1)}
        color={theme.colors.primary}
        style={styles.progressBar}
      />
    </Surface>
  );

  const getMoodIcon = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'great':
        return 'emoticon-excited';
      case 'good':
        return 'emoticon-happy';
      case 'okay':
        return 'emoticon-neutral';
      case 'bad':
        return 'emoticon-sad';
      case 'awful':
        return 'emoticon-cry';
      default:
        return 'emoticon-neutral-outline';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'great':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'okay':
        return '#FFC107';
      case 'bad':
        return '#FF9800';
      case 'awful':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              setIsLoading(true);
              loadGoals().then(() => setIsLoading(false));
            }}
            colors={['#006A6A']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>
                {format(today, 'EEEE, MMMM d')}
            </Text>
            </View>
            <View style={styles.headerRight}>
              <IconButton
                icon="plus"
                size={24}
                onPress={handleAddMeal}
                iconColor="#1A1A1A"
              />
              <IconButton
                icon="bell-outline"
                size={24}
                onPress={() => setReminderDialogVisible(true)}
                iconColor="#1A1A1A"
              />
              <IconButton
                icon="cog-outline"
                size={24}
                onPress={() => setActivitySettingsVisible(true)}
                iconColor="#1A1A1A"
              />
            </View>
            </View>
        </View>

        {/* Workout Stats */}
        <WorkoutStats
          stats={workoutStats}
          isTracking={isTracking}
          onStartStop={() => {
            if (isTracking) {
              stopWorkout();
            } else {
              startWorkout();
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onReset={() => {
            resetStats();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />

        {/* Activity & Steps */}
        <Surface style={styles.activitySurface}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons 
                name="lightning-bolt" 
                size={24} 
                color="#006A6A" 
              />
              <Text variant="titleMedium" style={styles.sectionTitleText}>
                Daily Activity
              </Text>
            </View>
            <View style={styles.headerActions}>
              {showGoalReached && (
                <MaterialCommunityIcons 
                  name="trophy" 
                  size={24} 
                  color="#FFD700"
                  style={styles.trophyIcon}
                />
              )}
              <IconButton
                icon="cog"
                size={22}
                mode="contained-tonal"
                containerColor="rgba(0, 106, 106, 0.1)"
                iconColor="#006A6A"
                onPress={() => setActivitySettingsVisible(true)}
              />
            </View>
          </View>

          <View style={styles.stepsContainer}>
            {/* Steps Circle */}
            <Pressable 
              style={styles.stepsCircleContainer}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <LinearGradient
                colors={['rgba(0, 106, 106, 0.1)', 'rgba(0, 106, 106, 0.15)']}
                style={styles.stepsGradient}
              >
                <View style={styles.stepsCircle}>
                  <Animated.View
                    style={[
                      styles.progressRing,
                      {
                        borderColor: steps >= settings.stepGoal 
                          ? '#4CAF50' 
                          : '#006A6A',
                        opacity: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                        transform: [
                          {
                            rotate: progressAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <View style={styles.stepsContent}>
                    <Text style={styles.stepsNumber}>{steps.toLocaleString()}</Text>
                    <Text style={styles.stepsText}>steps</Text>
                    <Text style={styles.stepsGoal}>
                      Goal: {settings.stepGoal.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              {settings.showCalories && (
                <Pressable 
                  style={styles.statCard}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <LinearGradient
                    colors={['#FFF3E0', '#FFE0B2']}
                    style={styles.statGradient}
                  >
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.2)' }]}>
                      <MaterialCommunityIcons name="fire" size={18} color="#FF9800" />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text style={styles.statValue}>{caloriesBurned}</Text>
                      <Text style={styles.statLabel}>kcal burned</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              )}
              
              {settings.showDistance && (
                <Pressable 
                  style={styles.statCard}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <LinearGradient
                    colors={['#E3F2FD', '#BBDEFB']}
                    style={styles.statGradient}
                  >
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
                      <MaterialCommunityIcons name="map-marker-distance" size={18} color="#2196F3" />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text style={styles.statValue}>{distance.toFixed(1)}</Text>
                      <Text style={styles.statLabel}>{settings.distanceUnit}</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              )}

              <Pressable 
                style={styles.statCard}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9']}
                  style={styles.statGradient}
                >
                  <View style={[styles.statIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
                    <MaterialCommunityIcons name="target" size={18} color="#4CAF50" />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text style={styles.statValue}>
                      {Math.round((steps / settings.stepGoal) * 100)}%
                    </Text>
                    <Text style={styles.statLabel}>of goal</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {settings.weeklyStatsEnabled && (
            <View style={styles.weeklyContainer}>
              <View style={styles.weeklyHeader}>
                <Text style={styles.weeklyTitle}>Weekly Activity</Text>
                <Text style={styles.weeklyAverage}>
                  Avg: {Math.round(weeklyStats.reduce((acc, stat) => acc + stat.steps, 0) / 7).toLocaleString()} steps/day
                </Text>
              </View>
              <View style={styles.weeklyStats}>
                {weeklyStats.map((stat) => (
                  <Pressable 
                    key={stat.date} 
                    style={styles.statDay}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <View style={styles.barContainer}>
                      <LinearGradient
                        colors={[
                          stat.steps === 0 
                            ? '#E0E0E0' 
                            : stat.steps >= settings.stepGoal 
                              ? '#4CAF50' 
                              : '#006A6A',
                          stat.steps === 0 
                            ? '#F5F5F5' 
                            : stat.steps >= settings.stepGoal 
                              ? '#A5D6A7' 
                              : '#B2DFDB'
                        ]}
                        style={[
                          styles.statBar,
                          { 
                            height: `${Math.min((stat.steps / settings.stepGoal) * 100, 100)}%`,
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[
                      styles.statDate,
                      stat.date === format(new Date(), 'EEE') && styles.todayDate
                    ]}>
                      {stat.date}
                    </Text>
                    <Text style={styles.statSteps}>
                      {stat.steps >= 1000 
                        ? `${(stat.steps / 1000).toFixed(1)}k` 
                        : stat.steps}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Surface>

        {/* Nutrition Summary */}
        <Surface style={styles.nutritionSurface}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons 
                name="food-apple" 
                size={24} 
                color="#006A6A" 
              />
              <Text variant="titleMedium" style={styles.sectionTitleText}>
                Nutrition Summary
              </Text>
            </View>
            <IconButton
              icon="silverware-fork-knife"
              size={22}
              mode="contained-tonal"
              containerColor="rgba(0, 106, 106, 0.1)"
              iconColor="#006A6A"
              onPress={handleViewDiary}
            />
          </View>

          <View style={styles.nutritionContent}>
            {/* Calories */}
            <View style={styles.caloriesContainer}>
              <View style={styles.caloriesInfo}>
              <Text style={styles.caloriesValue}>
                {dailyTotals.calories}
                  <Text style={styles.caloriesUnit}> / {nutritionItems[0].goal}</Text>
              </Text>
                <Text style={styles.caloriesLabel}>calories today</Text>
            </View>
              <View style={styles.progressRingContainer}>
                        <View 
                          style={[
                    styles.progressFill,
                            { 
                      borderColor: dailyTotals.calories > nutritionItems[0].goal ? '#FF5252' : '#4CAF50',
                      transform: [{ rotate: `${Math.min(dailyTotals.calories / nutritionItems[0].goal * 360, 360)}deg` }]
                            }
                          ]} 
                        />
              </View>
            </View>

            {/* Macros */}
            <View style={styles.macrosContainer}>
              {[
                { label: 'Protein', value: dailyTotals.protein, goal: nutritionItems[1].goal, color: '#F44336' },
                { label: 'Carbs', value: dailyTotals.carbs, goal: nutritionItems[2].goal, color: '#4CAF50' },
                { label: 'Fat', value: dailyTotals.fat, goal: nutritionItems[3].goal, color: '#FFC107' }
              ].map((macro, index) => (
                <View key={macro.label} style={styles.macroItem}>
                  <View style={styles.macroHeader}>
                    <Text style={styles.macroLabel}>{macro.label}</Text>
                    <Text style={styles.macroValue}>
                      {macro.value}
                      <Text style={styles.macroUnit}>g</Text>
                    </Text>
                  </View>
                  <View style={styles.macroProgressContainer}>
                        <View 
                          style={[
                        styles.macroProgress,
                            { 
                          width: `${Math.min((macro.value / macro.goal) * 100, 100)}%`,
                          backgroundColor: macro.color
                            }
                          ]} 
                        />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Surface>

        {/* Water Tracking */}
        <Surface style={styles.waterSurface}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons 
                name="water" 
                size={24} 
                color="#006A6A" 
              />
              <Text variant="titleMedium" style={styles.sectionTitleText}>
                Water Intake
              </Text>
            </View>
            <IconButton
              icon="plus"
              size={22}
              mode="contained-tonal"
              containerColor="rgba(0, 106, 106, 0.1)"
              iconColor="#006A6A"
              onPress={() => {
                // Add 250ml of water
                const newValue = Math.min((waterIntake + 250), 3000);
                setWaterIntake(newValue);
                if (newValue >= waterGoal && !waterGoalReached) {
                  setWaterGoalReached(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }}
            />
          </View>

          <View style={styles.waterContent}>
            <View style={styles.waterInfo}>
              <Text style={styles.waterValue}>
                {waterIntake}
                <Text style={styles.waterUnit}> / {waterGoal}ml</Text>
              </Text>
              <Text style={styles.waterLabel}>daily intake</Text>
            </View>
            <View style={styles.waterProgress}>
              <LinearGradient
                colors={['#E3F2FD', '#BBDEFB']}
                style={[
                  styles.waterProgressFill,
                  { width: `${Math.min((waterIntake / waterGoal) * 100, 100)}%` }
                ]}
              />
              {Array.from({ length: 6 }).map((_, index) => (
                        <View 
                  key={index} 
                          style={[
                    styles.waterMarker,
                    { left: `${(index + 1) * 16.66}%` }
                          ]} 
                        />
              ))}
                      </View>
            <View style={styles.waterActions}>
              <Pressable 
                style={styles.waterButton}
                onPress={() => {
                  setWaterIntake(Math.max(waterIntake - 250, 0));
                  setWaterGoalReached(false);
                }}
              >
                <Text style={styles.waterButtonText}>-250ml</Text>
              </Pressable>
              <IconButton
                icon="refresh"
                size={20}
                mode="contained-tonal"
                containerColor="rgba(0, 106, 106, 0.1)"
                iconColor="#006A6A"
                onPress={() => {
                  setWaterIntake(0);
                  setWaterGoalReached(false);
                }}
              />
              <Pressable 
                style={styles.waterButton}
                onPress={() => {
                  const newValue = Math.min((waterIntake + 250), 3000);
                  setWaterIntake(newValue);
                  if (newValue >= waterGoal && !waterGoalReached) {
                    setWaterGoalReached(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
              >
                <Text style={styles.waterButtonText}>+250ml</Text>
              </Pressable>
                  </View>
          </View>
        </Surface>

        {/* Sleep Tracking (Unified with SleepInsights, Compact Design) */}
        <Surface style={styles.sleepSurface}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons 
                name="sleep" 
                size={24} 
                color="#006A6A" 
              />
              <Text variant="titleMedium" style={styles.sectionTitleText}>
                Sleep
              </Text>
            </View>
            <IconButton
              icon="pencil"
              size={22}
              mode="contained-tonal"
              containerColor="rgba(0, 106, 106, 0.1)"
              iconColor="#006A6A"
              onPress={() => setSleepDialogVisible(true)}
            />
          </View>

          {sleepHours > 0 ? (
            <>
              {/* Compact Main Row: Hours | Quality | Score */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                {/* Hours */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#006A6A' }}>{sleepHours}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>hours</Text>
                </View>
                {/* Quality */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <MaterialCommunityIcons 
                        key={index}
                        name={index < sleepQuality ? "star" : "star-outline"}
                        size={16}
                        color={index < sleepQuality ? "#FFD700" : "#CCCCCC"}
                        style={{ marginHorizontal: 1 }}
                      />
                    ))}
                  </View>
                  <Text style={{ fontSize: 12, color: '#666' }}>quality</Text>
                </View>
                {/* Score */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2196F3' }}>{Math.round(Math.min((sleepHours / 8) * 50, 50) + (sleepQuality / 5) * 50)}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>score</Text>
                </View>
              </View>

              {/* Bedtime, Wake, Streak (inline) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="weather-night" size={14} color="#666" />
                  <Text style={{ fontSize: 13, color: '#333', marginLeft: 2 }}>{bedTime}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={14} color="#666" style={{ marginHorizontal: 4 }} />
                  <MaterialCommunityIcons name="weather-sunny" size={14} color="#666" />
                  <Text style={{ fontSize: 13, color: '#333', marginLeft: 2 }}>{wakeTime}</Text>
                </View>
                {sleepStreak > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12, marginLeft: 8 }}>
                    <MaterialCommunityIcons name="fire" size={14} color="#FF9800" />
                    <Text style={{ marginLeft: 2, color: '#FF9800', fontWeight: '600', fontSize: 12 }}>{sleepStreak}d</Text>
                  </View>
                )}
              </View>

              {/* Progress Bars (Duration & Quality) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#666' }}>Duration</Text>
                  <ProgressBar 
                    progress={Math.min(sleepHours / 9, 1)} 
                    color="#2196F3"
                    style={{ height: 4, width: 70, borderRadius: 2, marginTop: 2 }}
                  />
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#666' }}>Quality</Text>
                  <ProgressBar 
                    progress={sleepQuality / 5} 
                    color="#4CAF50"
                    style={{ height: 4, width: 70, borderRadius: 2, marginTop: 2 }}
                  />
                </View>
              </View>

              {/* Insights (compact cards, horizontal scroll if >2) */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {sleepHours < 6 && (
                  <View style={{ backgroundColor: '#F5F5F5', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="alert-circle" size={18} color="#F44336" />
                    <Text style={{ marginLeft: 6, fontSize: 12, color: '#F44336', flex: 1 }}>
                      Less than 7h sleep. Try going to bed earlier.
                    </Text>
                  </View>
                )}
                {sleepHours > 9 && (
                  <View style={{ backgroundColor: '#F5F5F5', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="information" size={18} color="#FFC107" />
                    <Text style={{ marginLeft: 6, fontSize: 12, color: '#FFC107', flex: 1 }}>
                      Oversleeping. Consider reducing sleep duration.
                    </Text>
                  </View>
                )}
                {(() => { const [bedHour] = bedTime.split(':').map(Number); return (bedHour < 22 || bedHour > 23); })() && (
                  <View style={{ backgroundColor: '#F5F5F5', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#2196F3" />
                    <Text style={{ marginLeft: 6, fontSize: 12, color: '#2196F3', flex: 1 }}>
                      Bedtime not optimal (10-11 PM).
                    </Text>
                  </View>
                )}
                {sleepQuality < 3 && (
                  <View style={{ backgroundColor: '#F5F5F5', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="star-outline" size={18} color="#FF9800" />
                    <Text style={{ marginLeft: 6, fontSize: 12, color: '#FF9800', flex: 1 }}>
                      Improve quality: less screen time, cool/dark room.
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptySleep}>
              <MaterialCommunityIcons name="sleep" size={40} color="#CCCCCC" />
              <Text style={styles.emptyText}>Track your sleep</Text>
            </View>
          )}
        </Surface>

        {/* Mood Tracking */}
        <Surface style={styles.moodSurface}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons 
                name="emoticon" 
                size={24} 
                color="#006A6A" 
              />
              <Text variant="titleMedium" style={styles.sectionTitleText}>
                Mood
              </Text>
            </View>
            <IconButton
              icon="pencil"
              size={22}
              mode="contained-tonal"
              containerColor="rgba(0, 106, 106, 0.1)"
              iconColor="#006A6A"
              onPress={() => setMoodDialogVisible(true)}
            />
          </View>
          
          {currentMood ? (
            <View style={styles.moodContent}>
              {/* Current Mood */}
              <View style={styles.currentMood}>
                <MaterialCommunityIcons 
                  name={getMoodIcon(currentMood)}
                  size={40}
                  color={getMoodColor(currentMood)}
                  style={styles.moodIcon}
                />
                <View style={styles.moodTextContainer}>
                  <Text style={[styles.moodText, { color: getMoodColor(currentMood) }]}>
                    {currentMood}
                  </Text>
                  <Text style={styles.moodTime}>
                    Updated {format(moodTimestamp, 'h:mm a')}
                  </Text>
                </View>
              </View>
              
              {/* Mood History */}
              {moodHistory.length > 0 && (
                <View style={styles.moodHistory}>
                  <Text style={styles.historyLabel}>Recent Moods</Text>
                  <View style={styles.moodDots}>
                    {moodHistory.slice(0, 5).map((entry, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.moodDot,
                          { backgroundColor: getMoodColor(entry.mood) }
                        ]}
                      >
                        <MaterialCommunityIcons 
                          name={getMoodIcon(entry.mood)}
                          size={16}
                          color="white"
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Mood Note */}
              {moodNote && (
                <View style={styles.moodNote}>
                  <MaterialCommunityIcons 
                    name="note-text-outline" 
                    size={16} 
                    color="#666" 
                  />
                  <Text style={styles.noteText} numberOfLines={2}>
                    {moodNote}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyMood}>
              <MaterialCommunityIcons 
                name="emoticon-neutral-outline" 
                size={40} 
                color="#CCCCCC" 
              />
              <Text style={styles.emptyText}>How are you feeling?</Text>
            </View>
          )}
        </Surface>

        {/* Reminders */}
        <Surface style={styles.remindersSurface}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons 
                name="bell-ring" 
                size={24} 
                color="#006A6A"
              />
              <Text variant="titleMedium" style={styles.sectionTitleText}>
                Reminders
              </Text>
            </View>
          </View>
          
          {reminders.length === 0 ? (
            <Card style={styles.emptyReminderCard}>
              <Card.Content style={styles.emptyReminderContent}>
                <MaterialCommunityIcons 
                  name="bell-off" 
                  size={44} 
                  color="#CCCCCC" 
                />
                <Text style={styles.emptyReminderText}>
                  No reminders set
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <>
              {reminders.map((reminder) => (
                <Card
                  key={reminder.id}
                  style={[
                    styles.reminderCard,
                    !reminder.enabled && styles.disabledReminderCard
                  ]}
                  onPress={() => {
                    setSelectedReminder(reminder);
                    setReminderDialogVisible(true);
                  }}
                >
                  <Card.Content style={styles.reminderContent}>
                    <View style={styles.reminderInfo}>
                      <View style={styles.reminderHeader}>
                        <MaterialCommunityIcons 
                          name="bell" 
                          size={20} 
                          color={reminder.enabled ? "#006A6A" : "#999"} 
                          style={styles.reminderIcon}
                        />
                        <View>
                          <Text 
                            style={[
                              styles.reminderTitle, 
                              !reminder.enabled && styles.disabledText
                            ]}
                          >
                            {reminder.title}
                          </Text>
                          <View style={styles.reminderTimeContainer}>
                            <MaterialCommunityIcons 
                              name="clock-outline" 
                              size={14}
                              color="#666" 
                              style={styles.reminderTimeIcon}
                            />
                            <Text style={styles.reminderTime}>
                              {reminder.time}
                            </Text>
                            <Text style={styles.reminderDays}>
                              {reminder.days.length === 7 
                                ? 'Every day' 
                                : reminder.days.join(', ')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.reminderActions}>
                      <Switch
                        value={reminder.enabled}
                        onValueChange={() => toggleReminder(reminder.id)}
                        color="#006A6A"
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#F44336"
                        onPress={() => deleteReminder(reminder.id)}
                      />
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </>
          )}
        </Surface>

        {/* Recent Meals */}
        <Surface style={styles.mealsSurface}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons 
                name="food-fork-drink" 
                size={24} 
                color="#006A6A"
              />
              <Text variant="titleMedium" style={styles.sectionTitleText}>
                Recent Meals
              </Text>
            </View>
            <IconButton
              icon="history"
              size={22}
              mode="contained-tonal"
              containerColor="rgba(0, 106, 106, 0.1)"
              iconColor="#006A6A"
              onPress={handleViewDiary}
            />
          </View>
          
          {meals.length > 0 ? (
            meals.map((meal) => (
              <Pressable 
                key={meal.id}
                onPress={handleViewDiary}
              >
                <Card style={styles.mealCard}>
                  <Card.Content style={styles.mealContent}>
                    <View style={styles.mealInfo}>
                      <Text variant="titleMedium" style={styles.mealName}>{meal.name}</Text>
                      <View style={styles.mealTypeContainer}>
                        <MaterialCommunityIcons 
                          name={
                            meal.meal_type === 'breakfast' ? 'coffee' :
                            meal.meal_type === 'lunch' ? 'food' :
                            meal.meal_type === 'dinner' ? 'food-turkey' : 'food-apple'
                          } 
                          size={14} 
                          color="#666" 
                          style={styles.mealTypeIcon}
                        />
                        <Text variant="bodySmall" style={styles.mealType}>
                          {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.mealCalories}>
                      <Text style={styles.mealCaloriesValue}>{meal.calories}</Text>
                      <Text style={styles.mealCaloriesUnit}>kcal</Text>
                    </View>
                  </Card.Content>
                </Card>
              </Pressable>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyCardContent}>
                <MaterialCommunityIcons 
                  name="food-off" 
                  size={44} 
                  color="#CCCCCC" 
                />
                <Text style={styles.emptyText}>No meals recorded today</Text>
              </Card.Content>
            </Card>
          )}
        </Surface>
      </ScrollView>

      <ReminderDialog
        visible={reminderDialogVisible}
        onDismiss={() => {
          setReminderDialogVisible(false);
          setSelectedReminder(undefined);
        }}
        onSave={reminder => {
          if (selectedReminder) {
            updateReminder({ ...reminder, id: selectedReminder.id });
          } else {
            addReminder(reminder);
          }
          setReminderDialogVisible(false);
          setSelectedReminder(undefined);
        }}
        initialValues={selectedReminder}
      />

      <ActivitySettingsDialog
        visible={activitySettingsVisible}
        onDismiss={() => setActivitySettingsVisible(false)}
        currentStepGoal={settings.stepGoal}
        onSave={saveSettings}
        initialSettings={settings}
      />

      <Portal>
        <Modal
          visible={chatVisible}
          onDismiss={() => setChatVisible(false)}
          style={styles.chatModal}
        >
          <ChatScreen />
        </Modal>
      </Portal>

      <SleepDialog
        visible={sleepDialogVisible}
        onDismiss={() => setSleepDialogVisible(false)}
        onSave={(data) => {
          setSleepHours(data.sleepHours);
          setSleepQuality(data.sleepQuality);
          setBedTime(data.bedTime);
          setWakeTime(data.wakeTime);
          // Update streak if sleep quality is good
          if (data.sleepQuality >= 4) {
            setSleepStreak(prev => prev + 1);
          } else {
            setSleepStreak(0);
          }
          setSleepDialogVisible(false);
        }}
        initialValues={{
          bedTime,
          wakeTime,
          sleepQuality,
        }}
      />

      <MoodDialog
        visible={moodDialogVisible}
        onDismiss={() => setMoodDialogVisible(false)}
        onSave={(data) => {
          setCurrentMood(data.mood);
          setMoodNote(data.note);
          const timestamp = new Date();
          setMoodTimestamp(timestamp);
          setMoodHistory(prev => [{
            mood: data.mood,
            note: data.note,
            timestamp,
          }, ...prev].slice(0, 7)); // Keep last 7 days
          setMoodDialogVisible(false);
        }}
        initialValues={{
          mood: currentMood,
          note: moodNote,
        }}
      />

      <FAB
        icon="robot"
        label="AI Assistant"
        style={styles.chatFab}
        onPress={() => setChatVisible(true)}
        color="white"
        customSize={50}
        mode="elevated"
      />

      {/* Goal Reached Modal */}
      <Portal>
        <Modal
          visible={showGoalReachedDialog}
          onDismiss={() => setShowGoalReachedDialog(false)}
          style={styles.goalModal}
        >
          <View style={styles.goalModalContent}>
            <MaterialCommunityIcons 
              name="trophy" 
              size={60} 
              color="#FFD700" 
              style={styles.trophyIconLarge}
            />
            <Text style={styles.goalReachedTitle}>
              Goal Reached!
            </Text>
            <Text style={styles.goalReachedText}>
              {goalReachedType === 'steps' && `You've reached your daily goal of ${settings.stepGoal.toLocaleString()} steps!`}
              {goalReachedType === 'calories' && `You've reached your daily calorie goal!`}
              {goalReachedType === 'protein' && `You've reached your daily protein goal!`}
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowGoalReachedDialog(false)}
              style={styles.goalButton}
              buttonColor="#006A6A"
            >
              Awesome!
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleText: {
    marginLeft: 8,
    color: '#006A6A',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyIcon: {
    marginRight: 8,
  },
  activitySurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  stepsCircleContainer: {
    width: 160,
    height: 160,
    marginRight: 16,
  },
  stepsGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    padding: 8,
  },
  stepsCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 72,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 72,
    borderWidth: 8,
    borderColor: '#006A6A',
  },
  stepsContent: {
    alignItems: 'center',
  },
  stepsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006A6A',
  },
  stepsText: {
    fontSize: 16,
    color: '#666',
  },
  stepsGoal: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statCard: {
    height: 48,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  weeklyContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(0, 106, 106, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklyAverage: {
    fontSize: 12,
    color: '#666',
  },
  weeklyTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 8,
  },
  statDay: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 60,
    width: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  statBar: {
    width: '100%',
    borderRadius: 12,
  },
  statDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  statSteps: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  todayDate: {
    color: '#006A6A',
    fontWeight: 'bold',
  },
  nutritionSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  nutritionContent: {
    marginTop: 16,
  },
  caloriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  caloriesUnit: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  progressRingContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 30,
    borderWidth: 6,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  macrosContainer: {
    marginTop: 20,
    gap: 16,
  },
  macroItem: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  macroLabel: {
    fontSize: 14,
    color: '#666666',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  macroUnit: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 2,
  },
  macroProgressContainer: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroProgress: {
    height: '100%',
    borderRadius: 3,
  },
  remindersSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  emptyReminderCard: {
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  emptyReminderContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyReminderText: {
    marginVertical: 12,
    color: '#999',
    textAlign: 'center',
  },
  reminderCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  disabledReminderCard: {
    opacity: 0.7,
  },
  reminderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    marginRight: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  reminderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reminderTimeIcon: {
    marginRight: 4,
  },
  reminderTime: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  reminderDays: {
    fontSize: 12,
    color: '#999',
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledText: {
    color: '#999',
  },
  goalModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
  },
  goalModalContent: {
    alignItems: 'center',
  },
  trophyIconLarge: {
    marginBottom: 16,
  },
  goalReachedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  goalReachedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  goalButton: {
    paddingHorizontal: 24,
  },
  chatModal: {
    flex: 1,
    margin: 0,
  },
  chatFab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#006A6A',
  },
  mealsSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  mealCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  mealContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeIcon: {
    marginRight: 4,
  },
  mealType: {
    fontSize: 14,
    color: '#666',
  },
  mealCalories: {
    alignItems: 'flex-end',
  },
  mealCaloriesValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mealCaloriesUnit: {
    fontSize: 14,
    color: '#666',
  },
  emptyCard: {
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  emptyCardContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginVertical: 12,
    color: '#999',
    textAlign: 'center',
  },
  waterSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  waterContent: {
    marginTop: 16,
  },
  waterInfo: {
    marginBottom: 12,
  },
  waterValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  waterUnit: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  waterLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  waterProgress: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  waterProgressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 6,
  },
  waterMarker: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  waterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterButton: {
    backgroundColor: 'rgba(0, 106, 106, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  waterButtonText: {
    color: '#006A6A',
    fontWeight: '500',
  },
  sleepSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sleepContent: {
    padding: 16,
  },
  sleepMainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sleepHoursContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sleepHours: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#006A6A',
  },
  sleepQualityStars: {
    flexDirection: 'row',
    gap: 2,
  },
  sleepDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 106, 106, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sleepTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sleepTimeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  quickTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  emptySleep: {
    alignItems: 'center',
    padding: 24,
  },
  moodSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  moodContent: {
    padding: 16,
  },
  currentMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodIcon: {
    marginRight: 12,
  },
  moodTextContainer: {
    flex: 1,
  },
  moodText: {
    fontSize: 20,
    fontWeight: '600',
  },
  moodTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  moodHistory: {
    backgroundColor: 'rgba(0, 106, 106, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  historyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  moodDots: {
    flexDirection: 'row',
    gap: 8,
  },
  moodDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  emptyMood: {
    alignItems: 'center',
    padding: 24,
  },
  nutritionCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    marginTop: 8,
  },
  sleepUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
});

export default HomeScreen; 