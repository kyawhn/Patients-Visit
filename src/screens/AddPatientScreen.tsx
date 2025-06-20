import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { database, Patient } from '../database/Database';
import { format } from 'date-fns';

interface PatientForm {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  address?: string;
  notes?: string;
}

const AddPatientScreen: React.FC = () => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PatientForm>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  const dateOfBirth = watch('dateOfBirth');

  const createPatientMutation = useMutation({
    mutationFn: (patientData: Omit<Patient, 'id'>) => database.createPatient(patientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      Alert.alert('Success', 'Patient added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to add patient. Please try again.');
      console.error('Error creating patient:', error);
    },
  });

  const onSubmit = (data: PatientForm) => {
    const patientData: Omit<Patient, 'id'> = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      dateOfBirth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : undefined,
      address: data.address?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    createPatientMutation.mutate(patientData);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Add New Patient</Title>

          <Controller
            control={control}
            name="name"
            rules={{
              required: 'Patient name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Full Name *"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.name}
                style={styles.input}
                mode="outlined"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name?.message}
          </HelperText>

          <Controller
            control={control}
            name="phone"
            rules={{
              required: 'Phone number is required',
              pattern: {
                value: /^[\+]?[\d\s\-\(\)]{10,}$/,
                message: 'Please enter a valid phone number',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Phone Number *"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.phone}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.phone}>
            {errors.phone?.message}
          </HelperText>

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

          <TextInput
            label="Date of Birth"
            value={dateOfBirth ? format(dateOfBirth, 'MMM dd, yyyy') : ''}
            right={<TextInput.Icon icon="calendar" onPress={() => setDatePickerOpen(true)} />}
            style={styles.input}
            mode="outlined"
            editable={false}
            onPressIn={() => setDatePickerOpen(true)}
          />

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
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Notes"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Any additional notes about the patient..."
              />
            )}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={createPatientMutation.isPending}
              style={styles.button}
            >
              Add Patient
            </Button>
          </View>
        </Card.Content>
      </Card>

      <DatePicker
        modal
        open={datePickerOpen}
        date={dateOfBirth || new Date()}
        mode="date"
        maximumDate={new Date()}
        onConfirm={(date) => {
          setDatePickerOpen(false);
          setValue('dateOfBirth', date);
        }}
        onCancel={() => {
          setDatePickerOpen(false);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#6200ee',
  },
  input: {
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
  },
});

export default AddPatientScreen;