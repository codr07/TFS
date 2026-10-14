import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  FileText,
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
  deleteStudent,
  loadStoredAdmissions,
  saveAdmissionLocally,
  deleteAdmissionRecord,
  fetchSpreadsheetAdmissions,
  submitAdmissionToSpreadsheet,
  loadStoredFeePayments,
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

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        loadedPlans,
        loadedCurriculums,
        loadedAddons,
        loadedSchedules,
        loadedStudentsList,
      ] = await Promise.all([
        loadFeePlans(),
        loadCurriculumItems(),
        loadAddOns(),
        loadScheduleItems(),
        loadStudents(),
      ]);

      setFees(loadedPlans);
      setCurriculumItems(loadedCurriculums);
      setAddons(loadedAddons);
      setScheduleItems(loadedSchedules);
      setStudents(loadedStudentsList);

      // Admissions & Fee Payments
      setAdmissions(loadStoredAdmissions());
      setFeePayments(loadStoredFeePayments());

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
      fail('Failed to load some data. Displaying local data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllData();
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
        monthly_fee: adm.base_tuition_fee + adm.addon_fee,
        admission_id: adm.admission_id,
        admission_fee_paid: true,
        fee_status: 'Up to date',
        status: 'active',
        notes: `Enrolled via Admission form on ${new Date().toLocaleDateString('en-IN')}`,
      });
      setStudents([newStudent, ...students]);
      notify(`Enrolled ${adm.student_name} as an active TFS student!`);
    }

    // Mark admission as VERIFIED
    adm.payment_status = 'VERIFIED';
    await saveAdmissionLocally(adm);
    setAdmissions([...admissions]);
  };

  // Update admission status
  const handleUpdateAdmissionStatus = async (adm: AdmissionSubmission, status: 'VERIFIED' | 'REJECTED') => {
    adm.payment_status = status;
    await saveAdmissionLocally(adm);
    setAdmissions([...admissions]);
    notify(`Admission ${adm.admission_id} marked as ${status}.`);
  };

  // Fee payment verification
  const handleVerifyFeePayment = async (paymentId: string) => {
    await updateFeePaymentStatus(paymentId, 'VERIFIED');
    setFeePayments(loadStoredFeePayments());
    setStudents(await loadStudents());
    notify('Fee payment marked as VERIFIED and student record updated.');
  };

  const handleRejectFeePayment = async (paymentId: string) => {
    await updateFeePaymentStatus(paymentId, 'REJECTED');
    setFeePayments(loadStoredFeePayments());
    notify('Fee payment rejected.');
  };

  const handleSavePaymentRecord = async (payment: FeePaymentRecord) => {
    await saveFeePaymentRecord(payment);
    setFeePayments(loadStoredFeePayments());
    setEditingPayment(null);
    setIsAddingPayment(false);
    notify('Fee payment record saved successfully.');
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
        <button className="admin-signout" onClick={signOut}>
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
              <RefreshCw size={15} /> Reload
            </button>
            <div className="admin-status">
              <span /> Secure Admin Workspace
            </div>
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
                await deleteFeePlan(id);
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
                await deleteCurriculumItem(id);
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
                await deleteAddOn(id);
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
                await deleteScheduleItem(id);
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
                await supabaseAdmin.from('discounts').delete().eq('id', id);
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
                await supabaseAdmin.from('bookings').delete().eq('id', id);
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
              notify('Message updated.');
            }}
            onDelete={async (id) => {
              if (window.confirm('Delete this message?')) {
                await supabaseAdmin.from('student_requests').delete().eq('id', id);
                setRequests(requests.filter((r) => r.id !== id));
                notify('Message deleted.');
              }
            }}
          />
        )}
      </main>

      {/* Spreadsheet / Google Apps Script Configuration Modal */}
      {showConfigModal && (
        <div className="fee-login-modal-overlay">
          <div className="fee-login-modal-card" style={{ maxWidth: '600px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--gold)' }}>Google Sheets & Apps Script Setup</h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
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
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="admission-secondary"
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
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fee-login-modal-overlay">
          <div className="fee-login-modal-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
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
                className="admission-secondary"
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
        <div className="fee-login-modal-overlay">
          <div className="fee-login-modal-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
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
                className="admission-secondary"
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
        <div className="fee-login-modal-overlay">
          <div className="fee-login-modal-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
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
                className="admission-secondary"
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
  onNavigate,
  loading,
}: {
  students: StudentProfile[];
  fees: FeePlan[];
  admissions: AdmissionSubmission[];
  feePayments: FeePaymentRecord[];
  bookings: RecordValue[];
  onNavigate: (s: Section) => void;
  loading: boolean;
}) => {
  const pendingPayments = feePayments.filter((p) => p.payment_status === 'PENDING VERIFICATION').length;
  const pendingAdmissions = admissions.filter((a) => a.payment_status === 'PENDING VERIFICATION').length;
  const activeStudents = students.filter((s) => s.status === 'active').length;

  return (
    <>
      <section className="admin-stat-grid">
        <div className="admin-stat">
          <Users size={20} color="var(--gold)" />
          <span>Active Students</span>
          <strong>{activeStudents}</strong>
          <small>{students.length} total profiles</small>
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
          <small>{loading ? 'Loading...' : `${bookings.length} enquiries`}</small>
        </div>
      </section>

      <div className="admin-grid-two">
        {/* Recent Fee Payments */}
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
            feePayments.slice(0, 5).map((pay) => (
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
            <Users size={18} /> Manage Student Accounts &amp; Plans
          </button>
          <button className="admin-action" onClick={() => onNavigate('feepayments')}>
            <CreditCard size={18} /> Review &amp; Verify Monthly Fees
          </button>
          <button className="admin-action" onClick={() => onNavigate('admissions')}>
            <FileText size={18} /> Review Admission Applications
          </button>
          <button className="admin-action" onClick={() => onNavigate('fees')}>
            <CircleDollarSign size={18} /> Configure Tuition Fee Plans
          </button>
          <button className="admin-action" onClick={() => onNavigate('curriculum')}>
            <BookOpen size={18} /> Update Curriculum Modules
          </button>
        </section>
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
                <b>{`${student.first_name} ${student.last_name}`.trim() || 'Student'}</b>
                <small>{student.email || 'No email'} · {student.phone_number || 'No phone'}</small>
                {student.admission_id && (
                  <small style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>
                    Adm ID: {student.admission_id}
                  </small>
                )}
              </span>
              <span>
                <b>{student.curriculum || 'Guitar'}</b>
                <small>{student.class_schedule || 'Active Plan'}</small>
                <small>Slot: {student.preferred_schedule || 'Flexible'}</small>
                {student.addons && student.addons.length > 0 && (
                  <small style={{ color: '#5dd37a' }}>+ {student.addons.join(', ')}</small>
                )}
              </span>
              <span>
                <b style={{ color: 'var(--gold)' }}>
                  ₹{(student.monthly_fee || 1300).toLocaleString('en-IN')}/mo
                </b>
                <span
                  className="booking-badge"
                  style={{
                    display: 'inline-block',
                    marginTop: '0.25rem',
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
                    fontSize: '0.72rem',
                    color: student.status === 'active' ? '#5dd37a' : 'var(--text-secondary)',
                  }}
                >
                  Status: {student.status}
                </span>
              </span>
              <span className="admin-row-actions">
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

// Student Edit Modal with Dynamic Dropdowns
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
    <div className="fee-login-modal-overlay">
      <div className="fee-login-modal-card" style={{ maxWidth: '780px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '1.4rem' }}>
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

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
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

          {/* Section: DYNAMIC SCHEDULE DROPDOWN */}
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Batch Schedule Window (Database Synced) *
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

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <button type="button" className="admission-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="admin-save" style={{ margin: 0 }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Student Account'}
            </button>
          </div>
        </form>
      </div>
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
        <div className="admin-table-row admin-table-head">
          <span>Student &amp; Payer</span>
          <span>Payment Details &amp; UTR</span>
          <span>Status &amp; Date</span>
          <span>Actions</span>
        </div>
        {filtered.length === 0 ? (
          <p className="admin-empty">No fee payment records found for the selected filter.</p>
        ) : (
          filtered.map((pay) => (
            <div className="admin-table-row" key={pay.id || pay.payment_reference}>
              <span>
                <b>{pay.student_name}</b>
                <small>{pay.student_email}</small>
                <small style={{ color: 'var(--text-secondary)' }}>Payer: {pay.payer_name || 'Student'}</small>
              </span>
              <span>
                <b style={{ color: 'var(--gold)' }}>₹{pay.amount.toLocaleString('en-IN')}</b>
                <small>{pay.curriculum} · {pay.class_type}</small>
                <small style={{ fontFamily: 'monospace' }}>UTR: {pay.utr || '—'}</small>
                {pay.payment_reference && (
                  <small style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>Ref: {pay.payment_reference}</small>
                )}
              </span>
              <span>
                <span
                  className="booking-badge"
                  style={{
                    display: 'inline-block',
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
                <small style={{ display: 'block', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                  {pay.timestamp ? new Date(pay.timestamp).toLocaleDateString('en-IN') : '—'}
                </small>
              </span>
              <span className="admin-row-actions">
                {pay.payment_status !== 'VERIFIED' && (
                  <button
                    title="Verify Fee Payment"
                    onClick={() => void onVerify(pay.id || pay.payment_reference)}
                    style={{ color: '#5dd37a', borderColor: 'rgba(93,211,122,0.3)' }}
                  >
                    <CheckCircle size={15} />
                  </button>
                )}
                {pay.payment_status !== 'REJECTED' && (
                  <button
                    title="Reject Payment"
                    onClick={() => void onReject(pay.id || pay.payment_reference)}
                    style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}
                  >
                    <XCircle size={15} />
                  </button>
                )}
                <button title="Edit Record" onClick={() => setEditing(pay)}>
                  <Pencil size={15} />
                </button>
                <button
                  title="Delete Payment Record"
                  onClick={() => onAskDelete(pay.id || pay.payment_reference, pay.student_name)}
                  style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}
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
    <div className="fee-login-modal-overlay">
      <div className="fee-login-modal-card" style={{ maxWidth: '650px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, color: 'var(--gold)' }}>Fee Payment Record</h3>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="admission-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="admin-save" style={{ margin: 0 }}>Save Fee Payment</button>
          </div>
        </form>
      </div>
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
          <div className="admin-table-row admin-table-head" style={{ gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(180px, 1.2fr) minmax(120px, 1fr) auto' }}>
            <span>Applicant</span>
            <span>Program &amp; Schedule</span>
            <span>Payment &amp; UTR</span>
            <span>Actions</span>
          </div>
          {admissions.map((adm) => (
            <div
              className="admin-table-row"
              key={adm.admission_id || adm.id}
              style={{ gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(180px, 1.2fr) minmax(120px, 1fr) auto' }}
            >
              <span>
                <b>{adm.student_name}</b>
                <small>{adm.email} · {adm.phone}</small>
                <small style={{ color: 'var(--text-secondary)' }}>{adm.profession} · {adm.address}</small>
                <small style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>ID: {adm.admission_id}</small>
              </span>
              <span>
                <b>{adm.curriculum}</b>
                <small>{adm.class_type}</small>
                {adm.addons && <small style={{ color: '#5dd37a' }}>+ {adm.addons}</small>}
                <small>Slot: {adm.schedule || 'Weekend session'}</small>
              </span>
              <span>
                <b style={{ color: 'var(--gold)' }}>₹{adm.payment_amount.toLocaleString('en-IN')}</b>
                <span
                  className="booking-badge"
                  style={{
                    display: 'inline-block',
                    marginTop: '0.2rem',
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
                  }}
                >
                  {adm.payment_status}
                </span>
                <small style={{ display: 'block', fontFamily: 'monospace' }}>UTR: {adm.utr || '—'}</small>
                <small style={{ color: 'var(--text-secondary)' }}>Payer: {adm.payer_name}</small>
              </span>
              <span className="admin-row-actions">
                <button
                  title="Enroll / Activate as Student Profile"
                  onClick={() => onEnrollStudent(adm)}
                  style={{ color: '#5dd37a', borderColor: 'rgba(93,211,122,0.3)' }}
                >
                  <UserCheck size={16} />
                </button>
                {adm.payment_status !== 'VERIFIED' && (
                  <button
                    title="Mark Payment as Verified"
                    onClick={() => onUpdateStatus(adm, 'VERIFIED')}
                  >
                    <CheckCircle size={15} />
                  </button>
                )}
                {adm.payment_status !== 'REJECTED' && (
                  <button
                    title="Reject Application"
                    onClick={() => onUpdateStatus(adm, 'REJECTED')}
                  >
                    <XCircle size={15} />
                  </button>
                )}
                <button
                  title="Delete Admission Submission"
                  onClick={() => onAskDelete(adm.admission_id || adm.id, adm.student_name)}
                  style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}
                >
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
          <button className="admin-save" type="submit">
            <Check size={16} /> Save Fee Plan
          </button>
        </form>
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
          <button className="admin-save" type="submit">
            <Check size={16} /> Save Curriculum Module
          </button>
        </form>
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
          <button className="admin-save" type="submit">
            <Check size={16} /> Save Add-on
          </button>
        </form>
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
          <button className="admin-save" type="submit">
            <Check size={16} /> Save Schedule
          </button>
        </form>
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
          <button className="admin-save" type="submit">
            <Check size={16} /> Save Coupon
          </button>
        </form>
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
          <button className="admin-save" type="submit">
            <Check size={16} /> Save Booking
          </button>
        </form>
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
