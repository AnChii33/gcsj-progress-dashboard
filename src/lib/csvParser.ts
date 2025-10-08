import Papa from 'papaparse';
import { Participant, DailySnapshot } from '../types';
import { storage } from './storage';

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
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const participants: Participant[] = [];
          const snapshots: DailySnapshot[] = [];
          const existingParticipants = storage.getParticipants();

          results.data.forEach((row) => {
            if (!row['User Name'] || !row['User Email']) return;

            const email = row['User Email'].trim();
            let participant = existingParticipants.find(
              (p) => p.userEmail === email
            );

            const participantId = participant?.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

            const snapshot: DailySnapshot = {
              id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
