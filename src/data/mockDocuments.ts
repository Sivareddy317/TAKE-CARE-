import { ProcessedDocument, AcceptanceTestCase, PatientInfo } from '../types/clinical';

export const CURRENT_PATIENT: PatientInfo = {
  id: 'TC-2026-DEMO',
  name: 'Demo Patient (Synthetic)',
  age: 28,
  gender: 'Other',
  bloodGroup: 'B+ Positive',
  emergencyContact: 'Emergency Contact (+91 98765 00000)',
};

// SVG data URI generator for authentic looking Indian clinical documents
function createSvgDocUri(title: string, subtitle: string, bodyContent: string, isHandwritten: boolean = false, blur: boolean = false): string {
  const filterDef = blur ? `<filter id="blurFilter"><feGaussianBlur stdDeviation="3.5"/></filter>` : '';
  const filterAttr = blur ? 'filter="url(#blurFilter)"' : '';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
    <defs>
      <linearGradient id="paperBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      ${filterDef}
    </defs>
    <rect width="800" height="1100" fill="url(#paperBg)"/>
    <!-- Clinical Letterhead Header Border -->
    <rect x="0" y="0" width="800" height="12" fill="#0d9488"/>
    <g ${filterAttr}>
      <!-- Hospital / Clinic Header -->
      <circle cx="60" cy="65" r="24" fill="#0d9488" opacity="0.15"/>
      <path d="M60 48v34M43 65h34" stroke="#0d9488" stroke-width="4.5" stroke-linecap="round"/>
      <text x="96" y="58" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${title}</text>
      <text x="96" y="78" font-family="Arial, sans-serif" font-size="12" fill="#64748b">${subtitle}</text>
      
      <!-- Patient Meta Ribbon -->
      <line x1="40" y1="105" x2="760" y2="105" stroke="#e2e8f0" stroke-width="1.5"/>
      <rect x="40" y="115" width="720" height="42" rx="6" fill="#f1f5f9"/>
      <text x="55" y="141" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#334155">PATIENT: DEMO PATIENT (SYNTHETIC RECORD)</text>
      <text x="380" y="141" font-family="Arial, sans-serif" font-size="12" fill="#64748b">UHID: TC-2026-DEMO</text>
      <text x="580" y="141" font-family="Arial, sans-serif" font-size="12" fill="#64748b">DATE: 12 OCT 2026</text>
      <line x1="40" y1="168" x2="760" y2="168" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Document Specific Body -->
      ${bodyContent}

      <!-- Doctor Signature / Official Stamp at bottom -->
      <g transform="translate(540, 960)">
        <text x="0" y="0" font-family="'Brush Script MT', cursive, sans-serif" font-size="28" fill="#1e3a8a">Dr. K. Swaminathan</text>
        <line x1="-10" y1="10" x2="190" y2="10" stroke="#94a3b8" stroke-width="1"/>
        <text x="0" y="26" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#475569">Dr. K. Swaminathan, MD</text>
        <text x="0" y="42" font-family="Arial, sans-serif" font-size="10" fill="#64748b">Reg No. NMC-48102 • City Hospital</text>
        <!-- Circular Stamp -->
        <circle cx="160" cy="18" r="32" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.65"/>
        <text x="160" y="15" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#2563eb">CLINICAL</text>
        <text x="160" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#2563eb">VERIFIED</text>
      </g>
    </g>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// 1. Digital Prescription SVG
const prescriptionContent = `
  <text x="50" y="210" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0d9488">Rx Clinical Prescription</text>
  <rect x="50" y="230" width="700" height="240" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="70" y="265" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">1. Tab. Amlodipine 5 mg</text>
  <text x="70" y="290" font-family="Arial, sans-serif" font-size="13" fill="#475569">Dosage: 1 Tablet Once Daily (Morning, post-meal) - 30 days</text>
  <text x="70" y="315" font-family="Arial, sans-serif" font-size="12" fill="#0d9488">Indication: Essential Hypertension • Blood Pressure Control</text>

  <line x1="70" y1="335" x2="720" y2="335" stroke="#f1f5f9" stroke-width="1"/>

  <text x="70" y="365" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#b91c1c">Documented Allergy Alert:</text>
  <text x="70" y="390" font-family="Arial, sans-serif" font-size="13" fill="#0f172a">Allergy to Dust Mites (Moderate to Severe Allergic Rhinitis)</text>
  <text x="70" y="415" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Symptoms: Morning nasal congestion, sneezing, mild ocular pruritus.</text>

  <text x="50" y="510" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#334155">Negative Allergy Findings / Exclusions:</text>
  <text x="50" y="535" font-family="Arial, sans-serif" font-size="13" fill="#475569">No Known Drug Allergies (NKDA): Penicillin, Sulfa, NSAIDs.</text>
  <text x="50" y="555" font-family="Arial, sans-serif" font-size="11" font-style="italic" fill="#94a3b8">*Food, latex, and anesthesia allergies were not evaluated in this visit.</text>
`;

// 2. Metropolis Lab Report SVG
const labReportContent = `
  <text x="50" y="205" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0369a1">DEPARTMENT OF BIOCHEMISTRY &amp; METABOLIC PROFILES</text>
  <rect x="45" y="225" width="710" height="340" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
  <!-- Table Header -->
  <rect x="45" y="225" width="710" height="34" fill="#e2e8f0"/>
  <text x="60" y="247" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155">INVESTIGATION PARAMETER</text>
  <text x="290" y="247" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155">RESULT</text>
  <text x="390" y="247" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155">UNITS</text>
  <text x="490" y="247" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155">REFERENCE INTERVAL</text>
  <text x="660" y="247" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155">EVALUATION</text>

  <!-- Row 1: HbA1c -->
  <line x1="45" y1="260" x2="755" y2="260" stroke="#e2e8f0"/>
  <text x="60" y="290" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">HbA1c (Glycated Hemoglobin)</text>
  <text x="60" y="308" font-family="Arial, sans-serif" font-size="10" fill="#64748b">HPLC Whole Blood</text>
  <text x="290" y="295" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#d97706">6.8</text>
  <text x="390" y="295" font-family="Arial, sans-serif" font-size="13" fill="#475569">%</text>
  <text x="490" y="295" font-family="Arial, sans-serif" font-size="13" fill="#64748b">4.0 - 5.6 % (Normal)</text>
  <rect x="650" y="280" width="85" height="22" rx="4" fill="#fef3c7"/>
  <text x="692" y="295" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#92400e">ELEVATED</text>

  <!-- Row 2: Serum Creatinine -->
  <line x1="45" y1="325" x2="755" y2="325" stroke="#f1f5f9"/>
  <text x="60" y="355" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Serum Creatinine</text>
  <text x="60" y="373" font-family="Arial, sans-serif" font-size="10" fill="#64748b">Jaffe / Enzymatic Serum</text>
  <text x="290" y="360" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#15803d">1.1</text>
  <text x="390" y="360" font-family="Arial, sans-serif" font-size="13" fill="#475569">mg/dL</text>
  <text x="490" y="360" font-family="Arial, sans-serif" font-size="13" fill="#64748b">0.7 - 1.3 mg/dL</text>
  <rect x="650" y="345" width="85" height="22" rx="4" fill="#dcfce7"/>
  <text x="692" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#166534">NORMAL</text>

  <!-- Row 3: Fasting Blood Glucose -->
  <line x1="45" y1="390" x2="755" y2="390" stroke="#f1f5f9"/>
  <text x="60" y="420" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Fasting Blood Glucose</text>
  <text x="60" y="438" font-family="Arial, sans-serif" font-size="10" fill="#64748b">Hexokinase Plasma</text>
  <text x="290" y="425" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#d97706">124</text>
  <text x="390" y="425" font-family="Arial, sans-serif" font-size="13" fill="#475569">mg/dL</text>
  <text x="490" y="425" font-family="Arial, sans-serif" font-size="13" fill="#64748b">70 - 99 mg/dL</text>
  <rect x="650" y="410" width="85" height="22" rx="4" fill="#fef3c7"/>
  <text x="692" y="425" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#92400e">ELEVATED</text>

  <!-- Row 4: Total Cholesterol -->
  <line x1="45" y1="455" x2="755" y2="455" stroke="#f1f5f9"/>
  <text x="60" y="485" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Total Serum Cholesterol</text>
  <text x="290" y="485" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#15803d">182</text>
  <text x="390" y="485" font-family="Arial, sans-serif" font-size="13" fill="#475569">mg/dL</text>
  <text x="490" y="485" font-family="Arial, sans-serif" font-size="13" fill="#64748b">&lt; 200 mg/dL</text>
  <rect x="650" y="470" width="85" height="22" rx="4" fill="#dcfce7"/>
  <text x="692" y="485" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#166534">DESIRABLE</text>
`;

// 3. Discharge Summary SVG
const dischargeSummaryContent = `
  <text x="50" y="210" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1e40af">Inpatient Discharge Summary</text>
  <text x="50" y="235" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Admission Date: 05 Oct 2026 • Discharge Date: 08 Oct 2026</text>
  
  <rect x="50" y="255" width="700" height="290" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="70" y="285" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">FINAL DIAGNOSIS:</text>
  <text x="70" y="308" font-family="Arial, sans-serif" font-size="13" fill="#1e3a8a">1. Type 2 Diabetes Mellitus with Moderate Glycemic Control</text>
  <text x="70" y="328" font-family="Arial, sans-serif" font-size="13" fill="#475569">2. Essential Hypertension (Stage 1)</text>

  <line x1="70" y1="345" x2="720" y2="345" stroke="#f1f5f9"/>

  <text x="70" y="375" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">DISCHARGE MEDICATIONS:</text>
  <text x="70" y="400" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">• Tab. Metformin Hydrochloride 500 mg (Extended Release)</text>
  <text x="85" y="420" font-family="Arial, sans-serif" font-size="12" fill="#475569">Sig: 1 Tablet Twice Daily with meals (Breakfast &amp; Dinner).</text>
  <text x="70" y="445" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">• Tab. Amlodipine 5 mg</text>
  <text x="85" y="465" font-family="Arial, sans-serif" font-size="12" fill="#475569">Sig: 1 Tablet Once Daily in morning post-breakfast.</text>

  <line x1="70" y1="485" x2="720" y2="485" stroke="#f1f5f9"/>

  <text x="70" y="510" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#047857">FOLLOW-UP DIRECTIVES:</text>
  <text x="70" y="530" font-family="Arial, sans-serif" font-size="12" fill="#334155">Repeat HbA1c and Serum Creatinine in 12 weeks. Maintain glycemic diet restriction.</text>
`;

// 4. Eye Surgery Report SVG
const eyeSurgeryContent = `
  <text x="50" y="210" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#6d28d9">OPERATIVE CLINICAL REPORT - OPHTHALMOLOGY</text>
  <rect x="50" y="240" width="700" height="260" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="70" y="275" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">SURGICAL PROCEDURE PERFORMED:</text>
  <text x="70" y="300" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#5b21b6">Cataract Surgery (Right Eye) with IOL Implant</text>
  <text x="70" y="325" font-family="Arial, sans-serif" font-size="13" fill="#475569">Procedure Date: 12 March 2024</text>
  <text x="70" y="350" font-family="Arial, sans-serif" font-size="13" fill="#475569">Technique: Phacoemulsification with posterior chamber intraocular lens implant.</text>
  <text x="70" y="380" font-family="Arial, sans-serif" font-size="13" fill="#15803d">Post-Operative Status: Fully Resolved. Clear visual axis, uneventful recovery.</text>
`;

export const PRELOADED_DOCUMENTS: ProcessedDocument[] = [
  {
    id: 'doc-1',
    filename: 'Prescription_2024.pdf',
    fileType: 'pdf',
    category: 'prescription',
    uploadDate: '12 Oct 2026',
    fileSize: '1.4 MB',
    pageCount: 1,
    currentPage: 1,
    previewUrl: createSvgDocUri('CITY CLINICAL HEALTHCARE & ENT', 'Dr. K. Swaminathan (ENT & General Med) • NMC #48102', prescriptionContent),
    originalUrl: createSvgDocUri('CITY CLINICAL HEALTHCARE & ENT', 'Dr. K. Swaminathan (ENT & General Med) • NMC #48102', prescriptionContent),
    status: 'Confirmed',
    ocrConfidence: 98,
    rotation: 0,
    rawText: `CITY CLINICAL HEALTHCARE & ENT\nDr. K. Swaminathan, MD (Reg #48102)\nPATIENT: Demo Patient (Synthetic Demo) | UHID: TC-2026-DEMO\nDate: 12 Oct 2026\n\nRx:\n1. Tab. Amlodipine 5 mg - 1 tab once daily post-breakfast x 30 days.\nIndication: Essential Hypertension.\n\nAllergies Recorded:\nDust Mites - Severe allergic rhinitis, morning nasal congestion, mild ocular pruritus.\nNo Known Drug Allergies (Penicillin, Sulfa, NSAIDs).\nOther allergies (food, latex, anesthesia) not documented.`,
    qualityIssues: [],
    extractedEntities: [
      {
        id: 'ent-1',
        category: 'allergy',
        title: 'Dust Mites',
        value: 'Dust Mites (Active Recorded)',
        secondaryValue: 'Severe allergic rhinitis, morning nasal congestion',
        details: 'Managed intermittently with antihistamines. Extracted from ENT clinic visit.',
        sourceDoc: 'Prescription_2024.pdf',
        pageNumber: 1,
        confidence: 96,
        status: 'Confirmed',
        box: { ymin: 350, xmin: 65, ymax: 425, xmax: 710 },
      },
      {
        id: 'ent-2',
        category: 'medication',
        title: 'Amlodipine',
        value: 'Amlodipine 5 mg',
        secondaryValue: '1 tablet once daily (Morning, post-meal)',
        details: 'Indication: Essential Hypertension. Oral Tablet. Refill: 6 months.',
        sourceDoc: 'Prescription_2024.pdf',
        pageNumber: 1,
        confidence: 99,
        status: 'Confirmed',
        box: { ymin: 245, xmin: 65, ymax: 325, xmax: 710 },
      },
    ],
  },
  {
    id: 'doc-2',
    filename: 'Lab_Report.pdf',
    fileType: 'pdf',
    category: 'lab',
    uploadDate: '10 Oct 2026',
    fileSize: '2.1 MB',
    pageCount: 1,
    currentPage: 1,
    previewUrl: createSvgDocUri('METROPOLIS HEALTHCARE LABS', 'Department of Clinical Pathology & Biochemistry', labReportContent),
    originalUrl: createSvgDocUri('METROPOLIS HEALTHCARE LABS', 'Department of Clinical Pathology & Biochemistry', labReportContent),
    status: 'Confirmed',
    ocrConfidence: 99,
    rotation: 0,
    rawText: `METROPOLIS HEALTHCARE LABS\nPatient: Demo Patient (Synthetic Demo) | TC-2026-DEMO\nHbA1c: 6.8 % (Ref: 4.0 - 5.6 %) - Moderate Glycemic Control\nSerum Creatinine: 1.1 mg/dL (Ref: 0.7 - 1.3 mg/dL) - Normal Renal Clearance\nFasting Blood Glucose: 124 mg/dL (Ref: 70 - 99 mg/dL) - Elevated Fasting\nTotal Serum Cholesterol: 182 mg/dL (Ref: < 200 mg/dL)`,
    qualityIssues: [],
    extractedEntities: [
      {
        id: 'ent-3',
        category: 'lab',
        title: 'HbA1c',
        value: '6.8 %',
        secondaryValue: 'Reference: 4.0 - 5.6 % (Non-diabetic)',
        details: 'Clinical Evaluation: Moderate Glycemic Control. Whole Blood HPLC.',
        sourceDoc: 'Lab_Report.pdf',
        pageNumber: 1,
        confidence: 99,
        status: 'Confirmed',
        box: { ymin: 275, xmin: 55, ymax: 320, xmax: 745 },
      },
      {
        id: 'ent-4',
        category: 'lab',
        title: 'Serum Creatinine',
        value: '1.1 mg/dL',
        secondaryValue: 'Reference: 0.7 - 1.3 mg/dL',
        details: 'Clinical Evaluation: Normal Renal Clearance. Serum Enzymatic.',
        sourceDoc: 'Lab_Report.pdf',
        pageNumber: 1,
        confidence: 99,
        status: 'Confirmed',
        box: { ymin: 340, xmin: 55, ymax: 385, xmax: 745 },
      },
      {
        id: 'ent-5',
        category: 'lab',
        title: 'Fasting Blood Glucose',
        value: '124 mg/dL',
        secondaryValue: 'Reference: 70 - 99 mg/dL',
        details: 'Clinical Evaluation: Elevated Fasting Glucose.',
        sourceDoc: 'Blood_Test.jpg',
        pageNumber: 1,
        confidence: 98,
        status: 'Confirmed',
        box: { ymin: 405, xmin: 55, ymax: 450, xmax: 745 },
      },
    ],
  },
  {
    id: 'doc-3',
    filename: 'Discharge_Summary.jpg',
    fileType: 'jpg',
    category: 'discharge',
    uploadDate: '08 Oct 2026',
    fileSize: '3.8 MB',
    pageCount: 2,
    currentPage: 1,
    previewUrl: createSvgDocUri('APOLLO HOSPITALS HYDERABAD', 'Department of General & Internal Medicine', dischargeSummaryContent),
    originalUrl: createSvgDocUri('APOLLO HOSPITALS HYDERABAD', 'Department of General & Internal Medicine', dischargeSummaryContent),
    status: 'Confirmed',
    ocrConfidence: 95,
    rotation: 0,
    rawText: `APOLLO HOSPITALS HYDERABAD\nDischarge Summary - Demo Patient (Synthetic Demo) (TC-2026-DEMO)\nDiagnosis: Type 2 Diabetes Mellitus, Essential Hypertension.\nMedication: Metformin Hydrochloride 500 mg Extended Release BD.\nDischarge Date: 08 Oct 2026`,
    qualityIssues: [],
    extractedEntities: [
      {
        id: 'ent-6',
        category: 'condition',
        title: 'Type 2 Diabetes',
        value: 'Type 2 Diabetes Mellitus (Chronic)',
        secondaryValue: 'Diagnosed Feb 2023',
        details: 'Managed with Metformin 500mg BD and dietary glycemic restriction.',
        sourceDoc: 'Discharge_Summary.jpg',
        pageNumber: 1,
        confidence: 97,
        status: 'Confirmed',
        box: { ymin: 275, xmin: 65, ymax: 335, xmax: 720 },
      },
      {
        id: 'ent-7',
        category: 'medication',
        title: 'Metformin Hydrochloride',
        value: 'Metformin Hydrochloride 500 mg',
        secondaryValue: '1 tablet twice daily with meals (Breakfast & Dinner)',
        details: 'Extended Release oral tablet. Indication: Type 2 Diabetes.',
        sourceDoc: 'Discharge_Summary.jpg',
        pageNumber: 1,
        confidence: 96,
        status: 'Confirmed',
        box: { ymin: 390, xmin: 65, ymax: 470, xmax: 720 },
      },
    ],
  },
  {
    id: 'doc-4',
    filename: 'Eye_Surgery_Report.pdf',
    fileType: 'pdf',
    category: 'surgery',
    uploadDate: '05 Oct 2026',
    fileSize: '890 KB',
    pageCount: 1,
    currentPage: 1,
    previewUrl: createSvgDocUri('LV PRASAD EYE INSTITUTE', 'Center for Advanced Cornea & Lens Surgery', eyeSurgeryContent),
    originalUrl: createSvgDocUri('LV PRASAD EYE INSTITUTE', 'Center for Advanced Cornea & Lens Surgery', eyeSurgeryContent),
    status: 'Confirmed',
    ocrConfidence: 98,
    rotation: 0,
    rawText: `LV PRASAD EYE INSTITUTE\nCataract Surgery (Right Eye) with IOL Implant on 12 Mar 2024.\nPhacoemulsification with posterior chamber intraocular lens. Post-op recovery uneventful.`,
    qualityIssues: [],
    extractedEntities: [
      {
        id: 'ent-8',
        category: 'procedure',
        title: 'Cataract Surgery',
        value: 'Cataract Surgery (Right Eye)',
        secondaryValue: '12 Mar 2024 (Resolved)',
        details: 'Phacoemulsification with posterior chamber intraocular lens (IOL) implant. Uneventful recovery.',
        sourceDoc: 'Eye_Surgery_Report.pdf',
        pageNumber: 1,
        confidence: 98,
        status: 'Confirmed',
        box: { ymin: 270, xmin: 65, ymax: 390, xmax: 710 },
      },
    ],
  },
  {
    id: 'doc-5',
    filename: 'Blood_Test.jpg',
    fileType: 'jpg',
    category: 'lab',
    uploadDate: '03 Oct 2026',
    fileSize: '4.2 MB',
    pageCount: 1,
    currentPage: 1,
    previewUrl: createSvgDocUri('VIJAYA DIAGNOSTIC CENTRE', 'Routine Hematology & Biochemistry Department', labReportContent),
    originalUrl: createSvgDocUri('VIJAYA DIAGNOSTIC CENTRE', 'Routine Hematology & Biochemistry Department', labReportContent),
    status: 'Confirmed',
    ocrConfidence: 96,
    rotation: 0,
    rawText: `VIJAYA DIAGNOSTIC CENTRE\nFasting Blood Glucose: 124 mg/dL\nSerum Creatinine: 1.1 mg/dL\nTotal Cholesterol: 182 mg/dL`,
    qualityIssues: [],
    extractedEntities: [],
  },
];

// The 8 Acceptance Test Cases defined in the requirements
export const ACCEPTANCE_TEST_CASES: AcceptanceTestCase[] = [
  {
    id: 'test-1-digital-rx',
    number: 1,
    title: 'Digital Prescription PDF',
    description: 'A clean digital vector PDF prescription with embedded selectable text, doctor details, and Amlodipine 5mg.',
    expectedBehavior: 'Direct text stream extraction without lossy pixel conversions. Preserves exact dosages and units.',
    sampleFilename: 'Prescription_2024.pdf',
    category: 'prescription',
    rawDocumentMock: {
      filename: 'Digital_Prescription_2024.pdf',
      fileType: 'pdf',
      category: 'prescription',
      pageCount: 1,
      ocrConfidence: 99,
      status: 'Confirmed',
      qualityIssues: [],
    },
  },
  {
    id: 'test-2-scanned-rx',
    number: 2,
    title: 'Scanned Prescription PDF',
    description: 'Scanned page-image prescription containing doctor handwriting and stamp requiring rasterization before OCR.',
    expectedBehavior: 'Rasterizes page to high-res canvas, identifies handwriting as lower confidence input, flags medicine names for verification.',
    sampleFilename: 'Scanned_Rx_Swaminathan.pdf',
    category: 'prescription',
    rawDocumentMock: {
      filename: 'Scanned_Rx_Swaminathan.pdf',
      fileType: 'pdf',
      category: 'prescription',
      pageCount: 1,
      ocrConfidence: 87,
      status: 'Awaiting Patient Review',
      qualityIssues: [
        {
          type: 'low_confidence_medication',
          severity: 'warning',
          message: 'Handwritten drug strength detected',
          recommendation: 'Verify medicine dosage "5 mg" against clinical note.',
        },
      ],
    },
  },
  {
    id: 'test-3-photo-lab',
    number: 3,
    title: 'Photographed Lab Report',
    description: 'Mobile photo of printed biochemistry report with mild glare and uneven mobile phone angle.',
    expectedBehavior: 'Applies perspective correction, enhances text contrast, extracts HbA1c 6.8% and Creatinine 1.1 mg/dL with accurate bounding boxes.',
    sampleFilename: 'Photographed_Metropolis_Lab.jpg',
    category: 'lab',
    rawDocumentMock: {
      filename: 'Photographed_Metropolis_Lab.jpg',
      fileType: 'jpg',
      category: 'lab',
      pageCount: 1,
      ocrConfidence: 94,
      status: 'Awaiting Patient Review',
      qualityIssues: [
        {
          type: 'low_contrast',
          severity: 'info',
          message: 'Slight glare detected in top corner',
          recommendation: 'Preprocessing normalized contrast without impacting decimal values.',
        },
      ],
    },
  },
  {
    id: 'test-4-multipage-discharge',
    number: 4,
    title: 'Multi-Page Discharge Summary',
    description: 'Multi-page hospital discharge memo with clinical history on page 1 and medication regimen on page 2.',
    expectedBehavior: 'Extracts across pages in reading order, retains page number provenance, separates past history from ongoing meds.',
    sampleFilename: 'Apollo_Discharge_Summary_2Pages.pdf',
    category: 'discharge',
    rawDocumentMock: {
      filename: 'Apollo_Discharge_Summary_2Pages.pdf',
      fileType: 'pdf',
      category: 'discharge',
      pageCount: 2,
      ocrConfidence: 96,
      status: 'Confirmed',
      qualityIssues: [],
    },
  },
  {
    id: 'test-5-rotated-image',
    number: 5,
    title: 'Rotated Image (90° / Orientation Skew)',
    description: 'Prescription photographed sideways (90-degree counter-clockwise rotation).',
    expectedBehavior: 'Detects page orientation, prompts user or automatically rotates +90° to upright before OCR execution.',
    sampleFilename: 'Rotated_Prescription_90deg.jpg',
    category: 'prescription',
    rawDocumentMock: {
      filename: 'Rotated_Prescription_90deg.jpg',
      fileType: 'jpg',
      category: 'prescription',
      pageCount: 1,
      ocrConfidence: 91,
      status: 'Awaiting Patient Review',
      qualityIssues: [
        {
          type: 'rotation',
          severity: 'warning',
          message: '90° page rotation detected',
          recommendation: 'Orientation deskew applied. Rotated back to 0° portrait.',
          autoResolved: true,
        },
      ],
    },
  },
  {
    id: 'test-6-blurry-image',
    number: 6,
    title: 'Low-Quality or Blurry Image',
    description: 'Document captured with motion blur or low lighting where text sharpness is impaired.',
    expectedBehavior: 'Calculates Laplacian blur variance (< 65). Warns user: "Image is blurry, clinical values may be uncertain". Allows re-upload or threshold retry.',
    sampleFilename: 'Blurry_Blood_Report.jpg',
    category: 'lab',
    rawDocumentMock: {
      filename: 'Blurry_Blood_Report.jpg',
      fileType: 'jpg',
      category: 'lab',
      pageCount: 1,
      ocrConfidence: 68,
      status: 'Partially Processed',
      qualityIssues: [
        {
          type: 'blur',
          severity: 'error',
          message: 'High motion blur detected (Laplacian score: 42)',
          recommendation: 'Values flagged as uncertain. Retake photo with steady hands or verify extracted numbers.',
        },
      ],
    },
  },
  {
    id: 'test-7-tables-decimals',
    number: 7,
    title: 'Document with Tables & Decimals',
    description: 'Biochemistry panel with decimal metrics (HbA1c 6.8%, Creatinine 1.1 mg/dL) and structured table intervals.',
    expectedBehavior: 'Preserves decimal points and units strictly. Does not round or remove decimal precision during binarization.',
    sampleFilename: 'Metropolis_Biochemistry_Table.pdf',
    category: 'lab',
    rawDocumentMock: {
      filename: 'Metropolis_Biochemistry_Table.pdf',
      fileType: 'pdf',
      category: 'lab',
      pageCount: 1,
      ocrConfidence: 99,
      status: 'Confirmed',
      qualityIssues: [],
    },
  },
  {
    id: 'test-8-unreadable-file',
    number: 8,
    title: 'Unreadable or Unsupported Document',
    description: 'Severely corrupted file or non-medical artifact lacking readable textual entities.',
    expectedBehavior: 'Detects page has no readable clinical text. Marks pipeline status as Failed, provides clear error and retry prompt.',
    sampleFilename: 'Unreadable_Corrupt_Doc.png',
    category: 'other',
    rawDocumentMock: {
      filename: 'Unreadable_Corrupt_Doc.png',
      fileType: 'png',
      category: 'other',
      pageCount: 1,
      ocrConfidence: 12,
      status: 'Failed',
      qualityIssues: [
        {
          type: 'unreadable',
          severity: 'error',
          message: 'Unable to detect legible medical text or recognized clinical structures',
          recommendation: 'Please upload a legible prescription, lab report, or discharge summary.',
        },
      ],
    },
  },
];
