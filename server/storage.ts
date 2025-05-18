import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  appointments, type Appointment, type InsertAppointment,
  treatmentRecords, type TreatmentRecord, type InsertTreatmentRecord,
  clinicSettings, type ClinicSettings, type InsertClinicSettings
} from "@shared/schema";

// Storage interface with all required CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patient methods
  getPatient(id: number): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  searchPatients(search: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  
  // Appointment methods
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDate(date: Date): Promise<Appointment[]>;
  getAppointmentsInRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  getTodayAppointments(): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Treatment Record methods
  getTreatmentRecord(id: number): Promise<TreatmentRecord | undefined>;
  getTreatmentRecordsByPatient(patientId: number): Promise<TreatmentRecord[]>;
  getAllTreatmentRecords(): Promise<TreatmentRecord[]>;
  searchTreatmentRecords(search: string): Promise<TreatmentRecord[]>;
  createTreatmentRecord(record: InsertTreatmentRecord): Promise<TreatmentRecord>;
  updateTreatmentRecord(id: number, record: Partial<InsertTreatmentRecord>): Promise<TreatmentRecord | undefined>;
  deleteTreatmentRecord(id: number): Promise<boolean>;
  
  // Clinic Settings methods
  getClinicSettings(): Promise<ClinicSettings | undefined>;
  updateClinicSettings(settings: Partial<InsertClinicSettings>): Promise<ClinicSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private treatmentRecords: Map<number, TreatmentRecord>;
  private settings: ClinicSettings | undefined;
  
  private userCurrentId: number;
  private patientCurrentId: number;
  private appointmentCurrentId: number;
  private recordCurrentId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.treatmentRecords = new Map();
    
    this.userCurrentId = 1;
    this.patientCurrentId = 1;
    this.appointmentCurrentId = 1;
    this.recordCurrentId = 1;
    
    // Initialize with some default clinic settings
    this.settings = {
      id: 1,
      clinicName: "HealthCare Medical Clinic",
      address: "123 Medical Center Dr, Suite 100",
      phone: "+1 (555) 987-6543",
      googleAccount: "doctor@example.com",
      lastSync: new Date(),
      autoSync: true,
      notificationSettings: {
        appointmentReminders: true,
        followUpAlerts: true,
        syncNotifications: false
      }
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }
  
  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }
  
  async searchPatients(search: string): Promise<Patient[]> {
    search = search.toLowerCase();
    return Array.from(this.patients.values()).filter(patient => 
      patient.name.toLowerCase().includes(search) || 
      patient.phone.includes(search) ||
      (patient.email && patient.email.toLowerCase().includes(search))
    );
  }
  
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const id = this.patientCurrentId++;
    const newPatient: Patient = { 
      ...patient, 
      id, 
      lastVisit: patient.lastVisit || null 
    };
    this.patients.set(id, newPatient);
    return newPatient;
  }
  
  async updatePatient(id: number, patientUpdate: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...patientUpdate };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }
  
  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }
  
  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.patientId === patientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    return Array.from(this.appointments.values())
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getAppointmentsInRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= startDate && appointmentDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date();
    return this.getAppointmentsByDate(today);
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentCurrentId++;
    const newAppointment: Appointment = { ...appointment, id };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  async updateAppointment(id: number, appointmentUpdate: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...appointmentUpdate };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }
  
  // Treatment Record methods
  async getTreatmentRecord(id: number): Promise<TreatmentRecord | undefined> {
    return this.treatmentRecords.get(id);
  }
  
  async getTreatmentRecordsByPatient(patientId: number): Promise<TreatmentRecord[]> {
    return Array.from(this.treatmentRecords.values())
      .filter(record => record.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getAllTreatmentRecords(): Promise<TreatmentRecord[]> {
    return Array.from(this.treatmentRecords.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async searchTreatmentRecords(search: string): Promise<TreatmentRecord[]> {
    search = search.toLowerCase();
    return Array.from(this.treatmentRecords.values())
      .filter(record => 
        record.treatmentType.toLowerCase().includes(search) || 
        (record.notes && record.notes.toLowerCase().includes(search))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createTreatmentRecord(record: InsertTreatmentRecord): Promise<TreatmentRecord> {
    const id = this.recordCurrentId++;
    const newRecord: TreatmentRecord = { ...record, id };
    this.treatmentRecords.set(id, newRecord);
    
    // Update patient's last visit date
    const patient = this.patients.get(record.patientId);
    if (patient) {
      this.patients.set(patient.id, {
        ...patient,
        lastVisit: record.date
      });
    }
    
    return newRecord;
  }
  
  async updateTreatmentRecord(id: number, recordUpdate: Partial<InsertTreatmentRecord>): Promise<TreatmentRecord | undefined> {
    const record = this.treatmentRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { ...record, ...recordUpdate };
    this.treatmentRecords.set(id, updatedRecord);
    return updatedRecord;
  }
  
  async deleteTreatmentRecord(id: number): Promise<boolean> {
    return this.treatmentRecords.delete(id);
  }
  
  // Clinic Settings methods
  async getClinicSettings(): Promise<ClinicSettings | undefined> {
    return this.settings;
  }
  
  async updateClinicSettings(settingsUpdate: Partial<InsertClinicSettings>): Promise<ClinicSettings | undefined> {
    if (!this.settings) return undefined;
    
    this.settings = { ...this.settings, ...settingsUpdate };
    return this.settings;
  }
}

export const storage = new MemStorage();
