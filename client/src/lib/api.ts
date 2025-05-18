import { apiRequest } from "./queryClient";
import { 
  Patient, InsertPatient,
  Appointment, InsertAppointment,
  TreatmentRecord, InsertTreatmentRecord,
  ClinicSettings
} from "@shared/schema";

// Patient APIs
export async function createPatient(patientData: InsertPatient): Promise<Patient> {
  const response = await apiRequest("POST", "/api/patients", patientData);
  return response.json();
}

export async function updatePatient(id: number, patientData: Partial<InsertPatient>): Promise<Patient> {
  const response = await apiRequest("PATCH", `/api/patients/${id}`, patientData);
  return response.json();
}

export async function deletePatient(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/patients/${id}`);
}

// Appointment APIs
export async function createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
  const response = await apiRequest("POST", "/api/appointments", appointmentData);
  return response.json();
}

export async function updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment> {
  const response = await apiRequest("PATCH", `/api/appointments/${id}`, appointmentData);
  return response.json();
}

export async function deleteAppointment(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/appointments/${id}`);
}

// Treatment Record APIs
export async function createTreatmentRecord(recordData: InsertTreatmentRecord): Promise<TreatmentRecord> {
  const response = await apiRequest("POST", "/api/records", recordData);
  return response.json();
}

export async function updateTreatmentRecord(id: number, recordData: Partial<InsertTreatmentRecord>): Promise<TreatmentRecord> {
  const response = await apiRequest("PATCH", `/api/records/${id}`, recordData);
  return response.json();
}

export async function deleteTreatmentRecord(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/records/${id}`);
}

// Settings APIs
export async function updateClinicSettings(settingsData: Partial<ClinicSettings>): Promise<ClinicSettings> {
  const response = await apiRequest("PATCH", "/api/settings", settingsData);
  return response.json();
}

// Sync API
export async function syncToGoogleDrive(): Promise<{ message: string; syncTime: string }> {
  const response = await apiRequest("POST", "/api/sync");
  return response.json();
}
