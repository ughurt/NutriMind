import React, { useState } from 'react';
import { StyleSheet, View, Image, ScrollView, Animated, Easing, Modal, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, useTheme, Divider, IconButton, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { saveShoppingList, getShoppingList } from '../../../services/supabase';

interface DietPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  calories: string;
  mealsPerDay: number;
  dietType: string;
  features: string[];
  imageUrl: string;
}

const dietPlans: DietPlan[] = [
  {
    id: 'diet-1',
    title: 'Lean & Clean',
    description: 'Clean eating program for sustainable weight loss and energy.',
    duration: '60 days',
    calories: '1800-2000',
    mealsPerDay: 4,
    dietType: 'Regular',
    features: [
      'Personalized meal plans',
      'Shopping lists',
      'Recipe collection',
      'Nutritionist support',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=500&auto=format&fit=crop',
  },
  {
    id: 'diet-2',
    title: 'Vegan Vitality',
    description: 'Plant-based meal plan for optimal health and wellness.',
    duration: '30 days',
    calories: '1600-1800',
    mealsPerDay: 3,
    dietType: 'Vegan',
    features: [
      'Balanced vegan meals',
      'Easy recipes',
      'Nutrient guidance',
      'Community support',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=500&auto=format&fit=crop',
  },
];

// Sample video URLs for each meal
const sampleVideos = {
  breakfast: 'https://www.w3schools.com/html/mov_bbb.mp4',
  lunch: 'https://www.w3schools.com/html/movie.mp4',
  snack: 'https://www.w3schools.com/html/mov_bbb.mp4',
  dinner: 'https://www.w3schools.com/html/movie.mp4',
};

export const DietPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const theme = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [videoModal, setVideoModal] = useState<{ visible: boolean; url: string | null }>({ visible: false, url: null });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (selectedPlan === 'diet-1') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [selectedPlan]);

  const openVideo = (url: string) => setVideoModal({ visible: true, url });
  const closeVideo = () => setVideoModal({ visible: false, url: null });

  const handleSendToDiary = async () => {
    setLoading(true);
    setError('');
    try {
      // Gather all shopping list items to add
      const newItems = [
        ...['Spinach', 'Avocado', 'Berries', 'Sweet potato', 'Broccoli', 'Tomatoes', 'Carrots', 'Bananas', 'Oranges'],
        ...['Chicken breast', 'Salmon', 'Eggs', 'Greek yogurt', 'Tuna', 'Shrimp', 'Tofu', 'Lentils'],
        ...['Oats', 'Quinoa', 'Brown rice', 'Whole grain bread', 'Granola', 'Almond milk', 'Olive oil', 'Mixed nuts', 'Almond butter', 'Hummus'],
      ].map(name => ({ name, checked: false }));

      // Fetch current shopping list
      const current = await getShoppingList();
      // Merge, case-insensitive, no duplicates
      const lowerSet = new Set(current.map(i => i.name.trim().toLowerCase()));
      const merged = [
        ...current,
        ...newItems.filter(i => !lowerSet.has(i.name.trim().toLowerCase())),
      ];
      await saveShoppingList(merged);
      setSnackbarVisible(true);
    } catch (e) {
      setError('Failed to sync shopping list.');
    } finally {
      setLoading(false);
    }
  };

  if (selectedPlan === 'diet-1') {
    // Full plan for Lean & Clean
    return (
      <Animated.View style={[styles.fullPlanContainer, { opacity: fadeAnim }]}> 
        <ScrollView contentContainerStyle={styles.fullPlanScroll}>
          {/* Video Modal */}
          <Modal
            visible={videoModal.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={closeVideo}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Video
                  source={{ uri: videoModal.url || '' }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  useNativeControls
                  style={styles.videoPlayer}
                />
                <IconButton
                  icon="close"
                  size={32}
                  style={styles.closeModalButton}
                  iconColor="#fff"
                  onPress={closeVideo}
                />
              </View>
            </View>
          </Modal>

          <Surface style={styles.fullPlanHeader} elevation={1}>
            <Image
              source={{ uri: dietPlans[0].imageUrl }}
              style={styles.fullPlanImage}
              resizeMode="cover"
            />
            <View style={styles.fullPlanHeaderText}>
              <Text variant="titleLarge" style={styles.fullPlanTitle}>Lean & Clean</Text>
              <Text variant="bodyMedium" style={styles.fullPlanSubtitle}>Clean eating program for sustainable weight loss and energy.</Text>
            </View>
          </Surface>

          <View style={styles.fullPlanStatsRow}>
            <View style={styles.fullPlanStat}><MaterialCommunityIcons name="calendar-range" size={20} color="#666" /><Text style={styles.fullPlanStatText}>60 days</Text></View>
            <View style={styles.fullPlanStat}><MaterialCommunityIcons name="fire" size={20} color="#666" /><Text style={styles.fullPlanStatText}>1800-2000 cal</Text></View>
            <View style={styles.fullPlanStat}><MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#666" /><Text style={styles.fullPlanStatText}>4 meals/day</Text></View>
            <View style={styles.fullPlanStat}><MaterialCommunityIcons name="leaf" size={20} color="#666" /><Text style={styles.fullPlanStatText}>Regular</Text></View>
          </View>

          <Divider style={{ marginVertical: 16 }} />

          {/* Weekly Overview */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Weekly Meal Plan Overview</Text>
          <View style={styles.weeklyOverview}>
            <Text style={styles.weeklyText}>Each week includes a rotating set of balanced meals, snacks, and hydration reminders. Recipes are easy to prep and repeat for consistency and habit-building.</Text>
          </View>

          <Divider style={{ marginVertical: 16 }} />

          {/* Daily Schedule with Recipes */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Sample Day with Recipes</Text>

          {/* Breakfast */}
          <Surface style={styles.recipeCard} elevation={2}>
            <View style={styles.recipeHeader}>
              <Text style={styles.mealEmoji}>🥣</Text>
              <Text style={styles.mealTitle}>Breakfast: Oatmeal with Berries</Text>
            </View>
            <TouchableOpacity style={styles.recipeVideoContainer} onPress={() => openVideo(sampleVideos.breakfast)}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=500&auto=format&fit=crop' }} style={styles.recipeVideo} />
              <View style={styles.playIconOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="#FFF" style={{ opacity: 0.85 }} />
              </View>
            </TouchableOpacity>
            <Text style={styles.recipeSectionTitle}>Ingredients</Text>
            <Text style={styles.recipeText}>{'- 1/2 cup rolled oats\n- 1 cup almond milk\n- 1/2 cup mixed berries\n- 1 tbsp chia seeds\n- 1 tsp honey (optional)'}</Text>
            <Text style={styles.recipeSectionTitle}>Steps</Text>
            <Text style={styles.recipeText}>{'1. Combine oats and almond milk in a pot. Bring to a simmer.\n2. Cook for 5-7 minutes, stirring occasionally.\n3. Top with berries, chia seeds, and honey.\n4. Enjoy warm!'}</Text>
            <Text style={styles.recipeSectionTitle}>Nutrition</Text>
            <Text style={styles.recipeText}>{'Approx. 320 kcal, 8g protein, 50g carbs, 8g fat'}</Text>
          </Surface>

          {/* Lunch */}
          <Surface style={styles.recipeCard} elevation={2}>
            <View style={styles.recipeHeader}>
              <Text style={styles.mealEmoji}>🥗</Text>
              <Text style={styles.mealTitle}>Lunch: Grilled Chicken Quinoa Salad</Text>
            </View>
            <TouchableOpacity style={styles.recipeVideoContainer} onPress={() => openVideo(sampleVideos.lunch)}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=500&auto=format&fit=crop' }} style={styles.recipeVideo} />
              <View style={styles.playIconOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="#FFF" style={{ opacity: 0.85 }} />
              </View>
            </TouchableOpacity>
            <Text style={styles.recipeSectionTitle}>Ingredients</Text>
            <Text style={styles.recipeText}>{'- 1 grilled chicken breast\n- 1 cup cooked quinoa\n- 2 cups spinach\n- 1/2 avocado, sliced\n- 1/4 cup cherry tomatoes\n- 1 tbsp olive oil\n- Lemon juice, salt, pepper'}</Text>
            <Text style={styles.recipeSectionTitle}>Steps</Text>
            <Text style={styles.recipeText}>{'1. Grill chicken breast and slice.\n2. Toss spinach, quinoa, tomatoes, and avocado in a bowl.\n3. Top with chicken, drizzle with olive oil and lemon juice.\n4. Season to taste and serve.'}</Text>
            <Text style={styles.recipeSectionTitle}>Nutrition</Text>
            <Text style={styles.recipeText}>{'Approx. 450 kcal, 35g protein, 40g carbs, 15g fat'}</Text>
          </Surface>

          {/* Snack */}
          <Surface style={styles.recipeCard} elevation={2}>
            <View style={styles.recipeHeader}>
              <Text style={styles.mealEmoji}>🍎</Text>
              <Text style={styles.mealTitle}>Snack: Apple Slices with Almond Butter</Text>
            </View>
            <TouchableOpacity style={styles.recipeVideoContainer} onPress={() => openVideo(sampleVideos.snack)}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?q=80&w=500&auto=format&fit=crop' }} style={styles.recipeVideo} />
              <View style={styles.playIconOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="#FFF" style={{ opacity: 0.85 }} />
              </View>
            </TouchableOpacity>
            <Text style={styles.recipeSectionTitle}>Ingredients</Text>
            <Text style={styles.recipeText}>{'- 1 apple, sliced\n- 2 tbsp almond butter'}</Text>
            <Text style={styles.recipeSectionTitle}>Steps</Text>
            <Text style={styles.recipeText}>{'1. Slice apple.\n2. Spread almond butter on slices or dip as desired.'}</Text>
            <Text style={styles.recipeSectionTitle}>Nutrition</Text>
            <Text style={styles.recipeText}>{'Approx. 180 kcal, 4g protein, 24g carbs, 8g fat'}</Text>
          </Surface>

          {/* Dinner */}
          <Surface style={styles.recipeCard} elevation={2}>
            <View style={styles.recipeHeader}>
              <Text style={styles.mealEmoji}>🍲</Text>
              <Text style={styles.mealTitle}>Dinner: Baked Salmon, Sweet Potato & Broccoli</Text>
            </View>
            <TouchableOpacity style={styles.recipeVideoContainer} onPress={() => openVideo(sampleVideos.dinner)}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=500&auto=format&fit=crop' }} style={styles.recipeVideo} />
              <View style={styles.playIconOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="#FFF" style={{ opacity: 0.85 }} />
              </View>
            </TouchableOpacity>
            <Text style={styles.recipeSectionTitle}>Ingredients</Text>
            <Text style={styles.recipeText}>{'- 1 salmon fillet\n- 1 small sweet potato\n- 1 cup broccoli florets\n- 1 tsp olive oil\n- Salt, pepper, lemon'}</Text>
            <Text style={styles.recipeSectionTitle}>Steps</Text>
            <Text style={styles.recipeText}>{'1. Bake salmon at 180°C (350°F) for 15-18 min.\n2. Roast sweet potato until tender.\n3. Steam broccoli.\n4. Serve with lemon, olive oil, salt, and pepper.'}</Text>
            <Text style={styles.recipeSectionTitle}>Nutrition</Text>
            <Text style={styles.recipeText}>{'Approx. 520 kcal, 38g protein, 45g carbs, 18g fat'}</Text>
          </Surface>

          {/* 7-Day Meal Schedule */}
          <Divider style={{ marginVertical: 16 }} />
          <Text variant="titleMedium" style={styles.sectionTitle}>7-Day Meal Schedule</Text>
          <View style={styles.mealTableWrapper}>
            <View style={styles.mealTableGrid}>
              <View style={[styles.mealTableRow, styles.mealTableHeaderRow]}>
                <Text style={[styles.mealTableHeader, styles.mealTableHeaderDay]}>Day</Text>
                <Text style={styles.mealTableHeader}>Breakfast</Text>
                <Text style={styles.mealTableHeader}>Lunch</Text>
                <Text style={styles.mealTableHeader}>Snack</Text>
                <Text style={styles.mealTableHeader}>Dinner</Text>
              </View>
              {[
                ['Mon', 'Oatmeal & Berries', 'Chicken Quinoa Salad', 'Apple & Almond Butter', 'Salmon & Veggies'],
                ['Tue', 'Greek Yogurt & Granola', 'Turkey Wrap', 'Carrot Sticks & Hummus', 'Stir-fried Tofu & Rice'],
                ['Wed', 'Avocado Toast', 'Lentil Soup', 'Banana', 'Grilled Chicken & Sweet Potato'],
                ['Thu', 'Smoothie Bowl', 'Tuna Salad', 'Mixed Nuts', 'Baked Cod & Broccoli'],
                ['Fri', 'Egg Muffins', 'Quinoa Bowl', 'Orange', 'Shrimp & Brown Rice'],
                ['Sat', 'Oatmeal & Berries', 'Chicken Quinoa Salad', 'Apple & Almond Butter', 'Salmon & Veggies'],
                ['Sun', 'Pancakes (whole grain)', 'Veggie Wrap', 'Greek Yogurt', 'Roast Beef & Veggies'],
              ].map((row, i) => (
                <View key={i} style={[styles.mealTableRow, i % 2 === 0 && styles.mealTableRowAlt]}> 
                  {row.map((cell, j) => (
                    <View key={j} style={[styles.mealTableCell, j === 0 && styles.mealTableCellDay, {borderRightWidth: j < 4 ? 1 : 0}]}> 
                      <Text style={styles.mealTableCellText}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Weekly Shopping List */}
          <Divider style={{ marginVertical: 16 }} />
          <Text variant="titleMedium" style={styles.sectionTitle}>Weekly Shopping List</Text>
          <View style={styles.shoppingListContext}>
            <Text style={styles.shoppingListHowToTitle}>How to Use This List</Text>
            <Text style={styles.shoppingListHowToText}>
              Use this list to shop for the week. Most items will last for several days and can be used in multiple meals. Check your pantry before shopping to avoid duplicates. For best results, batch prep proteins and grains at the start of the week.
            </Text>
          </View>
          <View style={styles.shoppingListGrid}>
            {/* Produce */}
            <View style={styles.shoppingListCategory}>
              <View style={styles.shoppingListCategoryHeader}>
                <MaterialCommunityIcons name="food-apple" size={22} color="#4CAF50" />
                <Text style={styles.shoppingListCategoryTitle}>Produce</Text>
              </View>
              {['Spinach', 'Avocado', 'Berries', 'Sweet potato', 'Broccoli', 'Tomatoes', 'Carrots', 'Bananas', 'Oranges'].map((item, i) => (
                <View key={i} style={styles.shoppingListItemRow}>
                  <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={16} color="#B2DFDB" />
                  <Text style={styles.shoppingListItemText}>{item}</Text>
                </View>
              ))}
            </View>
            {/* Proteins */}
            <View style={styles.shoppingListCategory}>
              <View style={styles.shoppingListCategoryHeader}>
                <MaterialCommunityIcons name="food-drumstick" size={22} color="#FF9800" />
                <Text style={styles.shoppingListCategoryTitle}>Proteins</Text>
              </View>
              {['Chicken breast', 'Salmon', 'Eggs', 'Greek yogurt', 'Tuna', 'Shrimp', 'Tofu', 'Lentils'].map((item, i) => (
                <View key={i} style={styles.shoppingListItemRow}>
                  <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={16} color="#FFE0B2" />
                  <Text style={styles.shoppingListItemText}>{item}</Text>
                </View>
              ))}
            </View>
            {/* Grains & Others */}
            <View style={styles.shoppingListCategory}>
              <View style={styles.shoppingListCategoryHeader}>
                <MaterialCommunityIcons name="bread-slice" size={22} color="#8D6E63" />
                <Text style={styles.shoppingListCategoryTitle}>Grains & Others</Text>
              </View>
              {['Oats', 'Quinoa', 'Brown rice', 'Whole grain bread', 'Granola', 'Almond milk', 'Olive oil', 'Mixed nuts', 'Almond butter', 'Hummus'].map((item, i) => (
                <View key={i} style={styles.shoppingListItemRow}>
                  <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={16} color="#D7CCC8" />
                  <Text style={styles.shoppingListItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.shoppingListContext}>
            <Text style={styles.shoppingListHowToTitle}>Storage Tips</Text>
            <Text style={styles.shoppingListHowToText}>
              • Store leafy greens and herbs in airtight containers with a paper towel to keep them fresh longer.\n• Keep proteins refrigerated and use within 3-4 days.\n• Grains and nuts should be stored in cool, dry places.
            </Text>
            <Text style={styles.shoppingListHowToTitle}>Batch Prep Suggestions</Text>
            <Text style={styles.shoppingListHowToText}>
              • Cook a large batch of quinoa, rice, or sweet potatoes at the start of the week.\n• Grill or bake several chicken breasts or tofu portions for easy lunches.\n• Pre-chop veggies and store in containers for quick meal assembly.
            </Text>
          </View>
          <Button
            mode="contained"
            style={styles.sendToDiaryButton}
            buttonColor="#006A6A"
            textColor="white"
            onPress={handleSendToDiary}
            icon="cart-arrow-down"
            loading={loading}
            disabled={loading}
          >
            Send to My Shopping List
          </Button>
          {error ? (
            <Text style={{ color: 'red', textAlign: 'center', marginTop: 4 }}>{error}</Text>
          ) : null}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={2000}
            style={{ backgroundColor: '#006A6A' }}
          >
            Shopping list sent to Diary!
          </Snackbar>

          {/* Habit-Building & Progress Tracking */}
          <Divider style={{ marginVertical: 16 }} />
          <Text variant="titleMedium" style={styles.sectionTitle}>Habit-Building & Progress Tracking</Text>
          <View style={styles.habitSection}>
            <Text style={styles.habitText}>• Use a food diary or app to log your meals and snacks daily.</Text>
            <Text style={styles.habitText}>• Set small, achievable goals each week (e.g., 5 servings of veggies/day).</Text>
            <Text style={styles.habitText}>• Track your water intake and physical activity.</Text>
            <Text style={styles.habitText}>• Celebrate milestones (e.g., 7 days of consistent eating) with a non-food reward.</Text>
            <Text style={styles.habitText}>• Reflect weekly on what worked and what to improve for the next week.</Text>
          </View>

          <Divider style={{ marginVertical: 16 }} />

          {/* Features & Tips */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureList}>
            {dietPlans[0].features.map((feature, i) => (
              <View key={i} style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <Divider style={{ marginVertical: 16 }} />

          <Text variant="titleMedium" style={styles.sectionTitle}>Nutrition Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipRow}><Text style={styles.tipEmoji}>💧</Text><Text style={styles.tipText}>Stay hydrated: aim for 2-2.5L water daily</Text></View>
            <View style={styles.tipRow}><Text style={styles.tipEmoji}>🥦</Text><Text style={styles.tipText}>Fill half your plate with vegetables</Text></View>
            <View style={styles.tipRow}><Text style={styles.tipEmoji}>🍗</Text><Text style={styles.tipText}>Choose lean proteins (chicken, fish, tofu)</Text></View>
            <View style={styles.tipRow}><Text style={styles.tipEmoji}>🍚</Text><Text style={styles.tipText}>Opt for whole grains over refined carbs</Text></View>
            <View style={styles.tipRow}><Text style={styles.tipEmoji}>🕒</Text><Text style={styles.tipText}>Eat at regular times to support metabolism</Text></View>
          </View>

          <Button
            mode="outlined"
            style={styles.backButton}
            textColor="#006A6A"
            onPress={() => setSelectedPlan(null)}
          >
            Back to Plans
          </Button>
        </ScrollView>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <MaterialCommunityIcons name="food-apple" size={24} color="#FF9800" />
        <View style={styles.headerText}>
          <Text variant="titleLarge" style={styles.title}>Diet Plans</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Curated meal plans for your nutrition goals</Text>
        </View>
      </Surface>

      <View style={styles.plansContainer}>
        {dietPlans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <Surface style={styles.cardContent} elevation={1}>
              <Image
                source={{ uri: plan.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardBody}>
                <Text variant="titleMedium" style={styles.planTitle}>{plan.title}</Text>
                <Text variant="bodyMedium" style={styles.planDescription}>{plan.description}</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="calendar-range" size={20} color="#666" />
                    <Text variant="bodyMedium" style={styles.statText}>{plan.duration}</Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="fire" size={20} color="#666" />
                    <Text variant="bodyMedium" style={styles.statText}>{plan.calories} cal</Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#666" />
                    <Text variant="bodyMedium" style={styles.statText}>{plan.mealsPerDay} meals/day</Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="leaf" size={20} color="#666" />
                    <Text variant="bodyMedium" style={styles.statText}>{plan.dietType}</Text>
                  </View>
                </View>
                <View style={styles.featureList}>
                  {plan.features.map((feature, i) => (
                    <View key={i} style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                      <Text variant="bodyMedium" style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  mode="contained"
                  style={styles.button}
                  buttonColor="#006A6A"
                  textColor="white"
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  View Plan
                </Button>
              </View>
            </Surface>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  subtitle: {
    color: '#666666',
  },
  plansContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardBody: {
    padding: 16,
  },
  planTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginBottom: 8,
  },
  planDescription: {
    color: '#666666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#666666',
    fontSize: 13,
  },
  featureList: {
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#333333',
    fontSize: 14,
  },
  button: {
    borderRadius: 8,
  },
  fullPlanContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  fullPlanScroll: {
    paddingBottom: 32,
  },
  fullPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  fullPlanImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  fullPlanHeaderText: {
    flex: 1,
  },
  fullPlanTitle: {
    color: '#006A6A',
    fontWeight: '700',
    marginBottom: 4,
  },
  fullPlanSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  fullPlanStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  fullPlanStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fullPlanStatText: {
    color: '#666',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  mealSchedule: {
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  mealEmoji: {
    fontSize: 28,
    marginRight: 4,
  },
  mealTitle: {
    fontWeight: '600',
    color: '#333',
  },
  mealDesc: {
    color: '#666',
    fontSize: 13,
  },
  tipsList: {
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipEmoji: {
    fontSize: 22,
  },
  tipText: {
    color: '#333',
    fontSize: 14,
  },
  backButton: {
    borderColor: '#006A6A',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  weeklyOverview: {
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  weeklyText: {
    color: '#666',
    fontSize: 14,
  },
  recipeCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  recipeVideoContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  playIconOverlay: {
    position: 'absolute',
    top: '40%',
    left: '45%',
    zIndex: 2,
  },
  recipeSectionTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  recipeText: {
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: 320,
    backgroundColor: '#222',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: 260,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  closeModalButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  mealTableWrapper: {
    marginHorizontal: 8,
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mealTableGrid: {
    flexDirection: 'column',
    width: '100%',
  },
  mealTableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 40,
  },
  mealTableHeaderRow: {
    backgroundColor: '#E0F2F1',
    borderBottomWidth: 1,
    borderBottomColor: '#B2DFDB',
  },
  mealTableRowAlt: {
    backgroundColor: '#F0F0F0',
  },
  mealTableHeader: {
    flex: 2,
    fontWeight: '700',
    color: '#006A6A',
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 8,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  mealTableHeaderDay: {
    flex: 1.2,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  mealTableCell: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRightColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minWidth: 70,
    maxWidth: 120,
  },
  mealTableCellDay: {
    flex: 1.2,
    backgroundColor: '#E0F2F1',
  },
  mealTableCellText: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  shoppingListContext: {
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 4,
  },
  shoppingListHowToTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
    fontSize: 15,
  },
  shoppingListHowToText: {
    color: '#333',
    fontSize: 14,
    marginBottom: 2,
  },
  shoppingListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginBottom: 8,
    gap: 0,
  },
  shoppingListCategory: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    marginBottom: 12,
    minWidth: 140,
    maxWidth: 260,
    alignItems: 'stretch',
    elevation: 1,
  },
  shoppingListCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  shoppingListCategoryTitle: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'left',
  },
  shoppingListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  shoppingListItemText: {
    color: '#333',
    fontSize: 15,
    flex: 1,
    textAlign: 'left',
    marginLeft: 10,
  },
  habitSection: {
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  habitText: {
    color: '#333',
    fontSize: 14,
  },
  sendToDiaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
}); 