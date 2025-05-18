import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { 
  appointments, 
  clinicSettings, 
  insertAppointmentSchema,
  insertClinicSettingsSchema,
  insertPatientSchema,
  insertTreatmentRecordSchema,
  patients, 
  treatmentRecords, 
  users 
} from '@shared/schema';
import { eq, and, gte, lte, like } from 'drizzle-orm';
import { IStorage } from './storage';
import { 
  type Appointment, 
  type ClinicSettings, 
  type InsertAppointment, 
  type InsertClinicSettings, 
  type InsertPatient, 
  type InsertTreatmentRecord, 
  type InsertUser, 
  type Patient, 
  type TreatmentRecord, 
  type User 
} from '@shared/schema';
import { startOfDay, endOfDay } from 'date-fns';

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create a Drizzle instance
const db = drizzle(pool);

export class DbStorage implements IStorage {
  constructor() {
    // Initialize DB connection
    console.log('Database storage initialized');
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    const results = await db.select().from(patients).where(eq(patients.id, id));
    return results[0];
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async searchPatients(search: string): Promise<Patient[]> {
    const searchTerm = `%${search}%`;
    return await db.select().from(patients).where(
      like(patients.name, searchTerm)
    );
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const results = await db.insert(patients).values({
      ...patient,
      lastVisit: null
    }).returning();
    return results[0];
  }

  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const results = await db.update(patients)
      .set(patient)
      .where(eq(patients.id, id))
      .returning();
    return results[0];
  }

  async deletePatient(id: number): Promise<boolean> {
    const results = await db.delete(patients)
      .where(eq(patients.id, id))
      .returning();
    return results.length > 0;
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const results = await db.select().from(appointments).where(eq(appointments.id, id));
    return results[0];
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.patientId, patientId));
  }

  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    return await db.select().from(appointments).where(
      and(
        gte(appointments.date, start),
        lte(appointments.date, end)
      )
    );
  }

  async getAppointmentsInRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return await db.select().from(appointments).where(
      and(
        gte(appointments.date, startDate),
        lte(appointments.date, endDate)
      )
    );
  }

  async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date();
    return this.getAppointmentsByDate(today);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const results = await db.insert(appointments).values(appointment).returning();
    return results[0];
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const results = await db.update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    return results[0];
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const results = await db.delete(appointments)
      .where(eq(appointments.id, id))
      .returning();
    return results.length > 0;
  }

  // Treatment Record methods
  async getTreatmentRecord(id: number): Promise<TreatmentRecord | undefined> {
    const results = await db.select().from(treatmentRecords).where(eq(treatmentRecords.id, id));
    return results[0];
  }

  async getTreatmentRecordsByPatient(patientId: number): Promise<TreatmentRecord[]> {
    return await db.select().from(treatmentRecords).where(eq(treatmentRecords.patientId, patientId));
  }

  async getAllTreatmentRecords(): Promise<TreatmentRecord[]> {
    return await db.select().from(treatmentRecords);
  }

  async searchTreatmentRecords(search: string): Promise<TreatmentRecord[]> {
    const searchTerm = `%${search}%`;
    return await db.select().from(treatmentRecords).where(
      like(treatmentRecords.treatmentType, searchTerm)
    );
  }

  async createTreatmentRecord(record: InsertTreatmentRecord): Promise<TreatmentRecord> {
    const results = await db.insert(treatmentRecords).values(record).returning();
    return results[0];
  }

  async updateTreatmentRecord(id: number, record: Partial<InsertTreatmentRecord>): Promise<TreatmentRecord | undefined> {
    const results = await db.update(treatmentRecords)
      .set(record)
      .where(eq(treatmentRecords.id, id))
      .returning();
    return results[0];
  }

  async deleteTreatmentRecord(id: number): Promise<boolean> {
    const results = await db.delete(treatmentRecords)
      .where(eq(treatmentRecords.id, id))
      .returning();
    return results.length > 0;
  }

  // Clinic Settings methods
  async getClinicSettings(): Promise<ClinicSettings | undefined> {
    const results = await db.select().from(clinicSettings);
    return results[0];
  }

  async updateClinicSettings(settings: Partial<InsertClinicSettings>): Promise<ClinicSettings | undefined> {
    // Check if settings exist
    const existing = await this.getClinicSettings();
    
    if (existing) {
      // Update existing settings
      const results = await db.update(clinicSettings)
        .set(settings)
        .where(eq(clinicSettings.id, existing.id))
        .returning();
      return results[0];
    } else {
      // Create new settings with default values for required fields
      const defaultSettings = {
        clinicName: settings.clinicName || "My Clinic",
        notificationSettings: settings.notificationSettings || { enabled: true, email: true, sms: false },
        ...settings
      };
      
      const results = await db.insert(clinicSettings)
        .values(defaultSettings)
        .returning();
      return results[0];
    }
  }
}

// Export a singleton instance
export const dbStorage = new DbStorage();