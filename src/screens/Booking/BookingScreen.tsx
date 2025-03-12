import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Image } from 'react-native';
import { Text, Surface, Card, Button, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ConsultationForm from './components/ConsultationForm';

type BookingOption = 'consultation' | 'diet' | 'workout';

const FeaturedPlans = () => {
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
      <Text variant="headlineMedium" style={styles.featuredTitle}>Featured Plans</Text>
      <Text variant="bodyLarge" style={styles.featuredSubtitle}>Transform your life with our specially curated programs</Text>
      
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
              <Surface style={styles.planCard}>
                <View style={styles.planCardInner}>
                  <Image
                    source={{ uri: plan.imageUrl }}
                    style={styles.planImage}
                    resizeMode="cover"
                  />
                  <View style={styles.planContent}>
                    <View style={styles.planHeader}>
                      <Text variant="titleLarge" style={styles.planTitle} numberOfLines={1}>
                        {plan.title}
                      </Text>
                      <Chip 
                        compact 
                        style={styles.planTypeChip}
                        textStyle={styles.planTypeText}
                      >
                        {plan.type}
                      </Chip>
                    </View>
                    
                    <Text style={styles.planDescription} numberOfLines={2}>
                      {plan.description}
                    </Text>
                    
                    <View style={styles.planFeatures}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <MaterialCommunityIcons name="check-circle" size={16} color="#1a73e8" />
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

  const bookingOptions = [
    {
      id: 'consultation',
      title: 'Nutrition Consultation',
      description: 'Book a one-on-one session with a certified nutritionist',
      icon: 'account-tie' as const,
      color: '#4CAF50',
    },
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
      case 'consultation':
        return <ConsultationForm />;
      case 'diet':
        return (
          <View style={styles.comingSoon}>
            <Text variant="titleMedium">Diet Plans Coming Soon</Text>
            <Button
              mode="outlined"
              onPress={() => setSelectedOption(null)}
              style={styles.backButton}
            >
              Go Back
            </Button>
          </View>
        );
      case 'workout':
        return (
          <View style={styles.comingSoon}>
            <Text variant="titleMedium">Workout Plans Coming Soon</Text>
            <Button
              mode="outlined"
              onPress={() => setSelectedOption(null)}
              style={styles.backButton}
            >
              Go Back
            </Button>
          </View>
        );
      default:
        return (
          <>
            <View style={styles.optionsContainer}>
              {bookingOptions.map((option) => (
                <Card
                  key={option.id}
                  style={styles.optionCard}
                  onPress={() => setSelectedOption(option.id as BookingOption)}
                >
                  <Card.Content style={styles.cardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
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
                      iconColor="#666"
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Surface style={styles.headerSurface}>
          <View style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.headerText}>
              Book & Purchase
            </Text>
            <Text variant="bodyLarge" style={styles.subHeaderText}>
              Schedule sessions or get personalized plans
            </Text>
          </View>
          {selectedOption && (
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setSelectedOption(null)}
              style={styles.backIcon}
            />
          )}
        </Surface>
      </View>

      {renderContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 16,
  },
  headerSurface: {
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  headerContent: {
    gap: 4,
  },
  headerText: {
    color: '#006A6A',
    fontWeight: 'bold',
  },
  subHeaderText: {
    color: '#666',
  },
  backIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  optionsContainer: {
    padding: 16,
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#333',
    fontWeight: '500',
  },
  cardDescription: {
    color: '#666',
    fontSize: 14,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  backButton: {
    borderColor: '#006A6A',
  },
  featuredSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  featuredTitle: {
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  featuredSubtitle: {
    color: '#666',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  plansScrollContainer: {
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
    elevation: 3,
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
  planContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  planTitle: {
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  planTypeChip: {
    backgroundColor: '#e8f0fe',
    height: 28,
  },
  planTypeText: {
    fontSize: 12,
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
    color: '#1a73e8',
    fontWeight: '600',
  },
  planDuration: {
    color: '#666',
    marginLeft: 4,
  },
  planButton: {
    backgroundColor: '#1a73e8',
  },
  planButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BookingScreen; 