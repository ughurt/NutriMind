import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';

const CommunityScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Community
      </Text>
      <View style={styles.content}>
        <Text>Community features coming soon!</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    padding: 16,
  },
  content: {
    padding: 16,
  },
});

export default CommunityScreen; 