import Papa from 'papaparse';
import { Participant, DailySnapshot } from '../types';
import { database } from './database';

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface CsvRow {
  'User Name': string;
  'User Email': string;
  'Google Cloud Skills Boost Profile URL': string;
  'Profile URL Status': string;
  'Access Code Redemption Status': string;
  'All Skill Badges & Games Completed': string;
  '# of Skill Badges Completed': string;
  'Names of Completed Skill Badges': string;
  '# of Arcade Games Completed': string;
  'Names of Completed Arcade Games': string;
}

export async function parseCsvFile(
  file: File,
  reportDate: string
): Promise<{ participants: Participant[]; snapshots: DailySnapshot[] }> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      reject(new Error('Invalid file type. Please upload a CSV file'));
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            throw new Error(`CSV parsing error: ${results.errors[0].message}`);
          }

          if (!results.data || results.data.length === 0) {
            throw new Error('CSV file is empty or contains no valid data');
          }

          // Validate CSV structure
          const requiredColumns = [
            'User Name',
            'User Email',
            'Google Cloud Skills Boost Profile URL',
            'Profile URL Status',
            'Access Code Redemption Status',
            '# of Skill Badges Completed',
            'Names of Completed Skill Badges',
            '# of Arcade Games Completed',
            'Names of Completed Arcade Games'
          ];

          const missingColumns = requiredColumns.filter(col => !results.meta.fields?.includes(col));
          if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
          }

          const participants: Participant[] = [];
          const snapshots: DailySnapshot[] = [];
          const existingParticipants = await database.getParticipants();

          results.data.forEach((row) => {
            if (!row['User Name'] || !row['User Email']) return;

            const email = row['User Email'].trim();
            let participant = existingParticipants.find(
              (p) => p.userEmail === email
            );

            // Use UUID format for new participants
            const participantId = participant?.id || generateUUID();

            const skillBadgesCount = parseInt(row['# of Skill Badges Completed']) || 0;
            const arcadeGamesCount = parseInt(row['# of Arcade Games Completed']) || 0;

            const newParticipant: Participant = {
              id: participantId,
              userName: row['User Name'].trim(),
              userEmail: email,
              profileUrl: row['Google Cloud Skills Boost Profile URL'].trim(),
              profileStatus: row['Profile URL Status'].trim(),
              redemptionStatus: row['Access Code Redemption Status'].trim(),
              allCompleted: row['All Skill Badges & Games Completed'].trim(),
              skillBadgesCount,
              skillBadgeNames: row['Names of Completed Skill Badges'].trim(),
              arcadeGamesCount,
              arcadeGameNames: row['Names of Completed Arcade Games'].trim(),
            };

            if (!participant) {
              participants.push(newParticipant);
            } else {
              const index = existingParticipants.findIndex((p) => p.userEmail === email);
              if (index !== -1) {
                existingParticipants[index] = newParticipant;
              }
            }

            // Use UUID format for snapshots
            const snapshot: DailySnapshot = {
              id: generateUUID(),
              participantId,
              date: reportDate,
              skillBadgesCount,
              arcadeGamesCount,
              skillBadgeNames: row['Names of Completed Skill Badges'].trim(),
              arcadeGameNames: row['Names of Completed Arcade Games'].trim(),
            };

            snapshots.push(snapshot);
          });

          const updatedParticipants = [...existingParticipants];
          participants.forEach((p) => {
            if (!updatedParticipants.find((ep) => ep.userEmail === p.userEmail)) {
              updatedParticipants.push(p);
            }
          });

          resolve({ participants: updatedParticipants, snapshots });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}