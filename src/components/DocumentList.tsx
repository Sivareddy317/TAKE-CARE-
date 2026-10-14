import React, { useState } from 'react';
import { ProcessedDocument } from '../types/clinical';

interface DocumentListProps {
  documents: ProcessedDocument[];
  onSelectDocument: (doc: ProcessedDocument) => void;
  onUploadMore: () => void;
  onShareDocument: (doc: ProcessedDocument) => void;
  onDeleteDocument: (docId: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onSelectDocument,
  onUploadMore,
  onShareDocument,
  onDeleteDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'prescription' | 'lab' | 'discharge'>('all');
  const [selectedDocForModal, setSelectedDocForModal] = useState<ProcessedDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesQuery =
      searchQuery === '' ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.rawText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeFilter === 'all' ||
      (activeFilter === 'prescription' && doc.category === 'prescription') ||
      (activeFilter === 'lab' && doc.category === 'lab') ||
      (activeFilter === 'discharge' && doc.category === 'discharge');

    return matchesQuery && matchesCategory;
  });

  return (
    <div className="flex flex-col w-full pb-24 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-teal-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Search & Storage Summary Bar */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medical records, tags..."
            className="w-full h-11 pl-10 pr-10 bg-slate-100 text-slate-900 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all border border-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        {/* Storage Mini Indicator */}
        <div className="flex items-center justify-between px-1 py-0.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-teal-600 text-[16px]">folder_managed</span>
            <span>{documents.length} Records Indexed</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-teal-700">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span>AI Auto-synced</span>
          </div>
        </div>
      </div>

      {/* Filter Category Chips (Horizontal Scrollable) */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex-shrink-0 cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
          }`}
        >
          All ({documents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('prescription')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 cursor-pointer ${
            activeFilter === 'prescription'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Prescriptions ({documents.filter((d) => d.category === 'prescription').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('lab')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 cursor-pointer ${
            activeFilter === 'lab'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Lab Reports ({documents.filter((d) => d.category === 'lab').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('discharge')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 cursor-pointer ${
            activeFilter === 'discharge'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Discharge Summaries ({documents.filter((d) => d.category === 'discharge').length})
        </button>
      </div>

      {/* Document List Cards or Empty State */}
      <div className="flex flex-col gap-2.5 mb-6">
        {filteredDocs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[26px]">folder_open</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900">
                {documents.length === 0 ? 'No medical documents yet' : 'No documents match this filter'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {documents.length === 0
                  ? 'Upload a prescription, lab report, or discharge summary to get started.'
                  : 'Try selecting "All" or clearing the search query to view your records.'}
              </p>
            </div>
            {documents.length === 0 ? (
              <button
                type="button"
                onClick={onUploadMore}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Upload Document</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isPdf = doc.fileType === 'pdf';
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="group relative flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                      isPdf
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-sky-50 text-sky-600 border border-sky-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {isPdf ? 'picture_as_pdf' : 'image'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                    <span className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition">
                      {doc.filename}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 mt-0.5">
                      <span>Uploaded • {doc.uploadDate}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDocForModal(doc);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button: + Upload More Documents */}
      <div className="sticky bottom-20 w-full pt-1">
        <button
          type="button"
          onClick={onUploadMore}
          className="w-full h-12 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
        >
          <span className="material-symbols-outlined text-[22px]">add</span>
          <span>Upload More Documents</span>
        </button>
      </div>

      {/* 3-Dot Options Bottom Drawer Modal */}
      {selectedDocForModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-4 shadow-2xl border-t border-slate-200 flex flex-col space-y-3">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {selectedDocForModal.filename}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Uploaded • {selectedDocForModal.uploadDate} • {selectedDocForModal.fileSize}
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  const target = selectedDocForModal;
                  setSelectedDocForModal(null);
                  onSelectDocument(target);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-900 transition text-left"
              >
                <span className="material-symbols-outlined text-teal-600 text-[20px]">visibility</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Inspect in Two-Panel OCR Viewer</p>
                  <p className="text-[11px] text-slate-500">Zoom, pan, and verify extracted bounding boxes</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = selectedDocForModal;
                  setSelectedDocForModal(null);
                  onShareDocument(target);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-900 transition text-left"
              >
                <span className="material-symbols-outlined text-sky-600 text-[20px]">share</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Share with Clinician</p>
                  <p className="text-[11px] text-slate-500">Generate 6-digit access code for doctor</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(`Downloaded original ${selectedDocForModal.filename}`);
                  setSelectedDocForModal(null);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-900 transition text-left"
              >
                <span className="material-symbols-outlined text-slate-600 text-[20px]">download</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Download Original</p>
                  <p className="text-[11px] text-slate-500">Save encrypted copy to storage</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const id = selectedDocForModal.id;
                  setSelectedDocForModal(null);
                  onDeleteDocument(id);
                  showToast('Document removed from records.');
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-rose-50 text-rose-700 transition text-left"
              >
                <span className="material-symbols-outlined text-rose-600 text-[20px]">delete</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Delete Document</p>
                  <p className="text-[11px] text-rose-600/80">Remove file and associated summary facts</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
