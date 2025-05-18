import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPatientSchema, 
  insertAppointmentSchema, 
  insertTreatmentRecordSchema,
  insertClinicSettingsSchema 
} from "@shared/schema";
import { z } from "zod";
import { setupGoogleDriveAPI, syncDataToGoogleDrive } from "./googleDrive";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Google Drive integration
  setupGoogleDriveAPI();

  // ======== PATIENT ROUTES ========
  // Get all patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Search patients
  app.get("/api/patients/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const patients = await storage.searchPatients(query);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to search patients" });
    }
  });

  // Get a single patient
  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  // Create a new patient
  app.post("/api/patients", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  // Update a patient
  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(id, validatedData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Delete a patient
  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePatient(id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // ======== APPOINTMENT ROUTES ========
  // Get all appointments for a specific date
  app.get("/api/appointments/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      const appointments = await storage.getAppointmentsByDate(date);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Get appointments for a date range
  app.get("/api/appointments/range", async (req, res) => {
    try {
      const startDate = new Date(req.query.start as string);
      const endDate = new Date(req.query.end as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const appointments = await storage.getAppointmentsInRange(startDate, endDate);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Get today's appointments
  app.get("/api/appointments/today", async (req, res) => {
    try {
      const appointments = await storage.getTodayAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's appointments" });
    }
  });

  // Get appointments for a specific patient
  app.get("/api/patients/:patientId/appointments", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      const appointments = await storage.getAppointmentsByPatient(patientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient appointments" });
    }
  });

  // Get a single appointment
  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  // Create a new appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      
      // Check if patient exists
      const patient = await storage.getPatient(validatedData.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Update an appointment
  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      
      // If patient ID is being updated, check if the patient exists
      if (validatedData.patientId) {
        const patient = await storage.getPatient(validatedData.patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }
      }
      
      const appointment = await storage.updateAppointment(id, validatedData);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Delete an appointment
  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAppointment(id);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // ======== TREATMENT RECORD ROUTES ========
  // Get all treatment records
  app.get("/api/records", async (req, res) => {
    try {
      const records = await storage.getAllTreatmentRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch treatment records" });
    }
  });

  // Search treatment records
  app.get("/api/records/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const records = await storage.searchTreatmentRecords(query);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to search treatment records" });
    }
  });

  // Get treatment records for a specific patient
  app.get("/api/patients/:patientId/records", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      const records = await storage.getTreatmentRecordsByPatient(patientId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient treatment records" });
    }
  });

  // Get a single treatment record
  app.get("/api/records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getTreatmentRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Treatment record not found" });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch treatment record" });
    }
  });

  // Create a new treatment record
  app.post("/api/records", async (req, res) => {
    try {
      const validatedData = insertTreatmentRecordSchema.parse(req.body);
      
      // Check if patient exists
      const patient = await storage.getPatient(validatedData.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      const record = await storage.createTreatmentRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid treatment record data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create treatment record" });
    }
  });

  // Update a treatment record
  app.patch("/api/records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTreatmentRecordSchema.partial().parse(req.body);
      
      // If patient ID is being updated, check if the patient exists
      if (validatedData.patientId) {
        const patient = await storage.getPatient(validatedData.patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }
      }
      
      const record = await storage.updateTreatmentRecord(id, validatedData);
      if (!record) {
        return res.status(404).json({ message: "Treatment record not found" });
      }
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid treatment record data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update treatment record" });
    }
  });

  // Delete a treatment record
  app.delete("/api/records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTreatmentRecord(id);
      if (!success) {
        return res.status(404).json({ message: "Treatment record not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete treatment record" });
    }
  });

  // ======== CLINIC SETTINGS ROUTES ========
  // Get clinic settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getClinicSettings();
      if (!settings) {
        return res.status(404).json({ message: "Clinic settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clinic settings" });
    }
  });

  // Update clinic settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const validatedData = insertClinicSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateClinicSettings(validatedData);
      if (!settings) {
        return res.status(404).json({ message: "Clinic settings not found" });
      }
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid clinic settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update clinic settings" });
    }
  });

  // ======== GOOGLE DRIVE SYNC ROUTES ========
  // Sync data to Google Drive
  app.post("/api/sync", async (req, res) => {
    try {
      // Get all data that needs to be synced
      const patients = await storage.getAllPatients();
      const records = await storage.getAllTreatmentRecords();
      const appointments = await storage.getTodayAppointments();

      // Sync data to Google Drive
      const result = await syncDataToGoogleDrive({ 
        patients, records, appointments
      });

      // Update last sync time in settings
      const settings = await storage.getClinicSettings();
      if (settings) {
        await storage.updateClinicSettings({ lastSync: new Date() });
      }

      res.json({ 
        message: "Data synced successfully", 
        syncTime: new Date(),
        syncDetails: result
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to sync data to Google Drive", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
