# Take Care — 90-Second Clinical Pitch Demo Script

**Target Audience:** Clinical Experts, Health System CIOs, Healthcare Investors  
**Demo Duration:** Exactly 90 Seconds  
**Environment:** Localhost (`http://localhost:3000`) or Android APK on Mobile (390×844)  
**Sample File Used:** `eval/docs/01_rx_typed_telugu.png` (or synthetic sample prescription)

---

## Timeline & Step-by-Step Flow

### 00:00 – 00:15 | Welcome & Fast Authentication
1. **Action:** Open `http://localhost:3000`.
2. **Screen:** Clean welcome screen with **Take Care** clinical branding.
3. **Action:** Click **"Sign In"** (or use quick demo login: Mobile `9876543210`).
4. **Talking Point:**
   > *"Take Care gives patients a private, clinical-grade health OS that runs on their phone, completely zero-data on cold start with offline synchronization."*

---

### 00:15 – 00:35 | Intelligent Multimodal Upload & Instant OCR Extraction
1. **Action:** Click the central **Upload (+)** button in the bottom navigation.
2. **Action:** Select **Prescription / Document** and upload `eval/docs/01_rx_typed_telugu.png`.
3. **Screen:** Watch the extraction pipeline process:
   - Category automatically detected as **Prescription**.
   - Dual-engine OCR + Multimodal Gemini extraction in under 2.5 seconds.
   - Clinical entities parsed: Medication (`Telmisartan 40 mg`, `Metformin 500 mg`), Dosage, Frequency (`Once daily`, `Twice daily with meals`).
4. **Talking Point:**
   > *"Notice how the system handles mixed Telugu and English handwriting notes without hallucination. Every extracted medication is linked directly to a verifiable bounding box or source line."*

---

### 00:35 – 00:50 | Clinical Review with Source Highlighting & Trust Flags
1. **Action:** Tap the extracted medication card.
2. **Screen:** The split/sheet view highlights the exact line in the original document:
   - Green badge: **"Source Verified"** (100% evidence-quote match).
   - Trust status: **Clear** vs. **Check Carefully** for ambiguous dosage.
3. **Action:** Tap **"Confirm All"** to commit the reviewed facts to the longitudinal record.
4. **Talking Point:**
   > *"No fact enters the patient health record unverified. Patients and doctors can click any medication to highlight the exact prescription text from which it was derived."*

---

### 00:50 – 01:10 | Longitudinal Health Summary & 1-Tap Emergency Card
1. **Action:** Tap **"Summary"** tab from the bottom bar.
2. **Screen:**
   - Active medications cleanly grouped by condition.
   - Lab trend charts (HbA1c, Blood Pressure).
   - Known Allergies prominently displayed with zero ambiguity (`No known drug allergies` vs. `Not documented`).
3. **Action:** Tap the red **"Emergency PDF"** button.
4. **Screen:** The compact A4 Emergency Health Passport is generated instantly.
5. **Talking Point:**
   > *"In an emergency room or road accident, first responders get a standardized, offline-accessible summary with blood group, critical allergies, and current medications."*

---

### 01:10 – 01:30 | Doctor 6-Digit Consent Code & Instant Revocation
1. **Action:** Tap **"Share with Doctor"** in the top header.
2. **Action:** Select **Emergency Scope** (1 hour duration) -> Click **Generate Code**.
3. **Screen:** A 6-digit code (e.g., `481920`) and QR code appears with a countdown timer.
4. **Action:** Switch to Doctor Gateway (`http://localhost:3000/doctor-portal` or Doctor Login button), enter the 6-digit code.
5. **Screen:** The doctor view loads read-only clinical notes instantly.
6. **Action:** Return to patient tab, tap **"Revoke Access Now"**. The doctor view is instantly locked out with HTTP 401.
7. **Talking Point:**
   > *"No permanent doctor access. Time-bounded, consent-scoped, 6-digit cryptographic sessions with instant revocation and audit logging."*

---

## Pre-Flight Checklist
- [x] Node dev server running (`http://localhost:3000`)
- [x] Sample documents available in `eval/docs/`
- [x] Display set to responsive mobile view (390×844) in DevTools
- [x] Test account credentials ready
