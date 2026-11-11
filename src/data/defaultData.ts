import { AttendanceRecord, LeaveRequest, SystemSettings, UserProfile } from '../types';

export const INITIAL_STAFF_LIST: UserProfile[] = [
  {
    uid: 'admin-kumon-1',
    name: 'Siti Nurhaliza, S.Pd',
    email: 'bendummy.apk@gmail.com',
    role: 'admin',
    position: 'Kepala Cabang & HRD',
    phone: '0812-3456-7890',
    isActive: true,
  },
  {
    uid: 'staff-kumon-2',
    name: 'Bagas Pratama, S.Si',
    email: 'bagas.pratama@kumonjambon.id',
    role: 'staff',
    position: 'Pembimbing Matematika',
    phone: '0813-8822-1100',
    isActive: true,
  },
  {
    uid: 'staff-kumon-3',
    name: 'Anisa Rahmawati, S.Hum',
    email: 'anisa.rahmawati@kumonjambon.id',
    role: 'staff',
    position: 'Pembimbing Bahasa Inggris',
    phone: '0857-4321-9988',
    isActive: true,
  },
  {
    uid: 'staff-kumon-4',
    name: 'Dimas Aditya Saputra',
    email: 'dimas.aditya@kumonjambon.id',
    role: 'staff',
    position: 'Staff Administrasi & Keuangan',
    phone: '0821-9012-3456',
    isActive: true,
  },
  {
    uid: 'staff-kumon-5',
    name: 'Rina Septiani, S.Pd',
    email: 'rina.septiani@kumonjambon.id',
    role: 'staff',
    position: 'Asisten Pembimbing Kelas Pagi',
    phone: '0878-1234-5678',
    isActive: true,
  },
  {
    uid: 'staff-kumon-6',
    name: 'Farhan Mahendra, S.Mat',
    email: 'farhan.mahendra@kumonjambon.id',
    role: 'staff',
    position: 'Pembimbing Matematika Lanjut (O-Q)',
    phone: '0819-7654-3210',
    isActive: true,
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  centerName: 'KUMON JAMBON',
  centerAddress: 'Jl. Jambon, Ruko IBC No. 12 A-B, Yogyakarta',
  targetLat: -7.7691427,
  targetLng: 110.3548331,
  toleranceRadiusMeters: 50,
  workStartTime: '10:00',
  gracePeriodMinutes: 15,
  workDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  updatedAt: new Date().toISOString(),
};

// Generate realistic initial month attendances
export function generateSeedAttendances(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Create attendance logs for past 10 working days
  for (let day = 1; day <= Math.min(today.getDate(), 20); day++) {
    const recordDate = new Date(currentYear, currentMonth, day);
    // Kumon operational Monday (1) to Saturday (6), closed Sunday (0)
    if (recordDate.getDay() === 0) continue;

    const dateStr = recordDate.toISOString().split('T')[0];

    INITIAL_STAFF_LIST.forEach((staff, idx) => {
      // Vary check-in times realistically around 10:00 WIB
      const isLateRandom = (day + idx) % 5 === 0; // occasionally late
      const minute = isLateRandom ? 16 + ((day * 3) % 25) : 45 + ((day + idx) % 14); // before 10:00 or after 10:15
      const hour = isLateRandom ? 10 : 9;

      const checkInTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:15 WIB`;
      const checkOutTime = `17:05:30 WIB`;
      const lateMinutes = isLateRandom ? minute : 0;
      const status = isLateRandom ? 'late' : 'present';

      records.push({
        id: `att-${staff.uid}-${dateStr}`,
        userId: staff.uid,
        userName: staff.name,
        userEmail: staff.email,
        date: dateStr,
        checkInTime,
        checkOutTime,
        status,
        lateMinutes,
        latitude: -7.7691427 + (Math.random() - 0.5) * 0.0003,
        longitude: 110.3548331 + (Math.random() - 0.5) * 0.0003,
        distanceMeters: Math.floor(Math.random() * 35) + 5, // 5m - 40m (well within 50m)
        isWithinRadius: true,
        notes: isLateRandom ? 'Terlambat karena kendala lalu lintas' : 'Hadir bertugas mengajar',
        createdAt: recordDate.toISOString(),
        updatedAt: recordDate.toISOString(),
      });
    });
  }

  return records;
}

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    userId: 'staff-kumon-5',
    userName: 'Rina Septiani, S.Pd',
    userEmail: 'rina.septiani@kumonjambon.id',
    type: 'ijin',
    startDate: '2026-11-14',
    endDate: '2026-11-14',
    daysCount: 1,
    reason: 'Menghadiri acara wisuda keluarga di luar kota. Materi pengajaran kelas telah dikoordinasikan.',
    status: 'pending',
    createdAt: '2026-11-10T08:30:00Z',
  },
  {
    id: 'leave-2',
    userId: 'staff-kumon-2',
    userName: 'Bagas Pratama, S.Si',
    userEmail: 'bagas.pratama@kumonjambon.id',
    type: 'sakit',
    startDate: '2026-11-03',
    endDate: '2026-11-04',
    daysCount: 2,
    reason: 'Sakit demam dan istirahat dokter (surat keterangan dokter telah dilampirkan ke admin).',
    status: 'approved',
    adminNotes: 'Lekas sembuh Mas Bagas, kelas digantikan sementara oleh Bu Siti.',
    reviewedBy: 'Siti Nurhaliza, S.Pd',
    createdAt: '2026-11-02T19:00:00Z',
  },
];
