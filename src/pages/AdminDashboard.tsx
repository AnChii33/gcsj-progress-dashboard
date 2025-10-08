  const handleDeleteUpload = async (uploadId: string, filename: string, reportDate: string) => {
    await storage.removeUpload(uploadId, filename, reportDate);
    // Reload participants and uploads after delete
    setParticipants(storage.getParticipants());
    setUploads(storage.getUploads());
  };
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { parseCsvFile } from '../lib/csvParser';
import { Participant, CsvUpload } from '../types';
import {
  LogOut,
  Upload,
  Users,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  X,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface UploadItem {
  file: File | null;
  date: string;
  id: string;
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setParticipants(storage.getParticipants());
    setUploads(storage.getUploads());
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

        storage.setParticipants(updatedParticipants);
        snapshots.forEach((snapshot) => storage.addSnapshot(snapshot));

        const upload: CsvUpload = {
          id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: item.file!.name,
          uploadDate: new Date().toISOString(),
          reportDate,
          participantCount: updatedParticipants.length,
        };
        storage.addUpload(upload);
      }

      setUploadStatus(`Successfully processed ${validItems.length} file(s)`);
      loadData();

      setTimeout(() => {
        setUploadItems([
          { file: null, date: new Date().toISOString().split('T')[0], id: Date.now().toString() },
        ]);
        setUploadStatus('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV files');
    } finally {
      setUploading(false);
    }
  };

  const activeParticipants = participants.filter((p) => p.skillBadgesCount > 0);
  const redeemedCount = participants.filter((p) => p.redemptionStatus === 'Yes').length;
  const totalBadges = participants.reduce((sum, p) => sum + p.skillBadgesCount, 0);
  const avgBadges = participants.length > 0 ? (totalBadges / participants.length).toFixed(1) : '0';

  const topPerformers = [...participants]
    .sort((a, b) => b.skillBadgesCount - a.skillBadgesCount)
    .slice(0, 10);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg. Skill Badges</p>
                <p className="text-3xl font-bold text-slate-800">{avgBadges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Redemption Rate</p>
                <p className="text-3xl font-bold text-slate-800">
                  {participants.length > 0
                    ? Math.round((redeemedCount / participants.length) * 100)
                    : 0}
                  %
                </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">Recent Uploads</h2>
            </div>
            <div className="space-y-3">
              {uploads.length > 0 ? (
                uploads
                  .sort(
                    (a, b) =>
                      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
                  )
                  .slice(0, 10)
                  .map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{upload.filename}</p>
                        <p className="text-xs text-slate-600">
                          Report Date: {new Date(upload.reportDate).toLocaleDateString()}
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
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete upload"
                          onClick={() => handleDeleteUpload(upload.id, upload.filename, upload.reportDate)}
                        >
                          <X className="w-5 h-5" />
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
        </div>
      </main>
    </div>
  );
}
