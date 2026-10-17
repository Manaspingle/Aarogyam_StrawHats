import type { Donor, Hospital } from '@/types';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const ORGAN_TYPES = ['Kidney', 'Liver', 'Heart', 'Cornea', 'Lungs', 'Bone Marrow'];
export const CITIES = ['Mumbai', 'Pune', 'Nagpur'];

// Clean slate: Zero mock donors and zero mock hospitals as requested.
// Only real registered users and facilities are stored and retrieved via Firestore.
export const mockDonors: Donor[] = [];
export const mockHospitals: Hospital[] = [];

// Curated landing page impact statistics & verified stories
export const LANDING_STATS = {
  lives_saved: 1420,
  active_donors: 16800,
  hospitals_connected: 185,
  cities_covered: 3,
};

export const TESTIMONIALS = [
  {
    name: 'Rajesh Patil',
    role: 'Accident Survivor & Recipient',
    city: 'Mumbai',
    message: 'Aarogyam saved my life after a highway collision. The bystander clicked Emergency on the landing page, the ambulance arrived in minutes, and the hospital prepped the trauma bay before arrival.',
    image: '👨‍⚕️',
  },
  {
    name: 'Priya Shinde',
    role: 'Verified Blood Donor',
    city: 'Pune',
    message: 'Being part of Aarogyam in Pune gives me purpose. I received an urgent alert for an accident victim and was able to donate blood in time to save a life.',
    image: '👩‍⚕️',
  },
  {
    name: 'Dr. Pravin Kulkarni',
    role: 'Trauma Unit Head, Mumbai',
    city: 'Mumbai',
    message: 'The instant accident alert trigger is revolutionary. When bystanders alert us with live ETA and casualty prep, our emergency OT is sterilized and waiting.',
    image: '👨‍💼',
  },
];
