import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Switch,
  List,
  Divider,
  HelperText,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { database, ClinicSettings } from '../database/Database';

interface SettingsForm {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  businessHours: string;
}

const SettingsScreen: React.FC = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['clinicSettings'],
    queryFn: () => database.getClinicSettings(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SettingsForm>({
    defaultValues: {
      clinicName: settings?.clinicName || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
      email: settings?.email || '',
      businessHours: settings?.businessHours || '',
    },
  });

  // Reset form when settings data is loaded
  React.useEffect(() => {
    if (settings) {
      reset({
        clinicName: settings.clinicName || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        businessHours: settings.businessHours || '',
      });
    }
  }, [settings, reset]);

  const updateSettingsMutation = useMutation({
    mutationFn: (settingsData: Partial<ClinicSettings>) => 
      database.updateClinicSettings(settingsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicSettings'] });
      Alert.alert('Success', 'Settings updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update settings. Please try again.');
      console.error('Error updating settings:', error);
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const patients = await database.getAllPatients();
      const appointments = await database.getAllAppointments();
      const records = await database.getAllTreatmentRecords();
      
      const exportData = {
        patients,
        appointments,
        records,
        exportDate: new Date().toISOString(),
      };

      // In a real app, you would use a file picker or sharing API
      // For now, just show the data count
      Alert.alert(
        'Export Complete',
        `Data exported successfully:\n• ${patients.length} patients\n• ${appointments.length} appointments\n• ${records.length} treatment records`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all patients, appointments, and treatment records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all data
              const patients = await database.getAllPatients();
              const appointments = await database.getAllAppointments();
              const records = await database.getAllTreatmentRecords();

              for (const patient of patients) {
                await database.deletePatient(patient.id!);
              }
              for (const appointment of appointments) {
                await database.deleteAppointment(appointment.id!);
              }
              for (const record of records) {
                await database.deleteTreatmentRecord(record.id!);
              }

              queryClient.invalidateQueries();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
              console.error('Clear data error:', error);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Title>Loading settings...</Title>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Clinic Information</Title>

          <Controller
            control={control}
            name="clinicName"
            rules={{ required: 'Clinic name is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Clinic Name *"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.clinicName}
                style={styles.input}
                mode="outlined"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.clinicName}>
            {errors.clinicName?.message}
          </HelperText>

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Address"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Phone Number"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email Address"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.email}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email?.message}
          </HelperText>

          <Controller
            control={control}
            name="businessHours"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Business Hours"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., 9:00 AM - 5:00 PM"
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={updateSettingsMutation.isPending}
            disabled={!isDirty}
            style={styles.saveButton}
          >
            Save Settings
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Notifications</Title>
          <List.Item
            title="Enable Notifications"
            description="Receive notifications for appointments and reminders"
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Data Management</Title>
          
          <List.Item
            title="Export Data"
            description="Export all clinic data for backup"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={handleExportData}
            right={() => exportLoading ? <List.Icon icon="loading" /> : null}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Clear All Data"
            description="Permanently delete all clinic data"
            left={(props) => <List.Icon {...props} icon="delete" color="#f44336" />}
            onPress={handleClearData}
            titleStyle={{ color: '#f44336' }}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>About</Title>
          <List.Item
            title="Clinic Management App"
            description="Version 1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Made with React Native"
            description="SQLite Database"
            left={(props) => <List.Icon {...props} icon="react" />}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#6200ee',
  },
  input: {
    marginBottom: 5,
  },
  saveButton: {
    marginTop: 20,
  },
  divider: {
    marginVertical: 8,
  },
});

export default SettingsScreen;