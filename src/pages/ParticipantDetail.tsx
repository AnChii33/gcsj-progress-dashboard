import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database } from '../lib/database';
import { Participant, DailySnapshot } from '../types';
import { EmailVerificationModal } from '../components/EmailVerificationModal';
import {
  ArrowLeft,
  Award,
  TrendingUp,
  ExternalLink,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';

export function ParticipantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [history, setHistory] = useState<DailySnapshot[]>([]);
  const [showVerification, setShowVerification] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && verified) {
      loadParticipantData(id);
    }
  }, [id, verified]);

  const loadParticipantData = async (participantId: string) => {
    try {
      const participants = await database.getParticipants();
      const found = participants.find((p) => p.id === participantId);

      if (found) {
        setParticipant(found);

        const participantSnapshots = await database.getSnapshotsByParticipant(participantId);
        setHistory(participantSnapshots);
      }
    } catch (error) {
      console.error('Failed to load participant data:', error);
    }
  };

  const handleEmailVerify = async (email: string) => {
    try {
      const verifiedParticipant = await database.getParticipantByEmail(email);

      if (verifiedParticipant && verifiedParticipant.id === id) {
        setVerified(true);
        setShowVerification(false);
        setError('');
      } else {
        setError('Email does not match this participant');
      }
    } catch (error) {
      setError('Failed to verify email');
    }
  };

  const handleCloseModal = () => {
    navigate('/');
  };

  if (showVerification && !verified) {
    return (
      <EmailVerificationModal
        onVerify={handleEmailVerify}
        onClose={handleCloseModal}
        participantName={participant?.userName || 'this participant'}
      />
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  const progressChange =
    history.length >= 2
      ? history[history.length - 1].skillBadgesCount - history[0].skillBadgesCount
      : 0;

  const timelineData = history.map((snapshot, index) => {
    const prevSnapshot = index > 0 ? history[index - 1] : null;
    const newBadges = prevSnapshot
      ? snapshot.skillBadgesCount - prevSnapshot.skillBadgesCount
      : snapshot.skillBadgesCount;

    const currentBadges = snapshot.skillBadgeNames
      ? snapshot.skillBadgeNames.split('|').map((b) => b.trim()).filter(Boolean)
      : [];
    const prevBadges = prevSnapshot?.skillBadgeNames
      ? prevSnapshot.skillBadgeNames.split('|').map((b) => b.trim()).filter(Boolean)
      : [];

    const newBadgeNames = currentBadges.filter((badge) => !prevBadges.includes(badge));

    return {
      date: snapshot.date,
      newBadges,
      newBadgeNames,
      totalBadges: snapshot.skillBadgesCount,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3 text-center text-red-700 text-sm">
          {error}
        </div>
      )}

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
              <p className="text-slate-600 mb-2">{participant.userEmail}</p>
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
            <h2 className="text-xl font-bold text-slate-800 mb-6">Day-Wise Progress Timeline</h2>
            <div className="space-y-4">
              {timelineData.map((day, index) => (
                <div
                  key={index}
                  className={`border-l-4 pl-6 pb-6 ${
                    day.newBadges > 0 ? 'border-blue-500' : 'border-slate-300'
                  } ${index === timelineData.length - 1 ? 'pb-0' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full -ml-[26px] ${
                        day.newBadges > 0 ? 'bg-blue-500' : 'bg-slate-300'
                      }`}
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="ml-4">
                    {day.newBadges > 0 ? (
                      <>
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          {day.newBadges} New Badge{day.newBadges > 1 ? 's' : ''} Completed
                        </p>
                        <div className="space-y-2">
                          {day.newBadgeNames.map((badge, badgeIndex) => (
                            <div
                              key={badgeIndex}
                              className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100"
                            >
                              <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-sm text-slate-700">{badge}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Total badges: {day.totalBadges}
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-600">No new badges completed</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
