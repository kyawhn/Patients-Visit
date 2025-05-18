import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Patients Schema
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  notes: text("notes"),
  lastVisit: timestamp("last_visit"),
});

// We'll use PostgreSQL foreign keys for relationships instead of relations API

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  lastVisit: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Appointments Schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  treatmentType: text("treatment_type").notNull(),
  notes: text("notes"),
  completed: boolean("completed").default(false),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Treatment Records Schema
export const treatmentRecords = pgTable("treatment_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  date: timestamp("date").notNull(),
  treatmentType: text("treatment_type").notNull(),
  notes: text("notes"),
  followUpNeeded: boolean("follow_up_needed").default(false),
  followUpDate: timestamp("follow_up_date"),
});

export const insertTreatmentRecordSchema = createInsertSchema(treatmentRecords).omit({
  id: true,
});

export type InsertTreatmentRecord = z.infer<typeof insertTreatmentRecordSchema>;
export type TreatmentRecord = typeof treatmentRecords.$inferSelect;

// Clinic Settings Schema
export const clinicSettings = pgTable("clinic_settings", {
  id: serial("id").primaryKey(),
  clinicName: text("clinic_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  googleAccount: text("google_account"),
  lastSync: timestamp("last_sync"),
  autoSync: boolean("auto_sync").default(true),
  notificationSettings: json("notification_settings").notNull(),
});

export const insertClinicSettingsSchema = createInsertSchema(clinicSettings).omit({
  id: true,
});

export type InsertClinicSettings = z.infer<typeof insertClinicSettingsSchema>;
export type ClinicSettings = typeof clinicSettings.$inferSelect;

// Extended schemas with additional validations
export const patientFormSchema = insertPatientSchema.extend({
  phone: z.string().min(10, "Phone number must be at least 10 digits")
});

export const appointmentFormSchema = insertAppointmentSchema.extend({
  duration: z.number().min(15, "Appointment must be at least 15 minutes")
});

export const treatmentRecordFormSchema = insertTreatmentRecordSchema.extend({
  treatmentType: z.string().min(3, "Treatment type must be specified")
});
