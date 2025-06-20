import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { 
  Card, 
  FAB, 
  IconButton,
  Menu,
  Divider,
  Chip,
  Button,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { database, Appointment, Patient } from '../database/Database';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

const AppointmentsScreen: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments', filter],
    queryFn: async () => {
      const allAppointments = await database.getAllAppointments();
      const now = new Date();
      
      switch (filter) {
        case 'today':
          return database.getTodayAppointments();
        case 'upcoming':
          return allAppointments.filter(apt => new Date(apt.date) > now && !apt.completed);
        case 'completed':
          return allAppointments.filter(apt => apt.completed);
        default:
          return allAppointments;
      }
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => database.getAllPatients(),
  });

  const toggleCompletedMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      database.updateAppointment(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setMenuVisible(null);
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (appointmentId: number) => database.deleteAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setMenuVisible(null);
    },
  });

  const handleDeleteAppointment = (appointment: Appointment) => {
    const patient = patients.find(p => p.id === appointment.patientId);
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete the appointment for ${patient?.name || 'Unknown Patient'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAppointmentMutation.mutate(appointment.id!),
        },
      ]
    );
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return `Today, ${format(date, 'HH:mm')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, 'HH:mm')}`;
    return format(date, 'MMM dd, HH:mm');
  };

  const renderAppointmentItem = ({ item: appointment }: { item: Appointment }) => (
    <Card style={[styles.appointmentCard, appointment.completed && styles.completedCard]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('AppointmentDetail' as never, { appointmentId: appointment.id } as never)}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.appointmentHeader}>
            <View style={styles.appointmentInfo}>
              <Text style={styles.patientName}>{getPatientName(appointment.patientId)}</Text>
              <Text style={styles.appointmentDate}>{formatAppointmentDate(appointment.date)}</Text>
              <Text style={styles.treatmentType}>{appointment.treatmentType}</Text>
              <Text style={styles.duration}>{appointment.duration} minutes</Text>
            </View>
            <View style={styles.appointmentActions}>
              <Chip 
                mode="outlined" 
                style={[styles.statusChip, appointment.completed && styles.completedChip]}
                textStyle={appointment.completed ? styles.completedChipText : undefined}
              >
                {appointment.completed ? 'Completed' : 'Pending'}
              </Chip>
              <Menu
                visible={menuVisible === appointment.id}
                onDismiss={() => setMenuVisible(null)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    onPress={() => setMenuVisible(appointment.id!)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    navigation.navigate('AppointmentDetail' as never, { appointmentId: appointment.id, edit: true } as never);
                  }}
                  title="Edit"
                  leadingIcon="pencil"
                />
                <Menu.Item
                  onPress={() => {
                    toggleCompletedMutation.mutate({
                      id: appointment.id!,
                      completed: !appointment.completed,
                    });
                  }}
                  title={appointment.completed ? 'Mark as Pending' : 'Mark as Completed'}
                  leadingIcon={appointment.completed ? 'close-circle' : 'check-circle'}
                />
                <Divider />
                <Menu.Item
                  onPress={() => handleDeleteAppointment(appointment)}
                  title="Delete"
                  leadingIcon="delete"
                />
              </Menu>
            </View>
          </View>
          {appointment.notes && (
            <Text style={styles.appointmentNotes} numberOfLines={2}>
              {appointment.notes}
            </Text>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Button
          mode={filter === 'all' ? 'contained' : 'outlined'}
          onPress={() => setFilter('all')}
          style={styles.filterButton}
          compact
        >
          All
        </Button>
        <Button
          mode={filter === 'today' ? 'contained' : 'outlined'}
          onPress={() => setFilter('today')}
          style={styles.filterButton}
          compact
        >
          Today
        </Button>
        <Button
          mode={filter === 'upcoming' ? 'contained' : 'outlined'}
          onPress={() => setFilter('upcoming')}
          style={styles.filterButton}
          compact
        >
          Upcoming
        </Button>
        <Button
          mode={filter === 'completed' ? 'contained' : 'outlined'}
          onPress={() => setFilter('completed')}
          style={styles.filterButton}
          compact
        >
          Completed
        </Button>
      </View>
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text>Loading appointments...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            No appointments found
          </Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to schedule your first appointment
          </Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderAppointmentItem}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddAppointment' as never)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
  },
  filterButton: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
  },
  appointmentCard: {
    marginBottom: 10,
    elevation: 2,
  },
  completedCard: {
    opacity: 0.7,
  },
  cardContent: {
    padding: 15,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentActions: {
    alignItems: 'flex-end',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '500',
    marginBottom: 4,
  },
  treatmentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  duration: {
    fontSize: 12,
    color: '#999',
  },
  appointmentNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statusChip: {
    marginBottom: 8,
  },
  completedChip: {
    backgroundColor: '#e8f5e8',
  },
  completedChipText: {
    color: '#4caf50',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default AppointmentsScreen;