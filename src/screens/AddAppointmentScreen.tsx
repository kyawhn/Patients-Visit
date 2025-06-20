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
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { database, Appointment, Patient } from '../database/Database';
import { format } from 'date-fns';

interface AppointmentForm {
  patientId: number;
  date: Date;
  duration: number;
  treatmentType: string;
  notes?: string;
}

const AddAppointmentScreen: React.FC = () => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId: initialPatientId } = (route.params as { patientId?: number }) || {};
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => database.getAllPatients(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AppointmentForm>({
    defaultValues: {
      patientId: initialPatientId || 0,
      date: new Date(),
      duration: 30,
      treatmentType: '',
      notes: '',
    },
  });

  const appointmentDate = watch('date');

  const createAppointmentMutation = useMutation({
    mutationFn: (appointmentData: Omit<Appointment, 'id'>) => database.createAppointment(appointmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patientAppointments'] });
      Alert.alert('Success', 'Appointment scheduled successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to schedule appointment. Please try again.');
      console.error('Error creating appointment:', error);
    },
  });

  const onSubmit = (data: AppointmentForm) => {
    const appointmentData: Omit<Appointment, 'id'> = {
      patientId: data.patientId,
      date: data.date.toISOString(),
      duration: data.duration,
      treatmentType: data.treatmentType.trim(),
      notes: data.notes?.trim() || undefined,
      completed: false,
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  const treatmentTypes = [
    'Initial Consultation',
    'Follow-up Visit',
    'Annual Check-up',
    'Dental Cleaning',
    'X-Ray',
    'Blood Test',
    'Vaccination',
    'Physical Therapy',
    'Surgery Consultation',
    'Emergency Visit',
    'Other',
  ];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Schedule New Appointment</Title>

          <Controller
            control={control}
            name="patientId"
            rules={{ validate: (value) => value > 0 || 'Please select a patient' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.pickerContainer}>
                <HelperText type="info" style={styles.pickerLabel}>
                  Patient *
                </HelperText>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a patient..." value={0} />
                  {patients.map((patient: Patient) => (
                    <Picker.Item
                      key={patient.id}
                      label={`${patient.name} - ${patient.phone}`}
                      value={patient.id!}
                    />
                  ))}
                </Picker>
              </View>
            )}
          />
          <HelperText type="error" visible={!!errors.patientId}>
            {errors.patientId?.message}
          </HelperText>

          <TextInput
            label="Date & Time *"
            value={format(appointmentDate, 'MMM dd, yyyy HH:mm')}
            right={<TextInput.Icon icon="calendar" onPress={() => setDatePickerOpen(true)} />}
            style={styles.input}
            mode="outlined"
            editable={false}
            onPressIn={() => setDatePickerOpen(true)}
          />

          <Controller
            control={control}
            name="duration"
            rules={{
              required: 'Duration is required',
              min: { value: 15, message: 'Minimum duration is 15 minutes' },
              max: { value: 480, message: 'Maximum duration is 8 hours' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Duration (minutes) *"
                value={value.toString()}
                onBlur={onBlur}
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                error={!!errors.duration}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.duration}>
            {errors.duration?.message}
          </HelperText>

          <Controller
            control={control}
            name="treatmentType"
            rules={{ required: 'Treatment type is required' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.pickerContainer}>
                <HelperText type="info" style={styles.pickerLabel}>
                  Treatment Type *
                </HelperText>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.picker}
                >
                  <Picker.Item label="Select treatment type..." value="" />
                  {treatmentTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            )}
          />
          <HelperText type="error" visible={!!errors.treatmentType}>
            {errors.treatmentType?.message}
          </HelperText>

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
                placeholder="Any special instructions or notes..."
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
              loading={createAppointmentMutation.isPending}
              style={styles.button}
            >
              Schedule
            </Button>
          </View>
        </Card.Content>
      </Card>

      <DatePicker
        modal
        open={datePickerOpen}
        date={appointmentDate}
        mode="datetime"
        minimumDate={new Date()}
        onConfirm={(date) => {
          setDatePickerOpen(false);
          setValue('date', date);
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
  pickerContainer: {
    marginBottom: 5,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
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

export default AddAppointmentScreen;