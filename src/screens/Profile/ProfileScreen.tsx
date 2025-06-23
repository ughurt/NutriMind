import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  List, 
  Switch, 
  Button, 
  Portal, 
  Divider,
  IconButton,
  useTheme,
  Card,
  TouchableRipple,
  ProgressBar
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useGoals } from '../../hooks/useGoals';
import { EditGoalsForm } from './components/EditGoalsForm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GoalItem } from '../../components/GoalItem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface AppSettings {
  darkMode: boolean;
  notifications: {
    push: boolean;
    meals: boolean;
    activity: boolean;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  notifications: {
    push: true,
    meals: true,
    activity: true,
  },
  sync: {
    autoSync: true,
    syncInterval: 15,
  },
};

export const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { goals, loadGoals } = useGoals();
  const theme = useTheme();
  const [editGoalsVisible, setEditGoalsVisible] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('app_settings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSettingChange = (
    section: keyof AppSettings,
    key: string,
    value: boolean | number
  ) => {
    const newSettings = { ...settings };
    if (section === 'notifications') {
      newSettings.notifications = {
        ...newSettings.notifications,
        [key]: value as boolean,
      };
    } else if (section === 'sync') {
      newSettings.sync = {
        ...newSettings.sync,
        [key]: value,
      };
    } else if (section === 'darkMode') {
      newSettings.darkMode = value as boolean;
    }
    saveSettings(newSettings);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDismissGoalsForm = async () => {
    setEditGoalsVisible(false);
    await loadGoals();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderSettingSwitch = (
    title: string, 
    description: string, 
    icon: string, 
    value: boolean,
    onToggle: (value: boolean) => void
  ) => {
    return (
      <Card style={styles.settingCard}>
        <TouchableRipple onPress={() => onToggle(!value)}>
          <View style={styles.settingRow}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
              <MaterialCommunityIcons name={icon as any} size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text variant="titleMedium">{title}</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch 
              value={value} 
              onValueChange={onToggle}
              color={theme.colors.primary}
            />
          </View>
        </TouchableRipple>
      </Card>
    );
  };

  const renderSettingAction = (title: string, description: string, icon: string, onPress: () => void) => {
    return (
      <Card style={styles.settingCard}>
        <TouchableRipple onPress={onPress}>
          <View style={styles.settingRow}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
              <MaterialCommunityIcons name={icon as any} size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text variant="titleMedium">{title}</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>{description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </View>
        </TouchableRipple>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={0}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Account Settings</Text>
          </View>
        </View>
      </Surface>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <Surface style={styles.userInfoSurface} elevation={0}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarWrapper}>
            <Avatar.Image
              size={80}
                source={{ uri: user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email?.charAt(0)}&background=006A6A&color=fff&size=256` }}
                style={styles.avatar}
            />
              <View style={styles.editAvatarContainer}>
            <IconButton
              icon="camera"
                  size={16}
                  iconColor="white"
              style={styles.editAvatarButton}
              onPress={() => {/* TODO: Implement avatar change */}}
            />
          </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.user_metadata?.full_name || user?.email}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.memberSince}>
                <MaterialCommunityIcons name="calendar-check" size={14} color="#666" />
                <Text style={styles.memberSinceText}>
                  Member since {new Date(user?.created_at || '').toLocaleDateString()}
            </Text>
              </View>
            </View>
          </View>
        </Surface>
        
        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{goals.length}</Text>
              <Text style={styles.statLabel}>Goals</Text>
            </View>
              </View>
              <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
              </View>
              <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="target" size={22} color="#006A6A" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Nutrition Goals</Text>
            </View>
            <Button 
              mode="contained-tonal" 
              onPress={() => {
                setEditGoalsVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.editButton}
              contentStyle={styles.buttonContent}
              icon="pencil"
            >
              Edit
            </Button>
          </View>

            {goals.length > 0 ? (
            <View style={styles.goalsContainer}>
                {goals.map((goal) => (
                  <GoalItem key={goal.id} goal={goal} />
                ))}
            </View>
          ) : (
            <Card style={styles.emptyCard} elevation={0}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="target-account" size={40} color="#CCC" />
                <Text style={styles.emptyText}>No nutrition goals set yet</Text>
                <Button
                  mode="outlined"
                  onPress={() => setEditGoalsVisible(true)}
                  style={styles.addGoalButton}
                  icon="plus"
                >
                  Add Goals
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

      {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="cog" size={22} color="#006A6A" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Settings</Text>
            </View>
          </View>
          
          <Text style={styles.settingsCategoryLabel}>Appearance</Text>
          {renderSettingSwitch(
            "Dark Mode", 
            "Switch between light and dark theme", 
            "theme-light-dark", 
            settings.darkMode,
            (value) => handleSettingChange('darkMode', 'darkMode', value)
            )}
          
          <Text style={styles.settingsCategoryLabel}>Notifications</Text>
          {renderSettingSwitch(
            "Push Notifications", 
            "Receive reminders and updates", 
            "bell-outline", 
            settings.notifications.push,
            (value) => handleSettingChange('notifications', 'push', value)
          )}
          {renderSettingSwitch(
            "Meal Reminders", 
            "Get reminded to log your meals", 
            "food-outline", 
            settings.notifications.meals,
            (value) => handleSettingChange('notifications', 'meals', value)
          )}
          {renderSettingSwitch(
            "Activity Alerts", 
            "Alerts for inactivity periods", 
            "walk", 
            settings.notifications.activity,
            (value) => handleSettingChange('notifications', 'activity', value)
            )}
          
          <Text style={styles.settingsCategoryLabel}>Account</Text>
          {renderSettingAction(
            "Edit Profile", 
            "Update your personal information", 
            "account-edit", 
            () => {/* TODO: Implement edit profile */}
          )}
          {renderSettingAction(
            "Change Password", 
            "Update your account password", 
            "lock-reset", 
            () => {/* TODO: Implement password change */}
          )}
          {renderSettingAction(
            "Privacy Settings", 
            "Manage your privacy preferences", 
            "shield-account", 
            () => {/* TODO: Show privacy settings */}
          )}

          <Text style={styles.settingsCategoryLabel}>Data</Text>
          {renderSettingAction(
            "Export Data", 
            "Download your nutrition and activity data", 
            "download", 
            () => {/* TODO: Implement export */}
          )}
          {renderSettingAction(
            "Clear Data", 
            "Delete all app data", 
            "delete-outline", 
            () => {/* TODO: Implement data clearing */}
          )}
        </View>

      <Button 
        mode="outlined" 
          onPress={() => {
            handleSignOut();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        style={styles.signOutButton}
        icon="logout"
          textColor="#f44336"
      >
        Sign Out
      </Button>
      </ScrollView>

      <Portal>
        <EditGoalsForm 
          visible={editGoalsVisible}
            onDismiss={handleDismissGoalsForm}
            currentGoals={goals}
          />
      </Portal>
    </View>
  );
};

const { width: windowWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  userInfoSurface: {
    margin: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    borderWidth: 2,
    borderColor: 'rgba(0, 106, 106, 0.2)',
  },
  editAvatarContainer: {
    position: 'absolute',
    right: -4,
    bottom: -4,
  },
  editAvatarButton: {
    backgroundColor: '#006A6A',
    margin: 0,
    width: 34,
    height: 34,
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberSinceText: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  editButton: {
    borderRadius: 8,
    backgroundColor: 'rgba(0, 106, 106, 0.1)',
  },
  buttonContent: {
    height: 36,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyCard: {
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  emptyContent: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    marginVertical: 12,
    color: '#666666',
    textAlign: 'center',
  },
  addGoalButton: {
    marginTop: 8,
    borderColor: '#006A6A',
  },
  settingsCategoryLabel: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 8,
    fontSize: 13,
    color: '#666666',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  settingCard: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingDescription: {
    color: '#666666',
    marginTop: 2,
  },
  signOutButton: {
    margin: 16,
    marginTop: 32,
    borderColor: '#f44336',
    borderWidth: 1.5,
  },
});

export default ProfileScreen; 