import React, { useState, useRef } from 'react';
import { ShieldCheck, AlertCircle, FileSearch, UploadCloud, FolderOpen, Camera, FileEdit } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ProcessedDocument, AcceptanceTestCase } from '../types/clinical';
import { ApiService } from '../services/api';

interface UploadFlowProps {
  onDocumentProcessed: (doc: ProcessedDocument) => void;
  onSelectTest?: (test: AcceptanceTestCase) => void;
  onManualAdd?: () => void;
}

export const UploadFlow: React.FC<UploadFlowProps> = ({
  onDocumentProcessed,
  onManualAdd,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFilename, setProcessingFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFilesAdded = async (files: File[]) => {
    setErrorMessage(null);
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      const isValid =
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png');

      if (!isValid) {
        setErrorMessage('Unsupported file type. Please upload a PDF, JPG, or PNG document.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds maximum allowed file size of 10 MB.`);
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingFilename(
      validFiles.length === 1
        ? validFiles[0].name
        : `${validFiles.length} documents (${validFiles.map((f) => f.name).join(', ')})`
    );

    const processedList: ProcessedDocument[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const dataUrl = await readFileAsDataUrl(file);
        const isPdf = file.name.toLowerCase().endsWith('.pdf');

        let response: any;
        try {
          response = await ApiService.processOcr({
            filename: file.name,
            fileData: dataUrl,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            fileSize: file.size,
          });
        } catch (ocrErr: any) {
          console.warn('Network OCR failed, falling back to on-device parsing:', ocrErr);
          response = ApiService.clientSideProcessDocument({
            filename: file.name,
            fileData: dataUrl,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            fileSize: file.size,
          });
        }

        if (!response) {
          response = ApiService.clientSideProcessDocument({
            filename: file.name,
            fileData: dataUrl,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            fileSize: file.size,
          });
        }

        if (!response || response.success === false) {
          setErrorMessage(response?.errorMessage || `Processing failed for "${file.name}". File may be corrupt or unreadable.`);
          continue;
        }

        const isImageOnly = Boolean(response.isImageOnly);
        const docCategory = (response.category || (response.documentType === 'lab_report' ? 'lab' : response.documentType === 'discharge_summary' ? 'discharge' : response.documentType === 'imaging_report' ? 'scan' : 'prescription')) as any;

        const qualityIssues = [...(response.qualityIssues || [])];
        if (response.isUncertainType) {
          qualityIssues.push({
            type: 'unreadable',
            severity: 'warning',
            message: 'Document type uncertain. Please review findings or select the document category.',
            recommendation: 'Check the classification in clinical review.',
          });
        }

        const processedDoc: ProcessedDocument = {
          id: response.documentId || 'doc_' + Date.now() + '_' + i,
          filename: file.name,
          fileType: isPdf ? 'pdf' : 'jpg',
          category: docCategory,
          uploadDate: response.uploadDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          fileSize: response.fileSize || (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          pageCount: response.pageCount || 1,
          currentPage: 1,
          previewUrl: dataUrl,
          originalUrl: dataUrl,
          preprocessedUrl: dataUrl,
          status: isImageOnly ? 'Confirmed' : 'Awaiting Patient Review',
          ocrConfidence: response.ocrConfidence ?? (isImageOnly ? 85 : 95),
          rotation: 0,
          qualityIssues,
          rawText: response.rawText || (isImageOnly ? 'No reliable clinical text detected. Upload the corresponding medical report if available.' : ''),
          extractedEntities: response.entities || [],
          isUserUploaded: true,
        };

        // Persist to user records
        try {
          await ApiService.saveDocument(processedDoc);
        } catch (saveErr) {
          console.warn('Document server save warning:', saveErr);
        }

        processedList.push(processedDoc);
      }


      setIsProcessing(false);

      // Directly show the related content in the verification workspace
      if (processedList.length > 0) {
        onDocumentProcessed(processedList[0]);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Processing failed. Please check the document and try again.');
    }
  };

  const handleTakePhoto = async () => {
    setErrorMessage(null);
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        if (photo && photo.dataUrl) {
          const res = await fetch(photo.dataUrl);
          const blob = await res.blob();
          const ext = photo.format || 'jpg';
          const file = new File([blob], `scan_${Date.now()}.${ext}`, {
            type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          });
          handleFilesAdded([file]);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Native camera capture error or cancelled:', err);
      if (err?.message?.includes('User cancelled') || err?.message?.includes('cancelled')) {
        return;
      }
    }

    // Web fallback if browser or native camera unavailable
    cameraInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
      {/* Privacy and Data Handling Banner */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-teal-50/90 border border-teal-200 shadow-2xs">
        <div className="w-7 h-7 rounded-full bg-teal-600/10 flex items-center justify-center flex-shrink-0 text-teal-700">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-teal-950 truncate">
            Clinical Privacy &amp; Data Isolation
          </p>
          <p className="text-[11px] text-teal-800 leading-tight">
            Medical documents are analysed directly and saved securely under your personal authenticated record.
          </p>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold">Upload Notice</strong>
              <p className="text-[11px] mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Processing Indicator (Direct, minimal, no fake stepper stages) */}
      {isProcessing ? (
        <div className="bg-white rounded-2xl p-8 border border-teal-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-3 border-teal-100 border-t-teal-600 animate-spin"></div>
            <FileSearch className="w-6 h-6 text-teal-600 absolute" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Processing Medical Document...</h3>
            <p className="text-xs text-teal-700 font-medium mt-1 truncate max-w-xs">{processingFilename}</p>
            <p className="text-[11px] text-slate-500 mt-1.5">Extracting medical records and opening verification workspace directly...</p>
          </div>
        </div>
      ) : (
        /* Main Drag & Drop Zone */
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
          className="relative bg-white rounded-2xl p-7 shadow-sm border-2 border-dashed border-teal-200 hover:border-teal-600 transition-all cursor-pointer flex flex-col items-center text-center group"
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

          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
            <UploadCloud className="w-8 h-8 text-[#006D60]" />
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
            className="px-6 py-2.5 rounded-full bg-[#006D60] hover:bg-[#005a4e] text-white font-semibold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Choose Files</span>
          </button>
        </div>
      )}

      {/* Quick Entry Shortcuts */}
      <div className="relative flex items-center justify-center py-1">
        <div className="w-full border-t border-slate-200"></div>
        <span className="absolute px-3 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Or Quick Actions
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Real Device Camera Picker */}
        <button
          type="button"
          onClick={handleTakePhoto}
          className="bg-white rounded-xl py-3 px-4 shadow-2xs border border-slate-200 hover:border-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-[#006D60] group-hover:text-white transition-colors">
            <Camera className="w-4 h-4" />
          </div>
          <span className="font-semibold text-xs text-slate-900">Take Photo</span>
        </button>

        {/* Add Manually Shortcut */}
        <button
          type="button"
          onClick={() => {
            if (onManualAdd) onManualAdd();
          }}
          className="bg-white rounded-xl py-3 px-4 shadow-2xs border border-slate-200 hover:border-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <FileEdit className="w-4 h-4" />
          </div>
          <span className="font-semibold text-xs text-slate-900">Add Manually</span>
        </button>
      </div>
    </div>
  );
};
