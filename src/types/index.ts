export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  position: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
}

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'leave' | 'absent';

export interface AttendanceRecord {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string | null;
  status: AttendanceStatus;
  lateMinutes: number; // 0 if on time or <= 15 min after 10:00
  latitude: number;
  longitude: number;
  distanceMeters: number;
  isWithinRadius: boolean;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'ijin' | 'cuti' | 'sakit';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  adminNotes?: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface SystemSettings {
  centerName: string;
  centerAddress: string;
  targetLat: number;
  targetLng: number;
  toleranceRadiusMeters: number; // 50m
  workStartTime: string; // "10:00"
  gracePeriodMinutes: number; // 15
  workDays: string[];
  updatedAt?: string;
}

export interface PerformanceSummary {
  userId: string;
  userName: string;
  userEmail: string;
  position: string;
  totalWorkingDays: number;
  presentCount: number;
  onTimeCount: number;
  lateCount: number;
  totalLateMinutes: number;
  averageLateMinutes: number;
  excusedCount: number;
  leaveCount: number;
  absentCount: number;
  disciplineRate: number; // percentage (0 - 100)
}
