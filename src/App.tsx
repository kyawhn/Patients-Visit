import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { database } from './database/Database';
import DashboardScreen from './screens/DashboardScreen';
import PatientsScreen from './screens/PatientsScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import RecordsScreen from './screens/RecordsScreen';
import SettingsScreen from './screens/SettingsScreen';
import PatientDetailScreen from './screens/PatientDetailScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import RecordDetailScreen from './screens/RecordDetailScreen';
import AddPatientScreen from './screens/AddPatientScreen';
import AddAppointmentScreen from './screens/AddAppointmentScreen';
import AddRecordScreen from './screens/AddRecordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

const PatientsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="PatientsList" component={PatientsScreen} options={{ title: 'Patients' }} />
    <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient Details' }} />
    <Stack.Screen name="AddPatient" component={AddPatientScreen} options={{ title: 'Add Patient' }} />
  </Stack.Navigator>
);

const AppointmentsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AppointmentsList" component={AppointmentsScreen} options={{ title: 'Appointments' }} />
    <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment Details' }} />
    <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} options={{ title: 'Add Appointment' }} />
  </Stack.Navigator>
);

const RecordsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="RecordsList" component={RecordsScreen} options={{ title: 'Treatment Records' }} />
    <Stack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ title: 'Record Details' }} />
    <Stack.Screen name="AddRecord" component={AddRecordScreen} options={{ title: 'Add Record' }} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        switch (route.name) {
          case 'Dashboard':
            iconName = 'dashboard';
            break;
          case 'Patients':
            iconName = 'people';
            break;
          case 'Appointments':
            iconName = 'event';
            break;
          case 'Records':
            iconName = 'description';
            break;
          case 'Settings':
            iconName = 'settings';
            break;
          default:
            iconName = 'circle';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6200ee',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Patients" component={PatientsStack} options={{ headerShown: false }} />
    <Tab.Screen name="Appointments" component={AppointmentsStack} options={{ headerShown: false }} />
    <Tab.Screen name="Records" component={RecordsStack} options={{ headerShown: false }} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const App: React.FC = () => {
  useEffect(() => {
    // Initialize database when app starts
    database.openDatabase().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
};

export default App;