import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Siren, Phone, MapPin, Building2, Clock,
  CheckCircle2, AlertTriangle, X, Radio, ArrowRight,
  ShieldCheck, Navigation, Users, RefreshCw, Truck
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { createEmergencyIncident, getEmergencyIncidents, getHospitals } from '@/lib/firebaseDb';
import type { EmergencyIncident, Hospital } from '@/types';

interface EmergencyAccidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCity?: string;
}

const COMMON_MAHARASHTRA_CITIES = [
  'Mumbai',
  'Nagpur',
  'Pune',
  'Nashik',
  'Thane',
  'Chhatrapati Sambhaji Nagar',
  'Solapur',
  'Kolhapur',
];

export default function EmergencyAccidentModal({
  isOpen,
  onClose,
  defaultCity = 'Mumbai',
}: EmergencyAccidentModalProps) {
  const { t } = useLanguage();

  // Registered hospitals from Firestore / platform
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState<boolean>(true);

  // Form Fields
  const [selectedCity, setSelectedCity] = useState<string>(defaultCity);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [patientCount, setPatientCount] = useState<number>(1);
  const [landmark, setLandmark] = useState<string>('');
  const [callerPhone, setCallerPhone] = useState<string>('');
  const [callerName, setCallerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Submission & Real-time Live Status State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [emergencyToken, setEmergencyToken] = useState<string>('');
  const [liveIncident, setLiveIncident] = useState<EmergencyIncident | null>(null);

  // Fetch real registered platform hospitals
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchHospitals() {
      setLoadingHospitals(true);
      try {
        const list = await getHospitals();
        if (isMounted) {
          setAllHospitals(list);
        }
      } catch (err) {
        console.error('Failed to load registered hospitals:', err);
      } finally {
        if (isMounted) {
          setLoadingHospitals(false);
        }
      }
    }

    fetchHospitals();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Compute available cities from registered hospitals + common cities
  const uniqueCities = Array.from(
    new Set([
      ...allHospitals.map((h) => h.city?.trim()).filter(Boolean),
      ...COMMON_MAHARASHTRA_CITIES,
    ])
  ) as string[];

  // Filter hospitals registered in the selected city
  const cityHospitals = allHospitals.filter(
    (h) => (h.city || '').toLowerCase().trim() === selectedCity.toLowerCase().trim()
  );

  // Fallback to all registered hospitals if selected city has no registered hospitals
  const displayedHospitals = cityHospitals.length > 0 ? cityHospitals : allHospitals;

  // Auto-select hospital when list changes or if currently selected is invalid
  useEffect(() => {
    if (displayedHospitals.length > 0) {
      const exists = displayedHospitals.some((h) => h.id === selectedHospitalId);
      if (!exists) {
        setSelectedHospitalId(displayedHospitals[0].id);
      }
    } else {
      setSelectedHospitalId('');
    }
  }, [selectedCity, displayedHospitals, selectedHospitalId]);

  // Live real-time polling when incident is dispatched
  useEffect(() => {
    if (!isDispatched || !emergencyToken) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const incidents = await getEmergencyIncidents();
        const found = incidents.find((i) => i.token === emergencyToken);
        if (found && isMounted) {
          setLiveIncident(found);
        }
      } catch (err) {
        console.error('Error polling incident status:', err);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isDispatched, emergencyToken]);

  const selectedHospital =
    allHospitals.find((h) => h.id === selectedHospitalId) || displayedHospitals[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital) {
      alert('Please select a receiving hospital for emergency triage.');
      return;
    }
    if (!callerPhone.trim()) {
      alert('Please enter your callback phone number so the trauma team can coordinate.');
      return;
    }
    if (!landmark.trim()) {
      alert('Please provide the exact accident location or landmark.');
      return;
    }

    setSubmitting(true);

    const cityAbbr = (selectedCity || 'MH').substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const token = `EMG-${cityAbbr}-${randomNum}`;
    const hospitalName =
      selectedHospital.hospital_name || selectedHospital.name || 'Emergency Trauma Center';

    const incident: EmergencyIncident = {
      id: `incident_${Date.now()}`,
      token,
      city: selectedCity,
      target_hospital_id: selectedHospital.id,
      target_hospital_name: hospitalName,
      primary_hospital_id: selectedHospital.id,
      primary_hospital_name: hospitalName,
      patient_count: patientCount,
      patients_total: patientCount,
      patients_primary: patientCount,
      patients_secondary: 0,
      location_landmark: landmark.trim(),
      caller_phone: callerPhone.trim(),
      caller_name: callerName.trim() || 'Bystander / Good Samaritan',
      notes: notes.trim(),
      caller_note: `Location: ${landmark.trim()}. Victims: ${patientCount}. Notes: ${
        notes.trim() || 'Immediate trauma response requested'
      }`,
      category: 'Emergency Accident & Trauma Triage',
      status: 'pending',
      ambulance_dispatched: false,
      timestamp: new Date().toISOString(),
    };

    try {
      await createEmergencyIncident(incident);
      setEmergencyToken(token);
      setLiveIncident(incident);
      setIsDispatched(true);
    } catch (err) {
      console.error('Failed to broadcast emergency accident alert:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsDispatched(false);
    setEmergencyToken('');
    setLiveIncident(null);
    setLandmark('');
    setCallerPhone('');
    setCallerName('');
    setNotes('');
    setPatientCount(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-500/60 overflow-hidden my-auto"
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
                  <span className="text-red-200 text-xs font-semibold">• Direct Hospital Dispatch</span>
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

          {/* National Helplines Bar */}
          <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-red-900 dark:text-red-200">
              <Phone className="w-4 h-4 text-red-600 animate-pulse" />
              <span>Direct Emergency Lines:</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:108"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-xs transition-all"
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
              /* Dispatched Confirmation & Live Status Tracker */
              <div className="space-y-5">
                {/* Status Hero Card */}
                {liveIncident?.status === 'accepted' ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-center space-y-2 animate-fadeIn">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Truck className="w-8 h-8 animate-bounce" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-black uppercase tracking-wider">
                      Request Approved by Hospital
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      Ambulance Dispatched Immediately!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      Emergency Token:{' '}
                      <strong className="font-mono text-red-600 dark:text-red-400 text-base">
                        {emergencyToken}
                      </strong>
                    </p>
                  </div>
                ) : liveIncident?.status === 'redirected' ? (
                  <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-center space-y-2">
                    <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-black uppercase tracking-wider">
                      Trauma Incident Redirected
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Transferred to {liveIncident.target_hospital_name}
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold">
                      Reason: {liveIncident.redirect_reason || 'Beds / accessories currently occupied at initial hospital.'}
                    </p>
                  </div>
                ) : liveIncident?.status === 'resolved' ? (
                  <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-500 text-center space-y-2">
                    <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-300 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Patient Admitted to Trauma Care
                    </h3>
                    <p className="text-xs text-slate-500">Emergency resolved successfully.</p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 text-center space-y-2">
                    <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Clock className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 text-xs font-black uppercase tracking-wider">
                      Awaiting Hospital Review
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Alert Sent to {liveIncident?.target_hospital_name || selectedHospital?.hospital_name || selectedHospital?.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Emergency Token:{' '}
                      <strong className="font-mono text-red-600 dark:text-red-400 text-base">
                        {emergencyToken}
                      </strong>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Casualty staff are assessing bed and equipment availability. If ready, an ambulance will trigger immediately.
                    </p>
                  </div>
                )}

                {/* Live Ambulance Dispatch Details Card (When Approved) */}
                {liveIncident?.ambulance_dispatched && liveIncident.ambulance_details && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        Dispatched Ambulance Info
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                        ~{liveIncident.ambulance_details.eta_minutes} Mins ETA
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[11px] text-slate-400 uppercase font-bold">Vehicle Registration</p>
                        <p className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                          {liveIncident.ambulance_details.vehicle_number}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[11px] text-slate-400 uppercase font-bold">Paramedic Driver</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                          {liveIncident.ambulance_details.driver_name}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <span>Driver Contact: </span>
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {liveIncident.ambulance_details.driver_phone}
                        </strong>
                      </div>
                      <a
                        href={`tel:${liveIncident.ambulance_details.driver_phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Driver
                      </a>
                    </div>
                  </div>
                )}

                {/* Assigned Hospital Details */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Designated Trauma Center ({selectedCity})
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {liveIncident?.target_hospital_name || selectedHospital?.hospital_name || selectedHospital?.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedHospital?.address || `${selectedCity}, Maharashtra`}
                      </p>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {selectedHospital?.emergency_helpline || selectedHospital?.phone ? (
                      <a
                        href={`tel:${(selectedHospital.emergency_helpline || selectedHospital.phone || '').replace(/[^0-9+]/g, '')}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Direct Casualty Line ({selectedHospital.emergency_helpline || selectedHospital.phone})
                      </a>
                    ) : null}

                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>{landmark}</span>
                    </div>
                  </div>
                </div>

                {/* Bystander Guidance */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Critical Bystander Instructions:
                  </p>
                  <p>1. Keep the patient's airway clear. Do not move cervical spine if neck trauma is suspected.</p>
                  <p>2. Keep your callback phone ({callerPhone}) active. Paramedic driver or casualty duty doctors will reach out.</p>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    ← Submit another alert
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Emergency Accident Form (Exact Match to User Reference Specification) */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. City Select Feature */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Select City (Maharashtra) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {displayedHospitals.length} Active Hospitals
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {uniqueCities.slice(0, 4).map((city) => {
                      const count = allHospitals.filter(
                        (h) => (h.city || '').toLowerCase().trim() === city.toLowerCase().trim()
                      ).length;
                      const isSelected = selectedCity.toLowerCase() === city.toLowerCase();

                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setSelectedCity(city)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                            isSelected
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <p className="truncate">{city}</p>
                          <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                            {count > 0 ? `${count} Active` : 'Network'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Nearby Hospital Select Option (From Hospital Dashboard SOS Broadcast Style, Logged-in Data Only) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Select Nearby Receiving Hospital <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                      Live Logged-in Network
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 max-h-48 overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-slate-900/60">
                    {loadingHospitals ? (
                      <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                        Loading verified trauma facilities...
                      </div>
                    ) : displayedHospitals.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        <Building2 className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                        No hospital currently connected. Please register or contact 108 directly.
                      </div>
                    ) : (
                      displayedHospitals.map((h) => {
                        const isChecked = selectedHospitalId === h.id;
                        const name = h.hospital_name || h.name || 'Medical Center';
                        const phone = h.emergency_helpline || h.phone || '24x7 Casualty Desk';

                        return (
                          <div
                            key={h.id}
                            onClick={() => setSelectedHospitalId(h.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                              isChecked
                                ? 'bg-red-50/80 dark:bg-red-950/40 border-red-500 dark:border-red-600 ring-1 ring-red-500 shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name="targetHospital"
                              checked={isChecked}
                              onChange={() => setSelectedHospitalId(h.id)}
                              className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {name}
                                </p>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                  Trauma Unit
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  {h.address || h.city}
                                </span>
                                <span className="flex items-center gap-1 font-mono shrink-0">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  {phone}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Number of Patients / Victims (Matches Image) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Number of Patients / Victims
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      {[1, 2, 3, 4, '5+'].map((num, idx) => {
                        const countValue = idx + 1;
                        const isSelected = patientCount === countValue;

                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setPatientCount(countValue)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                              isSelected
                                ? 'bg-red-600 text-white font-black border-2 border-red-700 shadow-sm'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Exact Landmark / Location (Matches Image) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Exact Landmark / Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Near Toll Plaza / Metro Pillar 42"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Callback Phone & Caller Name (Matches Image) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Your Callback Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={callerPhone}
                        onChange={(e) => setCallerPhone(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
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
                      className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* 6. Patient Condition / Quick Note (Matches Image) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Patient Condition / Quick Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bleeding from limb, conscious, needs stretcher"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || displayedHospitals.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs sm:text-sm shadow-lg shadow-red-600/30 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <Siren className="w-4 h-4 animate-bounce" />
                    <span>
                      {submitting
                        ? 'Broadcasting Trauma Alert...'
                        : `DISPATCH EMERGENCY REPORT TO ${
                            selectedHospital ? (selectedHospital.hospital_name || selectedHospital.name).toUpperCase() : 'HOSPITAL'
                          }`}
                    </span>
                  </button>
                  <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
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
