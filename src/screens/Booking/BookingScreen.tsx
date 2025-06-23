import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Image, Dimensions, Platform } from 'react-native';
import { Text, Surface, Card, Button, IconButton, Chip, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MorningPlans } from './components/MorningPlans';
import { DietPlans } from './components/DietPlans';

type BookingOption = 'diet' | 'workout';

const FeaturedPlans = () => {
  const theme = useTheme();
  
  const plans = [
    {
      id: '1',
      title: 'Transform 90',
      type: 'Workout & Diet Plan',
      price: '$199',
      duration: '90 days',
      description: 'Complete body transformation program with personalized workout routines and meal plans.',
      features: ['Custom meal plans', 'Weekly workout schedules', 'Progress tracking', 'Nutrition guidance'],
      imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=500&auto=format&fit=crop'
    },
    {
      id: '2',
      title: 'Lean & Clean',
      type: 'Diet Plan',
      price: '$129',
      duration: '60 days',
      description: 'Clean eating program designed for sustainable weight loss and improved energy levels.',
      features: ['Personalized meal plans', 'Shopping lists', 'Recipe collection', 'Nutritionist support'],
      imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=500&auto=format&fit=crop'
    },
    {
      id: '3',
      title: 'Strength Master',
      type: 'Workout Plan',
      price: '$149',
      duration: '75 days',
      description: 'Progressive strength training program for building lean muscle and increasing power.',
      features: ['Video exercises', 'Weekly progression', 'Form guidance', 'Supplement guide'],
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=500&auto=format&fit=crop'
    }
  ];

  return (
    <View style={styles.featuredSection}>
      <Surface style={styles.sectionHeader} elevation={0}>
        <Text variant="titleLarge" style={styles.featuredTitle}>Featured Plans</Text>
        <Text variant="bodyMedium" style={styles.featuredSubtitle}>Transform your life with our specially curated programs</Text>
      </Surface>
      
      <View style={styles.plansScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plansContainer}
          snapToInterval={336} // card width (320) + margin (16)
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCardContainer}>
              <Surface style={styles.planCard} elevation={0}>
                <View style={styles.planCardInner}>
                  <Image
                    source={{ uri: plan.imageUrl }}
                    style={styles.planImage}
                    resizeMode="cover"
                  />
                  <View style={styles.planOverlay}>
                      <Chip 
                        compact 
                        style={styles.planTypeChip}
                        textStyle={styles.planTypeText}
                      >
                        {plan.type}
                      </Chip>
                    </View>
                  <View style={styles.planContent}>
                    <Text variant="titleLarge" style={styles.planTitle} numberOfLines={1}>
                      {plan.title}
                    </Text>
                    
                    <Text style={styles.planDescription} numberOfLines={2}>
                      {plan.description}
                    </Text>
                    
                    <View style={styles.planFeatures}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <MaterialCommunityIcons name="check-circle" size={16} color="#006A6A" />
                          <Text style={styles.featureText} numberOfLines={1}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.planFooter}>
                      <View style={styles.priceContainer}>
                        <Text variant="headlineSmall" style={styles.planPrice}>{plan.price}</Text>
                        <Text style={styles.planDuration}>/{plan.duration}</Text>
                      </View>
                      <Button
                        mode="contained"
                        style={styles.planButton}
                        buttonColor="#006A6A"
                        textColor="white"
                        labelStyle={styles.planButtonLabel}
                      >
                        Get Started
                      </Button>
                    </View>
                  </View>
                </View>
              </Surface>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const BookingScreen = () => {
  const [selectedOption, setSelectedOption] = useState<BookingOption | null>(null);
  const theme = useTheme();

  const bookingOptions = [
    {
      id: 'diet',
      title: 'Diet Plans',
      description: 'Purchase pre-designed diet plans for your goals',
      icon: 'food-apple' as const,
      color: '#FF9800',
    },
    {
      id: 'workout',
      title: 'Workout Plans',
      description: 'Get tailored workout plans for your fitness level',
      icon: 'dumbbell' as const,
      color: '#2196F3',
    },
  ];

  const renderContent = () => {
    switch (selectedOption) {
      case 'diet':
        return (
          <View style={styles.dietPlans}>
            <DietPlans />
          </View>
        );
      case 'workout':
        return (
          <View style={styles.workoutPlans}>
            <MorningPlans />
          </View>
        );
      default:
        return (
          <>
            <Surface style={styles.sectionHeader} elevation={0}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Services</Text>
              <Text variant="bodyMedium" style={styles.sectionSubtitle}>Select a service to get started</Text>
            </Surface>
            
            <View style={styles.optionsContainer}>
              {bookingOptions.map((option) => (
                <Card
                  key={option.id}
                  style={styles.optionCard}
                  onPress={() => setSelectedOption(option.id as BookingOption)}
                  mode="outlined"
                >
                  <Card.Content style={styles.cardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={32}
                        color={option.color}
                      />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text variant="titleMedium" style={styles.cardTitle}>
                        {option.title}
                      </Text>
                      <Text variant="bodyMedium" style={styles.cardDescription}>
                        {option.description}
                      </Text>
                    </View>
                    <IconButton
                      icon="chevron-right"
                      size={24}
                      iconColor={option.color}
                    />
                  </Card.Content>
                </Card>
              ))}
            </View>
            <FeaturedPlans />
          </>
        );
    }
  };

  const { width: screenWidth } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={0}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {selectedOption ? 
              selectedOption === 'diet' ? 'Diet Plans' : 'Workout Plans' 
              : 'Bookings & Plans'
            }
            </Text>
          <Text style={styles.headerSubtitle}>
            {selectedOption ? 
              'Personalized services to help you reach your goals' : 
              'Schedule sessions or get personalized plans'
            }
            </Text>
          </View>
          {selectedOption && (
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setSelectedOption(null)}
              style={styles.backIcon}
              iconColor="#1A1A1A"
            />
          )}
        </View>
        </Surface>

      <ScrollView style={styles.content}>
      {renderContent()}
    </ScrollView>
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
  backIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  sectionTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#666',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    borderColor: '#e0e0e0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#666',
    fontSize: 14,
  },
  comingSoon: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  comingSoonDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  backButton: {
    borderColor: '#006A6A',
    marginTop: 16,
  },
  featuredSection: {
    marginBottom: 32,
  },
  featuredTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  plansScrollContainer: {
    marginTop: 16,
    height: 480, // Fixed height for consistent card sizes
  },
  plansContainer: {
    paddingHorizontal: 16,
  },
  planCardContainer: {
    width: 320,
    marginRight: 16,
  },
  planCard: {
    width: '100%',
    height: 460,
    borderRadius: 16,
  },
  planCardInner: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    height: '100%',
  },
  planImage: {
    width: '100%',
    height: 160,
  },
  planOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  planContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  planTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginBottom: 12,
  },
  planTypeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
  },
  planTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006A6A',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
    height: 40, // Fixed height for 2 lines
  },
  planFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    color: '#006A6A',
    fontWeight: '600',
  },
  planDuration: {
    color: '#666',
    marginLeft: 4,
  },
  planButton: {
    borderRadius: 8,
  },
  planButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  workoutPlans: {
    flex: 1,
    paddingBottom: 24,
  },
  dietPlans: {
    flex: 1,
    paddingBottom: 24,
  },
});

export default BookingScreen; 