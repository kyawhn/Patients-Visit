import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = "ClinicManagement.db";
const database_version = "1.0";
const database_displayname = "Clinic Management Database";
const database_size = 200000;

export interface Patient {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
  lastVisit?: string;
}

export interface Appointment {
  id?: number;
  patientId: number;
  date: string;
  duration: number;
  treatmentType: string;
  notes?: string;
  completed: boolean;
}

export interface TreatmentRecord {
  id?: number;
  patientId: number;
  date: string;
  treatmentType: string;
  notes?: string;
  followUpNeeded: boolean;
  followUpDate?: string;
}

export interface ClinicSettings {
  id?: number;
  clinicName: string;
  address?: string;
  phone?: string;
  email?: string;
  businessHours?: string;
}

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async openDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) {
      return this.db;
    }

    try {
      this.db = await SQLite.openDatabase(
        database_name,
        database_version,
        database_displayname,
        database_size
      );
      
      await this.createTables();
      console.log('Database opened successfully');
      return this.db;
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTables = [
      `CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        dateOfBirth TEXT,
        address TEXT,
        notes TEXT,
        lastVisit TEXT
      );`,
      
      `CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL,
        date TEXT NOT NULL,
        duration INTEGER NOT NULL,
        treatmentType TEXT NOT NULL,
        notes TEXT,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE
      );`,
      
      `CREATE TABLE IF NOT EXISTS treatmentRecords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL,
        date TEXT NOT NULL,
        treatmentType TEXT NOT NULL,
        notes TEXT,
        followUpNeeded INTEGER DEFAULT 0,
        followUpDate TEXT,
        FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE
      );`,
      
      `CREATE TABLE IF NOT EXISTS clinicSettings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clinicName TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        businessHours TEXT
      );`
    ];

    for (const query of createTables) {
      await this.db.executeSql(query);
    }

    // Insert default clinic settings if none exist
    const [settingsResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM clinicSettings');
    if (settingsResult.rows.item(0).count === 0) {
      await this.db.executeSql(
        'INSERT INTO clinicSettings (clinicName, address, phone, email, businessHours) VALUES (?, ?, ?, ?, ?)',
        ['My Medical Clinic', '123 Medical Way', '123-456-7890', 'contact@clinic.com', '9:00 AM - 5:00 PM']
      );
    }
  }

  // Patient methods
  async getAllPatients(): Promise<Patient[]> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql('SELECT * FROM patients ORDER BY name');
    
    const patients: Patient[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      patients.push(results.rows.item(i));
    }
    return patients;
  }

  async getPatient(id: number): Promise<Patient | null> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql('SELECT * FROM patients WHERE id = ?', [id]);
    
    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  }

  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const db = await this.openDatabase();
    const [result] = await db.executeSql(
      'INSERT INTO patients (name, phone, email, dateOfBirth, address, notes, lastVisit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patient.name, patient.phone, patient.email || null, patient.dateOfBirth || null, 
       patient.address || null, patient.notes || null, patient.lastVisit || null]
    );
    
    return { ...patient, id: result.insertId };
  }

  async updatePatient(id: number, patient: Partial<Patient>): Promise<void> {
    const db = await this.openDatabase();
    const fields = Object.keys(patient).filter(key => key !== 'id');
    const values = fields.map(field => patient[field as keyof Patient]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.executeSql(
      `UPDATE patients SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async deletePatient(id: number): Promise<void> {
    const db = await this.openDatabase();
    await db.executeSql('DELETE FROM patients WHERE id = ?', [id]);
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql(
      'SELECT * FROM patients WHERE name LIKE ? OR phone LIKE ? ORDER BY name',
      [`%${query}%`, `%${query}%`]
    );
    
    const patients: Patient[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      patients.push(results.rows.item(i));
    }
    return patients;
  }

  // Appointment methods
  async getAllAppointments(): Promise<Appointment[]> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql('SELECT * FROM appointments ORDER BY date DESC');
    
    const appointments: Appointment[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      appointments.push({
        ...item,
        completed: Boolean(item.completed)
      });
    }
    return appointments;
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql(
      'SELECT * FROM appointments WHERE DATE(date) = DATE(?) ORDER BY date',
      [date]
    );
    
    const appointments: Appointment[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      appointments.push({
        ...item,
        completed: Boolean(item.completed)
      });
    }
    return appointments;
  }

  async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAppointmentsByDate(today);
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql(
      'SELECT * FROM appointments WHERE patientId = ? ORDER BY date DESC',
      [patientId]
    );
    
    const appointments: Appointment[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      appointments.push({
        ...item,
        completed: Boolean(item.completed)
      });
    }
    return appointments;
  }

  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const db = await this.openDatabase();
    const [result] = await db.executeSql(
      'INSERT INTO appointments (patientId, date, duration, treatmentType, notes, completed) VALUES (?, ?, ?, ?, ?, ?)',
      [appointment.patientId, appointment.date, appointment.duration, 
       appointment.treatmentType, appointment.notes || null, appointment.completed ? 1 : 0]
    );
    
    return { ...appointment, id: result.insertId };
  }

  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<void> {
    const db = await this.openDatabase();
    const fields = Object.keys(appointment).filter(key => key !== 'id');
    const values = fields.map(field => {
      const value = appointment[field as keyof Appointment];
      return field === 'completed' ? (value ? 1 : 0) : value;
    });
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.executeSql(
      `UPDATE appointments SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteAppointment(id: number): Promise<void> {
    const db = await this.openDatabase();
    await db.executeSql('DELETE FROM appointments WHERE id = ?', [id]);
  }

  // Treatment Record methods
  async getAllTreatmentRecords(): Promise<TreatmentRecord[]> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql('SELECT * FROM treatmentRecords ORDER BY date DESC');
    
    const records: TreatmentRecord[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      records.push({
        ...item,
        followUpNeeded: Boolean(item.followUpNeeded)
      });
    }
    return records;
  }

  async getTreatmentRecordsByPatient(patientId: number): Promise<TreatmentRecord[]> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql(
      'SELECT * FROM treatmentRecords WHERE patientId = ? ORDER BY date DESC',
      [patientId]
    );
    
    const records: TreatmentRecord[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      records.push({
        ...item,
        followUpNeeded: Boolean(item.followUpNeeded)
      });
    }
    return records;
  }

  async createTreatmentRecord(record: Omit<TreatmentRecord, 'id'>): Promise<TreatmentRecord> {
    const db = await this.openDatabase();
    const [result] = await db.executeSql(
      'INSERT INTO treatmentRecords (patientId, date, treatmentType, notes, followUpNeeded, followUpDate) VALUES (?, ?, ?, ?, ?, ?)',
      [record.patientId, record.date, record.treatmentType, record.notes || null, 
       record.followUpNeeded ? 1 : 0, record.followUpDate || null]
    );
    
    return { ...record, id: result.insertId };
  }

  async updateTreatmentRecord(id: number, record: Partial<TreatmentRecord>): Promise<void> {
    const db = await this.openDatabase();
    const fields = Object.keys(record).filter(key => key !== 'id');
    const values = fields.map(field => {
      const value = record[field as keyof TreatmentRecord];
      return field === 'followUpNeeded' ? (value ? 1 : 0) : value;
    });
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.executeSql(
      `UPDATE treatmentRecords SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteTreatmentRecord(id: number): Promise<void> {
    const db = await this.openDatabase();
    await db.executeSql('DELETE FROM treatmentRecords WHERE id = ?', [id]);
  }

  // Clinic Settings methods
  async getClinicSettings(): Promise<ClinicSettings | null> {
    const db = await this.openDatabase();
    const [results] = await db.executeSql('SELECT * FROM clinicSettings LIMIT 1');
    
    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  }

  async updateClinicSettings(settings: Partial<ClinicSettings>): Promise<void> {
    const db = await this.openDatabase();
    const existing = await this.getClinicSettings();
    
    if (existing) {
      const fields = Object.keys(settings).filter(key => key !== 'id');
      const values = fields.map(field => settings[field as keyof ClinicSettings]);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await db.executeSql(
        `UPDATE clinicSettings SET ${setClause} WHERE id = ?`,
        [...values, existing.id]
      );
    } else {
      await db.executeSql(
        'INSERT INTO clinicSettings (clinicName, address, phone, email, businessHours) VALUES (?, ?, ?, ?, ?)',
        [settings.clinicName || 'My Clinic', settings.address || '', settings.phone || '', 
         settings.email || '', settings.businessHours || '9:00 AM - 5:00 PM']
      );
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const database = new DatabaseManager();