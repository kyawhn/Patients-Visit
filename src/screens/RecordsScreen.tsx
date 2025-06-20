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
  Chip,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { database, TreatmentRecord, Patient } from '../database/Database';
import { format } from 'date-fns';

const RecordsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['treatmentRecords', searchQuery],
    queryFn: () => searchQuery ? database.searchTreatmentRecords(searchQuery) : database.getAllTreatmentRecords(),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => database.getAllPatients(),
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (recordId: number) => database.deleteTreatmentRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentRecords'] });
      setMenuVisible(null);
    },
  });

  const handleDeleteRecord = (record: TreatmentRecord) => {
    const patient = patients.find(p => p.id === record.patientId);
    Alert.alert(
      'Delete Treatment Record',
      `Are you sure you want to delete this treatment record for ${patient?.name || 'Unknown Patient'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRecordMutation.mutate(record.id!),
        },
      ]
    );
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  };

  const renderRecordItem = ({ item: record }: { item: TreatmentRecord }) => (
    <Card style={styles.recordCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('RecordDetail' as never, { recordId: record.id } as never)}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.recordHeader}>
            <View style={styles.recordInfo}>
              <Text style={styles.patientName}>{getPatientName(record.patientId)}</Text>
              <Text style={styles.recordDate}>{format(new Date(record.date), 'MMM dd, yyyy HH:mm')}</Text>
              <Text style={styles.treatmentType}>{record.treatmentType}</Text>
              {record.followUpNeeded && (
                <View style={styles.followUpContainer}>
                  <Chip 
                    mode="outlined" 
                    icon="calendar-clock" 
                    style={styles.followUpChip}
                    textStyle={styles.followUpText}
                  >
                    Follow-up needed
                  </Chip>
                  {record.followUpDate && (
                    <Text style={styles.followUpDate}>
                      Due: {format(new Date(record.followUpDate), 'MMM dd, yyyy')}
                    </Text>
                  )}
                </View>
              )}
            </View>
            <Menu
              visible={menuVisible === record.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(record.id!)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  navigation.navigate('RecordDetail' as never, { recordId: record.id, edit: true } as never);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Divider />
              <Menu.Item
                onPress={() => handleDeleteRecord(record)}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>
          {record.notes && (
            <Text style={styles.recordNotes} numberOfLines={3}>
              {record.notes}
            </Text>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search treatment records..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text>Loading treatment records...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No records found matching your search' : 'No treatment records yet'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first treatment record
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderRecordItem}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddRecord' as never)}
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
  recordCard: {
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: {
    padding: 15,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '500',
    marginBottom: 4,
  },
  treatmentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  followUpContainer: {
    marginTop: 8,
  },
  followUpChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e0',
    marginBottom: 4,
  },
  followUpText: {
    color: '#ff9800',
    fontSize: 12,
  },
  followUpDate: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '500',
  },
  recordNotes: {
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

export default RecordsScreen;