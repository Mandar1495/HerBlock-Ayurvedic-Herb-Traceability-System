import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, Text, View, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';

// Global error handler for fatal JS errors
const globalErrorHandler = (error, isFatal) => {
  console.log('GLOBAL ERROR:', error);
  Alert.alert('Fatal Error', String(error?.message || error), [{ text: 'OK' }]);
};
if (global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler(globalErrorHandler);
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fee2e2', paddingTop: 50 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#991b1b', marginBottom: 10 }}>App Crashed</Text>
          <ScrollView>
            <Text style={{ fontSize: 14, color: '#7f1d1d' }}>{String(this.state.error?.message || this.state.error)}</Text>
            <Text style={{ fontSize: 10, color: '#7f1d1d', marginTop: 10 }}>{this.state.error?.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

// Screens
import CollectionScreen from './src/screens/CollectionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import FarmSetupScreen from './src/screens/FarmSetupScreen';
import PendingSyncScreen from './src/screens/PendingSyncScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Store
import { useAuthStore } from './src/store/authStore';
import { useSyncStore } from './src/store/syncStore';

// Database
import { initDatabase } from './src/database/db';

// Icons (using text for now, replace with expo-vector-icons)
const TabIcon = ({ name, focused }) => (
  <Text style={{ fontSize: 20 }}>{name}</Text>
);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator (after login)
function MainTabs() {
  const pendingCount = useSyncStore(state => state.pendingCollections.length);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        headerStyle: { backgroundColor: '#10B981' },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
          title: 'HerBlock',
        }}
      />
      <Tab.Screen 
        name="Collect" 
        component={CollectionScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="📍" focused={focused} />,
          title: 'New Collection',
        }}
      />
      <Tab.Screen 
        name="Pending" 
        component={PendingSyncScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="⏳" focused={focused} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          title: 'Pending Sync',
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="📋" focused={focused} />,
          title: 'History',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="⚙️" focused={focused} />,
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  // Initialize database on app start
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        console.log('Database initialized');
      } catch (error) {
        console.error('Database init failed:', error);
        Alert.alert('Error', 'Failed to initialize local storage');
      }
    };
    init();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isLoggedIn ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
              <Stack.Group>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="FarmSetup" component={FarmSetupScreen} options={{ presentation: 'modal' }} />
              </Stack.Group>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
