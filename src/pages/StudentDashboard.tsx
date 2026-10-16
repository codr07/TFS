import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdmin } from '../lib/supabase';
import {
  Award,
  BookOpen,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Bot,
  Clock3,
  Copy,
  Download,
  Edit3,
  Guitar,
  IdCard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Music,
  Percent,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import type {
  AddOn,
  CurriculumItem,
  FeePaymentRecord,
  FeePlan,
  ScheduleItem,
  StudentProfile,
} from '../lib/tfsData';
import {
  loadAddOns,
  loadCurriculumItems,
  loadDiscounts,
  loadFeePlans,
  loadScheduleItems,
  loadStudents,
  loadStoredFeePayments,
  fetchFeePayments,
  uploadImageToBucket,
  recordStudentPayment,
  updateStudentSelfProfile,
} from '../lib/tfsData';
import { generateStudentIdCardPdf, generateFeeReceiptPdf } from '../lib/pdfGenerator';
import { askTfsAi } from '../lib/tfsAi';
import { subscribeToSync, broadcastSync } from '../lib/syncBus';

type StudentTab = 'home' | 'idcard' | 'profile' | 'payments' | 'modules' | 'requests' | 'ai';

interface AiMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<StudentTab>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Dynamic Student Profile State
  const [student, setStudent] = useState<StudentProfile | null>(null);

  // Dynamic Database Catalogs
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [addOnsList, setAddOnsList] = useState<AddOn[]>([]);
  const [curriculumList, setCurriculumList] = useState<CurriculumItem[]>([]);
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>([]);
  const [discountsList, setDiscountsList] = useState<any[]>([]);

  // User-specific Activity & Submissions
  const [myPayments, setMyPayments] = useState<FeePaymentRecord[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Student Syllabus Progress (persisted per student)
  const [moduleProgress, setModuleProgress] = useState<Record<string, 'not_started' | 'in_progress' | 'mastered'>>({});

  // Modals & Panels
  const [showPayModal, setShowPayModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);

  const notify = (msg: string) => {
    setNotice(msg);
    setError('');
    window.setTimeout(() => setNotice(''), 4500);
  };

  const fail = (msg: string) => {
    setError(msg);
    setNotice('');
    window.setTimeout(() => setError(''), 5500);
  };

  const [currentDate] = useState(() => new Date());

  // Fetch full dynamic catalogs and student profile
  const fetchStudentData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const email = user.email || '';

      // 1. Load dynamic catalogs in parallel directly from Supabase
      const [loadedPlans, loadedAddons, loadedCurrs, loadedSchedules, loadedDiscounts, loadedStudentsList] = await Promise.all([
        loadFeePlans(),
        loadAddOns(),
        loadCurriculumItems(),
        loadScheduleItems(),
        loadDiscounts(),
        loadStudents(),
      ]);

      setFeePlans(loadedPlans);
      setAddOnsList(loadedAddons);
      setCurriculumList(loadedCurrs);
      setScheduleList(loadedSchedules);
      setDiscountsList(loadedDiscounts);

      // Default fallback fee plan from dynamic fee plans
      const defaultPlan = loadedPlans.find((p) => p.active !== false) || loadedPlans[0];
      const defaultPlanName = defaultPlan ? `${defaultPlan.name} — ₹${defaultPlan.amount.toLocaleString('en-IN')}/month` : 'Home Visit — ₹1,500/month';
      const defaultSchedule = loadedSchedules.find((s) => s.active !== false);
      const defaultScheduleSlot = defaultSchedule ? `${defaultSchedule.day_label} — ${defaultSchedule.time_label}` : 'Friday — 8:00 PM – 11:00 PM';

      // 2. Match student from the centralized students catalog (controlled by admin)
      const matchedAdminStudent = loadedStudentsList.find(
        (s) => s.id === user.id || (s.email && s.email.toLowerCase() === email.toLowerCase())
      );

      // 3. Fetch from student_profiles by email or ID
      const { data: spData } = await supabaseAdmin
        .from('student_profiles')
        .select('*')
        .or(`email.eq.${email},id.eq.${user.id}`)
        .maybeSingle();

      // 4. Fetch from profiles by ID
      const { data: pData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      let loadedProfile: StudentProfile;

      if (spData) {
        // Find matching fee plan amount
        let matchedFee = defaultPlan?.amount || 1500;
        if (spData.class_schedule) {
          const matched = loadedPlans.find((p) =>
            spData.class_schedule.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(spData.class_schedule.toLowerCase())
          );
          if (matched) matchedFee = matched.amount;
        }

        loadedProfile = {
          id: spData.id,
          first_name: spData.first_name || '',
          last_name: spData.last_name || '',
          email: spData.email || email,
          phone_number: spData.phone_number || '',
          curriculum: spData.curriculum || 'Guitar',
          class_schedule: spData.class_schedule || defaultPlanName,
          preferred_schedule: spData.preferred_schedule || defaultScheduleSlot,
          status: (spData.status as any) || 'active',
          created_at: spData.created_at || user.created_at || new Date().toISOString(),
          updated_at: spData.updated_at,
          monthly_fee: spData.monthly_fee !== undefined && spData.monthly_fee !== null ? Number(spData.monthly_fee) : matchedFee,
          fee_status: spData.fee_status || 'Up to date',
          fee_due_date: spData.fee_due_date || '',
          addons: Array.isArray(spData.addons) ? spData.addons : (typeof spData.addons === 'string' ? [spData.addons] : []),
          profession: spData.profession || '',
          address: spData.address || '',
          bio: spData.bio || '',
          notes: spData.notes || '',
          emergency_contact: spData.emergency_contact || '',
          emergency_phone: spData.emergency_phone || '',
          avatar_url: spData.avatar_url || '',
          module_progress: spData.module_progress || {},
          overall_progress_pct: spData.overall_progress_pct ?? 0,
          instructor_feedback: spData.instructor_feedback || '',
          milestone_badges: Array.isArray(spData.milestone_badges) ? spData.milestone_badges : [],
          last_evaluated_at: spData.last_evaluated_at || '',
          admission_id: spData.admission_id || '',
        };
      } else {
        // Build from auth user & profiles
        const displayName = pData?.full_name || pData?.display_name || user.user_metadata?.full_name || email.split('@')[0];
        const nameParts = displayName.trim().split(' ');
        const newRecord: StudentProfile = {
          id: user.id,
          first_name: nameParts[0] || 'Student',
          last_name: nameParts.slice(1).join(' ') || '',
          email,
          phone_number: '',
          curriculum: 'Guitar',
          class_schedule: defaultPlanName,
          preferred_schedule: defaultScheduleSlot,
          status: 'active',
          monthly_fee: defaultPlan?.amount || 1500,
          fee_status: 'Up to date',
          created_at: user.created_at || new Date().toISOString(),
          addons: [],
        };

        // Create in student_profiles
        try {
          await supabaseAdmin.from('student_profiles').upsert({
            id: user.id,
            first_name: newRecord.first_name,
            last_name: newRecord.last_name,
            email: newRecord.email,
            curriculum: newRecord.curriculum,
            class_schedule: newRecord.class_schedule,
            status: 'active',
          });
        } catch {}

        loadedProfile = newRecord;
      }

      // Merge admin-controlled progress, feedback, badges, picture, and locked fees
      if (matchedAdminStudent) {
        loadedProfile = {
          ...loadedProfile,
          ...matchedAdminStudent,
          first_name: spData?.first_name || matchedAdminStudent.first_name || loadedProfile.first_name,
          last_name: spData?.last_name || matchedAdminStudent.last_name || loadedProfile.last_name,
          avatar_url: spData?.avatar_url || matchedAdminStudent.avatar_url || (user.user_metadata?.avatar_url as string) || '',
          monthly_fee: spData?.monthly_fee !== undefined && spData.monthly_fee !== null ? Number(spData.monthly_fee) : (matchedAdminStudent.monthly_fee ?? loadedProfile.monthly_fee),
          fee_status: spData?.fee_status || matchedAdminStudent.fee_status || loadedProfile.fee_status,
          fee_due_date: spData?.fee_due_date || matchedAdminStudent.fee_due_date || loadedProfile.fee_due_date,
          class_schedule: spData?.class_schedule || matchedAdminStudent.class_schedule || loadedProfile.class_schedule,
          curriculum: spData?.curriculum || matchedAdminStudent.curriculum || loadedProfile.curriculum,
          preferred_schedule: spData?.preferred_schedule || matchedAdminStudent.preferred_schedule || loadedProfile.preferred_schedule,
          addons: (spData?.addons && spData.addons.length > 0) ? spData.addons : (matchedAdminStudent.addons || loadedProfile.addons || []),
          module_progress: (spData?.module_progress && Object.keys(spData.module_progress).length > 0)
            ? spData.module_progress
            : (matchedAdminStudent.module_progress || {}),
          overall_progress_pct: spData?.overall_progress_pct !== undefined
            ? spData.overall_progress_pct
            : (matchedAdminStudent.overall_progress_pct ?? 0),
          instructor_feedback: spData?.instructor_feedback || matchedAdminStudent.instructor_feedback || '',
          milestone_badges: (spData?.milestone_badges && spData.milestone_badges.length > 0)
            ? spData.milestone_badges
            : (matchedAdminStudent.milestone_badges || []),
          bio: spData?.bio || matchedAdminStudent.bio || (user.user_metadata?.bio as string) || '',
          emergency_contact: spData?.emergency_contact || matchedAdminStudent.emergency_contact || (user.user_metadata?.emergency_contact as string) || '',
          emergency_phone: spData?.emergency_phone || matchedAdminStudent.emergency_phone || (user.user_metadata?.emergency_phone as string) || '',
        };
      } else if (user.user_metadata?.avatar_url && !loadedProfile.avatar_url) {
        loadedProfile.avatar_url = user.user_metadata.avatar_url as string;
      }

      setStudent(loadedProfile);

      // Set module progress controlled by admin
      let resolvedProgress: Record<string, 'not_started' | 'in_progress' | 'mastered'> = {};
      if (loadedProfile.module_progress && Object.keys(loadedProfile.module_progress).length > 0) {
        resolvedProgress = loadedProfile.module_progress;
      }
      setModuleProgress(resolvedProgress);

      // 4. Load Student's Fee Payments (from Supabase fee_payments + local cache)
      const allPayments = loadStoredFeePayments();
      const myFilteredPayments = allPayments.filter(
        (p) => p.student_email && p.student_email.toLowerCase() === email.toLowerCase()
      );
      fetchFeePayments().then((remoteAll) => {
        const studentRemote = remoteAll.filter(
          (p) => p.student_email && p.student_email.toLowerCase() === email.toLowerCase()
        );
        if (studentRemote.length > 0) {
          setMyPayments((prev) => {
            const map = new Map<string, FeePaymentRecord>();
            studentRemote.forEach((r) => map.set(r.payment_reference, r));
            prev.forEach((r) => { if (!map.has(r.payment_reference)) map.set(r.payment_reference, r); });
            return Array.from(map.values());
          });
        }
      }).catch(() => {});

      // Also check Supabase payments table
      try {
        const { data: dbPayments } = await supabaseAdmin
          .from('payments')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (dbPayments && dbPayments.length > 0) {
          // Merge db payments into myFilteredPayments if not already present
          const existingRefs = new Set(myFilteredPayments.map((p) => p.payment_reference || p.id));
          for (const dbp of dbPayments) {
            if (!existingRefs.has(dbp.id)) {
              myFilteredPayments.push({
                id: dbp.id,
                timestamp: dbp.created_at || new Date().toISOString(),
                payment_reference: dbp.id.slice(0, 10).toUpperCase(),
                payment_status: dbp.status === 'verified' ? 'VERIFIED' : dbp.status === 'rejected' ? 'REJECTED' : 'PENDING VERIFICATION',
                utr: 'UPI/DIRECT',
                payer_name: loadedProfile.first_name + ' ' + loadedProfile.last_name,
                student_name: loadedProfile.first_name + ' ' + loadedProfile.last_name,
                student_email: email,
                phone: loadedProfile.phone_number || '',
                curriculum: loadedProfile.curriculum || 'Guitar',
                class_type: loadedProfile.class_schedule || 'Tuition Plan',
                addons: '',
                amount: Number(dbp.amount),
                notes: dbp.billing_period ? `Billing cycle: ${dbp.billing_period}` : 'Tuition payment',
              });
            }
          }
        }
      } catch {}

      setMyPayments(myFilteredPayments);

      // 5. Load Student Requests from Supabase
      const { data: reqs } = await supabaseAdmin
        .from('student_requests')
        .select('*')
        .or(`student_id.eq.${user.id},student_email.eq.${email}`)
        .order('created_at', { ascending: false });
      if (reqs) setMyRequests(reqs);

    } catch (err) {
      console.error('Error fetching dynamic student portal data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchStudentData();

    // 1. Subscribe to real-time sync events from admin and other tabs
    const unsubscribe = subscribeToSync((event) => {
      if (['all', 'students', 'payments', 'requests', 'catalogs'].includes(event.entity)) {
        void fetchStudentData();
      }
    });

    // 2. Refetch when tab becomes active or gains focus
    const onFocus = () => void fetchStudentData();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchStudentData();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // 3. Periodic fallback poll every 8 seconds
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchStudentData();
      }
    }, 8000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [fetchStudentData]);

  // Dynamic calculations for Tuition Fees
  const dynamicFeeSummary = useMemo(() => {
    if (!student) {
      return { basePlanName: 'Home Visit', baseAmount: 1500, addonAmount: 0, totalAmount: 1500, activeAddons: [] };
    }

    // Match plan from feePlans
    const planText = (student.class_schedule || '').toLowerCase();
    const matchedPlan = feePlans.find(
      (p) => planText.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(planText)
    );

    const baseAmount = matchedPlan ? Number(matchedPlan.amount) : (feePlans[0]?.amount || 1500);
    const basePlanName = matchedPlan ? matchedPlan.name : (student.class_schedule || 'Tuition Plan');

    // Match addons from addOnsList
    let addonAmount = 0;
    const activeAddons: AddOn[] = [];
    if (student.addons && Array.isArray(student.addons)) {
      student.addons.forEach((addonStr) => {
        const found = addOnsList.find((a) => a.name.toLowerCase() === addonStr.toLowerCase());
        if (found) {
          addonAmount += Number(found.amount);
          activeAddons.push(found);
        } else if (addonStr.includes('500')) {
          addonAmount += 500;
        }
      });
    }

    const totalAmount = baseAmount + addonAmount;

    return {
      basePlanName,
      baseAmount,
      addonAmount,
      totalAmount,
      activeAddons,
    };
  }, [student, feePlans, addOnsList]);

  // Next Upcoming Lesson calculation based on student schedule
  const upcomingLesson = useMemo(() => {
    const slotStr = student?.preferred_schedule || (scheduleList[0] ? `${scheduleList[0].day_label} — ${scheduleList[0].time_label}` : 'Friday — 8:00 PM');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const slotLower = slotStr.toLowerCase();

    let targetDayIndex = -1;
    for (let i = 0; i < dayNames.length; i++) {
      if (slotLower.includes(dayNames[i])) {
        targetDayIndex = i;
        break;
      }
    }

    if (targetDayIndex === -1) {
      return { label: slotStr, countdownText: 'Weekly Session' };
    }

    const currentDay = currentDate.getDay();
    let daysUntil = (targetDayIndex - currentDay + 7) % 7;
    if (daysUntil === 0) daysUntil = 7; // next week's session if today is already passed

    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + daysUntil);

    const dateFormatted = nextDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const countdownText = daysUntil === 1 ? 'Tomorrow' : daysUntil === 0 ? 'Today' : `In ${daysUntil} days`;

    return {
      label: slotStr,
      dateFormatted,
      countdownText,
    };
  }, [student?.preferred_schedule, scheduleList, currentDate]);

  // Handle syllabus progress toggle
  const handleToggleModuleProgress = (moduleId: string) => {
    if (!user) return;
    setModuleProgress((prev) => {
      const current = prev[moduleId] || 'not_started';
      const next: 'not_started' | 'in_progress' | 'mastered' =
        current === 'not_started' ? 'in_progress' : current === 'in_progress' ? 'mastered' : 'not_started';
      const updated: Record<string, 'not_started' | 'in_progress' | 'mastered'> = { ...prev, [moduleId]: next };
      try {
        localStorage.setItem(`tfs_progress_${user.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const displayName = useMemo(() => {
    if (student?.first_name || student?.last_name) {
      return `${student.first_name} ${student.last_name}`.trim();
    }
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  }, [student, user]);

  const studentIdBadge = useMemo(() => {
    if (student?.admission_id) return student.admission_id;
    const rawId = (student?.id || user?.id || 'TFS001').replace(/-/g, '').slice(0, 6).toUpperCase();
    return `TFS-STU-${rawId}`;
  }, [student, user]);

  const tabs: { id: StudentTab; label: string; icon: any }[] = [
    { id: 'home', label: 'Overview', icon: BookOpen },
    { id: 'idcard', label: 'Student ID Card', icon: IdCard },
    { id: 'profile', label: 'Edit Profile & Account', icon: UserRound },
    { id: 'payments', label: 'Tuition & Fees', icon: CircleDollarSign },
    { id: 'modules', label: 'Curriculum & Schedule', icon: CalendarDays },
    { id: 'requests', label: 'Helpdesk & Requests', icon: MessageSquare },
    { id: 'ai', label: 'AI Music Tutor', icon: Bot },
  ];

  return (
    <div className="student-shell animate-fade-in">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`student-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="student-brand">
          <Guitar size={24} style={{ color: 'var(--gold)' }} />
          <div>
            TFS <span>STUDENT CORNER</span>
          </div>
        </div>
        <p className="student-kicker">Mastery Portal</p>
        <nav className="student-nav">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? 'student-nav-item active' : 'student-nav-item'}
              onClick={() => {
                setTab(id);
                setMobileMenuOpen(false);
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button className="student-signout" onClick={signOut}>
          <LogOut size={17} /> Sign out
        </button>
      </aside>

      {/* Main Container */}
      <main className="student-main">
        {/* Header */}
        <header className="student-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <p className="student-kicker">Mastery Dashboard</p>
              <h1>{displayName}</h1>
              <p className="student-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span className="booking-badge" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', fontWeight: 600 }}>
                  {studentIdBadge}
                </span>
                <span>• Track: <b style={{ color: '#fff' }}>{student?.curriculum || 'Guitar'}</b></span>
                <span>• Plan: <b style={{ color: 'var(--gold)' }}>{dynamicFeeSummary.basePlanName}</b></span>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="student-text-button"
              onClick={() => void fetchStudentData()}
              title="Sync live student data"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', background: 'rgba(212,175,55,0.1)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.25)' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Database
            </button>
            <div className="student-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="portal-avatar-wrap" style={{ width: '32px', height: '32px' }}>
                {student?.avatar_url ? (
                  <img src={student.avatar_url} alt={displayName} className="portal-avatar-img" />
                ) : (
                  <div className="portal-avatar-initials" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                    {(student?.first_name || user?.email || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </span>
            </div>
            <button
              type="button"
              className="portal-btn-secondary"
              onClick={signOut}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </header>

        {notice && (
          <div className="student-notice animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(40,167,69,0.15)', border: '1px solid rgba(40,167,69,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#5dd37a' }}>
            <Check size={18} />
            {notice}
          </div>
        )}
        {error && (
          <div className="student-notice animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(220,53,69,0.15)', border: '1px solid rgba(220,53,69,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#ff6b6b' }}>
            <X size={18} />
            {error}
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {tab === 'home' && (
          <OverviewTab
            student={student}
            displayName={displayName}
            studentIdBadge={studentIdBadge}
            curriculumList={curriculumList}
            dynamicFeeSummary={dynamicFeeSummary}
            upcomingLesson={upcomingLesson}
            moduleProgress={moduleProgress}
            onNavigate={setTab}
            onOpenPayModal={() => setShowPayModal(true)}
          />
        )}

        {/* 2. STUDENT ID CARD TAB */}
        {tab === 'idcard' && (
          <StudentIdCardTab
            student={student}
            displayName={displayName}
            studentIdBadge={studentIdBadge}
            dynamicFeeSummary={dynamicFeeSummary}
            onOpenEditModal={() => setShowEditCardModal(true)}
          />
        )}

        {/* 3. EDIT PROFILE & ACCOUNT TAB */}
        {tab === 'profile' && student && (
          <ProfileEditTab
            student={student}
            feePlans={feePlans}
            addOnsList={addOnsList}
            scheduleList={scheduleList}
            curriculumList={curriculumList}
            onNavigateToRequests={() => setTab('requests')}
            onSaveProfile={async (updates) => {
              try {
                const saved = await updateStudentSelfProfile(student.id, student.email, updates);
                setStudent(saved);
                notify('Your profile and picture have been updated and synchronized with Supabase.');
              } catch {
                fail('Failed to update profile. Please try again.');
              }
            }}
          />
        )}

        {/* 4. TUITION & PAYMENTS TAB (Locked to Profile Data, Request Only) */}
        {tab === 'payments' && (
          <TuitionPaymentsTab
            student={student}
            dynamicFeeSummary={dynamicFeeSummary}
            feePlans={feePlans}
            addOnsList={addOnsList}
            discountsList={discountsList}
            payments={myPayments}
            onOpenPayModal={() => setShowPayModal(true)}
            onNavigateToRequests={() => setTab('requests')}
          />
        )}

        {/* 5. CURRICULUM & MODULES TAB */}
        {tab === 'modules' && (
          <ModulesScheduleTab
            student={student}
            curriculumList={curriculumList}
            scheduleList={scheduleList}
            moduleProgress={moduleProgress}
            onToggleProgress={handleToggleModuleProgress}
            onRequestReschedule={() => setTab('requests')}
          />
        )}

        {/* 6. HELPDESK & REQUESTS TAB */}
        {/* 7. AI MUSIC TUTOR TAB */}
        {tab === 'ai' && (
          <AiChatTab
            student={student}
            displayName={displayName}
          />
        )}

        {tab === 'requests' && user && (
          <RequestsTab
            user={user}
            displayName={displayName}
            student={student}
            scheduleList={scheduleList}
            feePlans={feePlans}
            requests={myRequests}
            onRequestSent={(newReq) => {
              setMyRequests([newReq, ...myRequests]);
              broadcastSync('requests', 'insert', newReq.id);
              notify('Your request has been submitted to your TFS instructor.');
            }}
          />
        )}
      </main>

      {/* Pay Tuition Modal */}
      {showPayModal && student && (
        <PayTuitionModal
          student={student}
          dynamicFeeSummary={dynamicFeeSummary}
          onClose={() => setShowPayModal(false)}
          onSubmitPayment={async (payload) => {
            const res = await recordStudentPayment({
              student_id: student.id,
              amount: payload.amount,
              billing_period: 'monthly',
              utr: payload.utr,
              payer_name: payload.payer_name,
              student_name: `${student.first_name} ${student.last_name}`.trim(),
              student_email: student.email,
              phone: student.phone_number || '',
              curriculum: student.curriculum || 'Guitar',
              class_type: dynamicFeeSummary.basePlanName,
              addons: dynamicFeeSummary.activeAddons.map((a) => a.name).join(', ') || 'None',
              notes: payload.notes,
            });

            if (res.success) {
              const newRecord: FeePaymentRecord = {
                id: res.id || `fee-${Date.now()}`,
                timestamp: new Date().toISOString(),
                payment_reference: `TFSFEE${Date.now()}`,
                payment_status: 'PENDING VERIFICATION',
                utr: payload.utr,
                payer_name: payload.payer_name,
                student_name: `${student.first_name} ${student.last_name}`.trim(),
                student_email: student.email,
                phone: student.phone_number || '',
                curriculum: student.curriculum || 'Guitar',
                class_type: dynamicFeeSummary.basePlanName,
                addons: dynamicFeeSummary.activeAddons.map((a) => a.name).join(', ') || 'None',
                amount: payload.amount,
                notes: payload.notes,
              };
              setMyPayments([newRecord, ...myPayments]);
              setShowPayModal(false);
              notify('Payment UTR recorded in Supabase! TFS instructor will verify your reference.');
            } else {
              fail('Unable to record payment. Please check your connection.');
            }
          }}
        />
      )}

      {/* Edit ID Card Modal */}
      {showEditCardModal && student && (
        <EditIdCardModal
          student={student}
          onClose={() => setShowEditCardModal(false)}
          onSave={async (updates) => {
            const saved = await updateStudentSelfProfile(student.id, student.email, updates);
            setStudent(saved);
            setShowEditCardModal(false);
            notify('Student pass details updated successfully in database.');
          }}
        />
      )}
    </div>
  );
};

// =========================================================================
// 1. OVERVIEW TAB
// =========================================================================
const OverviewTab = ({
  student,
  displayName,
  studentIdBadge,
  curriculumList,
  dynamicFeeSummary,
  upcomingLesson,
  moduleProgress,
  onNavigate,
  onOpenPayModal,
}: {
  student: StudentProfile | null;
  displayName: string;
  studentIdBadge: string;
  curriculumList: CurriculumItem[];
  dynamicFeeSummary: {
    basePlanName: string;
    baseAmount: number;
    addonAmount: number;
    totalAmount: number;
    activeAddons: AddOn[];
  };
  upcomingLesson: {
    label: string;
    dateFormatted?: string;
    countdownText: string;
  };
  moduleProgress: Record<string, string>;
  onNavigate: (tab: StudentTab) => void;
  onOpenPayModal: () => void;
}) => {
  const track = student?.curriculum || 'Guitar';

  // Find relevant modules for student's instrument
  const relevantModules = useMemo(() => {
    const trackLower = track.toLowerCase();
    const inst = trackLower.includes('dotara')
      ? 'ukulele_dotara'
      : trackLower.includes('ukulele')
        ? 'ukulele_standard'
        : 'guitar';
    return curriculumList.filter((c) => c.instrument === inst && c.active !== false);
  }, [track, curriculumList]);

  // Compute mastery stats
  const completedCount = useMemo(() => {
    return relevantModules.filter((m) => moduleProgress[m.id] === 'mastered').length;
  }, [relevantModules, moduleProgress]);

  const masteryPercent = relevantModules.length > 0 ? Math.round((completedCount / relevantModules.length) * 100) : 0;

  return (
    <>
      <section className="student-hero">
        <div>
          <p className="student-kicker">Active Scholar • {displayName}</p>
          <h2>{track} Enrolment</h2>
          <p style={{ maxWidth: '640px', lineHeight: '1.6' }}>
            Registered in <b>{dynamicFeeSummary.basePlanName}</b> (₹{dynamicFeeSummary.totalAmount.toLocaleString('en-IN')}/mo). 
            Structured one-to-one guitar &amp; ukulele lessons crafted for fluent musical expression.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <span className="student-plan-status" style={{ background: '#5dd37a22', color: '#5dd37a', border: '1px solid #5dd37a55' }}>
            ● Verified Enrolment
          </span>
          <small style={{ color: 'var(--gold)', fontFamily: 'monospace', fontWeight: 600 }}>{studentIdBadge}</small>
        </div>
      </section>

      {/* Dynamic Stat Grid */}
      <section className="student-stat-grid">
        <div className="student-stat">
          <Clock3 size={20} style={{ color: 'var(--gold)' }} />
          <span>Scheduled Batch Slot</span>
          <strong style={{ fontSize: '1.15rem' }}>{student?.preferred_schedule || upcomingLesson.label}</strong>
          <small style={{ color: '#5dd37a', fontWeight: 600 }}>
            {upcomingLesson.countdownText} {upcomingLesson.dateFormatted ? `(${upcomingLesson.dateFormatted})` : ''}
          </small>
        </div>
        <div className="student-stat">
          <CircleDollarSign size={20} style={{ color: 'var(--gold)' }} />
          <span>Tuition Plan &amp; Fee</span>
          <strong>₹{dynamicFeeSummary.totalAmount.toLocaleString('en-IN')}/mo</strong>
          <small style={{ color: '#5dd37a' }}>
            {dynamicFeeSummary.addonAmount > 0 ? `Includes ₹${dynamicFeeSummary.addonAmount} add-ons • ` : ''}
            Status: {student?.fee_status || 'Up to date'}
          </small>
        </div>
        <div className="student-stat">
          <Award size={20} style={{ color: 'var(--gold)' }} />
          <span>Curriculum Mastery</span>
          <strong>{completedCount} / {relevantModules.length} Modules</strong>
          <small style={{ color: 'var(--gold)' }}>{masteryPercent}% Syllabus Completed</small>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="student-grid-two">
        {/* Dynamic Syllabus Roadmap */}
        <section className="student-panel">
          <div className="student-panel-heading">
            <div>
              <p className="student-kicker">Live Syllabus Roadmap</p>
              <h3>{track} Learning Modules</h3>
            </div>
            <button className="student-text-button" onClick={() => onNavigate('modules')}>
              All modules <ChevronRight size={15} />
            </button>
          </div>

          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {relevantModules.length === 0 ? (
              <p className="student-muted">Modules are synchronized directly from Supabase.</p>
            ) : (
              relevantModules.slice(0, 4).map((mod, i) => {
                const status = moduleProgress[mod.id] || 'not_started';
                return (
                  <div
                    key={mod.id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                      padding: '0.9rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: status === 'mastered' ? 'rgba(93,211,122,0.2)' : 'rgba(212,175,55,0.15)',
                          color: status === 'mastered' ? '#5dd37a' : 'var(--gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        {status === 'mastered' ? <Check size={16} /> : i + 1}
                      </div>
                      <div>
                        <b style={{ color: '#fff', fontSize: '0.95rem' }}>{mod.title}</b>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {mod.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className="booking-badge"
                      style={{
                        flexShrink: 0,
                        background:
                          status === 'mastered'
                            ? 'rgba(93,211,122,0.15)'
                            : status === 'in_progress'
                              ? 'rgba(212,175,55,0.15)'
                              : 'rgba(255,255,255,0.05)',
                        color:
                          status === 'mastered'
                            ? '#5dd37a'
                            : status === 'in_progress'
                              ? 'var(--gold)'
                              : 'var(--text-secondary)',
                      }}
                    >
                      {status === 'mastered' ? 'Mastered' : status === 'in_progress' ? 'Learning' : 'Upcoming'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Quick Actions Panel */}
        <section className="student-panel student-notes">
          <p className="student-kicker">Interactive Actions</p>
          <h3>Student Portal Hub</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
            Manage tuition payments, download your official verified student ID pass, or send rescheduling inquiries directly to your teacher.
          </p>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            <button className="student-action" onClick={() => onNavigate('idcard')}>
              <IdCard size={16} /> Official Student Pass &amp; ID Card
            </button>
            <button className="student-action" onClick={onOpenPayModal}>
              <CircleDollarSign size={16} /> Pay Monthly Tuition Fee Online
            </button>
            <button className="student-action" onClick={() => onNavigate('payments')}>
              <Percent size={16} /> Fee Breakdown &amp; Apply Coupon
            </button>
            <button className="student-action" onClick={() => onNavigate('profile')}>
              <Edit3 size={16} /> Update Schedule Slot &amp; Profile Details
            </button>
            <button className="student-action" onClick={() => onNavigate('requests')}>
              <MessageSquare size={16} /> Send Query / Reschedule Request
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

// =========================================================================
// 2. STUDENT ID CARD TAB
// =========================================================================
const StudentIdCardTab = ({
  student,
  displayName,
  studentIdBadge,
  dynamicFeeSummary,
  onOpenEditModal,
}: {
  student: StudentProfile | null;
  displayName: string;
  studentIdBadge: string;
  dynamicFeeSummary: { basePlanName: string; totalAmount: number };
  onOpenEditModal: () => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Helper to load image for canvas
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load: ' + src));
      img.src = src;
    });

  // High-Res 1200x750 PNG Export with TFS Logo & Official Verified Signature
  const handleDownloadCard = async () => {
    setDownloading(true);
    try {
      const [logoImg, signImg, avatarImg] = await Promise.all([
        loadImage('/images/logo_t.png').catch(() => null),
        loadImage('/images/sign.png').catch(() => null),
        student?.avatar_url ? loadImage(student.avatar_url).catch(() => null) : Promise.resolve(null),
      ]);

      const canvas = document.createElement('canvas');
      const w = 1200;
      const h = 750;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setDownloading(false);
        return;
      }

      // Deep dark luxury background
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f1116');
      grad.addColorStop(0.5, '#171922');
      grad.addColorStop(1, '#0b0c0f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Gold Outer Borders
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#d4af37';
      ctx.strokeRect(20, 20, w - 40, h - 40);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.strokeRect(36, 36, w - 72, h - 72);

      // Header Bar
      ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.fillRect(40, 40, w - 80, 115);

      let headerStartX = 70;
      if (logoImg) {
        ctx.drawImage(logoImg, 60, 48, 92, 92);
        headerStartX = 175;
      }

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
      ctx.fillText('THE FRETBOARD SOCIETY', headerStartX, 98);

      ctx.fillStyle = '#9e9fa5';
      ctx.font = '600 17px "Inter", sans-serif';
      ctx.fillText('ACOUSTIC GUITAR & UKULELE MASTERY • OFFICIAL SCHOLAR PASS', headerStartX, 134);

      // Verified Badge on Right
      ctx.fillStyle = '#5dd37a';
      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('● VERIFIED SCHOLAR', w - 70, 95);

      ctx.fillStyle = '#d4af37';
      ctx.font = '600 22px monospace';
      ctx.fillText(studentIdBadge, w - 70, 130);
      ctx.textAlign = 'left';

      // Divider
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 155);
      ctx.lineTo(w - 40, 155);
      ctx.stroke();

      // Left Photo Box
      ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.fillRect(70, 185, 280, 360);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#d4af37';
      ctx.strokeRect(70, 185, 280, 360);

      if (avatarImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(74, 189, 272, 352);
        ctx.clip();
        ctx.drawImage(avatarImg, 74, 189, 272, 352);
        ctx.restore();
      } else {
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 80px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎸', 210, 375);

        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillText('TFS SCHOLAR', 210, 460);

        ctx.font = '14px "Inter", sans-serif';
        ctx.fillStyle = '#9e9fa5';
        ctx.fillText('★ ★ ★ ★ ★', 210, 495);
        ctx.textAlign = 'left';
      }

      // Right Details
      const startX = 390;
      let curY = 215;

      const drawField = (label: string, value: string, color = '#ffffff') => {
        ctx.fillStyle = '#9e9fa5';
        ctx.font = '600 17px "Inter", sans-serif';
        ctx.fillText(label.toUpperCase(), startX, curY);

        ctx.fillStyle = color;
        ctx.font = 'bold 26px "Inter", sans-serif';
        ctx.fillText(value, startX, curY + 34);

        // subtle underline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, curY + 44);
        ctx.lineTo(w - 70, curY + 44);
        ctx.stroke();

        curY += 76;
      };

      drawField('Full Student Name', displayName, '#ffffff');
      drawField('Curriculum / Track', student?.curriculum || 'Acoustic Guitar', '#d4af37');
      drawField('Enrolled Tuition Plan', `${dynamicFeeSummary.basePlanName} — ₹${dynamicFeeSummary.totalAmount}/mo`, '#ffffff');
      drawField('Batch Schedule Slot', student?.preferred_schedule || 'Weekend Scheduled Slot', '#5dd37a');

      // Footer Divider
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 580);
      ctx.lineTo(w - 40, 580);
      ctx.stroke();

      // Footer Left - Metadata
      ctx.fillStyle = '#9e9fa5';
      ctx.font = '15px "Inter", sans-serif';
      ctx.fillText(`Date of Issue: ${new Date(student?.created_at || Date.now()).toLocaleDateString('en-IN')}  •  Valid Academic Year 2026-2027`, 65, 618);
      ctx.fillText('Issued by The Fretboard Society Academy • Kolkata, India', 65, 646);
      ctx.fillStyle = '#d4af37';
      ctx.fillText(`Scholar Contact: ${student?.phone_number || student?.email || 'Academy Member'}`, 65, 674);

      // Barcode at bottom-left
      ctx.fillStyle = '#ffffff';
      let barcodeX = 65;
      const barcodeWidths = [3, 6, 2, 8, 4, 2, 7, 3, 5, 2, 6, 4, 8, 2, 5, 3, 7, 4, 3, 6, 2, 8, 3, 5, 2, 6, 4, 7, 2, 5];
      for (const bw of barcodeWidths) {
        ctx.fillRect(barcodeX, 695, bw, 20);
        barcodeX += bw + 3;
      }

      // Footer Right - Verified Signature Box
      const sigBoxW = 340;
      const sigBoxH = 125;
      const sigBoxX = w - 400;
      const sigBoxY = 595;

      ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
      ctx.fillRect(sigBoxX, sigBoxY, sigBoxW, sigBoxH);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.strokeRect(sigBoxX, sigBoxY, sigBoxW, sigBoxH);
      ctx.setLineDash([]); // Reset dash

      if (signImg) {
        ctx.drawImage(signImg, sigBoxX + (sigBoxW - 170) / 2, sigBoxY + 8, 170, 50);
      }

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sigBoxX + 20, sigBoxY + 66);
      ctx.lineTo(sigBoxX + sigBoxW - 20, sigBoxY + 66);
      ctx.stroke();

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 15px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sankha Subhra Ghosh', sigBoxX + sigBoxW / 2, sigBoxY + 85);

      ctx.fillStyle = '#9e9fa5';
      ctx.font = '12px "Inter", sans-serif';
      ctx.fillText('Founder & Lead Instructor • TFS', sigBoxX + sigBoxW / 2, sigBoxY + 101);

      ctx.fillStyle = '#5dd37a';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillText('OFFICIALLY VERIFIED SIGNATURE', sigBoxX + sigBoxW / 2, sigBoxY + 116);
      ctx.textAlign = 'left';

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `TFS-StudentID-${displayName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p className="student-kicker">Digital Identification</p>
          <h2>Official Student ID Pass</h2>
          <p className="student-muted">Your verified pass for classes, studio workshops, and rehearsal sessions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="admission-secondary" onClick={onOpenEditModal}>
            <Edit3 size={16} /> Edit Pass Details
          </button>
          <button className="admin-save" onClick={handleDownloadCard} disabled={downloading} style={{ margin: 0 }}>
            <Download size={16} /> {downloading ? 'Generating...' : 'Download Card (PNG)'}
          </button>
          <button
            className="admin-save"
            style={{ margin: 0, background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold)', color: 'var(--gold)' }}
            onClick={async () => {
              await generateStudentIdCardPdf(student, displayName, studentIdBadge, dynamicFeeSummary);
            }}
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Interactive Card */}
      <div
        ref={cardRef}
        style={{
          background: 'linear-gradient(135deg, #111319 0%, #1a1d26 50%, #0c0d11 100%)',
          borderRadius: '20px',
          border: '2px solid var(--gold)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(212,175,55,0.3)',
          padding: 'clamp(1.25rem, 3.5vw, 2.5rem)',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ position: 'absolute', right: '-30px', bottom: '-40px', opacity: 0.05, pointerEvents: 'none' }}>
          <Guitar size={320} />
        </div>

        {/* Card Header with Official TFS Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.3)', paddingBottom: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(212,175,55,0.12)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', flexShrink: 0 }}>
              <img
                src="/images/logo_t.png"
                alt="The Fretboard Society Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))' }}
              />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--gold)', letterSpacing: '0.08em', fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontWeight: 800 }}>
                THE FRETBOARD SOCIETY
              </h3>
              <small style={{ color: 'var(--text-secondary)', letterSpacing: '0.12em', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginTop: '0.15rem' }}>
                Acoustic Guitar &amp; Ukulele Academy
              </small>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="booking-badge" style={{ background: '#5dd37a22', color: '#5dd37a', border: '1px solid #5dd37a55', display: 'inline-block', marginBottom: '0.25rem' }}>
              ● Verified Scholar
            </span>
            <div style={{ color: 'var(--gold)', fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700 }}>
              {studentIdBadge}
            </div>
          </div>
        </div>

        {/* Card Body with Responsive Grid (No Overflows) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'clamp(1.25rem, 3vw, 2rem)', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '190px', width: '100%', margin: '0 auto' }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1.15',
                borderRadius: '14px',
                background: 'linear-gradient(145deg, #1a1c24, #0e1015)',
                border: '2px solid rgba(212,175,55,0.6)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--gold)',
                overflow: 'hidden',
              }}
            >
              {student?.avatar_url ? (
                <img
                  src={student.avatar_url}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <>
                  <Music size={44} />
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', fontWeight: 700, color: 'var(--gold)' }}>
                    TFS SCHOLAR
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
                    ★ ★ ★ ★ ★
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem', flex: 1 }}>
            <div>
              <p style={{ margin: '0 0 0.2rem', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Student Name
              </p>
              <b style={{ color: '#fff', fontSize: '1.2rem', display: 'block' }}>{displayName}</b>
            </div>

            <div>
              <p style={{ margin: '0 0 0.2rem', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Curriculum Track
              </p>
              <b style={{ color: 'var(--gold)', fontSize: '1.1rem', display: 'block' }}>{student?.curriculum || 'Guitar'}</b>
            </div>

            <div>
              <p style={{ margin: '0 0 0.2rem', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Tuition Plan
              </p>
              <b style={{ color: '#fff', fontSize: '0.92rem', display: 'block' }}>{dynamicFeeSummary.basePlanName}</b>
            </div>

            <div>
              <p style={{ margin: '0 0 0.2rem', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Schedule Window
              </p>
              <b style={{ color: '#5dd37a', fontSize: '0.92rem', display: 'block' }}>{student?.preferred_schedule || 'Weekend Session'}</b>
            </div>
          </div>
        </div>

        {/* Card Footer with Verified Director Signature */}
        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <small style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>
              Academic Year 2026–2027 • The Fretboard Society Academy
            </small>
            <small style={{ color: 'var(--gold)', fontSize: '0.72rem' }}>
              Contact: {student?.phone_number || student?.email}
            </small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Official Director Signature Stamp Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(212, 175, 55, 0.05)',
                border: '1px dashed rgba(212, 175, 55, 0.45)',
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                minWidth: '155px',
              }}
            >
              <img
                src="/images/sign.png"
                alt="Director's Signature"
                style={{
                  height: '36px',
                  maxWidth: '130px',
                  objectFit: 'contain',
                  filter: 'invert(1) brightness(1.7) contrast(1.15) drop-shadow(0 0 2px rgba(212,175,55,0.5))',
                }}
              />
              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.4)', width: '100%', marginTop: '0.15rem', paddingTop: '0.2rem', textAlign: 'center' }}>
                <span style={{ color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', display: 'block' }}>
                  Sankha Subhra Ghosh
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.58rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Authorized Signatory • Director
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
              <QrCode size={36} style={{ color: 'var(--gold)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. EDIT PROFILE & ACCOUNT TAB (With Picture Upload & Locked Tuition Plan)
// =========================================================================
const ProfileEditTab = ({
  student,
  feePlans,
  scheduleList,
  curriculumList,
  onNavigateToRequests,
  onSaveProfile,
}: {
  student: StudentProfile;
  feePlans: FeePlan[];
  addOnsList?: AddOn[];
  scheduleList: ScheduleItem[];
  curriculumList: CurriculumItem[];
  onNavigateToRequests?: () => void;
  onSaveProfile: (updates: Partial<StudentProfile>) => Promise<void>;
}) => {
  const [firstName, setFirstName] = useState(student.first_name || '');
  const [lastName, setLastName] = useState(student.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(student.phone_number || '');
  const [profession, setProfession] = useState(student.profession || '');
  const [address, setAddress] = useState(student.address || '');
  const [bio, setBio] = useState(student.bio || '');
  const [emergencyContact, setEmergencyContact] = useState(student.emergency_contact || '');
  const [emergencyPhone, setEmergencyPhone] = useState(student.emergency_phone || '');
  const [avatarUrl, setAvatarUrl] = useState(student.avatar_url || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Dynamic track options from curriculumList
  const dynamicTracks = useMemo(() => {
    const raw = ['Guitar', 'Ukulele (Standard)', 'Ukulele (Dotara)'];
    curriculumList.forEach((c) => {
      if (c.instrument === 'guitar' && !raw.includes('Guitar')) raw.push('Guitar');
      if (c.instrument === 'ukulele_standard' && !raw.includes('Ukulele (Standard)')) raw.push('Ukulele (Standard)');
      if (c.instrument === 'ukulele_dotara' && !raw.includes('Ukulele (Dotara)')) raw.push('Ukulele (Dotara)');
    });
    return raw;
  }, [curriculumList]);

  const [curriculum, setCurriculum] = useState(student.curriculum || 'Guitar');
  const classSchedule = student.class_schedule || (feePlans[0] ? `${feePlans[0].name} — ₹${feePlans[0].amount}/month` : 'Home Visit — ₹1,500/month');
  const [preferredSchedule, setPreferredSchedule] = useState(
    student.preferred_schedule || (scheduleList[0] ? `${scheduleList[0].day_label} — ${scheduleList[0].time_label}` : 'Friday — 8:00 PM – 11:00 PM')
  );

  const [saving, setSaving] = useState(false);

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const bucketUrl = await uploadImageToBucket(file, 'students');
      setAvatarUrl(bucketUrl);
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSaveProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim(),
      profession: profession.trim(),
      address: address.trim(),
      bio: bio.trim(),
      emergency_contact: emergencyContact.trim(),
      emergency_phone: emergencyPhone.trim(),
      avatar_url: avatarUrl,
      curriculum,
      preferred_schedule: preferredSchedule,
    });
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <section className="student-panel">
        <div className="student-panel-heading">
          <div>
            <p className="student-kicker">Account Information</p>
            <h2>Edit Student Profile</h2>
          </div>
          <UserRound size={22} style={{ color: 'var(--gold)' }} />
        </div>
        <p className="student-muted" style={{ marginBottom: '1.75rem' }}>
          Personal details, photo, and preferences update instantly in your database record.
        </p>

        {/* Profile Picture Upload Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(212,175,55,0.06)',
            border: '1px solid rgba(212,175,55,0.25)',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div className="portal-avatar-wrap" style={{ width: '84px', height: '84px' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="portal-avatar-img" />
            ) : (
              <div className="portal-avatar-initials" style={{ width: '84px', height: '84px', fontSize: '2rem' }}>
                {(firstName || student.first_name || 'S').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ flex: '1 1 240px' }}>
            <b style={{ color: '#fff', fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>
              Student Profile Picture &amp; Pass Photo
            </b>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>
              Your photo is displayed on your Official Student Pass, header, and instructor portfolio.
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="portal-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Camera size={15} /> {uploadingPhoto ? 'Processing...' : avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  className="portal-btn-secondary"
                  onClick={() => setAvatarUrl('')}
                  style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', color: '#ff6b6b', borderColor: 'rgba(220,53,69,0.3)' }}
                >
                  <X size={14} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            First Name *
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Last Name *
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Registered Email Address (Locked)
            <input
              disabled
              value={student.email}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: 'var(--text-secondary)', font: 'inherit', cursor: 'not-allowed' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Phone / WhatsApp Number *
            <input
              required
              type="tel"
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            />
          </label>

          {/* Dynamic Curriculum Track Selection */}
          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600 }}>
            Curriculum Track (Database Synced) *
            <select
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              style={{ padding: '0.85rem', background: '#111', border: '1px solid var(--gold)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            >
              {dynamicTracks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {/* LOCKED TUITION PLAN (Per Requirement: Cannot be changed from portal; request only) */}
          <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} /> Fixed Tuition Plan (Academy Enrolment)
            </span>
            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.25)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div>
                <b style={{ color: '#fff', fontSize: '0.92rem', display: 'block' }}>{classSchedule}</b>
                <small style={{ color: 'var(--gold)' }}>
                  ₹{(student.monthly_fee || 1500).toLocaleString('en-IN')}/month
                </small>
              </div>
              {onNavigateToRequests && (
                <button
                  type="button"
                  className="student-text-button"
                  onClick={onNavigateToRequests}
                  style={{ fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'underline', padding: 0 }}
                >
                  Request Change →
                </button>
              )}
            </div>
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
              Tuition fee is fixed for your profile. To switch fee tiers or plans, submit a request.
            </small>
          </div>

          {/* Dynamic Batch Schedule Window Selection */}
          <label style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600 }}>
            Preferred Batch Schedule Window (Database Synced) *
            <select
              value={preferredSchedule}
              onChange={(e) => setPreferredSchedule(e.target.value)}
              style={{ padding: '0.85rem', background: '#111', border: '1px solid var(--gold)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            >
              {scheduleList.map((s) => {
                const label = `${s.day_label} — ${s.time_label}${s.description ? ` (${s.description})` : ''}`;
                return (
                  <option key={s.id} value={`${s.day_label} — ${s.time_label}`}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Profession / Student Status
            <input
              placeholder="e.g. Software Engineer, College Student"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Home / Delivery Address
            <input
              placeholder="Street, Area, City, PIN Code"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Emergency Contact Name
            <input
              placeholder="Parent / Guardian / Spouse"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Emergency Phone Number
            <input
              type="tel"
              placeholder="+91 98765 00000"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            />
          </label>

          <label style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Bio / Musical Experience
            <textarea
              rows={2}
              placeholder="Tell your instructor about your musical background, favorite artists, or instruments you play."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit', resize: 'vertical' }}
            />
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
            <button className="student-save-btn" type="submit" disabled={saving}>
              <Check size={18} /> {saving ? 'Syncing with Database...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

// =========================================================================
// 4. TUITION & PAYMENTS TAB (Locked to Profile Data, Request Only)
// =========================================================================
const TuitionPaymentsTab = ({
  student,
  dynamicFeeSummary,
  discountsList = [],
  payments,
  onOpenPayModal,
  onNavigateToRequests,
}: {
  student: StudentProfile | null;
  dynamicFeeSummary: {
    basePlanName: string;
    baseAmount: number;
    addonAmount: number;
    totalAmount: number;
    activeAddons: AddOn[];
  };
  feePlans?: FeePlan[];
  addOnsList?: AddOn[];
  discountsList?: any[];
  payments: FeePaymentRecord[];
  onOpenPayModal: () => void;
  onNavigateToRequests?: () => void;
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [validating, setValidating] = useState(false);

  const handleApplyCoupon = async (e: FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setValidating(true);
    setCouponMsg('');

    try {
      const { data: discount, error } = await supabaseAdmin
        .from('discounts')
        .select('*')
        .eq('coupon_code', code)
        .eq('active', true)
        .maybeSingle();

      if (error || !discount) {
        setDiscountAmount(0);
        setCouponMsg('Coupon code not found or inactive.');
        return;
      }

      let computed = 0;
      if (discount.discount_type === 'percentage') {
        computed = (dynamicFeeSummary.totalAmount * Number(discount.discount_value)) / 100;
      } else {
        computed = Number(discount.discount_value);
      }

      if (discount.maximum_discount_amount && computed > Number(discount.maximum_discount_amount)) {
        computed = Number(discount.maximum_discount_amount);
      }

      setDiscountAmount(computed);
      setCouponMsg(`Coupon ${code} applied! Saved ₹${computed.toFixed(0)} on this cycle.`);
    } catch {
      setCouponMsg('Error validating coupon.');
    } finally {
      setValidating(false);
    }
  };

  const finalDue = Math.max(0, dynamicFeeSummary.totalAmount - discountAmount);

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Tuition Summary Card */}
      <section className="student-panel" style={{ marginBottom: '1.5rem' }}>
        <p className="student-kicker">Tuition Account</p>
        <h2>Fees &amp; Monthly Payments</h2>

        <div className="payment-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Enrolled Plan Fee ({dynamicFeeSummary.basePlanName})
            </span>
            <strong style={{ fontSize: '2.25rem', color: 'var(--gold)', letterSpacing: '-0.02em' }}>
              ₹{finalDue.toFixed(0)}
            </strong>
            <small style={{ display: 'block', color: '#5dd37a', marginTop: '0.2rem' }}>
              {discountAmount > 0
                ? `Base ₹${dynamicFeeSummary.totalAmount} less ₹${discountAmount.toFixed(0)} discount applied`
                : `${dynamicFeeSummary.basePlanName}${dynamicFeeSummary.addonAmount > 0 ? ` + ₹${dynamicFeeSummary.addonAmount} add-ons` : ''}`}
            </small>
          </div>
          <button className="student-save-btn" style={{ margin: 0, width: 'auto' }} onClick={onOpenPayModal}>
            Pay Tuition Online <CircleDollarSign size={16} />
          </button>
        </div>

        {/* Dynamic Coupon Validator */}
        <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.65rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <input
            required
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter coupon code (e.g. TFSREFERRAL, TFSLAUNCH)"
            style={{
              flex: '1 1 240px',
              padding: '0.8rem 1rem',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              font: 'inherit',
            }}
          />
          <button className="portal-btn-secondary" type="submit" disabled={validating} style={{ margin: 0, width: 'auto' }}>
            {validating ? 'Verifying...' : 'Apply Coupon'}
          </button>
        </form>

        {/* Available Promo Coupons Badges */}
        {discountsList && discountsList.length > 0 && (
          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <small style={{ color: 'var(--text-secondary)' }}>Available Promo Codes:</small>
            {discountsList.map((d: any) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setCouponCode(d.coupon_code)}
                style={{
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px dashed var(--gold)',
                  borderRadius: '6px',
                  color: 'var(--gold)',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {d.coupon_code} ({d.discount_type === 'percentage' ? `${d.discount_value}% OFF` : `₹${d.discount_value} OFF`})
              </button>
            ))}
          </div>
        )}

        {couponMsg && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: discountAmount > 0 ? '#5dd37a' : '#ff6b6b' }}>
            {couponMsg}
          </p>
        )}
      </section>

      {/* Fixed Academy Enrolment (Locked To Profile Data) */}
      <section className="student-panel" style={{ marginBottom: '1.5rem', border: '1px solid rgba(212,175,55,0.3)', background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(18,21,28,0.7) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <p className="student-kicker" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={13} style={{ color: 'var(--gold)' }} /> Official Enrolment Structure
            </p>
            <h3 style={{ margin: 0, color: '#fff' }}>Fixed Tuition Plan &amp; Schedule</h3>
          </div>
          <span className="booking-badge" style={{ background: 'rgba(93,211,122,0.15)', color: '#5dd37a', border: '1px solid rgba(93,211,122,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={13} /> Fixed &amp; Verified by Academy
          </span>
        </div>

        <p className="student-muted" style={{ marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Your tuition fee tier and class schedule are permanently tied to your student account profile. To preserve instructor allocation and cohort fairness, tuition fees cannot be altered directly from the portal once fixed. To request a change or upgrade, submit a request to your instructor below.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <small style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              Enrolled Plan
            </small>
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#fff', marginTop: '0.25rem' }}>
              {dynamicFeeSummary.basePlanName}
            </strong>
            <span style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>
              Base: ₹{dynamicFeeSummary.baseAmount.toLocaleString('en-IN')}/mo
            </span>
          </div>

          <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <small style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              Total Monthly Tuition
            </small>
            <strong style={{ display: 'block', fontSize: '1.3rem', color: 'var(--gold)', marginTop: '0.25rem' }}>
              ₹{dynamicFeeSummary.totalAmount.toLocaleString('en-IN')}/mo
            </strong>
            <span style={{ color: '#5dd37a', fontSize: '0.82rem' }}>
              {dynamicFeeSummary.addonAmount > 0 ? `Includes ₹${dynamicFeeSummary.addonAmount} add-ons` : 'Standard Tuition (No add-ons)'}
            </span>
          </div>

          <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <small style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              Weekly Session Window
            </small>
            <strong style={{ display: 'block', fontSize: '0.98rem', color: '#fff', marginTop: '0.25rem' }}>
              {student?.preferred_schedule || 'Weekend Batch Window'}
            </strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Curriculum: {student?.curriculum || 'Guitar'}
            </span>
          </div>
        </div>

        {/* Change Request Action Callout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Need to change your tuition tier, billing cycle, or add electives?
          </span>
          {onNavigateToRequests && (
            <button
              type="button"
              className="student-save-btn"
              onClick={onNavigateToRequests}
              style={{ width: 'auto' }}
            >
              <Send size={15} /> Request Plan / Fee Change
            </button>
          )}
        </div>
      </section>

      {/* Payment History */}
      <section className="student-panel">
        <h3 className="student-section-title" style={{ marginBottom: '1.25rem' }}>
          Payment History &amp; UTR Submissions
        </h3>

        {payments.length === 0 ? (
          <p className="student-muted">No fee payment records submitted yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {payments.map((p) => (
              <div
                key={p.payment_reference || p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <b style={{ color: '#fff', display: 'block' }}>
                    {p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-IN') : 'Tuition Payment'}
                  </b>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    UTR: {p.utr} • Ref: {p.payment_reference || p.id.slice(0, 8)}
                  </small>
                  <br />
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {p.curriculum} • {p.class_type}
                  </small>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <b style={{ color: 'var(--gold)', fontSize: '1.1rem', display: 'block' }}>
                    ₹{p.amount.toLocaleString('en-IN')}
                  </b>
                  <span
                    className="booking-badge"
                    style={{
                      display: 'inline-block',
                      background:
                        p.payment_status === 'VERIFIED'
                          ? 'rgba(40,167,69,0.2)'
                          : p.payment_status === 'REJECTED'
                            ? 'rgba(220,53,69,0.2)'
                            : 'rgba(212,175,55,0.2)',
                      color:
                        p.payment_status === 'VERIFIED'
                          ? '#5dd37a'
                          : p.payment_status === 'REJECTED'
                            ? '#ff6b6b'
                            : 'var(--gold)',
                    }}
                  >
                    {p.payment_status}
                  </span>
                  {p.payment_status === 'VERIFIED' && (
                    <button
                      type="button"
                      onClick={() => generateFeeReceiptPdf(p)}
                      style={{
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.35)',
                        borderRadius: '6px',
                        color: 'var(--gold)',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Download size={12} /> Receipt PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};


// =========================================================================
// 5. CURRICULUM & MODULES TAB
// =========================================================================
const ModulesScheduleTab = ({
  student,
  curriculumList,
  scheduleList,
  moduleProgress,
  onRequestReschedule,
}: {
  student: StudentProfile | null;
  curriculumList: CurriculumItem[];
  scheduleList: ScheduleItem[];
  moduleProgress: Record<string, string>;
  onToggleProgress?: (id: string) => void;
  onRequestReschedule: () => void;
}) => {
  const studentTrack = student?.curriculum || 'Guitar';
  const defaultInstrument = useMemo(() => {
    const t = studentTrack.toLowerCase();
    if (t.includes('dotara')) return 'ukulele_dotara';
    if (t.includes('ukulele')) return 'ukulele_standard';
    return 'guitar';
  }, [studentTrack]);

  const [selectedFilterInstrument, setSelectedFilterInstrument] = useState<string | null>(null);
  const filterInstrument = selectedFilterInstrument ?? defaultInstrument;
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const filteredModules = useMemo(() => {
    if (filterInstrument === 'all') return curriculumList.filter((c) => c.active !== false);
    return curriculumList.filter((c) => c.instrument === filterInstrument && c.active !== false);
  }, [curriculumList, filterInstrument]);

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Live Syllabus Card */}
      <section className="student-panel" style={{ marginBottom: '1.5rem' }}>
        <p className="student-kicker">Live Syllabus</p>
        <h2>Dynamic Curriculum Tracks</h2>
        <p className="student-muted" style={{ marginBottom: '1.25rem' }}>
          Real curriculum tracks synchronized directly from The Fretboard Society. Track your progress or study ahead.
        </p>

        {/* Instrument Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'guitar', label: 'Acoustic Guitar' },
            { id: 'ukulele_standard', label: 'Standard Ukulele' },
            { id: 'ukulele_dotara', label: 'Dotara Ukulele' },
            { id: 'all', label: 'All Modules' },
          ].map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelectedFilterInstrument(inst.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: filterInstrument === inst.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                background: filterInstrument === inst.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                color: filterInstrument === inst.id ? 'var(--gold)' : '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {inst.label}
            </button>
          ))}
        </div>

        {/* Modules List */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredModules.map((m, idx) => {
            const status = moduleProgress[m.id] || 'not_started';
            const isExpanded = expandedModuleId === m.id;

            return (
              <div
                key={m.id || idx}
                style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: status === 'mastered' ? '1px solid rgba(93,211,122,0.3)' : status === 'in_progress' ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  display: 'grid',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: status === 'mastered' ? 'rgba(93,211,122,0.2)' : status === 'in_progress' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                      color: status === 'mastered' ? '#5dd37a' : status === 'in_progress' ? 'var(--gold)' : 'var(--text-secondary)',
                      border: status === 'mastered' ? '1px solid #5dd37a' : status === 'in_progress' ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {status === 'mastered' ? <Check size={18} /> : idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <b style={{ color: '#fff', fontSize: '1.05rem' }}>{m.title}</b>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="booking-badge" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                          {m.category}
                        </span>
                        <span
                          className="booking-badge"
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background:
                              status === 'mastered'
                                ? 'rgba(93,211,122,0.2)'
                                : status === 'in_progress'
                                  ? 'rgba(212,175,55,0.2)'
                                  : 'rgba(255,255,255,0.08)',
                            color:
                              status === 'mastered'
                                ? '#5dd37a'
                                : status === 'in_progress'
                                  ? 'var(--gold)'
                                  : 'var(--text-secondary)',
                            border:
                              status === 'mastered'
                                ? '1px solid rgba(93,211,122,0.3)'
                                : status === 'in_progress'
                                  ? '1px solid rgba(212,175,55,0.3)'
                                  : '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {status === 'mastered' ? '✓ Mastered (Verified)' : status === 'in_progress' ? '⏳ Learning / In Progress' : '○ Upcoming Module'}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      {m.description}
                    </p>
                  </div>
                </div>

                {/* Expand Practice Guide */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setExpandedModuleId(isExpanded ? null : m.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {isExpanded ? 'Hide study tips' : 'View practice tips & exercises'} <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    Instrument: {m.instrument.replace('_', ' ')}
                  </small>
                </div>

                {isExpanded && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem', color: '#ccc', lineHeight: '1.6' }}>
                    <b style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem' }}>Teacher Practice Objectives:</b>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      <li>Daily 15-minute metronome fingerstyle drill (start at 60 bpm, ramp up to 100 bpm).</li>
                      <li>Clean chord transition with zero thumb pressure collapse.</li>
                      <li>Song application: Record a 30-second audio snippet to submit for teacher critique.</li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Class Schedule Windows */}
      <section className="student-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <p className="student-kicker">Weekly Batch Timings</p>
            <h2>Official Studio &amp; Online Windows</h2>
          </div>
          <button className="admission-secondary" onClick={onRequestReschedule}>
            <Calendar size={15} /> Request Reschedule
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {scheduleList.map((s, idx) => {
            const isMySlot = (student?.preferred_schedule || '').includes(s.day_label);
            return (
              <div
                key={s.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: isMySlot ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isMySlot ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <b style={{ color: 'var(--gold)' }}>{s.day_label}</b>
                  <small style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    {s.description || s.title}
                  </small>
                  {isMySlot && (
                    <span className="booking-badge" style={{ marginLeft: '0.65rem', background: '#5dd37a22', color: '#5dd37a' }}>
                      Your Batch Window
                    </span>
                  )}
                </div>
                <span style={{ color: '#5dd37a', fontWeight: 600, fontSize: '0.9rem' }}>
                  {s.time_label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// =========================================================================
// 6. HELPDESK & REQUESTS TAB
// =========================================================================
const RequestsTab = ({
  user,
  displayName,
  student,
  scheduleList,
  feePlans,
  requests,
  onRequestSent,
}: {
  user: any;
  displayName: string;
  student: StudentProfile | null;
  scheduleList: ScheduleItem[];
  feePlans: FeePlan[];
  requests: any[];
  onRequestSent: (req: any) => void;
}) => {
  const [requestType, setRequestType] = useState('Schedule change');
  const [targetSlot, setTargetSlot] = useState(
    scheduleList[0] ? `${scheduleList[0].day_label} — ${scheduleList[0].time_label}` : ''
  );
  const [targetPlan, setTargetPlan] = useState(feePlans[0]?.name || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    setSubmitting(true);

    let finalMessage = message.trim();
    if (requestType === 'Schedule change' && targetSlot) {
      finalMessage = `[Requested Slot: ${targetSlot} | Current Slot: ${student?.preferred_schedule || 'Flexible'}]\n${finalMessage}`;
    } else if (requestType === 'Plan change' && targetPlan) {
      finalMessage = `[Requested Plan: ${targetPlan} | Current Plan: ${student?.class_schedule || 'Default'}]\n${finalMessage}`;
    }

    try {
      const payload = {
        student_id: user.id,
        student_name: displayName,
        student_email: user.email,
        request_type: requestType,
        message: finalMessage,
        status: 'pending',
      };

      const { data, error } = await supabaseAdmin.from('student_requests').insert(payload).select().single();
      if (!error && data) {
        onRequestSent(data);
      } else {
        onRequestSent({ ...payload, id: `req-${Date.now()}`, created_at: new Date().toISOString() });
      }
      setMessage('');
    } catch {
      onRequestSent({
        student_id: user.id,
        student_name: displayName,
        student_email: user.email,
        request_type: requestType,
        message: finalMessage,
        status: 'pending',
        id: `req-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <section className="student-panel" style={{ marginBottom: '1.5rem' }}>
        <p className="student-kicker">Direct Connection to Teacher</p>
        <h2>Submit a Request or Reschedule</h2>
        <p className="student-muted" style={{ marginBottom: '1.5rem' }}>
          Ask about lesson reschedules, tuition plan adjustments, fingerstyle techniques, or request a leave of absence.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Request Subject / Category
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              style={{ padding: '0.85rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
            >
              <option value="Schedule change">Schedule Reschedule / Makeup Lesson</option>
              <option value="Plan change">Tuition Plan Switch</option>
              <option value="Leave notification">Leave of Absence</option>
              <option value="Technique query">Technique &amp; Practice Question</option>
              <option value="General support">General Support</option>
            </select>
          </label>

          {/* Dynamic selector based on requestType */}
          {requestType === 'Schedule change' && scheduleList.length > 0 && (
            <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--gold)' }}>
              Select Requested Lesson Slot (Current: {student?.preferred_schedule || 'Flexible'})
              <select
                value={targetSlot}
                onChange={(e) => setTargetSlot(e.target.value)}
                style={{ padding: '0.85rem', background: '#111', border: '1px solid var(--gold)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
              >
                {scheduleList.map((s) => (
                  <option key={s.id} value={`${s.day_label} — ${s.time_label}`}>
                    {s.day_label} — {s.time_label} ({s.description || 'Lesson window'})
                  </option>
                ))}
              </select>
            </label>
          )}

          {requestType === 'Plan change' && feePlans.length > 0 && (
            <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--gold)' }}>
              Select Requested Tuition Plan (Current: {student?.class_schedule || 'Standard'})
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value)}
                style={{ padding: '0.85rem', background: '#111', border: '1px solid var(--gold)', borderRadius: '8px', color: '#fff', font: 'inherit' }}
              >
                {feePlans.map((p) => (
                  <option key={p.id} value={`${p.name} (₹${p.amount}/${p.billing_period || 'mo'})`}>
                    {p.name} — ₹{p.amount.toLocaleString('en-IN')}/{p.billing_period || 'month'}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Message Details *
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your query or reasons for reschedule..."
              style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', font: 'inherit', resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="admin-save" type="submit" disabled={submitting} style={{ margin: 0 }}>
              <Send size={16} /> {submitting ? 'Submitting...' : 'Send to Teacher'}
            </button>
          </div>
        </form>
      </section>

      {/* Request History */}
      <section className="student-panel">
        <h3 className="student-section-title" style={{ marginBottom: '1rem' }}>
          Previous Submissions &amp; Teacher Replies
        </h3>

        {requests.length === 0 ? (
          <p className="student-muted">No requests submitted yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {requests.map((r, i) => (
              <div
                key={r.id || i}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <b style={{ color: 'var(--gold)' }}>{r.request_type}</b>
                  <span
                    className="booking-badge"
                    style={{
                      background: r.status === 'resolved' ? 'rgba(40,167,69,0.2)' : 'rgba(212,175,55,0.2)',
                      color: r.status === 'resolved' ? '#5dd37a' : 'var(--gold)',
                    }}
                  >
                    {r.status || 'Pending'}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '0.9rem' }}>{r.message}</p>
                {r.admin_note && (
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: 'rgba(212,175,55,0.08)', borderLeft: '3px solid var(--gold)', borderRadius: '4px' }}>
                    <small style={{ color: 'var(--gold)', display: 'block', fontWeight: 600 }}>TFS Instructor Response:</small>
                    <p style={{ margin: '0.2rem 0 0', color: '#fff', fontSize: '0.85rem' }}>{r.admin_note}</p>
                  </div>
                )}
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : ''}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// =========================================================================
// PAY TUITION MODAL (Dynamic UPI & UTR Submission)
// =========================================================================
const PayTuitionModal = ({
  student,
  dynamicFeeSummary,
  onClose,
  onSubmitPayment,
}: {
  student: StudentProfile;
  dynamicFeeSummary: { basePlanName: string; totalAmount: number };
  onClose: () => void;
  onSubmitPayment: (payload: { amount: number; utr: string; payer_name: string; notes: string }) => Promise<void>;
}) => {
  const [payerName, setPayerName] = useState(`${student.first_name} ${student.last_name}`.trim());
  const amount = dynamicFeeSummary.totalAmount;
  const [utr, setUtr] = useState('');
  const [notes, setNotes] = useState('Monthly tuition fee');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const officialUpi = 'codr.sankha.contact@oksbi';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(officialUpi);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!utr.trim()) return;
    setSubmitting(true);

    await onSubmitPayment({
      amount: Number(amount),
      utr: utr.trim(),
      payer_name: payerName.trim(),
      notes: notes.trim(),
    });
    setSubmitting(false);
  };

  return (
    <div className="tfs-modal-overlay">
      <form onSubmit={handleSubmit} className="tfs-modal-card" style={{ maxWidth: '560px' }}>
        <div className="tfs-modal-header">
          <div>
            <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '1.25rem' }}>Pay Monthly Tuition Fee</h3>
            <small style={{ color: 'var(--text-secondary)' }}>
              Plan: {dynamicFeeSummary.basePlanName} • Total: ₹{dynamicFeeSummary.totalAmount}
            </small>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="tfs-modal-body">
          {/* Official UPI Details Box */}
          <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px', padding: '1.15rem', marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>
              Official TFS UPI Payment Information
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 600 }}>
                {officialUpi}
              </span>
              <button
                type="button"
                onClick={handleCopyUpi}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(212,175,55,0.2)',
                  color: 'var(--gold)',
                  border: '1px solid var(--gold)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy UPI ID'}
              </button>
            </div>
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem', lineHeight: '1.4' }}>
              Open Google Pay, PhonePe, Paytm, or BHIM. Send the exact fee amount, then copy the 12-digit UTR/UPI Transaction ID and enter it below.
            </small>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Payer Name (Bank / UPI account holder name) *
              <input
                required
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Amount to Pay (₹) * (Fixed Academy Tuition)
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  required
                  readOnly
                  type="number"
                  value={amount}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(212,175,55,0.06)',
                    border: '1px solid var(--gold)',
                    borderRadius: '8px',
                    color: 'var(--gold)',
                    fontWeight: 'bold',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed',
                  }}
                />
                <Lock size={15} style={{ position: 'absolute', right: '12px', color: 'var(--gold)' }} />
              </div>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                Locked to your profile. (To request changes to tuition fee or plan, submit a request).
              </small>
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              UTR / Transaction Reference (12 digits) *
              <input
                required
                placeholder="e.g. 428192847291"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Payment Notes / Cycle
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. October monthly tuition"
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
              />
            </label>
          </div>
        </div>

        <div className="tfs-modal-footer">
          <button type="button" className="portal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="student-save-btn" style={{ margin: 0, width: 'auto' }} disabled={submitting}>
            <Check size={16} /> {submitting ? 'Submitting to Database...' : 'Submit Payment Reference'}
          </button>
        </div>
      </form>
    </div>
  );
};

// =========================================================================
// EDIT ID CARD MODAL (With Pass Photo Upload)
// =========================================================================
const EditIdCardModal = ({
  student,
  onClose,
  onSave,
}: {
  student: StudentProfile;
  onClose: () => void;
  onSave: (updates: Partial<StudentProfile>) => Promise<void>;
}) => {
  const [firstName, setFirstName] = useState(student.first_name || '');
  const [lastName, setLastName] = useState(student.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(student.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState(student.avatar_url || '');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const bucketUrl = await uploadImageToBucket(file, 'students');
      setAvatarUrl(bucketUrl);
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSave({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim(),
      avatar_url: avatarUrl,
    });
    setSubmitting(false);
  };

  return (
    <div className="tfs-modal-overlay">
      <form onSubmit={handleSubmit} className="tfs-modal-card" style={{ maxWidth: '480px' }}>
        <div className="tfs-modal-header">
          <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '1.25rem' }}>Edit Student ID Pass</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="tfs-modal-body">
          {/* Photo Upload for ID Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem', background: 'rgba(212,175,55,0.06)', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '1.25rem' }}>
            <div className="portal-avatar-wrap" style={{ width: '56px', height: '56px' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Pass Photo" className="portal-avatar-img" />
              ) : (
                <div className="portal-avatar-initials" style={{ width: '56px', height: '56px', fontSize: '1.4rem' }}>
                  {(firstName || student.first_name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ color: '#fff', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>Pass Photo</b>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="portal-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Camera size={13} /> {uploading ? 'Processing...' : avatarUrl ? 'Change Pass Photo' : 'Upload Pass Photo'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              First Name on Card *
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Last Name on Card *
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Emergency Contact / Phone
              <input
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
              />
            </label>
          </div>
        </div>

        <div className="tfs-modal-footer">
          <button type="button" className="portal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="student-save-btn" style={{ margin: 0, width: 'auto' }} disabled={submitting}>
            <Check size={16} /> {submitting ? 'Updating...' : 'Update Pass'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentDashboard;

// =========================================================================
// 7. AI MUSIC TUTOR CHAT TAB
// =========================================================================
const AiChatTab = ({
  student,
  displayName,
}: {
  student: any;
  displayName: string;
}) => {
  const [messages, setMessages] = useState<AiMessage[]>(() => [{
    id: 'welcome',
    sender: 'assistant',
    text: `🎸 Greetings ${displayName}! I am your **TFS AI Music Tutor** — your intelligent guide for music theory, chord shapes, fretboard navigation, transposition, and academy queries.\n\nTry asking me:\n• "Explain the pentatonic scale"
• "What are barre chord tips?"
• "How do I transpose C to G?"
• "What is fingerstyle PIMA technique?"`,
    timestamp: new Date().toISOString(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: AiMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askTfsAi(text, {
        curriculum: student?.curriculum || 'Guitar',
        plan: student?.class_schedule || 'Tuition Plan',
        studentName: displayName,
      });
      const aiMsg: AiMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: '⚠️ I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <p className="student-kicker">Powered by Gemini AI</p>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', margin: 0 }}>
          <Bot size={28} style={{ color: 'var(--gold)' }} />
          TFS AI Music Tutor
        </h2>
        <p className="student-muted" style={{ marginTop: '0.35rem' }}>Your personal guide for music theory, guitar & ukulele techniques, and academy guidance.</p>
      </div>

      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          marginBottom: '1rem',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '0.75rem',
            }}
          >
            {msg.sender === 'assistant' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                <Bot size={18} style={{ color: 'var(--gold)' }} />
              </div>
            )}
            <div
              style={{
                maxWidth: '80%',
                padding: '0.85rem 1.1rem',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                background: msg.sender === 'user'
                  ? 'rgba(212,175,55,0.15)'
                  : 'rgba(255,255,255,0.04)',
                border: msg.sender === 'user'
                  ? '1px solid rgba(212,175,55,0.35)'
                  : '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: '#fff',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.text}
            </div>
            {msg.sender === 'user' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                <UserRound size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} style={{ color: 'var(--gold)' }} />
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '4px 16px 16px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[0,1,2].map((i) => (
                <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about chords, scales, theory, fees, schedule..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.9rem 1.1rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="admin-save"
          style={{ margin: 0, padding: '0.9rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Send size={16} /> Send
        </button>
      </form>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
