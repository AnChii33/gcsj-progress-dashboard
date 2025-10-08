export interface Participant {
  id: string;
  userName: string;
  userEmail: string;
  profileUrl: string;
  profileStatus: string;
  redemptionStatus: string;
  allCompleted: string;
  skillBadgesCount: number;
  skillBadgeNames: string;
  arcadeGamesCount: number;
  arcadeGameNames: string;
}

export interface DailySnapshot {
  id: string;
  participantId: string;
  date: string;
  skillBadgesCount: number;
  arcadeGamesCount: number;
  skillBadgeNames: string;
  arcadeGameNames: string;
}

export interface CsvUpload {
  id: string;
  filename: string;
  uploadDate: string;
  reportDate: string;
  participantCount: number;
}

export interface ParticipantWithProgress extends Participant {
  history: DailySnapshot[];
  progressChange?: number;
  rank?: number;
}
