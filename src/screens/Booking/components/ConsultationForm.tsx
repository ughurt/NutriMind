import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, IconButton, Divider, Card, Chip, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays, isToday, isPast, startOfDay } from 'date-fns';

type Specialization = 'Weight Management' | 'Sports Nutrition' | 'Clinical Nutrition' | 'Pediatric Nutrition' | 'Eating Disorders';

type Review = {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  date: Date;
  likes: number;
};

type Nutritionist = {
  id: string;
  name: string;
  specialization: Specialization[];
  rating: number;
  experience: string;
  photoUrl: string;
  galleryPhotos: string[];
  description: string;
  education: string;
  languages: string[];
  reviews: Review[];
  availableDates: {
    date: Date;
    times: string[];
  }[];
};

// Helper function to generate available times
const generateTimeSlots = (startHour: number = 9, endHour: number = 17): string[] => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${hour}:00`, `${hour}:30`);
  }
  return slots;
};

// Generate sample data with actual dates
const generateAvailableDates = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push({
      date: addDays(new Date(), i),
      times: generateTimeSlots(),
    });
  }
  return dates;
};

const SAMPLE_NUTRITIONISTS: Nutritionist[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialization: ['Weight Management', 'Clinical Nutrition'],
    rating: 4.8,
    experience: '10+ years',
    photoUrl: 'https://example.com/photos/sarah.jpg',
    galleryPhotos: [
      'https://example.com/gallery/sarah1.jpg',
      'https://example.com/gallery/sarah2.jpg',
      'https://example.com/gallery/sarah3.jpg',
      'https://example.com/gallery/sarah4.jpg'
    ],
    description: 'Specializing in sustainable weight management and clinical nutrition. Passionate about helping clients achieve their health goals through personalized nutrition plans.',
    education: 'Ph.D. in Clinical Nutrition, Stanford University',
    languages: ['English', 'Spanish'],
    reviews: [
      {
        id: '1',
        userId: 'user1',
        userName: 'John Smith',
        userPhoto: 'https://example.com/users/john.jpg',
        rating: 5,
        comment: 'Dr. Johnson helped me achieve my weight loss goals with a sustainable plan. Her approach is both scientific and practical.',
        date: new Date('2024-02-15'),
        likes: 12
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Emma Davis',
        rating: 4.5,
        comment: 'Very knowledgeable and supportive throughout my nutrition journey. Highly recommend!',
        date: new Date('2024-03-01'),
        likes: 8
      }
    ],
    availableDates: generateAvailableDates()
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialization: ['Sports Nutrition', 'Weight Management'],
    rating: 4.9,
    experience: '8 years',
    photoUrl: 'https://example.com/photos/michael.jpg', // Replace with actual photo URL
    galleryPhotos: [],
    description: 'Expert in sports nutrition and performance optimization. Helps athletes and fitness enthusiasts achieve their peak performance through evidence-based nutrition strategies.',
    education: 'M.S. in Sports Science, UCLA',
    languages: ['English', 'Mandarin'],
    reviews: [],
    availableDates: generateAvailableDates()
  },
  {
    id: '3',
    name: 'Dr. Emily Brown',
    specialization: ['Clinical Nutrition', 'Eating Disorders'],
    rating: 4.7,
    experience: '12 years',
    photoUrl: 'https://example.com/photos/emily.jpg', // Replace with actual photo URL
    galleryPhotos: [],
    description: 'Dedicated to helping clients overcome eating disorders and establish healthy relationships with food. Specializes in medical nutrition therapy.',
    education: 'Ph.D. in Nutrition Science, Harvard University',
    languages: ['English', 'French'],
    reviews: [],
    availableDates: generateAvailableDates()
  },
  {
    id: '4',
    name: 'Dr. David Wilson',
    specialization: ['Pediatric Nutrition', 'Clinical Nutrition'],
    rating: 4.9,
    experience: '15 years',
    photoUrl: 'https://example.com/photos/david.jpg', // Replace with actual photo URL
    galleryPhotos: [],
    description: 'Experienced in pediatric nutrition and family health. Focuses on developing healthy eating habits from an early age and managing pediatric nutritional disorders.',
    education: 'M.D. with specialization in Pediatric Nutrition, Johns Hopkins',
    languages: ['English', 'German'],
    reviews: [],
    availableDates: generateAvailableDates()
  }
];

const ALL_SPECIALIZATIONS: Specialization[] = [
  'Weight Management',
  'Sports Nutrition',
  'Clinical Nutrition',
  'Pediatric Nutrition',
  'Eating Disorders'
];

type BookingStep = 'date' | 'time' | 'notes' | 'confirmation';

interface BookingConfirmation {
  nutritionist: Nutritionist;
  date: Date;
  time: string;
  notes: string;
}

const ConsultationForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<Specialization[]>([]);
  const [selectedNutritionist, setSelectedNutritionist] = useState<Nutritionist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showAllHours, setShowAllHours] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingConfirmation | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const filteredNutritionists = useMemo(() => {
    return SAMPLE_NUTRITIONISTS.filter(nutritionist => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        nutritionist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nutritionist.specialization.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filter by selected specializations
      const matchesSpecializations = selectedSpecializations.length === 0 ||
        selectedSpecializations.some(s => nutritionist.specialization.includes(s));

      return matchesSearch && matchesSpecializations;
    });
  }, [searchQuery, selectedSpecializations]);

  const renderSearchSection = () => (
    <Surface style={styles.searchSection}>
      <Text variant="titleLarge" style={styles.title}>Find a Nutritionist</Text>
      
      {/* Search Input */}
      <TextInput
        mode="outlined"
        placeholder="Search by name or specialization"
        value={searchQuery}
        onChangeText={setSearchQuery}
        left={<TextInput.Icon icon="magnify" />}
        right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : null}
        style={styles.searchInput}
      />

      {/* Specialization Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
      >
        <View style={styles.filtersContainer}>
          {ALL_SPECIALIZATIONS.map((specialization) => (
            <Chip
              key={specialization}
              selected={selectedSpecializations.includes(specialization)}
              onPress={() => {
                setSelectedSpecializations(prev =>
                  prev.includes(specialization)
                    ? prev.filter(s => s !== specialization)
                    : [...prev, specialization]
                );
              }}
              style={styles.filterChip}
              selectedColor="#1a73e8"
            >
              {specialization}
            </Chip>
          ))}
        </View>
      </ScrollView>

      {/* Results Count */}
      <Text variant="bodyMedium" style={styles.resultsCount}>
        {filteredNutritionists.length} nutritionists found
      </Text>
    </Surface>
  );

  const renderNutritionistList = () => (
    <View style={styles.listContainer}>
      {filteredNutritionists.map((nutritionist) => (
        <Card
          key={nutritionist.id}
          style={styles.nutritionistCard}
          onPress={() => setSelectedNutritionist(nutritionist)}
        >
          <Card.Content>
            <View style={styles.nutritionistCardContent}>
              <View style={styles.photoContainer}>
                <Surface style={styles.photoSurface}>
                  <MaterialCommunityIcons name="account-circle" size={60} color="#1a73e8" />
                </Surface>
              </View>
              <View style={styles.nutritionistDetails}>
                <View style={styles.nutritionistHeader}>
                  <View style={styles.nutritionistInfo}>
                    <Text variant="titleMedium" style={styles.nutritionistName}>{nutritionist.name}</Text>
                    <View style={styles.ratingContainer}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                      <Text style={styles.rating}>{nutritionist.rating}</Text>
                      <Text style={styles.experience}> • {nutritionist.experience}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.education}>{nutritionist.education}</Text>
                
                <View style={styles.languagesContainer}>
                  <MaterialCommunityIcons name="translate" size={16} color="#666" />
                  <Text style={styles.languages}>{nutritionist.languages.join(', ')}</Text>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                  {nutritionist.description}
                </Text>

                <View style={styles.specializationContainer}>
                  {nutritionist.specialization.map((spec) => (
                    <Chip
                      key={spec}
                      compact
                      style={styles.specializationChip}
                    >
                      {spec}
                    </Chip>
                  ))}
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderDateNavigation = () => {
    if (!selectedNutritionist) return null;
    
    const dates = [];
    const today = startOfDay(new Date());
    
    // Generate next 14 days (2 weeks)
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    
    const startIdx = currentWeekOffset * 5;
    const currentDates = dates.slice(startIdx, startIdx + 5);
    const canGoBack = currentWeekOffset > 0;
    const canGoForward = startIdx + 5 < dates.length;
    
    return (
      <View style={styles.dateTimeContainer}>
        <Text style={styles.dateTimeTitle}>Select Date & Time</Text>
        <View style={styles.dateNavigation}>
          <IconButton
            icon="chevron-left"
            size={20}
            style={[
              styles.dateNavigationArrow,
              !canGoBack && styles.dateNavigationArrowDisabled
            ]}
            onPress={() => canGoBack && setCurrentWeekOffset(prev => prev - 1)}
            disabled={!canGoBack}
          />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateScrollView}
          >
            {currentDates.map((date) => {
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const isPastDate = isPast(date) && !isToday(date);
              
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.dateColumn,
                    isSelected && styles.selectedDateColumn,
                    isPastDate && styles.disabledDateColumn
                  ]}
                  onPress={() => !isPastDate && handleDateSelection(date)}
                  disabled={isPastDate}
                >
                  <Text style={[
                    styles.dayName,
                    isSelected && styles.selectedText,
                    isPastDate && styles.disabledText
                  ]}>
                    {format(date, 'EEE')}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.selectedText,
                    isPastDate && styles.disabledText
                  ]}>
                    {format(date, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <IconButton
            icon="chevron-right"
            size={20}
            style={[
              styles.dateNavigationArrow,
              !canGoForward && styles.dateNavigationArrowDisabled
            ]}
            onPress={() => canGoForward && setCurrentWeekOffset(prev => prev + 1)}
            disabled={!canGoForward}
          />
        </View>
      </View>
    );
  };

  const handleDateSelection = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setShowAllHours(false);
    setCurrentStep('time');
  };

  const handleTimeSelection = (time: string) => {
    setSelectedTime(time);
    // Don't automatically move to notes, let user review and confirm time
  };

  const handleBookingConfirmation = () => {
    if (!selectedNutritionist || !selectedDate || !selectedTime) return;

    const bookingInfo: BookingConfirmation = {
      nutritionist: selectedNutritionist,
      date: selectedDate,
      time: selectedTime,
      notes: notes.trim()
    };

    setBookingDetails(bookingInfo);
    setShowConfirmationModal(true);
  };

  const handleBookingSubmit = () => {
    // TODO: Implement actual booking submission
    console.log('Booking submitted:', bookingDetails);
    setShowConfirmationModal(false);
    // Reset form
    setSelectedNutritionist(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setNotes('');
    setCurrentStep('date');
  };

  const renderTimeSlots = () => {
    if (!selectedDate || !selectedNutritionist) return null;

    const timeSlots = generateTimeSlots(9, 17);
    const currentTime = new Date();
    const isSelectedDateToday = isToday(selectedDate);

    const filteredTimeSlots = timeSlots.filter(time => {
      if (!isSelectedDateToday) return true;
      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, minutes);
      return slotTime > currentTime;
    });

    const displayedTimeSlots = showAllHours ? filteredTimeSlots : filteredTimeSlots.slice(0, 6);

    return (
      <View style={styles.timeSlotsContainer}>
        <View style={styles.timeGrid}>
          {displayedTimeSlots.map((time) => {
            const [hours, minutes] = time.split(':').map(Number);
            const slotTime = new Date(selectedDate);
            slotTime.setHours(hours, minutes);
            const isDisabled = isSelectedDateToday && isPast(slotTime);
            const isSelected = selectedTime === time;
            const formattedTime = format(slotTime, 'h:mm a');

            return (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  isSelected && styles.selectedTimeSlot,
                  isDisabled && styles.disabledTimeSlot
                ]}
                onPress={() => !isDisabled && handleTimeSelection(time)}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.timeText,
                  isSelected && styles.selectedTimeText,
                  isDisabled && styles.disabledText
                ]}>
                  {formattedTime}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredTimeSlots.length > 6 && (
          <Button
            mode="text"
            onPress={() => setShowAllHours(!showAllHours)}
            style={styles.showMoreButton}
          >
            {showAllHours ? 'Show Less Hours' : 'Show More Hours'}
          </Button>
        )}
      </View>
    );
  };

  const renderNotesSection = () => {
    if (!selectedTime) return null;

    return (
      <View style={styles.notesSection}>
        <View style={styles.selectedAppointmentInfo}>
          <View style={styles.appointmentDetail}>
            <MaterialCommunityIcons name="calendar" size={20} color="#666" />
            <Text style={styles.appointmentDetailText}>
              {format(selectedDate!, 'EEEE, MMMM d')}
            </Text>
          </View>
          <View style={styles.appointmentDetail}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
            <Text style={styles.appointmentDetailText}>{selectedTime}</Text>
          </View>
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          mode="outlined"
          placeholder="Add any specific concerns or questions for your nutritionist"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          style={styles.notesInput}
        />
      </View>
    );
  };

  const renderGallery = (nutritionist: Nutritionist) => {
    if (nutritionist.galleryPhotos.length === 0) return null;

    return (
      <View style={styles.gallerySection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Photo Gallery</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.galleryScroll}
        >
          {nutritionist.galleryPhotos.map((photo, index) => (
            <Surface key={index} style={styles.galleryPhotoContainer}>
              {/* Replace MaterialCommunityIcons with actual Image when photos are available */}
              <MaterialCommunityIcons name="image" size={80} color="#1a73e8" />
            </Surface>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderReviews = (nutritionist: Nutritionist) => {
    if (nutritionist.reviews.length === 0) return null;

    return (
      <View style={styles.reviewsSection}>
        <View style={styles.reviewsHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Client Reviews</Text>
          <View style={styles.overallRating}>
            <MaterialCommunityIcons name="star" size={24} color="#FFC107" />
            <Text style={styles.overallRatingText}>{nutritionist.rating}</Text>
            <Text style={styles.reviewCount}>({nutritionist.reviews.length} reviews)</Text>
          </View>
        </View>

        {nutritionist.reviews.map((review) => (
          <Surface key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewUser}>
                {review.userPhoto ? (
                  <MaterialCommunityIcons name="account-circle" size={40} color="#1a73e8" />
                ) : (
                  <View style={styles.userInitial}>
                    <Text style={styles.userInitialText}>
                      {review.userName.charAt(0)}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.reviewUserName}>{review.userName}</Text>
                  <Text style={styles.reviewDate}>
                    {format(review.date, 'MMM d, yyyy')}
                  </Text>
                </View>
              </View>
              <View style={styles.reviewRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name={star <= review.rating ? "star" : "star-outline"}
                    size={16}
                    color="#FFC107"
                  />
                ))}
              </View>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <View style={styles.reviewActions}>
              <TouchableOpacity style={styles.likeButton}>
                <MaterialCommunityIcons name="thumb-up-outline" size={16} color="#666" />
                <Text style={styles.likeCount}>{review.likes}</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        ))}
      </View>
    );
  };

  const renderBookingModal = () => (
    <Portal>
      <Modal
        visible={showBookingModal}
        onDismiss={() => setShowBookingModal(false)}
        contentContainerStyle={styles.bookingModalContainer}
      >
        <Surface style={styles.bookingModalContent}>
          <View style={styles.bookingModalHeader}>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowBookingModal(false)}
              style={styles.closeButton}
            />
            <Text variant="titleLarge" style={styles.bookingModalTitle}>Book Appointment</Text>
          </View>
          
          <ScrollView style={styles.bookingModalScroll}>
            <View style={styles.bookingModalBody}>
              {/* Date Selection */}
              <View style={styles.bookingSection}>
                {renderDateNavigation()}
              </View>

              {/* Time Selection */}
              {selectedDate && (
                <View style={styles.bookingSection}>
                  {renderTimeSlots()}
                </View>
              )}

              {/* Notes Section */}
              {selectedTime && (
                <View style={styles.bookingSection}>
                  <TextInput
                    mode="outlined"
                    placeholder="Add any specific concerns or questions"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    style={styles.notesInput}
                  />
                </View>
              )}
            </View>
          </ScrollView>

          {selectedTime && (
            <View style={styles.bookingModalFooter}>
              <Button
                mode="contained"
                style={styles.bookButton}
                onPress={handleBookingConfirmation}
                icon="calendar-check"
              >
                Confirm Booking
              </Button>
            </View>
          )}
        </Surface>
      </Modal>
    </Portal>
  );

  const renderConfirmationModal = () => (
    <Portal>
      <Modal
        visible={showConfirmationModal}
        onDismiss={() => setShowConfirmationModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.modalContent}>
          <Text variant="titleLarge" style={styles.modalTitle}>Confirm Booking</Text>
          
          <View style={styles.confirmationDetails}>
            <View style={styles.confirmationRow}>
              <MaterialCommunityIcons name="account-tie" size={24} color="#666" />
              <View style={styles.confirmationText}>
                <Text variant="bodyLarge">{bookingDetails?.nutritionist.name}</Text>
                <Text variant="bodyMedium" style={styles.confirmationSubtext}>
                  {bookingDetails?.nutritionist.specialization.join(', ')}
                </Text>
              </View>
            </View>

            <View style={styles.confirmationRow}>
              <MaterialCommunityIcons name="calendar" size={24} color="#666" />
              <View style={styles.confirmationText}>
                <Text variant="bodyLarge">
                  {bookingDetails?.date && format(bookingDetails.date, 'EEEE, MMMM d')}
                </Text>
                <Text variant="bodyMedium" style={styles.confirmationSubtext}>
                  {bookingDetails?.time}
                </Text>
              </View>
            </View>

            {bookingDetails?.notes && (
              <View style={styles.confirmationRow}>
                <MaterialCommunityIcons name="note-text" size={24} color="#666" />
                <View style={styles.confirmationText}>
                  <Text variant="bodyMedium">{bookingDetails.notes}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowConfirmationModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleBookingSubmit}
              style={[styles.modalButton, styles.confirmButton]}
            >
              Confirm Booking
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );

  const renderSelectedNutritionistProfile = () => {
    if (!selectedNutritionist) return null;

    return (
      <View style={styles.selectedNutritionistCard}>
        <View style={styles.selectedNutritionistHeader}>
          <View style={styles.selectedPhotoContainer}>
            <Surface style={styles.selectedPhotoSurface}>
              <MaterialCommunityIcons name="account-circle" size={80} color="#1a73e8" />
            </Surface>
          </View>
          <View style={styles.selectedNutritionistInfo}>
            <Text variant="titleLarge" style={styles.selectedNutritionistName}>
              {selectedNutritionist.name}
            </Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.rating}>{selectedNutritionist.rating}</Text>
              <Text style={styles.experience}> • {selectedNutritionist.experience}</Text>
            </View>
            <Text style={styles.selectedEducation}>{selectedNutritionist.education}</Text>
            <View style={styles.languagesContainer}>
              <MaterialCommunityIcons name="translate" size={16} color="#666" />
              <Text style={styles.languages}>{selectedNutritionist.languages.join(', ')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.selectedDescription}>
          {selectedNutritionist.description}
        </Text>

        <View style={styles.selectedSpecializationContainer}>
          {selectedNutritionist.specialization.map((spec) => (
            <Chip
              key={spec}
              compact
              style={styles.specializationChip}
            >
              {spec}
            </Chip>
          ))}
        </View>

        <Button
          mode="contained"
          icon="calendar-check"
          style={styles.bookAppointmentButton}
          onPress={() => {
            setCurrentStep('date');
            setSelectedDate(null);
            setSelectedTime(null);
            setNotes('');
            setShowBookingModal(true);
          }}
        >
          Book Appointment
        </Button>

        {renderGallery(selectedNutritionist)}
        {renderReviews(selectedNutritionist)}
      </View>
    );
  };

  const renderBookingSection = () => {
    if (!selectedNutritionist) return null;

    return (
      <View style={styles.bookingSection}>
        <View style={styles.bookingHeader}>
          {renderSelectedNutritionistProfile()}
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {!selectedNutritionist ? (
          <>
            {renderSearchSection()}
            {renderNutritionistList()}
          </>
        ) : (
          <>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                setSelectedNutritionist(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setNotes('');
                setCurrentStep('date');
              }}
              style={styles.backButton}
            />
            {renderBookingSection()}
          </>
        )}
      </ScrollView>
      {renderBookingModal()}
      {renderConfirmationModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    marginBottom: 16,
    color: '#333',
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  nutritionistCard: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  nutritionistCardContent: {
    flexDirection: 'row',
    gap: 16,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoSurface: {
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 2,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionistDetails: {
    flex: 1,
    gap: 8,
  },
  nutritionistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nutritionistInfo: {
    flex: 1,
  },
  nutritionistName: {
    fontWeight: '500',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    marginLeft: 4,
    color: '#666',
    fontWeight: '500',
  },
  experience: {
    color: '#666',
  },
  education: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  languages: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  specializationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  specializationChip: {
    backgroundColor: '#f1f3f4',
  },
  backButton: {
    margin: 8,
  },
  bookingSection: {
    padding: 16,
    gap: 16,
  },
  bookingHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  selectedNutritionistCard: {
    padding: 16,
  },
  selectedNutritionistHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  selectedPhotoContainer: {
    alignItems: 'center',
  },
  selectedPhotoSurface: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 2,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedNutritionistInfo: {
    flex: 1,
    gap: 4,
  },
  selectedNutritionistName: {
    color: '#333',
    fontWeight: '500',
  },
  selectedEducation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectedDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  selectedSpecializationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divider: {
    backgroundColor: '#e1e3e6',
  },
  dateTimeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  dateTimeTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 16,
  },
  dateScrollView: {
    flexGrow: 0,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavigationArrow: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  dateContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  dateColumn: {
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    minWidth: 48,
  },
  selectedDateColumn: {
    backgroundColor: '#e8f0fe',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedText: {
    color: '#1a73e8',
  },
  timeSlotsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  timeSlot: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e3e6',
    width: '22%',
    alignItems: 'center',
    marginHorizontal: '1%',
  },
  selectedTimeSlot: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
  },
  timeText: {
    fontSize: 12,
    color: '#333',
  },
  selectedTimeText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '500',
  },
  disabledTimeSlot: {
    backgroundColor: '#f1f3f4',
    opacity: 0.5,
    borderColor: 'transparent',
  },
  disabledText: {
    color: '#999',
  },
  selectedTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#1a73e8',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 24,
  },
  selectedAppointmentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appointmentDetailText: {
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  modalTitle: {
    marginBottom: 24,
    color: '#333',
    fontWeight: '500',
  },
  confirmationDetails: {
    gap: 20,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  confirmationText: {
    flex: 1,
  },
  confirmationSubtext: {
    color: '#666',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    minWidth: 100,
  },
  confirmButton: {
    backgroundColor: '#1a73e8',
  },
  disabledDateColumn: {
    opacity: 0.5,
  },
  filtersScroll: {
    marginTop: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    marginRight: 8,
  },
  resultsCount: {
    marginTop: 16,
    color: '#666',
  },
  showMoreButton: {
    marginTop: 16,
  },
  dateNavigationArrowDisabled: {
    opacity: 0.3,
  },
  gallerySection: {
    marginTop: 24,
  },
  galleryScroll: {
    marginTop: 12,
  },
  galleryPhotoContainer: {
    width: 160,
    height: 160,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  reviewsSection: {
    marginTop: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overallRatingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  reviewCount: {
    color: '#666',
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitialText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a73e8',
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
  },
  likeCount: {
    fontSize: 12,
    color: '#666',
  },
  bookAppointmentButton: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: '#1a73e8',
    paddingVertical: 8,
  },
  bookingModalContainer: {
    margin: 16,
    marginTop: 40,
    marginBottom: 40,
  },
  bookingModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    height: '90%',
    overflow: 'hidden',
  },
  bookingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e3e6',
    backgroundColor: '#fff',
  },
  bookingModalTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
    color: '#333',
    fontWeight: '600',
    fontSize: 20,
  },
  closeButton: {
    margin: 0,
  },
  bookingModalScroll: {
    flex: 1,
  },
  bookingModalBody: {
    padding: 20,
  },
  bookingSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  bookingSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  bookingModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e3e6',
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default ConsultationForm; 