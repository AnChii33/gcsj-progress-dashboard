import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { Participant } from '../types';
import { Search, TrendingUp, Award, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';

export function PublicDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'badges'>('name');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = storage.getParticipants();
    setParticipants(data);

    const uploads = storage.getUploads();
    if (uploads.length > 0) {
      const latest = uploads.sort((a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      )[0];
      setLastUpdated(latest.uploadDate);
    }
  };

  const filteredAndSortedParticipants = useMemo(() => {
    let filtered = participants.filter(
      (p) =>
        p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.userName.localeCompare(b.userName));
    } else {
      filtered.sort((a, b) => b.skillBadgesCount - a.skillBadgesCount);
    }

    return filtered;
  }, [participants, searchTerm, sortBy]);

  const handleParticipantClick = (participantId: string) => {
    navigate(`/participant/${participantId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Google Cloud Skills Boost Progress
              </h1>
              <p className="text-slate-600 mt-1">
                St. Thomas' College of Engineering & Technology - Kolkata
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
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              Name
            </button>
            <button
              onClick={() => setSortBy('badges')}
              className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                sortBy === 'badges'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
              }`}
            >
              <Award className="w-4 h-4" />
              Badges
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="mb-6 text-center text-sm text-slate-600">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}

        {filteredAndSortedParticipants.length === 0 ? (
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
            {filteredAndSortedParticipants.map((participant) => (
              <div
                key={participant.id}
                onClick={() => handleParticipantClick(participant.id)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-slate-200 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      {participant.userName}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">{participant.userEmail}</p>

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
