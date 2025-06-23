import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton } from 'react-native-paper';
import { Meal } from '../../../hooks/useMeals';

interface Props {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDelete: (id: string) => void;
}

export const MealCard = ({ meal, onEdit, onDelete }: Props) => {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const anchorRef = React.useRef<View>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!menuVisible) return;
    const handlePress = (e: any) => {
      setMenuVisible(false);
    };
    // Add a global touch listener
    const sub = () => {
      setMenuVisible(false);
      return true;
    };
    if (menuVisible) {
      // Only add on menu open
      // @ts-ignore
      const subscription = globalThis.addEventListener ? globalThis.addEventListener('touchstart', handlePress) : null;
      return () => {
        if (subscription && globalThis.removeEventListener) globalThis.removeEventListener('touchstart', handlePress);
      };
    }
  }, [menuVisible]);

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">{meal.name}</Text>
        <View ref={anchorRef} style={{ position: 'relative' }}>
            <IconButton
              icon="dots-vertical"
            onPress={() => setMenuVisible(v => !v)}
            />
          {menuVisible && (
            <View style={styles.inlineMenu}>
              <TouchableOpacity
                style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              onEdit(meal);
            }} 
              >
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              onDelete(meal.id);
            }} 
              >
                <Text style={styles.menuItemText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.nutritionInfo}>
        <View style={styles.nutritionItem}>
          <Text variant="bodyLarge">{meal.calories}</Text>
          <Text variant="bodySmall">calories</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text variant="bodyLarge">{meal.protein || 0}g</Text>
          <Text variant="bodySmall">protein</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text variant="bodyLarge">{meal.carbs || 0}g</Text>
          <Text variant="bodySmall">carbs</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text variant="bodyLarge">{meal.fat || 0}g</Text>
          <Text variant="bodySmall">fat</Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  inlineMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    minWidth: 120,
    zIndex: 10,
    paddingVertical: 4,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
}); 