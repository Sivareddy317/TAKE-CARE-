import React, { useState, useRef } from 'react';
import { ProcessedDocument, MedicalEntity } from '../types/clinical';
import { ImageProcessor } from '../services/imageProcessor';
import { checkIfMayBeOutdated } from '../services/clinicalAnalysis';

interface TwoPanelVerificationProps {
  document: ProcessedDocument;
  onUpdateEntity: (docId: string, entityId: string, status: 'Confirmed' | 'Rejected' | 'Edited', newValue?: string) => void;
  onConfirmAll: (docId: string) => void;
  onRetryProcessing: (docId: string, options?: { rotation?: number; enhanceContrast?: boolean }) => void;
  onClose: () => void;
  onAddManualEntity?: (docId: string, entity: Partial<MedicalEntity>) => void;
}

export const TwoPanelVerification: React.FC<TwoPanelVerificationProps> = ({
  document,
  onUpdateEntity,
  onConfirmAll,
  onRetryProcessing,
  onClose,
  onAddManualEntity,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentFilter, setCurrentFilter] = useState<'original' | 'contrast' | 'grayscale' | 'threshold'>('original');
  const [rotationAngle, setRotationAngle] = useState(document.rotation || 0);
  const [activeEntityId, setActiveEntityId] = useState<string | null>(document.extractedEntities[0]?.id || null);
  const [editingEntity, setEditingEntity] = useState<MedicalEntity | null>(null);
  const [editInputValue, setEditInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(document.currentPage || 1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual entry state (Part A Rule 7)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCategory, setManualCategory] = useState<'allergy' | 'medication' | 'condition' | 'lab'>('allergy');
  const [manualTitle, setManualTitle] = useState('');
  const [manualValue, setManualValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(0.5, prev + delta), 3.0));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    const nextAngle = (rotationAngle + 90) % 360;
    setRotationAngle(nextAngle);
    onRetryProcessing(document.id, { rotation: nextAngle });
    showToast(`Rotated page to ${nextAngle}°`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleStartEdit = (entity: MedicalEntity) => {
    setEditingEntity(entity);
    setEditInputValue(entity.value);
  };

  const handleSaveEdit = () => {
    if (editingEntity) {
      onUpdateEntity(document.id, editingEntity.id, 'Edited', editInputValue);
      setEditingEntity(null);
      showToast('Field value updated & confirmed.');
    }
  };

  const handleAddManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newEnt: MedicalEntity = {
      id: 'manual_' + Date.now(),
      category: manualCategory,
      title: manualTitle.trim(),
      value: (manualValue || manualTitle).trim(),
      sourceDoc: 'Entered by patient',
      pageNumber: 1,
      confidence: 100,
      status: 'Confirmed',
      details: 'Information entered directly by patient.',
    };

    if (onAddManualEntity) {
      onAddManualEntity(document.id, newEnt);
    } else {
      document.extractedEntities.push(newEnt);
    }

    setIsManualModalOpen(false);
    setManualTitle('');
    setManualValue('');
    showToast('Recorded manually as "Entered by patient".');
  };

  // Compute CSS filter style for active image filter
  const getImageFilterStyle = () => {
    switch (currentFilter) {
      case 'contrast':
        return 'contrast(150%) brightness(105%)';
      case 'grayscale':
        return 'grayscale(100%) contrast(120%)';
      case 'threshold':
        return 'grayscale(100%) contrast(250%) brightness(95%)';
      default:
        return 'none';
    }
  };

  const activeEntity = document.extractedEntities.find((e) => e.id === activeEntityId);
  const isPdf = document.fileType === 'pdf' || document.filename.toLowerCase().endsWith('.pdf');
  const isImageOnly = document.extractedEntities.length === 0 && (document.category === 'scan' || document.ocrConfidence < 50 || document.rawText.includes('Image only') || document.rawText.includes('Image saved'));
  const mayBeOutdated = checkIfMayBeOutdated(document.uploadDate);

  // Compute readability label strictly from OCR score (Part A Section A8)
  const getReadabilityLabel = (conf: number): 'Clear' | 'Check carefully' | 'Unclear' => {
    if (conf >= 80) return 'Clear';
    if (conf >= 50) return 'Check carefully';
    return 'Unclear';
  };
  const readabilityLabel = getReadabilityLabel(document.ocrConfidence);

  const confirmedCount = document.extractedEntities.filter((e) => e.status === 'Confirmed' || e.status === 'Edited').length;
  const isSyncDisabled = !isImageOnly && confirmedCount === 0;

  const handleConfirmAllClick = () => {
    document.extractedEntities.forEach((ent) => {
      if (ent.status !== 'Rejected') {
        ent.status = 'Confirmed';
      }
    });
    document.status = 'Confirmed';
    onConfirmAll(document.id);
    showToast('All reviewed findings confirmed and saved.');
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-100 text-slate-900 pb-20 animate-fadeIn">
      {/* Top Banner: Verification Chrome */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-14 z-30 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
            title="Return to Documents"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {document.filename}
              </h2>
              {/* Readability label replaces model percentages (Part A Section A8) */}
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  readabilityLabel === 'Clear'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : readabilityLabel === 'Check carefully'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                Readability: {readabilityLabel}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700">
                Page {currentPage} of {document.pageCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Visual Verification &amp; Clinical Provenance Inspector
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action button: Save as image for image-only; Confirm reviewed findings for text records */}
          <button
            onClick={handleConfirmAllClick}
            disabled={isSyncDisabled}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition active:scale-95 ${
              isSyncDisabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            <span>{isImageOnly ? 'Save as Image' : 'Confirm reviewed findings'}</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-teal-400 text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Two-Panel Split Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL: Document Viewer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[540px] lg:h-[720px]">
          {/* Viewer Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleZoom(-0.15)}
                className="w-7 h-7 rounded bg-white hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span className="text-[11px] font-mono px-1 font-bold text-slate-700 w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.15)}
                className="w-7 h-7 rounded bg-white hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
              <button
                onClick={handleResetView}
                className="px-2 py-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-[11px] font-medium text-slate-700 cursor-pointer"
                title="Reset View"
              >
                Fit
              </button>
              <button
                onClick={handleRotate}
                className="px-2 py-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                title="Rotate 90 degrees"
              >
                <span className="material-symbols-outlined text-[14px]">rotate_right</span>
                <span>{rotationAngle}°</span>
              </button>
            </div>

            {/* Preprocessing filter presets (Working CSS Filters) */}
            {!isPdf && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Filter:</span>
                {(['original', 'contrast', 'grayscale', 'threshold'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCurrentFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition cursor-pointer ${
                      currentFilter === filter
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Document Preview Container */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-1 bg-slate-900/5 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing p-4 select-none"
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                transformOrigin: 'center center',
              }}
              className="relative max-w-full max-h-full shadow-xl rounded-lg bg-white overflow-hidden"
            >
              {/* Working PDF Viewer: embeds object or iframe so PDFs never show broken images! */}
              {isPdf ? (
                <div className="w-[500px] h-[650px] bg-slate-100 flex items-center justify-center">
                  <object
                    data={document.previewUrl}
                    type="application/pdf"
                    className="w-full h-full rounded-lg"
                  >
                    <div className="p-6 text-center text-xs text-slate-600">
                      <span className="material-symbols-outlined text-slate-400 text-[40px] mb-2">picture_as_pdf</span>
                      <p className="font-bold">{document.filename}</p>
                      <p className="text-[11px] text-slate-400 mt-1">PDF Document preview loaded.</p>
                      <a
                        href={document.previewUrl}
                        download={document.filename}
                        className="mt-3 inline-block px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Download PDF
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                /* Working Image Viewer */
                <img
                  src={document.previewUrl}
                  alt={document.filename}
                  style={{ filter: getImageFilterStyle() }}
                  className="max-w-[500px] w-full h-auto object-contain rounded-lg pointer-events-none"
                />
              )}

              {/* Verified OCR Bounding Box Overlays (Zero boxes for image-only or files without text) */}
              {!isImageOnly &&
                document.extractedEntities.map((ent) => {
                  if (!ent.box) return null;
                  const isSelected = ent.id === activeEntityId;
                  // Normalized 0-1000 percentage
                  const topPct = ent.box.ymin / 10 + '%';
                  const leftPct = ent.box.xmin / 10 + '%';
                  const heightPct = (ent.box.ymax - ent.box.ymin) / 10 + '%';
                  const widthPct = (ent.box.xmax - ent.box.xmin) / 10 + '%';

                  return (
                    <div
                      key={ent.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEntityId(ent.id);
                      }}
                      style={{
                        top: topPct,
                        left: leftPct,
                        height: heightPct,
                        width: widthPct,
                      }}
                      title={`${ent.title}: ${ent.value}`}
                      className={`absolute cursor-pointer transition-all rounded ${
                        isSelected
                          ? 'border-2 border-teal-500 bg-teal-500/25 ring-4 ring-teal-300/40 z-20 animate-pulse'
                          : 'border border-dashed border-sky-400 bg-sky-400/10 hover:bg-sky-400/20 z-10'
                      }`}
                    >
                      <span
                        className={`absolute -top-5 left-0 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-100 opacity-90'
                        }`}
                      >
                        {ent.title}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Extracted Findings Review (Part A Section A8 Layout) (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-auto max-h-[720px]">
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 text-[20px]">fact_check</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Clinical Findings Review
              </h3>
            </div>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Add manually</span>
            </button>
          </div>

          {/* Scrollable Findings Container following Part A Section A8 screen order */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. DOCUMENT CARD */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 capitalize">
                  {document.category === 'prescription' ? 'Prescription' : document.category === 'lab' ? 'Lab Report' : document.category} • {document.uploadDate}
                </span>
                <span className="font-semibold text-slate-600">
                  Readability: {readabilityLabel}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {document.rawText ? document.rawText.slice(0, 140) + '...' : 'Verified clinical source record.'}
              </p>
              {mayBeOutdated && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  <span>May no longer be current (older than 6 months)</span>
                </div>
              )}

              {/* Document Type Uncertainty Notice & Selector */}
              {document.qualityIssues?.some((q) => q.message.includes('Document type uncertain')) && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[16px] text-amber-700">help</span>
                    <span>Document type uncertain</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Classification confidence is low. Please select the appropriate document type:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(['prescription', 'lab', 'scan', 'discharge', 'other'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          document.category = cat;
                          showToast(`Category set to ${cat}`);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                          document.category === cat
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100/50'
                        }`}
                      >
                        {cat === 'prescription' ? 'Prescription' : cat === 'lab' ? 'Lab Report' : cat === 'scan' ? 'Radiology/Scan' : cat === 'discharge' ? 'Discharge' : 'Other'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SPECIAL STATE: Image Only */}
            {isImageOnly && (
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-sky-900">
                  <span className="material-symbols-outlined text-sky-700 text-[18px]">image</span>
                  <span>No reliable clinical text detected</span>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed font-medium">
                  No reliable clinical text detected. Upload the corresponding medical report if available.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Add clinical facts manually
                  </button>
                </div>
              </div>
            )}

            {/* 2. FINDINGS LIST */}
            {!isImageOnly && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Findings ({document.extractedEntities.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {confirmedCount} confirmed
                  </span>
                </div>

                {document.extractedEntities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No clinical findings extracted from this document.</p>
                ) : (
                  document.extractedEntities.map((ent) => {
                    const isSelected = ent.id === activeEntityId;
                    const isConfirmed = ent.status === 'Confirmed' || ent.status === 'Edited';
                    const isRejected = ent.status === 'Rejected';

                    return (
                      <div
                        key={ent.id}
                        onClick={() => setActiveEntityId(ent.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        } ${isRejected ? 'opacity-50 line-through' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {ent.category}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 mt-1">
                              {ent.title}
                            </h5>
                            <p className="text-xs font-semibold text-teal-800 mt-0.5">
                              {ent.value}
                            </p>
                            {ent.secondaryValue && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {ent.secondaryValue}
                              </p>
                            )}
                          </div>

                          {/* Status Chip */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isConfirmed
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isRejected
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isConfirmed ? 'Patient confirmed' : isRejected ? 'Rejected' : 'Extracted'}
                          </span>
                        </div>

                        {/* Evidence quote and provenance link */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                          <span className="truncate max-w-[200px] italic">
                            {ent.details || `Page ${ent.pageNumber || 1}`}
                          </span>
                          {ent.box && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEntityId(ent.id);
                              }}
                              className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                            >
                              [see source]
                            </button>
                          )}
                        </div>

                        {/* Review Actions: Edit, Confirm, Reject */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(ent);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              ent.status = 'Rejected';
                              onUpdateEntity(document.id, ent.id, 'Rejected');
                              showToast('Finding marked as rejected.');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded border border-rose-200 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              ent.status = 'Confirmed';
                              onUpdateEntity(document.id, ent.id, 'Confirmed');
                              showToast('Finding confirmed and updated.');
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${
                              isConfirmed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }`}
                          >
                            {isConfirmed ? '✓ Confirmed' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 3. NOT FOUND IN THIS FILE (Part A Section A8) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              <strong className="font-semibold text-slate-700">Not found in this file: </strong>
              <span>Allergies • Conditions • Lab results</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal (Part A Rule 7) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-[22px]">edit_note</span>
                <h3 className="font-bold text-sm text-slate-900">Add Finding Manually</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Information you remember will be recorded with source <strong>"Entered by patient"</strong> and never falsely attached to uploaded files.
            </p>

            <form onSubmit={handleAddManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as any)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="allergy">Allergy</option>
                  <option value="medication">Medication</option>
                  <option value="condition">Medical Condition</option>
                  <option value="lab">Lab Result</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Finding Name / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dust Mites, Amlodipine, Hypertension"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Value / Dosage / Note</label>
                <input
                  type="text"
                  placeholder="e.g. 5 mg daily, Severe rhinitis"
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Value Modal */}
      {editingEntity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Edit Finding Value</h3>
            <p className="text-xs text-slate-500">Correct the extracted text for: <strong>{editingEntity.title}</strong></p>
            <input
              type="text"
              value={editInputValue}
              onChange={(e) => setEditInputValue(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingEntity(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
