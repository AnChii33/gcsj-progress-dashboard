import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface UploadItem {
  file: File | null;
  date: string;
  id: string;
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function AdminDashboard() {
  const { logout } = useAuth();
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

  const activeParticipants = participants.filter((p) => p.skillBadgesCount > 0);

  // Updated badge distribution groups
  const distribution = [
    { name: '0 badges', value: participants.filter((p) => p.skillBadgesCount === 0).length },
    { name: '1-5 badges', value: participants.filter((p) => p.skillBadgesCount >= 1 && p.skillBadgesCount <= 5).length },
    { name: '6-10 badges', value: participants.filter((p) => p.skillBadgesCount >= 6 && p.skillBadgesCount <= 10).length },
    { name: '11-15 badges', value: participants.filter((p) => p.skillBadgesCount >= 11 && p.skillBadgesCount <= 15).length },
    { name: '15+ badges', value: participants.filter((p) => p.skillBadgesCount > 15).length },
  ].filter((item) => item.value > 0);

  // Sort participants by badges (descending) for top performers and all participants list
  const sortedParticipants = [...participants].sort((a, b) => b.skillBadgesCount - a.skillBadgesCount);
  const topPerformers = sortedParticipants.slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage progress tracking and analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition"
              >
                View Public Dashboard
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Participants</p>
                <p className="text-3xl font-bold text-slate-800">{participants.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Participants</p>
                <p className="text-3xl font-bold text-slate-800">{activeParticipants.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Uploads</p>
                <p className="text-3xl font-bold text-slate-800">{uploads.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Upload CSV Files</h2>
          </div>

          <div className="space-y-4 mb-6">
            {uploadItems.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CSV File {index + 1}
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) =>
                      handleFileChange(item.id, e.target.files?.[0] || null)
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="w-48">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Date
                  </label>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => handleDateChange(item.id, e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {uploadItems.length > 1 && (
                  <button
                    onClick={() => handleRemoveUploadItem(item.id)}
                    className="mt-8 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={handleAddUploadItem}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add More Files
            </button>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Processing...' : 'Upload & Process'}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>Note:</strong> The CSV file uploaded with a specific date represents progress until the
            previous day midnight. For example, uploading with date Oct 8 means the data reflects progress
            up to Oct 7 midnight.
          </div>

          {uploadStatus && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">Badge Distribution</h2>
            </div>
            {distribution.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-slate-600 py-8">
                No data available. Upload CSV files to see distribution.
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">Top 10 Performers</h2>
            </div>
            <div className="space-y-3">
              {topPerformers.length > 0 ? (
                topPerformers.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-400 w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">{participant.userName}</p>
                        <p className="text-xs text-slate-600">{participant.userEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {participant.skillBadgesCount}
                      </p>
                      <p className="text-xs text-slate-600">badges</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-600 py-8">
                  No data available. Upload CSV files to see top performers.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">All Participants (Sorted by Badges)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Skill Badges</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Arcade Games</th>
                </tr>
              </thead>
              <tbody>
                {sortedParticipants.length > 0 ? (
                  sortedParticipants.map((participant, index) => (
                    <tr key={participant.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-600">{index + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{participant.userName}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{participant.userEmail}</td>
                      <td className="py-3 px-4 text-sm text-center font-bold text-blue-600">{participant.skillBadgesCount}</td>
                      <td className="py-3 px-4 text-sm text-center text-slate-700">{participant.arcadeGamesCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-600">
                      No participants yet. Upload CSV files to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Uploaded Files</h2>
          </div>
          <div className="space-y-3">
            {uploads.length > 0 ? (
              uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{upload.filename}</p>
                    <p className="text-xs text-slate-600">
                      Report Date: {new Date(upload.reportDate).toLocaleDateString()} | Uploaded:{' '}
                      {new Date(upload.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {upload.participantCount}
                      </p>
                      <p className="text-xs text-slate-600">participants</p>
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
              <p className="text-center text-slate-600 py-8">
                No uploads yet. Upload your first CSV file to get started.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>


    