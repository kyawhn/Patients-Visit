import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  List,
  IconButton,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { database, Patient, Appointment, TreatmentRecord } from '../database/Database';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PatientDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId } = route.params as { patientId: number };
  const queryClient = useQueryClient();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => database.getPatient(patientId),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patientAppointments', patientId],
    queryFn: () => database.getAppointmentsByPatient(patientId),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['patientRecords', patientId],
    queryFn: () => database.getTreatmentRecordsByPatient(patientId),
  });

  const deletePatientMutation = useMutation({
    mutationFn: () => database.deletePatient(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigation.goBack();
    },
  });

  const handleDeletePatient = () => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient?.name}? This will also delete all appointments and treatment records for this patient.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePatientMutation.mutate(),
        },
      ]
    );
  };

  const handleCallPatient = () => {
    if (patient?.phone) {
      Alert.alert(
        'Call Patient',
        `Call ${patient.name} at ${patient.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => console.log('Call patient') },
        ]
      );
    }
  };

  const upcomingAppointments = appointments.filter(
    apt => new Date(apt.date) > new Date() && !apt.completed
  );

  const recentRecords = records.slice(0, 5);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading patient details...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.centerContainer}>
        <Text>Patient not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Patient Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientInitials}>
                {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Title style={styles.patientName}>{patient.name}</Title>
              <View style={styles.contactInfo}>
                <TouchableOpacity onPress={handleCallPatient} style={styles.contactItem}>
                  <Icon name="phone" size={20} color="#6200ee" />
                  <Text style={styles.contactText}>{patient.phone}</Text>
                </TouchableOpacity>
                {patient.email && (
                  <View style={styles.contactItem}>
                    <Icon name="email" size={20} color="#6200ee" />
                    <Text style={styles.contactText}>{patient.email}</Text>
                  </View>
                )}
              </View>
            </View>
            <IconButton
              icon="pencil"
              onPress={() => navigation.navigate('AddPatient' as never, { patientId, edit: true } as never)}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Patient Details */}
          {patient.dateOfBirth && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date of Birth:</Text>
              <Text style={styles.detailValue}>
                {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}

          {patient.address && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{patient.address}</Text>
            </View>
          )}

          {patient.lastVisit && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Last Visit:</Text>
              <Text style={styles.detailValue}>
                {format(new Date(patient.lastVisit), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}

          {patient.notes && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{patient.notes}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          icon="calendar-plus"
          onPress={() => navigation.navigate('AddAppointment' as never, { patientId } as never)}
          style={styles.actionButton}
        >
          New Appointment
        </Button>
        <Button
          mode="outlined"
          icon="file-document-plus"
          onPress={() => navigation.navigate('AddRecord' as never, { patientId } as never)}
          style={styles.actionButton}
        >
          Add Record
        </Button>
      </View>

      {/* Upcoming Appointments */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Upcoming Appointments ({upcomingAppointments.length})</Title>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment: Appointment) => (
              <TouchableOpacity
                key={appointment.id}
                onPress={() => navigation.navigate('AppointmentDetail' as never, { appointmentId: appointment.id } as never)}
              >
                <List.Item
                  title={appointment.treatmentType}
                  description={`${format(new Date(appointment.date), 'MMM dd, yyyy HH:mm')} • ${appointment.duration} min`}
                  left={(props) => <List.Icon {...props} icon="calendar" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                />
              </TouchableOpacity>
            ))
          ) : (
            <Paragraph>No upcoming appointments</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Recent Treatment Records */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Treatment Records ({records.length})</Title>
          {recentRecords.length > 0 ? (
            recentRecords.map((record: TreatmentRecord) => (
              <TouchableOpacity
                key={record.id}
                onPress={() => navigation.navigate('RecordDetail' as never, { recordId: record.id } as never)}
              >
                <List.Item
                  title={record.treatmentType}
                  description={format(new Date(record.date), 'MMM dd, yyyy')}
                  left={(props) => <List.Icon {...props} icon="file-document" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                />
              </TouchableOpacity>
            ))
          ) : (
            <Paragraph>No treatment records</Paragraph>
          )}
          {records.length > 5 && (
            <Button
              mode="text"
              onPress={() => navigation.navigate('Records' as never)}
              style={styles.viewAllButton}
            >
              View All Records ({records.length})
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Delete Patient */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            icon="delete"
            onPress={handleDeletePatient}
            buttonColor="#ffebee"
            textColor="#d32f2f"
            style={styles.deleteButton}
          >
            Delete Patient
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
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  patientInitials: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactInfo: {
    gap: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#666',
  },
  divider: {
    marginVertical: 15,
  },
  detailItem: {
    marginBottom: 10,
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  viewAllButton: {
    marginTop: 10,
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
});

export default PatientDetailScreen;