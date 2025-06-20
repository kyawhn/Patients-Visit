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
  Switch,
  Text,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { database, TreatmentRecord, Patient } from '../database/Database';
import { format } from 'date-fns';

interface RecordForm {
  patientId: number;
  date: Date;
  treatmentType: string;
  notes?: string;
  followUpNeeded: boolean;
  followUpDate?: Date;
}

const AddRecordScreen: React.FC = () => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [followUpDatePickerOpen, setFollowUpDatePickerOpen] = useState(false);
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
  } = useForm<RecordForm>({
    defaultValues: {
      patientId: initialPatientId || 0,
      date: new Date(),
      treatmentType: '',
      notes: '',
      followUpNeeded: false,
    },
  });

  const recordDate = watch('date');
  const followUpNeeded = watch('followUpNeeded');
  const followUpDate = watch('followUpDate');

  const createRecordMutation = useMutation({
    mutationFn: (recordData: Omit<TreatmentRecord, 'id'>) => database.createTreatmentRecord(recordData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentRecords'] });
      queryClient.invalidateQueries({ queryKey: ['patientRecords'] });
      Alert.alert('Success', 'Treatment record added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to add treatment record. Please try again.');
      console.error('Error creating record:', error);
    },
  });

  const onSubmit = (data: RecordForm) => {
    const recordData: Omit<TreatmentRecord, 'id'> = {
      patientId: data.patientId,
      date: data.date.toISOString(),
      treatmentType: data.treatmentType.trim(),
      notes: data.notes?.trim() || undefined,
      followUpNeeded: data.followUpNeeded,
      followUpDate: data.followUpNeeded && data.followUpDate ? data.followUpDate.toISOString() : undefined,
    };

    createRecordMutation.mutate(recordData);
  };

  const treatmentTypes = [
    'Initial Assessment',
    'Follow-up Consultation',
    'Therapy Session',
    'Treatment Session',
    'Surgical Procedure',
    'Medication Review',
    'Emergency Care',
    'Diagnostic Test',
    'Vaccination',
    'Rehabilitation',
    'Counseling',
    'Other',
  ];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Add Treatment Record</Title>

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
            value={format(recordDate, 'MMM dd, yyyy HH:mm')}
            right={<TextInput.Icon icon="calendar" onPress={() => setDatePickerOpen(true)} />}
            style={styles.input}
            mode="outlined"
            editable={false}
            onPressIn={() => setDatePickerOpen(true)}
          />

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
                label="Treatment Notes"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={6}
                placeholder="Detailed treatment notes, observations, medications prescribed, etc."
              />
            )}
          />

          <View style={styles.switchContainer}>
            <Controller
              control={control}
              name="followUpNeeded"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Follow-up Required</Text>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                  />
                </View>
              )}
            />
          </View>

          {followUpNeeded && (
            <TextInput
              label="Follow-up Date"
              value={followUpDate ? format(followUpDate, 'MMM dd, yyyy') : ''}
              right={<TextInput.Icon icon="calendar" onPress={() => setFollowUpDatePickerOpen(true)} />}
              style={styles.input}
              mode="outlined"
              editable={false}
              onPressIn={() => setFollowUpDatePickerOpen(true)}
              placeholder="Select follow-up date"
            />
          )}

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
              loading={createRecordMutation.isPending}
              style={styles.button}
            >
              Save Record
            </Button>
          </View>
        </Card.Content>
      </Card>

      <DatePicker
        modal
        open={datePickerOpen}
        date={recordDate}
        mode="datetime"
        maximumDate={new Date()}
        onConfirm={(date) => {
          setDatePickerOpen(false);
          setValue('date', date);
        }}
        onCancel={() => {
          setDatePickerOpen(false);
        }}
      />

      <DatePicker
        modal
        open={followUpDatePickerOpen}
        date={followUpDate || new Date()}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => {
          setFollowUpDatePickerOpen(false);
          setValue('followUpDate', date);
        }}
        onCancel={() => {
          setFollowUpDatePickerOpen(false);
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
    marginBottom: 10,
  },
  pickerContainer: {
    marginBottom: 10,
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
  switchContainer: {
    marginVertical: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
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

export default AddRecordScreen;