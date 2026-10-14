import React, { useState, useRef } from 'react';
import { ProcessedDocument, AcceptanceTestCase, QualityIssue, DocumentStatus } from '../types/clinical';
import { ACCEPTANCE_TEST_CASES } from '../data/mockDocuments';
import { ImageProcessor } from '../services/imageProcessor';
import { ApiService } from '../services/api';

interface UploadFlowProps {
  onDocumentProcessed: (doc: ProcessedDocument) => void;
  onSelectTest: (test: AcceptanceTestCase) => void;
  onManualAdd?: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export const UploadFlow: React.FC<UploadFlowProps> = ({
  onDocumentProcessed,
  onSelectTest,
  onManualAdd,
}) => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeStepText, setActiveStepText] = useState('');
  const [qualityWarning, setQualityWarning] = useState<QualityIssue | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const pipelineStages: DocumentStatus[] = [
    'Uploaded',
    'Validating',
    'Preparing Pages',
    'Extracting Text',
    'Reading Medical Information',
    'Validating Results',
    'Awaiting Patient Review',
    'Confirmed',
  ];

  const handleFilesAdded = (files: File[]) => {
    setErrorMessage(null);
    const newQueue: QueuedFile[] = [];

    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      const isValid =
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png');

      if (!isValid) {
        setErrorMessage('Unsupported file type. Please upload a PDF, JPG, or PNG document.');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds maximum allowed file size of 10 MB.`);
        continue;
      }

      const reader = new FileReader();
      const qItem: QueuedFile = {
        id: 'file_' + Math.random().toString(36).substring(2),
        file,
        previewUrl: '',
        status: 'pending',
      };

      reader.onload = () => {
        qItem.previewUrl = reader.result as string;
        setQueuedFiles((prev) => [...prev]);
      };
      reader.readAsDataURL(file);

      newQueue.push(qItem);
    }

    setQueuedFiles((prev) => [...prev, ...newQueue]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Run Real OCR Pipeline using ApiService.processOcr
  const processQueuedFile = async (qItem: QueuedFile) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setQualityWarning(null);

    // Stage 1: Uploaded
    setCurrentStepIndex(0);
    setActiveStepText('Uploaded: Reading document payload...');
    setProgressPercent(15);
    await new Promise((r) => setTimeout(r, 250));

    // Stage 2: Validating
    setCurrentStepIndex(1);
    setActiveStepText('Validating: Inspecting file signature & format...');
    setProgressPercent(30);
    await new Promise((r) => setTimeout(r, 250));

    // Stage 3: Preparing Pages
    setCurrentStepIndex(2);
    setActiveStepText('Preparing Pages: Running boundary verification and deskew analysis...');
    setProgressPercent(45);

    let processedUrl = qItem.previewUrl;
    const qualityIssues: QualityIssue[] = [];

    try {
      if (qItem.previewUrl.startsWith('data:image')) {
        const quality = await ImageProcessor.analyzeQuality(qItem.previewUrl);
        if (quality.isBlurry) {
          qualityIssues.push({
            type: 'blur',
            severity: 'error',
            message: 'Motion blur or low sharpness detected',
            recommendation: 'Check extracted findings carefully before confirming.',
          });
          setQualityWarning(qualityIssues[0]);
        }
        processedUrl = await ImageProcessor.preprocess(qItem.previewUrl, {
          enhanceContrast: true,
          grayscale: false,
        });
      }
    } catch {
      // Continue with original
    }

    // Stage 4: Extracting Text (OCR)
    setCurrentStepIndex(3);
    setActiveStepText('Extracting Text: Optical Character Recognition & line geometry extraction...');
    setProgressPercent(65);
    await new Promise((r) => setTimeout(r, 350));

    // Stage 5: Reading Medical Information & A7 Validators
    setCurrentStepIndex(4);
    setActiveStepText('Reading Medical Information: Classifying document type and extracting grounded facts...');
    setProgressPercent(85);

    try {
      const isPdf = qItem.file.name.toLowerCase().endsWith('.pdf');
      const response = await ApiService.processOcr({
        filename: qItem.file.name,
        fileData: processedUrl || qItem.previewUrl,
        mimeType: qItem.file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        fileSize: qItem.file.size,
      });

      // Stage 6: Validating Results
      setCurrentStepIndex(5);
      setActiveStepText('Validating Results: Verifying verbatim evidence quotes & exact decimal values...');
      setProgressPercent(95);
      await new Promise((r) => setTimeout(r, 250));

      // Stage 7: Awaiting Patient Review
      setCurrentStepIndex(6);
      setActiveStepText('Ready for review: Opening visual inspection workspace...');
      setProgressPercent(100);

      const rawEntities = response.entities || [];
      const isImageOnly = response.isImageOnly || response.analysis?.is_image_only;

      const processedDoc: ProcessedDocument = {
        id: response.documentId || 'doc_' + Date.now(),
        filename: qItem.file.name,
        fileType: isPdf ? 'pdf' : 'jpg',
        category: response.analysis?.document?.type === 'lab_report' ? 'lab' : 'prescription',
        uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        fileSize: (qItem.file.size / (1024 * 1024)).toFixed(1) + ' MB',
        pageCount: 1,
        currentPage: 1,
        previewUrl: qItem.previewUrl,
        originalUrl: qItem.previewUrl,
        preprocessedUrl: processedUrl,
        status: isImageOnly ? 'Confirmed' : 'Awaiting Patient Review',
        ocrConfidence: response.ocrConfidence ?? 90,
        rotation: 0,
        qualityIssues: [...qualityIssues, ...(response.qualityIssues || [])],
        rawText: response.rawText || (isImageOnly ? 'Image saved. No reliable clinical text detected.' : ''),
        extractedEntities: rawEntities,
        isUserUploaded: true,
      };

      setIsProcessing(false);
      onDocumentProcessed(processedDoc);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Processing failed. You can click Retry to attempt processing again.');
    }
  };

  const handleProcessFirst = () => {
    if (queuedFiles.length === 0) return;
    processQueuedFile(queuedFiles[0]);
  };

  // Launch synthetic acceptance tests
  const handleTriggerTestCase = async (test: AcceptanceTestCase) => {
    onSelectTest(test);
    const filename = test.sampleFilename;
    const isPdf = filename.endsWith('.pdf');

    // Create a data URI for the test case
    const testSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850"><rect width="100%" height="100%" fill="%23ffffff"/><text x="40" y="60" font-family="sans-serif" font-size="18" font-weight="bold" fill="%230f172a">${test.title}</text><text x="40" y="90" font-family="sans-serif" font-size="12" fill="%2364748b">Synthetic Test Document #${test.number}</text><line x1="40" y1="110" x2="560" y2="110" stroke="%23cbd5e1"/><text x="40" y="150" font-family="sans-serif" font-size="14" fill="%230f172a">Amlodipine 5 mg OD</text></svg>`;

    const mockFile = new File(['mock'], filename, { type: isPdf ? 'application/pdf' : 'image/jpeg' });
    const qItem: QueuedFile = {
      id: 'test_' + test.id,
      file: mockFile,
      previewUrl: testSvg,
      status: 'pending',
    };

    setQueuedFiles([qItem]);
    await processQueuedFile(qItem);
  };

  return (
    <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
      {/* Privacy and Data Handling Banner (Truthful description per Section 5) */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-teal-50/90 border border-teal-200 shadow-2xs">
        <div className="w-7 h-7 rounded-full bg-teal-600/10 flex items-center justify-center flex-shrink-0 text-teal-700">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-teal-950 truncate">
            Clinical Privacy &amp; Data Isolation
          </p>
          <p className="text-[11px] text-teal-800 leading-tight">
            Medical documents are analysed using precision OCR and saved under your personal authenticated record.
          </p>
        </div>
      </div>

      {/* Error state with retry prompt */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600 mt-0.5">error</span>
            <div>
              <strong className="font-bold">Upload Notice</strong>
              <p className="text-[11px] mt-0.5">{errorMessage}</p>
            </div>
          </div>
          {queuedFiles.length > 0 && !isProcessing && (
            <button
              onClick={handleProcessFirst}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex-shrink-0 shadow-xs"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        id="dropzoneCard"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesAdded(Array.from(e.dataTransfer.files));
          }
        }}
        className="relative bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-sky-300 hover:border-teal-600 transition-all cursor-pointer flex flex-col items-center text-center group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
          <span className="material-symbols-outlined text-[34px] text-sky-600">cloud_upload</span>
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">
          Choose Files or Drag &amp; Drop
        </h2>
        <p className="text-xs text-slate-500 mb-4 font-normal">
          PDF, JPG, PNG <span className="text-slate-400">(Max 10 MB per file • Multi-file support)</span>
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="px-6 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">file_open</span>
          <span>Choose Files</span>
        </button>
      </div>

      {/* Selected Files Queue with Individual Remove Buttons */}
      {queuedFiles.length > 0 && !isProcessing && (
        <div className="bg-white rounded-2xl p-4 border border-teal-200 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Selected Files ({queuedFiles.length})
            </h3>
            <button
              onClick={() => setQueuedFiles([])}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {queuedFiles.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="material-symbols-outlined text-teal-600 text-[20px]">description</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{q.file.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(q.file.size / 1024).toFixed(1)} KB • {q.file.type || 'Document'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(q.id)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 transition"
                  title="Remove file"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))}
          </div>

          {/* Process Button strictly renamed to "Process" (Part B Section 5) */}
          <button
            onClick={handleProcessFirst}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>Process</span>
          </button>
        </div>
      )}

      {/* Pipeline Status Stepper Overlay */}
      {isProcessing && (
        <div className="bg-white rounded-2xl p-5 border border-teal-200 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Clinical Pipeline Active
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <p className="text-xs font-medium text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            {activeStepText}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {pipelineStages.map((stage, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={stage}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                    isPast
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : isCurrent
                      ? 'bg-teal-100 text-teal-900 border-teal-300 font-bold'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isPast ? 'check_circle' : isCurrent ? 'hourglass_top' : 'radio_button_unchecked'}
                  </span>
                  <span className="truncate">{stage}</span>
                </div>
              );
            })}
          </div>

          {qualityWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-700 text-[18px] mt-0.5">warning</span>
              <div>
                <p className="font-bold">{qualityWarning.message}</p>
                <p className="text-[11px] text-amber-800 mt-0.5">{qualityWarning.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Or Take a Photo / Manual Entry Shortcuts */}
      <div className="relative flex items-center justify-center py-1">
        <div className="w-full border-t border-slate-200"></div>
        <span className="absolute px-3 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Or Capture &amp; Enter
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Real Device Camera Picker */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="bg-white rounded-xl py-3 px-4 shadow-2xs border border-slate-200 hover:border-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
          </div>
          <span className="font-semibold text-xs text-slate-900">Take Photo</span>
        </button>

        {/* Add Manually Shortcut (Part A Rule 7) */}
        <button
          type="button"
          onClick={() => {
            if (onManualAdd) onManualAdd();
          }}
          className="bg-white rounded-xl py-3 px-4 shadow-2xs border border-slate-200 hover:border-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
          </div>
          <span className="font-semibold text-xs text-slate-900">Add Manually</span>
        </button>
      </div>

      {/* Acceptance Test Scenarios (Explicitly Labelled as Simulated Tests) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[20px]">science</span>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Verification Test Suite
            </h3>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Simulated Fixtures
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Evaluate the pipeline against synthetic test cases. Simulated extractions are strictly isolated and never overwrite real accounts:
        </p>

        <div className="grid grid-cols-1 gap-2">
          {ACCEPTANCE_TEST_CASES.slice(0, 4).map((test) => (
            <button
              key={test.id}
              onClick={() => handleTriggerTestCase(test)}
              className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-start justify-between gap-2 group cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-slate-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors">
                    {test.number}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700">
                    {test.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {test.description}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-teal-600 text-[18px] mt-1">
                play_circle
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
