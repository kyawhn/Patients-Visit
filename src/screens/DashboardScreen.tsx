import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { database, Patient, Appointment } from '../database/Database';
import { format } from 'date-fns';

const DashboardScreen: React.FC = () => {
  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => database.getAllPatients(),
  });

  const { data: todayAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['todayAppointments'],
    queryFn: () => database.getTodayAppointments(),
  });

  const { data: allAppointments = [] } = useQuery({
    queryKey: ['allAppointments'],
    queryFn: () => database.getAllAppointments(),
  });

  const upcomingAppointments = allAppointments.filter(
    (apt: Appointment) => new Date(apt.date) > new Date() && !apt.completed
  ).slice(0, 5);

  const completedTodayCount = todayAppointments.filter((apt: Appointment) => apt.completed).length;
  const pendingTodayCount = todayAppointments.filter((apt: Appointment) => !apt.completed).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Dashboard</Title>
        <Text style={styles.subtitle}>Welcome to your clinic management system</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="people" size={32} color="#6200ee" />
            <View style={styles.statText}>
              <Title style={styles.statNumber}>{patients.length}</Title>
              <Paragraph>Total Patients</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="event" size={32} color="#03dac6" />
            <View style={styles.statText}>
              <Title style={styles.statNumber}>{todayAppointments.length}</Title>
              <Paragraph>Today's Appointments</Paragraph>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="check-circle" size={32} color="#4caf50" />
            <View style={styles.statText}>
              <Title style={styles.statNumber}>{completedTodayCount}</Title>
              <Paragraph>Completed Today</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="schedule" size={32} color="#ff9800" />
            <View style={styles.statText}>
              <Title style={styles.statNumber}>{pendingTodayCount}</Title>
              <Paragraph>Pending Today</Paragraph>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Today's Appointments */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title>Today's Appointments</Title>
          {appointmentsLoading ? (
            <Paragraph>Loading appointments...</Paragraph>
          ) : todayAppointments.length > 0 ? (
            todayAppointments.map((appointment: Appointment) => (
              <View key={appointment.id} style={styles.appointmentItem}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTime}>
                    {format(new Date(appointment.date), 'HH:mm')}
                  </Text>
                  <Text style={styles.appointmentType}>{appointment.treatmentType}</Text>
                  <Text style={styles.appointmentDuration}>{appointment.duration} min</Text>
                </View>
                <Icon 
                  name={appointment.completed ? "check-circle" : "schedule"} 
                  size={24} 
                  color={appointment.completed ? "#4caf50" : "#ff9800"} 
                />
              </View>
            ))
          ) : (
            <Paragraph>No appointments scheduled for today</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Recent Patients */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title>Recent Patients</Title>
          {patientsLoading ? (
            <Paragraph>Loading patients...</Paragraph>
          ) : patients.slice(0, 5).map((patient: Patient) => (
            <TouchableOpacity key={patient.id} style={styles.patientItem}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientInitials}>
                  {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientPhone}>{patient.phone}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>

      {/* Upcoming Appointments */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title>Upcoming Appointments</Title>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment: Appointment) => (
              <View key={appointment.id} style={styles.appointmentItem}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentDate}>
                    {format(new Date(appointment.date), 'MMM dd, HH:mm')}
                  </Text>
                  <Text style={styles.appointmentType}>{appointment.treatmentType}</Text>
                </View>
                <Icon name="arrow-forward" size={20} color="#666" />
              </View>
            ))
          ) : (
            <Paragraph>No upcoming appointments</Paragraph>
          )}
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
  header: {
    padding: 20,
    backgroundColor: '#6200ee',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  statText: {
    marginLeft: 15,
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  sectionCard: {
    margin: 10,
    elevation: 2,
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  appointmentDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInitials: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  patientPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default DashboardScreen;