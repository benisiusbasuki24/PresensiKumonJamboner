import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Users, 
  Clock, 
  X,
  ExternalLink
} from 'lucide-react';
import { AttendanceRecord, UserProfile } from '../types';

interface EmailReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: UserProfile[];
  todayAttendances: AttendanceRecord[];
}

export const EmailReminderModal: React.FC<EmailReminderModalProps> = ({
  isOpen,
  onClose,
  staffList,
  todayAttendances,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

  if (!isOpen) return null;

  // Find staff who haven't checked in yet today
  const attendedUserIds = new Set(todayAttendances.map((a) => a.userId));
  const unverifiedStaff = staffList.filter((staff) => !attendedUserIds.has(staff.uid));

  const generateEmailSubject = () => {
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `[PENTING] Pengingat Presensi Harian Kumon Jambon - ${today}`;
  };

  const generateEmailBody = (staffName: string) => {
    return `Yth. ${staffName},

Mengingatkan bahwa jadwal kehadiran di KUMON JAMBON dimulai pukul 10:00 WIB (dengan toleransi keterlambatan 15 menit hingga pukul 10:15 WIB).

Berdasarkan pemantauan sistem absensi real-time hari ini, Anda tercatat BELUM melakukan presensi online di area Kumon Jambon.

Harap segera:
1. Buka aplikasi presensi online Kumon Jambon pada perangkat Anda.
2. Pastikan Anda berada dalam radius 50 meter dari kantor.
3. Lakukan Absen Masuk atau ajukan permohonan Ijin/Cuti jika berhalangan hadir.

Terima kasih atas kerja sama dan kedisiplinan Anda.

Salam,
HRD & Manajemen KUMON JAMBON
Jl. Jambon No. 42B, Tegalrejo, Yogyakarta`;
  };

  const handleCopyEmail = (staff: UserProfile) => {
    const text = `Kepada: ${staff.email}\nSubjek: ${generateEmailSubject()}\n\n${generateEmailBody(staff.name)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.uid);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenMailClient = (staff: UserProfile) => {
    const subject = encodeURIComponent(generateEmailSubject());
    const body = encodeURIComponent(generateEmailBody(staff.name));
    window.open(`mailto:${staff.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleBroadcastAll = () => {
    if (unverifiedStaff.length === 0) return;
    const emails = unverifiedStaff.map((s) => s.email).join(',');
    const subject = encodeURIComponent(generateEmailSubject());
    const body = encodeURIComponent(
      generateEmailBody('Bapak/Ibu Tim Kumon Jambon')
    );
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`, '_blank');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A0E9] to-[#0077B6] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">
                Pusat Pengingat Email Karyawan
              </h3>
              <p className="text-xs text-sky-100">
                Kirim notifikasi otomatis bagi staff yang belum presensi pkl 10:15 WIB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Summary Warning Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  {unverifiedStaff.length} dari {staffList.length} Karyawan Belum Melakukan Absen
                </h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Batas toleransi masuk kantor adalah pukul 10:15 WIB. Gunakan tombol di bawah untuk mengingatkan karyawan yang bersangkutan via email.
                </p>
              </div>
            </div>

            {unverifiedStaff.length > 0 && (
              <button
                type="button"
                onClick={handleBroadcastAll}
                className="flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Semua ({unverifiedStaff.length})</span>
              </button>
            )}
          </div>

          {broadcastSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Aplikasi email eksternal berhasil dibuka untuk mengirim pesan pengingat ke seluruh staf.</span>
            </div>
          )}

          {/* List of Staff Who Haven't Checked In */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00A0E9]" />
              Daftar Karyawan Belum Presensi
            </h4>

            {unverifiedStaff.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Luar Biasa!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Seluruh staf Kumon Jambon telah melakukan presensi hari ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {unverifiedStaff.map((staff) => (
                  <div
                    key={staff.uid}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{staff.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {staff.position}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {staff.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(staff)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition flex items-center gap-1.5 text-[11px]"
                        title="Salin pesan email pengingat"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === staff.uid ? 'Tersalin!' : 'Salin Teks'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenMailClient(staff)}
                        className="px-3 py-1.5 rounded-lg bg-[#00A0E9] hover:bg-[#008CCF] text-white font-bold transition flex items-center gap-1.5 text-[11px] shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Email</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Preview Template */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">
              Template Pesan Notifikasi Otomatis:
            </h4>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 font-mono text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
              {generateEmailBody('[Nama Staff]')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
