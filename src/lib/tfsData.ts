import { supabase, supabaseAdmin } from './supabase';

export function isUuid(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

export interface FeePlan {
  id: string;
  name: string;
  amount: number;
  description: string;
  billing_period: string;
  category?: string;
  instrument?: string;
  sort_order: number;
  active: boolean;
}

export interface CurriculumItem {
  id: string;
  title: string;
  description: string;
  category: string;
  instrument: 'guitar' | 'ukulele_standard' | 'ukulele_dotara';
  icon_name?: string;
  sort_order: number;
  active: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  amount: number;
  billing_period: string;
  sort_order: number;
  active: boolean;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  day_label: string;
  time_label: string;
  format?: string;
  sort_order: number;
  active: boolean;
}

export interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  curriculum: string; // 'Guitar' | 'Ukulele (Standard)' | 'Ukulele (Dotara)'
  class_schedule: string; // Plan: 'Home Visit — ₹1,500/month' | 'Home Tuition — ₹1,300/month' | 'Online — ₹900/month' | 'Ukulele (Dotara) Home Tuition — ₹1,500/month'
  preferred_schedule?: string;
  addons?: string[];
  monthly_fee?: number;
  profession?: string;
  address?: string;
  avatar_url?: string;
  bio?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  status: 'active' | 'pending_verification' | 'inactive' | 'suspended';
  admission_id?: string;
  admission_fee_paid?: boolean;
  fee_status?: 'Up to date' | 'Due' | 'Overdue' | 'Pending Verification';
  fee_due_date?: string;
  notes?: string;
  module_progress?: Record<string, 'not_started' | 'in_progress' | 'mastered'>;
  overall_progress_pct?: number;
  instructor_feedback?: string;
  milestone_badges?: string[];
  last_evaluated_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdmissionSubmission {
  id: string;
  timestamp: string;
  admission_id: string;
  payment_reference: string;
  payment_status: 'PENDING VERIFICATION' | 'VERIFIED' | 'REJECTED';
  utr: string;
  payer_name: string;
  student_name: string;
  phone: string;
  email: string;
  address: string;
  profession: string;
  curriculum: string;
  class_type: string;
  addons: string;
  schedule: string;
  admission_fee: number;
  base_tuition_fee: number;
  addon_fee: number;
  total_monthly_fee: string;
  payment_amount: number;
  synced_to_sheet?: boolean;
  sheet_error?: string;
  notes?: string;
}

export interface FeePaymentRecord {
  id: string;
  timestamp: string;
  payment_reference: string;
  payment_status: 'PENDING VERIFICATION' | 'VERIFIED' | 'REJECTED';
  utr: string;
  payer_name: string;
  student_name: string;
  student_email: string;
  phone: string;
  curriculum: string;
  class_type: string;
  addons: string;
  amount: number;
  notes?: string;
  verified_at?: string;
}

export const PREDEFINED_CURRICULUMS = [
  'Guitar',
  'Ukulele (Standard)',
  'Ukulele (Dotara)',
];

export const PREDEFINED_PLANS = [
  'Home Visit — ₹1,500/month',
  'Home Tuition — ₹1,300/month',
  'Online — ₹900/month',
  'Ukulele (Dotara) Home Tuition — ₹1,500/month',
];

export const PREDEFINED_SCHEDULES = [
  'Friday — 8:00 PM – 11:00 PM',
  'Saturday — 10:00 AM – 1:00 PM',
  'Saturday — 7:00 PM – 11:00 PM',
  'Sunday — 10:00 AM – 1:00 PM',
  'Sunday — 7:00 PM – 11:00 PM',
  'Custom / Flexible Schedule',
];

export const PREDEFINED_ADDONS = [
  'None',
  'Song Writing — ₹500/month',
  'Music Composing — ₹1,500/month',
  'Song Writing — ₹500/month, Music Composing — ₹1,500/month',
];

export const PREDEFINED_STUDENT_STATUSES = [
  { value: 'active', label: 'Active Student' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'inactive', label: 'Inactive / On Leave' },
  { value: 'suspended', label: 'Suspended' },
];

export const PREDEFINED_FEE_STATUSES = [
  'Up to date',
  'Due',
  'Overdue',
  'Pending Verification',
];

// ----------------- STORAGE HELPERS -----------------

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to save to localStorage (${key}):`, err);
  }
}

// ----------------- API URL CONFIG -----------------

export function getAdmissionApiUrl(): string {
  const fromStorage = localStorage.getItem('tfs_admission_api_url');
  if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  const fromEnv = (import.meta.env.VITE_ADMISSION_API_URL as string) || '';
  return fromEnv.trim();
}

export function setAdmissionApiUrl(url: string): void {
  localStorage.setItem('tfs_admission_api_url', url.trim());
}

export function getGoogleSheetUrl(): string {
  return localStorage.getItem('tfs_spreadsheet_url') || '';
}

export function setGoogleSheetUrl(url: string): void {
  localStorage.setItem('tfs_spreadsheet_url', url.trim());
}

// ----------------- CATALOG DATA ACCESSORS -----------------

export async function loadFeePlans(): Promise<FeePlan[]> {
  try {
    const { data, error } = await supabaseAdmin.from('fee_plans').select('*').order('sort_order');
    if (!error && data && data.length > 0) {
      setStored('tfs_fee_plans', data);
      return data as FeePlan[];
    }
  } catch (e) {
    console.warn('Supabase fee_plans fetch fallback:', e);
  }
  return getStored<FeePlan[]>('tfs_fee_plans', []);
}

export async function saveFeePlan(plan: Partial<FeePlan> & { name: string; amount: number }): Promise<FeePlan> {
  const current = getStored<FeePlan[]>('tfs_fee_plans', []);
  const id = plan.id || `plan-${Date.now()}`;
  const fullPlan: FeePlan = {
    id,
    name: plan.name,
    amount: Number(plan.amount),
    description: plan.description || '',
    billing_period: plan.billing_period || 'monthly',
    category: plan.category || 'guitar',
    instrument: plan.instrument || 'guitar',
    sort_order: plan.sort_order ?? current.length,
    active: plan.active !== false,
  };

  const existingIndex = current.findIndex((p) => p.id === id);
  const updated = existingIndex > -1
    ? current.map((p, i) => (i === existingIndex ? fullPlan : p))
    : [...current, fullPlan];

  setStored('tfs_fee_plans', updated);

  try {
    if (plan.id && !plan.id.startsWith('plan-')) {
      await supabaseAdmin.from('fee_plans').upsert(fullPlan);
    } else {
      const { id: _, ...insertPayload } = fullPlan;
      await supabaseAdmin.from('fee_plans').insert(insertPayload);
    }
  } catch (e) {
    console.warn('Supabase fee_plans save error:', e);
  }

  return fullPlan;
}

export async function deleteFeePlan(id: string, planName?: string): Promise<void> {
  const current = getStored<FeePlan[]>('tfs_fee_plans', []);
  const matched = current.find((p) => p.id === id);
  const name = planName || matched?.name;
  setStored('tfs_fee_plans', current.filter((p) => p.id !== id && (!name || p.name !== name)));
  try {
    if (isUuid(id)) {
      const { error } = await supabaseAdmin.from('fee_plans').delete().eq('id', id);
      if (error && name) {
        await supabaseAdmin.from('fee_plans').delete().eq('name', name);
      }
    } else if (name) {
      await supabaseAdmin.from('fee_plans').delete().eq('name', name);
    }
  } catch (e) {
    console.warn('deleteFeePlan error:', e);
  }
}

export async function loadCurriculumItems(): Promise<CurriculumItem[]> {
  try {
    const { data, error } = await supabaseAdmin.from('curriculum_items').select('*').order('sort_order');
    if (!error && data && data.length > 0) {
      setStored('tfs_curriculum_items', data);
      return data as CurriculumItem[];
    }
  } catch (e) {
    console.warn('Supabase curriculum fetch fallback:', e);
  }
  return getStored<CurriculumItem[]>('tfs_curriculum_items', []);
}

export async function saveCurriculumItem(item: Partial<CurriculumItem> & { title: string; description: string }): Promise<CurriculumItem> {
  const current = getStored<CurriculumItem[]>('tfs_curriculum_items', []);
  const id = item.id || `curr-${Date.now()}`;
  const fullItem: CurriculumItem = {
    id,
    title: item.title,
    description: item.description,
    category: item.category || 'core',
    instrument: (item.instrument as any) || 'guitar',
    icon_name: item.icon_name || 'book',
    sort_order: item.sort_order ?? current.length,
    active: item.active !== false,
  };

  const existingIndex = current.findIndex((c) => c.id === id);
  const updated = existingIndex > -1
    ? current.map((c, i) => (i === existingIndex ? fullItem : c))
    : [...current, fullItem];

  setStored('tfs_curriculum_items', updated);

  try {
    if (item.id && !item.id.startsWith('curr-')) {
      await supabaseAdmin.from('curriculum_items').upsert(fullItem);
    } else {
      const { id: _, ...insertPayload } = fullItem;
      await supabaseAdmin.from('curriculum_items').insert(insertPayload);
    }
  } catch {}

  return fullItem;
}

export async function deleteCurriculumItem(id: string, itemTitle?: string): Promise<void> {
  const current = getStored<CurriculumItem[]>('tfs_curriculum_items', []);
  const matched = current.find((c) => c.id === id);
  const title = itemTitle || matched?.title;
  setStored('tfs_curriculum_items', current.filter((c) => c.id !== id && (!title || c.title !== title)));
  try {
    if (isUuid(id)) {
      const { error } = await supabaseAdmin.from('curriculum_items').delete().eq('id', id);
      if (error && title) {
        await supabaseAdmin.from('curriculum_items').delete().eq('title', title);
      }
    } else if (title) {
      await supabaseAdmin.from('curriculum_items').delete().eq('title', title);
    }
  } catch (e) {
    console.warn('deleteCurriculumItem error:', e);
  }
}

export async function loadAddOns(): Promise<AddOn[]> {
  try {
    const { data, error } = await supabaseAdmin.from('add_ons').select('*').order('sort_order');
    if (!error && data && data.length > 0) {
      setStored('tfs_add_ons', data);
      return data as AddOn[];
    }
  } catch {}
  return getStored<AddOn[]>('tfs_add_ons', []);
}

export async function saveAddOn(addon: Partial<AddOn> & { name: string; amount: number }): Promise<AddOn> {
  const current = getStored<AddOn[]>('tfs_add_ons', []);
  const id = addon.id || `addon-${Date.now()}`;
  const fullAddon: AddOn = {
    id,
    name: addon.name,
    description: addon.description || '',
    amount: Number(addon.amount),
    billing_period: addon.billing_period || 'monthly',
    sort_order: addon.sort_order ?? current.length,
    active: addon.active !== false,
  };

  const existingIndex = current.findIndex((a) => a.id === id);
  const updated = existingIndex > -1
    ? current.map((a, i) => (i === existingIndex ? fullAddon : a))
    : [...current, fullAddon];

  setStored('tfs_add_ons', updated);
  try {
    if (addon.id && !addon.id.startsWith('addon-')) {
      await supabaseAdmin.from('add_ons').upsert(fullAddon);
    } else {
      const { id: _, ...insertPayload } = fullAddon;
      await supabaseAdmin.from('add_ons').insert(insertPayload);
    }
  } catch {}
  return fullAddon;
}

export async function deleteAddOn(id: string, addonName?: string): Promise<void> {
  const current = getStored<AddOn[]>('tfs_add_ons', []);
  const matched = current.find((a) => a.id === id);
  const name = addonName || matched?.name;
  setStored('tfs_add_ons', current.filter((a) => a.id !== id && (!name || a.name !== name)));
  try {
    if (isUuid(id)) {
      const { error } = await supabaseAdmin.from('add_ons').delete().eq('id', id);
      if (error && name) {
        await supabaseAdmin.from('add_ons').delete().eq('name', name);
      }
    } else if (name) {
      await supabaseAdmin.from('add_ons').delete().eq('name', name);
    }
  } catch (e) {
    console.warn('deleteAddOn error:', e);
  }
}

export async function loadScheduleItems(): Promise<ScheduleItem[]> {
  try {
    const { data, error } = await supabaseAdmin.from('schedule_items').select('*').order('sort_order');
    if (!error && data && data.length > 0) {
      setStored('tfs_schedule_items', data);
      return data as ScheduleItem[];
    }
  } catch {}
  return getStored<ScheduleItem[]>('tfs_schedule_items', []);
}

export async function saveScheduleItem(item: Partial<ScheduleItem> & { title: string; day_label: string; time_label: string }): Promise<ScheduleItem> {
  const current = getStored<ScheduleItem[]>('tfs_schedule_items', []);
  const id = item.id || `sch-${Date.now()}`;
  const fullItem: ScheduleItem = {
    id,
    title: item.title,
    day_label: item.day_label,
    time_label: item.time_label,
    description: item.description || '',
    format: item.format || 'Studio & Online',
    sort_order: item.sort_order ?? current.length,
    active: item.active !== false,
  };
  const existingIndex = current.findIndex((s) => s.id === id);
  const updated = existingIndex > -1
    ? current.map((s, i) => (i === existingIndex ? fullItem : s))
    : [...current, fullItem];
  setStored('tfs_schedule_items', updated);
  try {
    if (item.id && !item.id.startsWith('sch-')) {
      await supabaseAdmin.from('schedule_items').upsert(fullItem);
    } else {
      const { id: _, ...insertPayload } = fullItem;
      await supabaseAdmin.from('schedule_items').insert(insertPayload);
    }
  } catch {}
  return fullItem;
}

export async function deleteScheduleItem(id: string, itemTitle?: string): Promise<void> {
  const current = getStored<ScheduleItem[]>('tfs_schedule_items', []);
  const matched = current.find((s) => s.id === id);
  const title = itemTitle || matched?.title;
  setStored('tfs_schedule_items', current.filter((s) => s.id !== id && (!title || s.title !== title)));
  try {
    if (isUuid(id)) {
      const { error } = await supabaseAdmin.from('schedule_items').delete().eq('id', id);
      if (error && title) {
        await supabaseAdmin.from('schedule_items').delete().eq('title', title);
      }
    } else if (title) {
      await supabaseAdmin.from('schedule_items').delete().eq('title', title);
    }
  } catch (e) {
    console.warn('deleteScheduleItem error:', e);
  }
}

// ----------------- DEFAULT ACTIVE STUDENTS & SEEDING -----------------

export function getDefaultStudents(): StudentProfile[] {
  return [
    {
      id: 'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
      first_name: 'Sankha',
      last_name: 'Saha',
      email: 'codr.sankha.contact@gmail.com',
      phone_number: '+91 91234 56789',
      curriculum: 'Guitar',
      class_schedule: 'Home Visit — ₹1,500/month',
      preferred_schedule: 'Weekend Flexible',
      monthly_fee: 1500,
      fee_status: 'Up to date',
      fee_due_date: '1st of every month',
      profession: 'Student',
      address: 'Bengaluru, India',
      status: 'active',
      overall_progress_pct: 100,
      instructor_feedback: 'Master level certification; classical harmony and acoustic compositions.',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
  ];
}

export async function seedStudentsToSupabase(students = getDefaultStudents()): Promise<void> {
  for (const s of students) {
    try {
      // 1. Save to student_profiles
      await supabaseAdmin.from('student_profiles').upsert({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        email: s.email,
        phone_number: s.phone_number,
        curriculum: s.curriculum,
        class_schedule: s.class_schedule,
        status: s.status,
      }, { onConflict: 'email' });

      // 2. Save to student_plans
      await supabaseAdmin.from('student_plans').upsert({
        student_id: s.id,
        instrument: s.curriculum,
        format: s.class_schedule,
        schedule_text: s.preferred_schedule || 'Weekend Flexible',
        status: s.status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });

      // 3. Save to student_data (try full schema first, fallback to minimal if columns missing)
      try {
        await supabaseAdmin.from('student_data').upsert({
          id: s.id,
          user_id: s.id,
          student_name: `${s.first_name} ${s.last_name}`.trim(),
          email: s.email,
          phone_number: s.phone_number,
          instrument: s.curriculum,
          monthly_fee: s.monthly_fee || 1500,
          format: s.class_schedule,
          schedule_text: s.preferred_schedule,
          status: s.status,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch {
        try {
          await supabaseAdmin.from('student_data').upsert({
            id: s.id,
            user_id: s.id,
            instrument: s.curriculum,
            monthly_fee: s.monthly_fee || 1500,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        } catch {}
      }
    } catch (e) {
      console.warn('seedStudentsToSupabase item notice:', e);
    }
  }
}

// ----------------- REAL DATABASE STUDENT SYNCHRONIZATION -----------------

export async function loadStudents(): Promise<StudentProfile[]> {
  const studentMap = new Map<string, StudentProfile>();

  try {
    // 1. Fetch from student_profiles
    const { data: spList, error: spErr } = await supabaseAdmin
      .from('student_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (spErr) console.warn('Supabase student_profiles fetch:', spErr.message);
    if (spList) {
      for (const sp of spList) {
        studentMap.set(sp.id, {
          id: sp.id,
          first_name: sp.first_name || 'Student',
          last_name: sp.last_name || '',
          email: sp.email || '',
          phone_number: sp.phone_number || '',
          curriculum: sp.curriculum || 'Guitar',
          class_schedule: sp.class_schedule || 'Home Tuition — ₹1,300/month',
          preferred_schedule: sp.preferred_schedule || 'Saturday — 10:00 AM – 1:00 PM',
          monthly_fee: sp.monthly_fee !== undefined && sp.monthly_fee !== null ? Number(sp.monthly_fee) : 1300,
          fee_status: sp.fee_status || 'Up to date',
          fee_due_date: sp.fee_due_date || '',
          addons: Array.isArray(sp.addons) ? sp.addons : (typeof sp.addons === 'string' ? [sp.addons] : []),
          profession: sp.profession || '',
          address: sp.address || '',
          notes: sp.notes || '',
          bio: sp.bio || '',
          emergency_contact: sp.emergency_contact || '',
          emergency_phone: sp.emergency_phone || '',
          avatar_url: sp.avatar_url || '',
          module_progress: sp.module_progress || {},
          overall_progress_pct: sp.overall_progress_pct ?? 0,
          instructor_feedback: sp.instructor_feedback || '',
          milestone_badges: Array.isArray(sp.milestone_badges) ? sp.milestone_badges : [],
          last_evaluated_at: sp.last_evaluated_at || '',
          admission_id: sp.admission_id || '',
          status: (sp.status as any) || 'active',
          created_at: sp.created_at || new Date().toISOString(),
          updated_at: sp.updated_at,
        });
      }
    }

    // 2. Fetch from student_plans to enrich instruments, formats, and schedules
    try {
      const { data: plansList } = await supabaseAdmin.from('student_plans').select('*');
      if (plansList && plansList.length > 0) {
        for (const plan of plansList) {
          const student = studentMap.get(plan.student_id);
          if (student) {
            if (plan.instrument) student.curriculum = plan.instrument;
            if (plan.format) student.class_schedule = plan.format;
            if (plan.schedule_text) student.preferred_schedule = plan.schedule_text;
            if (plan.status) student.status = plan.status as any;
          }
        }
      }
    } catch {}

    // 3. Fallback to student_data / students_data if student_profiles was empty
    if (studentMap.size === 0) {
      try {
        const { data: sdList } = await supabaseAdmin.from('student_data').select('*');
        if (sdList && sdList.length > 0) {
          for (const sd of sdList) {
            const sid = sd.id || sd.user_id || `sd-${Date.now()}`;
            const nameParts = (sd.student_name || 'Student').trim().split(' ');
            studentMap.set(sid, {
              id: sid,
              first_name: nameParts[0] || 'Student',
              last_name: nameParts.slice(1).join(' ') || '',
              email: sd.email || '',
              phone_number: sd.phone_number || '',
              curriculum: sd.instrument || 'Guitar',
              class_schedule: sd.format || 'Home Tuition — ₹1,300/month',
              preferred_schedule: sd.schedule_text || 'Saturday — 10:00 AM – 1:00 PM',
              monthly_fee: sd.monthly_fee ? Number(sd.monthly_fee) : 1300,
              fee_status: 'Up to date',
              status: (sd.status as any) || 'active',
              created_at: sd.updated_at || new Date().toISOString(),
            });
          }
        }
      } catch {}
    }

    // 4. Fetch from profiles where role is 'student'
    const { data: pList, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (pErr) console.warn('Supabase profiles fetch:', pErr.message);
    if (pList) {
      for (const p of pList) {
        const existing = studentMap.get(p.id) || Array.from(studentMap.values()).find(
          (s) => s.email && p.email && s.email.toLowerCase() === p.email.toLowerCase()
        );

        if (existing) {
          if (!existing.email && p.email) existing.email = p.email;
          if (!existing.first_name && (p.full_name || p.display_name)) {
            const nameParts = (p.full_name || p.display_name).trim().split(' ');
            existing.first_name = nameParts[0];
            existing.last_name = nameParts.slice(1).join(' ');
          }
        } else {
          // Student role exists in profiles but was missing in student_profiles!
          const nameParts = (p.full_name || p.display_name || 'Student').trim().split(' ');
          const newStudent: StudentProfile = {
            id: p.id,
            first_name: nameParts[0] || 'Student',
            last_name: nameParts.slice(1).join(' ') || '',
            email: p.email || '',
            phone_number: '',
            curriculum: 'Guitar',
            class_schedule: 'Home Tuition — ₹1,300/month',
            status: 'active',
            created_at: p.created_at || new Date().toISOString(),
          };
          studentMap.set(p.id, newStudent);

          // Auto-sync into student_profiles table so database stays consistent
          try {
            await supabaseAdmin.from('student_profiles').insert({
              id: p.id,
              first_name: newStudent.first_name,
              last_name: newStudent.last_name,
              email: newStudent.email || `student-${p.id.slice(0, 8)}@thefretboardsociety.com`,
              curriculum: newStudent.curriculum,
              class_schedule: newStudent.class_schedule,
              status: newStudent.status,
            });
          } catch (insertErr) {
            console.warn('Auto-sync insert error for profile student:', insertErr);
          }
        }
      }
    }

    // 3. Check auth users list for any with student role or matching student_profiles
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      if (authData?.users) {
        for (const u of authData.users) {
          if (u.app_metadata?.role === 'student' && u.email) {
            const existing = studentMap.get(u.id) || Array.from(studentMap.values()).find(
              (s) => s.email && s.email.toLowerCase() === u.email!.toLowerCase()
            );
            if (!existing) {
              const fullName = (u.user_metadata?.full_name || u.email.split('@')[0] || 'Student').trim();
              const nameParts = fullName.split(' ');
              const newStudent: StudentProfile = {
                id: u.id,
                first_name: nameParts[0] || 'Student',
                last_name: nameParts.slice(1).join(' ') || '',
                email: u.email,
                phone_number: u.phone || u.user_metadata?.phone || '',
                curriculum: u.user_metadata?.curriculum || 'Guitar',
                class_schedule: u.user_metadata?.class_schedule || 'Home Tuition — ₹1,300/month',
                avatar_url: u.user_metadata?.avatar_url || '',
                bio: u.user_metadata?.bio || '',
                emergency_contact: u.user_metadata?.emergency_contact || '',
                emergency_phone: u.user_metadata?.emergency_phone || '',
                module_progress: u.user_metadata?.module_progress || {},
                overall_progress_pct: u.user_metadata?.overall_progress_pct ?? 0,
                instructor_feedback: u.user_metadata?.instructor_feedback || '',
                milestone_badges: u.user_metadata?.milestone_badges || [],
                last_evaluated_at: u.user_metadata?.last_evaluated_at || '',
                status: 'active',
                created_at: u.created_at || new Date().toISOString(),
              };
              studentMap.set(u.id, newStudent);
              await supabaseAdmin.from('student_profiles').upsert({
                id: u.id,
                first_name: newStudent.first_name,
                last_name: newStudent.last_name,
                email: newStudent.email,
                curriculum: newStudent.curriculum,
                status: 'active',
              });
              await supabaseAdmin.from('profiles').upsert({
                id: u.id,
                role: 'student',
                email: u.email,
                full_name: fullName,
                display_name: fullName,
              });
            } else {
              // Attach metadata to existing student
              if (u.user_metadata?.avatar_url && !existing.avatar_url) existing.avatar_url = u.user_metadata.avatar_url;
              if (u.user_metadata?.bio && !existing.bio) existing.bio = u.user_metadata.bio;
              if (u.user_metadata?.emergency_contact && !existing.emergency_contact) existing.emergency_contact = u.user_metadata.emergency_contact;
              if (u.user_metadata?.emergency_phone && !existing.emergency_phone) existing.emergency_phone = u.user_metadata.emergency_phone;
              if (u.user_metadata?.module_progress) existing.module_progress = u.user_metadata.module_progress;
              if (u.user_metadata?.overall_progress_pct !== undefined) existing.overall_progress_pct = u.user_metadata.overall_progress_pct;
              if (u.user_metadata?.instructor_feedback) existing.instructor_feedback = u.user_metadata.instructor_feedback;
              if (u.user_metadata?.milestone_badges) existing.milestone_badges = u.user_metadata.milestone_badges;
              if (u.user_metadata?.last_evaluated_at) existing.last_evaluated_at = u.user_metadata.last_evaluated_at;
            }
          }
        }
      }
    } catch (authSyncErr) {
      console.warn('Auth users lookup warning:', authSyncErr);
    }
  } catch (err) {
    console.error('Error synchronizing database students:', err);
  }

  // 5. Purge any known mock student IDs from studentMap
  const MOCK_IDS = new Set([
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555',
  ]);
  for (const id of MOCK_IDS) {
    studentMap.delete(id);
  }

  // 6. If all remote tables are empty, load active defaults and auto-seed Supabase
  if (studentMap.size === 0) {
    const cachedPre = getStored<StudentProfile[]>('tfs_students', []).filter((s) => !MOCK_IDS.has(s.id));
    const defaults = cachedPre.length > 0 ? cachedPre : getDefaultStudents();
    for (const d of defaults) {
      studentMap.set(d.id, d);
    }
    try {
      window.setTimeout(() => void seedStudentsToSupabase(defaults), 150);
    } catch {}
  }

  // Merge extra local metadata (like custom notes or preferred slot or progress) if present
  const cached = getStored<StudentProfile[]>('tfs_students', []).filter((s) => !MOCK_IDS.has(s.id));
  const cachedMap = new Map(cached.map((c) => [c.id, c]));

  let finalStudents = Array.from(studentMap.values()).filter((s) => !MOCK_IDS.has(s.id));
  if (finalStudents.length === 0) {
    finalStudents = cached.length > 0 ? cached : getDefaultStudents();
  }

  const result = finalStudents.map((s) => {
    const c = cachedMap.get(s.id);
    let localProg = s.module_progress;
    try {
      const stored = localStorage.getItem(`tfs_progress_${s.id}`);
      if (stored) localProg = JSON.parse(stored);
    } catch {}

    if (!c) return { ...s, module_progress: localProg || s.module_progress };
    return {
      ...s,
      preferred_schedule: c.preferred_schedule || s.preferred_schedule,
      addons: c.addons || s.addons,
      monthly_fee: c.monthly_fee || s.monthly_fee,
      profession: c.profession || s.profession,
      address: c.address || s.address,
      avatar_url: s.avatar_url || c.avatar_url,
      bio: s.bio || c.bio,
      emergency_contact: s.emergency_contact || c.emergency_contact,
      emergency_phone: s.emergency_phone || c.emergency_phone,
      admission_id: c.admission_id || s.admission_id,
      fee_status: c.fee_status || s.fee_status,
      fee_due_date: c.fee_due_date || s.fee_due_date,
      notes: c.notes || s.notes,
      module_progress: s.module_progress && Object.keys(s.module_progress).length > 0 ? s.module_progress : (localProg || c.module_progress),
      overall_progress_pct: s.overall_progress_pct !== undefined ? s.overall_progress_pct : c.overall_progress_pct,
      instructor_feedback: s.instructor_feedback || c.instructor_feedback,
      milestone_badges: s.milestone_badges || c.milestone_badges,
      last_evaluated_at: s.last_evaluated_at || c.last_evaluated_at,
    };
  });

  setStored('tfs_students', result);
  return result;
}

export async function saveStudent(student: Partial<StudentProfile> & { first_name: string; email: string }): Promise<StudentProfile> {
  const current = getStored<StudentProfile[]>('tfs_students', []);
  const now = new Date().toISOString();
  const email = student.email.trim();
  const firstName = student.first_name.trim();
  const lastName = (student.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || 'Student';

  let authUserId = student.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.id)
    ? student.id
    : '';

  // 1. Verify or establish real auth user in auth.users so foreign key constraint profiles_id_fkey succeeds
  try {
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    let matchedUser = usersData?.users?.find(
      (u: any) =>
        (email && u.email?.toLowerCase() === email.toLowerCase()) ||
        (authUserId && u.id === authUserId)
    );

    if (matchedUser) {
      authUserId = matchedUser.id;
      // Ensure app_metadata has student role
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        app_metadata: { role: 'student' },
        user_metadata: { full_name: fullName },
      });
    } else {
      // Create user in auth.users
      const tempPass = 'TFS@' + Math.floor(100000 + Math.random() * 900000);
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPass,
        email_confirm: true,
        user_metadata: { full_name: fullName },
        app_metadata: { role: 'student' },
      });

      if (created?.user) {
        authUserId = created.user.id;
      } else if (createErr) {
        // If user already exists in auth, refetch users list to find their ID
        const { data: refetched } = await supabaseAdmin.auth.admin.listUsers();
        const found = refetched?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (found) {
          authUserId = found.id;
          await supabaseAdmin.auth.admin.updateUserById(authUserId, {
            app_metadata: { role: 'student' },
          });
        }
      }
    }
  } catch (authErr) {
    console.warn('Auth user sync warning in saveStudent:', authErr);
  }

  // Fallback to existing or random UUID only if auth admin was unreachable
  if (!authUserId) {
    authUserId = student.id || crypto.randomUUID();
  }

  const existing = current.find(
    (s) => (authUserId && s.id === authUserId) || (email && s.email.toLowerCase() === email.toLowerCase())
  );

  const fullStudent: StudentProfile = {
    id: authUserId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone_number: student.phone_number !== undefined ? student.phone_number : existing?.phone_number || '',
    curriculum: student.curriculum || existing?.curriculum || 'Guitar',
    class_schedule: student.class_schedule || existing?.class_schedule || 'Home Tuition — ₹1,300/month',
    preferred_schedule: student.preferred_schedule || existing?.preferred_schedule || 'Saturday — 10:00 AM – 1:00 PM',
    addons: student.addons !== undefined ? student.addons : existing?.addons || [],
    monthly_fee: student.monthly_fee !== undefined ? Number(student.monthly_fee) : existing?.monthly_fee || 1300,
    profession: student.profession !== undefined ? student.profession : existing?.profession || '',
    address: student.address !== undefined ? student.address : existing?.address || '',
    avatar_url: student.avatar_url !== undefined ? student.avatar_url : existing?.avatar_url || '',
    bio: student.bio !== undefined ? student.bio : existing?.bio || '',
    emergency_contact: student.emergency_contact !== undefined ? student.emergency_contact : existing?.emergency_contact || '',
    emergency_phone: student.emergency_phone !== undefined ? student.emergency_phone : existing?.emergency_phone || '',
    status: student.status || existing?.status || 'active',
    admission_id: student.admission_id !== undefined ? student.admission_id : existing?.admission_id || '',
    admission_fee_paid: student.admission_fee_paid !== undefined ? student.admission_fee_paid : existing?.admission_fee_paid !== false,
    fee_status: student.fee_status || existing?.fee_status || 'Up to date',
    fee_due_date: student.fee_due_date || existing?.fee_due_date || '',
    notes: student.notes !== undefined ? student.notes : existing?.notes || '',
    module_progress: student.module_progress || existing?.module_progress || {},
    overall_progress_pct: student.overall_progress_pct !== undefined ? student.overall_progress_pct : existing?.overall_progress_pct ?? 0,
    instructor_feedback: student.instructor_feedback !== undefined ? student.instructor_feedback : existing?.instructor_feedback || '',
    milestone_badges: student.milestone_badges || existing?.milestone_badges || [],
    last_evaluated_at: student.last_evaluated_at || existing?.last_evaluated_at || '',
    created_at: student.created_at || existing?.created_at || now,
    updated_at: now,
  };

  // Sync to auth user_metadata so it persists across devices in Supabase Auth
  if (authUserId) {
    try {
      const { data: uData } = await supabaseAdmin.auth.admin.getUserById(authUserId);
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          ...(uData?.user?.user_metadata || {}),
          full_name: fullName,
          avatar_url: fullStudent.avatar_url,
          bio: fullStudent.bio,
          phone: fullStudent.phone_number,
          emergency_contact: fullStudent.emergency_contact,
          emergency_phone: fullStudent.emergency_phone,
          curriculum: fullStudent.curriculum,
          class_schedule: fullStudent.class_schedule,
          module_progress: fullStudent.module_progress,
          overall_progress_pct: fullStudent.overall_progress_pct,
          instructor_feedback: fullStudent.instructor_feedback,
          milestone_badges: fullStudent.milestone_badges,
          last_evaluated_at: fullStudent.last_evaluated_at,
        },
      });
    } catch (metaErr) {
      console.warn('Auth user metadata sync warning:', metaErr);
    }
  }

  // 2. Sync to profiles table with student role (if id is valid UUID)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fullStudent.id)) {
    try {
      const { error: pErr } = await supabaseAdmin.from('profiles').upsert({
        id: fullStudent.id,
        role: 'student',
        email: fullStudent.email,
        display_name: fullName,
        full_name: fullName,
        updated_at: now,
      });
      if (pErr) console.warn('Supabase profiles save error:', pErr.message);
    } catch (e) {
      console.warn('Profiles upsert exception:', e);
    }
  }

  // 3. Sync to student_profiles table in Supabase
  try {
    const fullPayload: Record<string, any> = {
      first_name: fullStudent.first_name,
      last_name: fullStudent.last_name,
      email: fullStudent.email,
      phone_number: fullStudent.phone_number || '',
      curriculum: fullStudent.curriculum || 'Guitar',
      class_schedule: fullStudent.class_schedule || 'Home Tuition — ₹1,300/month',
      preferred_schedule: fullStudent.preferred_schedule || '',
      monthly_fee: fullStudent.monthly_fee ?? 0,
      fee_status: fullStudent.fee_status || 'Up to date',
      fee_due_date: fullStudent.fee_due_date || '',
      addons: fullStudent.addons || [],
      profession: fullStudent.profession || '',
      address: fullStudent.address || '',
      notes: fullStudent.notes || '',
      bio: fullStudent.bio || '',
      emergency_contact: fullStudent.emergency_contact || '',
      emergency_phone: fullStudent.emergency_phone || '',
      avatar_url: fullStudent.avatar_url || '',
      module_progress: fullStudent.module_progress || {},
      overall_progress_pct: fullStudent.overall_progress_pct ?? 0,
      instructor_feedback: fullStudent.instructor_feedback || '',
      milestone_badges: fullStudent.milestone_badges || [],
      last_evaluated_at: fullStudent.last_evaluated_at || null,
      admission_id: fullStudent.admission_id || '',
      status: fullStudent.status || 'active',
      updated_at: now,
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fullStudent.id)) {
      fullPayload.id = fullStudent.id;
    }

    const { error: spErr } = await supabaseAdmin.from('student_profiles').upsert(fullPayload, { onConflict: 'email' });
    if (spErr) {
      // Fallback in case remote schema is pending migration of newer columns
      await supabaseAdmin.from('student_profiles').upsert({
        first_name: fullStudent.first_name,
        last_name: fullStudent.last_name,
        email: fullStudent.email,
        phone_number: fullStudent.phone_number,
        curriculum: fullStudent.curriculum,
        class_schedule: fullStudent.class_schedule,
        status: fullStudent.status,
        updated_at: now,
        ...(fullPayload.id ? { id: fullPayload.id } : {}),
      }, { onConflict: 'email' });
    }
  } catch (e) {
    console.warn('Student_profiles upsert exception:', e);
  }

  // Sync to student_plans & student_data
  if (isUuid(fullStudent.id)) {
    try {
      await supabaseAdmin.from('student_plans').upsert({
        student_id: fullStudent.id,
        instrument: fullStudent.curriculum,
        format: fullStudent.class_schedule,
        schedule_text: fullStudent.preferred_schedule || 'Weekend',
        status: fullStudent.status || 'active',
        updated_at: now,
      }, { onConflict: 'student_id' });
    } catch (planErr) {
      console.warn('student_plans sync notice:', planErr);
    }

    try {
      await supabaseAdmin.from('student_data').upsert({
        id: fullStudent.id,
        user_id: fullStudent.id,
        student_name: `${fullStudent.first_name} ${fullStudent.last_name}`.trim(),
        email: fullStudent.email,
        phone_number: fullStudent.phone_number,
        instrument: fullStudent.curriculum,
        monthly_fee: fullStudent.monthly_fee || 1500,
        format: fullStudent.class_schedule,
        schedule_text: fullStudent.preferred_schedule,
        status: fullStudent.status || 'active',
        updated_at: now,
      }, { onConflict: 'id' });
    } catch {
      try {
        await supabaseAdmin.from('student_data').upsert({
          id: fullStudent.id,
          user_id: fullStudent.id,
          instrument: fullStudent.curriculum,
          monthly_fee: fullStudent.monthly_fee || 1500,
          updated_at: now,
        }, { onConflict: 'id' });
      } catch (dataErr) {
        console.warn('student_data sync notice:', dataErr);
      }
    }
  }

  // 4. Update local cache
  if (fullStudent.module_progress) {
    try {
      localStorage.setItem(`tfs_progress_${fullStudent.id}`, JSON.stringify(fullStudent.module_progress));
    } catch {}
  }

  const existingIndex = current.findIndex(
    (s) => s.id === fullStudent.id || s.email.toLowerCase() === fullStudent.email.toLowerCase()
  );
  const updated = existingIndex > -1
    ? current.map((s, i) => (i === existingIndex ? fullStudent : s))
    : [fullStudent, ...current];

  setStored('tfs_students', updated);
  return fullStudent;
}

export async function saveStudentProgress(
  studentId: string,
  progress: Record<string, 'not_started' | 'in_progress' | 'mastered'>,
  feedback?: string,
  badges?: string[]
): Promise<void> {
  const current = getStored<StudentProfile[]>('tfs_students', []);
  const now = new Date().toISOString();

  // Compute percentage: Mastered = 100%, In Progress = 50%
  const total = Object.keys(progress).length;
  let masteredCount = 0;
  let inProgressCount = 0;
  Object.values(progress).forEach((s) => {
    if (s === 'mastered') masteredCount++;
    else if (s === 'in_progress') inProgressCount++;
  });
  const pct = total > 0 ? Math.round(((masteredCount * 1.0 + inProgressCount * 0.5) / total) * 100) : 0;

  const updated = current.map((s) => {
    if (s.id === studentId) {
      return {
        ...s,
        module_progress: progress,
        overall_progress_pct: pct,
        instructor_feedback: feedback !== undefined ? feedback : s.instructor_feedback,
        milestone_badges: badges !== undefined ? badges : s.milestone_badges,
        last_evaluated_at: now,
        updated_at: now,
      };
    }
    return s;
  });

  setStored('tfs_students', updated);
  try {
    localStorage.setItem(`tfs_progress_${studentId}`, JSON.stringify(progress));
  } catch {}

  // 1. Direct update to student_profiles in Supabase database
  const targetStudent = current.find((s) => s.id === studentId);
  try {
    const progressPayload: Record<string, any> = {
      module_progress: progress,
      overall_progress_pct: pct,
      updated_at: now,
      last_evaluated_at: now,
    };
    if (feedback !== undefined) progressPayload.instructor_feedback = feedback;
    if (badges !== undefined) progressPayload.milestone_badges = badges;

    let dbUpdated = false;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)) {
      const { error: idErr } = await supabaseAdmin.from('student_profiles').update(progressPayload).eq('id', studentId);
      if (!idErr) dbUpdated = true;
    }
    if (!dbUpdated && targetStudent?.email) {
      await supabaseAdmin.from('student_profiles').update(progressPayload).eq('email', targetStudent.email);
    }
  } catch (dbErr) {
    console.warn('saveStudentProgress database update warning:', dbErr);
  }

  // 2. Sync to Supabase auth user_metadata if studentId is UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)) {
    try {
      const { data: uData } = await supabaseAdmin.auth.admin.getUserById(studentId);
      if (uData?.user) {
        await supabaseAdmin.auth.admin.updateUserById(studentId, {
          user_metadata: {
            ...uData.user.user_metadata,
            module_progress: progress,
            overall_progress_pct: pct,
            instructor_feedback: feedback !== undefined ? feedback : uData.user.user_metadata?.instructor_feedback,
            milestone_badges: badges !== undefined ? badges : uData.user.user_metadata?.milestone_badges,
            last_evaluated_at: now,
          },
        });
      }
    } catch (e) {
      console.warn('Could not sync progress to auth user_metadata:', e);
    }
  }
}

export async function deleteStudent(id: string, email?: string): Promise<{ success: boolean; error?: string }> {
  // Update local store immediately
  const current = getStored<StudentProfile[]>('tfs_students', []);
  const matched = current.find((s) => s.id === id || (email && s.email.toLowerCase() === email.toLowerCase()));
  const studentEmail = email || matched?.email;
  
  setStored(
    'tfs_students',
    current.filter((s) => s.id !== id && (!studentEmail || s.email.toLowerCase() !== studentEmail.toLowerCase()))
  );

  const validUuid = isUuid(id) ? id : null;
  let lastError: string | null = null;

  try {
    // 1. Delete dependent student requests
    if (validUuid) {
      await supabaseAdmin.from('student_requests').delete().eq('student_id', validUuid);
    }
    if (studentEmail) {
      await supabaseAdmin.from('student_requests').delete().eq('student_email', studentEmail);
    }

    // 2. Delete dependent fee payments
    if (validUuid) {
      await supabaseAdmin.from('fee_payments').delete().eq('student_id', validUuid);
    }
    if (studentEmail) {
      await supabaseAdmin.from('fee_payments').delete().eq('student_email', studentEmail);
    }

    // 3. Delete dependent class updates & student plans
    if (validUuid) {
      try { await supabaseAdmin.from('class_updates').delete().eq('student_id', validUuid); } catch {}
      try { await supabaseAdmin.from('student_plans').delete().eq('student_id', validUuid); } catch {}
      try { await supabaseAdmin.from('student_data').delete().eq('id', validUuid); } catch {}
      try { await supabaseAdmin.from('student_data').delete().eq('user_id', validUuid); } catch {}
      try { await supabaseAdmin.from('payments').delete().eq('user_id', validUuid); } catch {}
    }
    if (studentEmail) {
      try { await supabaseAdmin.from('student_data').delete().eq('email', studentEmail); } catch {}
    }

    // 4. Delete from student_profiles
    if (validUuid) {
      const { error: spErr } = await supabaseAdmin.from('student_profiles').delete().eq('id', validUuid);
      if (spErr && studentEmail) {
        await supabaseAdmin.from('student_profiles').delete().eq('email', studentEmail);
      }
    } else if (studentEmail) {
      await supabaseAdmin.from('student_profiles').delete().eq('email', studentEmail);
    }

    // 5. Delete from profiles
    if (validUuid) {
      const { error: pErr } = await supabaseAdmin.from('profiles').delete().eq('id', validUuid);
      if (pErr && studentEmail) {
        await supabaseAdmin.from('profiles').delete().eq('email', studentEmail);
      }
    } else if (studentEmail) {
      await supabaseAdmin.from('profiles').delete().eq('email', studentEmail);
    }

    // 6. Find auth user and delete from auth.users
    let targetAuthId = validUuid || '';
    if (!targetAuthId && studentEmail) {
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const found = usersData?.users?.find((u: any) => u.email?.toLowerCase() === studentEmail.toLowerCase());
        if (found) {
          targetAuthId = found.id;
        }
      } catch {}
    }

    if (targetAuthId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(targetAuthId);
      } catch (authDelErr) {
        console.warn('Auth user delete notice:', authDelErr);
      }
    }
  } catch (err: any) {
    console.error('Error deleting student from database:', err);
    lastError = err.message || String(err);
  }

  if (lastError) {
    return { success: true, error: `Removed locally; database notice: ${lastError}` };
  }
  return { success: true };
}

// ----------------- ADMISSIONS DISPATCH & PERSISTENCE -----------------

export function loadStoredAdmissions(): AdmissionSubmission[] {
  return getStored<AdmissionSubmission[]>('tfs_admissions', []);
}

export async function saveAdmissionLocally(admission: AdmissionSubmission): Promise<void> {
  const current = loadStoredAdmissions();
  const existing = current.findIndex((a) => a.admission_id === admission.admission_id);
  const updated = existing > -1
    ? current.map((a, i) => (i === existing ? admission : a))
    : [admission, ...current];
  setStored('tfs_admissions', updated);
}

export function deleteAdmissionRecord(id: string): void {
  const current = loadStoredAdmissions();
  setStored(
    'tfs_admissions',
    current.filter((a) => a.id !== id && a.admission_id !== id)
  );
}

export async function submitAdmissionToSpreadsheet(payload: Record<string, any>): Promise<{ success: boolean; admissionId?: string; error?: string }> {
  const apiUrl = getAdmissionApiUrl();

  let cleanPhone = String(payload.phone || '').replace(/\D/g, '');
  if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

  const cleanPayload = {
    ...payload,
    phone: cleanPhone,
    schedule: payload.schedule || 'Weekend session',
  };

  if (!apiUrl) {
    return {
      success: true,
      admissionId: payload.admissionId,
      error: 'Google Apps Script URL not configured. Submission saved to local database.',
    };
  }

  try {
    const formBody = new URLSearchParams();
    Object.entries(cleanPayload).forEach(([k, v]) => {
      formBody.append(k, String(v ?? ''));
    });

    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: formBody.toString(),
    });

    return { success: true, admissionId: payload.admissionId };
  } catch (err) {
    console.warn('Apps Script fetch error:', err);
    return {
      success: true,
      admissionId: payload.admissionId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchSpreadsheetAdmissions(): Promise<{ headers: string[]; rows: string[][]; spreadsheetUrl?: string; error?: string }> {
  const apiUrl = getAdmissionApiUrl();
  if (!apiUrl) {
    return { headers: [], rows: [], error: 'Google Apps Script URL is not set.' };
  }

  const callbackName = `tfsAdmissionsCallback_${Date.now()}`;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    const callbackWindow = globalThis as unknown as Record<string, (resp: any) => void>;

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve({ headers: [], rows: [], error: 'Apps Script timeout. Check deployment permissions (must be Anyone).' });
    }, 12000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      // Give a 15-second grace period before deleting callback so delayed network responses don't throw Uncaught ReferenceError
      window.setTimeout(() => {
        try {
          delete callbackWindow[callbackName];
        } catch {}
      }, 15000);
      try {
        script.remove();
      } catch {}
    };

    callbackWindow[callbackName] = (resp: any) => {
      cleanup();
      if (resp && resp.success) {
        if (resp.spreadsheetUrl) setGoogleSheetUrl(resp.spreadsheetUrl);
        resolve({
          headers: resp.headers || [],
          rows: resp.rows || [],
          spreadsheetUrl: resp.spreadsheetUrl,
        });
      } else {
        resolve({ headers: [], rows: [], error: resp?.error || 'Failed to retrieve spreadsheet data.' });
      }
    };

    script.onerror = () => {
      cleanup();
      resolve({ headers: [], rows: [], error: 'Could not connect to Google Apps Script. Check network or deployment URL.' });
    };

    script.src = `${apiUrl}?action=admissions&callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;
    document.head.appendChild(script);
  });
}

// ----------------- FEE PAYMENTS DISPATCH & PERSISTENCE -----------------

export function loadStoredFeePayments(): FeePaymentRecord[] {
  return getStored<FeePaymentRecord[]>('tfs_fee_payments', []);
}

export async function fetchFeePayments(): Promise<FeePaymentRecord[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('fee_payments')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const mapped: FeePaymentRecord[] = data.map((d: any) => ({
        id: d.id,
        timestamp: d.created_at,
        payment_reference: d.payment_reference,
        payment_status: d.payment_status,
        utr: d.utr,
        payer_name: d.payer_name,
        student_name: d.student_name,
        student_email: d.student_email,
        phone: d.phone || '',
        curriculum: d.curriculum || 'Guitar',
        class_type: d.class_type || 'Home Visit',
        addons: d.addons || 'None',
        amount: Number(d.amount || 0),
        notes: d.notes || '',
        verified_at: d.verified_at || undefined,
      }));
      setStored('tfs_fee_payments', mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Could not fetch fee_payments from Supabase:', err);
  }
  return loadStoredFeePayments();
}

export async function saveFeePaymentRecord(record: FeePaymentRecord): Promise<void> {
  const current = loadStoredFeePayments();
  const existing = current.findIndex((p) => p.payment_reference === record.payment_reference);
  const updated = existing > -1
    ? current.map((p, i) => (i === existing ? record : p))
    : [record, ...current];
  setStored('tfs_fee_payments', updated);

  // 1. Sync to Supabase fee_payments table
  try {
    await supabase.from('fee_payments').upsert({
      payment_reference: record.payment_reference,
      payment_status: record.payment_status,
      utr: record.utr,
      payer_name: record.payer_name,
      student_name: record.student_name,
      student_email: record.student_email,
      phone: record.phone || '',
      curriculum: record.curriculum || 'Guitar',
      class_type: record.class_type || 'Home Visit',
      addons: record.addons || 'None',
      amount: record.amount,
      notes: record.notes || '',
      verified_at: record.verified_at || null,
      created_at: record.timestamp || new Date().toISOString(),
    }, { onConflict: 'payment_reference' });
  } catch (supaErr) {
    console.warn('Could not sync fee payment to Supabase fee_payments:', supaErr);
  }

  // 2. Forward to Google Apps Script spreadsheet
  const apiUrl = getAdmissionApiUrl();
  if (apiUrl) {
    try {
      const formBody = new URLSearchParams();
      const payload: Record<string, any> = {
        name: record.student_name,
        phone: record.phone || '',
        email: record.student_email,
        address: 'Monthly fee payment',
        profession: 'Existing student',
        curriculum: record.curriculum,
        classType: record.class_type,
        addons: record.addons || '',
        schedule: 'Monthly fee payment',
        utr: record.utr,
        payerName: record.payer_name,
        paymentReference: record.payment_reference,
        paymentType: 'feePayment',
        paymentAmount: record.amount,
      };
      Object.entries(payload).forEach(([k, v]) => formBody.append(k, String(v)));
      await fetch(apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: formBody.toString(),
      });
    } catch (e) {
      console.warn('Failed to forward fee payment to Google Sheet:', e);
    }
  }
}

export async function deleteFeePaymentRecord(id: string): Promise<void> {
  const current = loadStoredFeePayments();
  setStored(
    'tfs_fee_payments',
    current.filter((p) => p.id !== id && p.payment_reference !== id)
  );
  try {
    if (isUuid(id)) {
      await supabaseAdmin.from('fee_payments').delete().or(`id.eq.${id},payment_reference.eq.${id}`);
    } else {
      await supabaseAdmin.from('fee_payments').delete().eq('payment_reference', id);
    }
  } catch (e) {
    console.warn('deleteFeePaymentRecord error:', e);
  }
}

export async function updateFeePaymentStatus(
  paymentId: string,
  newStatus: 'PENDING VERIFICATION' | 'VERIFIED' | 'REJECTED',
  notes?: string
): Promise<void> {
  const current = loadStoredFeePayments();
  const updated = current.map((p) => {
    if (p.id === paymentId || p.payment_reference === paymentId) {
      return {
        ...p,
        payment_status: newStatus,
        notes: notes || p.notes,
        verified_at: newStatus === 'VERIFIED' ? new Date().toISOString() : p.verified_at,
      };
    }
    return p;
  });
  setStored('tfs_fee_payments', updated);

  const matched = current.find((p) => p.id === paymentId || p.payment_reference === paymentId);

  // 1. Sync status to Supabase fee_payments table
  try {
    await supabaseAdmin
      .from('fee_payments')
      .update({
        payment_status: newStatus,
        notes: notes || matched?.notes || '',
        verified_at: newStatus === 'VERIFIED' ? new Date().toISOString() : (matched?.verified_at || null),
      })
      .eq('payment_reference', matched?.payment_reference || paymentId);
  } catch (err) {
    console.warn('Could not update fee_payments in Supabase:', err);
  }

  // 2. If verified, automatically update student fee status in database
  if (matched && matched.student_email && newStatus === 'VERIFIED') {
    try {
      await supabaseAdmin
        .from('student_profiles')
        .update({
          fee_status: 'Up to date',
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('email', matched.student_email);
    } catch {}
  }
}

export async function loadDiscounts(): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin.from('discounts').select('*').eq('active', true);
    if (!error && data) return data;
  } catch {}
  return [];
}

export async function recordStudentPayment(payload: {
  student_id: string;
  amount: number;
  billing_period?: string;
  coupon_code?: string;
  utr: string;
  payer_name: string;
  student_name: string;
  student_email: string;
  phone?: string;
  curriculum?: string;
  class_type?: string;
  addons?: string;
  notes?: string;
}): Promise<{ success: boolean; id?: string }> {
  try {
    if (payload.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.student_id)) {
      await supabaseAdmin.from('payments').insert({
        student_id: payload.student_id,
        amount: payload.amount,
        billing_period: payload.billing_period || 'monthly',
        status: 'pending',
        coupon_code: payload.coupon_code || null,
      });
    }
    const feeRec: FeePaymentRecord = {
      id: `fee-${Date.now()}`,
      timestamp: new Date().toISOString(),
      payment_reference: `TFSFEE${Date.now()}`,
      payment_status: 'PENDING VERIFICATION',
      utr: payload.utr,
      payer_name: payload.payer_name,
      student_name: payload.student_name,
      student_email: payload.student_email,
      phone: payload.phone || '',
      curriculum: payload.curriculum || 'Guitar',
      class_type: payload.class_type || 'Home Visit',
      addons: payload.addons || 'None',
      amount: payload.amount,
      notes: payload.notes || 'Monthly tuition fee',
    };
    await saveFeePaymentRecord(feeRec);
    return { success: true, id: feeRec.id };
  } catch (e) {
    console.warn('Error recording student payment:', e);
    return { success: false };
  }
}

// ----------------- STUDENT SELF-PROFILE UPDATE -----------------

export async function updateStudentSelfProfile(
  id: string,
  email: string,
  updates: Partial<StudentProfile>
): Promise<StudentProfile> {
  const current = getStored<StudentProfile[]>('tfs_students', []);
  const existing = current.find(
    (s) => (id && s.id === id) || (email && s.email.toLowerCase() === email.toLowerCase())
  ) || {
    id: id || crypto.randomUUID(),
    first_name: updates.first_name || 'Student',
    last_name: updates.last_name || '',
    email,
    curriculum: 'Guitar',
    class_schedule: 'Home Tuition — ₹1,300/month',
    status: 'active' as const,
    created_at: new Date().toISOString(),
  };

  const updatedStudent: StudentProfile = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // 1. Update in Supabase student_profiles
  try {
    const payload: Record<string, any> = {
      first_name: updatedStudent.first_name,
      last_name: updatedStudent.last_name,
      email: updatedStudent.email,
      phone_number: updatedStudent.phone_number || '',
      curriculum: updatedStudent.curriculum || 'Guitar',
      class_schedule: updatedStudent.class_schedule || 'Home Tuition — ₹1,300/month',
      avatar_url: updatedStudent.avatar_url || '',
      bio: updatedStudent.bio || '',
      emergency_contact: updatedStudent.emergency_contact || '',
      emergency_phone: updatedStudent.emergency_phone || '',
      profession: updatedStudent.profession || '',
      address: updatedStudent.address || '',
      updated_at: new Date().toISOString(),
    };
    if (updatedStudent.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedStudent.id)) {
      payload.id = updatedStudent.id;
    }

    // Attempt update by email
    const { error: spErr } = await supabase
      .from('student_profiles')
      .update(payload)
      .eq('email', email);

    if (spErr) {
      const { error: upsertErr } = await supabaseAdmin
        .from('student_profiles')
        .upsert(payload, { onConflict: 'email' });
      if (upsertErr) {
        // Fallback with base columns if schema migration is pending
        await supabaseAdmin.from('student_profiles').upsert({
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          phone_number: payload.phone_number,
          curriculum: payload.curriculum,
          class_schedule: payload.class_schedule,
          status: 'active',
          updated_at: payload.updated_at,
          ...(payload.id ? { id: payload.id } : {}),
        }, { onConflict: 'email' });
      }
    }

    const fullName = `${updatedStudent.first_name} ${updatedStudent.last_name}`.trim();
    if (fullName) {
      await supabaseAdmin.from('profiles').update({
        display_name: fullName,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      }).eq('email', email);

      // Sync active auth session metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            avatar_url: updatedStudent.avatar_url,
            bio: updatedStudent.bio,
            phone: updatedStudent.phone_number,
            emergency_contact: updatedStudent.emergency_contact,
            emergency_phone: updatedStudent.emergency_phone,
            profession: updatedStudent.profession,
            address: updatedStudent.address,
          },
        });
      } catch {}
    }
  } catch (err) {
    console.warn('Student self-update database warning:', err);
  }

  // 2. Update local storage
  const updatedList = current.map((s) =>
    (s.id === updatedStudent.id || s.email.toLowerCase() === email.toLowerCase()) ? updatedStudent : s
  );
  if (!updatedList.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
    updatedList.unshift(updatedStudent);
  }
  setStored('tfs_students', updatedList);

  return updatedStudent;
}

// ----------------- IMAGE OPTIMIZER HELPER -----------------

export function optimizeImageFile(file: File, maxDim = 320, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to the Supabase Storage 'avatars' bucket.
 * 1. Optimizes the image client-side to ensure zero-lag fast transfer (<100ms standard).
 * 2. Uploads the image binary to the Supabase Storage bucket.
 * 3. Returns the publicly accessible URL.
 * 4. Gracefully degrades to the optimized Base64 data URL if the bucket is unreachable.
 */
export async function uploadImageToBucket(
  file: File,
  folder = 'profiles',
  maxDim = 400,
  quality = 0.85
): Promise<string> {
  let optimizedDataUrl: string;
  try {
    optimizedDataUrl = await optimizeImageFile(file, maxDim, quality);
  } catch {
    optimizedDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  try {
    const res = await fetch(optimizedDataUrl);
    const blob = await res.blob();

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileExt) ? fileExt : 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`,
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload notice:', uploadError.message);
      return optimizedDataUrl;
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    if (publicData?.publicUrl) {
      return publicData.publicUrl;
    }
  } catch (err) {
    console.warn('Storage bucket upload fallback:', err);
  }

  return optimizedDataUrl;
}

// ----------------- CSV SPREADSHEET EXPORTERS -----------------

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [headers, ...rows]
    .map((row) => row.map((val) => `"${String(val ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
