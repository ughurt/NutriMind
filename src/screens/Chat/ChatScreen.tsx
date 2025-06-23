import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Image, Alert, Animated } from 'react-native';
import { Text, TextInput, IconButton, Surface, ActivityIndicator, Chip, Avatar, useTheme, Portal, Modal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { aiService } from '../../services/aiService';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { addMeal } from '../../services/supabase';
import { format } from 'date-fns';
import { ScannedMealDetails } from './components/ScannedMealDetails';

// Define types
type MessageRole = 'assistant' | 'user' | 'system';
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime?: string;
  difficulty: string;
  servings?: number;
  dietaryInfo?: string[];
  tips?: string[];
  variations?: string[];
  nutritionalHighlights?: string[];
  allergens?: string[];
  storageInfo?: string;
}

interface MealData {
  name: string;
  meal_type: MealType;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
}

type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  category?: 'nutrition' | 'meal-plan' | 'workout' | 'general';
}

interface IngredientCategories {
  [category: string]: string[];
}

interface Ingredient {
  name: string;
  category?: string;
  amount?: string;
  unit?: string;
}

const QUICK_ACTIONS = [
  { label: 'Meal Plan', icon: 'food-fork-drink', category: 'meal-plan' },
  { label: 'Nutrition Tips', icon: 'food-apple', category: 'nutrition' },
  { label: 'Workout Tips', icon: 'dumbbell', category: 'workout' },
  { label: 'General Help', icon: 'help-circle', category: 'general' },
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: 'coffee' as IconName },
  { value: 'lunch', label: 'Lunch', icon: 'food' as IconName },
  { value: 'dinner', label: 'Dinner', icon: 'food-turkey' as IconName },
  { value: 'snack', label: 'Snack', icon: 'cookie' as IconName },
] as const;

const MEAL_CATEGORIES = {
  DIETARY: ['gluten-free', 'vegetarian', 'vegan', 'keto', 'paleo', 'dairy-free', 'low-carb', 'high-protein', 'low-fat'],
  CUISINE: ['italian', 'asian', 'mexican', 'mediterranean', 'indian', 'japanese', 'thai', 'french', 'spanish', 'middle-eastern'],
  DIFFICULTY: ['simple', 'intermediate', 'advanced'],
  TIME: ['quick', '30-minutes', 'meal-prep', 'under-15', 'slow-cook', 'weekend'],
  MAIN_INGREDIENTS: [
    // Proteins
    'chicken', 'beef', 'fish', 'pork', 'tofu', 'eggs', 'legumes', 'shrimp', 'salmon', 'tuna',
    'turkey', 'lamb', 'chickpeas', 'lentils', 'beans', 'tempeh', 'seitan',
    // Vegetarian Mains
    'mushrooms', 'eggplant', 'cauliflower', 'sweet potato', 'quinoa'
  ],
  COOKING_METHOD: [
    'grilled', 'baked', 'stir-fried', 'roasted', 'steamed', 'slow-cooked',
    'air-fried', 'pressure-cooked', 'sautéed', 'broiled', 'poached', 'raw'
  ],
  MEAL_OCCASION: ['weekday', 'weekend', 'special occasion', 'meal-prep', 'quick lunch', 'light dinner']
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContentContainer: {
    padding: 12,
    paddingTop: 8,
    flexGrow: 1, // Allow content to grow
  },
  scannedMealContent: {
    paddingBottom: 100, // Adjust this value as needed to prevent content from being hidden by the input area
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    marginLeft: 64,
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
    marginRight: 64,
  },
  avatar: {
    marginRight: 8,
    backgroundColor: '#10a37f',
    borderRadius: 4,
  },
  botMessage: {
    padding: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    elevation: 0,
    shadowColor: 'transparent',
  },
  userMessage: {
    backgroundColor: '#f4f4f5',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: '100%',
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    ...Platform.select({
      ios: {
        fontFamily: '-apple-system',
      },
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  userMessageText: {
    color: '#1a1a1a',
    fontWeight: '400',
  },
  aiMessageText: {
    color: '#1a1a1a',
    fontWeight: '400',
  },
  botMessageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingLeft: 12,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    gap: 6,
  },
  typingText: {
    color: '#6b6b6b',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  messageActions: {
    marginTop: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  mealTypeChip: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedMealTypeChip: {
    backgroundColor: '#E7F5F5',
    borderColor: '#006A6A',
  },
  confirmButton: {
    borderRadius: 20,
    backgroundColor: '#006A6A',
    flex: 1,
    maxWidth: 120,
    height: 40,
    justifyContent: 'center',
  },
  cancelButton: {
    borderRadius: 20,
    borderColor: '#006A6A',
    flex: 1,
    maxWidth: 120,
    height: 40,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.25,
    textAlign: 'center',
    marginTop: 4,
    paddingBottom: 2,
  },
  timestamp: {
    display: 'none', // Hide timestamps to match ChatGPT design
  },
  quickActions: {
    marginBottom: 6,
  },
  quickActionsContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  quickActionChip: {
    backgroundColor: '#f5f5f5',
    marginRight: 6,
    height: 32,
  },
  selectedQuickActionChip: {
    backgroundColor: '#E7F5F5',
  },
  quickActionText: {
    color: '#666',
    fontSize: 14,
  },
  selectedQuickActionText: {
    color: '#006A6A',
    fontWeight: '600',
  },
  cameraButton: {
    margin: 0,
    marginRight: 8,
  },
  inputContainer: {
    backgroundColor: '#f4f4f5',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 0,
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 4 : 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    maxHeight: 80,
    minHeight: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeGradient: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f4f4f5',
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#1a1a1a',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '400',
  },
  responseContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    width: '100%',
    paddingHorizontal: 8,
  },
  actionButton: {
    minWidth: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 44,
  },
  headerLeft: {
    width: 32,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: {
    width: 32,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginTop: 2,
  },
  closeButton: {
    margin: 0,
  },
  infoButton: {
    margin: 0,
  },
  summaryContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export const ChatScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [suggestedMeal, setSuggestedMeal] = useState<MealData | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Add welcome message
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: "Hi! I'm your AI nutrition assistant. I can help you with meal planning, nutrition advice, workout tips, and more. What would you like to know?",
        isUser: false,
        timestamp: new Date(),
        category: 'general',
      };
      setMessages([welcomeMessage]);
    }

    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const formatMealPlanResponse = (response: MealSuggestion) => {
    if (typeof response === 'string') return response;

    const sections: string[] = [];
    const { 
      name, description, calories, protein, carbs, fat, 
      ingredients, instructions, prepTime, cookTime, 
      difficulty, servings, dietaryInfo, tips, variations,
      nutritionalHighlights, allergens, storageInfo 
    } = response;

    // Title and Description
    sections.push(`🍽️ ${name.toUpperCase()}`);
    if (description) sections.push(`\n${description}`);

    // Quick Info Section with more details
    sections.push('\n⚡ Quick Info');
    const quickInfo = [
      prepTime && `⏱️ Prep: ${prepTime}`,
      cookTime && `🔥 Cook: ${cookTime}`,
      difficulty && `📊 Level: ${difficulty}`,
      `👥 Portion: ${calculateServingSize(calories)}`,
      calories && `⚖️ Size: ${calculatePortionSize(calories)}`
    ].filter(Boolean);
    sections.push(quickInfo.join('\n'));

    // Main Ingredients Highlight with categories
    if (ingredients?.length > 0) {
      const mainIngredients = ingredients.filter((ing: string) => 
        MEAL_CATEGORIES.MAIN_INGREDIENTS.some(main => 
          ing.toLowerCase().includes(main.toLowerCase())
        )
      );
      
      if (mainIngredients.length > 0) {
        sections.push('\n🌟 Main Ingredients');
        // Group by protein/vegetarian
        const proteinMains = mainIngredients.filter(ing => 
          ['chicken', 'beef', 'fish', 'pork', 'shrimp', 'salmon', 'tuna', 'turkey', 'lamb'].some(p => 
            ing.toLowerCase().includes(p)
          )
        );
        const plantMains = mainIngredients.filter(ing => 
          ['tofu', 'tempeh', 'seitan', 'mushrooms', 'eggplant', 'cauliflower', 'chickpeas', 'lentils', 'beans'].some(p => 
            ing.toLowerCase().includes(p)
          )
        );
        
        if (proteinMains.length > 0) {
          sections.push('Proteins:');
          proteinMains.forEach(ing => sections.push(`• ${ing}`));
        }
        if (plantMains.length > 0) {
          sections.push('Plant-based:');
          plantMains.forEach(ing => sections.push(`• ${ing}`));
        }
      }
    }

    // Nutrition Section with enhanced details
    if (calories || protein || carbs || fat) {
      sections.push('\n📊 Nutrition per Serving');
      const totalMacros = protein + carbs + fat;
      if (calories) {
        const mealSize = categorizeMealSize(calories);
        sections.push(`🔸 Calories: ${calories} kcal (${mealSize})`);
      }
      if (protein) sections.push(`🔸 Protein: ${protein}g (${Math.round(protein/totalMacros*100)}%) - ${categorizeProteinContent(protein)}`);
      if (carbs) sections.push(`🔸 Carbs: ${carbs}g (${Math.round(carbs/totalMacros*100)}%) - ${categorizeCarbContent(carbs)}`);
      if (fat) sections.push(`🔸 Fat: ${fat}g (${Math.round(fat/totalMacros*100)}%) - ${categorizeFatContent(fat)}`);
    }

    // Dietary Tags and Allergens Combined
    const dietarySection: string[] = [];
    if (dietaryInfo && dietaryInfo.length > 0) {
      dietarySection.push(...dietaryInfo.map((info: string) => `✅ ${info}`));
    }
    if (allergens && allergens.length > 0) {
      dietarySection.push(...allergens.map((allergen: string) => `⚠️ Contains ${allergen}`));
    }
    if (dietarySection.length > 0) {
      sections.push('\n🏷️ Dietary Information');
      sections.push(dietarySection.join('\n'));
    }

    // Ingredients with Better Categorization
    if (ingredients?.length > 0) {
      sections.push('\n🥗 Ingredients');
      const categorizedIngredients = ingredients.reduce((acc: any, ingredient: string) => {
        let category = 'Main';
        
        // Check for explicit category in parentheses
        const categoryMatch = ingredient.match(/\((.*?)\)/);
        if (categoryMatch) {
          category = categoryMatch[1];
        } else {
          // Auto-categorize based on common ingredients
          if (/sauce|oil|vinegar|dressing/i.test(ingredient)) category = 'Sauces & Oils';
          else if (/spice|pepper|salt|herb/i.test(ingredient)) category = 'Seasonings';
          else if (/onion|garlic|ginger|celery|carrot/i.test(ingredient)) category = 'Aromatics';
          else if (/rice|pasta|bread|quinoa/i.test(ingredient)) category = 'Grains';
          else if (/spinach|lettuce|kale|cabbage/i.test(ingredient)) category = 'Greens';
        }
        
        if (!acc[category]) acc[category] = [];
        acc[category].push(ingredient.replace(/\(.*?\)/, '').trim());
        return acc;
      }, {});

      // Ensure Main ingredients are listed first
      const orderedCategories = ['Main', 'Aromatics', 'Seasonings', 'Sauces & Oils', 'Grains', 'Greens'];
      orderedCategories.forEach(category => {
        if (categorizedIngredients[category]) {
          sections.push(`\n${category}:`);
          categorizedIngredients[category].forEach((item: string) => 
            sections.push(`• ${item}`)
          );
          delete categorizedIngredients[category];
        }
      });

      // Add any remaining categories
      Object.entries(categorizedIngredients).forEach(([category, items]: [string, any]) => {
        sections.push(`\n${category}:`);
        items.forEach((item: string) => sections.push(`• ${item}`));
      });
    }

    // Instructions with Estimated Times
    if (instructions?.length > 0) {
      sections.push('\n👩‍🍳 Instructions');
      instructions.forEach((instruction: string, index: number) => {
        const stepNumber = (index + 1).toString().padStart(2, '0');
        // Extract or estimate time if mentioned in the instruction
        const timeMatch = instruction.match(/(\d+)[-\s]?(?:minute|min|hour|hr)/i);
        const timeInfo = timeMatch ? ` (${timeMatch[0]})` : '';
        sections.push(`\n${stepNumber}. ${instruction}${timeInfo}`);
      });
    }

    // Cooking Tips and Variations
    const tipsSection: string[] = [];
    if (tips && tips.length > 0) {
      tipsSection.push('\n💡 Pro Tips');
      tips.forEach((tip: string) => tipsSection.push(`• ${tip}`));
    }
    if (variations && variations.length > 0) {
      tipsSection.push('\n🔄 Variations');
      variations.forEach((variation: string) => tipsSection.push(`• ${variation}`));
    }
    if (tipsSection.length > 0) {
      sections.push(tipsSection.join('\n'));
    }

    // Storage and Meal Prep
    if (storageInfo) {
      sections.push('\n📦 Storage & Meal Prep');
      sections.push(storageInfo);
    }

    // Health Benefits with Icons
    if (nutritionalHighlights && nutritionalHighlights.length > 0) {
      sections.push('\n✨ Health Benefits');
      nutritionalHighlights.forEach((highlight: string) => {
        const icon = getHighlightIcon(highlight.toLowerCase());
        sections.push(`${icon} ${highlight}`);
      });
    }

    sections.push('\nWould you like me to add this meal to your diary?');
    return sections.join('\n');
  };

  const getHighlightIcon = (highlight: string): string => {
    const icons: Record<string, string> = {
      protein: '💪',
      fiber: '🌾',
      vitamin: '🍊',
      mineral: '🔋',
      antioxidant: '🛡️',
      omega: '🐟',
      calcium: '🥛',
      iron: '⚡',
      default: '✨'
    };

    return Object.entries(icons).find(([key]) => highlight.includes(key))?.[1] || icons.default;
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
      category: selectedCategory as Message['category'] || 'general',
    };

    const conversationHistory = messages
      .slice(-4)
      .map(msg => ({
        role: msg.isUser ? 'user' as MessageRole : 'assistant' as MessageRole,
        content: msg.text
      }));

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      const response = await aiService.generateResponse(
        inputText,
        selectedCategory || undefined,
        conversationHistory
      );

      if (selectedCategory === 'meal-plan' && typeof response !== 'string') {
        const mealData: MealData = {
          name: response.name,
          meal_type: determineMealType(inputText),
          date: format(new Date(), 'yyyy-MM-dd'),
          calories: response.calories,
          protein: response.protein,
          carbs: response.carbs,
          fat: response.fat,
          serving_size: calculateServingSize(response.calories)
        };

        const formattedResponse = formatMealPlanResponse(response);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: formattedResponse,
          isUser: false,
          timestamp: new Date(),
          category: 'meal-plan',
        };

        setMessages(prev => [...prev, aiMessage]);
        setSuggestedMeal(mealData);
      } else {
        const formattedResponse = typeof response === 'string' ? response : formatMealPlanResponse(response);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: formattedResponse,
          isUser: false,
          timestamp: new Date(),
          category: selectedCategory as Message['category'] || 'general',
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        category: 'general',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleAddMealToDiary = async () => {
    if (!suggestedMeal) return;

    try {
      await addMeal({
        ...suggestedMeal,
        meal_type: selectedMealType
      });
      
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        text: `✅ Great! I've added the meal to your ${selectedMealType} diary.`,
        isUser: false,
        timestamp: new Date(),
        category: 'meal-plan',
      };
      
      setMessages(prev => [...prev, confirmationMessage]);
      setSuggestedMeal(null);
    } catch (error) {
      console.error('Error adding meal:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I couldn't add the meal to your diary. Please try again.",
        isUser: false,
        timestamp: new Date(),
        category: 'meal-plan',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleQuickAction = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // If the category is already selected, deselect it
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setInputText('');
    } else {
      // Select the new category
      setSelectedCategory(category);
      setInputText(`Tell me about ${category.toLowerCase()}...`);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Reset states before navigating
    setSelectedCategory(null);
    setInputText('');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0].uri) {
        setPhoto(result.assets[0].uri);
        setIsAnalyzing(true);
        
        // Add a placeholder message for analyzing
        const analyzingMessage: Message = {
          id: Date.now().toString(),
          text: '📸 Analyzing food photo...',
          isUser: true,
          timestamp: new Date(),
          category: 'nutrition',
        };
        setMessages(prev => [...prev, analyzingMessage]);

        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds

        const analyzeWithRetry = async () => {
        try {
          const response = await aiService.analyzeFoodPhoto(result.assets[0].uri);
          
          const mealData: MealData = {
              name: response.name || 'Scanned Meal',
              meal_type: 'lunch',
            date: format(new Date(), 'yyyy-MM-dd'),
              calories: response.calories || 0,
              protein: response.protein || 0,
              carbs: response.carbs || 0,
              fat: response.fat || 0,
              serving_size: response.servingSize || '1 serving'
          };

          setSuggestedMeal(mealData);
            setMessages(prev => prev.filter(msg => msg.id !== analyzingMessage.id));

          } catch (error: any) {
            if (error.status === 429 && retryCount < maxRetries) {
              retryCount++;
              // Update the analyzing message to show retry status
              setMessages(prev => prev.map(msg => 
                msg.id === analyzingMessage.id 
                  ? { ...msg, text: `📸 Analyzing food photo... (Retry ${retryCount}/${maxRetries})` }
                  : msg
              ));
              
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return analyzeWithRetry();
            }
            
            // If we've exhausted retries or it's a different error
            console.error('Error analyzing photo:', error);
            const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
              text: error.status === 429 
                ? '🚫 Too many requests. Please wait a moment before trying again.'
                : '🚫 Sorry, I couldn\'t analyze the food in the photo.',
            isUser: false,
            timestamp: new Date(),
            category: 'nutrition',
            };
            setMessages(prev => [...prev.filter(msg => msg.id !== analyzingMessage.id), errorMessage]);
          }
          };
          
        await analyzeWithRetry();

      }
        } catch (error) {
      console.error('Error taking photo:', error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
        text: '🚫 Could not access camera or take photo.',
            isUser: false,
            timestamp: new Date(),
        category: 'general',
          };
          setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsAnalyzing(false);
      setPhoto(null);
    }
  };

  const handleSendQuery = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Generate meal suggestion
      const mealSuggestion = await aiService.generateResponse(query, 'meal-plan');
      
      if (typeof mealSuggestion === 'string') {
        setResponse(mealSuggestion);
        return;
      }

      // Create meal data from suggestion
      const mealData: MealData = {
        name: mealSuggestion.name,
        meal_type: determineMealType(query),
        date: format(new Date(), 'yyyy-MM-dd'),
        calories: mealSuggestion.calories,
        protein: mealSuggestion.protein,
        carbs: mealSuggestion.carbs,
        fat: mealSuggestion.fat,
        serving_size: '1 serving'
      };

      setSuggestedMeal(mealData);
      setResponse(`I suggest: ${mealData.name}\n\nThis meal contains:\n• ${mealData.calories} calories\n• ${mealData.protein}g protein\n• ${mealData.carbs}g carbs\n• ${mealData.fat}g fat\n\nWould you like me to add this to your meal diary?`);

    } catch (error) {
      console.error('Error generating meal suggestion:', error);
      setResponse('Sorry, I encountered an error while generating a meal suggestion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleAddMeal = useCallback(async () => {
    if (!suggestedMeal) return;

    try {
      await addMeal({
        ...suggestedMeal,
        meal_type: selectedMealType
      });
      Alert.alert(
        'Success',
        `Meal has been added to your ${selectedMealType} diary!`,
        [{ text: 'OK' }]
      );
      // Reset states
      setQuery('');
      setResponse(null);
      setSuggestedMeal(null);
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert(
        'Error',
        'Failed to add meal to diary. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [suggestedMeal, selectedMealType]);

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      {!message.isUser && (
        <Avatar.Icon
          size={28}
          icon="brain"
          style={styles.avatar}
        />
      )}
      <Surface
        style={[
          styles.messageBubble,
          message.isUser ? styles.userMessage : styles.aiMessage,
        ]}
        elevation={1}
      >
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : styles.aiMessageText,
        ]}>
          {message.text}
        </Text>
        {!message.isUser && suggestedMeal && message.text.includes('Would you like me to add this meal to your diary?') && (
          <View style={styles.messageActions}>
            <Text style={styles.sectionTitle}>Select meal type:</Text>
            <View style={styles.mealTypeSelector}>
              {MEAL_TYPES.map((type) => (
                <Chip
                  key={type.value}
                  selected={selectedMealType === type.value}
                  onPress={() => setSelectedMealType(type.value)}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={type.icon}
                      size={16}
                      color={selectedMealType === type.value ? '#006A6A' : '#666'}
                    />
                  )}
                  style={[
                    styles.mealTypeChip,
                    selectedMealType === type.value && styles.selectedMealTypeChip
                  ]}
                >
                  {type.label}
                </Chip>
              ))}
            </View>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleAddMealToDiary}
                style={styles.confirmButton}
                labelStyle={styles.buttonLabel}
              >
                Add
              </Button>
              <Button
                mode="outlined"
                onPress={() => setSuggestedMeal(null)}
                style={styles.cancelButton}
                labelStyle={styles.buttonLabel}
              >
                Cancel
              </Button>
            </View>
          </View>
        )}
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Surface>
    </View>
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nutrition':
        return 'food-apple';
      case 'meal-plan':
        return 'food';
      case 'workout':
        return 'dumbbell';
      default:
        return 'help-circle';
    }
  };

  const determineMealType = (query: string): MealType => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('breakfast')) return 'breakfast';
    if (lowerQuery.includes('dinner')) return 'dinner';
    if (lowerQuery.includes('snack')) return 'snack';
    return 'lunch'; // default
  };

  // Helper functions for enhanced meal details
  const calculatePortionSize = (calories: number): string => {
    if (calories < 300) return 'Small';
    if (calories < 600) return 'Medium';
    return 'Large';
  };

  const categorizeMealSize = (calories: number): string => {
    if (calories < 300) return 'Light meal';
    if (calories < 500) return 'Moderate meal';
    if (calories < 800) return 'Hearty meal';
    return 'Large meal';
  };

  const categorizeProteinContent = (protein: number): string => {
    if (protein < 15) return 'Low protein';
    if (protein < 30) return 'Moderate protein';
    return 'High protein';
  };

  const categorizeCarbContent = (carbs: number): string => {
    if (carbs < 20) return 'Low carb';
    if (carbs < 50) return 'Moderate carb';
    return 'High carb';
  };

  const categorizeFatContent = (fat: number): string => {
    if (fat < 10) return 'Low fat';
    if (fat < 20) return 'Moderate fat';
    return 'High fat';
  };

  const calculateServingSize = (calories: number): string => {
    // Default serving sizes based on calorie content
    if (calories < 300) return '1 small serving';
    if (calories < 600) return '1 regular serving';
    if (calories < 900) return '1 large serving';
    return '2 servings';
  };

  // Handle adding the suggested meal to the diary
  const handleAddToDiary = async (mealType: string) => {
    if (!suggestedMeal || !mealType) {
       console.error('No suggested meal data or meal type selected.');
       return;
    }

    setIsLoading(true); // Indicate loading while saving
    try {
      // Use the selected meal type from the ScannedMealDetails component
      const mealToSave = { ...suggestedMeal, meal_type: mealType };
      await addMeal(mealToSave);
      
      // Add a confirmation message to the chat
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        text: `✅ Added ${suggestedMeal.name} to your ${mealType} diary.`, // Use the name from suggestedMeal
        isUser: false,
        timestamp: new Date(),
        category: 'nutrition',
      };
      setMessages(prev => [...prev, confirmationMessage]);

      // Clear the suggested meal state
      setSuggestedMeal(null);

    } catch (error) {
      console.error('Error adding meal to diary:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '❌ Failed to add meal to diary. Please try again.',
        isUser: false,
        timestamp: new Date(),
        category: 'nutrition',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle canceling the suggested meal
  const handleCancelSuggestedMeal = () => {
    setSuggestedMeal(null);
    // Optionally add a message indicating cancellation
    const cancelMessage: Message = {
      id: Date.now().toString(),
      text: '❌ Meal analysis cancelled.',
      isUser: false,
      timestamp: new Date(),
      category: 'nutrition',
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          enabled
        >
          {/* Header */}
          <Surface style={styles.header} elevation={0}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={handleClose}
                  style={styles.closeButton}
                />
              </View>
              <View style={styles.headerCenter}>
                <MaterialCommunityIcons name="brain" size={22} color="#006A6A" />
                <Text style={styles.headerTitle}>AI Assistant</Text>
              </View>
              <View style={styles.headerRight}>
                <IconButton
                  icon="information"
                  size={24}
                  onPress={() => { /* TODO: Implement info modal */ }}
                  style={styles.infoButton}
                />
              </View>
            </View>
          </Surface>

          {/* Messages or Scanned Meal Details */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContentContainer,
              messages.length === 0 && !suggestedMeal && styles.emptyState,
            ]}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['#E7F5F5', '#006A6A10']}
                  style={styles.welcomeGradient}
                >
                  <MaterialCommunityIcons name="robot" size={40} color="#006A6A" />
                  <Text style={styles.emptyStateText}>
                    Hi! I'm your AI nutrition assistant. Ask me anything about nutrition, meal planning, or healthy eating!
                  </Text>
                </LinearGradient>
              </View>
            ) : (
               <>
                 {messages.map(renderMessage)}
                 {suggestedMeal && (
                   <View style={styles.summaryContainer}>
                     <ScannedMealDetails 
                       mealData={suggestedMeal}
                       onAddToDiary={handleAddToDiary}
                       onCancel={handleCancelSuggestedMeal}
                     />
                   </View>
                 )}
               </>
            )}
            {isTyping && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#006A6A" />
                <Text style={styles.typingText}>AI is typing...</Text>
              </View>
            )}
            {isLoading && messages.length > 0 && (
               <View style={styles.messageRow}>
                <Avatar.Text size={24} label="AI" style={styles.avatar} />
                <Surface style={styles.botMessage} elevation={1}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </Surface>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <Surface style={[styles.inputContainer, { backgroundColor: '#f4f4f5' }]} elevation={0}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickActions}
              contentContainerStyle={styles.quickActionsContent}
            >
              {QUICK_ACTIONS.map((action) => (
                <Chip
                  key={action.label}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={action.icon as any}
                      size={18}
                      color={selectedCategory === action.category ? '#006A6A' : '#666'}
                    />
                  )}
                  selected={selectedCategory === action.category}
                  onPress={() => handleQuickAction(action.category)}
                  style={[
                    styles.quickActionChip,
                    selectedCategory === action.category && styles.selectedQuickActionChip,
                  ]}
                  textStyle={[
                    styles.quickActionText,
                    selectedCategory === action.category && styles.selectedQuickActionText,
                  ]}
                >
                  {action.label}
                </Chip>
              ))}
            </ScrollView>

            <View style={styles.inputWrapper}>
              <IconButton
                icon="camera"
                size={24}
                onPress={handleTakePhoto}
                iconColor="#006A6A"
                style={styles.cameraButton}
              />
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message AI Assistant..."
                style={styles.input}
                multiline
                maxLength={500}
                right={
                  <TextInput.Icon
                    icon="send"
                    disabled={!inputText.trim() || isLoading}
                    onPress={handleSend}
                    color="#006A6A"
                  />
                }
              />
            </View>
          </Surface>

          {/* Response container for meal plan suggestions */}
          {response && !suggestedMeal && (
            <Surface style={styles.responseContainer} elevation={2}>
              <Text style={styles.responseText}>{response}</Text>
              {response.includes('Would you like me to add this meal to your diary?') && suggestedMeal && (
                <>
                  <View style={styles.mealTypeSelector}>
                    {MEAL_TYPES.map((type) => (
                      <Chip
                        key={type.value}
                        selected={selectedMealType === type.value}
                        onPress={() => setSelectedMealType(type.value)}
                        icon={() => (
                          <MaterialCommunityIcons
                            name={type.icon}
                            size={16}
                            color={selectedMealType === type.value ? '#006A6A' : '#666'}
                          />
                        )}
                        style={[
                          styles.mealTypeChip,
                          selectedMealType === type.value && styles.selectedMealTypeChip
                        ]}
                      >
                        {type.label}
                      </Chip>
                    ))}
                  </View>
                  <View style={styles.actionButtons}>
                    <Button
                      mode="contained"
                      onPress={handleAddMealToDiary}
                      style={styles.actionButton}
                    >
                      Add to Diary
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setResponse(null);
                      }}
                      style={styles.actionButton}
                    >
                      Cancel
                    </Button>
                  </View>
                </>
              )}
            </Surface>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
};

// ... existing code ...