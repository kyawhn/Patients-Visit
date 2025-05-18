import { dbStorage } from './dbStorage';

/**
 * Initialize default clinic settings if none exist
 */
export async function initializeDefaultSettings() {
  try {
    // Check if settings exist
    const existingSettings = await dbStorage.getClinicSettings();
    
    // If settings don't exist, create default settings
    if (!existingSettings) {
      console.log('Creating default clinic settings...');
      
      const defaultSettings = {
        clinicName: 'My Medical Clinic',
        address: '123 Medical Way',
        phone: '123-456-7890',
        googleAccount: '',
        autoSync: true,
        notificationSettings: {
          enabled: true,
          email: true,
          sms: false
        }
      };
      
      const result = await dbStorage.updateClinicSettings(defaultSettings);
      console.log('Default clinic settings created:', result);
    } else {
      console.log('Clinic settings already exist');
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}