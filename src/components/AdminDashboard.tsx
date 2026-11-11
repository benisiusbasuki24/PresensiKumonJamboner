import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  Download, 
  Settings as SettingsIcon, 
  Search, 
  Filter, 
  Calendar, 
  Check, 
  X, 
  MapPin,
  FileCheck,
  ShieldAlert,
  ArrowUpDown,
  Sparkles,
  Camera,
  Scan,
  Eye
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest, PerformanceSummary, SystemSettings, UserProfile } from '../types';
import { formatDistance } from '../utils/geo';
import { generateMonthlyAttendancePDF } from '../utils/pdfGenerator';
import { EmailReminderModal } from './EmailReminderModal';

interface AdminDashboardProps {
  currentUser: UserProfile;
  staffList: UserProfile[];
  todayAttendances: AttendanceRecord[];
  allAttendances: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  summaries: PerformanceSummary[];
  settings: SystemSettings;
  onUpdateLeaveStatus: (requestId: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  staffList,
  todayAttendances,
  allAttendances,
  leaveRequests,
  summaries,
  settings,
  onUpdateLeaveStatus,
  onUpdateSettings,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'monitor' | 'leaves' | 'settings'>('monitor');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('Mei');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<AttendanceRecord | null>(null);

  // Settings form local state
  const [formSettings, setFormSettings] = useState<SystemSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  useEffect(() => {
    setFormSettings({ ...settings });
  }, [settings]);

  // Calculate live presence KPI
  const totalStaffCount = staffList.length;
  const attendedIds = new Set(todayAttendances.map((a) => a.userId));
  const onTimeCount = todayAttendances.filter((a) => a.status === 'present').length;
  const lateCount = todayAttendances.filter((a) => a.status === 'late').length;
  const absentCount = staffList.filter((s) => !attendedIds.has(s.uid)).length;
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;

  // Filtered attendance records for today
  const filteredToday = todayAttendances.filter((rec) => {
    const matchesSearch =
      rec.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportPDF = () => {
    setIsGeneratingPdf(true);
    try {
      generateMonthlyAttendancePDF({
        monthName: selectedMonth,
        year: selectedYear,
        summaries,
        attendances: allAttendances,
        settings,
      });
    } catch (err) {
      console.error(err);
      alert('Gagal menghasilkan file PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateSettings(formSettings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui pengaturan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00A0E9]/10 text-[#007BB5] uppercase tracking-wider">
              PANEL PENGELOLA CABANG
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs font-semibold text-slate-600">Kumon Jambon</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 mt-1">
            Dashboard Pemantauan Tim & Presensi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring kehadiran harian real-time, toleransi GPS 50m, approval ijin/cuti, dan ekspor PDF resmi.
          </p>
        </div>

        {/* Action Buttons: Email Reminder & PDF Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Pengingat Email {absentCount > 0 && `(${absentCount} Belum Absen)`}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A0E9] hover:bg-[#008CCF] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Cetak Laporan PDF HRD'}</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>Total Karyawan</span>
            <Users className="w-4 h-4 text-[#00A0E9]" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalStaffCount}</p>
          <span className="text-[10px] text-slate-400">Tim Kumon Jambon</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1.5 font-bold">
            <span>Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono">{onTimeCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">S/d pkl 10:15 WIB</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/30 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs mb-1.5 font-bold">
            <span>Terlambat</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">{lateCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">&gt; 15 menit toleransi</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/30 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1.5 font-bold">
            <span>Belum Hadir</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700 font-mono">{absentCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">Belum terverifikasi</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 bg-sky-50/30 shadow-xs">
          <div className="flex items-center justify-between text-[#007BB5] text-xs mb-1.5 font-bold">
            <span>Permohonan Ijin</span>
            <FileCheck className="w-4 h-4 text-[#00A0E9]" />
          </div>
          <p className="text-2xl font-extrabold text-[#007BB5] font-mono">{pendingLeavesCount}</p>
          <span className="text-[10px] text-sky-600 font-medium">Menunggu review</span>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveSubTab('monitor')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeSubTab === 'monitor'
              ? 'border-[#00A0E9] text-[#00A0E9]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Kehadiran Hari Ini ({todayAttendances.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('leaves')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 relative ${
            activeSubTab === 'leaves'
              ? 'border-[#00A0E9] text-[#00A0E9]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Approval Ijin & Cuti</span>
          {pendingLeavesCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingLeavesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeSubTab === 'settings'
              ? 'border-[#00A0E9] text-[#00A0E9]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Pengaturan GPS & Jam Kerja</span>
        </button>
      </div>

      {/* TAB 1: Real-time Attendance Monitor */}
      {activeSubTab === 'monitor' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
              >
                <option value="all">Semua Status Kehadiran</option>
                <option value="present">Tepat Waktu</option>
                <option value="late">Terlambat (&gt; 10:15 WIB)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredToday.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-xl">
              Belum ada data presensi yang sesuai dengan filter pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Karyawan & Foto Wajah</th>
                    <th className="py-3 px-3.5">Jam Masuk</th>
                    <th className="py-3 px-3.5">Jam Pulang</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Keterlambatan</th>
                    <th className="py-3 px-3.5">Validasi GPS</th>
                    <th className="py-3 px-3.5">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredToday.map((rec) => (
                    <tr key={rec.id || rec.userId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {rec.photoUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoRecord(rec)}
                              className="relative group cursor-pointer flex-shrink-0"
                              title="Klik untuk melihat foto verifikasi wajah biometrik"
                            >
                              <img
                                src={rec.photoUrl}
                                alt={rec.userName}
                                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400 group-hover:border-[#00A0E9] transition shadow-xs"
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs border border-slate-200 flex-shrink-0">
                              {rec.userName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{rec.userName}</span>
                              {rec.photoUrl && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold" title="Foto Wajah Terverifikasi">
                                  Wajah ✅
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{rec.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-700">
                        {rec.checkInTime}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-500">
                        {rec.checkOutTime || (
                          <span className="text-slate-400 italic">Belum Pulang</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {rec.status === 'present' ? 'Tepat Waktu' : 'Terlambat'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono">
                        {rec.lateMinutes > 0 ? (
                          <span className="text-amber-600 font-bold">+{rec.lateMinutes} menit</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">0 menit</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#007BB5]">
                          <MapPin className="w-3 h-3 text-[#00A0E9]" />
                          {formatDistance(rec.distanceMeters)} (Valid &lt;50m)
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 max-w-[200px] truncate">
                        {rec.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Leave & Permission Approvals */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Daftar Permohonan Ijin & Cuti Staf
              </h3>
              <p className="text-xs text-slate-500">
                Tinjau permohonan yang diajukan oleh pembimbing dan staf Kumon Jambon.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-sky-50 text-[#007BB5]">
              Total: {leaveRequests.length} Pengajuan
            </span>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-xl">
              Tidak ada permohonan ijin atau cuti yang perlu ditinjau.
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-sm">
                        {req.userName}
                      </span>
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-[#007BB5]">
                        {req.type}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="font-semibold text-slate-600">
                        {req.startDate} s/d {req.endDate} ({req.daysCount} hari)
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{req.reason}"
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Diajukan pada: {new Date(req.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onUpdateLeaveStatus(req.id!, 'approved', 'Disetujui oleh Kepala Cabang')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateLeaveStatus(req.id!, 'rejected', 'Mohon koordinasi kembali jadwal kelas')}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {req.status === 'approved' ? '✅ Telah Disetujui' : '❌ Telah Ditolak'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GPS & Work Schedule Settings */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base">
              Konfigurasi Titik Presensi & Jam Operasional
            </h3>
            <p className="text-xs text-slate-500">
              Pengaturan titik koordinat pusat GPS Kumon Jambon dan parameter toleransi kehadiran.
            </p>
          </div>

          {settingsSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan dan langsung disinkronkan ke seluruh perangkat staf!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Kantor / Cabang
              </label>
              <input
                type="text"
                value={formSettings.centerName}
                onChange={(e) => setFormSettings({ ...formSettings, centerName: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Lengkap Cabang
              </label>
              <input
                type="text"
                value={formSettings.centerAddress}
                onChange={(e) => setFormSettings({ ...formSettings, centerAddress: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Latitude Pusat GPS (Kumon Jambon)
              </label>
              <input
                type="number"
                step="any"
                value={formSettings.targetLat}
                onChange={(e) => setFormSettings({ ...formSettings, targetLat: parseFloat(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Longitude Pusat GPS (Kumon Jambon)
              </label>
              <input
                type="number"
                step="any"
                value={formSettings.targetLng}
                onChange={(e) => setFormSettings({ ...formSettings, targetLng: parseFloat(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Toleransi Jarak GPS (Meter)
              </label>
              <input
                type="number"
                value={formSettings.toleranceRadiusMeters}
                onChange={(e) => setFormSettings({ ...formSettings, toleranceRadiusMeters: parseInt(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9] font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Permintaan sistem: 50 meter dari titik pusat kantor.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jam Masuk Resmi & Toleransi (Menit)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formSettings.workStartTime}
                  onChange={(e) => setFormSettings({ ...formSettings, workStartTime: e.target.value })}
                  placeholder="10:00"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9] font-mono"
                />
                <input
                  type="number"
                  value={formSettings.gracePeriodMinutes}
                  onChange={(e) => setFormSettings({ ...formSettings, gracePeriodMinutes: parseInt(e.target.value) })}
                  placeholder="15"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9] font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Jam masuk pkl 10.00 WIB dengan toleransi keterlambatan 15 menit (s/d 10:15 WIB).
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#00A0E9] hover:bg-[#008CCF] text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Simpan Perubahan Pengaturan
            </button>
          </div>
        </form>
      )}

      {/* Email Reminder Modal */}
      <EmailReminderModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        staffList={staffList}
        todayAttendances={todayAttendances}
      />

      {/* Biometric Photo Inspector Modal */}
      {selectedPhotoRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 text-center animate-scaleUp">
            <div className="p-4 bg-gradient-to-r from-[#00A0E9] to-[#0077B6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4" />
                <h4 className="font-extrabold text-sm">Verifikasi Wajah Biometrik</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoRecord(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden border-4 border-[#00A0E9] shadow-md bg-slate-900">
                <img
                  src={selectedPhotoRecord.photoUrl}
                  alt={selectedPhotoRecord.userName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-xs py-1 px-2.5 rounded-lg text-[10px] font-mono text-white flex items-center justify-between">
                  <span>Kumon Jambon</span>
                  <span>{selectedPhotoRecord.checkInTime}</span>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-800 text-base">
                  {selectedPhotoRecord.userName}
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedPhotoRecord.userEmail}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Absen:</span>
                  <span className="font-semibold text-slate-800">{selectedPhotoRecord.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jarak GPS:</span>
                  <span className="font-bold text-[#007BB5]">{formatDistance(selectedPhotoRecord.distanceMeters)} (Valid &lt;50m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Kedatangan:</span>
                  <span className={`font-bold ${selectedPhotoRecord.status === 'present' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedPhotoRecord.status === 'present' ? 'Tepat Waktu' : `Terlambat ${selectedPhotoRecord.lateMinutes} menit`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPhotoRecord(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
