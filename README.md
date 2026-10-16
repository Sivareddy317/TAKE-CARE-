# Take Care — Clinical Health OS & Medical Document Processing Platform

<div align="center">

![Take Care Logo](https://img.shields.io/badge/Take%20Care-Clinical%20Health%20OS-006D60?style=for-the-badge&logo=heart&logoColor=white)
![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-Android%20APK-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-Vision%20%26%20Clinical%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge)

**A privacy-first, on-device clinical health operating system that turns complex medical prescriptions, discharge summaries, and lab reports into verified clinical summaries, tracks family health, assists with injury triage, and empowers patients with complete data ownership.**

</div>

---

## 📋 Table of Contents

- [Vision & Core Concept](#-vision--core-concept)
- [Key Features](#-key-features)
  - [1. Privacy-First Onboarding & Minimum Health Profile](#1-privacy-first-onboarding--minimum-health-profile)
  - [2. Universal Medical Document OCR & Clinical Parsing](#2-universal-medical-document-ocr--clinical-parsing)
  - [3. Interactive Two-Panel Visual Verification](#3-interactive-two-panel-visual-verification)
  - [4. Voice-Enabled Clinical Assistant (Ask Care)](#4-voice-enabled-clinical-assistant-ask-care)
  - [5. Camera Capture & Vision AI for Visible Injuries & Burns](#5-camera-capture--vision-ai-for-visible-injuries--burns)
  - [6. Family Health Profiles & Granular Permissions](#6-family-health-profiles--granular-permissions)
  - [7. Doctor Portal & Ephemeral Sharing](#7-doctor-portal--ephemeral-sharing)
  - [8. On-Device Standalone & Offline Resilience](#8-on-device-standalone--offline-resilience)
  - [9. Transparent Device Permissions & Verified Cloud Status](#9-transparent-device-permissions--verified-cloud-status)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Android APK Build & Deployment](#-android-apk-build--deployment)
- [Automated Testing Suite](#-automated-testing-suite)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Security & Clinical Safeguards](#-security--clinical-safeguards)

---

## 💡 Vision & Core Concept

Patients and families frequently struggle with fragmented medical records scattered across physical paper prescriptions, scanned hospital bills, handwritten doctor notes, and PDF diagnostic reports.

**Take Care** is engineered to resolve this by providing an intelligent, secure, on-device health assistant that:
1. **Never leaks data**: Isolates user profiles and medical data with zero cross-account leakage. Genuine accounts start completely clean without hardcoded synthetic developer data.
2. **Operates 100% standalone**: Designed to function natively on Android devices as an APK without requiring a continuous background connection to a laptop server.
3. **Surfaces clinical groundedness**: Rejects hallucinated findings by matching every extracted clinical fact directly to its verbatim source line with visual bounding box highlights.
4. **Protects patients with safeguards**: Refuses to provide dangerous automated diagnoses, prioritizes emergency first-aid triage, and requires explicit user consent before saving photos of injuries into health records.

---

## 🌟 Key Features

### 1. Privacy-First Onboarding & Minimum Health Profile
- **Clean Initial State**: New accounts start with an empty dashboard and zero prefilled records. Synthetic records exist strictly in an isolated, clearly labeled **Demo Mode**.
- **Minimum Health Profile Requirements**:
  - Full Name, Date of Birth / Age, and Gender
  - Blood Group (with unrecorded options)
  - High Blood Pressure status and latest BP reading
  - Diabetes status and latest fasting/random blood sugar reading
  - Documented Allergies summary & current medications
  - Emergency Contact (Name, Relationship, Phone)
- **Live Profile Completion Ring**: Circular SVG progress ring around the user avatar displaying the accurate percentage calculated strictly from mandatory required fields.
- **Account Actions**: Complete profile editing, secure session sign-out, and permanent account deletion with confirmation.

### 2. Universal Medical Document OCR & Clinical Parsing
The universal processing pipeline (`src/services/universalDocumentPipeline.ts`) handles 14 distinct document categories:
- **Digital Prescriptions**: Native PDF text layer parsing extracting medications, dosages, and regimens verbatim.
- **Scanned Hand-held Prescriptions**: High-accuracy OCR with quote extraction and line citations.
- **Multi-page Discharge Summaries**: Preserves multi-page flow, attributing diagnoses to admission notes and discharge meds to summary pages.
- **Tabular Lab Reports**: Retains tables with reference ranges and flags `HIGH` / `LOW` values accurately (e.g., Hemoglobin, Fasting Blood Sugar, Creatinine).
- **Radiology & ECG Reports**: Extracts clinical impressions and key findings verbatim.
- **Pure Imaging Scans (X-Rays, MRIs, CTs without text)**: Automatically classified as `imaging_image_no_text`; displays clear clinical notices rather than hallucinating dummy prescriptions.
- **Malformed & Corrupt Files**: Rejects unsupported formats (`.exe`, `.zip`) and corrupt PDFs safely with actionable error messages.

### 3. Interactive Two-Panel Visual Verification
- **Dual Viewport**: Side-by-side view of the original document/image on the left and extracted clinical entities on the right.
- **Bounding Box Grounding**: Tapping an extracted medication or diagnostic parameter highlights the exact source region on the original document.
- **Clinician/Patient Verification**: Allows users to confirm, reject, or edit extracted clinical entities before saving to permanent history.
- **Single-Page Emergency Summary**: Generates a standardized, printable single-page PDF containing vital signs, allergies, blood group, and emergency contacts using `pdf-lib`.

### 4. Voice-Enabled Clinical Assistant (Ask Care)
- **Real Speech Recognition**: Tap the microphone to trigger browser/native `SpeechRecognition`. Spoken queries appear in real time directly within the text input field.
- **User Review & Edit**: Users can review or modify the transcribed speech before sending.
- **Text-to-Speech Playback**: Assistant replies are read aloud using the native Web Speech Synthesis API (`window.speechSynthesis`) with per-message audio volume toggles.
- **Emergency Symptom Triage**: Detects urgent symptoms (e.g., severe chest pain, signs of stroke, difficulty breathing, major trauma) and presents immediate red-flag guidance encouraging 112/108 emergency contact.

### 5. Camera Capture & Vision AI for Visible Injuries & Burns
- **Dedicated Capture Flow**: Tap "Take Photo (Wounds/Burns)" to activate the device rear camera (`capture="environment"`).
- **Preview & Retake**: Instant image preview with retake or confirm actions.
- **Clinical AI Vision Analysis**: Powered by Google Gemini Vision (`gemini-2.5-flash`) with structured on-device first-aid fallbacks when offline.
- **Clinical Guardrails**:
  - Surfaces immediate non-pharmacological first-aid instructions (e.g., cool running water for thermal burns, pressure for minor bleeding).
  - Prominently warns about emergency red-flag criteria (e.g., burns covering joints/face, chemical/electrical exposure, deep puncture wounds).
  - Explicitly states limitations: **Informational guidance only, never a definitive medical diagnosis**.
  - **Explicit Consent**: Photos are never automatically saved to permanent records without the user tapping **"Save to My Health History"**.

### 6. Family Health Profiles & Granular Permissions
- **Family Dashboard**: Manage authorized family members (parents, spouse, children).
- **Invitation System**: Generate secure invitation links shareable directly via WhatsApp or SMS.
- **Granular Sharing Tiers**:
  - **Emergency Summary**: Access restricted to critical life-safety details (Blood Group, Verified Allergies, Emergency Contacts).
  - **Complete Vault**: Full read-only view of authorized health documents and medication history.
- **Immediate Revocation**: Account owners can revoke access instantly at any time.
- **Audit Logging**: Logs every family data view with timestamp and authorized viewer identity.

### 7. Doctor Portal & Ephemeral Sharing
- **6-Digit Session Codes**: Generate time-limited access codes (e.g., 15 minutes, 1 hour) with scoped permissions (Summary, Documents, Labs).
- **Gateway Portal**: Healthcare providers enter the 6-digit PIN on any browser to view the patient's records securely without creating an account.
- **Doctor Signatures & Clinical Notes**: Doctors can sign verification notes with their National Medical Commission (NMC) registration number.

### 8. On-Device Standalone & Offline Resilience
- **Zero Server Dependency in APK**: All critical flows (OCR parsing, entity verification, PDF generation, diabetes tracking, and local database storage) run 100% on the mobile device.
- **Offline Sync Queue**: Offline operations are queued with unique idempotency keys and replayed automatically when internet connectivity resumes.
- **Logout Cache Purge**: Logging out immediately wipes local storage tokens, cached documents, and user profile data, preventing data leakage on shared devices.

### 9. Transparent Device Permissions & Verified Cloud Status
- **Least-Privilege Model**: Device hardware permissions are requested strictly on-demand:
  - File Picker for documents
  - Camera for photo capture
  - Microphone for voice queries
  - Notifications for medicine reminders
- **Accurate Device States**: Real permission states (`Granted`, `Denied`, `On-Demand`) with working on-device test buttons.
- **Verified Connectivity**: Replaces simulated connection badges with true Firestore server health checks. Displays "Encrypted Local Storage (Active)" when offline.

---

## 🛠 Technology Stack

### Frontend & Core
- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 8.x with native Rollup/Rolldown bundler
- **Styling**: Tailwind CSS v4, Vanilla CSS design tokens (`#006D60` Deep Teal clinical theme)
- **Icons**: Lucide React (`lucide-react`)
- **Animations**: Motion (`motion`)
- **PDF Engine**: `pdf-lib` (Client-side single-page emergency PDF compilation)

### Mobile Application Layer
- **Framework**: Capacitor 8 (`@capacitor/core`, `@capacitor/cli`)
- **Android Runtime**: `@capacitor/android`
- **Native Plugins**:
  - `@capacitor/camera`: Hardware camera capture and file picker
  - `@capacitor/app`: Native Android hardware back-button and lifecycle management
  - Web Speech API: Real-time speech recognition and synthesis

### Backend & AI Services
- **Runtime**: Node.js with `tsx`
- **API Server**: Express 4.x
- **AI Models**: Google Gemini 2.5 Flash via `@google/genai` (document intelligence, vision analysis, clinical assistant)
- **Authentication**: Firebase Authentication & JWT session tokens
- **Database**: Cloud Firestore & local JSON database engine (`.takecare_db.json`)

---

## 📁 Project Directory Structure

```
TAKE-CARE/
├── android/                         # Native Android Studio Project
│   ├── app/                         # Android App module
│   │   ├── src/main/AndroidManifest.xml
│   │   └── src/main/res/            # App icons (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
│   ├── build.gradle
│   └── gradlew.bat                  # Gradle build executable
├── src/
│   ├── components/                  # UI Components
│   │   ├── assistant/               # Clinical AI Assistant
│   │   │   ├── AskAyuView.tsx       # Voice input, speech synthesis, emergency guidance
│   │   │   └── InjuryCameraModal.tsx# Rear camera capture for wounds/burns
│   │   ├── auth/                    # Authentication & Onboarding
│   │   │   ├── AyuLoginView.tsx     # Phone / Email / Google login
│   │   │   ├── AyuRegisterView.tsx  # New account registration
│   │   │   ├── DataUsageConsentView.tsx # Mandatory consent gating
│   │   │   └── VerifyView.tsx       # OTP verification
│   │   ├── common/                  # Shared UI
│   │   │   ├── AppLogo.tsx          # Brand icon & logo SVG
│   │   │   └── NetworkStatusBanner.tsx # Real-time sync & offline banner
│   │   ├── family/                  # Family Health Management
│   │   │   └── FamilyDashboard.tsx  # Members, permissions, WhatsApp sharing
│   │   ├── features/                # Clinical Health Tools
│   │   │   ├── BookAppointmentView.tsx
│   │   │   ├── DiabetesTrackerView.tsx
│   │   │   ├── MedicineRemindersView.tsx
│   │   │   └── ScanDoctorQrModal.tsx
│   │   ├── history/                 # Health History & Vault
│   │   │   └── HealthHistoryView.tsx
│   │   ├── onboarding/              # First-launch experience
│   │   │   └── OnboardingCarousel.tsx
│   │   ├── profile/                 # User Profile & Settings
│   │   │   ├── AyuAccountView.tsx   # Account dashboard & doctor QR
│   │   │   └── AyuEditProfileView.tsx # Minimum health profile, completion %
│   │   ├── AyuHome.tsx              # Main dashboard with avatar completion ring
│   │   ├── BottomNavigation.tsx     # 5-tab mobile navigation bar
│   │   ├── DoctorAccessGateway.tsx  # Doctor 6-digit access code entry
│   │   ├── DoctorClinicalView.tsx   # Doctor review portal & note signing
│   │   ├── DocumentList.tsx         # Document vault list
│   │   ├── HealthSummaryView.tsx    # Clean patient summary & demo mode toggle
│   │   ├── NavigationHeader.tsx     # Header with user avatar dropdown & Sign Out
│   │   ├── SettingsView.tsx         # Permissions, privacy, Firestore verified status
│   │   ├── ShareDoctorView.tsx      # Sharing code generator
│   │   ├── TwoPanelVerification.tsx # Side-by-side visual bounding box review
│   │   └── UploadFlow.tsx           # Document upload & real-time OCR
│   ├── data/
│   │   └── mockDocuments.ts         # Synthetic fixtures isolated for Demo Mode
│   ├── services/                    # Core Business Logic & Pipelines
│   │   ├── api.ts                   # REST API client & auth headers
│   │   ├── auth.ts                  # Firebase Auth synchronization
│   │   ├── clinicalAnalysis.ts      # Clinical fact verification & hallucination rejection
│   │   ├── firebase.ts              # Firebase initialization & connection test
│   │   ├── offlineSyncService.ts    # Queue, idempotency, and logout cache purging
│   │   ├── summaryPdfService.ts     # Single-page emergency PDF generation
│   │   └── universalDocumentPipeline.ts # Universal 14-variant document OCR engine
│   ├── types/
│   │   └── clinical.ts              # Clinical TypeScript interfaces & data models
│   ├── App.tsx                      # Root component & state management
│   ├── index.css                    # Tailwind CSS v4 & custom utility classes
│   └── main.tsx                     # React application entry point
├── capacitor.config.json            # Capacitor mobile configuration (`com.takecare.app`)
├── package.json                     # Dependencies and npm scripts
├── server.ts                        # Backend Express API server & Gemini Vision routes
├── test-pipeline.ts                 # 26-point automated test suite
├── tsconfig.json                    # TypeScript compiler options
└── vite.config.ts                   # Vite bundler configuration
```

---

## 📱 Android APK Build & Deployment

Take Care is configured with Capacitor to generate production-ready Android APKs.

### Prerequisites
- **Node.js**: v18 or higher
- **Java Development Kit (JDK)**: JDK 17 or JDK 21
- **Android SDK / Android Studio**: Android SDK Platform 34 or higher

### Build Steps

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Compile Frontend Assets**:
   ```bash
   npm run build
   ```
   This generates the production bundle inside `dist/`.

3. **Synchronize with Capacitor Android**:
   ```bash
   npx cap sync android
   ```

4. **Build the Debug APK via Gradle**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   *(On Windows Command Prompt or PowerShell, use `gradlew.bat assembleDebug`)*

5. **Locate the Generated APK**:
   The built APK will be located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

6. **Install on a Connected Device**:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
   *Alternatively, transfer `app-debug.apk` directly to your Android device via USB, Google Drive, or WhatsApp and tap to install.*

---

## 🧪 Automated Testing Suite

Take Care includes a 26-point automated integrity test suite covering all document processing edge cases, security boundaries, and onboarding flows.

Run the test suite with:
```bash
npx tsx test-pipeline.ts
```

### Verified Test Cases
- **Tests 1–5**: Digital prescriptions, scanned receipts, multi-page discharge summaries, tabular lab reports, and radiology reports.
- **Tests 6–7**: Image-only scans (X-rays, MRIs, CTs) verifying zero dummy entities injected and proper notices displayed.
- **Tests 8–11**: Readable report images, rotated low-contrast images, blank images, and noisy images.
- **Tests 12–14**: Corrupt PDFs, unsupported file types (`.exe`), and malformed text with hallucination rejection.
- **Tests 15–16**: Consultation date vs report print date distinction, and reprocessing determinism without duplicate records.
- **Tests 17–19**: Cross-user authorization boundaries (403 Forbidden), Family Emergency vs Complete filtering, and instant permission revocation.
- **Tests 20–22**: Offline queue duplicate prevention, lockscreen reminder privacy, and emergency single-page PDF generation.
- **Test 23**: Fresh user onboarding data isolation & zero prefilled personal data (no "Siva Reddy").
- **Test 24**: Minimum health profile completion calculation from required fields.
- **Test 25**: Injury photo analysis safeguards (non-diagnostic first aid & mandatory save consent).
- **Test 26**: Complete account sign-out and client-side storage cache wipe.

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the project root:

```env
# Server Port
PORT=3000

# Google Gemini API Key (for Vision OCR and Clinical Assistant)
GEMINI_API_KEY=your_gemini_api_key_here

# Environment
NODE_ENV=development
```

> **Note**: If `GEMINI_API_KEY` is not provided, Take Care automatically activates its structured on-device clinical first-aid fallback rules to ensure continuous offline functionality.

---

## 🛡️ Security & Clinical Safeguards

1. **Non-Diagnostic Assistance**: Take Care is designed as an informational health organizer and emergency first-aid aid. It never claims to provide a definitive diagnosis or prescribe drug dosages from an image or voice description.
2. **Emergency Triage Priority**: When critical symptoms (e.g., severe burns covering joints/face, signs of stroke, acute chest pressure, heavy hemorrhage) are detected, the system immediately surfaces emergency guidance to call **112 / 108**.
3. **Explicit Consent**: Photos of visible injuries, burns, or personal health records are **never uploaded or permanently stored** without explicit, informed confirmation from the user.
4. **Zero Cross-Account Leakage**: Data caches in local storage are completely cleared upon sign-out, ensuring multi-user privacy on shared family smartphones.

---

<div align="center">
<strong>Take Care Health OS</strong> • Built for Patient Empowerment and Clinical Clarity
</div>
