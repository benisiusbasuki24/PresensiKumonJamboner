import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  addDoc, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { 
  CalendarCheck2, 
  BarChart3, 
  Briefcase, 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  UserCheck, 
  ChevronDown,
  Building2,
  Clock,
  Sparkles,
  Shield,
  HelpCircle
} from 'lucide-react';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { KumonLogo } from './components/KumonLogo';
import { AttendanceCard } from './components/AttendanceCard';
import { AdminDashboard } from './components/AdminDashboard';
import { PerformanceRecapView } from './components/PerformanceRecapView';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { 
  AttendanceRecord, 
  LeaveRequest, 
  PerformanceSummary, 
  SystemSettings, 
  UserProfile 
} from './types';
import { 
  INITIAL_STAFF_LIST, 
  INITIAL_SETTINGS, 
  generateSeedAttendances, 
  INITIAL_LEAVE_REQUESTS 
} from './data/defaultData';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_STAFF_LIST[0]);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'presence' | 'performance' | 'leave' | 'admin'>('presence');

  // Firestore Sync States
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [staffList, setStaffList] = useState<UserProfile[]>(INITIAL_STAFF_LIST);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(generateSeedAttendances());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);

  // Today's date string (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's attendance record for current user
  const todayRecord = useMemo(() => {
    return attendances.find(
      (a) => a.userId === currentUser.uid && a.date === todayStr
    ) || null;
  }, [attendances, currentUser.uid, todayStr]);

  // Today's attendances for all staff
  const todayAttendances = useMemo(() => {
    return attendances.filter((a) => a.date === todayStr);
  }, [attendances, todayStr]);

  // Pending leave requests count for admin badge
  const pendingLeavesCount = useMemo(() => {
    return leaveRequests.filter((l) => l.status === 'pending').length;
  }, [leaveRequests]);

  // Calculate detailed performance summaries for every staff member
  const performanceSummaries = useMemo<PerformanceSummary[]>(() => {
    return staffList.map((staff) => {
      const userRecords = attendances.filter((a) => a.userId === staff.uid);
      const userLeaves = leaveRequests.filter(
        (l) => l.userId === staff.uid && l.status === 'approved'
      );

      const presentCount = userRecords.length;
      const onTimeCount = userRecords.filter((a) => a.status === 'present').length;
      const lateCount = userRecords.filter((a) => a.status === 'late').length;
      const totalLateMinutes = userRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
      const averageLateMinutes = lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0;
      
      const excusedCount = userLeaves.filter((l) => l.type === 'ijin' || l.type === 'sakit').length;
      const leaveCount = userLeaves.filter((l) => l.type === 'cuti').length;
      const totalWorkingDays = Math.max(1, presentCount + excusedCount + leaveCount);

      const disciplineRate = presentCount > 0
        ? Math.round((onTimeCount / presentCount) * 100)
        : 100;

      return {
        userId: staff.uid,
        userName: staff.name,
        userEmail: staff.email,
        position: staff.position,
        totalWorkingDays,
        presentCount,
        onTimeCount,
        lateCount,
        totalLateMinutes,
        averageLateMinutes,
        excusedCount,
        leaveCount,
        absentCount: 0,
        disciplineRate,
      };
    });
  }, [staffList, attendances, leaveRequests]);

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // If logged in user email matches admin, grant admin
        const isAdminEmail = user.email === 'bendummy.apk@gmail.com';
        const matchedProfile = staffList.find((s) => s.email === user.email);

        if (matchedProfile) {
          setCurrentUser(matchedProfile);
        } else {
          setCurrentUser({
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Staff Kumon',
            email: user.email || '',
            role: isAdminEmail ? 'admin' : 'staff',
            position: isAdminEmail ? 'Kepala Cabang & HRD' : 'Pembimbing Kelas',
            isActive: true,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [staffList]);

  // 2. Real-time Firestore Listeners with error handling as mandated by skill
  useEffect(() => {
    // Sync Settings
    const unsubSettings = onSnapshot(
      doc(db, 'system_settings', 'config'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SystemSettings;
          // Sync with exact requested coordinates if not yet updated
          if (
            Math.abs(data.targetLat - INITIAL_SETTINGS.targetLat) > 0.000001 ||
            Math.abs(data.targetLng - INITIAL_SETTINGS.targetLng) > 0.000001 ||
            data.centerAddress !== INITIAL_SETTINGS.centerAddress
          ) {
            const updated = {
              ...data,
              centerAddress: INITIAL_SETTINGS.centerAddress,
              targetLat: INITIAL_SETTINGS.targetLat,
              targetLng: INITIAL_SETTINGS.targetLng,
              toleranceRadiusMeters: 50,
            };
            setDoc(doc(db, 'system_settings', 'config'), updated).catch(() => {});
            setSettings(updated);
          } else {
            setSettings(data);
          }
        } else {
          // Initialize default setting in Firestore
          setDoc(doc(db, 'system_settings', 'config'), INITIAL_SETTINGS).catch((err) => {
            console.warn('Initial settings sync:', err);
          });
        }
      },
      (error) => {
        console.warn('Settings snapshot listener note:', error.message);
      }
    );

    // Sync Attendances
    const unsubAttendances = onSnapshot(
      collection(db, 'attendances'),
      (snap) => {
        if (!snap.empty) {
          const remoteRecords: AttendanceRecord[] = [];
          snap.forEach((d) => {
            remoteRecords.push({ id: d.id, ...d.data() } as AttendanceRecord);
          });
          // Merge with seed attendances to keep rich historical data intact
          setAttendances((prev) => {
            const map = new Map<string, AttendanceRecord>();
            prev.forEach((r) => map.set(r.id || `${r.userId}-${r.date}`, r));
            remoteRecords.forEach((r) => map.set(r.id || `${r.userId}-${r.date}`, r));
            return Array.from(map.values());
          });
        }
      },
      (error) => {
        console.warn('Attendances snapshot listener note:', error.message);
      }
    );

    // Sync Leave Requests
    const unsubLeaves = onSnapshot(
      collection(db, 'leave_requests'),
      (snap) => {
        if (!snap.empty) {
          const remoteLeaves: LeaveRequest[] = [];
          snap.forEach((d) => {
            remoteLeaves.push({ id: d.id, ...d.data() } as LeaveRequest);
          });
          setLeaveRequests((prev) => {
            const map = new Map<string, LeaveRequest>();
            prev.forEach((l) => map.set(l.id || l.reason, l));
            remoteLeaves.forEach((l) => map.set(l.id || l.reason, l));
            return Array.from(map.values());
          });
        }
      },
      (error) => {
        console.warn('Leave requests snapshot listener note:', error.message);
      }
    );

    return () => {
      unsubSettings();
      unsubAttendances();
      unsubLeaves();
    };
  }, []);

  // Handler: Check-In
  const handleCheckIn = async (payload: Partial<AttendanceRecord>) => {
    try {
      const docRef = await addDoc(collection(db, 'attendances'), payload);
      // Optimistic local state update
      setAttendances((prev) => [
        { ...payload, id: docRef.id } as AttendanceRecord,
        ...prev,
      ]);
    } catch (err) {
      console.warn('Firestore write fallback, updating locally:', err);
      // Fallback local update if network offline
      setAttendances((prev) => [
        { ...payload, id: `local-${Date.now()}` } as AttendanceRecord,
        ...prev,
      ]);
    }
  };

  // Handler: Check-Out
  const handleCheckOut = async (recordId: string, notes?: string) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const checkOutTime = `${hours}:${minutes}:${seconds} WIB`;

    try {
      if (!recordId.startsWith('local-') && !recordId.startsWith('att-')) {
        await updateDoc(doc(db, 'attendances', recordId), {
          checkOutTime,
          notes: notes || '',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Firestore update checkout error:', err);
    }

    setAttendances((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, checkOutTime, notes: notes || r.notes } : r
      )
    );
  };

  // Handler: Submit Leave Request
  const handleSubmitLeaveRequest = async (payload: Partial<LeaveRequest>) => {
    try {
      const docRef = await addDoc(collection(db, 'leave_requests'), payload);
      setLeaveRequests((prev) => [
        { ...payload, id: docRef.id } as LeaveRequest,
        ...prev,
      ]);
    } catch (err) {
      console.warn('Firestore leave request write note:', err);
      setLeaveRequests((prev) => [
        { ...payload, id: `local-leave-${Date.now()}` } as LeaveRequest,
        ...prev,
      ]);
    }
  };

  // Handler: Admin Update Leave Status
  const handleUpdateLeaveStatus = async (
    requestId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string
  ) => {
    try {
      if (!requestId.startsWith('local-') && !requestId.startsWith('leave-')) {
        await updateDoc(doc(db, 'leave_requests', requestId), {
          status,
          adminNotes: adminNotes || '',
          reviewedBy: currentUser.name,
        });
      }
    } catch (err) {
      console.warn('Firestore leave update note:', err);
    }

    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === requestId
          ? { ...l, status, adminNotes: adminNotes || l.adminNotes, reviewedBy: currentUser.name }
          : l
      )
    );
  };

  // Handler: Admin Update Settings
  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    const merged = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'system_settings', 'config'), merged);
    } catch (err) {
      console.warn('Firestore settings update note:', err);
    }
    setSettings(merged);
  };

  // Google Sign In Popup
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign In:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Reset to default admin staff
      setCurrentUser(INITIAL_STAFF_LIST[0]);
    } catch (err) {
      console.error('Sign Out:', err);
    }
  };

  // Quick switch role profile for demonstration
  const handleSelectDemoProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    setIsRoleDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <KumonLogo size="md" />
          </div>

          {/* User Profile & Demo Switcher */}
          <div className="flex items-center gap-3">
            {/* Multi-role Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition shadow-2xs text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#00A0E9] text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    {currentUser.role === 'admin' ? (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-sky-100 text-[#007BB5]">
                        Staff
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {currentUser.position}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Ganti Profil / Akun Demo
                  </div>
                  <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                    {INITIAL_STAFF_LIST.map((profile) => (
                      <button
                        key={profile.uid}
                        type="button"
                        onClick={() => handleSelectDemoProfile(profile)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                          currentUser.uid === profile.uid
                            ? 'bg-sky-50 text-[#007BB5] font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{profile.name}</p>
                          <p className="text-[10px] text-slate-400">{profile.position}</p>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-100 text-slate-600">
                          {profile.role}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Google Auth Action */}
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    {firebaseUser ? (
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar ({firebaseUser.email})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#00A0E9] hover:bg-sky-50 transition flex items-center gap-2"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Masuk Akun Google Resmi</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto space-x-1 sm:space-x-4 no-scrollbar py-2">
            <button
              type="button"
              onClick={() => setActiveTab('presence')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'presence'
                  ? 'bg-[#00A0E9] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Presensi GPS Saya</span>
              {todayRecord && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'performance'
                  ? 'bg-[#00A0E9] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Rekap Performa Individu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leave')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'leave'
                  ? 'bg-[#00A0E9] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Pengajuan Ijin & Cuti</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap relative ${
                activeTab === 'admin'
                  ? 'bg-[#00A0E9] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Admin</span>
              {pendingLeavesCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingLeavesCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'presence' && (
          <AttendanceCard
            user={currentUser}
            settings={settings}
            todayRecord={todayRecord}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        )}

        {activeTab === 'performance' && (
          <PerformanceRecapView
            summaries={performanceSummaries}
            attendances={attendances}
            allStaff={staffList}
          />
        )}

        {activeTab === 'leave' && (
          <LeaveRequestModal
            user={currentUser}
            requests={leaveRequests}
            onSubmitRequest={handleSubmitLeaveRequest}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            staffList={staffList}
            todayAttendances={todayAttendances}
            allAttendances={attendances}
            leaveRequests={leaveRequests}
            summaries={performanceSummaries}
            settings={settings}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#00A0E9]">KUMON JAMBON</span>
            <span>&bull;</span>
            <span>Sistem Presensi Online Real-Time & GPS Validation</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Jam Masuk: 10:00 WIB (Senin - Sabtu) &bull; Toleransi 15 Menit &bull; Radius 50m
          </div>
        </div>
      </footer>
    </div>
  );
}
