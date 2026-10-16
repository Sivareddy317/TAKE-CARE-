/**
 * Take Care — Pilot Instrumentation & Quality Telemetry Service
 * Local-first, anonymous, strictly opt-in (default OFF).
 * No PII, patient names, phone numbers, or document content are stored or exported.
 */

export interface DocumentReviewMetrics {
  docId: string;
  docType: string;
  facts_confirmed: number;
  facts_rejected: number;
  facts_edited: number;
  timestamp: number;
}

export interface PilotFeedback {
  id: string;
  timestamp: number;
  easeOfUse: number; // 1 - 5
  trustInSummary: number; // 1 - 5
  wouldUseAgain: 'Yes' | 'Maybe' | 'No';
  whatWasConfusing: string;
  freeText: string;
}

export interface PilotTelemetryState {
  enabled: boolean;
  firstUploadTimestamp: number | null;
  firstSummaryConfirmedTimestamp: number | null;
  time_to_first_summary_ms: number | null;
  documentReviews: DocumentReviewMetrics[];
  feedbacks: PilotFeedback[];
}

const STORAGE_KEY = 'takecare_pilot_telemetry_v1';

class PilotMetricsService {
  private state: PilotTelemetryState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): PilotTelemetryState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return {
      enabled: false, // Default: strictly OFF
      firstUploadTimestamp: null,
      firstSummaryConfirmedTimestamp: null,
      time_to_first_summary_ms: null,
      documentReviews: [],
      feedbacks: [],
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  public isEnabled(): boolean {
    return this.state.enabled;
  }

  public setEnabled(val: boolean): void {
    this.state.enabled = val;
    this.saveState();
  }

  public recordUploadStart(): void {
    if (!this.state.enabled) return;
    if (!this.state.firstUploadTimestamp) {
      this.state.firstUploadTimestamp = Date.now();
      this.saveState();
    }
  }

  public recordSummaryConfirmed(): void {
    if (!this.state.enabled) return;
    if (this.state.firstUploadTimestamp && !this.state.time_to_first_summary_ms) {
      this.state.firstSummaryConfirmedTimestamp = Date.now();
      this.state.time_to_first_summary_ms =
        this.state.firstSummaryConfirmedTimestamp - this.state.firstUploadTimestamp;
      this.saveState();
    }
  }

  public recordDocumentReview(
    docType: string,
    confirmed: number,
    rejected: number,
    edited: number
  ): void {
    if (!this.state.enabled) return;
    this.state.documentReviews.push({
      docId: `doc_${Math.random().toString(36).substring(2, 9)}`,
      docType: docType || 'general',
      facts_confirmed: confirmed,
      facts_rejected: rejected,
      facts_edited: edited,
      timestamp: Date.now(),
    });
    this.saveState();
  }

  public submitFeedback(feedback: Omit<PilotFeedback, 'id' | 'timestamp'>): void {
    this.state.feedbacks.push({
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      ...feedback,
    });
    this.saveState();
  }

  public getState(): PilotTelemetryState {
    return { ...this.state };
  }

  public exportCsv(): string {
    const lines: string[] = [];

    // Section 1: Overview
    lines.push('# TAKE CARE PILOT INSTRUMENTATION EXPORT');
    lines.push('# Local-First Anonymous Clinical Telemetry (No PII / No Clinical Content)');
    lines.push(`ExportedAt,${new Date().toISOString()}`);
    lines.push(`TelemetryEnabled,${this.state.enabled}`);
    lines.push(`TimeToFirstSummaryMs,${this.state.time_to_first_summary_ms ?? 'N/A'}`);
    lines.push('');

    // Section 2: Document Reviews
    lines.push('--- DOCUMENT INTERACTION EVENTS ---');
    lines.push('EventDocId,DocType,FactsConfirmed,FactsRejected,FactsEdited,TimestampIso');
    if (this.state.documentReviews.length === 0) {
      lines.push('none,none,0,0,0,none');
    } else {
      for (const rev of this.state.documentReviews) {
        lines.push(
          `${rev.docId},${rev.docType},${rev.facts_confirmed},${rev.facts_rejected},${rev.facts_edited},${new Date(rev.timestamp).toISOString()}`
        );
      }
    }
    lines.push('');

    // Section 3: In-App Feedback
    lines.push('--- PILOT CLINICAL FEEDBACK (5 QUESTIONS) ---');
    lines.push('FeedbackId,EaseOfUse_1to5,TrustInSummary_1to5,WouldUseAgain,WhatWasConfusing,FreeText,TimestampIso');
    if (this.state.feedbacks.length === 0) {
      lines.push('none,0,0,none,none,none,none');
    } else {
      for (const fb of this.state.feedbacks) {
        const cleanConfusing = `"${(fb.whatWasConfusing || '').replace(/"/g, '""')}"`;
        const cleanComment = `"${(fb.freeText || '').replace(/"/g, '""')}"`;
        lines.push(
          `${fb.id},${fb.easeOfUse},${fb.trustInSummary},${fb.wouldUseAgain},${cleanConfusing},${cleanComment},${new Date(fb.timestamp).toISOString()}`
        );
      }
    }

    return lines.join('\n');
  }

  public downloadCsv(): void {
    const csvContent = this.exportCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'pilot_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const pilotMetrics = new PilotMetricsService();
