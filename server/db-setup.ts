import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create a Drizzle instance
export const db = drizzle(pool, { schema });

// Function to run migrations
export async function runMigrations() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle', migrationsTable: 'migrations' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed', error);
    throw error;
  }
}

// Function to check if tables exist
export async function checkTables() {
  try {
    // Attempt to query the tables
    const patientsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'patients'
      );
    `);
    
    const patientTableExists = patientsResult.rows[0].exists;
    
    if (!patientTableExists) {
      console.log('Tables not found, initializing database...');
      await initializeDatabase();
    } else {
      console.log('Database tables already exist');
    }
  } catch (error) {
    console.error('Error checking tables:', error);
    throw error;
  }
}

// Initialize database with tables if they don't exist
async function initializeDatabase() {
  try {
    // Create tables directly using SQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        date_of_birth TEXT,
        address TEXT,
        notes TEXT,
        last_visit TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        treatment_type TEXT NOT NULL,
        notes TEXT,
        completed BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS treatment_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL,
        treatment_type TEXT NOT NULL,
        notes TEXT,
        follow_up_needed BOOLEAN DEFAULT FALSE,
        follow_up_date TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clinic_settings (
        id SERIAL PRIMARY KEY,
        clinic_name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        google_account TEXT,
        last_sync TIMESTAMP,
        auto_sync BOOLEAN DEFAULT TRUE,
        notification_settings JSONB NOT NULL
      );
    `);
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}