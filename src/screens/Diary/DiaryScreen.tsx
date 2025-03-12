import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View, Platform } from 'react-native';
import { Text, Portal, Modal, IconButton, Surface, Card, Divider, Button } from 'react-native-paper';
import { useMeals, MealType, Meal, NewMeal } from '../../hooks/useMeals';
import { useGoals } from '../../hooks/useGoals';
import { DailyNutrition } from './components/DailyNutrition';
import { MealCard } from './components/MealCard';
import { AddMealForm } from './components/AddMealForm';
import { format, addDays, subDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

  const { meals, refreshMeals, addMeal, updateMeal, deleteMeal } = useMeals(selectedDate);
  const { goals, loadGoals } = useGoals();
  const navigation = useNavigation();

  const maxDate = addDays(new Date(), 7); // Allow planning up to a week ahead

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

  const renderMealSection = (type: typeof MEAL_TYPES[number], meals: Meal[], onEdit: (meal: Meal) => void, onDelete: (id: string) => void) => {
    const totalCalories = meals.reduce((sum, meal) => sum + Number(meal.calories), 0).toString();
    
    return (
      <Card 
        key={type.value} 
        style={[styles.mealSection, { borderLeftColor: type.color }]}
        mode="outlined"
      >
        <Card.Title
          title={type.label}
          subtitle={`${meals.length} ${meals.length === 1 ? 'item' : 'items'} • ${totalCalories} kcal`}
          titleStyle={styles.cardTitle}
          subtitleStyle={[styles.cardSubtitle, { color: type.color }]}
          left={(props) => (
            <View style={[styles.iconContainer, { backgroundColor: `${type.color}10` }]}>
              <MaterialCommunityIcons 
                name={type.icon} 
                size={24} 
                color={type.color}
              />
            </View>
          )}
          right={(props) => (
            <IconButton
              icon="plus"
              mode="contained-tonal"
              size={20}
              containerColor={`${type.color}15`}
              iconColor={type.color}
              onPress={() => {
                setSelectedMealType(type.value);
                setMealFormVisible(true);
              }}
            />
          )}
        />
        <Card.Content style={styles.mealContent}>
          {meals.map((meal, index) => (
            <React.Fragment key={meal.id}>
              {index > 0 && <Divider style={styles.mealDivider} />}
              <View style={styles.mealItem}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroText}>{meal.calories} kcal</Text>
                    <Text style={styles.macroDot}>•</Text>
                    <Text style={styles.macroText}>{meal.protein}g protein</Text>
                    <Text style={styles.macroDot}>•</Text>
                    <Text style={styles.macroText}>{meal.carbs}g carbs</Text>
                    <Text style={styles.macroDot}>•</Text>
                    <Text style={styles.macroText}>{meal.fat}g fat</Text>
                  </View>
                </View>
                <View style={styles.mealActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => onEdit(meal)}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => onDelete(meal.id)}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            </React.Fragment>
          ))}
          {meals.length === 0 && (
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
              >
                Add {type.label}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.dateSelector} elevation={2}>
        <IconButton 
          icon="chevron-left" 
          onPress={() => handleDateChange(subDays(selectedDate, 1))}
          style={styles.dateArrow}
        />
        <Button
          mode="text"
          onPress={() => setDatePickerVisible(true)}
          style={styles.dateButton}
          contentStyle={styles.dateButtonContent}
        >
          <MaterialCommunityIcons name="calendar" size={20} color="#006A6A" />
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateText}>{format(selectedDate, 'EEEE, MMMM d')}</Text>
            {selectedDate > new Date() && (
              <Text style={styles.futureDateText}>Future Plan</Text>
            )}
          </View>
        </Button>
        <IconButton 
          icon="chevron-right" 
          onPress={() => handleDateChange(addDays(selectedDate, 1))}
          disabled={selectedDate >= maxDate}
          style={styles.dateArrow}
        />
      </Surface>

      {datePickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setDatePickerVisible(Platform.OS === 'ios');
            if (date) handleDateChange(date);
          }}
          minimumDate={subDays(new Date(), 30)} // Allow viewing past 30 days
          maximumDate={maxDate}
        />
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refreshMeals(selectedDate)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateArrow: {
    margin: 0,
  },
  dateButton: {
    flex: 1,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    color: '#006A6A',
    fontSize: 16,
    fontWeight: '500',
  },
  futureDateText: {
    color: '#006A6A',
    fontSize: 12,
    opacity: 0.8,
  },
  mealList: {
    padding: 16,
    gap: 16,
  },
  mealSection: {
    borderLeftWidth: 4,
    backgroundColor: 'white',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  mealContent: {
    paddingHorizontal: 8,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  macroText: {
    fontSize: 14,
    color: '#666',
  },
  macroDot: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 4,
  },
  mealActions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
  },
  mealDivider: {
    marginVertical: 8,
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
  },
  modalContainer: {
    margin: 16,
    maxHeight: '80%',
    width: '92%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
});

export default DiaryScreen; 