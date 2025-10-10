import { supabase } from './supabase';
import { Participant, DailySnapshot, CsvUpload } from '../types';

export const database = {
  async getParticipants(): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('user_name', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      userName: row.user_name,
      userEmail: row.user_email,
      profileUrl: row.profile_url,
      profileStatus: row.profile_status,
      redemptionStatus: row.redemption_status,
      allCompleted: row.all_completed,
      skillBadgesCount: row.skill_badges_count,
      skillBadgeNames: row.skill_badge_names,
      arcadeGamesCount: row.arcade_games_count,
      arcadeGameNames: row.arcade_game_names,
    }));
  },

  // OPTIMIZED: Batch upsert all participants at once
  async upsertParticipants(participants: Participant[]): Promise<void> {
    const batchSize = 100; // Supabase handles up to ~1000 rows, but 100 is safer
    
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      const { error } = await supabase
        .from('participants')
        .upsert(
          batch.map(p => ({
            id: p.id,
            user_name: p.userName,
            user_email: p.userEmail,
            profile_url: p.profileUrl,
            profile_status: p.profileStatus,
            redemption_status: p.redemptionStatus,
            all_completed: p.allCompleted,
            skill_badges_count: p.skillBadgesCount,
            skill_badge_names: p.skillBadgeNames,
            arcade_games_count: p.arcadeGamesCount,
            arcade_game_names: p.arcadeGameNames,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'user_email' }
        );

      if (error) throw error;
    }
  },

  async upsertParticipant(participant: Participant): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .upsert({
        id: participant.id,
        user_name: participant.userName,
        user_email: participant.userEmail,
        profile_url: participant.profileUrl,
        profile_status: participant.profileStatus,
        redemption_status: participant.redemptionStatus,
        all_completed: participant.allCompleted,
        skill_badges_count: participant.skillBadgesCount,
        skill_badge_names: participant.skillBadgeNames,
        arcade_games_count: participant.arcadeGamesCount,
        arcade_game_names: participant.arcadeGameNames,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_email' });

    if (error) throw error;
  },

  async getParticipantByEmail(email: string): Promise<Participant | null> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userName: data.user_name,
      userEmail: data.user_email,
      profileUrl: data.profile_url,
      profileStatus: data.profile_status,
      redemptionStatus: data.redemption_status,
      allCompleted: data.all_completed,
      skillBadgesCount: data.skill_badges_count,
      skillBadgeNames: data.skill_badge_names,
      arcadeGamesCount: data.arcade_games_count,
      arcadeGameNames: data.arcade_game_names,
    };
  },

  async getSnapshots(): Promise<DailySnapshot[]> {
    const { data, error } = await supabase
      .from('daily_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      participantId: row.participant_id,
      date: row.snapshot_date,
      skillBadgesCount: row.skill_badges_count,
      arcadeGamesCount: row.arcade_games_count,
      skillBadgeNames: row.skill_badge_names,
      arcadeGameNames: row.arcade_game_names,
    }));
  },

  async getSnapshotsByParticipant(participantId: string): Promise<DailySnapshot[]> {
    const { data, error } = await supabase
      .from('daily_snapshots')
      .select('*')
      .eq('participant_id', participantId)
      .order('snapshot_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      participantId: row.participant_id,
      date: row.snapshot_date,
      skillBadgesCount: row.skill_badges_count,
      arcadeGamesCount: row.arcade_games_count,
      skillBadgeNames: row.skill_badge_names,
      arcadeGameNames: row.arcade_game_names,
    }));
  },

  // OPTIMIZED: Batch insert all snapshots at once
  async addSnapshots(snapshots: DailySnapshot[]): Promise<void> {
    const batchSize = 100;
    
    for (let i = 0; i < snapshots.length; i += batchSize) {
      const batch = snapshots.slice(i, i + batchSize);
      const { error } = await supabase
        .from('daily_snapshots')
        .upsert(
          batch.map(s => ({
            id: s.id,
            participant_id: s.participantId,
            snapshot_date: s.date,
            skill_badges_count: s.skillBadgesCount,
            arcade_games_count: s.arcadeGamesCount,
            skill_badge_names: s.skillBadgeNames,
            arcade_game_names: s.arcadeGameNames,
          })),
          { onConflict: 'participant_id,snapshot_date' }
        );

      if (error) throw error;
    }
  },

  async addSnapshot(snapshot: DailySnapshot): Promise<void> {
    const { error } = await supabase
      .from('daily_snapshots')
      .upsert({
        id: snapshot.id,
        participant_id: snapshot.participantId,
        snapshot_date: snapshot.date,
        skill_badges_count: snapshot.skillBadgesCount,
        arcade_games_count: snapshot.arcadeGamesCount,
        skill_badge_names: snapshot.skillBadgeNames,
        arcade_game_names: snapshot.arcadeGameNames,
      }, { onConflict: 'participant_id,snapshot_date' });

    if (error) throw error;
  },

  async getUploads(): Promise<CsvUpload[]> {
    const { data, error } = await supabase
      .from('csv_uploads')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      filename: row.filename,
      uploadDate: row.upload_date,
      reportDate: row.report_date,
      participantCount: row.participant_count,
    }));
  },

  async addUpload(upload: CsvUpload): Promise<void> {
    const { error } = await supabase
      .from('csv_uploads')
      .insert({
        id: upload.id,
        filename: upload.filename,
        upload_date: upload.uploadDate,
        report_date: upload.reportDate,
        participant_count: upload.participantCount,
      });

    if (error) throw error;
  },

  async deleteUpload(uploadId: string, reportDate: string): Promise<void> {
    // Delete snapshots for this date
    const { error: snapshotsError } = await supabase
      .from('daily_snapshots')
      .delete()
      .eq('snapshot_date', reportDate);

    if (snapshotsError) throw snapshotsError;

    // Get all remaining snapshots to find orphaned participants
    const { data: allSnapshots } = await supabase
      .from('daily_snapshots')
      .select('participant_id');

    const activeParticipantIds = new Set(
      (allSnapshots || []).map((s) => s.participant_id)
    );

    // Get all participants
    const { data: allParticipants } = await supabase
      .from('participants')
      .select('id');

    // OPTIMIZED: Batch delete orphaned participants
    if (allParticipants) {
      const orphanedIds = allParticipants
        .filter(p => !activeParticipantIds.has(p.id))
        .map(p => p.id);

      if (orphanedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('participants')
          .delete()
          .in('id', orphanedIds);

        if (deleteError) throw deleteError;
      }
    }

    // Delete upload record
    const { error: uploadError } = await supabase
      .from('csv_uploads')
      .delete()
      .eq('id', uploadId);

    if (uploadError) throw uploadError;
  },
};