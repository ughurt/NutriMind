import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View, Platform, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { Text, Portal, Modal, IconButton, Surface, Card, Divider, Button, useTheme } from 'react-native-paper';
import { useMeals, MealType, Meal, NewMeal } from '../../hooks/useMeals';
import { useGoals } from '../../hooks/useGoals';
import { DailyNutrition } from './components/DailyNutrition';
import { AddMealForm } from './components/AddMealForm';
import { ShoppingList } from './components/ShoppingList';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: 'coffee' as IconName, color: '#FF9800' },
  { value: 'lunch', label: 'Lunch', icon: 'food' as IconName, color: '#4CAF50' },
  { value: 'dinner', label: 'Dinner', icon: 'food-turkey' as IconName, color: '#2196F3' },
  { value: 'snack', label: 'Snack', icon: 'cookie' as IconName, color: '#9C27B0' },
] as const;

const DiaryScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [mealFormVisible, setMealFormVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  
  // Add animation value for the date picker modal
  const datePickerAnimation = useRef(new Animated.Value(0)).current;

  const { meals, refreshMeals, addMeal, updateMeal, deleteMeal } = useMeals(selectedDate);
  const { goals, loadGoals } = useGoals();
  const navigation = useNavigation();
  const theme = useTheme();

  const maxDate = addDays(new Date(), 7); // Allow planning up to a week ahead
  const isToday = isSameDay(selectedDate, new Date());

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadGoals);
    return unsubscribe;
  }, [navigation, loadGoals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const mealsByType = meals.reduce((acc, meal) => {
    if (!acc[meal.meal_type]) acc[meal.meal_type] = [];
    acc[meal.meal_type].push(meal);
    return acc;
  }, {} as Record<MealType, Meal[]>);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    refreshMeals(date);
  };

  const handleAddMeal = async (mealData: NewMeal) => {
    try {
      await addMeal({
        ...mealData,
        meal_type: selectedMealType,
        date: format(selectedDate, 'yyyy-MM-dd'),
      });
      setMealFormVisible(false);
      setEditingMeal(null);
      refreshMeals(selectedDate);
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const calculateTotalCalories = () => {
    return meals.reduce((sum, meal) => sum + Number(meal.calories), 0);
  };

  const renderMealSection = (type: typeof MEAL_TYPES[number], meals: Meal[], onEdit: (meal: Meal) => void, onDelete: (id: string) => void) => {
    const totalCalories = meals.reduce((sum, meal) => sum + Number(meal.calories), 0).toString();
    
    return (
      <Card 
        key={type.value} 
        style={styles.mealSection}
        mode="elevated"
      >
        <View style={[styles.mealSectionHeader, {backgroundColor: `${type.color}15`}]}>
          <View style={styles.mealSectionHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: type.color }]}>
              <MaterialCommunityIcons 
                name={type.icon} 
                size={20} 
                color="white"
              />
            </View>
            <View>
              <Text variant="titleMedium" style={styles.cardTitle}>{type.label}</Text>
              <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
                {meals.length} {meals.length === 1 ? 'item' : 'items'} • {totalCalories} kcal
              </Text>
            </View>
          </View>
            <IconButton
              icon="plus"
            mode="contained"
              size={20}
            containerColor={type.color}
            iconColor="white"
              onPress={() => {
                setSelectedMealType(type.value);
                setMealFormVisible(true);
              }}
            />
        </View>
        
        <Card.Content style={styles.mealContent}>
          {meals.length > 0 ? (
            meals.map((meal, index) => (
            <React.Fragment key={meal.id}>
              {index > 0 && <Divider style={styles.mealDivider} />}
              <View style={styles.mealItem}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <View style={styles.macroRow}>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{meal.calories}</Text>
                        <Text style={styles.macroLabel}>kcal</Text>
                      </View>
                      <View style={styles.macroSeparator} />
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{meal.protein || 0}</Text>
                        <Text style={styles.macroLabel}>g protein</Text>
                      </View>
                      <View style={styles.macroSeparator} />
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{meal.carbs || 0}</Text>
                        <Text style={styles.macroLabel}>g carbs</Text>
                      </View>
                      <View style={styles.macroSeparator} />
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{meal.fat || 0}</Text>
                        <Text style={styles.macroLabel}>g fat</Text>
                      </View>
                  </View>
                </View>
                <View style={styles.mealActions}>
                  <IconButton
                      icon="pencil-outline"
                    size={20}
                    onPress={() => onEdit(meal)}
                    style={styles.actionButton}
                  />
                  <IconButton
                      icon="delete-outline"
                    size={20}
                    onPress={() => onDelete(meal.id)}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name={type.icon} 
                size={32} 
                color={`${type.color}40`}
              />
              <Text style={styles.emptyText}>No {type.label.toLowerCase()} entries</Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setSelectedMealType(type.value);
                  setMealFormVisible(true);
                }}
                style={[styles.addButton, { borderColor: type.color }]}
                textColor={type.color}
                labelStyle={{fontWeight: '500'}}
              >
                Add {type.label}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Define a custom DatePickerModal component if the theme approach doesn't work
  const renderCustomDatePicker = () => {
    if (!datePickerVisible) return null;
    
    const pickerContent = (
      <Animated.View
        style={[
          styles.datePickerContainer,
          {
            opacity: datePickerAnimation,
            transform: [
              {
                translateY: datePickerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: datePickerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.datePickerHeader}>
          <Text style={styles.datePickerTitle}>Select Date</Text>
          <IconButton
            icon="close"
            size={20}
            iconColor="white"
            onPress={closeDatePicker}
            style={styles.closeButton}
          />
        </View>
        
        {Platform.OS === 'ios' ? (
          <>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="inline"
              onChange={handleDateSelection}
              minimumDate={subDays(new Date(), 30)}
              maximumDate={maxDate}
              style={styles.iosDatePicker}
              textColor="#333"
            />
            <View style={styles.datePickerActions}>
              <Button 
                mode="contained" 
                onPress={closeDatePicker}
                style={styles.datePickerButton}
              >
                Done
              </Button>
            </View>
          </>
        ) : (
          <View style={styles.androidDatePickerWrapper}>
            <View style={styles.androidCalendarContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="calendar"
                onChange={handleDateSelection}
                minimumDate={subDays(new Date(), 30)}
                maximumDate={maxDate}
              />
            </View>
            <View style={styles.datePickerActions}>
              <Button 
                mode="contained" 
                onPress={closeDatePicker}
                style={styles.datePickerButton}
              >
                Done
              </Button>
            </View>
          </View>
        )}
      </Animated.View>
    );

    return (
      <Portal>
        <Animated.View 
          style={[
            styles.customModalOverlay,
            { 
              opacity: datePickerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }) 
            }
          ]}
        />
        <View style={styles.customModalContainer}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeDatePicker}
          />
          {pickerContent}
        </View>
      </Portal>
    );
  };

  // Add a function to handle opening the date picker with animation
  const openDatePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDatePickerVisible(true);
    Animated.spring(datePickerAnimation, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
      velocity: 1,
    }).start();
  };

  // Add a function to handle closing the date picker with animation
  const closeDatePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(datePickerAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDatePickerVisible(false);
    });
  };

  // Handle date selection with haptic feedback
  const handleDateSelection = (event: any, date?: Date) => {
    if (date) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleDateChange(date);
      closeDatePicker();
    } else {
      closeDatePicker();
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Food Diary</Text>
          <Text style={styles.headerSubtitle}>
            {isToday ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          </View>
        </View>
          
          <View style={styles.nutritionSummary}>
            <View style={styles.calorieDisplay}>
              <Text style={styles.calorieCount}>{Math.round(calculateTotalCalories())}</Text>
              <Text style={styles.calorieLabel}>calories</Text>
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalInfoText}>
                Goal: {goals.find(g => g.type === 'calories')?.target || 2000} kcal
              </Text>
              <View style={styles.goalProgress}>
                <View 
                  style={[
                    styles.goalProgressFill, 
                    { 
                      width: `${Math.min(calculateTotalCalories() / (goals.find(g => g.type === 'calories')?.target || 2000) * 100, 100)}%`,
                    backgroundColor: calculateTotalCalories() > (goals.find(g => g.type === 'calories')?.target || 2000) ? '#FF5252' : '#006A6A'
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
      </Surface>

      <View style={styles.dateSelector}>
        <IconButton 
          icon="chevron-left" 
          onPress={() => handleDateChange(subDays(selectedDate, 1))}
          style={styles.dateArrow}
          iconColor={theme.colors.primary}
        />
        <Button
          mode="outlined"
          onPress={openDatePicker}
          style={styles.dateButton}
          contentStyle={styles.dateButtonContent}
          icon="calendar"
        >
          {format(selectedDate, 'MMM d, yyyy')}
        </Button>
        <IconButton 
          icon="chevron-right" 
          onPress={() => handleDateChange(addDays(selectedDate, 1))}
          disabled={selectedDate >= maxDate}
          style={styles.dateArrow}
          iconColor={selectedDate >= maxDate ? '#9e9e9e' : theme.colors.primary}
        />
      </View>

      {renderCustomDatePicker()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refreshMeals(selectedDate)}
            colors={['#006A6A']}
            tintColor={'#006A6A'}
          />
        }
      >
        <DailyNutrition
          meals={meals}
          calorieGoal={goals.find(g => g.type === 'calories')?.target || 2000}
          proteinGoal={goals.find(g => g.type === 'protein')?.target || 150}
          carbsGoal={goals.find(g => g.type === 'carbs')?.target || 250}
          fatGoal={goals.find(g => g.type === 'fat')?.target || 70}
        />

        <View style={styles.mealList}>
          {MEAL_TYPES.map(type => renderMealSection(
            type,
            mealsByType[type.value] || [],
            (meal) => {
              setEditingMeal(meal);
              setSelectedMealType(meal.meal_type);
              setMealFormVisible(true);
            },
            deleteMeal
          ))}
        </View>

        <ShoppingList date={selectedDate} />
      </ScrollView>

      <Portal>
        <Modal
          visible={mealFormVisible}
          onDismiss={() => {
            setMealFormVisible(false);
            setEditingMeal(null);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <AddMealForm
            onSave={handleAddMeal}
            onDismiss={() => {
              setMealFormVisible(false);
              setEditingMeal(null);
            }}
            initialValues={editingMeal}
            selectedMealType={selectedMealType}
          />
        </Modal>
      </Portal>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  nutritionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  calorieDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    width: 110,
    height: 80,
  },
  calorieCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 32,
  },
  calorieLabel: {
    fontSize: 14,
    color: '#666666',
  },
  goalInfo: {
    flex: 1,
    marginLeft: 16,
  },
  goalInfoText: {
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  goalProgress: {
    height: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#006A6A',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: -16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 5,
  },
  dateArrow: {
    margin: 0,
  },
  dateButton: {
    flex: 1,
    maxWidth: 200,
    borderRadius: 20,
    borderColor: '#e0e0e0',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  mealList: {
    padding: 16,
    gap: 16,
  },
  mealSection: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  mealSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  macroLabel: {
    color: '#666',
    fontSize: 12,
  },
  macroSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  mealActions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
  },
  mealDivider: {
    marginVertical: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  addButton: {
    marginTop: 8,
    borderRadius: 20,
  },
  modalContainer: {
    margin: 16,
    maxHeight: '80%',
    width: '92%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  datePickerModal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  datePickerContainer: {
    width: Platform.OS === 'ios' ? Math.min(screenWidth - 48, 350) : screenWidth - 48,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#006A6A',
  },
  datePickerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  iosDatePicker: {
    height: 280,
    width: '100%',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  datePickerButton: {
    backgroundColor: '#006A6A',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  androidDatePickerContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidDatePickerWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  androidCalendarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  customModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  customModalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButton: {
    margin: 0,
  },
});

export default DiaryScreen; 