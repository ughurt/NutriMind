import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Portal, Dialog, TextInput, Button, Text, Switch, SegmentedButtons, Divider, IconButton, Tooltip, MD3Colors } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface ActivitySettingsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  currentStepGoal: number;
  onSave: (settings: ActivitySettings) => void;
  initialSettings: ActivitySettings;
}

export interface ActivitySettings {
  stepGoal: number;
  showCalories: boolean;
  showDistance: boolean;
  weeklyStatsEnabled: boolean;
  distanceUnit: 'km' | 'mi';
  calorieCalculation: 'basic' | 'advanced';
  activityReminders: boolean;
  reminderFrequency: 'hourly' | '2hours' | '4hours';
  inactivityAlert: boolean;
  inactivityThreshold: number;
}

const DEFAULT_SETTINGS: ActivitySettings = {
  stepGoal: 10000,
  showCalories: true,
  showDistance: true,
  weeklyStatsEnabled: true,
  distanceUnit: 'km',
  calorieCalculation: 'basic',
  activityReminders: false,
  reminderFrequency: '2hours',
  inactivityAlert: false,
  inactivityThreshold: 60,
};

const RECOMMENDED_GOALS = [6000, 8000, 10000, 12000, 15000];

export const ActivitySettingsDialog = ({
  visible,
  onDismiss,
  currentStepGoal,
  onSave,
  initialSettings,
}: ActivitySettingsDialogProps) => {
  const [settings, setSettings] = useState<ActivitySettings>({ ...DEFAULT_SETTINGS, stepGoal: currentStepGoal });
  const [error, setError] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);

  useEffect(() => {
    if (visible) {
      setSettings({ ...DEFAULT_SETTINGS, ...initialSettings });
    }
  }, [visible, initialSettings]);

  const handleSave = () => {
    const numericStepGoal = parseInt(settings.stepGoal.toString());
    if (isNaN(numericStepGoal) || numericStepGoal <= 0) {
      setError('Please enter a valid step goal');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(settings);
    onDismiss();
  };

  const handleSettingChange = <K extends keyof ActivitySettings>(key: K, value: ActivitySettings[K]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <LinearGradient
          colors={['#E7F5F5', '#FFFFFF']}
          style={styles.gradient}
        >
          <View style={styles.handle} />
          
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="cog" size={24} color="#006A6A" />
            <Text variant="titleLarge" style={styles.dialogTitle}>Activity Settings</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Goals Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="target" size={24} color="#006A6A" />
                <Text variant="titleMedium" style={styles.sectionTitle}>Daily Goals</Text>
              </View>
              
              <View style={styles.goalInputContainer}>
                <TextInput
                  value={settings.stepGoal.toString()}
                  onChangeText={(text) => {
                    handleSettingChange('stepGoal', parseInt(text) || 0);
                    setError('');
                  }}
                  keyboardType="numeric"
                  mode="outlined"
                  error={!!error}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  right={
                    <TextInput.Icon 
                      icon="information"
                      onPress={() => setShowRecommended(!showRecommended)}
                      color="#006A6A"
                    />
                  }
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              {showRecommended && (
                <View style={styles.recommendedContainer}>
                  <Text variant="bodySmall" style={styles.recommendedTitle}>
                    Recommended Goals
                  </Text>
                  <View style={styles.recommendedGoals}>
                    {RECOMMENDED_GOALS.map((goal) => (
                      <Pressable
                        key={goal}
                        style={[
                          styles.recommendedGoal,
                          settings.stepGoal === goal && styles.selectedGoal
                        ]}
                        onPress={() => handleSettingChange('stepGoal', goal)}
                      >
                        <Text style={[
                          styles.recommendedGoalText,
                          settings.stepGoal === goal && styles.selectedGoalText
                        ]}>
                          {goal.toLocaleString()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Display Settings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="eye" size={24} color="#006A6A" />
                <Text variant="titleMedium" style={styles.sectionTitle}>Display Settings</Text>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text variant="bodyLarge" style={styles.settingTitle}>Show Calories Burned</Text>
                    <Text variant="bodyMedium" style={styles.settingDescription}>
                      Display estimated calories burned from steps
                    </Text>
                  </View>
                  <Switch 
                    value={settings.showCalories} 
                    onValueChange={value => handleSettingChange('showCalories', value)}
                    color="#006A6A"
                  />
                </View>

                <Divider style={styles.settingDivider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text variant="bodyLarge" style={styles.settingTitle}>Show Distance</Text>
                    <Text variant="bodyMedium" style={styles.settingDescription}>
                      Display distance walked based on steps
                    </Text>
                  </View>
                  <Switch 
                    value={settings.showDistance} 
                    onValueChange={value => handleSettingChange('showDistance', value)}
                    color="#006A6A"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.actionButtonContainer}>
              <Button 
                onPress={onDismiss}
                style={styles.actionButton}
                textColor="#006A6A"
                mode="outlined"
              >
                Cancel
              </Button>
            </View>
            <View style={styles.actionButtonContainer}>
              <Button 
                mode="contained" 
                onPress={handleSave}
                style={[styles.actionButton, styles.saveButton]}
              >
                Save
              </Button>
            </View>
          </View>
        </LinearGradient>
      </Dialog>
    </Portal>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: 'transparent',
    borderRadius: 28,
    maxWidth: Math.min(screenWidth - 48, 400),
    width: '90%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    width: 32,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  dialogTitle: {
    color: '#006A6A',
    fontWeight: '600',
    marginLeft: 12,
  },
  content: {
    paddingHorizontal: 24,
    maxHeight: screenHeight * 0.6,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 12,
    color: '#006A6A',
    fontWeight: '600',
  },
  goalInputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    height: 48,
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: '#006A6A',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  recommendedContainer: {
    marginTop: 16,
  },
  recommendedTitle: {
    color: '#666',
    marginBottom: 8,
  },
  recommendedGoals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recommendedGoal: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  selectedGoal: {
    backgroundColor: '#006A6A',
  },
  recommendedGoalText: {
    color: '#666',
    fontSize: 14,
  },
  selectedGoalText: {
    color: 'white',
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#666',
    fontSize: 14,
  },
  settingDivider: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 24,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButtonContainer: {
    width: '40%',
  },
  actionButton: {
    borderRadius: 12,
    borderColor: '#006A6A',
  },
  saveButton: {
    backgroundColor: '#006A6A',
  },
}); 