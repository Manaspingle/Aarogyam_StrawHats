import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Donor,
  Hospital,
  Request,
  Allocation,
  Donation,
  Notification,
  Transfer,
  Profile,
  EmergencyIncident,
  Appointment,
  Certificate,
  BloodInventoryItem,
  RewardRule,
  DonorReward,
  EmergencyRequest,
  AuditLog,
} from '@/types';

// In-memory zero-mock reactive storage fallback
let memoryDonors: Donor[] = [];
let memoryHospitals: Hospital[] = [];
let memoryRequests: Request[] = [];
let memoryAllocations: Allocation[] = [];
let memoryDonations: Donation[] = [];
let memoryNotifications: Notification[] = [];
let memoryTransfers: Transfer[] = [];
let memoryAppointments: Appointment[] = [];
let memoryCertificates: Certificate[] = [];
let memoryInventory: BloodInventoryItem[] = [];
let memoryRewardRules: RewardRule[] = [
  {
    id: 'rule_1',
    donation_count: 1,
    points: 30,
    title: 'First-Time Lifesaver',
    description: 'Awarded on your first verified donation visit.',
    badge: 'Bronze Lifesaver',
    active: true,
  },
  {
    id: 'rule_2',
    donation_count: 3,
    points: 100,
    title: 'Dedicated Guardian',
    description: 'Awarded for completing 3 verified donations.',
    badge: 'Silver Guardian',
    active: true,
  },
  {
    id: 'rule_3',
    donation_count: 5,
    points: 250,
    title: 'Healthcare Champion',
    description: 'Awarded for 5 donations saving multiple lives.',
    badge: 'Gold Champion',
    active: true,
  },
  {
    id: 'rule_4',
    donation_count: 10,
    points: 600,
    title: 'Platinum Benefactor',
    description: 'Highest honor for 10+ milestone donations.',
    badge: 'Platinum Hero',
    active: true,
  },
];
let memoryDonorRewards: DonorReward[] = [];
let memoryEmergencyRequests: EmergencyRequest[] = [];
let memoryEmergencyIncidents: EmergencyIncident[] = [];
let memoryAuditLogs: AuditLog[] = [];

// Clean out obsolete demo mock data from localStorage if existing
if (typeof window !== 'undefined') {
  try {
    const legacyMockKeys = ['lifelink_demo_session', 'aarogyam_mock_seeded'];
    legacyMockKeys.forEach(k => localStorage.removeItem(k));
  } catch {}
}

// ==========================================
// DONORS
// ==========================================

export async function getDonors(city?: string): Promise<Donor[]> {
  try {
    const snap = await getDocs(collection(db, 'donors'));
    if (!snap.empty) {
      const live = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Donor));
      memoryDonors = live;
    }
  } catch (err) {
    console.warn('Firestore getDonors fallback:', err);
  }
  let list = [...memoryDonors];
  if (city) {
    list = list.filter((d) => (d.city || '').toLowerCase() === city.toLowerCase());
  }
  return list;
}

export async function getDonor(id: string): Promise<Donor | null> {
  try {
    const snap = await getDoc(doc(db, 'donors', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Donor;
    }
  } catch (err) {
    console.warn('Firestore getDonor fallback:', err);
  }
  return memoryDonors.find((d) => d.id === id || d.user_id === id) || null;
}

export async function createDonor(donor: Omit<Donor, 'id'> & { id?: string }): Promise<Donor> {
  const newId = donor.id || `donor_${Date.now()}`;
  const fullDonor: Donor = { ...donor, id: newId };

  try {
    await setDoc(doc(db, 'donors', newId), fullDonor);
  } catch (err) {
    console.warn('Firestore createDonor fallback:', err);
  }

  memoryDonors = [fullDonor, ...memoryDonors.filter((d) => d.id !== newId)];
  return fullDonor;
}

export async function updateDonor(id: string, updates: Partial<Donor>): Promise<void> {
  try {
    await updateDoc(doc(db, 'donors', id), updates);
  } catch (err) {
    console.warn('Firestore updateDonor fallback:', err);
  }

  memoryDonors = memoryDonors.map((d) => (d.id === id ? { ...d, ...updates } : d));
}

export async function deleteDonor(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'donors', id));
  } catch (err) {
    console.warn('Firestore deleteDonor fallback:', err);
  }
  memoryDonors = memoryDonors.filter((d) => d.id !== id);
}

// ==========================================
// HOSPITALS
// ==========================================

export async function getHospitals(): Promise<Hospital[]> {
  try {
    const snap = await getDocs(collection(db, 'hospitals'));
    if (!snap.empty) {
      const live = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hospital));
      memoryHospitals = live;
      return live;
    }
  } catch (err) {
    console.warn('Firestore getHospitals fallback:', err);
  }
  return memoryHospitals;
}

export async function getHospital(id: string): Promise<Hospital | null> {
  try {
    const snap = await getDoc(doc(db, 'hospitals', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Hospital;
    }
  } catch (err) {
    console.warn('Firestore getHospital fallback:', err);
  }
  return memoryHospitals.find((h) => h.id === id || h.user_id === id) || null;
}

export async function createHospital(hospital: Omit<Hospital, 'id'> & { id?: string }): Promise<Hospital> {
  const newId = hospital.id || `hospital_${Date.now()}`;
  const fullHospital: Hospital = {
    ...hospital,
    id: newId,
    verified: hospital.verified ?? true,
    is_approved: hospital.is_approved ?? true,
  };

  try {
    await setDoc(doc(db, 'hospitals', newId), fullHospital);
  } catch (err) {
    console.warn('Firestore createHospital fallback:', err);
  }

  memoryHospitals = [fullHospital, ...memoryHospitals.filter((h) => h.id !== newId)];
  return fullHospital;
}

export async function saveCustomHospital(hospital: Hospital): Promise<void> {
  try {
    await setDoc(doc(db, 'hospitals', hospital.id), hospital);
  } catch (err) {
    console.warn('Firestore saveCustomHospital fallback:', err);
  }
  memoryHospitals = [hospital, ...memoryHospitals.filter((h) => h.id !== hospital.id)];
}

export async function updateHospital(id: string, updates: Partial<Hospital>): Promise<void> {
  try {
    await updateDoc(doc(db, 'hospitals', id), updates);
  } catch (err) {
    console.warn('Firestore updateHospital fallback:', err);
  }
  memoryHospitals = memoryHospitals.map((h) => (h.id === id ? { ...h, ...updates } : h));
}

export async function deleteHospital(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'hospitals', id));
  } catch (err) {
    console.warn('Firestore deleteHospital fallback:', err);
  }
  memoryHospitals = memoryHospitals.filter((h) => h.id !== id);
}

// ==========================================
// APPOINTMENTS
// ==========================================

export async function getAppointments(filter?: { donor_id?: string; hospital_id?: string }): Promise<Appointment[]> {
  try {
    let q = collection(db, 'appointments');
    const snap = await getDocs(q);
    if (!snap.empty) {
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
      memoryAppointments = list;
    }
  } catch (err) {
    console.warn('Firestore getAppointments fallback:', err);
  }

  let result = [...memoryAppointments];
  if (filter?.donor_id) {
    result = result.filter((a) => a.donor_id === filter.donor_id);
  }
  if (filter?.hospital_id) {
    result = result.filter((a) => a.hospital_id === filter.hospital_id);
  }
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createAppointment(appt: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
  const newId = `appt_${Date.now()}`;
  const fullAppt: Appointment = {
    ...appt,
    id: newId,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'appointments', newId), fullAppt);
  } catch (err) {
    console.warn('Firestore createAppointment fallback:', err);
  }

  memoryAppointments = [fullAppt, ...memoryAppointments];
  return fullAppt;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<void> {
  try {
    await updateDoc(doc(db, 'appointments', id), updates);
  } catch (err) {
    console.warn('Firestore updateAppointment fallback:', err);
  }
  memoryAppointments = memoryAppointments.map((a) => (a.id === id ? { ...a, ...updates } : a));
}

export async function cancelAppointment(id: string): Promise<void> {
  await updateAppointment(id, { status: 'cancelled' });
}

// ==========================================
// CERTIFICATES
// ==========================================

export async function getCertificates(filter?: { donor_id?: string; hospital_id?: string }): Promise<Certificate[]> {
  try {
    const snap = await getDocs(collection(db, 'certificates'));
    if (!snap.empty) {
      memoryCertificates = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Certificate));
    }
  } catch (err) {
    console.warn('Firestore getCertificates fallback:', err);
  }

  let result = [...memoryCertificates];
  if (filter?.donor_id) {
    result = result.filter((c) => c.donor_id === filter.donor_id);
  }
  if (filter?.hospital_id) {
    result = result.filter((c) => c.hospital_id === filter.hospital_id);
  }
  return result.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
}

export async function createCertificate(cert: Omit<Certificate, 'id' | 'issued_at'>): Promise<Certificate> {
  const newId = `cert_${Date.now()}`;
  const fullCert: Certificate = {
    ...cert,
    id: newId,
    issued_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'certificates', newId), fullCert);
  } catch (err) {
    console.warn('Firestore createCertificate fallback:', err);
  }

  memoryCertificates = [fullCert, ...memoryCertificates];
  return fullCert;
}

// ==========================================
// BLOOD INVENTORY
// ==========================================

export async function getBloodInventory(hospitalId: string): Promise<BloodInventoryItem[]> {
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  try {
    const snap = await getDocs(collection(db, `hospitals/${hospitalId}/inventory`));
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BloodInventoryItem));
      return items;
    }
  } catch (err) {
    console.warn('Firestore getBloodInventory fallback:', err);
  }

  // Find in memory
  let items = memoryInventory.filter((i) => i.hospital_id === hospitalId);
  if (items.length === 0) {
    items = BLOOD_GROUPS.map((bg) => ({
      id: `inv_${hospitalId}_${bg.replace('+', 'pos').replace('-', 'neg')}`,
      hospital_id: hospitalId,
      blood_group: bg,
      units_available: 0,
      updated_at: new Date().toISOString(),
    }));
    memoryInventory.push(...items);
  }
  return items;
}

export async function updateBloodInventoryUnits(
  hospitalId: string,
  bloodGroup: string,
  newUnits: number
): Promise<void> {
  const cleanUnits = Math.max(0, newUnits);
  const invId = `inv_${hospitalId}_${bloodGroup.replace('+', 'pos').replace('-', 'neg')}`;
  const payload: BloodInventoryItem = {
    id: invId,
    hospital_id: hospitalId,
    blood_group: bloodGroup,
    units_available: cleanUnits,
    updated_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, `hospitals/${hospitalId}/inventory`, invId), payload);
  } catch (err) {
    console.warn('Firestore updateBloodInventory fallback:', err);
  }

  memoryInventory = [
    payload,
    ...memoryInventory.filter((i) => !(i.hospital_id === hospitalId && i.blood_group === bloodGroup)),
  ];
}

// ==========================================
// REWARD RULES & DONOR REWARDS
// ==========================================

export async function getRewardRules(): Promise<RewardRule[]> {
  try {
    const snap = await getDocs(collection(db, 'reward_rules'));
    if (!snap.empty) {
      memoryRewardRules = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RewardRule));
    }
  } catch (err) {
    console.warn('Firestore getRewardRules fallback:', err);
  }
  return [...memoryRewardRules].sort((a, b) => a.donation_count - b.donation_count);
}

export async function saveRewardRule(rule: Omit<RewardRule, 'id'> & { id?: string }): Promise<RewardRule> {
  const newId = rule.id || `rule_${Date.now()}`;
  const fullRule: RewardRule = { ...rule, id: newId, active: rule.active ?? true };

  try {
    await setDoc(doc(db, 'reward_rules', newId), fullRule);
  } catch (err) {
    console.warn('Firestore saveRewardRule fallback:', err);
  }

  memoryRewardRules = [fullRule, ...memoryRewardRules.filter((r) => r.id !== newId)];
  return fullRule;
}

export async function toggleRewardRule(id: string, active: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'reward_rules', id), { active });
  } catch (err) {
    console.warn('Firestore toggleRewardRule fallback:', err);
  }
  memoryRewardRules = memoryRewardRules.map((r) => (r.id === id ? { ...r, active } : r));
}

export async function getDonorRewards(donorId: string): Promise<DonorReward[]> {
  try {
    const snap = await getDocs(collection(db, 'donor_rewards'));
    if (!snap.empty) {
      memoryDonorRewards = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DonorReward));
    }
  } catch (err) {
    console.warn('Firestore getDonorRewards fallback:', err);
  }
  return memoryDonorRewards.filter((r) => r.donor_id === donorId);
}

export async function addDonorReward(reward: Omit<DonorReward, 'id' | 'created_at'>): Promise<DonorReward> {
  const newId = `dreward_${Date.now()}`;
  const fullReward: DonorReward = {
    ...reward,
    id: newId,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'donor_rewards', newId), fullReward);
  } catch (err) {
    console.warn('Firestore addDonorReward fallback:', err);
  }

  memoryDonorRewards = [fullReward, ...memoryDonorRewards];
  return fullReward;
}

// ==========================================
// EMERGENCY REQUESTS (HOSPITAL BROADCAST)
// ==========================================

export async function getEmergencyRequests(hospitalId?: string): Promise<EmergencyRequest[]> {
  try {
    const snap = await getDocs(collection(db, 'emergency_requests'));
    if (!snap.empty) {
      memoryEmergencyRequests = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmergencyRequest));
    }
  } catch (err) {
    console.warn('Firestore getEmergencyRequests fallback:', err);
  }

  let list = [...memoryEmergencyRequests];
  if (hospitalId) {
    list = list.filter((e) => e.requesting_hospital_id === hospitalId);
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createEmergencyRequest(req: Omit<EmergencyRequest, 'id' | 'created_at'>): Promise<EmergencyRequest> {
  const newId = `emreq_${Date.now()}`;
  const fullReq: EmergencyRequest = {
    ...req,
    id: newId,
    status: req.status || 'active',
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'emergency_requests', newId), fullReq);
  } catch (err) {
    console.warn('Firestore createEmergencyRequest fallback:', err);
  }

  memoryEmergencyRequests = [fullReq, ...memoryEmergencyRequests];
  return fullReq;
}

export async function updateEmergencyRequestStatus(id: string, status: 'active' | 'fulfilled' | 'closed'): Promise<void> {
  try {
    await updateDoc(doc(db, 'emergency_requests', id), { status });
  } catch (err) {
    console.warn('Firestore updateEmergencyRequest fallback:', err);
  }
  memoryEmergencyRequests = memoryEmergencyRequests.map((e) => (e.id === id ? { ...e, status } : e));
}

// ==========================================
// EMERGENCY INCIDENTS (LANDING PAGE SOS / BYSTANDER)
// ==========================================

export async function getEmergencyIncidents(): Promise<EmergencyIncident[]> {
  try {
    const snap = await getDocs(collection(db, 'emergency_incidents'));
    if (!snap.empty) {
      memoryEmergencyIncidents = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmergencyIncident));
    }
  } catch (err) {
    console.warn('Firestore getEmergencyIncidents fallback:', err);
  }
  return [...memoryEmergencyIncidents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function createEmergencyIncident(incident: EmergencyIncident): Promise<EmergencyIncident> {
  try {
    await setDoc(doc(db, 'emergency_incidents', incident.id), incident);
  } catch (err) {
    console.warn('Firestore createEmergencyIncident fallback:', err);
  }
  memoryEmergencyIncidents = [incident, ...memoryEmergencyIncidents];
  return incident;
}

// ==========================================
// AAROGYAM REQUESTS & ALLOCATIONS
// ==========================================

export async function getRequests(hospitalId?: string): Promise<Request[]> {
  try {
    const snap = await getDocs(collection(db, 'requests'));
    if (!snap.empty) {
      memoryRequests = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Request));
    }
  } catch (err) {
    console.warn('Firestore getRequests fallback:', err);
  }
  let list = [...memoryRequests];
  if (hospitalId) list = list.filter((r) => r.hospital_id === hospitalId);
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getRequest(id: string): Promise<Request | null> {
  try {
    const snap = await getDoc(doc(db, 'requests', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Request;
    }
  } catch (err) {
    console.warn('Firestore getRequest fallback:', err);
  }
  return memoryRequests.find((r) => r.id === id) || null;
}

export async function createRequest(req: Omit<Request, 'id' | 'created_at'>): Promise<Request> {
  const newId = `req_${Date.now()}`;
  const fullReq: Request = {
    ...req,
    id: newId,
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'requests', newId), fullReq);
  } catch (err) {
    console.warn('Firestore createRequest fallback:', err);
  }
  memoryRequests = [fullReq, ...memoryRequests];
  return fullReq;
}

export async function updateRequest(id: string, updates: Partial<Request>): Promise<void> {
  try {
    await updateDoc(doc(db, 'requests', id), updates);
  } catch (err) {
    console.warn('Firestore updateRequest fallback:', err);
  }
  memoryRequests = memoryRequests.map((r) => (r.id === id ? { ...r, ...updates } : r));
}

export async function createAllocation(alloc: Omit<Allocation, 'id'> & { id?: string; created_at?: string }): Promise<Allocation> {
  const newId = alloc.id || `alloc_${Date.now()}`;
  const fullAlloc: Allocation = {
    ...alloc,
    id: newId,
    created_at: alloc.created_at || new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'allocations', newId), fullAlloc);
  } catch (err) {
    console.warn('Firestore createAllocation fallback:', err);
  }
  memoryAllocations = [fullAlloc, ...memoryAllocations];
  return fullAlloc;
}

export async function getAllocations(): Promise<Allocation[]> {
  try {
    const snap = await getDocs(collection(db, 'allocations'));
    if (!snap.empty) {
      memoryAllocations = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Allocation));
    }
  } catch (err) {
    console.warn('Firestore getAllocations fallback:', err);
  }
  return [...memoryAllocations];
}

// ==========================================
// DONATIONS & ORGAN PLEDGES
// ==========================================

export async function getDonations(donorId?: string): Promise<Donation[]> {
  try {
    const snap = await getDocs(collection(db, 'donations'));
    if (!snap.empty) {
      memoryDonations = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Donation));
    }
  } catch (err) {
    console.warn('Firestore getDonations fallback:', err);
  }
  let list = [...memoryDonations];
  if (donorId) list = list.filter((d) => d.donor_id === donorId);
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createDonation(donation: Omit<Donation, 'id' | 'created_at'>): Promise<Donation> {
  const newId = `don_${Date.now()}`;
  const fullDon: Donation = {
    ...donation,
    id: newId,
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'donations', newId), fullDon);
  } catch (err) {
    console.warn('Firestore createDonation fallback:', err);
  }
  memoryDonations = [fullDon, ...memoryDonations];
  return fullDon;
}

// ==========================================
// TRANSFERS (CROSS-HOSPITAL LOGISTICS)
// ==========================================

export async function getTransfers(hospitalId?: string): Promise<Transfer[]> {
  try {
    const snap = await getDocs(collection(db, 'transfers'));
    if (!snap.empty) {
      memoryTransfers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transfer));
    }
  } catch (err) {
    console.warn('Firestore getTransfers fallback:', err);
  }
  let list = [...memoryTransfers];
  if (hospitalId) {
    list = list.filter((t) => t.from_hospital_id === hospitalId || t.to_hospital_id === hospitalId);
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createTransfer(transfer: Omit<Transfer, 'id' | 'created_at'>): Promise<Transfer> {
  const newId = `trans_${Date.now()}`;
  const fullTrans: Transfer = {
    ...transfer,
    id: newId,
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'transfers', newId), fullTrans);
  } catch (err) {
    console.warn('Firestore createTransfer fallback:', err);
  }
  memoryTransfers = [fullTrans, ...memoryTransfers];
  return fullTrans;
}

// ==========================================
// AUDIT LOGS (TRANSPARENCY LEDGER)
// ==========================================

export async function getTransparencyLogs(): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(collection(db, 'audit_logs'));
    if (!snap.empty) {
      memoryAuditLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
    }
  } catch (err) {
    console.warn('Firestore getTransparencyLogs fallback:', err);
  }
  return [...memoryAuditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
  const newId = `audit_${Date.now()}`;
  const fullLog: AuditLog = {
    ...log,
    id: newId,
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'audit_logs', newId), fullLog);
  } catch (err) {
    console.warn('Firestore createAuditLog fallback:', err);
  }
  memoryAuditLogs = [fullLog, ...memoryAuditLogs];
  return fullLog;
}

// Notifications
export async function getNotifications(donorId: string): Promise<Notification[]> {
  return memoryNotifications.filter((n) => n.donor_id === donorId);
}

export async function markNotificationRead(id: string): Promise<void> {
  memoryNotifications = memoryNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
}

export async function createNotification(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
  const newId = `notif_${Date.now()}`;
  const fullNotif: Notification = {
    ...notif,
    id: newId,
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'notifications', newId), fullNotif);
  } catch (err) {
    console.warn('Firestore createNotification fallback:', err);
  }
  memoryNotifications = [fullNotif, ...memoryNotifications];
  return fullNotif;
}

// Backward compatibility aliases
export const getRequestById = getRequest;
export const getDonorById = getDonor;
export const getHospitalById = getHospital;

