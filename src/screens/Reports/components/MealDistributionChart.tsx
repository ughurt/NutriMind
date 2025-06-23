import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO, getHours } from 'date-fns';
import { Meal, MealType } from '../../../hooks/useMeals';

interface Props {
  meals: Meal[];
}

interface HourlyDistribution {
  [hour: number]: {
    calories: number;
    mealTypes: Set<MealType>;
    count: number;
  };
}

export const MealDistributionChart = ({ meals }: Props) => {
  // Group meals by hour
  const hourlyDistribution = meals.reduce((acc: HourlyDistribution, meal) => {
    // Assign default hours based on meal type
    let hour: number;
    switch (meal.meal_type) {
      case 'breakfast':
        hour = 8; // 8 AM
        break;
      case 'lunch':
        hour = 13; // 1 PM
        break;
      case 'dinner':
        hour = 19; // 7 PM
        break;
      case 'snack':
        hour = 15; // 3 PM
        break;
      default:
        hour = 12; // Default to noon
    }
    
    if (!acc[hour]) {
      acc[hour] = { calories: 0, mealTypes: new Set(), count: 0 };
    }
    acc[hour].calories += Number(meal.calories || 0);
    acc[hour].mealTypes.add(meal.meal_type);
    acc[hour].count += 1;
    return acc;
  }, {});

  console.log('Hourly Distribution:', hourlyDistribution);

  const maxCalories = Math.max(...Object.values(hourlyDistribution).map(h => h.calories));

  const timeBlocks = [
    { label: 'Morning', start: 5, end: 12, icon: 'weather-sunny' },
    { label: 'Afternoon', start: 12, end: 17, icon: 'weather-partly-cloudy' },
    { label: 'Evening', start: 17, end: 22, icon: 'weather-night' },
    { label: 'Night', start: 22, end: 5, icon: 'moon-waning-crescent' },
  ];

  const getMealTypeColor = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast': return '#FFB74D';
      case 'lunch': return '#4FC3F7';
      case 'dinner': return '#FF8A65';
      case 'snack': return '#B39DDB';
      default: return '#999999';
    }
  };

  const getBlockStats = (start: number, end: number) => {
    let totalCalories = 0;
    let mealTypes = new Set<MealType>();
    let totalMeals = 0;

    // Special handling for the night block that crosses midnight
    if (start > end) {
      // Handle hours from start to midnight (e.g., 22-24)
      for (let hour = start; hour < 24; hour++) {
        const hourData = hourlyDistribution[hour];
        if (hourData) {
          totalCalories += hourData.calories;
          hourData.mealTypes.forEach(type => mealTypes.add(type));
          totalMeals += hourData.count;
        }
      }
      // Handle hours from midnight to end (e.g., 0-5)
      for (let hour = 0; hour < end; hour++) {
        const hourData = hourlyDistribution[hour];
        if (hourData) {
          totalCalories += hourData.calories;
          hourData.mealTypes.forEach(type => mealTypes.add(type));
          totalMeals += hourData.count;
        }
      }
    } else {
      // Normal case for blocks that don't cross midnight
      for (let hour = start; hour < end; hour++) {
        const hourData = hourlyDistribution[hour];
        if (hourData) {
          totalCalories += hourData.calories;
          hourData.mealTypes.forEach(type => mealTypes.add(type));
          totalMeals += hourData.count;
        }
      }
    }

    const result = { totalCalories, mealTypes: Array.from(mealTypes), totalMeals };
    console.log(`Block stats for ${start}:00-${end}:00:`, result);
    return result;
  };

  const totalDayCalories = Object.values(hourlyDistribution)
    .reduce((sum, data) => sum + data.calories, 0);

  return (
    <Surface style={styles.mainCard}>
      <View style={styles.chartContainer}>
        {timeBlocks.map((block, index) => {
          const stats = getBlockStats(block.start, block.end);
          const percentage = totalDayCalories > 0 
            ? (stats.totalCalories / totalDayCalories) * 100 
            : 0;

          return (
            <View key={block.label} style={styles.timeBlock}>
              <View style={styles.timeBlockHeader}>
                <View style={styles.timeBlockLabel}>
                  <MaterialCommunityIcons 
                    name={block.icon as any} 
                    size={20} 
                    color="#666666" 
                  />
                  <Text style={styles.timeText}>{block.label}</Text>
                  <Text style={styles.timeRange}>
                    {`${block.start}:00 - ${block.end}:00`}
                  </Text>
                </View>
                <Text style={styles.calories}>
                  {Math.round(stats.totalCalories)} cal
                </Text>
              </View>

              <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${percentage}%`, position: 'relative' }]}> 
                  {stats.mealTypes.map((type, i) => (
                    <View
                      key={type}
                      style={[
                        styles.mealTypeIndicator,
                        { backgroundColor: getMealTypeColor(type) }
                      ]}
                    />
                  ))}
                  {/* Percentage inside bar if wide enough (>=20%) */}
                  {percentage >= 20 && (
                    <Text
                      style={{
                        position: 'absolute',
                        right: 8,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 'bold',
                        top: 2,
                        bottom: 2,
                        textAlignVertical: 'center',
                        textAlign: 'right',
                        minWidth: 36,
                        maxWidth: '80%',
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {Math.round(percentage)}%
                    </Text>
                  )}
                </View>
                {/* Percentage outside bar if bar is narrow (<20%) */}
                {percentage < 20 && (
                  <Text style={[styles.percentage, { fontSize: 12, marginLeft: 4, color: '#666', fontWeight: 'bold', minWidth: 36 }]} numberOfLines={1} ellipsizeMode="tail">{Math.round(percentage)}%</Text>
                )}
              </View>

              <View style={styles.mealTypesList}>
                {stats.mealTypes.map((type) => (
                  <View key={type} style={styles.mealTypeTag}>
                    <View 
                      style={[
                        styles.colorDot,
                        { backgroundColor: getMealTypeColor(type) }
                      ]} 
                    />
                    <Text style={styles.mealTypeText}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
              </View>
            ))}
          </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Most Active Time</Text>
        <Text style={styles.legendText}>
          {Object.entries(hourlyDistribution)
            .sort(([, a], [, b]) => b.calories - a.calories)[0]?.[0] || 'N/A'}:00
        </Text>
    </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    padding: 20,
    marginHorizontal: 4,
    marginVertical: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  chartContainer: {
    gap: 24,
  },
  timeBlock: {
    gap: 8,
  },
  timeBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBlockLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  timeRange: {
    fontSize: 13,
    color: '#666666',
  },
  calories: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 24,
  },
  bar: {
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    minWidth: 20,
  },
  mealTypeIndicator: {
    flex: 1,
    opacity: 0.8,
  },
  percentage: {
    fontSize: 13,
    color: '#666666',
    minWidth: 40,
  },
  mealTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mealTypeText: {
    fontSize: 12,
    color: '#666666',
  },
  legend: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 13,
    color: '#666666',
  },
  legendText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
}); 