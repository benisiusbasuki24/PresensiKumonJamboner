import React, { useState } from 'react';
import { 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Send,
  PlusCircle,
  Briefcase
} from 'lucide-react';
import { LeaveRequest, LeaveType, UserProfile } from '../types';

interface LeaveRequestModalProps {
  user: UserProfile;
  requests: LeaveRequest[];
  onSubmitRequest: (payload: Partial<LeaveRequest>) => Promise<void>;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  user,
  requests,
  onSubmitRequest,
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [type, setType] = useState<LeaveType>('ijin');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calculate days difference
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const daysCount = calculateDays(startDate, endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      alert('Harap lengkapi semua kolom formulir.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitRequest({
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        type,
        startDate,
        endDate,
        daysCount,
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      alert('Permohonan ijin/cuti berhasil diajukan dan menunggu persetujuan HRD/Admin.');
      setShowForm(false);
      setReason('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim permohonan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // User's own requests
  const myRequests = requests.filter((r) => r.userId === user.uid);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#00A0E9]" />
            Pengajuan Ijin & Cuti Kerja
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Formulir resmi permohonan ijin, cuti tahunan, dan sakit untuk staf & pembimbing Kumon Jambon.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-[#00A0E9] hover:bg-[#008CCF] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showForm ? 'Tutup Formulir' : 'Buat Permohonan Baru'}</span>
        </button>
      </div>

      {/* Form Submission */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm animate-fadeIn space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">
              Formulir Permohonan Ketidakhadiran
            </h3>
            <span className="text-[11px] text-slate-500">
              Pengajuan akan langsung ditinjau oleh Admin Cabang / HRD.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Permohonan
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
              >
                <option value="ijin">Ijin Tidak Masuk (Keperluan Mendesak)</option>
                <option value="cuti">Cuti Tahunan</option>
                <option value="sakit">Sakit (Kondisi Kesehatan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Selesai
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-3 bg-sky-50 rounded-xl text-xs text-[#007BB5] font-medium flex items-center justify-between">
              <span>Durasi yang diajukan:</span>
              <span className="font-bold">{daysCount} Hari Kerja</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alasan / Keterangan Terperinci
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan alasan pengajuan ijin/cuti, serta tindak lanjut tugas mengajar siswa di kelas jika ada pembimbing pengganti."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E9]"
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[#00A0E9] hover:bg-[#008CCF] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Permohonan'}</span>
            </button>
          </div>
        </form>
      )}

      {/* History List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#00A0E9]" />
          Riwayat Pengajuan Saya ({myRequests.length})
        </h3>

        {myRequests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Belum ada riwayat permohonan ijin atau cuti yang diajukan.
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-sky-100 text-[#007BB5]">
                      {req.type}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {req.startDate} s/d {req.endDate} ({req.daysCount} hari)
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1">
                    "{req.reason}"
                  </p>
                  {req.adminNotes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      Catatan Admin: {req.adminNotes}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                  {req.status === 'approved' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Disetujui
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Ditolak
                    </span>
                  )}
                  {req.status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      Menunggu Approval
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
