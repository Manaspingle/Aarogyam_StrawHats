export type UserRole = 'individual' | 'hospital' | 'admin';

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  verification_hash: string;
  created_at: string;
}

export interface AmbulanceDriver {
  id: string;
  driver_name: string;
  phone: string;
  city: 'Mumbai' | 'Pune' | 'Nagpur' | string;
  vehicle_no: string;
  capacity_type: 'Large Capacity (ICU / Ventilator)' | 'Small Capacity (Basic Life Support)' | string;
  equipment: string[];
  price_inr: number;
  base_rate_info: string;
  rating: number;
  trips_completed: number;
  reach_time_minutes: number;
  distance_km: number;
  available: boolean;
  lat: number;
  lng: number;
}

export interface EmergencyDoctor {
  name: string;
  role: string;
  specialization: string;
  on_duty: boolean;
}

export interface EmergencyHospital {
  id: string;
  name: string;
  type: 'Government' | 'Private';
  city: 'Mumbai' | 'Pune' | 'Nagpur' | string;
  address: string;
  phone: string;
  emergency_helpline: string;
  reach_time_minutes: number;
  distance_km: number;
  lat: number;
  lng: number;
  beds: {
    icu_total: number;
    icu_available: number;
    trauma_total: number;
    trauma_available: number;
    general_emergency_total: number;
    general_emergency_available: number;
  };
  doctors: EmergencyDoctor[];
  facilities: string[];
  cost_tier: 'Free / Subsidized' | 'Standard Private' | 'Premium Super-Specialty';
  google_maps_url: string;
}

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Donor {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  age: number;
  blood_group: string;
  gender?: 'male' | 'female';
  city: string;
  phone: string;
  address?: string;
  organs: string[];
  emergency_contact: string;
  consent: boolean;
  available: boolean;
  donor_level: string;
  donor_points: number;
  blood_donations: number;
  completed_donations?: number;
  last_donation_date?: string | null;
  is_verified?: boolean;
  medical_allergies: string;
  medical_conditions: string;
  lat: number;
  lng: number;
  created_at: string;
}

export interface Hospital {
  id: string;
  user_id: string | null;
  email: string;
  hospital_name: string;
  name?: string;
  registration_id: string;
  city: string;
  address: string;
  contact_person: string;
  phone: string;
  emergency_helpline?: string;
  twilio_phone_number?: string;
  verified: boolean;
  is_approved?: boolean;
  managed_by?: string | null;
  lat: number;
  lng: number;
  inventory: Record<string, number>;
  created_at: string;
}

export interface Appointment {
  id: string;
  donor_id: string;
  donor_name?: string;
  donor?: Donor | Profile;
  hospital_id: string;
  hospital_name?: string;
  hospital?: Hospital;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  completed_at?: string | null;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  donor_id: string;
  donor_name: string;
  donor_blood_group?: string | null;
  hospital_id?: string;
  hospital_name?: string;
  appointment_id?: string;
  donation_date: string;
  units_collected?: number;
  issued_at: string;
  donation_type?: 'blood' | 'organ_pledge';
  organs?: string[];
}

export interface BloodInventoryItem {
  id: string;
  hospital_id: string;
  blood_group: string;
  units_available: number;
  updated_at: string;
}

export interface RewardRule {
  id: string;
  donation_count: number;
  points: number;
  title: string;
  description: string;
  badge: string;
  active: boolean;
  created_at?: string;
}

export interface DonorReward {
  id: string;
  donor_id: string;
  reward_id?: string | null;
  points: number;
  reward_title: string;
  badge?: string;
  created_at: string;
}

export interface EmergencyCallDispatchLog {
  hospital_id: string;
  hospital_name: string;
  to_phone: string;
  from_phone: string;
  call_sid?: string;
  status: string;
  timestamp: string;
}

export interface EmergencyRequest {
  id: string;
  requesting_hospital_id: string;
  hospital_name?: string;
  blood_group: string;
  units_needed: number;
  urgency: 'critical' | 'urgent' | 'moderate' | 'Critical' | 'High' | 'Moderate';
  status: 'active' | 'fulfilled' | 'closed';
  notes?: string;
  city?: string;
  target_hospital_ids?: string[];
  called_hospitals?: EmergencyCallDispatchLog[];
  created_at: string;
}

export interface Request {
  id: string;
  hospital_id: string;
  request_type: 'blood' | 'organ';
  specific_type: string;
  urgency: 'Critical' | 'High' | 'Moderate';
  patient_age: number;
  patient_city: string;
  required_by: string;
  status: 'Pending' | 'Matched' | 'Dispatched' | 'Completed' | 'Cancelled';
  matched_donor_id: string | null;
  match_score: number | null;
  created_at: string;
  delivery_time: string | null;
}

export interface Allocation {
  id: string;
  request_id: string;
  donor_id: string;
  score: number;
  verification_hash: string;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  donation_type: 'blood' | 'organ_pledge';
  donation_date: string;
  points_earned: number;
  hospital_id?: string;
  units?: number;
  verified?: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  donor_id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Transfer {
  id: string;
  from_hospital_id: string;
  to_hospital_id: string;
  organ_type: string | null;
  blood_type: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  delivery_time: string | null;
}

export interface ScoredDonor extends Donor {
  compatibilityScore: number;
  proximityScore: number;
  reliabilityScore: number;
  finalScore: number;
  distance: number;
  rank: number;
}

export interface EmergencyIncident {
  id: string;
  token: string;
  city: string;
  target_hospital_id: string;
  target_hospital_name: string;
  primary_hospital_id?: string;
  primary_hospital_name?: string;
  secondary_hospital_id?: string;
  secondary_hospital_name?: string;
  patient_count: number;
  patients_total: number;
  patients_primary?: number;
  patients_secondary?: number;
  location_landmark: string;
  caller_phone: string;
  caller_name?: string;
  notes?: string;
  caller_note?: string;
  category?: string;
  reach_time_minutes?: number;
  timestamp: string;
  updated_at?: string;
  status:
    | 'pending'
    | 'accepted'
    | 'redirected'
    | 'resolved'
    | 'Prepped & Awaiting Patient'
    | 'Acknowledged'
    | 'Received'
    | 'Dispatched';
  ambulance_dispatched?: boolean;
  ambulance_details?: {
    vehicle_number: string;
    driver_name: string;
    driver_phone: string;
    eta_minutes: number;
    dispatched_at: string;
  };
  redirected_from_hospital_id?: string;
  redirected_from_hospital_name?: string;
  redirect_reason?: string;
}
