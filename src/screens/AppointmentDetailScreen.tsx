import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { database, Appointment, Patient } from '../database/Database';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AppointmentDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { appointmentId } = route.params as { appointmentId: number };
  const queryClient = useQueryClient();

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => database.getAppointment(appointmentId),
  });

  const { data: patient } = useQuery({
    queryKey: ['patient', appointment?.patientId],
    queryFn: () => appointment ? database.getPatient(appointment.patientId) : Promise.resolve(null),
    enabled: !!appointment,
  });

  const toggleCompletedMutation = useMutation({
    mutationFn: (completed: boolean) => database.updateAppointment(appointmentId, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: () => database.deleteAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      navigation.goBack();
    },
  });

  const handleDeleteAppointment = () => {
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete this appointment for ${patient?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAppointmentMutation.mutate(),
        },
      ]
    );
  };

  const handleToggleCompleted = () => {
    if (appointment) {
      toggleCompletedMutation.mutate(!appointment.completed);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading appointment details...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.centerContainer}>
        <Text>Appointment not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Appointment Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.appointmentHeader}>
            <View style={styles.appointmentInfo}>
              <Title style={styles.appointmentTitle}>{appointment.treatmentType}</Title>
              <View style={styles.statusContainer}>
                <Chip
                  mode="outlined"
                  style={[styles.statusChip, appointment.completed && styles.completedChip]}
                  textStyle={appointment.completed ? styles.completedChipText : undefined}
                >
                  {appointment.completed ? 'Completed' : 'Pending'}
                </Chip>
              </View>
            </View>
            <IconButton
              icon="pencil"
              onPress={() => navigation.navigate('AddAppointment' as never, { appointmentId, edit: true } as never)}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Patient Information */}
          {patient && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Patient</Text>
              <View style={styles.patientRow}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientInitials}>
                    {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.patientDetails}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientContact}>{patient.phone}</Text>
                  {patient.email && (
                    <Text style={styles.patientContact}>{patient.email}</Text>
                  )}
                </View>
                <IconButton
                  icon="account"
                  onPress={() => navigation.navigate('PatientDetail' as never, { patientId: patient.id } as never)}
                />
              </View>
            </View>
          )}

          <Divider style={styles.divider} />

          {/* Appointment Details */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Appointment Details</Text>
            
            <View style={styles.detailItem}>
              <Icon name="schedule" size={20} color="#6200ee" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(appointment.date), 'EEEE, MMM dd, yyyy')}
                </Text>
                <Text style={styles.detailValue}>
                  {format(new Date(appointment.date), 'HH:mm')}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="timer" size={20} color="#6200ee" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{appointment.duration} minutes</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="medical-services" size={20} color="#6200ee" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Treatment Type</Text>
                <Text style={styles.detailValue}>{appointment.treatmentType}</Text>
              </View>
            </View>

            {appointment.notes && (
              <View style={styles.detailItem}>
                <Icon name="note" size={20} color="#6200ee" style={styles.detailIcon} />
                <View style={styles.notesContainer}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{appointment.notes}</Text>
                </View>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode={appointment.completed ? "outlined" : "contained"}
          icon={appointment.completed ? "close-circle" : "check-circle"}
          onPress={handleToggleCompleted}
          loading={toggleCompletedMutation.isPending}
          style={styles.actionButton}
        >
          {appointment.completed ? 'Mark as Pending' : 'Mark as Completed'}
        </Button>
        
        {patient && (
          <Button
            mode="outlined"
            icon="file-document-plus"
            onPress={() => navigation.navigate('AddRecord' as never, { patientId: patient.id, appointmentId } as never)}
            style={styles.actionButton}
          >
            Add Treatment Record
          </Button>
        )}
      </View>

      {/* Delete Appointment */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            icon="delete"
            onPress={handleDeleteAppointment}
            loading={deleteAppointmentMutation.isPending}
            buttonColor="#ffebee"
            textColor="#d32f2f"
            style={styles.deleteButton}
          >
            Delete Appointment
          </Button>
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
    padding: 20,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  completedChip: {
    backgroundColor: '#e8f5e8',
  },
  completedChipText: {
    color: '#4caf50',
  },
  divider: {
    marginVertical: 15,
  },
  detailSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 10,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  patientInitials: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  patientContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  detailIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  notesContainer: {
    flex: 1,
  },
  actionButtons: {
    paddingHorizontal: 10,
    gap: 10,
  },
  actionButton: {
    marginBottom: 10,
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
});

export default AppointmentDetailScreen;