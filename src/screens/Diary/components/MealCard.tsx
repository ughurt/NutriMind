import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, IconButton, Menu } from 'react-native-paper';
import { Meal } from '../../../hooks/useMeals';

interface Props {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDelete: (id: string) => void;
}

export const MealCard = ({ meal, onEdit, onDelete }: Props) => {
  const [menuVisible, setMenuVisible] = React.useState(false);

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">{meal.name}</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              onEdit(meal);
            }} 
            title="Edit"
            leadingIcon="pencil"
          />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              onDelete(meal.id);
            }} 
            title="Delete"
            leadingIcon="delete"
          />
        </Menu>
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
}); 