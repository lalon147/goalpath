import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GP } from '../theme/GP';

import DashboardScreen    from '../screens/main/DashboardScreen';
import GoalsScreen        from '../screens/main/GoalsScreen';
import GoalDetailScreen   from '../screens/main/GoalDetailScreen';
import CreateGoalScreen   from '../screens/main/CreateGoalScreen';
import HabitsScreen       from '../screens/main/HabitsScreen';
import HabitDetailScreen  from '../screens/main/HabitDetailScreen';
import CreateHabitScreen  from '../screens/main/CreateHabitScreen';
import AnalyticsScreen    from '../screens/main/AnalyticsScreen';
import ProfileScreen      from '../screens/main/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ITEMS = [
  { name: 'HOME',  index: 0 },
  { name: 'PATH',  index: 1 },
  { name: 'LOG',   index: 2 },
  { name: 'COACH', index: 3 },
  { name: 'YOU',   index: 4 },
];

function HUDTabIcon({ label, focused }) {
  return (
    <View style={styles.tabItem}>
      <View style={[
        styles.tabDot,
        label === 'LOG' && { borderRadius: 8 },
        focused && { borderColor: GP.cyan, backgroundColor: 'rgba(77,227,255,0.1)' },
      ]} />
      <Text style={[styles.tabLabel, focused && { color: GP.cyan }]}>{label}</Text>
    </View>
  );
}

function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsList"   component={GoalsScreen} />
      <Stack.Screen name="GoalDetail"  component={GoalDetailScreen} />
      <Stack.Screen name="CreateGoal"  component={CreateGoalScreen} />
    </Stack.Navigator>
  );
}

function HabitsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HabitsList"  component={HabitsScreen} />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
      <Stack.Screen name="CreateHabit" component={CreateHabitScreen} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <HUDTabIcon label="HOME" focused={focused} /> }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsStack}
        options={{ tabBarIcon: ({ focused }) => <HUDTabIcon label="PATH" focused={focused} /> }}
      />
      <Tab.Screen
        name="Habits"
        component={HabitsStack}
        options={{ tabBarIcon: ({ focused }) => <HUDTabIcon label="LOG" focused={focused} /> }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarIcon: ({ focused }) => <HUDTabIcon label="COACH" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <HUDTabIcon label="YOU" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: GP.bg,
    borderTopColor: GP.line,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabDot: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 2,
  },
  tabLabel: {
    fontFamily: GP.mono,
    fontSize: 7,
    letterSpacing: 1,
    color: GP.inkMute,
    textTransform: 'uppercase',
  },
});
