import { supabase, supabaseAdmin } from './supabase';

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
  status: 'active' | 'pending_verification' | 'inactive' | 'suspended';
  admission_id?: string;
  admission_fee_paid?: boolean;
  fee_status?: 'Up to date' | 'Due' | 'Overdue' | 'Pending Verification';
  fee_due_date?: string;
  notes?: string;
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

export async function deleteFeePlan(id: string): Promise<void> {
  const current = getStored<FeePlan[]>('tfs_fee_plans', []);
  setStored('tfs_fee_plans', current.filter((p) => p.id !== id));
  try {
    await supabaseAdmin.from('fee_plans').delete().eq('id', id);
  } catch {}
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

export async function deleteCurriculumItem(id: string): Promise<void> {
  const current = getStored<CurriculumItem[]>('tfs_curriculum_items', []);
  setStored('tfs_curriculum_items', current.filter((c) => c.id !== id));
  try {
    await supabaseAdmin.from('curriculum_items').delete().eq('id', id);
  } catch {}
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

export async function deleteAddOn(id: string): Promise<void> {
  const current = getStored<AddOn[]>('tfs_add_ons', []);
  setStored('tfs_add_ons', current.filter((a) => a.id !== id));
  try {
    await supabaseAdmin.from('add_ons').delete().eq('id', id);
  } catch {}
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

export async function deleteScheduleItem(id: string): Promise<void> {
  const current = getStored<ScheduleItem[]>('tfs_schedule_items', []);
  setStored('tfs_schedule_items', current.filter((s) => s.id !== id));
  try {
    await supabaseAdmin.from('schedule_items').delete().eq('id', id);
  } catch {}
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
          preferred_schedule: 'Saturday — 10:00 AM – 1:00 PM',
          status: (sp.status as any) || 'active',
          notes: '',
          created_at: sp.created_at || new Date().toISOString(),
          updated_at: sp.updated_at,
        });
      }
    }

    // 2. Fetch from profiles where role is 'student'
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
                phone_number: u.phone || '',
                curriculum: 'Guitar',
                class_schedule: 'Home Tuition — ₹1,300/month',
                status: 'active',
                created_at: u.created_at || new Date().toISOString(),
              };
              studentMap.set(u.id, newStudent);
              await supabaseAdmin.from('student_profiles').upsert({
                id: u.id,
                first_name: newStudent.first_name,
                last_name: newStudent.last_name,
                email: newStudent.email,
                curriculum: 'Guitar',
                status: 'active',
              });
              await supabaseAdmin.from('profiles').upsert({
                id: u.id,
                role: 'student',
                email: u.email,
                full_name: fullName,
                display_name: fullName,
              });
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

  // Merge extra local metadata (like custom notes or preferred slot) if present
  const cached = getStored<StudentProfile[]>('tfs_students', []);
  const cachedMap = new Map(cached.map((c) => [c.id, c]));

  const result = Array.from(studentMap.values()).map((s) => {
    const c = cachedMap.get(s.id);
    if (!c) return s;
    return {
      ...s,
      preferred_schedule: c.preferred_schedule || s.preferred_schedule,
      addons: c.addons || s.addons,
      monthly_fee: c.monthly_fee || s.monthly_fee,
      profession: c.profession || s.profession,
      address: c.address || s.address,
      avatar_url: c.avatar_url || s.avatar_url,
      admission_id: c.admission_id || s.admission_id,
      fee_status: c.fee_status || s.fee_status,
      fee_due_date: c.fee_due_date || s.fee_due_date,
      notes: c.notes || s.notes,
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
    let matchedUser = usersData?.users.find(
      (u) =>
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
        const found = refetched?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
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

  const fullStudent: StudentProfile = {
    id: authUserId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone_number: student.phone_number || '',
    curriculum: student.curriculum || 'Guitar',
    class_schedule: student.class_schedule || 'Home Tuition — ₹1,300/month',
    preferred_schedule: student.preferred_schedule || 'Saturday — 10:00 AM – 1:00 PM',
    addons: student.addons || [],
    monthly_fee: Number(student.monthly_fee) || 1300,
    profession: student.profession || '',
    address: student.address || '',
    avatar_url: student.avatar_url || '',
    status: student.status || 'active',
    admission_id: student.admission_id || '',
    admission_fee_paid: student.admission_fee_paid !== false,
    fee_status: student.fee_status || 'Up to date',
    fee_due_date: student.fee_due_date || '',
    notes: student.notes || '',
    created_at: student.created_at || now,
    updated_at: now,
  };

  // 2. Sync to profiles table with student role (foreign key to auth.users)
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

  // 3. Sync to student_profiles table in Supabase
  try {
    const { error: spErr } = await supabaseAdmin.from('student_profiles').upsert({
      id: fullStudent.id,
      first_name: fullStudent.first_name,
      last_name: fullStudent.last_name,
      email: fullStudent.email,
      phone_number: fullStudent.phone_number,
      curriculum: fullStudent.curriculum,
      class_schedule: fullStudent.class_schedule,
      status: fullStudent.status,
      updated_at: now,
    });
    if (spErr) console.warn('Supabase student_profiles save error:', spErr.message);
  } catch (e) {
    console.warn('Student_profiles upsert exception:', e);
  }

  // 4. Update local cache
  const existingIndex = current.findIndex(
    (s) => s.id === fullStudent.id || s.email.toLowerCase() === fullStudent.email.toLowerCase()
  );
  const updated = existingIndex > -1
    ? current.map((s, i) => (i === existingIndex ? fullStudent : s))
    : [fullStudent, ...current];

  setStored('tfs_students', updated);
  return fullStudent;
}

export async function deleteStudent(id: string, email?: string): Promise<{ success: boolean; error?: string }> {
  // Update local store immediately
  const current = getStored<StudentProfile[]>('tfs_students', []);
  setStored(
    'tfs_students',
    current.filter((s) => s.id !== id && (!email || s.email.toLowerCase() !== email.toLowerCase()))
  );

  let lastError: string | null = null;

  try {
    // 1. Delete dependent student requests
    if (id) {
      await supabaseAdmin.from('student_requests').delete().eq('student_id', id);
    }
    if (email) {
      await supabaseAdmin.from('student_requests').delete().eq('student_email', email);
    }

    // 2. Delete from student_profiles (first by id, and also by email if provided)
    if (id) {
      const { error: spErr } = await supabaseAdmin.from('student_profiles').delete().eq('id', id);
      if (spErr && email) {
        await supabaseAdmin.from('student_profiles').delete().eq('email', email);
      }
    } else if (email) {
      await supabaseAdmin.from('student_profiles').delete().eq('email', email);
    }

    // 3. Delete from profiles (first by id, and also by email if provided)
    if (id) {
      const { error: pErr } = await supabaseAdmin.from('profiles').delete().eq('id', id);
      if (pErr && email) {
        await supabaseAdmin.from('profiles').delete().eq('email', email);
      }
    } else if (email) {
      await supabaseAdmin.from('profiles').delete().eq('email', email);
    }

    // 4. Find auth user and delete from auth.users
    let targetAuthId = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : '';
    if (!targetAuthId && email) {
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const found = usersData?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
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
      delete callbackWindow[callbackName];
      script.remove();
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

export async function saveFeePaymentRecord(record: FeePaymentRecord): Promise<void> {
  const current = loadStoredFeePayments();
  const existing = current.findIndex((p) => p.payment_reference === record.payment_reference);
  const updated = existing > -1
    ? current.map((p, i) => (i === existing ? record : p))
    : [record, ...current];
  setStored('tfs_fee_payments', updated);

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

export function deleteFeePaymentRecord(id: string): void {
  const current = loadStoredFeePayments();
  setStored(
    'tfs_fee_payments',
    current.filter((p) => p.id !== id && p.payment_reference !== id)
  );
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

  // If verified, automatically update student fee status in the database
  const matched = current.find((p) => p.id === paymentId || p.payment_reference === paymentId);
  if (matched && matched.student_email && newStatus === 'VERIFIED') {
    try {
      await supabaseAdmin
        .from('student_profiles')
        .update({
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
      updated_at: new Date().toISOString(),
    };
    if (updatedStudent.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedStudent.id)) {
      payload.id = updatedStudent.id;
    }

    const { error: spErr } = await supabase
      .from('student_profiles')
      .update(payload)
      .eq('email', email);

    if (spErr) {
      // Try with supabaseAdmin
      await supabaseAdmin.from('student_profiles').upsert(payload);
    }

    const fullName = `${updatedStudent.first_name} ${updatedStudent.last_name}`.trim();
    if (fullName) {
      await supabaseAdmin.from('profiles').update({
        display_name: fullName,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      }).eq('email', email);
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
