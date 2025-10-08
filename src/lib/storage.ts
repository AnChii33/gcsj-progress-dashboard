import { Participant, DailySnapshot, CsvUpload } from '../types';

const STORAGE_KEYS = {
  PARTICIPANTS: 'gcskb_participants',
  SNAPSHOTS: 'gcskb_snapshots',
  UPLOADS: 'gcskb_uploads',
};

export const storage = {
  getParticipants(): Participant[] {
    const data = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    return data ? JSON.parse(data) : [];
  },

  setParticipants(participants: Participant[]): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
  },

  getSnapshots(): DailySnapshot[] {
    const data = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    return data ? JSON.parse(data) : [];
  },

  setSnapshots(snapshots: DailySnapshot[]): void {
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
  },

  addSnapshot(snapshot: DailySnapshot): void {
    const snapshots = this.getSnapshots();
    snapshots.push(snapshot);
    this.setSnapshots(snapshots);
  },

  getUploads(): CsvUpload[] {
    const data = localStorage.getItem(STORAGE_KEYS.UPLOADS);
    return data ? JSON.parse(data) : [];
  },

  setUploads(uploads: CsvUpload[]): void {
    localStorage.setItem(STORAGE_KEYS.UPLOADS, JSON.stringify(uploads));
  },

  addUpload(upload: CsvUpload): void {
    const uploads = this.getUploads();
    uploads.push(upload);
    this.setUploads(uploads);
  },

  /**
   * Remove upload by id, delete related participants and snapshots, and delete the CSV file from data folder.
   * @param uploadId The id of the upload to remove
   * @param filename The filename of the CSV to delete from data folder
   * @param reportDate The reportDate of the upload (to match snapshots)
   */
  async removeUpload(uploadId: string, filename: string, reportDate: string): Promise<void> {
    // Remove upload from uploads
    const uploads = this.getUploads();
    const filteredUploads = uploads.filter((u) => u.id !== uploadId);
    this.setUploads(filteredUploads);

    // Remove snapshots for this reportDate
    const snapshots = this.getSnapshots();
    const filteredSnapshots = snapshots.filter((s) => s.date !== reportDate);
    this.setSnapshots(filteredSnapshots);

    // Remove participants who only have history for this reportDate
    const participants = this.getParticipants();
    // Find participantIds that had a snapshot for this reportDate
    const removedSnapshotIds = snapshots.filter((s) => s.date === reportDate).map((s) => s.participantId);
    // Remove participants if they have no other snapshots left
    const remainingSnapshotIds = filteredSnapshots.map((s) => s.participantId);
    const filteredParticipants = participants.filter((p) => remainingSnapshotIds.includes(p.id));
    this.setParticipants(filteredParticipants);

    // Delete the CSV file from the data folder (if running in Node/Electron)
    try {
      // @ts-ignore
      if (typeof window === 'undefined' && require) {
        const fs = require('fs');
        const path = require('path');
        const dataPath = path.join(__dirname, '../data', filename);
        if (fs.existsSync(dataPath)) {
          fs.unlinkSync(dataPath);
        }
      }
    } catch (e) {
      // Ignore file deletion errors in browser
    }
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
    localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);
    localStorage.removeItem(STORAGE_KEYS.UPLOADS);
  },
};
