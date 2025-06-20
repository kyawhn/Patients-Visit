# Building Android APK on Android Phone with Termux

This guide will help you build your React Native clinic management app directly on your Android phone using Termux.

## Step 1: Setup Termux Environment

### Install Required Packages
```bash
# Update packages
pkg update && pkg upgrade

# Install essential tools
pkg install nodejs python git openjdk-17 wget curl unzip

# Install yarn (optional but recommended)
npm install -g yarn

# Install React Native CLI
npm install -g @react-native-community/cli
```

### Setup Storage Access
```bash
# Allow Termux to access phone storage
termux-setup-storage
```

## Step 2: Install Android SDK

### Download Android SDK Command Line Tools
```bash
# Create directories
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools

# Download SDK tools (latest version)
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip

# Extract
unzip commandlinetools-linux-9477386_latest.zip
mv cmdline-tools latest

# Cleanup
rm commandlinetools-linux-9477386_latest.zip
```

### Setup Environment Variables
```bash
# Add to ~/.bashrc
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0' >> ~/.bashrc
echo 'export JAVA_HOME=$PREFIX/opt/openjdk' >> ~/.bashrc

# Reload environment
source ~/.bashrc
```

### Install SDK Components
```bash
# Accept licenses
yes | sdkmanager --licenses

# Install required SDK components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

## Step 3: Setup Your Project

### Download Your Project
Since you have the React Native project files, you can either:

1. **Download from Replit** (if you have the ZIP file):
```bash
# Navigate to Downloads or wherever you saved the ZIP
cd /storage/emulated/0/Download
unzip your-project.zip
cd your-project-folder
```

2. **Or recreate the project structure manually**:
```bash
# Create new React Native project
npx react-native init ClinicManagementApp
cd ClinicManagementApp

# Then copy all the source files from your Replit project
```

### Install Dependencies
```bash
# Install Node modules
npm install

# Install additional React Native dependencies
npm install react-native-sqlite-storage @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-paper @tanstack/react-query react-hook-form react-native-vector-icons react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated date-fns react-native-date-picker
```

## Step 4: Configure Android Build

### Setup Gradle Properties
Create or edit `android/gradle.properties`:
```properties
# Enable daemon
org.gradle.daemon=true

# Increase memory
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# Enable parallel builds
org.gradle.parallel=true

# Enable build cache
org.gradle.caching=true

# Android specific
android.useAndroidX=true
android.enableJetifier=true
```

### Update build.gradle (app level)
Make sure `android/app/build.gradle` has correct configurations:
```gradle
android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    
    defaultConfig {
        applicationId "com.clinicmanagement.app"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
}
```

## Step 5: Build APK

### Build Debug APK
```bash
# Navigate to your project
cd ~/your-project-folder

# Build debug APK
cd android
./gradlew assembleDebug
```

### Build Release APK (Signed)
```bash
# Generate signing key
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
./gradlew assembleRelease
```

### Find Your APK
```bash
# Debug APK location
ls -la app/build/outputs/apk/debug/
# File: app-debug.apk

# Release APK location  
ls -la app/build/outputs/apk/release/
# File: app-release.apk
```

## Step 6: Install APK

### Copy APK to Phone Storage
```bash
# Copy to Downloads folder for easy access
cp app/build/outputs/apk/debug/app-debug.apk /storage/emulated/0/Download/ClinicManagement.apk
```

### Install APK
1. Open your phone's file manager
2. Navigate to Downloads folder
3. Tap on `ClinicManagement.apk`
4. Allow installation from unknown sources if prompted
5. Install the app

## Troubleshooting

### Common Issues:

1. **Out of Memory Error**:
```bash
# Increase swap space
fallocate -l 2G /data/data/com.termux/files/home/swapfile
chmod 600 swapfile
mkswap swapfile
swapon swapfile
```

2. **SDK License Issues**:
```bash
yes | sdkmanager --licenses
```

3. **Gradle Build Failed**:
```bash
# Clean build
./gradlew clean
./gradlew assembleDebug
```

4. **Node Memory Issues**:
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=2048"
```

## Performance Tips

1. **Use fewer features during build** - Close other apps
2. **Build during low usage** - Night time when phone is charging
3. **Use release build** - Smaller and faster
4. **Clear cache regularly**:
```bash
./gradlew clean
npm cache clean --force
```

## File Structure After Build

```
your-project/
├── android/
│   └── app/build/outputs/apk/
│       ├── debug/app-debug.apk      # Debug version
│       └── release/app-release.apk  # Release version
├── src/                             # Your React Native source code
└── node_modules/                    # Dependencies
```

## Next Steps

1. Test the APK on your phone
2. Share with others if needed
3. Consider publishing to Google Play Store for wider distribution

The build process might take 15-30 minutes on a phone, depending on your device's performance. Make sure your phone is plugged in and has sufficient storage space (at least 4GB free).