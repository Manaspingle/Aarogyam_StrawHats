import { useState, useEffect } from 'react';
import {
  Ambulance,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Siren,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { createEmergencyIncident, getEmergencyIncidents } from '@/lib/firebaseDb';
import type { EmergencyIncident } from '@/types';

export function AmbulanceDirectory() {
  const { donor, profile } = useAuth();
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch Form
  const [showDispatch, setShowDispatch] = useState(false);
  const [callerName, setCallerName] = useState(donor?.full_name || '');
  const [callerPhone, setCallerPhone] = useState(donor?.phone || '');
  const [city, setCity] = useState<'Mumbai' | 'Pune' | 'Nagpur'>('Mumbai');
  const [pickupAddress, setPickupAddress] = useState(donor?.address || '');
  const [urgency, setUrgency] = useState<'CRITICAL' | 'URGENT' | 'STANDARD'>('CRITICAL');
  const [condition, setCondition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    const data = await getEmergencyIncidents();
    setIncidents(data);
    setLoading(false);
  }

  async function handleDispatch(e: React.FormEvent) {
    e.preventDefault();
    if (!callerPhone.trim() || !pickupAddress.trim()) return;

    setSubmitting(true);
    const token = `AMB-${city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const incident: EmergencyIncident = {
      id: `amb_inc_${Date.now()}`,
      token,
      city,
      primary_hospital_id: `hosp_${city.toLowerCase()}`,
      primary_hospital_name: `${city} Central Emergency & Trauma Center`,
      patients_total: 1,
      patients_primary: 1,
      patients_secondary: 0,
      reach_time_minutes: urgency === 'CRITICAL' ? 7 : 12,
      timestamp: new Date().toISOString(),
      status: 'Dispatched',
      caller_name: callerName || 'Registered Citizen',
      caller_phone: callerPhone,
      caller_note: `[Ambulance SOS - ${urgency}] Pickup: ${pickupAddress}. Patient Condition: ${condition || 'Trauma aid required'}`,
      category: `Ambulance Dispatch (${urgency})`,
    };

    await createEmergencyIncident(incident);
    setSubmitting(false);
    setDispatchSuccess(true);
    setShowDispatch(false);
    loadIncidents();
    setTimeout(() => setDispatchSuccess(false), 5000);
  }

  return (
    <div className="space-y-6">
      {/* Top Emergency SOS Helpline Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 sm:p-7 text-white shadow-xl shadow-red-600/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white border border-white/30 animate-pulse">
              <Ambulance className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  National Medical Helplines
                </span>
                <span className="text-red-200 text-xs font-semibold">• 24x7 Active</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black mt-1">
                Emergency Ambulance & Trauma Dispatch
              </h3>
              <p className="text-xs sm:text-sm text-red-100 max-w-xl mt-0.5">
                Immediate toll-free hotline connect and live green corridor routing across Mumbai, Pune, and Nagpur.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <a
              href="tel:108"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black text-red-600 shadow-md hover:bg-red-50 transition-colors"
            >
              <Phone className="h-4 w-4" /> Call 108 (Ambulance)
            </a>
            <a
              href="tel:112"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white border border-white/20 hover:bg-slate-800 transition-colors"
            >
              <Phone className="h-4 w-4" /> Call 112 (Police & Medical)
            </a>
            <Button
              variant="orange"
              onClick={() => setShowDispatch(true)}
              className="flex-1 sm:flex-none shadow-md"
            >
              <Siren className="h-4 w-4 mr-1.5 animate-bounce" /> Request Ambulance
            </Button>
          </div>
        </div>
      </div>

      {dispatchSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">
            Emergency Ambulance Dispatched! The driver & local casualty team have been alerted with your token.
          </span>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowDispatch(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-red-200 dark:border-red-900 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 text-red-600">
                  <Ambulance className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Request Emergency Ambulance</h3>
              </div>
              <button onClick={() => setShowDispatch(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['Mumbai', 'Pune', 'Nagpur'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      city === c
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CRITICAL', 'URGENT', 'STANDARD'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setUrgency(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        urgency === lvl
                          ? 'bg-brand-teal text-white border-brand-teal'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Pickup Address & Landmark *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Swargate Bus Stand, Pune"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Callback Mobile *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Caller Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Patient Condition (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unconscious, accident injury"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDispatch(false)}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" loading={submitting}>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Dispatch Emergency Ambulance
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatched Emergencies Registry */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Active Emergency Dispatches</h3>
            <p className="text-xs text-slate-500">Live ambulance tracking and trauma casualty acknowledgements</p>
          </div>
          <Badge variant="red" dot>{incidents.length} Registered</Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <EmptyState
            icon={<Ambulance className="h-6 w-6" />}
            title="No Active Emergency Dispatches"
            description="When an emergency is triggered via the Landing Page SOS or Ambulance request, it will appear here in real time."
          />
        ) : (
          <div className="space-y-3">
            {incidents.slice(0, 6).map((inc) => (
              <div
                key={inc.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600">
                    <Ambulance className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{inc.token}</span>
                      <Badge variant="amber">{inc.city}</Badge>
                      <Badge variant="green" dot>{inc.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                      {inc.primary_hospital_name} · ~{inc.reach_time_minutes} min ETA
                    </p>
                    {inc.caller_note && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{inc.caller_note}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
