import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Siren, Phone, MapPin, Building2, Clock,
  CheckCircle2, AlertTriangle, X, Radio, ArrowRight,
  Stethoscope, Navigation, ExternalLink, Users, LocateFixed
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { createEmergencyIncident } from '@/lib/firebaseDb';
import type { EmergencyIncident } from '@/types';

interface EmergencyAccidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCity?: 'Mumbai' | 'Pune' | 'Nagpur';
}

const CITY_TRAUMA_CENTERS: Record<string, { name: string; phone: string; address: string; mapUrl: string; eta: number }> = {
  Mumbai: {
    name: 'KEM Hospital & Apex Trauma Center',
    phone: '022-24107000',
    address: 'Acharya Donde Marg, Parel, Mumbai 400012',
    mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=KEM+Hospital+Mumbai',
    eta: 8,
  },
  Pune: {
    name: 'Sassoon General Hospital & Trauma ICU',
    phone: '020-26128000',
    address: 'Near Pune Railway Station, Pune 411001',
    mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=Sassoon+General+Hospital+Pune',
    eta: 9,
  },
  Nagpur: {
    name: 'Government Medical College & Hospital (GMCH)',
    phone: '0712-2744654',
    address: 'Medical Square, Hanuman Nagar, Nagpur 440003',
    mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=GMC+Nagpur',
    eta: 10,
  },
};

export default function EmergencyAccidentModal({
  isOpen,
  onClose,
  defaultCity = 'Mumbai',
}: EmergencyAccidentModalProps) {
  const { t } = useLanguage();
  const [selectedCity, setSelectedCity] = useState<'Mumbai' | 'Pune' | 'Nagpur'>(defaultCity);
  const [emergencyType, setEmergencyType] = useState<'Roadside Accident / Trauma' | 'Urgent Blood Required' | 'Cardiac / ICU Emergency'>('Roadside Accident / Trauma');
  const [patientCount, setPatientCount] = useState<number>(1);
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  
  // Real-time dispatched state
  const [isDispatched, setIsDispatched] = useState(false);
  const [emergencyToken, setEmergencyToken] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const traumaCenter = CITY_TRAUMA_CENTERS[selectedCity] || CITY_TRAUMA_CENTERS.Mumbai;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const token = `EMG-${selectedCity.substring(0, 3).toUpperCase()}-${randomNum}`;
    setEmergencyToken(token);

    const incident: EmergencyIncident = {
      id: `incident_${Date.now()}`,
      token,
      city: selectedCity,
      primary_hospital_id: `trauma_${selectedCity.toLowerCase()}`,
      primary_hospital_name: traumaCenter.name,
      patients_total: patientCount,
      patients_primary: patientCount,
      patients_secondary: 0,
      reach_time_minutes: traumaCenter.eta,
      timestamp: new Date().toISOString(),
      status: 'Prepped & Awaiting Patient',
      caller_name: callerName.trim() || 'Good Samaritan Bystander',
      caller_phone: callerPhone.trim() || 'Not Provided',
      caller_note: `Type: ${emergencyType}. Location: ${landmark || selectedCity}. Notes: ${notes || 'Immediate assistance requested'}`,
      category: emergencyType,
    };

    await createEmergencyIncident(incident);
    setSubmitting(false);
    setIsDispatched(true);
  };

  const handleReset = () => {
    setIsDispatched(false);
    setEmergencyToken('');
    setCallerName('');
    setCallerPhone('');
    setLandmark('');
    setNotes('');
    setPatientCount(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-500/50 overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/20 border border-white/30 animate-pulse">
                <Siren className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                    Emergency Response 24x7
                  </span>
                  <span className="text-red-200 text-xs font-semibold">• Zero Login Required</span>
                </div>
                <h2 className="text-xl font-black tracking-tight mt-0.5">
                  Instant Accident & Trauma Triage
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1-Tap Helplines Bar */}
          <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900/60 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-red-900 dark:text-red-200">
              <Phone className="w-4 h-4 text-red-600 animate-pulse" />
              <span>National Helplines:</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:108"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-sm transition-all"
              >
                <Phone className="w-3 h-3" /> Call 108 (Ambulance)
              </a>
              <a
                href="tel:112"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
              >
                <Phone className="w-3 h-3" /> Call 112 (Emergency)
              </a>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isDispatched ? (
              /* Dispatched Confirmation Screen */
              <div className="space-y-5">
                <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-black uppercase tracking-wider">
                    Emergency Alert Broadcasted
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    Trauma Bay Notification Active
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Emergency Token: <strong className="font-mono text-red-600 dark:text-red-400 text-base">{emergencyToken}</strong>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Designated Trauma Center ({selectedCity})
                      </span>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                        {traumaCenter.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{traumaCenter.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" /> ~{traumaCenter.eta} Mins ETA
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <a
                      href={`tel:${traumaCenter.phone.replace(/[^0-9]/g, '')}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Casualty Directly ({traumaCenter.phone})
                    </a>
                    <a
                      href={traumaCenter.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" /> GPS Directions
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">⚠️ Critical Bystander Instructions:</p>
                  <p>1. Keep the patient's airway clear. Do not move the neck if cervical trauma is suspected.</p>
                  <p>2. Keep your mobile phone active. Casualty duty doctors or the 108 ambulance driver may call for exact location.</p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    ← Submit another alert
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Clean, High-Impact SOS Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* City Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Incident City (Maharashtra)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Mumbai', 'Pune', 'Nagpur'] as const).map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setSelectedCity(city)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedCity === city
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emergency Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Emergency Nature
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(['Roadside Accident / Trauma', 'Urgent Blood Required', 'Cardiac / ICU Emergency'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEmergencyType(type)}
                        className={`p-3 rounded-xl text-left border text-xs font-bold transition-all ${
                          emergencyType === type
                            ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-900 dark:text-red-200 ring-1 ring-red-500'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Count & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Number of Patients / Victims
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      {[1, 2, 3, 4, '5+'].map((num, idx) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPatientCount(idx + 1)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            patientCount === idx + 1
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Exact Landmark / Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Near Toll Plaza / Metro Pillar 42"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Caller Contact (Phone & Name) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Your Callback Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={callerPhone}
                        onChange={(e) => setCallerPhone(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Caller Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amit (Bystander)"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Quick Note */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Patient Condition / Quick Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bleeding from limb, conscious, needs stretcher"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-sm shadow-lg shadow-red-600/30 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <Siren className="w-4 h-4 animate-bounce" />
                    <span>{submitting ? 'Broadcasting Emergency...' : 'DISPATCH EMERGENCY ALERT & PREP TRAUMA BAY'}</span>
                  </button>
                  <p className="text-center text-[11px] text-slate-500 mt-2">
                    Protected by Good Samaritan Law · Zero legal liability for emergency assistance
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
