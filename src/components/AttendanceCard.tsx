import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  ArrowRightCircle, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  Smartphone,
  Info,
  Scan,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { MapView } from './MapView';
import { FaceCameraScanner } from './FaceCameraScanner';
import { AttendanceRecord, SystemSettings, UserProfile } from '../types';
import { calculateDistanceMeters, evaluateAttendanceTime, formatDistance } from '../utils/geo';
import { audioFeedback } from '../utils/audio';

interface AttendanceCardProps {
  user: UserProfile;
  settings: SystemSettings;
  todayRecord: AttendanceRecord | null;
  onCheckIn: (payload: Partial<AttendanceRecord>) => Promise<void>;
  onCheckOut: (recordId: string, notes?: string) => Promise<void>;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  user,
  settings,
  todayRecord,
  onCheckIn,
  onCheckOut,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState<boolean>(false);
  const [validatedData, setValidatedData] = useState<{
    time: string;
    statusText: string;
    isLate: boolean;
    distance: number;
    photoUrl?: string;
  } | null>(null);

  // Live Clock (1 second interval)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Request & Watch GPS Location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Perangkat tidak mendukung sensor geolokasi GPS.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;

        setUserCoords({ lat, lng, accuracy: acc });

        const dist = calculateDistanceMeters(
          lat,
          lng,
          settings.targetLat,
          settings.targetLng
        );
        setDistanceMeters(dist);
        setIsWithinRadius(dist <= settings.toleranceRadiusMeters);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Izin akses lokasi ditolak. Harap izinkan akses GPS di peramban Anda.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('Sinyal GPS belum terdeteksi. Pastikan GPS aktif.');
        } else {
          setGpsError('Gagal mendeteksi koordinat GPS.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, [settings.targetLat, settings.targetLng, settings.toleranceRadiusMeters]);

  // Quick Demo Simulator for Testing GPS inside radius if testing from outside
  const simulateOfficeLocation = () => {
    // Offset slightly by ~12 meters from Kumon center
    const simLat = settings.targetLat + 0.00008;
    const simLng = settings.targetLng + 0.00008;
    setUserCoords({ lat: simLat, lng: simLng, accuracy: 5 });
    const dist = calculateDistanceMeters(simLat, simLng, settings.targetLat, settings.targetLng);
    setDistanceMeters(dist);
    setIsWithinRadius(dist <= settings.toleranceRadiusMeters);
    setGpsError(null);
  };

  // Evaluate current schedule status
  const scheduleEval = evaluateAttendanceTime(
    currentTime,
    settings.workStartTime,
    settings.gracePeriodMinutes
  );

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleAbsenMasuk = async () => {
    if (!userCoords || distanceMeters === null) {
      alert('Sedang menunggu koordinat GPS. Harap tekan tombol "Update GPS" atau tunggu sinyal.');
      return;
    }

    if (!isWithinRadius) {
      audioFeedback.playWarningBeep();
      alert(`Lokasi Anda berjarak ${formatDistance(distanceMeters)} dari Kumon Jambon. Toleransi maksimal ${settings.toleranceRadiusMeters} meter.`);
      return;
    }

    // Require face scan verification
    if (!facePhoto) {
      setIsFaceScannerOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const evalResult = evaluateAttendanceTime(
        new Date(),
        settings.workStartTime,
        settings.gracePeriodMinutes
      );

      const todayStr = new Date().toISOString().split('T')[0];

      await onCheckIn({
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        date: todayStr,
        checkInTime: evalResult.formattedCheckInTime,
        status: evalResult.isLate ? 'late' : 'present',
        lateMinutes: evalResult.lateMinutes,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        distanceMeters,
        isWithinRadius: true,
        photoUrl: facePhoto,
        notes: notes || 'Hadir bertugas di Kumon Jambon (GPS & Wajah Terverifikasi)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Validation Success Celebration
      audioFeedback.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#00A0E9', '#0077B6', '#38BDF8', '#FFFFFF', '#FCD34D'],
      });

      setValidatedData({
        time: evalResult.formattedCheckInTime,
        statusText: evalResult.statusText,
        isLate: evalResult.isLate,
        distance: distanceMeters,
        photoUrl: facePhoto,
      });
      setShowSuccessModal(true);
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses presensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbsenPulang = async () => {
    if (!todayRecord?.id) return;
    try {
      setIsSubmitting(true);
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const checkOutTime = `${hours}:${minutes}:${seconds} WIB`;

      await onCheckOut(todayRecord.id, notes || todayRecord.notes);
      audioFeedback.playSuccessChime();
      alert(`Presensi pulang berhasil dicatat pada ${checkOutTime}`);
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat presensi pulang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Live Clock */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#00A0E9] via-[#008CCF] to-[#0077B6] rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-sky-500/20">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Presensi Karyawan & Staff Cabang</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Halo, {user.name}
            </h2>
            <p className="text-sky-100 text-sm mt-1">
              {user.position} &bull; Kumon Jambon
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-sky-100/90 font-medium">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Large Digital Clock */}
          <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-[11px] uppercase tracking-wider text-sky-200 font-semibold mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Waktu Real-time (WIB)
            </span>
            <div className="font-mono text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow">
              {formattedTime}
            </div>
            <div className="mt-2 text-xs flex items-center gap-1.5">
              <span className="text-sky-100">Jadwal Masuk: <strong>{settings.workStartTime} WIB</strong></span>
              <span className="text-sky-200 font-bold">&bull;</span>
              <span className="text-amber-200">Batas: <strong>10:15 WIB</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map & GPS Distance Radar */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#00A0E9]" />
                <h3 className="font-bold text-slate-800 text-base">
                  Peta Validasi Lokasi (Radius 50m)
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-sky-50 text-[#007BB5] border border-sky-100">
                Pusat: Kumon Jambon
              </span>
            </div>

            {/* Leaflet Map */}
            <MapView
              centerLat={settings.targetLat}
              centerLng={settings.targetLng}
              centerName={settings.centerName}
              radiusMeters={settings.toleranceRadiusMeters}
              userLat={userCoords?.lat}
              userLng={userCoords?.lng}
              userAccuracy={userCoords?.accuracy}
              distanceMeters={distanceMeters}
              isWithinRadius={isWithinRadius}
              onRefreshLocation={requestLocation}
              isLoadingLocation={isLocating}
            />

            {/* GPS Status Notice */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#00A0E9] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-700">
                    Alamat: {settings.centerAddress}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {userCoords
                      ? `Koordinat Anda: ${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)} (Akurasi: ±${Math.round(userCoords.accuracy)}m)`
                      : 'Mendeteksi titik koordinat perangkat...'}
                  </p>
                </div>
              </div>

              {/* Development Simulation Button */}
              <button
                type="button"
                onClick={simulateOfficeLocation}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-sky-200 text-[#007BB5] hover:bg-sky-50 font-medium transition flex-shrink-0 shadow-xs"
                title="Simulasikan posisi berada di dalam radius Kumon Jambon untuk keperluan pengujian"
              >
                📍 Simulasi Di Kantor
              </button>
            </div>

            {gpsError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{gpsError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Attendance Action Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#00A0E9]" />
                  Status Kehadiran Hari Ini
                </h3>
                {todayRecord ? (
                  <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 ${
                    todayRecord.status === 'present'
                      ? 'bg-emerald-100 text-emerald-800'
                      : todayRecord.status === 'late'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {todayRecord.status === 'present' ? 'Tepat Waktu' : todayRecord.status === 'late' ? `Terlambat (${todayRecord.lateMinutes}m)` : todayRecord.status}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-600">
                    Belum Absen
                  </span>
                )}
              </div>

              {/* Today Record Info if already checked in */}
              {todayRecord ? (
                <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200 rounded-2xl p-5 mb-5 space-y-3">
                  {todayRecord.photoUrl && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs mb-2">
                      <img
                        src={todayRecord.photoUrl}
                        alt="Foto Wajah Presensi"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shadow-xs"
                      />
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Verifikasi Wajah Biometrik
                        </span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">
                          Tervalidasi & Tercatat di Server
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-900">Jam Masuk</span>
                    <span className="text-sm font-bold font-mono text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-100 shadow-xs">
                      {todayRecord.checkInTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-900">Jam Pulang</span>
                    <span className="text-sm font-bold font-mono text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                      {todayRecord.checkOutTime || 'Belum Absen Pulang'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-emerald-800 pt-1 border-t border-emerald-200/60">
                    <span>Verifikasi GPS:</span>
                    <span className="font-semibold text-emerald-700">Tervalidasi ({formatDistance(todayRecord.distanceMeters)})</span>
                  </div>
                </div>
              ) : (
                /* Pre-checkin status overview */
                <div className="space-y-3 mb-5">
                  {/* Status 1: Radius 50m */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    isWithinRadius
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50/70 border-amber-200 text-amber-800'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {isWithinRadius ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <div>
                        <p className="text-xs font-bold">
                          {isWithinRadius ? 'Lokasi GPS Valid (<50m)' : 'Di Luar Radius Kantor'}
                        </p>
                        <p className="text-[11px] opacity-80">
                          {distanceMeters !== null
                            ? `Jarak ke titik kantor: ${formatDistance(distanceMeters)}`
                            : 'Mendeteksi jarak...'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/70">
                      Maks 50m
                    </span>
                  </div>

                  {/* Status 2: Face Biometric Scanner */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    facePhoto
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-sky-50/70 border-sky-200 text-[#007BB5]'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {facePhoto ? (
                        <div className="relative">
                          <img
                            src={facePhoto}
                            alt="Wajah Terverifikasi"
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                          />
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#00A0E9]/10 flex items-center justify-center text-[#00A0E9]">
                          <Scan className="w-5 h-5 animate-pulse" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold">
                          {facePhoto ? 'Wajah Terverifikasi Biometrik' : 'Verifikasi Wajah Pembimbing'}
                        </p>
                        <p className="text-[11px] opacity-80">
                          {facePhoto ? 'Foto siap dilampirkan ke sistem' : 'Wajib foto wajah dengan kamera'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFaceScannerOpen(true)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        facePhoto
                          ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'bg-[#00A0E9] hover:bg-[#008CCF] text-white'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{facePhoto ? 'Ubah Foto' : 'Pindai Wajah'}</span>
                    </button>
                  </div>

                  {/* Status 3: Jam Kerja Schedule */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    !scheduleEval.isLate
                      ? 'bg-sky-50/70 border-sky-200 text-[#007BB5]'
                      : 'bg-orange-50/70 border-orange-200 text-orange-800'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5" />
                      <div>
                        <p className="text-xs font-bold">{scheduleEval.statusText}</p>
                        <p className="text-[11px] opacity-80">
                          Jadwal: 10:00 WIB (Toleransi 15 mnt)
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/70">
                      {scheduleEval.isLate ? `+${scheduleEval.lateMinutes}m` : '0m'}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes Input */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Kehadiran (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Bertugas di ruang kelas Matematika level F"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A0E9] focus:border-transparent bg-slate-50"
                  maxLength={150}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {!todayRecord ? (
                <button
                  type="button"
                  disabled={!isWithinRadius || isSubmitting}
                  onClick={handleAbsenMasuk}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition duration-200 active:scale-[0.98] ${
                    isWithinRadius && facePhoto && !isSubmitting
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 cursor-pointer ring-2 ring-emerald-300'
                      : isWithinRadius && !facePhoto
                      ? 'bg-[#00A0E9] hover:bg-[#008CCF] text-white shadow-sky-500/25 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {isSubmitting
                      ? 'Memproses Validasi...'
                      : !isWithinRadius
                      ? 'DI LUAR RADIUS 50M'
                      : !facePhoto
                      ? 'PINDAI WAJAH & ABSEN SEKARANG'
                      : 'ABSEN MASUK (GPS & WAJAH VALID)'}
                  </span>
                </button>
              ) : !todayRecord.checkOutTime ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleAbsenPulang}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide bg-slate-800 hover:bg-slate-900 text-white shadow-md flex items-center justify-center gap-2 transition duration-200 active:scale-[0.98] cursor-pointer"
                >
                  <ArrowRightCircle className="w-5 h-5 text-emerald-400" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'ABSEN PULANG'}</span>
                </button>
              ) : (
                <div className="w-full py-3.5 px-4 rounded-xl bg-slate-100 text-slate-600 font-semibold text-center text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Presensi hari ini telah lengkap (Masuk & Pulang).</span>
                </div>
              )}

              {!isWithinRadius && !todayRecord && (
                <p className="text-[11px] text-center text-amber-700 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200/70">
                  ⚠️ Dekati pusat Kumon Jambon (radius &lt;50m) untuk mengaktifkan tombol absensi.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Face Scanner Modal */}
      <FaceCameraScanner
        isOpen={isFaceScannerOpen}
        onClose={() => setIsFaceScannerOpen(false)}
        onCaptureFace={(photo) => setFacePhoto(photo)}
        staffName={user.name}
      />

      {/* Real-time Validation Success Modal */}
      {showSuccessModal && validatedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden">
            {/* Top Cyan Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#00A0E9]" />
            
            {validatedData.photoUrl ? (
              <div className="relative mx-auto w-24 h-24 mb-3">
                <img
                  src={validatedData.photoUrl}
                  alt="Foto Terverifikasi"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#00A0E9] shadow-md mx-auto"
                />
                <div className="absolute bottom-0 right-1 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            )}

            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A0E9] bg-sky-50 px-3 py-1 rounded-full">
              VALIDASI GPS & WAJAH BERHASIL
            </span>

            <h3 className="text-xl font-extrabold text-slate-800 mt-2">
              Kehadiran Tervalidasi!
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Biometrik wajah dan koordinat GPS Anda telah terverifikasi resmi oleh sistem Kumon Jambon.
            </p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-left text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Nama Staff</span>
                <span className="font-bold text-slate-800">{user.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Waktu Absen</span>
                <span className="font-mono font-bold text-slate-800">{validatedData.time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Status Kedatangan</span>
                <span className={`font-bold ${validatedData.isLate ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {validatedData.statusText}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Jarak Validasi GPS</span>
                <span className="font-bold text-[#007BB5]">{formatDistance(validatedData.distance)} (Aman &lt;50m)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Verifikasi Wajah</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Biometrik Valid
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 px-5 rounded-xl bg-[#00A0E9] hover:bg-[#008CCF] text-white font-bold text-xs tracking-wider uppercase transition shadow-md shadow-sky-500/25"
            >
              Tutup & Lanjutkan Kerja
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
