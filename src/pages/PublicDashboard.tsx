import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../lib/database';
import { Participant } from '../types';
import { Search, TrendingUp, Award, CheckCircle, XCircle, ExternalLink, Target, Zap, Star, Trophy } from 'lucide-react';

export function PublicDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await database.getParticipants();
      setParticipants(data);

      const uploads = await database.getUploads();
      if (uploads.length > 0) {
        const latest = uploads[0];
        setLastUpdated(latest.uploadDate);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter(
      (p) =>
        p.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Always sort by name alphabetically
    filtered.sort((a, b) => a.userName.localeCompare(b.userName));

    return filtered;
  }, [participants, searchTerm]);

  const handleParticipantClick = (participantId: string) => {
    navigate(`/participant/${participantId}`);
  };

  // Helper function to determine card styling based on completion
  const getParticipantCardStyle = (participant: Participant) => {
    const badges = participant.skillBadgesCount;
    const arcade = participant.arcadeGamesCount;

    // Full completion: 19 badges + 1 arcade game
    if (badges >= 19 && arcade >= 1) {
      return 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50';
    }
    // 19 badges completed (needs arcade game)
    if (badges >= 19) {
      return 'border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50';
    }
    // 15-18 badges (almost there!)
    if (badges >= 15 && badges <= 18) {
      return 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50';
    }
    // 10-14 badges (great progress!)
    if (badges >= 10 && badges <= 14) {
      return 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50';
    }
    // 5-9 badges (good start!)
    if (badges >= 5 && badges <= 9) {
      return 'border-2 border-cyan-500 bg-gradient-to-br from-cyan-50 to-sky-50';
    }
    // Default
    return 'border border-slate-200';
  };

  const getCompletionBadge = (participant: Participant) => {
    const badges = participant.skillBadgesCount;
    const arcade = participant.arcadeGamesCount;

    if (badges >= 19 && arcade >= 1) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
          <Trophy className="w-3 h-3" />
          FULLY COMPLETED
        </div>
      );
    }
    if (badges >= 19) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-full text-xs font-bold">
          <Award className="w-3 h-3" />
          ALL BADGES DONE
        </div>
      );
    }
    if (badges >= 15 && badges <= 18) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
          <Star className="w-3 h-3" />
          ALMOST THERE
        </div>
      );
    }
    if (badges >= 10 && badges <= 14) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
          <Zap className="w-3 h-3" />
          GREAT PROGRESS
        </div>
      );
    }
    if (badges >= 5 && badges <= 9) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-cyan-600 text-white rounded-full text-xs font-bold">
          <Target className="w-3 h-3" />
          GOOD START
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Google Cloud Study Jam Progress
              </h1>
              <p className="text-slate-600 mt-1">
                St. Thomas' College of Engineering & Technology - Kolkata, 2025-26
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <TrendingUp className="w-4 h-4" />
              <span>{participants.length} Participants</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {lastUpdated && (
          <div className="mb-6 text-center text-sm text-slate-600">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}

        {filteredParticipants.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {participants.length === 0 ? 'No Data Available' : 'No Results Found'}
            </h3>
            <p className="text-slate-600">
              {participants.length === 0
                ? 'Upload CSV data from the admin portal to get started'
                : 'Try adjusting your search criteria'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredParticipants.map((participant) => (
              <div
                key={participant.id}
                onClick={() => handleParticipantClick(participant.id)}
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer p-6 ${getParticipantCardStyle(participant)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {participant.userName}
                      </h3>
                      {getCompletionBadge(participant)}
                    </div>
                    <a
                      href={participant.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-3"
                    >
                      View Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">
                          {participant.skillBadgesCount} Skill Badges
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-slate-700">
                          {participant.arcadeGamesCount} Arcade Games
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {participant.redemptionStatus === 'Yes' ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Redeemed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Not Redeemed</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-500">{participant.profileStatus}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}