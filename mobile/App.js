import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { GP } from './src/theme/GP';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
    this.setState({ error });
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.errBox}>
          <Text style={styles.errTitle}>App crashed</Text>
          <Text style={styles.errMsg}>{String(this.state.error?.message || this.state.error)}</Text>
          <Text style={styles.errStack}>{String(this.state.error?.stack || '')}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'JetBrainsMono': require('./assets/fonts/JetBrainsMono-Regular.ttf'),
    'SpaceGrotesk': require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Medium': require('./assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GP.bg }}>
        <ActivityIndicator size="large" color={GP.cyan} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </SafeAreaProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errBox: { flex: 1, padding: 20, backgroundColor: '#0a0d12' },
  errTitle: { fontSize: 22, fontWeight: 'bold', color: '#ff3ea5', marginBottom: 12 },
  errMsg: { fontSize: 16, color: '#e6edf7', marginBottom: 16 },
  errStack: { fontSize: 12, color: 'rgba(230,237,247,0.55)', fontFamily: 'monospace' },
});
