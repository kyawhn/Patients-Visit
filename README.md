# Clinic Management App

A comprehensive React Native application for managing medical clinic operations, built with SQLite for offline-first functionality.

## Features

- **Patient Management**: Add, edit, view, and search patient records
- **Appointment Scheduling**: Create and manage appointments with calendar view
- **Treatment Records**: Track treatment history and follow-up requirements
- **Dashboard**: Overview of clinic statistics and upcoming appointments
- **Offline-First**: All data stored locally with SQLite database
- **Material Design**: Clean, professional UI using React Native Paper

## Technology Stack

- **React Native 0.72**: Cross-platform mobile development
- **SQLite**: Local database for offline functionality
- **React Navigation**: Tab and stack navigation
- **React Native Paper**: Material Design components
- **React Query**: Data fetching and caching
- **React Hook Form**: Form validation and management
- **Date-fns**: Date manipulation and formatting

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Install Dependencies
```bash
npm install
```

### Android Setup
1. Open Android Studio
2. Open the `android` folder as a project
3. Let Gradle sync and download dependencies
4. Connect an Android device or start an emulator

### Running the App

#### Start Metro Bundler
```bash
npm start
```

#### Run on Android
```bash
npm run android
```

#### Run on iOS
```bash
npm run ios
```

## Building APK

### Debug APK
```bash
cd android
./gradlew assembleDebug
```
APK will be generated at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK
1. Generate signing key:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Build release APK:
```bash
cd android
./gradlew assembleRelease
```

## Database Schema

The app uses SQLite with the following tables:

- **patients**: Patient information and contact details
- **appointments**: Scheduled appointments with patients
- **treatmentRecords**: Treatment history and notes
- **clinicSettings**: Clinic configuration and preferences

## Key Components

### Screens
- `DashboardScreen`: Main overview with statistics
- `PatientsScreen`: Patient list and search
- `AppointmentsScreen`: Appointment management
- `RecordsScreen`: Treatment records
- `SettingsScreen`: Clinic configuration

### Database
- `Database.ts`: SQLite database manager
- Complete CRUD operations for all entities
- Foreign key relationships between tables

## Features in Detail

### Patient Management
- Add new patients with contact information
- Edit existing patient details
- View patient history and appointments
- Search patients by name or phone

### Appointment Scheduling
- Schedule appointments with specific patients
- Set duration and treatment type
- Mark appointments as completed
- Filter appointments by status and date

### Treatment Records
- Create detailed treatment notes
- Set follow-up requirements
- Link records to specific patients
- Search treatment history

### Data Export
- Export all clinic data for backup
- SQLite database can be accessed directly
- Settings include data management options

## Customization

### Adding New Treatment Types
Edit the `treatmentTypes` array in:
- `AddAppointmentScreen.tsx`
- `AddRecordScreen.tsx`

### Modifying Database Schema
Update the `createTables()` method in `Database.ts` and increment the database version.

### Styling
The app uses React Native Paper's theming system. Modify colors in the theme configuration in `App.tsx`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both Android and iOS
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and support, please create an issue in the repository or contact the development team.