import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  Guitar,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Percent,
  Pencil,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import type {
  FeePlan,
  CurriculumItem,
  AddOn,
  ScheduleItem,
  StudentProfile,
  AdmissionSubmission,
  FeePaymentRecord,
} from '../lib/tfsData';
import {
  loadFeePlans,
  saveFeePlan,
  deleteFeePlan,
  loadCurriculumItems,
  saveCurriculumItem,
  deleteCurriculumItem,
  loadAddOns,
  saveAddOn,
  deleteAddOn,
  loadScheduleItems,
  saveScheduleItem,
  deleteScheduleItem,
  loadStudents,
  saveStudent,
  saveStudentProgress,
  deleteStudent,
  uploadImageToBucket,
  isUuid,
  loadStoredAdmissions,
  fetchAdmissions,
  saveAdmissionLocally,
  deleteAdmissionRecord,
  fetchSpreadsheetAdmissions,
  submitAdmissionToSpreadsheet,
  syncAdmissionStatusToSpreadsheet,
  loadStoredFeePayments,
  fetchFeePayments,
  saveFeePaymentRecord,
  deleteFeePaymentRecord,
  updateFeePaymentStatus,
  exportToCSV,
  getAdmissionApiUrl,
  setAdmissionApiUrl,
  getGoogleSheetUrl,
  setGoogleSheetUrl,
  PREDEFINED_CURRICULUMS,
  PREDEFINED_PLANS,
  PREDEFINED_SCHEDULES,
  PREDEFINED_ADDONS,
  PREDEFINED_STUDENT_STATUSES,
  PREDEFINED_FEE_STATUSES,
} from '../lib/tfsData';
import { subscribeToSync, broadcastSync } from '../lib/syncBus';

type Section =
  | 'overview'
  | 'students'
  | 'feepayments'
  | 'admissions'
  | 'fees'
  | 'curriculum'
  | 'addons'
  | 'schedule'
  | 'discounts'
  | 'bookings'
  | 'messages';

type RecordValue = Record<string, any>;

const navItems: { id: Section; label: string; icon: any }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'feepayments', label: 'Fee payments', icon: CreditCard },
  { id: 'admissions', label: 'Admissions', icon: FileText },
  { id: 'fees', label: 'Fee plans', icon: CircleDollarSign },
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { id: 'addons', label: 'Add-ons', icon: Puzzle },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'discounts', label: 'Coupons', icon: Percent },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

const TfsControl = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('overview');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [feePayments, setFeePayments] = useState<FeePaymentRecord[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionSubmission[]>([]);
  const [fees, setFees] = useState<FeePlan[]>([]);
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [discounts, setDiscounts] = useState<RecordValue[]>([]);
  const [bookings, setBookings] = useState<RecordValue[]>([]);
  const [requests, setRequests] = useState<RecordValue[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sheetSyncing, setSheetSyncing] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Modals & Editing
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [studentForProgress, setStudentForProgress] = useState<StudentProfile | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string; email?: string } | null>(null);
  const [admissionToDelete, setAdmissionToDelete] = useState<{ id: string; name: string } | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeePlan | null>(null);
  const [editingCurriculum, setEditingCurriculum] = useState<CurriculumItem | null>(null);
  const [editingAddon, setEditingAddon] = useState<AddOn | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<RecordValue | null>(null);
  const [editingBooking, setEditingBooking] = useState<RecordValue | null>(null);
  const [editingPayment, setEditingPayment] = useState<FeePaymentRecord | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [apiUrlConfig, setApiUrlConfig] = useState(getAdmissionApiUrl());
  const [sheetUrlConfig, setSheetUrlConfig] = useState(getGoogleSheetUrl());
  const [showConfigModal, setShowConfigModal] = useState(false);

  const notify = (msg: string) => {
    setNotice(msg);
    setError('');
    window.setTimeout(() => setNotice(''), 3500);
  };

  const fail = (msg: string) => {
    setError(msg);
    setNotice('');
    window.setTimeout(() => setError(''), 5000);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {}
    navigate('/tfscontrol/login', { replace: true });
  };

  const handleSaveProgress = async (
    studentId: string,
    progress: Record<string, 'not_started' | 'in_progress' | 'mastered'>,
    feedback?: string,
    badges?: string[]
  ) => {
    try {
      await saveStudentProgress(studentId, progress, feedback, badges);
      const reloaded = await loadStudents();
      setStudents(reloaded);
      notify('Student syllabus progress & evaluation saved and synced!');
      setStudentForProgress(null);
    } catch (err) {
      console.error('Failed to update student progress:', err);
      fail('Failed to update student progress.');
    }
  };

  const loadAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [
        loadedPlans,
        loadedCurriculums,
        loadedAddons,
        loadedSchedules,
        loadedStudentsList,
        loadedPayments,
        loadedAdmissions,
      ] = await Promise.all([
        loadFeePlans(),
        loadCurriculumItems(),
        loadAddOns(),
        loadScheduleItems(),
        loadStudents(),
        fetchFeePayments(),
        fetchAdmissions(),
      ]);

      setFees(loadedPlans);
      setCurriculumItems(loadedCurriculums);
      setAddons(loadedAddons);
      setScheduleItems(loadedSchedules);
      setStudents(loadedStudentsList);
      setFeePayments(loadedPayments);
      setAdmissions(loadedAdmissions);

      // Fetch bookings, discounts, requests from Supabase if available
      try {
        const [bookRes, discRes, reqRes] = await Promise.all([
          supabaseAdmin.from('bookings').select('*').order('created_at', { ascending: false }),
          supabaseAdmin.from('discounts').select('*').order('updated_at', { ascending: false }),
          supabaseAdmin.from('student_requests').select('*').order('created_at', { ascending: false }),
        ]);
        if (bookRes.data) setBookings(bookRes.data);
        if (discRes.data) setDiscounts(discRes.data);
        if (reqRes.data) setRequests(reqRes.data);
      } catch (err) {
        console.warn('Optional Supabase table queries:', err);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      if (!silent) fail('Failed to load some data. Displaying local data.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllData();

    // 1. Subscribe to real-time sync events across all tabs, portals, and devices
    const unsubscribe = subscribeToSync(() => {
      void loadAllData(true);
    });

    // 2. Refetch when window regains focus or tab becomes visible
    const onFocus = () => void loadAllData(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadAllData(true);
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // 3. Periodic polling fallback every 8 seconds
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadAllData(true);
      }
    }, 8000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  // Sync with Google Sheet
  const handleSyncWithSpreadsheet = async () => {
    setSheetSyncing(true);
    try {
      const result = await fetchSpreadsheetAdmissions();
      if (result.spreadsheetUrl) {
        setGoogleSheetUrl(result.spreadsheetUrl);
        setSheetUrlConfig(result.spreadsheetUrl);
      }

      if (result.error) {
        fail(result.error);
      } else if (result.rows && result.rows.length > 0) {
        const sheetAdmissions: AdmissionSubmission[] = result.rows.map((row, idx) => ({
          id: `sheet-${idx}`,
          timestamp: row[0] || new Date().toISOString(),
          admission_id: row[1] || `TFS-${idx}`,
          payment_reference: row[2] || '',
          payment_status: (row[4] as any) || 'PENDING VERIFICATION',
          utr: row[5] || '',
          payer_name: row[6] || '',
          student_name: row[7] || '',
          phone: row[8] || '',
          email: row[9] || '',
          address: row[10] || '',
          profession: row[11] || '',
          curriculum: row[12] || 'Guitar',
          class_type: row[13] || 'Home Tuition',
          addons: row[14] || '',
          schedule: row[15] || '',
          admission_fee: Number(String(row[16] || '').replace(/[^\d.-]/g, '')) || 1000,
          base_tuition_fee: Number(String(row[17] || '').replace(/[^\d.-]/g, '')) || 0,
          addon_fee: Number(String(row[18] || '').replace(/[^\d.-]/g, '')) || 0,
          total_monthly_fee: row[19] || '',
          payment_amount: Number(String(row[20] || '').replace(/[^\d.-]/g, '')) || 0,
          synced_to_sheet: true,
          notes: row[22] || '',
        }));

        // Merge with local admissions
        const local = loadStoredAdmissions();
        const map = new Map<string, AdmissionSubmission>();
        local.forEach((a) => map.set(a.admission_id || a.id, a));
        sheetAdmissions.forEach((a) => map.set(a.admission_id || a.id, a));
        const merged = Array.from(map.values());
        setAdmissions(merged);
        localStorage.setItem('tfs_admissions', JSON.stringify(merged));
        notify(`Synchronized ${sheetAdmissions.length} admissions from Google Sheets.`);
      } else {
        notify('Connected to Google Sheet. No new entries.');
      }
    } catch {
      fail('Failed to sync with Google Sheet.');
    } finally {
      setSheetSyncing(false);
    }
  };

  // Push unsynced admissions to spreadsheet
  const handlePushUnsyncedToSheet = async () => {
    const unsynced = admissions.filter((a) => !a.synced_to_sheet);
    if (unsynced.length === 0) {
      notify('All admissions are already synced to the Google Sheet.');
      return;
    }
    setSheetSyncing(true);
    let count = 0;
    for (const adm of unsynced) {
      await submitAdmissionToSpreadsheet({
        name: adm.student_name,
        phone: adm.phone,
        email: adm.email,
        address: adm.address,
        profession: adm.profession,
        curriculum: adm.curriculum,
        classType: adm.class_type,
        addons: adm.addons,
        schedule: adm.schedule,
        utr: adm.utr,
        payerName: adm.payer_name,
        paymentReference: adm.payment_reference,
        admissionId: adm.admission_id,
        monthlyFee: adm.total_monthly_fee,
        paymentAmount: adm.payment_amount,
      });
      adm.synced_to_sheet = true;
      count++;
    }
    setAdmissions([...admissions]);
    localStorage.setItem('tfs_admissions', JSON.stringify(admissions));
    setSheetSyncing(false);
    notify(`Pushed ${count} submission(s) to Google Sheets successfully.`);
  };

  // Save student updates
  const handleSaveStudent = async (data: StudentProfile) => {
    try {
      const saved = await saveStudent(data);
      const refreshed = await loadStudents();
      setStudents(refreshed);
      setEditingStudent(null);
      setIsAddingStudent(false);
      notify(`Student profile for ${saved.first_name} ${saved.last_name} synced to database.`);
    } catch {
      fail('Failed to save student profile.');
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: string, name: string, email?: string) => {
    try {
      const result = await deleteStudent(id, email);
      const refreshed = await loadStudents();
      setStudents(refreshed);
      if (result.error) {
        notify(`Removed ${name}. (${result.error})`);
      } else {
        notify(`Student ${name} removed from database.`);
      }
    } catch {
      fail('Failed to delete student.');
    }
  };

  // Delete admission submission
  const handleDeleteAdmission = (id: string, name: string) => {
    deleteAdmissionRecord(id);
    setAdmissions(loadStoredAdmissions());
    notify(`Admission record for ${name} deleted.`);
  };

  // Delete fee payment record
  const handleDeleteFeePayment = (id: string, name: string) => {
    deleteFeePaymentRecord(id);
    setFeePayments(loadStoredFeePayments());
    notify(`Payment record for ${name} deleted.`);
  };

  // Convert admission to active student
  const handleEnrollAdmissionStudent = async (adm: AdmissionSubmission) => {
    try {
      const existing = students.find((s) => s.email.toLowerCase() === adm.email.toLowerCase());
      if (existing) {
        const updated = await saveStudent({
          ...existing,
          status: 'active',
          admission_id: adm.admission_id,
          admission_fee_paid: true,
          curriculum: adm.curriculum,
          class_schedule: adm.class_type,
          fee_status: 'Up to date',
        });
        setStudents(students.map((s) => (s.id === updated.id ? updated : s)));
        notify(`Existing student ${updated.first_name} activated with admission plan.`);
      } else {
        const nameParts = adm.student_name.trim().split(' ');
        const newStudent = await saveStudent({
          first_name: nameParts[0] || 'Student',
          last_name: nameParts.slice(1).join(' ') || '',
          email: adm.email,
          phone_number: adm.phone,
          address: adm.address,
          profession: adm.profession,
          curriculum: adm.curriculum,
          class_schedule: adm.class_type,
          preferred_schedule: adm.schedule,
          addons: adm.addons ? adm.addons.split(',').map((x) => x.trim()).filter(Boolean) : [],
          monthly_fee: (adm.base_tuition_fee || 0) + (adm.addon_fee || 0),
          admission_id: adm.admission_id,
          admission_fee_paid: true,
          fee_status: 'Up to date',
          status: 'active',
          notes: `Enrolled via Admission form on ${new Date().toLocaleDateString('en-IN')}`,
        });
        setStudents([newStudent, ...students]);
        notify(`Enrolled ${adm.student_name} as an active TFS student!`);
      }

      // Mark admission as VERIFIED in local state and database
      adm.payment_status = 'VERIFIED';
      await saveAdmissionLocally(adm);
      setAdmissions((prev) =>
        prev.map((a) => (a.admission_id === adm.admission_id || a.email === adm.email ? { ...a, payment_status: 'VERIFIED' } : a))
      );

      // Async sync to Google Sheets without blocking UI
      syncAdmissionStatusToSpreadsheet(adm.admission_id, 'VERIFIED', {
        email: adm.email,
        notes: `Verified & enrolled on ${new Date().toLocaleDateString('en-IN')}`,
      }).catch((e) => console.warn('Spreadsheet sync error:', e));

      broadcastSync('admissions', 'update', adm.admission_id);
      broadcastSync('students', 'update');
    } catch (enrollErr: any) {
      console.error('Enroll student error:', enrollErr);
      fail(`Could not enroll student: ${enrollErr.message || enrollErr}`);
    }
  };

  // Update admission status (Approve / Reject)
  const handleUpdateAdmissionStatus = async (adm: AdmissionSubmission, status: 'VERIFIED' | 'REJECTED') => {
    try {
      adm.payment_status = status;
      await saveAdmissionLocally(adm);

      // Update UI state immediately
      setAdmissions((prev) =>
        prev.map((a) => (a.admission_id === adm.admission_id || a.email === adm.email ? { ...a, payment_status: status } : a))
      );

      // Also update student record if they exist in student list
      const matchedStudent = students.find((s) => s.email.toLowerCase() === adm.email.toLowerCase());
      if (matchedStudent) {
        await saveStudent({
          ...matchedStudent,
          status: status === 'VERIFIED' ? 'active' : 'inactive',
          fee_status: status === 'VERIFIED' ? 'Up to date' : 'Pending Verification',
        });
        setStudents(await loadStudents());
      }

      // Async sync to Google Sheets without blocking UI
      syncAdmissionStatusToSpreadsheet(adm.admission_id, status, {
        email: adm.email,
        notes: `Marked as ${status} in TFS Admin Portal on ${new Date().toLocaleDateString('en-IN')}`,
      }).catch((e) => console.warn('Spreadsheet sync error:', e));

      broadcastSync('admissions', 'update', adm.admission_id);
      broadcastSync('students', 'update');
      notify(`Admission ${adm.admission_id} marked as ${status} successfully.`);
    } catch (statusErr: any) {
      console.error('Update admission status error:', statusErr);
      fail(`Could not update admission: ${statusErr.message || statusErr}`);
    }
  };

  // Fee payment verification
  const handleVerifyFeePayment = async (paymentId: string) => {
    try {
      await updateFeePaymentStatus(paymentId, 'VERIFIED');
      setFeePayments((prev) =>
        prev.map((p) => (p.id === paymentId || p.payment_reference === paymentId ? { ...p, payment_status: 'VERIFIED' } : p))
      );
      setStudents(await loadStudents());
      notify('Fee payment marked as VERIFIED and synced to Google Sheets & Student Portal.');
    } catch (vErr: any) {
      console.error('Verify fee payment error:', vErr);
      fail(`Could not verify payment: ${vErr.message || vErr}`);
    }
  };

  const handleRejectFeePayment = async (paymentId: string) => {
    try {
      await updateFeePaymentStatus(paymentId, 'REJECTED');
      setFeePayments((prev) =>
        prev.map((p) => (p.id === paymentId || p.payment_reference === paymentId ? { ...p, payment_status: 'REJECTED' } : p))
      );
      notify('Fee payment marked as REJECTED and updated in Google Sheets.');
    } catch (rErr: any) {
      console.error('Reject fee payment error:', rErr);
      fail(`Could not reject payment: ${rErr.message || rErr}`);
    }
  };

  const handleSavePaymentRecord = async (payment: FeePaymentRecord) => {
    await saveFeePaymentRecord(payment);
    setFeePayments(await fetchFeePayments());
    setEditingPayment(null);
    setIsAddingPayment(false);
    notify('Fee payment record saved and synchronized with Google Sheets.');
  };

  return (
    <div className="admin-shell animate-fade-in">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-brand">
          <Guitar size={22} />
          <span>TFS <b>CONTROL</b></span>
        </div>
        <p className="admin-kicker">Administration</p>
        <nav className="admin-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={section === id ? 'admin-nav-item active' : 'admin-nav-item'}
              onClick={() => {
                setSection(id);
                setMobileMenuOpen(false);
              }}
            >
              <Icon size={18} />
              {label}
              {id === 'feepayments' && feePayments.filter((p) => p.payment_status === 'PENDING VERIFICATION').length > 0 && (
                <span className="admin-count" style={{ marginLeft: 'auto', background: '#d4af37', color: '#000', fontWeight: 'bold' }}>
                  {feePayments.filter((p) => p.payment_status === 'PENDING VERIFICATION').length}
                </span>
              )}
              {id === 'admissions' && admissions.filter((a) => a.payment_status === 'PENDING VERIFICATION').length > 0 && (
                <span className="admin-count" style={{ marginLeft: 'auto', background: 'rgba(212,175,55,0.2)' }}>
                  {admissions.filter((a) => a.payment_status === 'PENDING VERIFICATION').length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          className="admin-action"
          style={{ marginTop: 'auto', marginBottom: '0.5rem' }}
          onClick={() => {
            setShowConfigModal(true);
            setMobileMenuOpen(false);
          }}
        >
          <Settings size={17} /> Spreadsheet Settings
        </button>
        <button className="admin-signout" onClick={handleSignOut}>
          <LogOut size={17} /> Sign out
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
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
              <p className="admin-kicker">TFS / {section}</p>
              <h1>{navItems.find((item) => item.id === section)?.label}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="admin-link"
              onClick={() => void loadAllData()}
              title="Refresh all data"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Reload
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-link"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ExternalLink size={14} /> Public site
            </a>
            <div className="admin-status">
              <span /> Secure Admin Workspace
            </div>
            <button
              type="button"
              className="portal-btn-secondary"
              onClick={handleSignOut}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </header>

        {notice && (
          <div className="admin-notice">
            <Check size={16} />
            {notice}
          </div>
        )}
        {error && (
          <div className="admin-error">
            <X size={16} />
            {error}
          </div>
        )}

        {/* 1. OVERVIEW */}
        {section === 'overview' && (
          <OverviewSection
            students={students}
            fees={fees}
            admissions={admissions}
            feePayments={feePayments}
            bookings={bookings}
            requests={requests}
            onNavigate={setSection}
            loading={loading}
          />
        )}

        {/* 2. STUDENTS (With Dropdown Selects for All Predefined Things) */}
        {section === 'students' && (
          <StudentsSection
            students={students}
            search={search}
            setSearch={setSearch}
            editing={editingStudent}
            setEditing={setEditingStudent}
            isAdding={isAddingStudent}
            setIsAdding={setIsAddingStudent}
            onSave={handleSaveStudent}
            onAskDelete={(id, name, email) => setStudentToDelete({ id, name, email })}
            onManageProgress={setStudentForProgress}
            curriculumItems={curriculumItems}
            feePlans={fees}
            addonsList={addons}
            scheduleList={scheduleItems}
            onExportStudents={() => {
              const headers = [
                'Student ID', 'First Name', 'Last Name', 'Email', 'Phone',
                'Curriculum', 'Tuition Plan', 'Schedule Window', 'Monthly Fee',
                'Fee Status', 'Account Status', 'Created At'
              ];
              const rows = students.map((s) => [
                s.id, s.first_name, s.last_name, s.email, s.phone_number || '',
                s.curriculum, s.class_schedule, s.preferred_schedule || '',
                s.monthly_fee || 1500, s.fee_status || 'Up to date', s.status, s.created_at
              ]);
              exportToCSV(`tfs-students-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
              notify(`Exported ${students.length} students to CSV spreadsheet.`);
            }}
          />
        )}

        {/* Student Progress Tracking & Evaluation Modal */}
        {studentForProgress && (
          <StudentProgressModal
            student={studentForProgress}
            curriculumItems={curriculumItems}
            onClose={() => setStudentForProgress(null)}
            onSaveProgress={handleSaveProgress}
          />
        )}

        {/* 3. FEE PAYMENTS (Dedicated Section) */}
        {section === 'feepayments' && (
          <FeePaymentsSection
            payments={feePayments}
            editing={editingPayment}
            setEditing={setEditingPayment}
            isAdding={isAddingPayment}
            setIsAdding={setIsAddingPayment}
            onVerify={handleVerifyFeePayment}
            onReject={handleRejectFeePayment}
            onSaveRecord={handleSavePaymentRecord}
            onAskDelete={(id, name) => setPaymentToDelete({ id, name })}
            onExportPayments={() => {
              const headers = [
                'Payment Ref', 'Date', 'Student Name', 'Student Email', 'Payer Name',
                'Curriculum', 'Class Plan', 'Amount', 'UTR / Ref', 'Status', 'Notes'
              ];
              const rows = feePayments.map((p) => [
                p.payment_reference || p.id, p.timestamp, p.student_name, p.student_email,
                p.payer_name, p.curriculum, p.class_type, p.amount, p.utr, p.payment_status, p.notes || ''
              ]);
              exportToCSV(`tfs-fee-payments-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
              notify(`Exported ${feePayments.length} fee payment records to CSV spreadsheet.`);
            }}
          />
        )}

        {/* 4. ADMISSIONS */}
        {section === 'admissions' && (
          <AdmissionsSection
            admissions={admissions}
            sheetSyncing={sheetSyncing}
            onRefreshSheet={handleSyncWithSpreadsheet}
            onPushToSheet={handlePushUnsyncedToSheet}
            onEnrollStudent={handleEnrollAdmissionStudent}
            onUpdateStatus={handleUpdateAdmissionStatus}
            onAskDelete={(id, name) => setAdmissionToDelete({ id, name })}
            onOpenSettings={() => setShowConfigModal(true)}
          />
        )}

        {/* 5. FEE PLANS */}
        {section === 'fees' && (
          <FeePlansSection
            plans={fees}
            editing={editingFee}
            setEditing={setEditingFee}
            onSave={async (val) => {
              await saveFeePlan(val);
              setFees(await loadFeePlans());
              setEditingFee(null);
              notify('Fee plan saved.');
            }}
            onDelete={async (id) => {
              if (window.confirm('Delete this fee plan?')) {
                const plan = fees.find((f) => f.id === id);
                await deleteFeePlan(id, plan?.name);
                setFees(await loadFeePlans());
                notify('Fee plan deleted.');
              }
            }}
          />
        )}

        {/* 6. CURRICULUM */}
        {section === 'curriculum' && (
          <CurriculumSection
            items={curriculumItems}
            editing={editingCurriculum}
            setEditing={setEditingCurriculum}
            onSave={async (val) => {
              await saveCurriculumItem(val);
              setCurriculumItems(await loadCurriculumItems());
              setEditingCurriculum(null);
              notify('Curriculum module saved.');
            }}
            onDelete={async (id) => {
              if (window.confirm('Delete this curriculum module?')) {
                const item = curriculumItems.find((c) => c.id === id);
                await deleteCurriculumItem(id, item?.title);
                setCurriculumItems(await loadCurriculumItems());
                notify('Curriculum module deleted.');
              }
            }}
          />
        )}

        {/* 7. ADD-ONS */}
        {section === 'addons' && (
          <AddonsSection
            items={addons}
            editing={editingAddon}
            setEditing={setEditingAddon}
            onSave={async (val) => {
              await saveAddOn(val);
              setAddons(await loadAddOns());
              setEditingAddon(null);
              notify('Add-on saved.');
            }}
            onDelete={async (id) => {
              if (window.confirm('Delete this add-on?')) {
                const add = addons.find((a) => a.id === id);
                await deleteAddOn(id, add?.name);
                setAddons(await loadAddOns());
                notify('Add-on deleted.');
              }
            }}
          />
        )}

        {/* 8. SCHEDULE */}
        {section === 'schedule' && (
          <ScheduleSection
            items={scheduleItems}
            editing={editingSchedule}
            setEditing={setEditingSchedule}
            onSave={async (val) => {
              await saveScheduleItem(val);
              setScheduleItems(await loadScheduleItems());
              setEditingSchedule(null);
              notify('Schedule window saved.');
            }}
            onDelete={async (id) => {
              if (window.confirm('Delete this schedule?')) {
                const sch = scheduleItems.find((s) => s.id === id);
                await deleteScheduleItem(id, sch?.title);
                setScheduleItems(await loadScheduleItems());
                notify('Schedule window deleted.');
              }
            }}
          />
        )}

        {/* 9. DISCOUNTS */}
        {section === 'discounts' && (
          <DiscountsSection
            discounts={discounts}
            editing={editingDiscount}
            setEditing={setEditingDiscount}
            onSave={async (val) => {
              await supabaseAdmin.from('discounts').upsert(val);
              const { data } = await supabaseAdmin.from('discounts').select('*');
              if (data) setDiscounts(data);
              setEditingDiscount(null);
              notify('Discount coupon saved.');
            }}
            onDelete={async (id) => {
              if (window.confirm('Delete this discount coupon?')) {
                try {
                  if (isUuid(id)) {
                    await supabaseAdmin.from('discounts').delete().eq('id', id);
                  } else {
                    const disc = discounts.find((d) => d.id === id);
                    if (disc?.coupon_code) {
                      await supabaseAdmin.from('discounts').delete().eq('coupon_code', disc.coupon_code);
                    }
                  }
                } catch (e) {
                  console.warn('Delete discount notice:', e);
                }
                setDiscounts(discounts.filter((d) => d.id !== id));
                notify('Discount coupon deleted.');
              }
            }}
          />
        )}

        {/* 10. BOOKINGS */}
        {section === 'bookings' && (
          <BookingsSection
            bookings={bookings}
            editing={editingBooking}
            setEditing={setEditingBooking}
            onSave={async (val) => {
              await supabaseAdmin.from('bookings').upsert(val);
              const { data } = await supabaseAdmin.from('bookings').select('*');
              if (data) setBookings(data);
              setEditingBooking(null);
              notify('Booking updated.');
            }}
            onDelete={async (id) => {
              if (window.confirm('Delete this booking?')) {
                try {
                  if (isUuid(id)) {
                    await supabaseAdmin.from('bookings').delete().eq('id', id);
                  } else {
                    const b = bookings.find((item) => item.id === id);
                    if (b?.email) {
                      await supabaseAdmin.from('bookings').delete().eq('email', b.email);
                    }
                  }
                } catch (e) {
                  console.warn('Delete booking notice:', e);
                }
                setBookings(bookings.filter((b) => b.id !== id));
                notify('Booking deleted.');
              }
            }}
          />
        )}

        {/* 11. MESSAGES */}
        {section === 'messages' && (
          <MessagesSection
            requests={requests}
            onSave={async (val) => {
              await supabaseAdmin.from('student_requests').upsert(val);
              const { data } = await supabaseAdmin.from('student_requests').select('*');
              if (data) setRequests(data);
              broadcastSync('requests', 'update', val.id);
              notify('Message updated.');
            }}
            onDelete={async (id) => {
              if (window.confirm('Delete this message?')) {
                try {
                  if (isUuid(id)) {
                    await supabaseAdmin.from('student_requests').delete().eq('id', id);
                  } else {
                    const req = requests.find((r) => r.id === id);
                    if (req?.student_email) {
                      await supabaseAdmin.from('student_requests').delete().eq('student_email', req.student_email);
                    }
                  }
                  broadcastSync('requests', 'delete', id);
                } catch (e) {
                  console.warn('Delete message notice:', e);
                }
                setRequests(requests.filter((r) => r.id !== id));
                notify('Message deleted.');
              }
            }}
          />
        )}
      </main>

      {/* Spreadsheet / Google Apps Script Configuration Modal */}
      {showConfigModal && (
        <div className="tfs-modal-overlay">
          <div className="tfs-modal-card" style={{ maxWidth: '600px' }}>
            <div className="tfs-modal-header">
              <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '1.25rem' }}>Google Sheets &amp; Apps Script Setup</h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="tfs-modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Configure your Google Apps Script Web App URL and Google Sheet link so admission forms and fee payment notifications flow directly into your database.
              </p>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  Apps Script Web App Exec URL (Ending with <code>/exec</code>)
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={apiUrlConfig}
                    onChange={(e) => setApiUrlConfig(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontFamily: 'monospace',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  Google Sheet URL (Spreadsheet)
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    value={sheetUrlConfig}
                    onChange={(e) => setSheetUrlConfig(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="tfs-modal-footer">
              <button
                type="button"
                className="portal-btn-secondary"
                onClick={() => setShowConfigModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-save"
                style={{ margin: 0 }}
                onClick={() => {
                  setAdmissionApiUrl(apiUrlConfig);
                  setGoogleSheetUrl(sheetUrlConfig);
                  setShowConfigModal(false);
                  notify('Google Apps Script and Sheet URLs saved successfully.');
                }}
              >
                <Check size={16} /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="tfs-modal-overlay">
          <div className="tfs-modal-card" style={{ maxWidth: '440px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ color: '#ff6b6b', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Trash2 size={40} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#fff' }}>Delete Student Profile?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Are you sure you want to delete <b>{studentToDelete.name}</b> from the database? This action will permanently remove their student account, profile, and portal access.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="portal-btn-secondary"
                onClick={() => setStudentToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-save"
                style={{ background: '#ff4d4d', color: '#fff', borderColor: '#ff4d4d', margin: 0 }}
                onClick={async () => {
                  const { id, name, email } = studentToDelete;
                  setStudentToDelete(null);
                  await handleDeleteStudent(id, name, email);
                }}
              >
                Yes, Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admission Confirmation Modal */}
      {admissionToDelete && (
        <div className="tfs-modal-overlay">
          <div className="tfs-modal-card" style={{ maxWidth: '440px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ color: '#ff6b6b', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Trash2 size={40} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#fff' }}>Delete Admission Record?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Are you sure you want to delete the admission submission for <b>{admissionToDelete.name}</b>?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="portal-btn-secondary"
                onClick={() => setAdmissionToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-save"
                style={{ background: '#ff4d4d', color: '#fff', borderColor: '#ff4d4d', margin: 0 }}
                onClick={() => {
                  const { id, name } = admissionToDelete;
                  setAdmissionToDelete(null);
                  handleDeleteAdmission(id, name);
                }}
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Fee Payment Confirmation Modal */}
      {paymentToDelete && (
        <div className="tfs-modal-overlay">
          <div className="tfs-modal-card" style={{ maxWidth: '440px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ color: '#ff6b6b', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Trash2 size={40} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#fff' }}>Delete Payment Record?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Are you sure you want to delete the fee payment submission for <b>{paymentToDelete.name}</b>?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="portal-btn-secondary"
                onClick={() => setPaymentToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-save"
                style={{ background: '#ff4d4d', color: '#fff', borderColor: '#ff4d4d', margin: 0 }}
                onClick={() => {
                  const { id, name } = paymentToDelete;
                  setPaymentToDelete(null);
                  handleDeleteFeePayment(id, name);
                }}
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SECTION COMPONENTS
// =========================================================================

// --- 1. OVERVIEW SECTION ---
const OverviewSection = ({
  students,
  fees,
  admissions,
  feePayments,
  bookings,
  requests,
  onNavigate,
  loading,
}: {
  students: StudentProfile[];
  fees: FeePlan[];
  admissions: AdmissionSubmission[];
  feePayments: FeePaymentRecord[];
  bookings: RecordValue[];
  requests: RecordValue[];
  onNavigate: (s: Section) => void;
  loading: boolean;
}) => {
  const pendingPayments = feePayments.filter((p) => p.payment_status === 'PENDING VERIFICATION').length;
  const pendingAdmissions = admissions.filter((a) => a.payment_status === 'PENDING VERIFICATION').length;
  const activeStudents = students.filter((s) => s.status === 'active').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;

  return (
    <>
      <section className="admin-stat-grid">
        <div className="admin-stat">
          <Users size={20} color="var(--gold)" />
          <span>Active Students</span>
          <strong>{activeStudents}</strong>
          <small>{students.length} synced student accounts</small>
        </div>
        <div className="admin-stat">
          <CreditCard size={20} color="var(--gold)" />
          <span>Pending Fee Payments</span>
          <strong>{pendingPayments}</strong>
          <small>{feePayments.length} total payments</small>
        </div>
        <div className="admin-stat">
          <FileText size={20} color="var(--gold)" />
          <span>Pending Admissions</span>
          <strong>{pendingAdmissions}</strong>
          <small>{admissions.length} admissions</small>
        </div>
        <div className="admin-stat">
          <CircleDollarSign size={20} color="var(--gold)" />
          <span>Active Fee Plans</span>
          <strong>{fees.length}</strong>
          <small>{loading ? 'Loading...' : `${bookings.length} enquiries · ${pendingRequests} pending requests`}</small>
        </div>
      </section>

      <div className="admin-grid-two">
        {/* Recent Enrolled Students */}
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker">Database Roster</p>
              <h2>Enrolled Students</h2>
            </div>
            <button className="admin-link" onClick={() => onNavigate('students')}>
              All students ({students.length}) →
            </button>
          </div>
          {students.length === 0 ? (
            <p className="admin-empty">No student records found in database.</p>
          ) : (
            students.slice(0, 5).map((student) => (
              <div className="booking-row" key={student.id}>
                <div className="booking-avatar">
                  {student.avatar_url ? (
                    <img src={student.avatar_url} alt={student.first_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    (student.first_name || 'S').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="booking-person">
                  <b>{`${student.first_name} ${student.last_name}`.trim()}</b>
                  <small>{student.email} · {student.curriculum} ({student.class_schedule || 'Active Plan'})</small>
                </div>
                <span
                  className="booking-badge"
                  style={{
                    background: student.status === 'active' ? 'rgba(40,167,69,0.2)' : 'rgba(212,175,55,0.2)',
                    color: student.status === 'active' ? '#5dd37a' : 'var(--gold)',
                  }}
                >
                  {student.fee_status || student.status || 'Active'}
                </span>
              </div>
            ))
          )}
        </section>

        {/* Recent Fee Payments & Quick Shortcuts */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker">Recent Activity</p>
                <h2>Latest Student Fee Payments</h2>
              </div>
              <button className="admin-link" onClick={() => onNavigate('feepayments')}>
                All payments →
              </button>
            </div>
            {feePayments.length === 0 ? (
              <p className="admin-empty">No fee payment submissions recorded yet.</p>
            ) : (
              feePayments.slice(0, 4).map((pay) => (
                <div className="booking-row" key={pay.id || pay.payment_reference}>
                  <div className="booking-avatar">{(pay.student_name || 'S').charAt(0).toUpperCase()}</div>
                  <div className="booking-person">
                    <b>{pay.student_name}</b>
                    <small>{pay.student_email} · ₹{pay.amount.toLocaleString('en-IN')}</small>
                  </div>
                  <span
                    className="booking-badge"
                    style={{
                      background:
                        pay.payment_status === 'VERIFIED'
                          ? 'rgba(40,167,69,0.2)'
                          : pay.payment_status === 'REJECTED'
                            ? 'rgba(220,53,69,0.2)'
                            : 'rgba(212,175,55,0.2)',
                      color:
                        pay.payment_status === 'VERIFIED'
                          ? '#5dd37a'
                          : pay.payment_status === 'REJECTED'
                            ? '#ff6b6b'
                            : 'var(--gold)',
                    }}
                  >
                    {pay.payment_status}
                  </span>
                </div>
              ))
            )}
          </section>

          {/* Quick Management Shortcuts */}
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker">Control Center</p>
                <h2>Quick Actions</h2>
              </div>
            </div>
            <button className="admin-action" onClick={() => onNavigate('students')}>
              <Users size={18} /> Manage Student Accounts ({students.length}) &amp; Plans
            </button>
            <button className="admin-action" onClick={() => onNavigate('feepayments')}>
              <CreditCard size={18} /> Review &amp; Verify Monthly Fees ({feePayments.length})
            </button>
            <button className="admin-action" onClick={() => onNavigate('admissions')}>
              <FileText size={18} /> Review Admission Applications ({admissions.length})
            </button>
            <button className="admin-action" onClick={() => onNavigate('fees')}>
              <CircleDollarSign size={18} /> Configure Tuition Fee Plans ({fees.length})
            </button>
            <button className="admin-action" onClick={() => onNavigate('curriculum')}>
              <BookOpen size={18} /> Update Curriculum Modules
            </button>
          </section>
        </div>
      </div>
    </>
  );
};

// --- 2. STUDENTS SECTION (With Dynamic Database Selects) ---
const StudentsSection = ({
  students,
  search,
  setSearch,
  editing,
  setEditing,
  isAdding,
  setIsAdding,
  onSave,
  onAskDelete,
  onExportStudents,
  onManageProgress,
  feePlans = [],
  addonsList = [],
  scheduleList = [],
}: {
  students: StudentProfile[];
  search: string;
  setSearch: (s: string) => void;
  editing: StudentProfile | null;
  setEditing: (s: StudentProfile | null) => void;
  isAdding: boolean;
  setIsAdding: (b: boolean) => void;
  onSave: (s: StudentProfile) => Promise<void>;
  onAskDelete: (id: string, name: string, email?: string) => void;
  onExportStudents: () => void;
  onManageProgress?: (s: StudentProfile) => void;
  curriculumItems?: CurriculumItem[];
  feePlans?: FeePlan[];
  addonsList?: AddOn[];
  scheduleList?: ScheduleItem[];
}) => {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        `${s.first_name} ${s.last_name} ${s.email} ${s.phone_number} ${s.curriculum} ${s.class_schedule} ${s.admission_id}`
          .toLowerCase()
          .includes(q)
    );
  }, [search, students]);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Student Roster</p>
          <h2>Student Accounts &amp; Plans</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="admin-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
            />
          </label>
          <button
            className="admin-save"
            style={{ margin: 0, whiteSpace: 'nowrap' }}
            onClick={onExportStudents}
            disabled={!students.length}
          >
            Export CSV
          </button>
          <button
            className="admin-save"
            style={{ margin: 0, whiteSpace: 'nowrap' }}
            onClick={() => {
              setIsAdding(true);
              const defaultPlanStr = feePlans[0]
                ? `${feePlans[0].name} — ₹${feePlans[0].amount.toLocaleString('en-IN')}/${feePlans[0].billing_period || 'month'}`
                : 'Home Visit — ₹1,500/month';
              const defaultFee = feePlans[0] ? Number(feePlans[0].amount) : 1500;
              const defaultSchedStr = scheduleList[0]
                ? `${scheduleList[0].day_label} — ${scheduleList[0].time_label}`
                : 'Friday — 8:00 PM – 11:00 PM';

              setEditing({
                id: '',
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                curriculum: 'Guitar',
                class_schedule: defaultPlanStr,
                preferred_schedule: defaultSchedStr,
                addons: [],
                monthly_fee: defaultFee,
                profession: '',
                address: '',
                status: 'active',
                admission_id: '',
                admission_fee_paid: true,
                fee_status: 'Up to date',
                created_at: new Date().toISOString(),
              });
            }}
          >
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      {/* Editing Modal / Drawer */}
      {(editing || isAdding) && editing && (
        <StudentEditModal
          student={editing}
          onCancel={() => {
            setEditing(null);
            setIsAdding(false);
          }}
          onSave={onSave}
          feePlans={feePlans}
          addonsList={addonsList}
          scheduleList={scheduleList}
        />
      )}

      {/* Table */}
      <div className="admin-table">
        <div className="admin-table-row admin-table-head">
          <span>Student</span>
          <span>Curriculum &amp; Plan</span>
          <span>Fee Status</span>
          <span>Actions</span>
        </div>
        {filtered.length === 0 ? (
          <p className="admin-empty">No students found matching your criteria.</p>
        ) : (
          filtered.map((student) => (
            <div className="admin-table-row" key={student.id}>
              <span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="portal-avatar-wrap" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt={student.first_name} className="portal-avatar-img" />
                    ) : (
                      <div className="portal-avatar-initials" style={{ width: '40px', height: '40px', fontSize: '0.95rem' }}>
                        {(student.first_name || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <b style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {`${student.first_name} ${student.last_name}`.trim() || 'Student'}
                    </b>
                    <small style={{ display: 'block', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {student.email || 'No email'}
                    </small>
                    <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
                      {student.phone_number || 'No phone'}
                    </small>
                    {student.admission_id && (
                      <small style={{ color: 'var(--gold)', fontFamily: 'monospace', display: 'inline-block', marginTop: '0.15rem' }}>
                        Adm: {student.admission_id}
                      </small>
                    )}
                  </div>
                </div>
              </span>
              <span style={{ minWidth: 0 }}>
                <b style={{ color: '#fff', display: 'block' }}>{student.curriculum || 'Guitar'}</b>
                <small style={{ display: 'block', color: 'var(--text-secondary)' }}>{student.class_schedule || 'Active Plan'}</small>
                <small style={{ display: 'block', color: 'var(--text-secondary)' }}>Slot: {student.preferred_schedule || 'Flexible'}</small>
                {student.addons && student.addons.length > 0 && (
                  <small style={{ color: '#5dd37a', display: 'block' }}>+ {student.addons.join(', ')}</small>
                )}

                {/* Live Progress Bar in Admin Row */}
                <div style={{ marginTop: '0.45rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => onManageProgress && onManageProgress(student)}
                      className="admin-link"
                      style={{ padding: 0, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--gold)' }}
                      title="Open Syllabus & Evaluation Control Modal"
                    >
                      <GraduationCap size={13} />
                      <b>Progress Control</b>
                    </button>
                    <b style={{ color: (student.overall_progress_pct || 0) >= 80 ? '#5dd37a' : 'var(--gold)' }}>
                      {student.overall_progress_pct !== undefined ? `${student.overall_progress_pct}%` : '0%'}
                    </b>
                  </div>
                  <div
                    onClick={() => onManageProgress && onManageProgress(student)}
                    title="Click to control student syllabus & evaluations"
                    style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <div
                      style={{
                        width: `${student.overall_progress_pct || 0}%`,
                        height: '100%',
                        background: (student.overall_progress_pct || 0) >= 80 ? '#5dd37a' : 'var(--gold)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  {student.instructor_feedback && (
                    <small style={{ display: 'block', marginTop: '0.25rem', color: '#f6e7b2', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Note: "{student.instructor_feedback}"
                    </small>
                  )}
                </div>
              </span>
              <span style={{ minWidth: 0 }}>
                <b style={{ color: 'var(--gold)', display: 'block', fontSize: '1.05rem' }}>
                  ₹{(student.monthly_fee || 1300).toLocaleString('en-IN')}/mo
                </b>
                <span
                  className="booking-badge"
                  style={{
                    display: 'inline-block',
                    marginTop: '0.35rem',
                    background:
                      student.fee_status === 'Up to date'
                        ? 'rgba(40,167,69,0.2)'
                        : student.fee_status === 'Overdue'
                          ? 'rgba(220,53,69,0.2)'
                          : 'rgba(212,175,55,0.2)',
                    color:
                      student.fee_status === 'Up to date'
                        ? '#5dd37a'
                        : student.fee_status === 'Overdue'
                          ? '#ff6b6b'
                          : 'var(--gold)',
                  }}
                >
                  {student.fee_status || 'Up to date'}
                </span>
                <span
                  style={{
                    display: 'block',
                    marginTop: '0.2rem',
                    fontSize: '0.72rem',
                    color: student.status === 'active' ? '#5dd37a' : 'var(--text-secondary)',
                  }}
                >
                  Status: {student.status}
                </span>
              </span>
              <span className="admin-row-actions">
                <button
                  type="button"
                  title="Control Syllabus Progress & Feedback"
                  onClick={() => onManageProgress && onManageProgress(student)}
                  style={{ color: 'var(--gold)', borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.12)' }}
                >
                  <Award size={15} />
                </button>
                <button title="Edit Student Profile & Plans" onClick={() => setEditing(student)}>
                  <Pencil size={15} />
                </button>
                <button
                  title="Remove Student Profile"
                  onClick={() =>
                    onAskDelete(student.id, `${student.first_name} ${student.last_name}`.trim(), student.email)
                  }
                >
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

// --- Student Progress & Evaluation Modal (Admin Control) ---
const StudentProgressModal = ({
  student,
  curriculumItems = [],
  onClose,
  onSaveProgress,
}: {
  student: StudentProfile;
  curriculumItems?: CurriculumItem[];
  onClose: () => void;
  onSaveProgress: (
    studentId: string,
    progress: Record<string, 'not_started' | 'in_progress' | 'mastered'>,
    feedback?: string,
    badges?: string[]
  ) => Promise<void>;
}) => {
  const isGuitar = (student.curriculum || '').toLowerCase().includes('guitar');
  const isUkulele = (student.curriculum || '').toLowerCase().includes('ukulele');

  const defaultGuitarModules = useMemo(() => [
    { id: 'g-mod-1', title: 'Fundamentals of Fretboard & Posture', category: 'Foundation', description: 'Hand anatomy, thumb anchoring, string names, tuning, pick grip & chromatic exercises.' },
    { id: 'g-mod-2', title: 'Open Position Major & Minor Chords', category: 'Chords', description: 'C, G, D, Em, Am, E, A, Dm chord shapes, clean finger placement and transitions.' },
    { id: 'g-mod-3', title: 'Strumming Dynamics & Time Signatures', category: 'Rhythm', description: 'Down/up mechanics, 4/4 and 3/4 grooves, syncopated accents, and metronome timing.' },
    { id: 'g-mod-4', title: 'Pentatonic & Blues Scales', category: 'Scales', description: 'Minor and Major pentatonic boxes, blue notes, string bending, and vibrato fundamentals.' },
    { id: 'g-mod-5', title: 'Barre Chords & Moveable Shapes', category: 'Chords', description: 'Root-6 (E shape) and Root-5 (A shape) major, minor, and 7th barre chords across the neck.' },
    { id: 'g-mod-6', title: 'Fingerstyle & Hybrid Picking', category: 'Technique', description: 'Travis picking, bass-melody independence, P-I-M-A arpeggio patterns, and dynamic touch.' },
    { id: 'g-mod-7', title: 'Major Scale Modes & Fretboard Roadmap', category: 'Theory', description: 'Ionian, Dorian, Mixolydian, Aeolian modes, interval recognition, and 3-notes-per-string patterns.' },
    { id: 'g-mod-8', title: 'Harmonic Extensions & Chord Solos', category: 'Advanced', description: 'Dominant 7ths, Maj7, Min7, 9th chords, jazz-blues voice leading, and chord-melody arrangements.' },
    { id: 'g-mod-9', title: 'Ear Training & Relative Pitch', category: 'Ear Training', description: 'Transcribing riffs by ear, interval recognition, chord progression identification (I-IV-V, ii-V-I).' },
    { id: 'g-mod-10', title: 'Improvisation & Repertoire Performance', category: 'Performance', description: 'Targeting chord tones over backing tracks, phrasing, solo structure, and performance mastery.' },
  ], []);

  const defaultUkuleleModules = useMemo(() => [
    { id: 'u-mod-1', title: 'Ukulele Anatomy, Tuning & Pitch', category: 'Foundation', description: 'G-C-E-A tuning, string numbering, ergonomic posture, and clean fretting.' },
    { id: 'u-mod-2', title: 'Core Chords (C, G, Am, F, Em, Dm)', category: 'Chords', description: 'Open chord grips, smooth muscle memory shifts, and clear string ringing.' },
    { id: 'u-mod-3', title: 'Island Strumming & Calypso Rhythms', category: 'Rhythm', description: 'Syncopated chunking (dampened strums), calypso pattern (D-DU-UDU), and swing feel.' },
    { id: 'u-mod-4', title: 'Fingerpicking & Chord-Melody Solos', category: 'Technique', description: 'Thumb-index-middle finger rolls, campanella picking style, and solo arrangements.' },
    { id: 'u-mod-5', title: 'Dotara Ukulele Techniques & Folk Stylings', category: 'Specialty', description: 'Open tuning resonance, drone strings, Bengali folk ornaments, meend and gamak inflections.' },
    { id: 'u-mod-6', title: 'Advanced Repertoire & Stage Performance', category: 'Performance', description: 'Arranging songs, vocal accompaniment, stage dynamics, and live session readiness.' },
  ], []);

  const activeModules = useMemo(() => {
    if (curriculumItems && curriculumItems.length > 0) {
      const filtered = curriculumItems.filter((c) => {
        if (isGuitar) return c.instrument === 'guitar' || !c.instrument;
        if (isUkulele) return c.instrument?.includes('ukulele') || !c.instrument;
        return true;
      });
      if (filtered.length >= 4) {
        return filtered.map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category || 'Core',
          description: c.description,
        }));
      }
    }
    return isUkulele ? defaultUkuleleModules : defaultGuitarModules;
  }, [curriculumItems, isGuitar, isUkulele, defaultGuitarModules, defaultUkuleleModules]);

  const [progress, setProgress] = useState<Record<string, 'not_started' | 'in_progress' | 'mastered'>>(() => {
    return student.module_progress || {};
  });

  const [feedback, setFeedback] = useState(student.instructor_feedback || '');
  const [badges, setBadges] = useState<string[]>(student.milestone_badges || []);
  const [saving, setSaving] = useState(false);

  // Compute live progress percentage
  const total = activeModules.length;
  const masteredCount = activeModules.filter((m) => progress[m.id] === 'mastered').length;
  const inProgressCount = activeModules.filter((m) => progress[m.id] === 'in_progress').length;
  const pct = total > 0 ? Math.round(((masteredCount * 1.0 + inProgressCount * 0.5) / total) * 100) : 0;

  const handleSetStatus = (modId: string, status: 'not_started' | 'in_progress' | 'mastered') => {
    setProgress((prev) => ({ ...prev, [modId]: status }));
  };

  const handleSetAll = (status: 'not_started' | 'in_progress' | 'mastered') => {
    const updated: Record<string, 'not_started' | 'in_progress' | 'mastered'> = {};
    activeModules.forEach((m) => {
      updated[m.id] = status;
    });
    setProgress(updated);
  };

  const availableBadges = [
    '🎸 Fretboard Navigator',
    '🥁 Rhythm Virtuoso',
    '🎼 Harmony Specialist',
    '⚡ Speed & Articulation',
    '🎓 TFS Certified',
    '🌟 Honor Student',
  ];

  const handleToggleBadge = (b: string) => {
    setBadges((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveProgress(student.id, progress, feedback, badges);
    setSaving(false);
  };

  return (
    <div className="tfs-modal-overlay">
      <div className="tfs-modal-card">
        {/* Header */}
        <div className="tfs-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Award size={22} style={{ color: 'var(--gold)' }} />
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--gold)' }}>
                Progress &amp; Evaluation Control
              </h2>
            </div>
            <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Student: <b style={{ color: '#fff' }}>{`${student.first_name} ${student.last_name}`.trim()}</b> ({student.email}) · Track: <b style={{ color: 'var(--gold)' }}>{student.curriculum}</b>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="tfs-modal-body">
          {/* Live Mastery Banner */}
          <div style={{ padding: '1rem 1.25rem', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Overall Syllabus Mastery</span>
              <strong style={{ fontSize: '1.3rem', color: pct >= 80 ? '#5dd37a' : 'var(--gold)' }}>{pct}% Complete</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.6rem' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#5dd37a' : 'var(--gold)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>{masteredCount} Mastered · {inProgressCount} In Progress · {total - masteredCount - inProgressCount} Not Started</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleSetAll('in_progress')}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--gold)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  All Learning
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll('mastered')}
                  style={{ background: 'rgba(93,211,122,0.15)', border: '1px solid rgba(93,211,122,0.3)', color: '#5dd37a', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  All Mastered
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll('not_started')}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Modules List */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {activeModules.map((mod, idx) => {
                const currentStatus = progress[mod.id] || 'not_started';
                return (
                  <div
                    key={mod.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: currentStatus === 'mastered' ? 'rgba(93,211,122,0.06)' : currentStatus === 'in_progress' ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                      border: currentStatus === 'mastered' ? '1px solid rgba(93,211,122,0.25)' : currentStatus === 'in_progress' ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ flex: '1 1 280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', fontWeight: 600 }}>
                          Module {idx + 1}
                        </span>
                        <b style={{ color: '#fff', fontSize: '0.92rem' }}>{mod.title}</b>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {mod.description}
                      </p>
                    </div>

                    {/* 3-State Segmented Control */}
                    <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(mod.id, 'not_started')}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: currentStatus === 'not_started' ? 'rgba(255,255,255,0.12)' : 'transparent',
                          color: currentStatus === 'not_started' ? '#fff' : 'var(--text-secondary)',
                        }}
                      >
                        ○ Not Started
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(mod.id, 'in_progress')}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: currentStatus === 'in_progress' ? 'rgba(212,175,55,0.25)' : 'transparent',
                          color: currentStatus === 'in_progress' ? 'var(--gold)' : 'var(--text-secondary)',
                        }}
                      >
                        ⏳ Learning
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(mod.id, 'mastered')}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: currentStatus === 'mastered' ? 'rgba(93,211,122,0.25)' : 'transparent',
                          color: currentStatus === 'mastered' ? '#5dd37a' : 'var(--text-secondary)',
                        }}
                      >
                        ✓ Mastered
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone Badges Awarded */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              Award Student Milestone Badges:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availableBadges.map((badge) => {
                const active = badges.includes(badge);
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => handleToggleBadge(badge)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: active ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.03)',
                      border: active ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                      color: active ? 'var(--gold)' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {badge} {active ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructor Evaluation Notes */}
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.4rem', fontWeight: 600 }}>
              Instructor Feedback &amp; Lesson Notes (Visible in Student Corner):
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Excellent progress on barre chords! For next week, practice F#m with metronome at 72bpm..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                font: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="tfs-modal-footer">
          <button
            type="button"
            className="portal-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="admin-save"
            style={{ margin: 0 }}
          >
            <Check size={18} />
            {saving ? 'Syncing...' : 'Save & Sync Progress'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Interactive Circular Clock Dial Time Picker
const ClockDialPicker = ({
  value,
  onChange,
}: {
  value: string; // e.g. "10:30 AM" or "10am - 1pm"
  onChange: (val: string) => void;
}) => {
  // Parse initial hour, minute, period
  const parseTime = (str: string) => {
    const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    let h = 10;
    let m = 0;
    let p: 'AM' | 'PM' = 'AM';
    if (match) {
      h = parseInt(match[1], 10);
      if (h > 12) {
        h = h - 12;
        p = 'PM';
      } else if (h === 0) {
        h = 12;
      }
      if (match[2]) m = parseInt(match[2], 10);
      if (match[3]) p = match[3].toUpperCase() as 'AM' | 'PM';
    }
    return { h, m, p };
  };

  const initial = parseTime(value || '10:00 AM');
  const [hour, setHour] = useState(initial.h);
  const [minute, setMinute] = useState(initial.m);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.p);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  const updateTime = (newH: number, newM: number, newP: 'AM' | 'PM') => {
    const minStr = String(newM).padStart(2, '0');
    onChange(`${newH}:${minStr} ${newP}`);
  };

  const handleSelectHour = (h: number) => {
    setHour(h);
    updateTime(h, minute, period);
    setMode('minute');
  };

  const handleSelectMinute = (m: number) => {
    setMinute(m);
    updateTime(hour, m, period);
  };

  const handleTogglePeriod = (p: 'AM' | 'PM') => {
    setPeriod(p);
    updateTime(hour, minute, p);
  };

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Radial positions (12 positions in a circle)
  const radius = 68;
  const center = 90;

  return (
    <div
      style={{
        background: '#090c10',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '320px',
        margin: '0 auto',
      }}
    >
      {/* Time Display & Mode Switches */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setMode('hour')}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            background: mode === 'hour' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
            color: mode === 'hour' ? '#000' : '#fff',
            fontWeight: 700,
            fontSize: '1.2rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {String(hour).padStart(2, '0')}
        </button>
        <span style={{ color: 'var(--gold)', fontSize: '1.2rem', fontWeight: 700 }}>:</span>
        <button
          type="button"
          onClick={() => setMode('minute')}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            background: mode === 'minute' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
            color: mode === 'minute' ? '#000' : '#fff',
            fontWeight: 700,
            fontSize: '1.2rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {String(minute).padStart(2, '0')}
        </button>

        {/* AM / PM Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '0.4rem' }}>
          <button
            type="button"
            onClick={() => handleTogglePeriod('AM')}
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: period === 'AM' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
              color: period === 'AM' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handleTogglePeriod('PM')}
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: period === 'PM' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
              color: period === 'PM' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            PM
          </button>
        </div>
      </div>

      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
        Click dial numbers to set {mode === 'hour' ? 'Hour' : 'Minute'}
      </small>

      {/* Clock Face Dial */}
      <div
        style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #151a24 0%, #0d1117 100%)',
          border: '2px solid rgba(212,175,55,0.25)',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
        }}
      >
        {/* Center Pivot */}
        <div
          style={{
            position: 'absolute',
            top: `${center - 4}px`,
            left: `${center - 4}px`,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--gold)',
            zIndex: 3,
          }}
        />

        {/* Dial Numbers */}
        {(mode === 'hour' ? hours : minutes).map((val, idx) => {
          // Angle in radians (0 at top / 12 o'clock, clockwise)
          const angle = (idx * 30 - 90) * (Math.PI / 180);
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          const isSelected = mode === 'hour' ? hour === val : minute === val;

          return (
            <button
              key={val}
              type="button"
              onClick={() => (mode === 'hour' ? handleSelectHour(val) : handleSelectMinute(val))}
              style={{
                position: 'absolute',
                top: `${y - 14}px`,
                left: `${x - 14}px`,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 800 : 500,
                background: isSelected ? 'var(--gold)' : 'transparent',
                color: isSelected ? '#000' : 'rgba(255,255,255,0.85)',
                border: 'none',
                cursor: 'pointer',
                zIndex: 2,
                transition: 'all 0.15s ease',
              }}
            >
              {val}
            </button>
          );
        })}
      </div>
    </div>
  );
};
const StudentEditModal = ({
  student,
  onCancel,
  onSave,
  feePlans = [],
  addonsList = [],
  scheduleList = [],
}: {
  student: StudentProfile;
  onCancel: () => void;
  onSave: (s: StudentProfile) => Promise<void>;
  feePlans?: FeePlan[];
  addonsList?: AddOn[];
  scheduleList?: ScheduleItem[];
}) => {
  const [form, setForm] = useState<StudentProfile>({ ...student });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...student });
  }, [student]);

  // Dynamic plan options
  const planOptions = useMemo(() => {
    if (feePlans.length > 0) {
      return feePlans.map((p) => `${p.name} — ₹${p.amount.toLocaleString('en-IN')}/${p.billing_period || 'month'}`);
    }
    return PREDEFINED_PLANS;
  }, [feePlans]);

  // Dynamic schedule options
  const scheduleOptions = useMemo(() => {
    if (scheduleList.length > 0) {
      return scheduleList.map((s) => `${s.day_label} — ${s.time_label}`);
    }
    return PREDEFINED_SCHEDULES;
  }, [scheduleList]);

  // Dynamic add-ons options
  const addonOptions = useMemo(() => {
    const list = ['None'];
    if (addonsList.length > 0) {
      addonsList.forEach((a) => list.push(`${a.name} — ₹${a.amount.toLocaleString('en-IN')}/month`));
    } else {
      list.push(...PREDEFINED_ADDONS.filter((a) => a !== 'None'));
    }
    return list;
  }, [addonsList]);

  // Helper to format Date into Sunday "YYYY-MM-DD"
  const getNextSunday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
    return d.toISOString().split('T')[0];
  };

  const [scheduleMode, setScheduleMode] = useState<'standard' | 'custom'>(() => {
    const curr = (student.preferred_schedule || '').toLowerCase();
    if (curr.includes('—') && (curr.includes('am') || curr.includes('pm')) && /\d/.test(curr)) {
      return 'custom';
    }
    return 'standard';
  });

  const [sundayDate, setSundayDate] = useState(() => {
    return getNextSunday();
  });
  const [customTime, setCustomTime] = useState('10:00 AM');
  const [sundayError, setSundayError] = useState('');

  const handleSundayDateChange = (dateVal: string) => {
    setSundayDate(dateVal);
    if (!dateVal) {
      setSundayError('');
      return;
    }
    const d = new Date(dateVal + 'T00:00:00');
    if (d.getDay() !== 0) {
      setSundayError('Selected day is not Sunday. Sunday classes only.');
    } else {
      setSundayError('');
      const formattedDate = d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setForm((prev) => ({
        ...prev,
        preferred_schedule: `${formattedDate} — ${customTime}`,
      }));
    }
  };

  const handleCustomTimeChange = (timeVal: string) => {
    setCustomTime(timeVal);
    const d = sundayDate ? new Date(sundayDate + 'T00:00:00') : new Date();
    const formattedDate = d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    setForm((prev) => ({
      ...prev,
      preferred_schedule: `${formattedDate} — ${timeVal}`,
    }));
  };

  // Recalculate fee dynamically when plan or addons change
  const handlePlanChange = (plan: string) => {
    let base = 1500;
    const match = feePlans.find((f) => plan.toLowerCase().includes(f.name.toLowerCase()));
    if (match) base = Number(match.amount);
    else if (plan.includes('1,500') || plan.includes('1500')) base = 1500;
    else if (plan.includes('1,300') || plan.includes('1300')) base = 1300;
    else if (plan.includes('1,000') || plan.includes('1000')) base = 1000;
    else if (plan.includes('900')) base = 900;

    let addonFee = 0;
    (form.addons || []).forEach((a) => {
      const matchAddon = addonsList.find((add) => a.toLowerCase().includes(add.name.toLowerCase()));
      if (matchAddon) addonFee += Number(matchAddon.amount);
      else if (a.includes('500')) addonFee += 500;
      else if (a.includes('1,500') || a.includes('1500')) addonFee += 1500;
    });

    setForm({
      ...form,
      class_schedule: plan,
      monthly_fee: base + addonFee,
    });
  };

  const handleAddonChange = (addonOption: string) => {
    let newAddons: string[] = [];
    if (addonOption && addonOption !== 'None') {
      newAddons = [addonOption];
    }

    let base = 1500;
    const match = feePlans.find((f) => form.class_schedule.toLowerCase().includes(f.name.toLowerCase()));
    if (match) base = Number(match.amount);
    else if (form.class_schedule.includes('1,500') || form.class_schedule.includes('1500')) base = 1500;
    else if (form.class_schedule.includes('1,300') || form.class_schedule.includes('1300')) base = 1300;
    else if (form.class_schedule.includes('1,000') || form.class_schedule.includes('1000')) base = 1000;
    else if (form.class_schedule.includes('900')) base = 900;

    let addonFee = 0;
    newAddons.forEach((a) => {
      const matchAddon = addonsList.find((add) => a.toLowerCase().includes(add.name.toLowerCase()));
      if (matchAddon) addonFee += Number(matchAddon.amount);
      else if (a.includes('500')) addonFee += 500;
      else if (a.includes('1,500') || a.includes('1500')) addonFee += 1500;
    });

    setForm({
      ...form,
      addons: newAddons,
      monthly_fee: base + addonFee,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="tfs-modal-overlay">
      <form onSubmit={handleSubmit} className="tfs-modal-card">
        {/* Header */}
        <div className="tfs-modal-header">
          <div>
            <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '1.3rem' }}>
              {student.id && !student.id.startsWith('std-') ? 'Edit Student Account' : 'Student Account Setup'}
            </h3>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Directly configure student details, curriculum, plan, add-ons, and fees.
            </p>
          </div>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="tfs-modal-body">
          {/* Avatar Photo Management */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem', borderRadius: '12px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '1.25rem' }}>
            <div className="portal-avatar-wrap" style={{ width: 64, height: 64 }}>
              {form.avatar_url ? (
                <img src={form.avatar_url} alt={form.first_name} className="portal-avatar-img" />
              ) : (
                <div className="portal-avatar-initials" style={{ fontSize: '1.3rem' }}>
                  {form.first_name ? form.first_name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                Student Photo / Portal Avatar
              </div>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Displayed on the Student Digital ID pass, portal header, and account profile.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <label className="portal-btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const bucketUrl = await uploadImageToBucket(file, 'students');
                      setForm((prev) => ({ ...prev, avatar_url: bucketUrl }));
                    }}
                  />
                </label>
                {form.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, avatar_url: '' }))}
                    style={{ background: 'none', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Section: Personal Info */}
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              First Name *
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Last Name
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Email Address *
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Phone / WhatsApp
              <input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            {/* Section: PREDEFINED CURRICULUM DROPDOWN */}
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 'bold' }}>
              Curriculum Track (Dropdown) *
              <select
                value={form.curriculum}
                onChange={(e) => setForm({ ...form, curriculum: e.target.value })}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid var(--gold)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
              >
                {PREDEFINED_CURRICULUMS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            {/* Section: DYNAMIC PLAN DROPDOWN */}
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 'bold' }}>
              Tuition Plan (Database Synced) *
              <select
                value={form.class_schedule}
                onChange={(e) => handlePlanChange(e.target.value)}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid var(--gold)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
              >
                {planOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            {/* Section: BATCH SCHEDULE & NEXT CLASS CUSTOMIZATION */}
            <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.6rem', padding: '1rem', background: 'rgba(212,175,55,0.04)', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} /> Student Schedule &amp; Next Class Fixer (Admin Only)
                </span>
                {/* Mode Selector */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleMode('standard');
                      setForm((prev) => ({
                        ...prev,
                        preferred_schedule: scheduleOptions[0] || 'Sunday — 10am - 1pm',
                      }));
                    }}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: scheduleMode === 'standard' ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                      color: scheduleMode === 'standard' ? '#000' : 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    Usual Batch Window
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleMode('custom');
                      const d = sundayDate ? new Date(sundayDate + 'T00:00:00') : new Date();
                      const formattedDate = d.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      setForm((prev) => ({
                        ...prev,
                        preferred_schedule: `${formattedDate} — ${customTime}`,
                      }));
                    }}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: scheduleMode === 'custom' ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                      color: scheduleMode === 'custom' ? '#000' : 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    Custom Sunday &amp; Time Dial
                  </button>
                </div>
              </div>

              {scheduleMode === 'standard' ? (
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Select Standard Batch Schedule Slot
                  <select
                    value={form.preferred_schedule || scheduleOptions[0]}
                    onChange={(e) => setForm({ ...form, preferred_schedule: e.target.value })}
                    style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
                  >
                    {scheduleOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  {/* Sunday Date Picker */}
                  <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span>Next Class Date (Sundays Only) *</span>
                    <input
                      type="date"
                      value={sundayDate}
                      onChange={(e) => handleSundayDateChange(e.target.value)}
                      style={{ padding: '0.75rem', background: '#111', border: sundayError ? '1px solid #ff6b6b' : '1px solid var(--gold)', borderRadius: '8px', color: '#fff' }}
                    />
                    {sundayError && (
                      <span style={{ color: '#ff6b6b', fontSize: '0.75rem' }}>{sundayError}</span>
                    )}
                  </label>

                  {/* Interactive Clock Dial Time Picker */}
                  <div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      Class Time Picker (Dial) *
                    </span>
                    <ClockDialPicker value={customTime} onChange={handleCustomTimeChange} />
                  </div>

                  {/* Fixed Schedule Preview */}
                  <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(93,211,122,0.08)', borderRadius: '6px', border: '1px solid rgba(93,211,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Fixed Schedule Applied:</span>
                    <b style={{ color: '#5dd37a', fontSize: '0.85rem' }}>{form.preferred_schedule}</b>
                  </div>
                </div>
              )}
            </div>

            {/* Section: DYNAMIC ADDONS DROPDOWN */}
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Optional Add-ons (Database Synced)
              <select
                value={(form.addons && form.addons.length > 0) ? form.addons[0] : 'None'}
                onChange={(e) => handleAddonChange(e.target.value)}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
              >
                {addonOptions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            {/* Section: FEE CALCULATION & STATUS */}
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Monthly Fee Payable (₹)
              <input
                type="number"
                value={form.monthly_fee || 1300}
                onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'var(--gold)', fontWeight: 'bold' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Fee Status (Dropdown)
              <select
                value={form.fee_status || 'Up to date'}
                onChange={(e) => setForm({ ...form, fee_status: e.target.value as any })}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
              >
                {PREDEFINED_FEE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            {/* Section: PREDEFINED ACCOUNT STATUS DROPDOWN */}
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Account Status (Dropdown) *
              <select
                value={form.status || 'active'}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
              >
                {PREDEFINED_STUDENT_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Admission ID
              <input
                value={form.admission_id || ''}
                placeholder="e.g. TFS-20261012-ABCDE"
                onChange={(e) => setForm({ ...form, admission_id: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Profession / Occupation
              <input
                value={form.profession || ''}
                placeholder="e.g. Software Engineer, College Student"
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Emergency Contact Name
              <input
                value={form.emergency_contact || ''}
                placeholder="Parent / Guardian / Spouse"
                onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Emergency Phone Number
              <input
                value={form.emergency_phone || ''}
                placeholder="+91 98765 00000"
                onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Student Bio / Background Notes
              <textarea
                rows={2}
                value={form.bio || ''}
                placeholder="Musical experience, goals or background"
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
              />
            </label>

            {/* Full width inputs */}
            <label style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Full Address
              <input
                value={form.address || ''}
                placeholder="Student delivery / visit address"
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </label>

            <label style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Admin Notes / Teacher Comments
              <textarea
                rows={2}
                value={form.notes || ''}
                placeholder="Optional notes regarding progress, payments or custom requirements"
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
              />
            </label>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="tfs-modal-footer">
          <button type="button" className="portal-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="admin-save" style={{ margin: 0 }} disabled={saving}>
            <Check size={18} />
            {saving ? 'Saving...' : 'Save Student Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- 3. FEE PAYMENTS SECTION (Dedicated Fee Management) ---
const FeePaymentsSection = ({
  payments,
  editing,
  setEditing,
  isAdding,
  setIsAdding,
  onVerify,
  onReject,
  onSaveRecord,
  onAskDelete,
  onExportPayments,
}: {
  payments: FeePaymentRecord[];
  editing: FeePaymentRecord | null;
  setEditing: (p: FeePaymentRecord | null) => void;
  isAdding: boolean;
  setIsAdding: (b: boolean) => void;
  onVerify: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onSaveRecord: (p: FeePaymentRecord) => Promise<void>;
  onAskDelete: (id: string, name: string) => void;
  onExportPayments: () => void;
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filter === 'pending' && p.payment_status !== 'PENDING VERIFICATION') return false;
      if (filter === 'verified' && p.payment_status !== 'VERIFIED') return false;
      if (filter === 'rejected' && p.payment_status !== 'REJECTED') return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.student_name.toLowerCase().includes(q) ||
          p.student_email.toLowerCase().includes(q) ||
          p.utr.toLowerCase().includes(q) ||
          p.payment_reference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, filter, search]);

  const totalCollected = payments
    .filter((p) => p.payment_status === 'VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Student Tuition Fees</p>
          <h2>Monthly Fee Payment Submissions</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="admin-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, UTR..."
            />
          </label>
          <button
            className="admin-save"
            style={{ margin: 0, whiteSpace: 'nowrap' }}
            onClick={onExportPayments}
            disabled={!payments.length}
          >
            Export CSV
          </button>
          <button
            className="admin-save"
            style={{ margin: 0, whiteSpace: 'nowrap' }}
            onClick={() => {
              setIsAdding(true);
              setEditing({
                id: `fee-${Date.now()}`,
                timestamp: new Date().toISOString(),
                payment_reference: `TFSFEE${Date.now()}`,
                payment_status: 'VERIFIED',
                utr: '',
                payer_name: '',
                student_name: '',
                student_email: '',
                phone: '',
                curriculum: 'Guitar',
                class_type: 'Home Tuition — ₹1,300/month',
                addons: 'None',
                amount: 1300,
                notes: 'Manual entry by administrator.',
              });
            }}
          >
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px' }}>
          <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Verified Fee Revenue</small>
          <strong style={{ color: 'var(--gold)', fontSize: '1.25rem' }}>₹{totalCollected.toLocaleString('en-IN')}</strong>
        </div>
        <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
          <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Pending Verification</small>
          <strong style={{ color: '#f3d477', fontSize: '1.25rem' }}>
            {payments.filter((p) => p.payment_status === 'PENDING VERIFICATION').length}
          </strong>
        </div>
        <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
          <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Total Submissions</small>
          <strong style={{ color: '#fff', fontSize: '1.25rem' }}>{payments.length}</strong>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['all', 'pending', 'verified', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: filter === tab ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
              background: filter === tab ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: filter === tab ? 'var(--gold)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontSize: '0.8rem',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Editing or Manual Adding Modal */}
      {(editing || isAdding) && editing && (
        <FeePaymentModal
          payment={editing}
          onCancel={() => {
            setEditing(null);
            setIsAdding(false);
          }}
          onSave={onSaveRecord}
        />
      )}

      {/* Payments Table */}
      <div className="admin-table">
        <div className="admin-table-row admin-table-head" style={{ gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(210px, 1.3fr) minmax(180px, 1fr) minmax(240px, 1.3fr)' }}>
          <span>Student &amp; Payer</span>
          <span>Payment Details &amp; UTR</span>
          <span>Status &amp; Date</span>
          <span style={{ textAlign: 'right' }}>Payment Actions</span>
        </div>
        {filtered.length === 0 ? (
          <p className="admin-empty">No fee payment records found for the selected filter.</p>
        ) : (
          filtered.map((pay) => (
            <div
              className="admin-table-row"
              key={pay.id || pay.payment_reference}
              style={{ gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(210px, 1.3fr) minmax(180px, 1fr) minmax(240px, 1.3fr)' }}
            >
              <span>
                <b style={{ fontSize: '0.96rem', color: '#fff' }}>{pay.student_name}</b>
                <small style={{ color: 'var(--gold)' }}>{pay.student_email}</small>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Payer: <span style={{ color: '#fff' }}>{pay.payer_name || 'Self'}</span>
                </small>
              </span>
              <span>
                <b style={{ color: 'var(--gold)', fontSize: '1.05rem' }}>₹{pay.amount.toLocaleString('en-IN')}</b>
                <small style={{ color: 'var(--text-primary)' }}>{pay.curriculum || 'General'} {pay.class_type ? `· ${pay.class_type}` : ''}</small>
                <small style={{ fontFamily: 'monospace', color: '#fff' }}>UTR: {pay.utr || '—'}</small>
                {pay.payment_reference && (
                  <small style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>Ref: {pay.payment_reference}</small>
                )}
              </span>
              <span>
                <span
                  className="booking-badge"
                  style={{
                    display: 'inline-block',
                    width: 'fit-content',
                    background:
                      pay.payment_status === 'VERIFIED'
                        ? 'rgba(40,167,69,0.2)'
                        : pay.payment_status === 'REJECTED'
                          ? 'rgba(220,53,69,0.2)'
                          : 'rgba(212,175,55,0.2)',
                    color:
                      pay.payment_status === 'VERIFIED'
                        ? '#5dd37a'
                        : pay.payment_status === 'REJECTED'
                          ? '#ff6b6b'
                          : 'var(--gold)',
                    fontWeight: 600,
                  }}
                >
                  {pay.payment_status}
                </span>
                <small style={{ display: 'block', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                  {pay.timestamp ? new Date(pay.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </small>
              </span>
              <span className="admin-row-actions">
                {pay.payment_status !== 'VERIFIED' && (
                  <button
                    type="button"
                    className="admin-btn-action action-success"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onVerify(pay.id || pay.payment_reference);
                    }}
                  >
                    <CheckCircle size={14} /> Verify
                  </button>
                )}
                {pay.payment_status !== 'REJECTED' && (
                  <button
                    type="button"
                    className="admin-btn-action action-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onReject(pay.id || pay.payment_reference);
                    }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                )}
                <button
                  type="button"
                  className="admin-btn-icon"
                  title="Edit Record"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(pay);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="admin-btn-icon danger"
                  title="Delete Payment Record"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskDelete(pay.id || pay.payment_reference, pay.student_name);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

// Fee Payment Edit Modal
const FeePaymentModal = ({
  payment,
  onCancel,
  onSave,
}: {
  payment: FeePaymentRecord;
  onCancel: () => void;
  onSave: (p: FeePaymentRecord) => Promise<void>;
}) => {
  const [form, setForm] = useState<FeePaymentRecord>({ ...payment });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <div className="tfs-modal-overlay">
      <form onSubmit={handleSubmit} className="tfs-modal-card" style={{ maxWidth: '650px' }}>
        <div className="tfs-modal-header">
          <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '1.25rem' }}>Fee Payment Record</h3>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div className="tfs-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Student Name *
              <input required value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Student Email *
              <input required type="email" value={form.student_email} onChange={(e) => setForm({ ...form, student_email: e.target.value })} style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Payer Name *
              <input required value={form.payer_name} onChange={(e) => setForm({ ...form, payer_name: e.target.value })} style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              UTR / Transaction ID *
              <input required value={form.utr} onChange={(e) => setForm({ ...form, utr: e.target.value })} style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Curriculum
              <select value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}>
                {PREDEFINED_CURRICULUMS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Class Plan
              <select value={form.class_type} onChange={(e) => setForm({ ...form, class_type: e.target.value })} style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}>
                {PREDEFINED_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Amount Paid (₹) *
              <input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} style={{ padding: '0.75rem', background: '#111', border: '1px solid var(--gold)', borderRadius: '8px', color: 'var(--gold)', fontWeight: 'bold' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Verification Status
              <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as any })} style={{ padding: '0.75rem', background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}>
                <option value="PENDING VERIFICATION">PENDING VERIFICATION</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </label>
          </div>
        </div>
        <div className="tfs-modal-footer">
          <button type="button" className="portal-btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="admin-save" style={{ margin: 0 }}>
            <Check size={18} /> Save Fee Payment
          </button>
        </div>
      </form>
    </div>
  );
};

// --- 4. ADMISSIONS SECTION ---
const AdmissionsSection = ({
  admissions,
  sheetSyncing,
  onRefreshSheet,
  onPushToSheet,
  onEnrollStudent,
  onUpdateStatus,
  onAskDelete,
  onOpenSettings,
}: {
  admissions: AdmissionSubmission[];
  sheetSyncing: boolean;
  onRefreshSheet: () => void;
  onPushToSheet: () => void;
  onEnrollStudent: (adm: AdmissionSubmission) => void;
  onUpdateStatus: (adm: AdmissionSubmission, status: 'VERIFIED' | 'REJECTED') => void;
  onAskDelete: (id: string, name: string) => void;
  onOpenSettings: () => void;
}) => {
  const exportAdmissions = () => {
    const headers = [
      'Timestamp', 'Admission ID', 'Payment Reference', 'Payment Status', 'UTR / Transaction ID',
      'UPI Payer Name', 'Student Name', 'Phone', 'Email', 'Address', 'Profession',
      'Curriculum', 'Class Type', 'Add-ons', 'Schedule', 'Admission Fee', 'Base Tuition Fee',
      'Add-on Fee', 'Total Monthly Fee', 'Payment Amount'
    ];
    const rows = admissions.map((a) => [
      a.timestamp, a.admission_id, a.payment_reference, a.payment_status, a.utr,
      a.payer_name, a.student_name, a.phone, a.email, a.address, a.profession,
      a.curriculum, a.class_type, a.addons, a.schedule, a.admission_fee, a.base_tuition_fee,
      a.addon_fee, a.total_monthly_fee, a.payment_amount
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `tfs-admissions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sheetUrl = getGoogleSheetUrl();

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Admission Portal &amp; Google Sheets</p>
          <h2>Student Admission Submissions</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="admin-link" onClick={onOpenSettings}>
            <Settings size={15} /> Configure Sheet URL
          </button>
          {sheetUrl && (
            <a className="admin-link" href={sheetUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} /> Open Google Sheet
            </a>
          )}
        </div>
      </div>

      <div className="admin-admission-toolbar">
        <span>{admissions.length} submission{admissions.length === 1 ? '' : 's'} recorded</span>
        <button className="admin-save" onClick={onRefreshSheet} disabled={sheetSyncing}>
          <RefreshCw size={15} className={sheetSyncing ? 'animate-spin' : ''} />
          {sheetSyncing ? 'Syncing...' : 'Sync with Google Sheet'}
        </button>
        <button className="admin-save" onClick={onPushToSheet} disabled={sheetSyncing}>
          Push Submissions to Sheet
        </button>
        <button className="admin-save" onClick={exportAdmissions} disabled={!admissions.length}>
          Export CSV
        </button>
      </div>

      {admissions.length === 0 ? (
        <p className="admin-empty">No admission submissions found yet.</p>
      ) : (
        <div className="admin-table">
          <div className="admin-table-row admin-table-head" style={{ gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(200px, 1.2fr) minmax(180px, 1.1fr) minmax(240px, 1.3fr)' }}>
            <span>Applicant Profile</span>
            <span>Course &amp; Schedule</span>
            <span>Fee &amp; Payment Status</span>
            <span style={{ textAlign: 'right' }}>Admission Actions</span>
          </div>
          {admissions.map((adm) => (
            <div
              className="admin-table-row"
              key={adm.admission_id || adm.id}
              style={{ gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(200px, 1.2fr) minmax(180px, 1.1fr) minmax(240px, 1.3fr)' }}
            >
              <span>
                <b style={{ fontSize: '0.96rem', color: '#fff' }}>{adm.student_name}</b>
                <small style={{ color: 'var(--gold)' }}>{adm.email}</small>
                <small>{adm.phone || '—'}</small>
                <small style={{ color: 'var(--text-secondary)' }}>
                  {adm.profession ? `${adm.profession} · ` : ''}{adm.address || ''}
                </small>
                <small style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>ID: {adm.admission_id}</small>
              </span>
              <span>
                <b style={{ color: '#fff' }}>{adm.curriculum}</b>
                <span style={{ display: 'inline-block', fontSize: '0.78rem', color: 'var(--gold)', background: 'rgba(212,175,55,0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                  {adm.class_type || 'Regular'}
                </span>
                {adm.addons && <small style={{ color: '#5dd37a', fontWeight: 600 }}>+ {adm.addons}</small>}
                <small style={{ color: 'var(--text-secondary)' }}>Schedule: {adm.schedule || 'Weekend session'}</small>
              </span>
              <span>
                <b style={{ color: 'var(--gold)', fontSize: '1.05rem' }}>₹{adm.payment_amount.toLocaleString('en-IN')}</b>
                <span
                  className="booking-badge"
                  style={{
                    display: 'inline-block',
                    width: 'fit-content',
                    background:
                      adm.payment_status === 'VERIFIED'
                        ? 'rgba(40,167,69,0.2)'
                        : adm.payment_status === 'REJECTED'
                          ? 'rgba(220,53,69,0.2)'
                          : 'rgba(212,175,55,0.2)',
                    color:
                      adm.payment_status === 'VERIFIED'
                        ? '#5dd37a'
                        : adm.payment_status === 'REJECTED'
                          ? '#ff6b6b'
                          : 'var(--gold)',
                    fontWeight: 600,
                  }}
                >
                  {adm.payment_status}
                </span>
                <small style={{ fontFamily: 'monospace', color: '#fff' }}>UTR: {adm.utr || '—'}</small>
                <small style={{ color: 'var(--text-secondary)' }}>Payer: {adm.payer_name || adm.student_name}</small>
              </span>
              <span className="admin-row-actions">
                <button
                  type="button"
                  className="admin-btn-action action-gold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnrollStudent(adm);
                  }}
                >
                  <UserCheck size={14} /> Enroll
                </button>
                {adm.payment_status !== 'VERIFIED' && (
                  <button
                    type="button"
                    className="admin-btn-action action-success"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(adm, 'VERIFIED');
                    }}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                )}
                {adm.payment_status !== 'REJECTED' && (
                  <button
                    type="button"
                    className="admin-btn-action action-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(adm, 'REJECTED');
                    }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                )}
                <button
                  type="button"
                  className="admin-btn-icon danger"
                  title="Delete Application"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskDelete(adm.admission_id || adm.id, adm.student_name);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// --- 5. FEE PLANS SECTION ---
const FeePlansSection = ({
  plans,
  editing,
  setEditing,
  onSave,
  onDelete,
}: {
  plans: FeePlan[];
  editing: FeePlan | null;
  setEditing: (f: FeePlan | null) => void;
  onSave: (val: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Tuition Structure</p>
          <h2>Tuition Fee Plans</h2>
        </div>
        {!editing && (
          <button
            className="admin-save"
            style={{ margin: 0 }}
            onClick={() =>
              setEditing({
                id: `plan-${Date.now()}`,
                name: '',
                amount: 1300,
                description: '',
                billing_period: 'monthly',
                category: 'guitar',
                instrument: 'guitar',
                sort_order: plans.length,
                active: true,
              })
            }
          >
            <Plus size={16} /> Add Fee Plan
          </button>
        )}
      </div>

      {editing && (
        <div className="tfs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="tfs-modal-card admin-record-form-card" style={{ maxWidth: '650px' }}>
            <form
              className="admin-record-form"
              onSubmit={async (e) => {
                e.preventDefault();
                await onSave(editing);
              }}
            >
              <div className="admin-form-heading">
                <h3>{editing.name ? `Edit: ${editing.name}` : 'New Tuition Fee Plan'}</h3>
                <button type="button" onClick={() => setEditing(null)}>
                  <X size={16} />
                </button>
              </div>
              <label>
                Plan Name *
                <input
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </label>
              <label>
                Monthly Amount (₹) *
                <input
                  required
                  type="number"
                  value={editing.amount}
                  onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })}
                />
              </label>
              <label>
                Billing Period
                <input
                  value={editing.billing_period}
                  onChange={(e) => setEditing({ ...editing, billing_period: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={String(editing.active !== false)}
                  onChange={(e) => setEditing({ ...editing, active: e.target.value === 'true' })}
                >
                  <option value="true">Active</option>
                  <option value="false">Paused</option>
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Description
                <textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </label>
              <button className="admin-save" type="submit" style={{ gridColumn: '1 / -1' }}>
                <Check size={16} /> Save Fee Plan
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table">
        {plans.map((fee) => (
          <div className="admin-table-row" key={fee.id}>
            <span>
              <b>{fee.name}</b>
              <small>{fee.description}</small>
            </span>
            <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>
              ₹{fee.amount.toLocaleString('en-IN')}/{fee.billing_period || 'month'}
            </span>
            <span>{fee.active ? 'Active' : 'Paused'}</span>
            <span className="admin-row-actions">
              <button onClick={() => setEditing(fee)}>
                <Pencil size={15} />
              </button>
              <button onClick={() => onDelete(fee.id)}>
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- 6. CURRICULUM SECTION ---
const CurriculumSection = ({
  items,
  editing,
  setEditing,
  onSave,
  onDelete,
}: {
  items: CurriculumItem[];
  editing: CurriculumItem | null;
  setEditing: (c: CurriculumItem | null) => void;
  onSave: (val: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Educational Pathways</p>
          <h2>Curriculum Modules</h2>
        </div>
        {!editing && (
          <button
            className="admin-save"
            style={{ margin: 0 }}
            onClick={() =>
              setEditing({
                id: `curr-${Date.now()}`,
                title: '',
                description: '',
                category: 'beginner',
                instrument: 'guitar',
                icon_name: 'target',
                sort_order: items.length,
                active: true,
              })
            }
          >
            <Plus size={16} /> Add Module
          </button>
        )}
      </div>

      {editing && (
        <div className="tfs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="tfs-modal-card admin-record-form-card" style={{ maxWidth: '650px' }}>
            <form
              className="admin-record-form"
              onSubmit={async (e) => {
                e.preventDefault();
                await onSave(editing);
              }}
            >
              <div className="admin-form-heading">
                <h3>{editing.title ? `Edit: ${editing.title}` : 'New Curriculum Module'}</h3>
                <button type="button" onClick={() => setEditing(null)}>
                  <X size={16} />
                </button>
              </div>
              <label>
                Module Title *
                <input
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </label>
              <label>
                Instrument Track *
                <select
                  value={editing.instrument}
                  onChange={(e) => setEditing({ ...editing, instrument: e.target.value as any })}
                >
                  <option value="guitar">Acoustic Guitar</option>
                  <option value="ukulele_standard">Ukulele (Standard)</option>
                  <option value="ukulele_dotara">Ukulele (Dotara)</option>
                </select>
              </label>
              <label>
                Category
                <input
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={String(editing.active !== false)}
                  onChange={(e) => setEditing({ ...editing, active: e.target.value === 'true' })}
                >
                  <option value="true">Active</option>
                  <option value="false">Paused</option>
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Description *
                <textarea
                  required
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </label>
              <button className="admin-save" type="submit" style={{ gridColumn: '1 / -1' }}>
                <Check size={16} /> Save Curriculum Module
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table">
        {items.map((item) => (
          <div className="admin-table-row" key={item.id}>
            <span>
              <b>{item.title}</b>
              <small>{item.description}</small>
            </span>
            <span style={{ textTransform: 'capitalize' }}>
              {item.instrument.replace('_', ' ')} · {item.category}
            </span>
            <span>{item.active ? 'Active' : 'Paused'}</span>
            <span className="admin-row-actions">
              <button onClick={() => setEditing(item)}>
                <Pencil size={15} />
              </button>
              <button onClick={() => onDelete(item.id)}>
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- 7. ADD-ONS SECTION ---
const AddonsSection = ({
  items,
  editing,
  setEditing,
  onSave,
  onDelete,
}: {
  items: AddOn[];
  editing: AddOn | null;
  setEditing: (a: AddOn | null) => void;
  onSave: (val: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Elective Offerings</p>
          <h2>Specialized Add-ons</h2>
        </div>
        {!editing && (
          <button
            className="admin-save"
            style={{ margin: 0 }}
            onClick={() =>
              setEditing({
                id: `addon-${Date.now()}`,
                name: '',
                description: '',
                amount: 500,
                billing_period: 'monthly',
                sort_order: items.length,
                active: true,
              })
            }
          >
            <Plus size={16} /> Add Add-on
          </button>
        )}
      </div>

      {editing && (
        <div className="tfs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="tfs-modal-card admin-record-form-card" style={{ maxWidth: '650px' }}>
            <form
              className="admin-record-form"
              onSubmit={async (e) => {
                e.preventDefault();
                await onSave(editing);
              }}
            >
              <div className="admin-form-heading">
                <h3>{editing.name ? `Edit: ${editing.name}` : 'New Add-on'}</h3>
                <button type="button" onClick={() => setEditing(null)}>
                  <X size={16} />
                </button>
              </div>
              <label>
                Name *
                <input
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </label>
              <label>
                Monthly Fee (₹) *
                <input
                  required
                  type="number"
                  value={editing.amount}
                  onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Description
                <textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </label>
              <button className="admin-save" type="submit" style={{ gridColumn: '1 / -1' }}>
                <Check size={16} /> Save Add-on
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table">
        {items.map((item) => (
          <div className="admin-table-row" key={item.id}>
            <span>
              <b>{item.name}</b>
              <small>{item.description}</small>
            </span>
            <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>
              ₹{item.amount.toLocaleString('en-IN')}/month
            </span>
            <span>{item.active ? 'Active' : 'Paused'}</span>
            <span className="admin-row-actions">
              <button onClick={() => setEditing(item)}>
                <Pencil size={15} />
              </button>
              <button onClick={() => onDelete(item.id)}>
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- 8. SCHEDULE SECTION ---
const ScheduleSection = ({
  items,
  editing,
  setEditing,
  onSave,
  onDelete,
}: {
  items: ScheduleItem[];
  editing: ScheduleItem | null;
  setEditing: (s: ScheduleItem | null) => void;
  onSave: (val: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Live Windows</p>
          <h2>Class Schedule &amp; Slots</h2>
        </div>
        {!editing && (
          <button
            className="admin-save"
            style={{ margin: 0 }}
            onClick={() =>
              setEditing({
                id: `sch-${Date.now()}`,
                title: 'Official class window',
                day_label: 'Saturday',
                time_label: '10:00 AM – 1:00 PM',
                description: 'Group & one-to-one lessons',
                format: 'Studio & Online',
                sort_order: items.length,
                active: true,
              })
            }
          >
            <Plus size={16} /> Add Schedule
          </button>
        )}
      </div>

      {editing && (
        <div className="tfs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="tfs-modal-card admin-record-form-card" style={{ maxWidth: '650px' }}>
            <form
              className="admin-record-form"
              onSubmit={async (e) => {
                e.preventDefault();
                await onSave(editing);
              }}
            >
              <div className="admin-form-heading">
                <h3>{editing.day_label ? `Edit: ${editing.day_label}` : 'New Schedule Window'}</h3>
                <button type="button" onClick={() => setEditing(null)}>
                  <X size={16} />
                </button>
              </div>
              <label>
                Day *
                <input
                  required
                  value={editing.day_label}
                  onChange={(e) => setEditing({ ...editing, day_label: e.target.value })}
                />
              </label>
              <label>
                Time Window *
                <input
                  required
                  value={editing.time_label}
                  onChange={(e) => setEditing({ ...editing, time_label: e.target.value })}
                />
              </label>
              <label>
                Format
                <input
                  value={editing.format || ''}
                  onChange={(e) => setEditing({ ...editing, format: e.target.value })}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Description
                <textarea
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </label>
              <button className="admin-save" type="submit" style={{ gridColumn: '1 / -1' }}>
                <Check size={16} /> Save Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table">
        {items.map((item) => (
          <div className="admin-table-row" key={item.id}>
            <span>
              <b>{item.day_label}</b>
              <small>{item.time_label}</small>
            </span>
            <span>{item.description}</span>
            <span>{item.active ? 'Active' : 'Paused'}</span>
            <span className="admin-row-actions">
              <button onClick={() => setEditing(item)}>
                <Pencil size={15} />
              </button>
              <button onClick={() => onDelete(item.id)}>
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- 9. DISCOUNTS SECTION ---
const DiscountsSection = ({
  discounts,
  editing,
  setEditing,
  onSave,
  onDelete,
}: {
  discounts: RecordValue[];
  editing: RecordValue | null;
  setEditing: (d: RecordValue | null) => void;
  onSave: (val: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Promotions</p>
          <h2>Discount Coupons</h2>
        </div>
        {!editing && (
          <button
            className="admin-save"
            style={{ margin: 0 }}
            onClick={() =>
              setEditing({
                name: '',
                coupon_code: '',
                discount_type: 'percentage',
                discount_value: 10,
                maximum_discount_amount: 500,
                minimum_purchase: 0,
                coupon_count: 20,
                active: true,
              })
            }
          >
            <Plus size={16} /> Create Coupon
          </button>
        )}
      </div>

      {editing && (
        <div className="tfs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="tfs-modal-card admin-record-form-card" style={{ maxWidth: '650px' }}>
            <form
              className="admin-record-form"
              onSubmit={async (e) => {
                e.preventDefault();
                await onSave(editing);
              }}
            >
              <div className="admin-form-heading">
                <h3>{editing.coupon_code || 'New Coupon'}</h3>
                <button type="button" onClick={() => setEditing(null)}>
                  <X size={16} />
                </button>
              </div>
              <label>
                Name *
                <input
                  required
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </label>
              <label>
                Code *
                <input
                  required
                  value={editing.coupon_code || ''}
                  onChange={(e) => setEditing({ ...editing, coupon_code: e.target.value.toUpperCase() })}
                />
              </label>
              <label>
                Discount Type
                <select
                  value={editing.discount_type || 'percentage'}
                  onChange={(e) => setEditing({ ...editing, discount_type: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="amount">Fixed Amount (₹)</option>
                </select>
              </label>
              <label>
                Value *
                <input
                  required
                  type="number"
                  value={editing.discount_value ?? 10}
                  onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })}
                />
              </label>
              <button className="admin-save" type="submit" style={{ gridColumn: '1 / -1' }}>
                <Check size={16} /> Save Coupon
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table">
        {discounts.map((discount) => (
          <div className="admin-table-row" key={discount.id || discount.coupon_code}>
            <span>
              <b>{discount.name}</b>
              <small style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{discount.coupon_code}</small>
            </span>
            <span>
              {discount.discount_type === 'amount'
                ? `₹${Number(discount.discount_value || 0)} off`
                : `${Number(discount.discount_value || 0)}% off`}
            </span>
            <span>{discount.active ? 'Active' : 'Paused'}</span>
            <span className="admin-row-actions">
              <button onClick={() => setEditing(discount)}>
                <Pencil size={15} />
              </button>
              <button onClick={() => onDelete(discount.id)}>
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- 10. BOOKINGS SECTION ---
const BookingsSection = ({
  bookings,
  editing,
  setEditing,
  onSave,
  onDelete,
}: {
  bookings: RecordValue[];
  editing: RecordValue | null;
  setEditing: (b: RecordValue | null) => void;
  onSave: (val: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Website Inquiries</p>
          <h2>Trial Bookings &amp; Inquiries</h2>
        </div>
      </div>
      {editing && (
        <div className="tfs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="tfs-modal-card admin-record-form-card" style={{ maxWidth: '650px' }}>
            <form
              className="admin-record-form"
              onSubmit={async (e) => {
                e.preventDefault();
                await onSave(editing);
              }}
            >
              <div className="admin-form-heading">
                <h3>Update Booking: {editing.name}</h3>
                <button type="button" onClick={() => setEditing(null)}>
                  <X size={16} />
                </button>
              </div>
              <label>
                Customer Name
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </label>
              <label>
                Status
                <select value={editing.status || 'new'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="new">New</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Admin Reply / Notes
                <textarea rows={2} value={editing.admin_reply || ''} onChange={(e) => setEditing({ ...editing, admin_reply: e.target.value })} />
              </label>
              <button className="admin-save" type="submit" style={{ gridColumn: '1 / -1' }}>
                <Check size={16} /> Save Booking
              </button>
            </form>
          </div>
        </div>
      )}
      {bookings.length === 0 ? (
        <p className="admin-empty">No website bookings received yet.</p>
      ) : (
        <div className="admin-table">
          {bookings.map((booking) => (
            <div className="admin-table-row" key={booking.id}>
              <span>
                <b>{booking.name}</b>
                <small>{booking.email} · {booking.phone || 'No phone'}</small>
              </span>
              <span>
                {booking.instrument || 'Guitar'} · {booking.format || 'Home Tuition'}
                <small>{booking.slot || 'Flexible'}</small>
              </span>
              <span className="booking-badge">{booking.status || 'new'}</span>
              <span className="admin-row-actions">
                <button title="Edit Booking Status" onClick={() => setEditing(booking)}>
                  <Pencil size={15} />
                </button>
                <button title="Delete Booking" onClick={() => onDelete(booking.id)}>
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// --- 11. MESSAGES SECTION ---
const MessagesSection = ({
  requests,
  onSave,
  onDelete,
}: {
  requests: RecordValue[];
  onSave: (val: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">Student Portal</p>
          <h2>Student Messages &amp; Requests</h2>
        </div>
      </div>
      {requests.length === 0 ? (
        <p className="admin-empty">No student messages or requests right now.</p>
      ) : (
        <div className="admin-table">
          {requests.map((r) => (
            <div className="admin-table-row" key={r.id}>
              <span>
                <b>{r.student_name || 'Student'}</b>
                <small>{r.student_email}</small>
                <small style={{ color: 'var(--gold)' }}>{r.request_type}: {r.message}</small>
              </span>
              <span>{r.status || 'pending'}</span>
              <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
              <span className="admin-row-actions">
                {r.status !== 'resolved' && (
                  <button
                    title="Mark as Resolved"
                    onClick={() => onSave({ ...r, status: 'resolved' })}
                    style={{ color: '#5dd37a' }}
                  >
                    <CheckCircle size={15} />
                  </button>
                )}
                <button title="Delete Request" onClick={() => onDelete(r.id)}>
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TfsControl;
