import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, ScrollView, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, IconButton, Button, Checkbox, useTheme, Divider, Chip } from 'react-native-paper';
import { getShoppingList, saveShoppingList } from '../../../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MD3Theme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

interface ShoppingItem {
  id?: string;
  name: string;
  checked: boolean;
}

interface ShoppingListProps {
  date: Date;
}

interface ShoppingListItemProps {
  item: ShoppingItem;
  theme: MD3Theme;
  animatingId: string | null;
  saving: boolean;
  onToggle: (idOrName: string) => void;
  onRemove: (idOrName: string) => void;
}

const CATEGORY_MAP: { [key: string]: { label: string; icon: string; color: string; keywords: string[] } } = {
  produce: {
    label: 'Produce',
    icon: 'food-apple',
    color: '#4CAF50',
    keywords: ['spinach', 'avocado', 'berries', 'sweet potato', 'broccoli', 'tomato', 'carrot', 'banana', 'orange', 'lettuce', 'fruit', 'vegetable', 'apple', 'grape', 'onion', 'pepper', 'cucumber', 'herb'],
  },
  proteins: {
    label: 'Proteins',
    icon: 'food-drumstick',
    color: '#FF9800',
    keywords: ['chicken', 'salmon', 'egg', 'yogurt', 'tuna', 'shrimp', 'tofu', 'lentil', 'beef', 'pork', 'turkey', 'fish', 'meat', 'protein', 'cheese'],
  },
  grains: {
    label: 'Grains & Others',
    icon: 'bread-slice',
    color: '#8D6E63',
    keywords: ['oat', 'quinoa', 'rice', 'bread', 'granola', 'milk', 'oil', 'nut', 'butter', 'hummus', 'pasta', 'cereal', 'cracker', 'grain', 'almond', 'olive', 'seed'],
  },
  other: {
    label: 'Other',
    icon: 'basket',
    color: '#607D8B',
    keywords: [],
  },
};

function categorizeItem(name: string): keyof typeof CATEGORY_MAP {
  const lower = name.toLowerCase();
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (key === 'other') continue;
    if (CATEGORY_MAP[key].keywords.some(k => lower.includes(k))) return key as keyof typeof CATEGORY_MAP;
  }
  return 'other';
}

const COMMON_ITEMS = [
  'Bananas', 'Eggs', 'Chicken breast', 'Spinach', 'Milk', 'Oats', 'Tomatoes', 'Greek yogurt', 'Rice', 'Almond butter',
  'Broccoli', 'Bread', 'Avocado', 'Carrots', 'Salmon', 'Quinoa', 'Cheese', 'Olive oil', 'Berries', 'Tofu', 'Hummus'
];

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({ item, theme, animatingId, saving, onToggle, onRemove }) => {
  const fadeAnim = useRef(new Animated.Value(item.checked ? 0.5 : 1)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: item.checked ? 0.5 : 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [item.checked]);
  return (
    <Animated.View
      key={item.id || item.name}
      style={{
        opacity: fadeAnim,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: item.checked ? '#F5F5F5' : 'transparent',
        borderRadius: 8,
        marginBottom: 2,
      }}
    >
      <Checkbox
        status={item.checked ? 'checked' : 'unchecked'}
        onPress={() => onToggle(item.id || item.name)}
        color={theme.colors.primary}
      />
      <Text style={[styles.itemText, item.checked && styles.checkedText]}>{item.name}</Text>
      <IconButton
        icon="delete-outline"
        size={24}
        onPress={() => onRemove(item.id || item.name)}
        style={styles.deleteButton}
        iconColor={theme.colors.error}
        disabled={saving}
      />
    </Animated.View>
  );
};

export const ShoppingList: React.FC<ShoppingListProps> = ({ date }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // Load shopping list from Supabase on mount
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchList = async () => {
        setLoading(true);
        setError('');
        try {
          const data = await getShoppingList();
          if (isActive) setItems(data || []);
        } catch (e) {
          if (isActive) setError('Failed to load shopping list.');
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchList();
      return () => { isActive = false; };
    }, [])
  );

  // Save to Supabase
  const syncToSupabase = async (newItems: ShoppingItem[]) => {
    setSaving(true);
    setError('');
    try {
      await saveShoppingList(newItems.map(({ name, checked }) => ({ name, checked })));
      setItems(newItems);
    } catch (e) {
      setError('Failed to sync shopping list.');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (input.trim()) {
      const newItems = [
        ...items,
        { name: input.trim(), checked: false },
      ];
      setInput('');
      syncToSupabase(newItems);
    }
  };

  const toggleItem = (idOrName: string) => {
    const newItems = items.map(item => {
      const match = item.id ? item.id === idOrName : item.name === idOrName;
      return match ? { ...item, checked: !item.checked } : item;
    });
    syncToSupabase(newItems);
  };

  const removeItem = (idOrName: string) => {
    const newItems = items.filter(item => {
      const match = item.id ? item.id === idOrName : item.name === idOrName;
      return !match;
    });
    syncToSupabase(newItems);
  };

  const clearChecked = () => {
    const newItems = items.filter(item => !item.checked);
    syncToSupabase(newItems);
  };

  // Group items by category, checked at bottom
  const grouped = useMemo(() => {
    const groups: { [key in keyof typeof CATEGORY_MAP]: ShoppingItem[] } = {
      produce: [], proteins: [], grains: [], other: []
    };
    items.forEach(item => {
      const cat = categorizeItem(item.name);
      groups[cat].push(item);
    });
    // Sort: unchecked first, then checked
    for (const key in groups) {
      groups[key as keyof typeof CATEGORY_MAP] = [
        ...groups[key as keyof typeof CATEGORY_MAP].filter(i => !i.checked),
        ...groups[key as keyof typeof CATEGORY_MAP].filter(i => i.checked),
      ];
    }
    return groups;
  }, [items]);

  // Animate check/uncheck
  const handleToggleItem = (idOrName: string) => {
    setAnimatingId(idOrName);
    setTimeout(() => {
      setAnimatingId(null);
    }, 350);
    toggleItem(idOrName);
  };

  // Animate removal
  const handleRemoveItem = (idOrName: string) => {
    setAnimatingId(idOrName);
    setTimeout(() => {
      setAnimatingId(null);
      removeItem(idOrName);
    }, 350);
  };

  // Add quick-add chip
  const handleQuickAdd = (name: string) => {
    if (!items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      setInput(name);
      setTimeout(addItem, 100); // Add after input updates
    }
  };

  // Mark all as bought in a category
  const markAllAsBought = (catKey: keyof typeof CATEGORY_MAP) => {
    const newItems = items.map(item => {
      const cat = categorizeItem(item.name);
      if (cat === catKey) return { ...item, checked: true };
      return item;
    });
    syncToSupabase(newItems);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={styles.title}>Shopping List</Text>
          <IconButton icon="cart-outline" size={24} iconColor={theme.colors.primary} />
        </View>
        <View style={{ paddingBottom: 0 }}>
          {/* Quick Add Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAddRow}>
            {COMMON_ITEMS.map(item => (
              <Chip
                key={item}
                style={styles.chip}
                onPress={() => handleQuickAdd(item)}
                disabled={saving || items.some(i => i.name.toLowerCase() === item.toLowerCase())}
              >
                {item}
              </Chip>
            ))}
          </ScrollView>
          {/* Sticky Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add item..."
              value={input}
              onChangeText={setInput}
              onSubmitEditing={addItem}
              returnKeyType="done"
              editable={!saving}
            />
            <Button mode="contained" onPress={addItem} style={styles.addButton} loading={saving} disabled={saving}>
              Add
            </Button>
          </View>
          <Button
            mode="text"
            onPress={clearChecked}
            style={styles.clearButton}
            textColor="#B00020"
            disabled={saving || items.every(i => !i.checked)}
          >
            Clear All Checked
          </Button>
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginVertical: 32 }} />
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginVertical: 16 }}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cart-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyText}>Your shopping list is empty. Add items above!</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{}}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {Object.entries(CATEGORY_MAP).map(([key, cat]) =>
              grouped[key as keyof typeof CATEGORY_MAP].length > 0 && (
                <View key={key} style={styles.categoryCard}>
                  <View style={styles.categoryHeaderRow}>
                    <IconButton icon={cat.icon} size={22} iconColor={cat.color} style={styles.categoryIcon} />
                    <Text style={styles.categoryTitle}>{cat.label}</Text>
                    <Button
                      mode="text"
                      onPress={() => markAllAsBought(key as keyof typeof CATEGORY_MAP)}
                      textColor="#4CAF50"
                      style={styles.markAllButton}
                      disabled={saving || grouped[key as keyof typeof CATEGORY_MAP].every(i => i.checked)}
                    >
                      Mark all as bought
                    </Button>
                  </View>
                  {grouped[key as keyof typeof CATEGORY_MAP].map(item => (
                    <ShoppingListItem
                      key={item.id || item.name}
                      item={item}
                      theme={theme}
                      animatingId={animatingId}
                      saving={saving}
                      onToggle={handleToggleItem}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </View>
              )
            )}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    marginHorizontal: 8,
    borderRadius: 18,
    overflow: 'hidden',
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    paddingBottom: 0,
  },
  title: {
    fontWeight: '700',
    color: '#006A6A',
    fontSize: 20,
  },
  quickAddRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: 2,
    minHeight: 36,
  },
  chip: {
    marginRight: 6,
    marginBottom: 2,
    backgroundColor: '#E7F5F5',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  addButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginLeft: 4,
  },
  clearButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -8,
  },
  categoryCard: {
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: 'transparent',
    padding: 10,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  categoryIcon: {
    marginRight: 2,
    marginLeft: -8,
  },
  categoryTitle: {
    fontWeight: '600',
    fontSize: 17,
    color: '#222',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flex: 1,
  },
  markAllButton: {
    alignSelf: 'flex-end',
    marginLeft: 8,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  checkbox: {
    marginRight: 0,
  },
  itemText: {
    flex: 1,
    fontSize: 17,
    color: '#222',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginLeft: 2,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  deleteButton: {
    marginLeft: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 17,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
}); 