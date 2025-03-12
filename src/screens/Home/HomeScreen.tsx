import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Pressable, RefreshControl, Animated, Modal } from 'react-native';
import { Text, Card, Surface, ProgressBar, IconButton, Button, FAB, Switch, useTheme, Portal } from 'react-native-paper';
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

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Reminder {
  id: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
}

const HomeScreen = () => {
  const theme = useTheme();
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
    navigation.navigate('Diary', { screen: 'AddMeal' });
  };

  const handleViewDiary = () => {
    navigation.navigate('Diary', { screen: 'DiaryMain' });
  };

  const renderNutrientProgress = (
    label: string,
    value: number,
    target: number,
    icon: 'fire' | 'food-steak' | 'bread-slice' | 'oil',
    unit: string = ''
  ) => (
    <Surface style={styles.nutrientCard} elevation={1}>
      <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
      <Text style={styles.nutrientLabel}>{label}</Text>
      <Text style={styles.nutrientValue}>
        {value.toFixed(0)}{unit} / {target}{unit}
      </Text>
      <ProgressBar
        progress={Math.min(value / target, 1)}
        color={theme.colors.primary}
        style={styles.progressBar}
      />
    </Surface>
  );

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header */}
        <Surface style={styles.headerSurface}>
          <View style={styles.headerContent}>
            <View>
              <Text variant="headlineSmall" style={styles.welcomeText}>Welcome back!</Text>
              <Text variant="bodyLarge" style={styles.dateText}>
                {format(today, 'EEEE, MMMM d')}
              </Text>
            </View>
            <IconButton
              icon="plus"
              mode="contained"
              containerColor="#006A6A"
              iconColor="white"
              size={24}
              onPress={handleAddMeal}
            />
          </View>
        </Surface>

        {/* Workout Stats - Add this section */}
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
          <View style={styles.activityHeader}>
            <View style={styles.activityTitle}>
              <MaterialCommunityIcons 
                name="lightning-bolt" 
                size={24} 
                color="#006A6A" 
              />
              <Text variant="titleMedium" style={styles.activityTitleText}>
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
                size={20}
                onPress={() => setActivitySettingsVisible(true)}
              />
            </View>
          </View>

          <View style={styles.stepsContainer}>
            <Pressable 
              style={styles.stepsCircleContainer}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Could add detailed stats view here
              }}
            >
              <LinearGradient
                colors={['#E7F5F5', '#006A6A20']}
                style={styles.stepsGradient}
              >
                <View style={styles.stepsCircle}>
                  <Animated.View style={[
                    styles.progressRing,
                    {
                      transform: [{
                        scale: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        })
                      }],
                      opacity: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    }
                  ]} />
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
                    <MaterialCommunityIcons name="fire" size={20} color="#FF9800" />
                    <Text style={styles.statValue}>{caloriesBurned}</Text>
                    <Text style={styles.statLabel}>kcal burned</Text>
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
                    <MaterialCommunityIcons name="map-marker-distance" size={20} color="#2196F3" />
                    <Text style={styles.statValue}>{distance.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>{settings.distanceUnit}</Text>
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
                  <MaterialCommunityIcons name="target" size={20} color="#4CAF50" />
                  <Text style={styles.statValue}>
                    {Math.round((steps / settings.stepGoal) * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>of goal</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {settings.weeklyStatsEnabled && (
            <View style={styles.weeklyContainer}>
              <View style={styles.weeklyHeader}>
                <Text style={styles.weeklyTitle}>This Week</Text>
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

          {/* Activity Status with Animation */}
          {settings.inactivityAlert && (
            <Animated.View 
              style={[
                styles.activityStatus,
                {
                  transform: [{
                    scale: new Animated.Value(1)
                  }]
                }
              ]}
            >
              <MaterialCommunityIcons 
                name="walk" 
                size={20} 
                color="#006A6A" 
              />
              <Text style={styles.activityStatusText}>
                Activity monitoring enabled
              </Text>
            </Animated.View>
          )}
        </Surface>

        {/* Nutrition Summary */}
        <Surface style={styles.nutritionSurface}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.nutritionGrid}>
            {nutritionItems.map((item) => (
              <Card key={item.label} style={styles.nutritionCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons 
                      name={item.icon} 
                      size={24} 
                      color={item.color} 
                    />
                    <Text variant="labelMedium" style={styles.cardLabel}>
                      {item.label}
                    </Text>
                  </View>
                  <Text variant="headlineSmall" style={styles.nutritionValue}>
                    {item.value}
                    <Text variant="bodyMedium" style={styles.unitText}>
                      {item.unit}
                    </Text>
                  </Text>
                  <Text variant="bodySmall" style={styles.goalText}>
                    Goal: {item.goal}{item.unit}
                  </Text>
                  <ProgressBar 
                    progress={Math.min(item.value / item.goal, 1)} 
                    color={item.color}
                    style={styles.progressBar}
                  />
                </Card.Content>
              </Card>
            ))}
          </View>
        </Surface>

        {/* Reminders - Moved up */}
        <Surface style={styles.remindersSurface}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Reminders</Text>
            <IconButton
              icon="plus"
              mode="contained-tonal"
              size={20}
              onPress={() => {
                setSelectedReminder(undefined);
                setReminderDialogVisible(true);
              }}
            />
          </View>
          
          {reminders.length > 0 ? (
            reminders.map(reminder => (
              <Card key={reminder.id} style={styles.reminderCard}>
                <Card.Content style={styles.reminderContent}>
                  <View style={styles.reminderInfo}>
                    <Text variant="titleMedium">{reminder.title}</Text>
                    <Text variant="bodySmall" style={styles.reminderTime}>
                      {reminder.time} • {reminder.days.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.reminderActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => {
                        setSelectedReminder(reminder);
                        setReminderDialogVisible(true);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => deleteReminder(reminder.id)}
                    />
                    <Switch
                      value={reminder.enabled}
                      onValueChange={() => toggleReminder(reminder.id)}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No reminders set</Text>
                <Button 
                  mode="contained"
                  onPress={() => setReminderDialogVisible(true)}
                  style={styles.addButton}
                >
                  Add Reminder
                </Button>
              </Card.Content>
            </Card>
          )}
        </Surface>

        {/* Recent Meals - Moved down */}
        <Surface style={styles.mealsSurface}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Meals</Text>
            <IconButton
              icon="history"
              mode="contained-tonal"
              size={20}
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
                      <Text variant="titleMedium">{meal.name}</Text>
                      <Text variant="bodySmall" style={styles.mealType}>
                        {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.mealCalories}>
                      <Text variant="titleMedium">{meal.calories}</Text>
                      <Text variant="bodySmall">kcal</Text>
                    </View>
                  </Card.Content>
                </Card>
              </Pressable>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No meals recorded today</Text>
                <Button 
                  mode="contained"
                  onPress={handleAddMeal}
                  style={styles.addMealButton}
                >
                  Add Meal
                </Button>
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

      <FAB
        icon="robot"
        label="AI Assistant"
        style={styles.chatFab}
        onPress={() => setChatVisible(true)}
        color="white"
        mode="elevated"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    color: '#006A6A',
    fontWeight: 'bold',
  },
  dateText: {
    color: '#666',
    marginTop: 4,
  },
  nutritionSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: '#666',
    fontWeight: '500',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  nutritionCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    marginLeft: 8,
    color: '#666',
  },
  nutritionValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unitText: {
    color: '#666',
    marginLeft: 4,
  },
  goalText: {
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  mealsSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  mealType: {
    color: '#666',
    marginTop: 4,
  },
  mealCalories: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  addMealButton: {
    backgroundColor: '#006A6A',
  },
  activitySurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTitleText: {
    marginLeft: 8,
    color: '#006A6A',
    fontWeight: '600',
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
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  weeklyContainer: {
    marginTop: 8,
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
    color: '#666',
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
  remindersSurface: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  reminderCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  reminderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTime: {
    color: '#666',
    marginTop: 4,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#006A6A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyIcon: {
    marginRight: 8,
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: '#E7F5F5',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityStatusText: {
    marginLeft: 8,
    color: '#006A6A',
    fontWeight: '500',
  },
  chatModal: {
    flex: 1,
    margin: 0,
    backgroundColor: '#f5f5f5',
  },
  chatFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#006A6A',
  },
  nutrientCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default HomeScreen; 