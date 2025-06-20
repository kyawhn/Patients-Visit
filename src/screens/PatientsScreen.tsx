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
  Searchbar, 
  FAB, 
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { database, Patient } from '../database/Database';
import { format } from 'date-fns';

const PatientsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading, refetch } = useQuery({
    queryKey: ['patients', searchQuery],
    queryFn: () => searchQuery ? database.searchPatients(searchQuery) : database.getAllPatients(),
  });

  const deletePatientMutation = useMutation({
    mutationFn: (patientId: number) => database.deletePatient(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setMenuVisible(null);
    },
  });

  const handleDeletePatient = (patient: Patient) => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePatientMutation.mutate(patient.id!),
        },
      ]
    );
  };

  const renderPatientItem = ({ item: patient }: { item: Patient }) => (
    <Card style={styles.patientCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('PatientDetail' as never, { patientId: patient.id } as never)}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientInitials}>
                {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientPhone}>{patient.phone}</Text>
              {patient.email && (
                <Text style={styles.patientEmail}>{patient.email}</Text>
              )}
              {patient.lastVisit && (
                <Text style={styles.lastVisit}>
                  Last visit: {format(new Date(patient.lastVisit), 'MMM dd, yyyy')}
                </Text>
              )}
            </View>
            <Menu
              visible={menuVisible === patient.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(patient.id!)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  navigation.navigate('PatientDetail' as never, { patientId: patient.id, edit: true } as never);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Divider />
              <Menu.Item
                onPress={() => handleDeletePatient(patient)}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>
          {patient.notes && (
            <Text style={styles.patientNotes} numberOfLines={2}>
              {patient.notes}
            </Text>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search patients..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text>Loading patients...</Text>
        </View>
      ) : patients.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No patients found matching your search' : 'No patients registered yet'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first patient
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderPatientItem}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddPatient' as never)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 10,
    elevation: 2,
  },
  listContainer: {
    padding: 10,
  },
  patientCard: {
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: {
    padding: 15,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastVisit: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  patientNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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

export default PatientsScreen;