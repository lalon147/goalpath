import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator, View } from 'react-native';
import { loadUser } from '../redux/slices/authSlice';
import { syncRemindersFromPreferences } from '../services/notifications';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { Colors } from '../constants/colors';

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, initializing, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, []);

  // A scheduled local notification does not survive reinstalling the app or
  // signing in on a new device, so re-arm it from the saved preferences once
  // the profile is loaded. This never prompts; it only restores what the user
  // already agreed to.
  useEffect(() => {
    if (isAuthenticated && user?.preferences) {
      syncRemindersFromPreferences(user.preferences).catch(() => {});
    }
  }, [isAuthenticated, user?.preferences]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0d12' }}>
        <ActivityIndicator size="large" color="#4de3ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
