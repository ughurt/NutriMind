import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput, Surface, Text, IconButton, List, Searchbar, Chip, Button, Divider } from 'react-native-paper';
import { Meal, NewMeal, MealType, useMeals, PreviousMeal } from '../../../hooks/useMeals';
import { useDebounce } from '../../../hooks/useDebounce';
import { foodApi, FoodItem } from '../../../services/foodApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const MEAL_TYPES: { value: MealType; label: string; icon: IconName }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: 'coffee' },
  { value: 'lunch', label: 'Lunch', icon: 'food' },
  { value: 'dinner', label: 'Dinner', icon: 'food-turkey' },
  { value: 'snack', label: 'Snack', icon: 'cookie' },
];

interface FavoriteFood {
  id: string;
  food_id: string;
  user_id: string;
  description: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  serving_size?: string;
  serving_unit?: string;
  last_used: string;
}

interface Props {
  onSave: (meal: NewMeal) => Promise<void>;
  onDismiss: () => void;
  initialValues?: Meal | null;
  selectedMealType: MealType;
}

export const AddMealForm = ({ onSave, onDismiss, initialValues, selectedMealType }: Props) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'previous'>('search');
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  
  const { previousMeals } = useMeals(new Date());
  const { user } = useAuth();

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name);
      setCalories(initialValues.calories.toString());
      setProtein(initialValues.protein?.toString() || '');
      setCarbs(initialValues.carbs?.toString() || '');
      setFat(initialValues.fat?.toString() || '');
    }
  }, [initialValues]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used', { ascending: false });

      if (error) throw error;
      setFavoriteFoods(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (food: FoodItem | FavoriteFood) => {
    if (!user) return;
    
    const foodId = 'fdcId' in food ? food.fdcId : food.food_id;
    const isFavorite = favoriteFoods.some(f => f.food_id === foodId);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_foods')
          .delete()
          .eq('user_id', user.id)
          .eq('food_id', foodId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_foods')
          .insert({
            user_id: user.id,
            food_id: 'fdcId' in food ? food.fdcId : food.food_id,
            description: food.description,
            calories: 'nutrients' in food ? food.nutrients.calories : food.calories,
            protein: 'nutrients' in food ? food.nutrients.protein : food.protein,
            carbs: 'nutrients' in food ? food.nutrients.carbs : food.carbs,
            fat: 'nutrients' in food ? food.nutrients.fat : food.fat,
            serving_size: 'fdcId' in food ? food.servingSize : (food.serving_size || null),
            serving_unit: 'fdcId' in food ? food.servingSizeUnit : (food.serving_unit || null),
            last_used: new Date().toISOString()
          });

        if (error) throw error;
      }
      
      await loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = (foodId: string) => {
    return favoriteFoods.some(f => f.food_id === foodId);
  };

  const validateForm = () => {
    // Only name and calories are required
    if (!name.trim()) {
      setError('Please enter a meal name');
      return false;
    }
    if (!calories.trim() || isNaN(Number(calories)) || Number(calories) <= 0) {
      setError('Please enter valid calories');
      return false;
    }
    // All macros are optional - only validate if they're filled in
    if (protein.trim() !== '' && (isNaN(Number(protein)) || Number(protein) < 0)) {
      setError('Please enter valid protein');
      return false;
    }
    if (carbs.trim() !== '' && (isNaN(Number(carbs)) || Number(carbs) < 0)) {
      setError('Please enter valid carbs');
      return false;
    }
    if (fat.trim() !== '' && (isNaN(Number(fat)) || Number(fat) < 0)) {
      setError('Please enter valid fat');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    console.log('Starting save with:', { name, calories, protein, carbs, fat });
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    const now = new Date().toISOString();
    
    // Convert string values to numbers for the database
    const mealData: NewMeal = {
      name: name.trim(),
      calories: calories.trim(),
      // Set empty strings to null explicitly
      protein: protein.trim() === '' ? null : protein.trim(),
      carbs: carbs.trim() === '' ? null : carbs.trim(),
      fat: fat.trim() === '' ? null : fat.trim(),
      meal_type: selectedMealType,
      date: now
    };

    console.log('Attempting to save meal:', mealData);

    try {
      console.log('Calling onSave...');
      await onSave(mealData);
      console.log('onSave completed successfully');
      onDismiss();
    } catch (error) {
      console.error('Error saving meal:', error);
      setError('Failed to save meal');
    }
  };

  const debouncedSearch = useDebounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await foodApi.searchFoods(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching foods:', error);
    } finally {
      setSearching(false);
    }
  }, 500);

  const handleFoodSelect = (food: FoodItem | FavoriteFood) => {
    const foodId = 'fdcId' in food ? food.fdcId : food.food_id;
    setSelectedMealId(foodId);
    setName(food.description);
    
    if ('nutrients' in food) {
      // FoodItem
    setCalories(food.nutrients.calories.toString());
    setProtein(food.nutrients.protein.toString());
    setCarbs(food.nutrients.carbs.toString());
    setFat(food.nutrients.fat.toString());
    } else {
      // FavoriteFood
      setCalories(food.calories.toString());
      setProtein(food.protein?.toString() || '');
      setCarbs(food.carbs?.toString() || '');
      setFat(food.fat?.toString() || '');
    }
    
    setSearchQuery('');
    setSearchResults([]);
    
    // Save to recent searches
    setRecentSearches(prev => {
      const updated = [food.description, ...prev.filter(s => s !== food.description)].slice(0, 5);
      return updated;
    });
  };

  const handlePreviousMealSelect = (meal: PreviousMeal) => {
    setSelectedMealId(meal.id);
    setName(meal.name);
    setCalories(meal.calories.toString());
    setProtein(meal.protein?.toString() || '');
    setCarbs(meal.carbs?.toString() || '');
    setFat(meal.fat?.toString() || '');
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
          {initialValues ? 'Edit Meal' : 'Add Meal'}
        </Text>
        </View>
        <View style={styles.headerRight}>
        <IconButton 
          icon={quickAddMode ? 'magnify' : 'flash'} 
          size={24} 
          onPress={() => setQuickAddMode(!quickAddMode)}
            style={styles.modeButton}
            iconColor="#006A6A"
        />
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Surface style={[styles.section, styles.mealTypeSection]} elevation={0}>
          <View style={styles.mealTypeHeader}>
            <View style={[styles.mealTypeIcon, { backgroundColor: '#E7F5F5' }]}>
              <MaterialCommunityIcons
                name={MEAL_TYPES.find(type => type.value === selectedMealType)?.icon || 'food'}
                size={24}
                color="#006A6A"
              />
            </View>
            <Text variant="titleMedium" style={styles.mealTypeText}>
            {MEAL_TYPES.find(type => type.value === selectedMealType)?.label}
          </Text>
          </View>
        </Surface>

        {!quickAddMode ? (
          <Surface style={styles.section} elevation={0}>
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'search' && styles.activeTab]}
                onPress={() => setActiveTab('search')}
              >
                <MaterialCommunityIcons 
                  name="magnify" 
                  size={20} 
                  color={activeTab === 'search' ? '#006A6A' : '#666'} 
                />
                <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
                  Search
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
                onPress={() => setActiveTab('favorites')}
              >
                <MaterialCommunityIcons 
                  name="star" 
                  size={20} 
                  color={activeTab === 'favorites' ? '#006A6A' : '#666'} 
                />
                <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
                  Favorites
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'previous' && styles.activeTab]}
                onPress={() => setActiveTab('previous')}
              >
                <MaterialCommunityIcons 
                  name="history" 
                  size={20} 
                  color={activeTab === 'previous' ? '#006A6A' : '#666'} 
                />
                <Text style={[styles.tabText, activeTab === 'previous' && styles.activeTabText]}>
                  Previous
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'search' && (
              <>
              <Searchbar
                  placeholder="Search food database..."
                onChangeText={(query) => {
                  setSearchQuery(query);
                  debouncedSearch(query);
                }}
                value={searchQuery}
                style={styles.searchBar}
                  inputStyle={styles.searchInput}
                icon="magnify"
                loading={searching}
                  elevation={0}
                />

                {searching && (
                  <View style={styles.searchingContainer}>
                    <ActivityIndicator size="small" color="#006A6A" />
                    <Text style={styles.searchingText}>Searching database...</Text>
                  </View>
                )}

              {recentSearches.length > 0 && !searchQuery && (
                <View style={styles.recentSearches}>
                    <View style={styles.subsectionHeader}>
                      <MaterialCommunityIcons name="history" size={16} color="#666" />
                      <Text variant="bodySmall" style={styles.subsectionTitle}>Recent</Text>
                    </View>
                    <View style={styles.recentList}>
                  {recentSearches.map((search, index) => (
                        <TouchableOpacity
                      key={index}
                          style={styles.recentItem}
                      onPress={() => {
                        setSearchQuery(search);
                        debouncedSearch(search);
                      }}
                        >
                          <MaterialCommunityIcons name="history" size={18} color="#006A6A" />
                          <Text style={styles.recentItemText} numberOfLines={1}>{search}</Text>
                        </TouchableOpacity>
                  ))}
                    </View>
                </View>
              )}

                {!searchQuery && (
                  <>
                    <View style={styles.suggestedCategories}>
                      <View style={styles.subsectionHeader}>
                        <MaterialCommunityIcons name="shape" size={16} color="#666" />
                        <Text variant="bodySmall" style={styles.subsectionTitle}>Categories</Text>
                      </View>
                      <View style={styles.categoryGrid}>
                        {[
                          { icon: 'fruit-cherries' as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Fruits', color: '#FF6B6B' },
                          { icon: 'carrot' as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Vegetables', color: '#51CF66' },
                          { icon: 'food-steak' as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Proteins', color: '#FF922B' },
                          { icon: 'bread-slice' as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Grains', color: '#FAB005' },
                          { icon: 'cheese' as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Dairy', color: '#748FFC' },
                          { icon: 'cookie' as keyof typeof MaterialCommunityIcons.glyphMap, label: 'Snacks', color: '#CDB4DB' },
                        ].map((category) => (
                          <TouchableOpacity
                            key={category.label}
                            style={styles.categoryCard}
                            onPress={() => {
                              setSearchQuery(category.label);
                              debouncedSearch(category.label);
                            }}
                          >
                            <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                              <MaterialCommunityIcons name={category.icon} size={24} color={category.color} />
                            </View>
                            <Text style={styles.categoryLabel}>{category.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.commonFoods}>
                      <View style={styles.subsectionHeader}>
                        <MaterialCommunityIcons name="star" size={16} color="#666" />
                        <Text variant="bodySmall" style={styles.subsectionTitle}>Common Foods</Text>
                      </View>
                      <View style={styles.commonFoodsList}>
                        {[
                          { name: 'Banana', calories: '105', icon: 'food-apple' as keyof typeof MaterialCommunityIcons.glyphMap },
                          { name: 'Chicken Breast', calories: '165', icon: 'food-drumstick' as keyof typeof MaterialCommunityIcons.glyphMap },
                          { name: 'Greek Yogurt', calories: '100', icon: 'food-variant' as keyof typeof MaterialCommunityIcons.glyphMap },
                          { name: 'Oatmeal', calories: '150', icon: 'bowl-mix' as keyof typeof MaterialCommunityIcons.glyphMap },
                        ].map((food) => (
                          <TouchableOpacity
                            key={food.name}
                            style={styles.commonFoodCard}
                            onPress={() => {
                              setSearchQuery(food.name);
                              debouncedSearch(food.name);
                            }}
                          >
                            <View style={styles.commonFoodIcon}>
                              <MaterialCommunityIcons name={food.icon} size={20} color="#006A6A" />
                            </View>
                            <View style={styles.commonFoodInfo}>
                              <Text style={styles.commonFoodName}>{food.name}</Text>
                              <Text style={styles.commonFoodCalories}>{food.calories} cal</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
              )}

              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                    <View style={styles.subsectionHeader}>
                      <MaterialCommunityIcons name="food-apple" size={16} color="#666" />
                      <Text variant="bodySmall" style={styles.subsectionTitle}>
                        {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                      </Text>
                    </View>
                    <View style={styles.resultsList}>
                  {searchResults.map((food) => (
                        <TouchableOpacity
                      key={food.fdcId}
                          style={styles.resultCard}
                      onPress={() => handleFoodSelect(food)}
                        >
                          <View style={styles.resultHeader}>
                            <View style={styles.foodIconContainer}>
                              <MaterialCommunityIcons name="food" size={20} color="#006A6A" />
                            </View>
                            <Text style={styles.resultTitle} numberOfLines={2}>{food.description}</Text>
                          </View>
                          <View style={styles.macroGrid}>
                            <View style={styles.macroItem}>
                              <Text style={[
                                styles.macroValue,
                                selectedMealId === food.fdcId && styles.selectedMacroValue
                              ]}>{food.nutrients.calories}</Text>
                              <Text style={[
                                styles.macroLabel,
                                selectedMealId === food.fdcId && styles.selectedMacroLabel
                              ]}>cal</Text>
                            </View>
                            <View style={[
                              styles.macroDivider,
                              selectedMealId === food.fdcId && styles.selectedMacroDivider
                            ]} />
                            <View style={styles.macroItem}>
                              <Text style={[
                                styles.macroValue,
                                selectedMealId === food.fdcId && styles.selectedMacroValue
                              ]}>{food.nutrients.protein}g</Text>
                              <Text style={[
                                styles.macroLabel,
                                selectedMealId === food.fdcId && styles.selectedMacroLabel
                              ]}>protein</Text>
                            </View>
                            <View style={[
                              styles.macroDivider,
                              selectedMealId === food.fdcId && styles.selectedMacroDivider
                            ]} />
                            <View style={styles.macroItem}>
                              <Text style={[
                                styles.macroValue,
                                selectedMealId === food.fdcId && styles.selectedMacroValue
                              ]}>{food.nutrients.carbs}g</Text>
                              <Text style={[
                                styles.macroLabel,
                                selectedMealId === food.fdcId && styles.selectedMacroLabel
                              ]}>carbs</Text>
                            </View>
                            <View style={[
                              styles.macroDivider,
                              selectedMealId === food.fdcId && styles.selectedMacroDivider
                            ]} />
                            <View style={styles.macroItem}>
                              <Text style={[
                                styles.macroValue,
                                selectedMealId === food.fdcId && styles.selectedMacroValue
                              ]}>{food.nutrients.fat}g</Text>
                              <Text style={[
                                styles.macroLabel,
                                selectedMealId === food.fdcId && styles.selectedMacroLabel
                              ]}>fat</Text>
                            </View>
                          </View>
                          <TouchableOpacity 
                            style={styles.starButton}
                            onPress={() => toggleFavorite(food)}
                          >
                            <MaterialCommunityIcons 
                              name={isFavorite(food.fdcId) ? "star" : "star-outline"} 
                              size={20} 
                              color={isFavorite(food.fdcId) ? "#FFB800" : "#666"} 
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </View>
                </View>
              )}
              </>
            )}

            {activeTab === 'favorites' && (
              <View style={styles.sectionContent}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="star" size={20} color="#006A6A" />
                  <Text style={styles.sectionTitle}>Favorite Foods</Text>
                </View>
                {favoriteFoods.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="star-outline" size={32} color="#666" />
                    <Text style={styles.emptyStateText}>No favorite foods yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Star items while searching to add them here
                    </Text>
                  </View>
                ) : (
                  <View style={styles.foodList}>
                    {favoriteFoods.map((food) => (
                      <TouchableOpacity
                      key={food.food_id}
                        style={[
                          styles.foodCard,
                          selectedMealId === food.food_id && styles.selectedFoodCard
                        ]}
                      onPress={() => handleFoodSelect(food)}
                      >
                        <View style={styles.foodCardHeader}>
                          <View style={[
                            styles.foodIconContainer,
                            selectedMealId === food.food_id && styles.selectedFoodIconContainer
                          ]}>
                            <MaterialCommunityIcons 
                              name="food" 
                              size={20} 
                              color={selectedMealId === food.food_id ? 'white' : '#006A6A'} 
                            />
                          </View>
                          <Text style={[
                            styles.foodTitle,
                            selectedMealId === food.food_id && styles.selectedFoodTitle
                          ]} numberOfLines={1}>
                            {food.description}
                          </Text>
                          <TouchableOpacity 
                            style={styles.starButton}
                            onPress={() => toggleFavorite(food)}
                          >
                            <MaterialCommunityIcons 
                              name="star"
                              size={20} 
                              color={selectedMealId === food.food_id ? 'white' : "#FFB800"} 
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={[
                          styles.macroGrid,
                          selectedMealId === food.food_id && styles.selectedMacroGrid
                        ]}>
                          <View style={styles.macroItem}>
                            <Text style={[
                              styles.macroValue,
                              selectedMealId === food.food_id && styles.selectedMacroValue
                            ]}>{food.calories}</Text>
                            <Text style={[
                              styles.macroLabel,
                              selectedMealId === food.food_id && styles.selectedMacroLabel
                            ]}>cal</Text>
                          </View>
                          <View style={[
                            styles.macroDivider,
                            selectedMealId === food.food_id && styles.selectedMacroDivider
                          ]} />
                          <View style={styles.macroItem}>
                            <Text style={[
                              styles.macroValue,
                              selectedMealId === food.food_id && styles.selectedMacroValue
                            ]}>{food.protein}g</Text>
                            <Text style={[
                              styles.macroLabel,
                              selectedMealId === food.food_id && styles.selectedMacroLabel
                            ]}>protein</Text>
                          </View>
                          <View style={[
                            styles.macroDivider,
                            selectedMealId === food.food_id && styles.selectedMacroDivider
                          ]} />
                          <View style={styles.macroItem}>
                            <Text style={[
                              styles.macroValue,
                              selectedMealId === food.food_id && styles.selectedMacroValue
                            ]}>{food.carbs}g</Text>
                            <Text style={[
                              styles.macroLabel,
                              selectedMealId === food.food_id && styles.selectedMacroLabel
                            ]}>carbs</Text>
                          </View>
                          <View style={[
                            styles.macroDivider,
                            selectedMealId === food.food_id && styles.selectedMacroDivider
                          ]} />
                          <View style={styles.macroItem}>
                            <Text style={[
                              styles.macroValue,
                              selectedMealId === food.food_id && styles.selectedMacroValue
                            ]}>{food.fat}g</Text>
                            <Text style={[
                              styles.macroLabel,
                              selectedMealId === food.food_id && styles.selectedMacroLabel
                            ]}>fat</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'previous' && (
              <View style={styles.sectionContent}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="history" size={20} color="#006A6A" />
                  <Text style={styles.sectionTitle}>Previous Meals</Text>
                </View>
                {previousMeals.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="history" size={32} color="#666" />
                    <Text style={styles.emptyStateText}>No previous meals</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Your recently added meals will appear here
                    </Text>
                  </View>
                ) : (
                  <View style={styles.foodList}>
                    {previousMeals.map((meal) => (
                      <TouchableOpacity
                        key={meal.id}
                        style={[
                          styles.foodCard,
                          selectedMealId === meal.id && styles.selectedFoodCard
                        ]}
                        onPress={() => handlePreviousMealSelect(meal)}
                      >
                        <View style={styles.foodCardHeader}>
                          <View style={[
                            styles.foodIconContainer,
                            selectedMealId === meal.id && styles.selectedFoodIconContainer
                          ]}>
                            <MaterialCommunityIcons 
                              name={MEAL_TYPES.find(type => type.value === meal.meal_type)?.icon || 'food'} 
                              size={20} 
                              color={selectedMealId === meal.id ? 'white' : '#006A6A'} 
                            />
                          </View>
                          <Text style={[
                            styles.foodTitle,
                            selectedMealId === meal.id && styles.selectedFoodTitle
                          ]} numberOfLines={1}>
                            {meal.name}
                          </Text>
                          <Text style={styles.timeText}>
                            {meal.lastUsed ? format(new Date(meal.lastUsed), 'MMM d') : ''}
                          </Text>
                        </View>
                        <View style={[
                          styles.macroGrid,
                          selectedMealId === meal.id && styles.selectedMacroGrid
                        ]}>
                          <View style={styles.macroItem}>
                            <Text style={[
                              styles.macroValue,
                              selectedMealId === meal.id && styles.selectedMacroValue
                            ]}>{meal.calories}</Text>
                            <Text style={[
                              styles.macroLabel,
                              selectedMealId === meal.id && styles.selectedMacroLabel
                            ]}>cal</Text>
                          </View>
                          <View style={[
                            styles.macroDivider,
                            selectedMealId === meal.id && styles.selectedMacroDivider
                          ]} />
                          <View style={styles.macroItem}>
                            <Text style={[
                              styles.macroValue,
                              selectedMealId === meal.id && styles.selectedMacroValue
                            ]}>{meal.protein || 0}g</Text>
                            <Text style={[
                              styles.macroLabel,
                              selectedMealId === meal.id && styles.selectedMacroLabel
                            ]}>protein</Text>
                          </View>
                          <View style={[
                            styles.macroDivider,
                            selectedMealId === meal.id && styles.selectedMacroDivider
                          ]} />
                          <View style={styles.macroItem}>
                            <Text style={[
                              styles.macroValue,
                              selectedMealId === meal.id && styles.selectedMacroValue
                            ]}>{meal.carbs || 0}g</Text>
                            <Text style={[
                              styles.macroLabel,
                              selectedMealId === meal.id && styles.selectedMacroLabel
                            ]}>carbs</Text>
                          </View>
                          <View style={[
                            styles.macroDivider,
                            selectedMealId === meal.id && styles.selectedMacroDivider
                          ]} />
                          <View style={styles.macroItem}>
                            <Text style={[
                              styles.macroValue,
                              selectedMealId === meal.id && styles.selectedMacroValue
                            ]}>{meal.fat || 0}g</Text>
                            <Text style={[
                              styles.macroLabel,
                              selectedMealId === meal.id && styles.selectedMacroLabel
                            ]}>fat</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                </View>
              )}
            </Surface>
        ) : (
          <Surface style={styles.section} elevation={0}>
          {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#B00020" />
            <Text style={styles.error}>{error}</Text>
              </View>
          ) : null}

            <View style={styles.quickAddContainer}>
              <View style={styles.quickAddHeader}>
                <View style={[styles.foodIconContainer, { backgroundColor: '#E7F5F5' }]}>
                  <MaterialCommunityIcons name="flash" size={20} color="#006A6A" />
                </View>
                <Text variant="titleSmall" style={styles.sectionTitle}>Quick Add Meal</Text>
              </View>

              <View style={styles.formSection}>
          <TextInput
                  label="Food Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
                  style={[styles.input, styles.nameInput]}
                  mode="outlined"
                  placeholder="Enter food name"
          />

            <TextInput
              label="Calories"
              value={calories}
              onChangeText={(text) => {
                setCalories(text);
                setError('');
              }}
              keyboardType="numeric"
                  style={[styles.input, styles.caloriesInput]}
                  mode="outlined"
              right={<TextInput.Affix text="cal" />}
            />
              </View>

              <View style={styles.macroSection}>
                <Text style={styles.formLabel}>Macronutrients</Text>
                <View style={styles.macroGrid}>
                  <View style={styles.macroInputWrapper}>
                    <View style={[styles.macroIconContainer, { backgroundColor: '#FFE5E5' }]}>
                      <MaterialCommunityIcons name="food-steak" size={16} color="#FF4444" />
                    </View>
            <TextInput
              label="Protein"
              value={protein}
              onChangeText={(text) => {
                setProtein(text);
                setError('');
              }}
              keyboardType="numeric"
                      style={styles.macroInput}
                      mode="outlined"
              right={<TextInput.Affix text="g" />}
            />
          </View>

                  <View style={styles.macroInputWrapper}>
                    <View style={[styles.macroIconContainer, { backgroundColor: '#FFF3E0' }]}>
                      <MaterialCommunityIcons name="bread-slice" size={16} color="#FF9800" />
                    </View>
            <TextInput
              label="Carbs"
              value={carbs}
              onChangeText={(text) => {
                setCarbs(text);
                setError('');
              }}
              keyboardType="numeric"
                      style={styles.macroInput}
                      mode="outlined"
              right={<TextInput.Affix text="g" />}
            />
                  </View>

                  <View style={styles.macroInputWrapper}>
                    <View style={[styles.macroIconContainer, { backgroundColor: '#E8F5E9' }]}>
                      <MaterialCommunityIcons name="water" size={16} color="#4CAF50" />
                    </View>
            <TextInput
              label="Fat"
              value={fat}
              onChangeText={(text) => {
                setFat(text);
                setError('');
              }}
              keyboardType="numeric"
                      style={styles.macroInput}
                      mode="outlined"
              right={<TextInput.Affix text="g" />}
            />
                  </View>
                </View>
              </View>
          </View>
        </Surface>
        )}
      </ScrollView>

      <Surface style={styles.bottomBar} elevation={4}>
        <View style={styles.buttons}>
          <Button 
            mode="outlined" 
            onPress={onDismiss} 
            style={styles.button}
          >
            Cancel
          </Button>
        <Button 
          mode="contained"
          onPress={handleSave}
            style={[styles.button, styles.saveButton]}
        >
            {initialValues ? 'Save Changes' : 'Add Meal'}
        </Button>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
    minHeight: 500,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  headerLeft: {
    width: 48,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    margin: 0,
  },
  modeButton: {
    margin: 0,
  },
  section: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
  },
  mealTypeSection: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mealTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealTypeIcon: {
    padding: 8,
    borderRadius: 10,
  },
  mealTypeText: {
    color: '#006A6A',
    fontSize: 18,
    fontWeight: '600',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  quickAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  searchBar: {
    backgroundColor: 'white',
    borderRadius: 10,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    fontSize: 15,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  searchingText: {
    color: '#006A6A',
    fontSize: 14,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 16,
  },
  recentSearches: {
    marginTop: 8,
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recentItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  searchResults: {
    marginTop: 8,
  },
  resultsList: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  subsectionTitle: {
    color: '#666',
    marginBottom: 4,
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
  },
  foodIconContainer: {
    backgroundColor: '#E7F5F5',
    padding: 8,
    borderRadius: 8,
  },
  resultTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    lineHeight: 20,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 8,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#006A6A',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
  },
  error: {
    color: '#B00020',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 13,
    backgroundColor: '#FFE9E9',
    padding: 8,
    borderRadius: 8,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 8,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  nameInput: {
    marginBottom: 0,
  },
  caloriesInput: {
    marginBottom: 0,
  },
  macroInput: {
    height: 40,
    backgroundColor: 'white',
    width: '100%',
  },
  bottomBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 12,
    width: '100%',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    height: 44,
  },
  saveButton: {
    backgroundColor: '#006A6A',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFE9E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E7F5F5',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#006A6A',
  },
  sectionContent: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  foodList: {
    gap: 12,
  },
  foodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  foodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  foodTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  starButton: {
    padding: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  suggestedCategories: {
    marginTop: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  categoryCard: {
    width: '32%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  categoryIcon: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  commonFoods: {
    marginTop: 24,
  },
  commonFoodsList: {
    gap: 8,
  },
  commonFoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  commonFoodIcon: {
    backgroundColor: '#E7F5F5',
    padding: 8,
    borderRadius: 8,
  },
  commonFoodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  commonFoodName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  commonFoodCalories: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  quickAddContainer: {
    gap: 16,
  },
  formSection: {
    gap: 8,
  },
  macroSection: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  macroInputWrapper: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
  },
  macroIconContainer: {
    padding: 6,
    borderRadius: 6,
  },
  selectedFoodCard: {
    backgroundColor: '#006A6A',
    borderColor: '#006A6A',
  },
  selectedFoodIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedFoodTitle: {
    color: 'white',
  },
  selectedMacroGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedMacroValue: {
    color: 'white',
  },
  selectedMacroLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedMacroDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}); 