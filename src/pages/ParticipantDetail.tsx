import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { Participant, DailySnapshot } from '../types';
import {
  ArrowLeft,
  Award,
  TrendingUp,
  ExternalLink,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ParticipantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [history, setHistory] = useState<DailySnapshot[]>([]);

  useEffect(() => {
    if (id) {
      loadParticipantData(id);
    }
  }, [id]);

  const loadParticipantData = (participantId: string) => {
    const participants = storage.getParticipants();
    const found = participants.find((p) => p.id === participantId);

    if (found) {
      setParticipant(found);

      const allSnapshots = storage.getSnapshots();
      const participantSnapshots = allSnapshots
        .filter((s) => s.participantId === participantId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setHistory(participantSnapshots);
    }
  };

  if (!participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Participant Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const chartData = history.map((snapshot) => ({
    date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    badges: snapshot.skillBadgesCount,
    games: snapshot.arcadeGamesCount,
  }));

  const badgesList = participant.skillBadgeNames
    ? participant.skillBadgeNames.split('|').map((b) => b.trim()).filter(Boolean)
    : [];

  const gamesList = participant.arcadeGameNames
    ? participant.arcadeGameNames.split('|').map((g) => g.trim()).filter(Boolean)
    : [];

  const progressChange =
    history.length >= 2
      ? history[history.length - 1].skillBadgesCount - history[0].skillBadgesCount
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{participant.userName}</h1>
              <p className="text-slate-600 mb-2">{}</p>
              <a
                href={participant.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Profile
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex flex-col items-end gap-2">
              {participant.redemptionStatus === 'Yes' ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Access Code Redeemed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Access Code Not Redeemed</span>
                </div>
              )}
              <span className="text-sm text-slate-500">{participant.profileStatus}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Skill Badges</p>
                <p className="text-3xl font-bold text-slate-800">{participant.skillBadgesCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Arcade Games</p>
                <p className="text-3xl font-bold text-slate-800">{participant.arcadeGamesCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Progress</p>
                <p className="text-3xl font-bold text-slate-800">
                  {progressChange >= 0 ? '+' : ''}
                  {progressChange}
                </p>
              </div>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Progress Over Time</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="badges"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Skill Badges"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="games"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Arcade Games"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {badgesList.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Completed Skill Badges</h2>
            <div className="grid gap-3">
              {badgesList.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-slate-700">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gamesList.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Completed Arcade Games</h2>
            <div className="grid gap-3">
              {gamesList.map((game, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                >
                  <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-slate-700">{game}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Daily Progress History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Skill Badges
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Arcade Games
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((snapshot, index) => (
                    <tr key={snapshot.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700">
                        {new Date(snapshot.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700">{snapshot.skillBadgesCount}</span>
                        {index > 0 && (
                          <span
                            className={`ml-2 text-sm ${
                              snapshot.skillBadgesCount - history[index - 1].skillBadgesCount > 0
                                ? 'text-green-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {snapshot.skillBadgesCount - history[index - 1].skillBadgesCount > 0
                              ? `+${snapshot.skillBadgesCount - history[index - 1].skillBadgesCount}`
                              : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700">{snapshot.arcadeGamesCount}</span>
                        {index > 0 && (
                          <span
                            className={`ml-2 text-sm ${
                              snapshot.arcadeGamesCount - history[index - 1].arcadeGamesCount > 0
                                ? 'text-green-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {snapshot.arcadeGamesCount - history[index - 1].arcadeGamesCount > 0
                              ? `+${snapshot.arcadeGamesCount - history[index - 1].arcadeGamesCount}`
                              : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
