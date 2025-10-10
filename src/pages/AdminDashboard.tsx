import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { database } from '../lib/database';
import { parseCsvFile } from '../lib/csvParser';
import { Participant, CsvUpload } from '../types';
import {
  LogOut,
  Upload,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  Plus,
  X,
  AlertCircle,
  BarChart3,
  Trash2,
  Settings,
  Trophy,
  Award,
  Star,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts';

interface UploadItem {
  file: File | null;
  date: string;
  id: string;
}

const COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#7c3aed',
  '#0ea5a4', '#ef5350', '#fbbf24', '#34d399', '#60a5fa',
  '#a78bfa', '#ff7ab6', '#f472b6', '#fb923c', '#22c55e'
];

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function AdminDashboard() {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [uploads, setUploads] = useState<CsvUpload[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([
    { file: null, date: new Date().toISOString().split('T')[0], id: '1' },
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Modal state for bar (courses) and pie groups
  const [selectedCourse, setSelectedCourse] = useState<{
    name: string;
    fullName: string;
    participants: Participant[];
  } | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<{
    name: string;
    description?: string;
    participants: Participant[];
  } | null>(null);

  // Ref to measure chart wrapper width for column click detection
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await database.getParticipants();
      setParticipants(data);

      const uploadsData = await database.getUploads();
      setUploads(uploadsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleAddUploadItem = () => {
    const lastDate = uploadItems[uploadItems.length - 1].date;
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);

    setUploadItems([
      ...uploadItems,
      {
        file: null,
        date: nextDate.toISOString().split('T')[0],
        id: Date.now().toString(),
      },
    ]);
  };

  const handleRemoveUploadItem = (id: string) => {
    if (uploadItems.length > 1) {
      setUploadItems(uploadItems.filter((item) => item.id !== id));
    }
  };

  const handleFileChange = (id: string, file: File | null) => {
    setUploadItems(
      uploadItems.map((item) => (item.id === id ? { ...item, file } : item))
    );
  };

  const handleDateChange = (id: string, date: string) => {
    setUploadItems(
      uploadItems.map((item) => (item.id === id ? { ...item, date } : item))
    );
  };

  const handleUpload = async () => {
    setError('');
    setUploadStatus('');

    const validItems = uploadItems.filter((item) => item.file !== null);

    if (validItems.length === 0) {
      setError('Please select at least one CSV file to upload');
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        setUploadStatus(`Processing file ${i + 1} of ${validItems.length}...`);

        const previousDate = new Date(item.date);
        previousDate.setDate(previousDate.getDate() - 1);
        const reportDate = previousDate.toISOString().split('T')[0];

        const { participants: updatedParticipants, snapshots } = await parseCsvFile(
          item.file!,
          reportDate
        );

        // OPTIMIZED: Batch upsert all participants at once
        await database.upsertParticipants(updatedParticipants);

        // OPTIMIZED: Batch insert all snapshots at once
        await database.addSnapshots(snapshots);

        const upload: CsvUpload = {
          id: generateUUID(),
          filename: item.file!.name,
          uploadDate: new Date().toISOString(),
          reportDate,
          participantCount: updatedParticipants.length,
        };
        await database.addUpload(upload);
      }

      setUploadStatus(`Successfully processed ${validItems.length} file(s)`);
      await loadData();

      setTimeout(() => {
        setUploadItems([
          { file: null, date: new Date().toISOString().split('T')[0], id: Date.now().toString() },
        ]);
        setUploadStatus('');
      }, 3000);
    } catch (err) {
      console.error('CSV processing error:', err);
      let errorMessage = 'Failed to process CSV files';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        const supabaseError = (err as any)?.error;
        if (supabaseError) {
          if (supabaseError.code === '23505') {
            errorMessage = 'Duplicate entry detected. This data may have already been uploaded.';
          } else if (supabaseError.code === '23503') {
            errorMessage = 'Database constraint violation. Please check your data format.';
          } else {
            errorMessage = `Database error: ${supabaseError.message || supabaseError}`;
          }
        }
      }
      
      setError(errorMessage);
      setUploadStatus('');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUpload = async (uploadId: string, reportDate: string) => {
    if (!confirm('Are you sure you want to delete this upload? All related data will be removed.')) {
      return;
    }

    setDeleting(uploadId);
    try {
      await database.deleteUpload(uploadId, reportDate);
      await loadData();
    } catch (error) {
      console.error('Failed to delete upload:', error);
      setError('Failed to delete upload');
    } finally {
      setDeleting(null);
    }
  };

  // Active participants
  const activeParticipants = participants.filter((p) => p.skillBadgesCount > 0);

  // compute how many participants completed the entire jam (19 badges + at least 1 arcade)
  const fullCompletionParticipants = participants.filter(
    (p) => (p.skillBadgesCount || 0) >= 19 && (p.arcadeGamesCount || 0) >= 1
  );
  const fullCompletions = fullCompletionParticipants.length;

  // additional counts requested
  const nineteenPlusParticipants = participants.filter((p) => (p.skillBadgesCount || 0) >= 19);
  const nineteenCount = nineteenPlusParticipants.length;
  const fifteenPlusParticipants = participants.filter((p) => (p.skillBadgesCount || 0) >= 15);
  const fifteenPlusCount = fifteenPlusParticipants.length;

  // Updated badge distribution groups with participant lists
  const distributionDetailed = useMemo(() => {
    // Define groups in the desired order
    const orderedGroupNames = [
      '0 Badges',
      '1-4 Badges',
      '5-9 Badges',
      '10-14 Badges',
      '15-18 Badges',
      '19 Badges',
      '19 Badges + Arcade',
    ];

    const groups: { [key: string]: { name: string; participants: Participant[] } } = {
      '0 Badges': { name: '0 Badges', participants: [] },
      '1-4 Badges': { name: '1-4 Badges', participants: [] },
      '5-9 Badges': { name: '5-9 Badges', participants: [] },
      '10-14 Badges': { name: '10-14 Badges', participants: [] },
      '15-18 Badges': { name: '15-18 Badges', participants: [] },
      '19 Badges': { name: '19 Badges', participants: [] },
      '19 Badges + Arcade': { name: '19 Badges + Arcade', participants: [] },
    };

    participants.forEach((p) => {
      const badges = p.skillBadgesCount || 0;
      const arcade = p.arcadeGamesCount || 0;

      if (badges >= 19 && arcade > 0) {
        groups['19 Badges + Arcade'].participants.push(p);
      } else if (badges === 19) {
        groups['19 Badges'].participants.push(p);
      } else if (badges >= 15) {
        groups['15-18 Badges'].participants.push(p);
      } else if (badges >= 10) {
        groups['10-14 Badges'].participants.push(p);
      } else if (badges >= 5) {
        groups['5-9 Badges'].participants.push(p);
      } else if (badges >= 1) {
        groups['1-4 Badges'].participants.push(p);
      } else {
        groups['0 Badges'].participants.push(p);
      }
    });

    // Return the groups in the predefined order
    return orderedGroupNames.map(name => groups[name]);
  }, [participants]);

  const distribution = distributionDetailed
    .map((g) => ({ name: g.name, value: g.participants.length }))
    .filter((item) => item.value > 0);

  // Sort participants by badges (descending) for all participants list
  const sortedParticipants = [...participants].sort((a, b) => b.skillBadgesCount - a.skillBadgesCount);

  /**
   * Course full names (first 19 are C1..C19, final item is the arcade/game which we label ARC)
   * -- IMPORTANT: keep this list in the same order you provided
   */
  const courseFullNames = [
    'The Basics of Google Cloud Compute [Skill Badge]',
    'Get Started with Cloud Storage [Skill Badge]',
    'Get Started with Pub/Sub [Skill Badge]',
    'Get Started with API Gateway [Skill Badge]',
    'Get Started with Looker [Skill Badge]',
    'Get Started with Dataplex [Skill Badge]',
    'Get Started with Google Workspace Tools [Skill Badge]',
    'App Building with AppSheet [Skill Badge]',
    'Develop with Apps Script and AppSheet [Skill Badge]',
    'Build a Website on Google Cloud [Skill Badge]',
    'Set Up a Google Cloud Network [Skill Badge]',
    'Store, Process, and Manage Data on Google Cloud - Console [Skill Badge]',
    'Cloud Run Functions: 3 Ways [Skill Badge]',
    'App Engine: 3 Ways [Skill Badge]',
    'Cloud Speech API: 3 Ways [Skill Badge]',
    'Monitoring in Google Cloud [Skill Badge]',
    'Analyze Speech and Language with Google APIs [Skill Badge]',
    'Prompt Design in Vertex AI [Skill Badge]',
    'Develop Gen AI Apps with Gemini and Streamlit [Skill Badge]',
  ];
  const arcadeFullName = 'Level 3: Generative AI [Game]';

  /**
   * chartData: compute counts and also include the actual participant lists for each course (C1..C19) and ARC.
   * This will let us open a modal with names/emails on column click.
   */
  const chartData = useMemo(() => {
    // init arrays
    const courseCounts = new Array(courseFullNames.length).fill(0);
    const courseParticipantLists: Participant[][] = courseFullNames.map(() => []);
    let arcCount = 0;
    const arcParticipants: Participant[] = [];

    participants.forEach((p) => {
      // parse the participant's skillBadgeNames (pipe-separated)
      const sbRaw = (p as any).skillBadgeNames || '';
      const badges = String(sbRaw).split('|').map((s) => s.trim()).filter(Boolean);

      courseFullNames.forEach((courseName, idx) => {
        const matched = badges.some(b =>
          b === courseName || b.includes(courseName) || courseName.includes(b)
        );
        if (matched) {
          courseCounts[idx] += 1;
          courseParticipantLists[idx].push(p);
        }
      });

      if ((p.arcadeGamesCount || 0) > 0) {
        arcCount += 1;
        arcParticipants.push(p);
      }
    });

    const data = courseFullNames.map((fullName, idx) => ({
      name: `C${idx + 1}`,
      fullName,
      value: courseCounts[idx] || 0,
      participants: courseParticipantLists[idx] || [],
    }));

    data.push({
      name: 'ARC',
      fullName: arcadeFullName,
      value: arcCount,
      participants: arcParticipants,
    });

    return data;
  }, [participants]);

  // Custom label renderer used by LabelList to put a tiny thin count above each bar
  const renderTinyTopLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === 0 || value == null) return null;
    const cx = x + width / 2;
    const cy = y - 8; // adjusted offset for larger font
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        fontSize={12} // increased font size
        fontWeight={400 as any}
        fill="#0f172a"
        style={{ pointerEvents: 'none' }}
      >
        {value}
      </text>
    );
  };

  // Handler when a bar is clicked: payload is the chart entry object
  const handleBarClick = (payload: any) => {
    if (!payload || !payload.payload) return;
    const entry = payload.payload as { name: string; fullName: string; value: number; participants?: Participant[] };
    setSelectedCourse({
      name: entry.name,
      fullName: entry.fullName,
      participants: entry.participants || [],
    });
  };

  // NEW: click on entire chart column - maps click X to column index
  const onChartWrapperClick = (e: React.MouseEvent) => {
    if (!chartWrapperRef.current) return;
    const rect = chartWrapperRef.current.getBoundingClientRect();
    const total = chartData.length;
    if (total === 0) return;

    // compute relative X inside the wrapper
    const relX = e.clientX - rect.left;
    // clamp
    const clampedX = Math.max(0, Math.min(relX, rect.width));
    // column width (equal buckets)
    const columnWidth = rect.width / total;
    // index
    let idx = Math.floor(clampedX / columnWidth);
    if (idx < 0) idx = 0;
    if (idx >= total) idx = total - 1;

    const entry = chartData[idx];
    if (entry) {
      setSelectedCourse({
        name: entry.name,
        fullName: entry.fullName,
        participants: entry.participants || [],
      });
    }
  };

  // Pie click handler: receives group's index or object
  const handlePieClick = (groupName: string) => {
    const group = distributionDetailed.find((g) => g.name === groupName);
    if (!group) return;
    setSelectedGroup({
      name: group.name,
      participants: group.participants,
    });
  };

  // helper to open modal for arbitrary participant list
  const openListModal = (title: string, participantsList: Participant[]) => {
    setSelectedGroup({ name: title, participants: participantsList });
  };

  // Close modal
  const closeModal = () => {
    setSelectedCourse(null);
    setSelectedGroup(null);
  };

  // Tier targets
  const tiers = [
    { id: 'tier1', title: 'Tier 1 (100)', target: 100, color: 'bg-blue-600' },
    { id: 'tier2', title: 'Tier 2 (70)', target: 70, color: 'bg-green-600' },
    { id: 'tier3', title: 'Tier 3 (50)', target: 50, color: 'bg-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-[11px] sm:text-sm text-slate-600 mt-1">
                Manage progress tracking and analytics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="px-2 py-1 text-slate-700 hover:text-slate-900 font-medium transition text-xs sm:text-sm"
              >
                View Public Dashboard
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="flex items-center gap-1 px-2 py-1 text-slate-700 hover:text-slate-900 font-medium transition text-xs sm:text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg transition text-xs sm:text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top area: summary cards */}
        <div className={`grid grid-cols-1 ${userRole === 'admin' ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4 mb-4 items-start`}>
          {/* Small card: Total Participants (small) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-600">Total Participants</p>
              <p className="text-xl font-bold text-slate-800">{participants.length}</p>
            </div>
          </div>

          {/* Small card: Active Participants (small) - clickable */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openListModal('Active Participants', activeParticipants)}
            onKeyDown={(e) => { if (e.key === 'Enter') openListModal('Active Participants', activeParticipants); }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3 cursor-pointer hover:shadow-md focus:outline-none"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-600">Active Participants</p>
              <p className="text-xl font-bold text-slate-800">{activeParticipants.length}</p>
            </div>
          </div>

          {/* NEW Small card: Full Completions (19 badges + arcade) - clickable */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openListModal('Full Completions', fullCompletionParticipants)}
            onKeyDown={(e) => { if (e.key === 'Enter') openListModal('Full Completions', fullCompletionParticipants); }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3 cursor-pointer hover:shadow-md focus:outline-none"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-600">Full Completions</p>
              <p className="text-xl font-bold text-slate-800">{fullCompletions}</p>
            </div>
          </div>

          {/* NEW Small card: 19+ Courses Count (badges >= 19) - clickable */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openListModal('19+ Courses', nineteenPlusParticipants)}
            onKeyDown={(e) => { if (e.key === 'Enter') openListModal('19+ Courses', nineteenPlusParticipants); }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3 cursor-pointer hover:shadow-md focus:outline-none"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-600">19+ Courses</p>
              <p className="text-xl font-bold text-slate-800">{nineteenCount}</p>
            </div>
          </div>

          {/* NEW Small card: 15+ Courses Count - clickable */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openListModal('15+ Courses', fifteenPlusParticipants)}
            onKeyDown={(e) => { if (e.key === 'Enter') openListModal('15+ Courses', fifteenPlusParticipants); }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3 cursor-pointer hover:shadow-md focus:outline-none"
          >
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-600">15+ Courses</p>
              <p className="text-xl font-bold text-slate-800">{fifteenPlusCount}</p>
            </div>
          </div>

          {/* Small card: Total Uploads (small) - ADMIN ONLY */}
          {userRole === 'admin' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] text-slate-600">Total CSV Uploads</p>
                <p className="text-xl font-bold text-slate-800">{uploads.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tier progress card: full width below summary cards */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tier Progress (Full Completions)</h3>
              <p className="text-xs text-slate-600 mt-1">Participants who completed all 19 badges + arcade</p>
            </div>
            <div className="text-sm font-medium text-slate-700">{fullCompletions} completed</div>
          </div>

          {/* Vertical stack of three progress bars */}
          <div className="space-y-4">
            {tiers.map((t) => {
              const pct = t.target > 0 ? Math.min(100, Math.round((fullCompletions / t.target) * 100)) : 0;
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-slate-700">{t.title}</div>
                    <div className="text-sm text-slate-600">{pct}%</div>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded overflow-hidden">
                    <div
                      className={`${t.color} h-full rounded`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[12px] text-slate-500 mt-1">Target: {t.target} full completions</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload CSV card - ADMIN ONLY */}
        {userRole === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm sm:text-lg font-bold text-slate-800">Upload CSV Files</h2>
            </div>

            <div className="space-y-3 mb-4">
              {uploadItems.map((item, index) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <label className="block text-[11px] sm:text-sm font-medium text-slate-700 mb-1">
                      CSV File {index + 1}
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) =>
                        handleFileChange(item.id, e.target.files?.[0] || null)
                      }
                      className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="w-40 sm:w-44">
                    <label className="block text-[11px] sm:text-sm font-medium text-slate-700 mb-1">
                      Upload Date
                    </label>
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => handleDateChange(item.id, e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  {uploadItems.length > 1 && (
                    <button
                      onClick={() => handleRemoveUploadItem(item.id)}
                      className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={handleAddUploadItem}
                className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" />
                Add More Files
              </button>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Processing...' : 'Upload & Process'}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] sm:text-sm text-blue-800">
              <strong>Note:</strong> The CSV file uploaded with a specific date represents progress until the
              previous day midnight. For example, uploading with date Oct 8 means the data reflects progress
              up to Oct 7 midnight.
            </div>

            {uploadStatus && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs sm:text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadStatus}</span>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Badge Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm sm:text-lg font-bold text-slate-800">Badge Distribution</h2>
          </div>
          {distribution.length > 0 ? (
            <div className="h-96 sm:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={250} // Increased radius
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(data, index) => {
                      const groupName = distribution[index]?.name;
                      if (groupName) handlePieClick(groupName);
                    }}
                  >
                    {distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handlePieClick(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-slate-600 py-6 text-xs sm:text-sm">
              No data available to display chart.
            </p>
          )}
        </div>

        {/* Course Completion Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm sm:text-lg font-bold text-slate-800">Course Completions</h2>
          </div>
          {chartData.length > 0 ? (
            <>
              <div
                ref={chartWrapperRef}
                onClick={onChartWrapperClick}
                className="h-[360px] sm:h-[520px] cursor-pointer"
                aria-hidden
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 16, left: 16, bottom: 32 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis hide domain={[0, (dataMax: number) => dataMax + 5]} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      barSize={30} // Increased bar width
                      isAnimationActive={false}
                      onClick={(payload: any) => {
                        handleBarClick(payload);
                      }}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell key={`barcell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                      <LabelList dataKey="value" content={renderTinyTopLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend mapping C1..C19 + ARC to full names */}
              <div className="mt-2 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {chartData.map((d, idx) => (
                  <div className="flex items-start gap-2" key={d.name}>
                    <span
                      className="w-3 h-3 rounded-sm mt-1 shrink-0"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    <div className="truncate">
                      <span className="font-medium mr-1">{d.name}:</span>
                      <span className="text-[11px]">{d.fullName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-slate-600 py-6 text-xs sm:text-sm">
              No data available to display chart.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm sm:text-lg font-bold text-slate-800">All Participants (Sorted by Badges)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-slate-700">Rank</th>
                  <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                  <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-slate-700">Email</th>
                  <th className="text-center py-2 px-3 text-xs sm:text-sm font-semibold text-slate-700">Skill Badges</th>
                  <th className="text-center py-2 px-3 text-xs sm:text-sm font-semibold text-slate-700">Arcade Games</th>
                </tr>
              </thead>
              <tbody>
                {sortedParticipants.length > 0 ? (
                  sortedParticipants.map((participant, index) => (
                    <tr key={participant.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-xs sm:text-sm text-slate-600">{index + 1}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm font-medium text-slate-800">{participant.userName}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-slate-600">{participant.userEmail}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-center font-bold text-blue-600">{participant.skillBadgesCount}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-center text-slate-700">{participant.arcadeGamesCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-600 text-xs sm:text-sm">
                      No participants yet. Upload CSV files to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Uploaded Files Section - ADMIN ONLY */}
        {userRole === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm sm:text-lg font-bold text-slate-800">Uploaded Files</h2>
            </div>
            <div className="space-y-2">
              {uploads.length > 0 ? (
                uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-800 text-xs sm:text-sm">{upload.filename}</p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Report Date: {new Date(upload.reportDate).toLocaleDateString()} | Uploaded:{' '}
                        {new Date(upload.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-medium text-slate-700">
                          {upload.participantCount}
                        </p>
                        <p className="text-[11px] sm:text-sm text-slate-600">participants</p>
                      </div>
                      <button
                        onClick={() => handleDeleteUpload(upload.id, upload.reportDate)}
                        disabled={deleting === upload.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-600 py-6 text-xs sm:text-sm">
                  No uploads yet. Upload your first CSV file to get started.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: show list of participants for selected course/ARC or pie group */}
      {(selectedCourse || selectedGroup) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={closeModal}
            aria-hidden
          />
          <div className="relative max-w-3xl w-full bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {selectedCourse ? `${selectedCourse.name} — ${selectedCourse.fullName}` : `${selectedGroup?.name}`}
                </h3>
                <p className="text-xs text-slate-600">
                  {selectedCourse
                    ? `${selectedCourse.participants.length} participant${selectedCourse.participants.length !== 1 ? 's' : ''}`
                    : `${selectedGroup?.participants.length ?? 0} participant${(selectedGroup?.participants.length ?? 0) !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded hover:bg-slate-100 text-slate-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto p-4">
              {((selectedCourse && selectedCourse.participants.length === 0) || (selectedGroup && selectedGroup.participants.length === 0)) ? (
                <div className="text-center text-sm text-slate-600 py-8">No participants found.</div>
              ) : (
                <ul className="space-y-2">
                  {(selectedCourse ? selectedCourse.participants : selectedGroup?.participants || []).map((p) => (
                    <li key={p.id} className="p-2 rounded bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-slate-800 truncate">{p.userName}</div>
                          <div className="text-xs text-slate-600 truncate">{p.userEmail}</div>
                        </div>
                        <div className="text-xs text-slate-500">{p.skillBadgesCount} badges</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-3 py-1 bg-slate-100 rounded text-sm text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}