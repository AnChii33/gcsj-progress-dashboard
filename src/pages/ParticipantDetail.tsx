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
  Sparkles,
  Trophy,
  Target,
  Zap,
  Star,
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

  // Determine completion status
  const badges = participant.skillBadgesCount;
  const arcade = participant.arcadeGamesCount;

  // Get milestone info
  const getMilestoneInfo = () => {
    if (badges >= 19 && arcade >= 1) {
      return {
        type: 'complete',
        color: 'green',
        icon: Trophy,
        headerBg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        title: '🏆 Amazing! Cloud Study Jam Fully Completed! You are now eligible for certificate!',
        message: "You've successfully completed all 19 Skill Badges and the Arcade Game. Congratulations on your outstanding achievement!",
        isHighlighted: true
      };
    }
    if (badges >= 19) {
      return {
        type: 'badges-complete',
        color: 'amber',
        icon: Sparkles,
        headerBg: 'bg-gradient-to-r from-amber-500 to-orange-600',
        title: '🎉 Congratulations! All 19 Badges Completed!',
        message: "You're almost there! Complete 1 Arcade Game to finish the Cloud Study completely, and earn the certificate.",
        action: "Check your enrollment email for the Arcade Game link. Complete the arcade game to achieve full completion status!",
        isHighlighted: true
      };
    }
    if (badges >= 15 && badges <= 18) {
      const remaining = 19 - badges;
      return {
        type: 'almost-there',
        color: 'purple',
        icon: Star,
        headerBg: 'bg-gradient-to-r from-purple-500 to-violet-600',
        title: '⭐ Almost There! You\'re So Close!',
        message: `Just ${remaining} more badge${remaining > 1 ? 's' : ''} to go! You're doing amazing - complete all 19 badges to unlock the final milestone!`,
        action: "Keep up the excellent work. You're in the final stretch!",
        isHighlighted: true
      };
    }
    if (badges >= 10 && badges <= 14) {
      const remaining = 15 - badges;
      return {
        type: 'great-progress',
        color: 'blue',
        icon: Zap,
        headerBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
        title: '⚡ Great Progress! You\'re on Fire!',
        message: `Excellent work! ${remaining} more badge${remaining > 1 ? 's' : ''} to reach 15 badges. Keep this momentum going!`,
        action: "You're doing fantastic. Next milestone: 15 badges!",
        isHighlighted: true
      };
    }
    if (badges >= 5 && badges <= 9) {
      const remaining = 10 - badges;
      return {
        type: 'good-start',
        color: 'cyan',
        icon: Target,
        headerBg: 'bg-gradient-to-r from-cyan-500 to-sky-600',
        title: '🎯 Good Start! Keep Going!',
        message: `Nice progress! ${remaining} more badge${remaining > 1 ? 's' : ''} to reach 10 badges. You're building great momentum!`,
        action: "Stay consistent and you'll reach 10 badges in no time!",
        isHighlighted: true
      };
    }
    return {
      type: 'starting',
      color: 'slate',
      icon: Award,
      headerBg: 'bg-white',
      title: '',
      message: '',
      isHighlighted: false
    };
  };

  const milestone = getMilestoneInfo();
  const Icon = milestone.icon;

  const getHeaderTextColor = () => {
    return milestone.isHighlighted ? 'text-white' : 'text-slate-800';
  };

  const getMilestoneCard = () => {
    if (!milestone.isHighlighted) return null;

    const colorMap = {
      green: { bg: 'from-green-50 to-emerald-50', border: 'border-green-500', iconBg: 'bg-green-500', text: 'text-green-900', subtext: 'text-green-800' },
      amber: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-500', iconBg: 'bg-amber-500', text: 'text-amber-900', subtext: 'text-amber-800' },
      purple: { bg: 'from-purple-50 to-violet-50', border: 'border-purple-500', iconBg: 'bg-purple-500', text: 'text-purple-900', subtext: 'text-purple-800' },
      blue: { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-500', iconBg: 'bg-blue-500', text: 'text-blue-900', subtext: 'text-blue-800' },
      cyan: { bg: 'from-cyan-50 to-sky-50', border: 'border-cyan-500', iconBg: 'bg-cyan-500', text: 'text-cyan-900', subtext: 'text-cyan-800' },
    };

    const colors = colorMap[milestone.color as keyof typeof colorMap];

    return (
      <div className={`bg-gradient-to-r ${colors.bg} border-2 ${colors.border} rounded-xl p-6 mb-8`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${colors.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-lg sm:text-xl font-bold ${colors.text} mb-2`}>
              {milestone.title}
            </h3>
            <p className={`${colors.subtext} mb-2 text-sm`}>
              {milestone.message}
            </p>
            {milestone.action && (
              <p className={`text-xs sm:text-sm ${colors.subtext}`}>
                {milestone.action}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3 text-center text-red-700 text-sm">
          {error}
        </div>
      )}

      <header className={`shadow-sm border-b ${milestone.isHighlighted ? 'border-transparent' : 'border-slate-200'} ${milestone.headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 mb-4 transition ${
              milestone.isHighlighted
                ? 'text-white hover:text-gray-100' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-2xl sm:text-3xl font-bold ${getHeaderTextColor()}`}>
                  {participant.userName}
                </h1>
                {milestone.isHighlighted && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-bold">
                    <Icon className="w-4 h-4" />
                    {milestone.type === 'complete' && 'FULLY COMPLETED'}
                    {milestone.type === 'badges-complete' && 'ALL BADGES DONE'}
                    {milestone.type === 'almost-there' && 'ALMOST THERE'}
                    {milestone.type === 'great-progress' && 'GREAT PROGRESS'}
                    {milestone.type === 'good-start' && 'GOOD START'}
                  </div>
                )}
              </div>
              <p className={`mb-2 text-sm sm:text-base ${milestone.isHighlighted ? 'text-white text-opacity-90' : 'text-slate-600'}`}>
                {participant.userEmail}
              </p>
              <a
                href={participant.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-xs sm:text-sm font-medium ${
                  milestone.isHighlighted
                    ? 'text-white hover:text-gray-100' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                View Profile
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex flex-col items-end gap-2">
              {participant.redemptionStatus === 'Yes' ? (
                <div className={`flex items-center gap-2 ${
                  milestone.isHighlighted ? 'text-white' : 'text-green-600'
                }`}>
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm sm:text-base font-medium">Access Code Redeemed</span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 ${
                  milestone.isHighlighted ? 'text-white text-opacity-90' : 'text-amber-600'
                }`}>
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm sm:text-base font-medium">Access Code Not Redeemed</span>
                </div>
              )}
              <span className={`text-xs sm:text-sm ${
                milestone.isHighlighted ? 'text-white text-opacity-75' : 'text-slate-500'
              }`}>
                {participant.profileStatus}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getMilestoneCard()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Skill Badges</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">{participant.skillBadgesCount}</p>
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
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">{participant.arcadeGamesCount}</p>
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
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {progressChange >= 0 ? '+' : ''}
                  {progressChange}
                </p>
              </div>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-6">Day-Wise Progress Timeline</h2>
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
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
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
                        <p className="text-base sm:text-lg font-bold text-blue-600 mb-2">
                          {day.newBadges} New Badge{day.newBadges > 1 ? 's' : ''} Completed
                        </p>
                        <div className="space-y-2">
                          {day.newBadgeNames.map((badge, badgeIndex) => (
                            <div
                              key={badgeIndex}
                              className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100"
                            >
                              <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-slate-700">{badge}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Total badges: {day.totalBadges}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-600">No new badges complete</p>
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
