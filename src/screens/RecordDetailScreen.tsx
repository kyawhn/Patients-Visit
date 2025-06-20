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
  Button,
  Divider,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { database, TreatmentRecord, Patient } from '../database/Database';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RecordDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { recordId } = route.params as { recordId: number };
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useQuery({
    queryKey: ['treatmentRecord', recordId],
    queryFn: () => database.getTreatmentRecord(recordId),
  });

  const { data: patient } = useQuery({
    queryKey: ['patient', record?.patientId],
    queryFn: () => record ? database.getPatient(record.patientId) : Promise.resolve(null),
    enabled: !!record,
  });

  const deleteRecordMutation = useMutation({
    mutationFn: () => database.deleteTreatmentRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentRecords'] });
      navigation.goBack();
    },
  });

  const handleDeleteRecord = () => {
    Alert.alert(
      'Delete Treatment Record',
      `Are you sure you want to delete this treatment record for ${patient?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRecordMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading treatment record...</Text>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.centerContainer}>
        <Text>Treatment record not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Record Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.recordHeader}>
            <View style={styles.recordInfo}>
              <Title style={styles.recordTitle}>{record.treatmentType}</Title>
              <Text style={styles.recordDate}>
                {format(new Date(record.date), 'EEEE, MMM dd, yyyy HH:mm')}
              </Text>
              {record.followUpNeeded && (
                <View style={styles.followUpContainer}>
                  <Chip 
                    mode="outlined" 
                    icon="calendar-clock" 
                    style={styles.followUpChip}
                    textStyle={styles.followUpText}
                  >
                    Follow-up required
                  </Chip>
                </View>
              )}
            </View>
            <IconButton
              icon="pencil"
              onPress={() => navigation.navigate('AddRecord' as never, { recordId, edit: true } as never)}
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

          {/* Treatment Details */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Treatment Details</Text>
            
            <View style={styles.detailItem}>
              <Icon name="medical-services" size={20} color="#6200ee" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Treatment Type</Text>
                <Text style={styles.detailValue}>{record.treatmentType}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="schedule" size={20} color="#6200ee" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(record.date), 'EEEE, MMM dd, yyyy')}
                </Text>
                <Text style={styles.detailValue}>
                  {format(new Date(record.date), 'HH:mm')}
                </Text>
              </View>
            </View>

            {record.followUpNeeded && (
              <View style={styles.detailItem}>
                <Icon name="event" size={20} color="#ff9800" style={styles.detailIcon} />
                <View>
                  <Text style={styles.detailLabel}>Follow-up Required</Text>
                  {record.followUpDate ? (
                    <Text style={styles.detailValue}>
                      {format(new Date(record.followUpDate), 'MMM dd, yyyy')}
                    </Text>
                  ) : (
                    <Text style={styles.detailValue}>Date to be scheduled</Text>
                  )}
                </View>
              </View>
            )}

            {record.notes && (
              <View style={styles.detailItem}>
                <Icon name="note" size={20} color="#6200ee" style={styles.detailIcon} />
                <View style={styles.notesContainer}>
                  <Text style={styles.detailLabel}>Treatment Notes</Text>
                  <Text style={styles.detailValue}>{record.notes}</Text>
                </View>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {record.followUpNeeded && patient && (
          <Button
            mode="contained"
            icon="calendar-plus"
            onPress={() => navigation.navigate('AddAppointment' as never, { 
              patientId: patient.id, 
              treatmentType: 'Follow-up Visit',
              notes: `Follow-up for ${record.treatmentType}` 
            } as never)}
            style={styles.actionButton}
          >
            Schedule Follow-up
          </Button>
        )}
        
        {patient && (
          <Button
            mode="outlined"
            icon="file-document-plus"
            onPress={() => navigation.navigate('AddRecord' as never, { patientId: patient.id } as never)}
            style={styles.actionButton}
          >
            Add New Record
          </Button>
        )}
      </View>

      {/* Delete Record */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            icon="delete"
            onPress={handleDeleteRecord}
            loading={deleteRecordMutation.isPending}
            buttonColor="#ffebee"
            textColor="#d32f2f"
            style={styles.deleteButton}
          >
            Delete Treatment Record
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '500',
    marginBottom: 8,
  },
  followUpContainer: {
    marginTop: 8,
  },
  followUpChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e0',
  },
  followUpText: {
    color: '#ff9800',
    fontSize: 12,
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

export default RecordDetailScreen;