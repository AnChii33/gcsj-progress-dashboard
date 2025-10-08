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

  removeUpload(uploadId: string): void {
    const uploads = this.getUploads();
    const filtered = uploads.filter((u) => u.id !== uploadId);
    this.setUploads(filtered);
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
    localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);
    localStorage.removeItem(STORAGE_KEYS.UPLOADS);
  },
};
