import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  List, 
  Switch, 
  Button, 
  Portal, 
  Modal,
  Divider,
  IconButton,
  useTheme
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

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header Surface */}
      <Surface style={styles.headerSurface}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={80}
              source={{ uri: user?.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + user?.email }}
            />
            <IconButton
              icon="camera"
              size={20}
              style={styles.editAvatarButton}
              onPress={() => {/* TODO: Implement avatar change */}}
            />
          </View>
          <View style={styles.headerText}>
            <Text variant="headlineSmall">{user?.user_metadata?.full_name || user?.email}</Text>
            <Text variant="bodyLarge" style={styles.joinedText}>
              Joined {new Date(user?.created_at || '').toLocaleDateString()}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="labelLarge">{goals.length}</Text>
                <Text variant="bodySmall">Goals</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="labelLarge">0</Text>
                <Text variant="bodySmall">Achievements</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="labelLarge">0</Text>
                <Text variant="bodySmall">Days Active</Text>
              </View>
            </View>
          </View>
        </View>
      </Surface>

      {/* Nutrition Goals Section */}
      <Surface style={styles.sectionSurface}>
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">Nutrition Goals</Text>
            <Button 
              mode="contained" 
              onPress={() => setEditGoalsVisible(true)}
              style={styles.addButton}
            >
              Edit Goals
            </Button>
          </View>
          <View style={styles.goalsGrid}>
            {goals.length > 0 ? (
              <>
                {goals.map((goal) => (
                  <GoalItem key={goal.id} goal={goal} />
                ))}
                {goals.length % 2 === 1 && <View style={styles.emptyGridItem} />}
              </>
            ) : (
              <Text style={styles.emptyText}>No goals set yet</Text>
            )}
          </View>
        </View>
      </Surface>

      {/* Settings Section */}
      <Surface style={styles.sectionSurface}>
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">Settings</Text>
          </View>
          
          <Text variant="labelSmall" style={styles.settingsLabel}>Appearance</Text>
          <List.Item
            title="Dark Mode"
            description="Switch between light and dark theme"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={settings.darkMode}
                onValueChange={value => handleSettingChange('darkMode', 'darkMode', value)}
              />
            )}
          />
          <Divider />
          
          <Text variant="labelSmall" style={styles.settingsLabel}>Notifications</Text>
          <List.Item
            title="Push Notifications"
            description="Receive reminders and updates"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={() => (
              <Switch
                value={settings.notifications.push}
                onValueChange={value => handleSettingChange('notifications', 'push', value)}
              />
            )}
          />
          <List.Item
            title="Meal Reminders"
            description="Get reminded to log your meals"
            left={props => <List.Icon {...props} icon="food-outline" />}
            right={() => (
              <Switch
                value={settings.notifications.meals}
                onValueChange={value => handleSettingChange('notifications', 'meals', value)}
              />
            )}
          />
          <List.Item
            title="Activity Alerts"
            description="Alerts for inactivity periods"
            left={props => <List.Icon {...props} icon="walk" />}
            right={() => (
              <Switch
                value={settings.notifications.activity}
                onValueChange={value => handleSettingChange('notifications', 'activity', value)}
              />
            )}
          />
          <Divider />
          
          <Text variant="labelSmall" style={styles.settingsLabel}>Data Management</Text>
          <List.Item
            title="Export Data"
            description="Download your nutrition and activity data"
            left={props => <List.Icon {...props} icon="download" />}
            onPress={() => {/* TODO: Implement export */}}
          />
          <List.Item
            title="Sync Settings"
            description="Manage data synchronization"
            left={props => <List.Icon {...props} icon="sync" />}
            onPress={() => {/* TODO: Implement sync settings */}}
          />
          <List.Item
            title="Clear Data"
            description="Delete all app data"
            left={props => <List.Icon {...props} icon="delete-outline" />}
            onPress={() => {/* TODO: Implement data clearing */}}
          />
        </View>
      </Surface>

      {/* Account Section */}
      <Surface style={styles.sectionSurface}>
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">Account</Text>
          </View>
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={props => <List.Icon {...props} icon="account-edit" />}
            onPress={() => {/* TODO: Implement edit profile */}}
          />
          <List.Item
            title="Change Password"
            description="Update your account password"
            left={props => <List.Icon {...props} icon="lock-reset" />}
            onPress={() => {/* TODO: Implement password change */}}
          />
          <List.Item
            title="Privacy Settings"
            description="Manage your privacy preferences"
            left={props => <List.Icon {...props} icon="shield-account" />}
            onPress={() => {/* TODO: Show privacy settings */}}
          />
          <List.Item
            title="Help & Support"
            description="Get help with using the app"
            left={props => <List.Icon {...props} icon="help-circle" />}
            onPress={() => {/* TODO: Show help section */}}
          />
        </View>
      </Surface>

      <Button 
        mode="outlined" 
        onPress={handleSignOut}
        style={styles.signOutButton}
        icon="logout"
      >
        Sign Out
      </Button>

      <Portal>
        <Modal
          visible={editGoalsVisible}
          onDismiss={handleDismissGoalsForm}
          contentContainerStyle={styles.modal}
        >
          <EditGoalsForm 
            onDismiss={handleDismissGoalsForm}
            currentGoals={goals}
          />
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSurface: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  headerContent: {
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    backgroundColor: '#006A6A',
    borderRadius: 12,
  },
  headerText: {
    alignItems: 'center',
  },
  joinedText: {
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  sectionSurface: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
    borderRadius: 12,
  },
  sectionContent: {
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalSurface: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  goalContent: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 16,
    marginHorizontal: -4,
  },
  addButton: {
    backgroundColor: '#006A6A',
  },
  signOutButton: {
    margin: 16,
    marginBottom: 32,
    marginTop: 'auto',
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    width: '90%',
    alignSelf: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    width: '100%',
    padding: 16,
  },
  emptyGridItem: {
    width: '48%',
    marginHorizontal: '1%',
  },
  settingsLabel: {
    color: '#666',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
});

export default ProfileScreen; 