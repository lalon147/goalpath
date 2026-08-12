import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator, View } from 'react-native';
import { loadUser } from '../redux/slices/authSlice';
import { syncRemindersFromPreferences } from '../services/notifications';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import RecoveryCodeScreen from '../screens/auth/RecoveryCodeScreen';
import { Colors } from '../constants/colors';

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, initializing, user, recoveryCode } = useSelector((state) => state.auth);

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

  // A freshly signed-up account is already authenticated, so without this the
  // main app would replace the signup screen instantly and the one-time
  // recovery code would never be seen. It stands in front of everything until
  // the user confirms they have saved it.
  if (isAuthenticated && recoveryCode) {
    return <RecoveryCodeScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
