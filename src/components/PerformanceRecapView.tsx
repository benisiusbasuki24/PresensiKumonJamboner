import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Search, 
  TrendingUp,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { AttendanceRecord, PerformanceSummary, UserProfile } from '../types';
import { formatDistance } from '../utils/geo';

interface PerformanceRecapViewProps {
  summaries: PerformanceSummary[];
  attendances: AttendanceRecord[];
  allStaff: UserProfile[];
}

export const PerformanceRecapView: React.FC<PerformanceRecapViewProps> = ({
  summaries,
  attendances,
  allStaff,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    summaries[0]?.userId || allStaff[0]?.uid || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSummaries = summaries.filter((s) =>
    s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSummary = summaries.find((s) => s.userId === selectedUserId) || summaries[0];
  const activeStaff = allStaff.find((s) => s.uid === selectedUserId);

  // Get specific attendance records for this selected staff
  const userAttendances = attendances
    .filter((a) => a.userId === selectedUserId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Title & Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00A0E9]" />
            Rekapitulasi Performa Kehadiran Individu
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analisis terperinci tingkat kedisiplinan, ketepatan waktu, dan riwayat presensi tiap pembimbing & staff Kumon Jambon.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Staff Selector List */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 px-1">
              Pilih Karyawan ({filteredSummaries.length})
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredSummaries.map((summary) => {
                const isSelected = summary.userId === selectedUserId;
                return (
                  <button
                    key={summary.userId}
                    type="button"
                    onClick={() => setSelectedUserId(summary.userId)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-50/80 border-[#00A0E9] ring-1 ring-[#00A0E9]/30 text-slate-900'
                        : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-[#00A0E9] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {summary.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-xs">{summary.userName}</p>
                        <p className="text-[10px] text-slate-500">{summary.position}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                        summary.disciplineRate >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : summary.disciplineRate >= 75
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {summary.disciplineRate}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Scorecard & Attendance Log */}
        <div className="lg:col-span-8 space-y-6">
          {activeSummary ? (
            <>
              {/* Profile & KPI Cards */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A0E9] to-[#0077B6] text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
                      {activeSummary.userName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {activeSummary.userName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {activeSummary.position} &bull; {activeSummary.userEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Predikat:</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${
                      activeSummary.disciplineRate >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeSummary.disciplineRate >= 75
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {activeSummary.disciplineRate >= 90
                        ? '🌟 Sangat Disiplin'
                        : activeSummary.disciplineRate >= 75
                        ? '⚡ Disiplin Cukup'
                        : '⚠️ Perlu Evaluasi'}
                    </span>
                  </div>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Tingkat Disiplin
                    </span>
                    <p className="text-2xl font-extrabold text-[#00A0E9] mt-1 font-mono">
                      {activeSummary.disciplineRate}%
                    </p>
                    <span className="text-[10px] text-slate-500">Kehadiran Tepat Waktu</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">
                      Tepat Waktu
                    </span>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                      {activeSummary.onTimeCount}
                    </p>
                    <span className="text-[10px] text-emerald-600">Sebelum 10:15 WIB</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                    <span className="text-[10px] uppercase font-bold text-amber-700">
                      Terlambat
                    </span>
                    <p className="text-2xl font-extrabold text-amber-700 mt-1 font-mono">
                      {activeSummary.lateCount}
                    </p>
                    <span className="text-[10px] text-amber-600">Tot: {activeSummary.totalLateMinutes} mnt</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
                    <span className="text-[10px] uppercase font-bold text-[#007BB5]">
                      Ijin / Cuti
                    </span>
                    <p className="text-2xl font-extrabold text-[#007BB5] mt-1 font-mono">
                      {activeSummary.excusedCount + activeSummary.leaveCount}
                    </p>
                    <span className="text-[10px] text-sky-600">Hari Disetujui</span>
                  </div>
                </div>
              </div>

              {/* Detailed Presence Logs Table */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#00A0E9]" />
                    Riwayat Presensi Harian ({userAttendances.length} Catatan)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Batas Toleransi: 10:15 WIB &bull; Radius: 50m
                  </span>
                </div>

                {userAttendances.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-xl">
                    Belum ada riwayat absensi tercatat untuk staf ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Tanggal</th>
                          <th className="py-2.5 px-3">Jam Masuk</th>
                          <th className="py-2.5 px-3">Jam Pulang</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Keterlambatan</th>
                          <th className="py-2.5 px-3">Jarak GPS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {userAttendances.map((rec) => (
                          <tr key={rec.id || rec.date} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {rec.date}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                              {rec.checkInTime}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {rec.checkOutTime || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === 'present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rec.status === 'late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {rec.status === 'present' ? 'Tepat Waktu' : rec.status === 'late' ? 'Terlambat' : rec.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {rec.lateMinutes > 0 ? (
                                <span className="text-amber-600 font-bold">+{rec.lateMinutes} menit</span>
                              ) : (
                                <span className="text-slate-400">0 mnt</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                <MapPin className="w-3 h-3 text-[#00A0E9]" />
                                {formatDistance(rec.distanceMeters)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs">
              Pilih karyawan dari daftar sebelah kiri untuk melihat rekap detail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
