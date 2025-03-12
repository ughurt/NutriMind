import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { List, Avatar, Text, Card } from 'react-native-paper';
import { useAchievements } from '../../hooks/useAchievements';
import { format } from 'date-fns';

export const AchievementsScreen = () => {
  const { achievements, loading } = useAchievements();

  if (loading) {
    return (
      <Card style={styles.container}>
        <Card.Content>
          <Text>Loading achievements...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Title title="All Achievements" />
        <Card.Content>
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <List.Item
                key={achievement.id}
                title={achievement.title}
                description={achievement.description}
                left={props => (
                  <Avatar.Icon 
                    {...props} 
                    icon={achievement.icon}
                    size={40}
                    style={styles.achievementIcon}
                  />
                )}
                right={props => (
                  <Text {...props} style={styles.date}>
                    {format(new Date(achievement.date), 'MMM d, yyyy')}
                  </Text>
                )}
              />
            ))
          ) : (
            <Text>No achievements yet. Keep going!</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  achievementIcon: {
    backgroundColor: '#FFD700',
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
}); 