import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Calendar, Droplet, Plus, Minus, CheckCircle2,
  Clock, Users, MapPin, ShieldCheck, AlertCircle, Award,
  Send, Truck, ArrowRight, Search, Activity, AlertTriangle,
  Phone, PhoneCall, Check, X
} from 'lucide-react';
import { DashboardLayout, PageHeader, StatCard, type NavItem } from '@/components/DashboardLayout';
import { Button, Input, Select, Card, Badge, Modal, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  getAppointments,
  updateAppointment,
  getHospitals,
  getBloodInventory,
  updateBloodInventoryUnits,
  getEmergencyRequests,
  createEmergencyRequest,
  updateEmergencyRequestStatus,
  getTransfers,
  createTransfer,
  createCertificate,
  getDonor,
  updateDonor,
  addDonorReward,
  updateHospital,
} from '@/lib/firebaseDb';
import { BLOOD_GROUPS, ORGAN_TYPES, CITIES } from '@/lib/mockData';
import { RewardManagement } from '@/components/RewardManagement';
import { haversineDistance } from '@/lib/compatibility';
import {
  dispatchTwilioEmergencyCalls,
  resolveFromNumber,
  resolveToNumber,
  getTwilioConfigStatus,
  type TwilioCallDispatchResult,
} from '@/lib/twilioService';
import type { Hospital, Appointment, EmergencyRequest, Transfer, BloodInventoryItem, Donor } from '@/types';

type View = 'overview' | 'appointments' | 'inventory' | 'emergency' | 'nearby' | 'rewards' | 'settings';

interface NearbyFacility extends Hospital {
  distance: number;
  estTime: number;
}

export default function HospitalDashboard() {
  const { hospital, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [view, setView] = useState<View>('overview');

  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // New Emergency Request Modal & Twilio Multi-Hospital Selection
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emBloodGroup, setEmBloodGroup] = useState('O-');
  const [emUnits, setEmUnits] = useState('2');
  const [emUrgency, setEmUrgency] = useState<'critical' | 'urgent' | 'moderate'>('urgent');
  const [emNotes, setEmNotes] = useState('');
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>([]);
  const [submittingEmergency, setSubmittingEmergency] = useState(false);
  const [callingProgressText, setCallingProgressText] = useState('');
  const [callDispatchResults, setCallDispatchResults] = useState<TwilioCallDispatchResult[] | null>(null);
  const [showCallResultsModal, setShowCallResultsModal] = useState(false);

  // Cross-Hospital Transfer State
  const [filterNearbyStock, setFilterNearbyStock] = useState('all');
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Complete Donation Modal
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [completingUnits, setCompletingUnits] = useState('1');
  const [completingBloodGroup, setCompletingBloodGroup] = useState('O+');
  const [completingLoading, setCompletingLoading] = useState(false);

  // Facility Registration / Update
  const [facilityName, setFacilityName] = useState(hospital?.hospital_name || hospital?.name || '');
  const [facilityPhone, setFacilityPhone] = useState(hospital?.phone || '');
  const [facilityAddress, setFacilityAddress] = useState(hospital?.address || '');
  const [facilityCity, setFacilityCity] = useState(hospital?.city || 'Mumbai');
  const [facilityHelpline, setFacilityHelpline] = useState(hospital?.emergency_helpline || '');
  const [facilityTwilioPhone, setFacilityTwilioPhone] = useState(hospital?.twilio_phone_number || '');
  const [facilitySaving, setFacilitySaving] = useState(false);
  const [facilitySuccess, setFacilitySuccess] = useState(false);

  const currentHospitalId = hospital?.id || profile?.id || 'hospital_current';

  const loadData = useCallback(async () => {
    setLoading(true);

    const [inv, appts, emList, hospList, transList] = await Promise.all([
      getBloodInventory(currentHospitalId),
      getAppointments({ hospital_id: currentHospitalId }),
      getEmergencyRequests(),
      getHospitals(),
      getTransfers(currentHospitalId),
    ]);

    setInventory(inv);
    setAppointments(appts);
    setEmergencies(emList);
    setAllHospitals(hospList);
    setTransfers(transList);
    setLoading(false);
  }, [currentHospitalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (hospital) {
      setFacilityName(hospital.hospital_name || hospital.name || '');
      setFacilityPhone(hospital.phone || '');
      setFacilityAddress(hospital.address || '');
      setFacilityCity(hospital.city || 'Mumbai');
      setFacilityHelpline(hospital.emergency_helpline || '');
      setFacilityTwilioPhone(hospital.twilio_phone_number || '');
    }
  }, [hospital]);

  // Adjust blood units
  async function handleAdjustInventory(bloodGroup: string, delta: number) {
    const current = inventory.find((i) => i.blood_group === bloodGroup)?.units_available || 0;
    const newUnits = Math.max(0, current + delta);
    await updateBloodInventoryUnits(currentHospitalId, bloodGroup, newUnits);
    loadData();
  }

  // Filter only real hospitals currently active / registered on platform (excluding self)
  const availableHospitals = allHospitals.filter(
    (h) => h.id !== currentHospitalId && h.user_id !== profile?.user_id
  );

  function handleToggleSelectAll() {
    if (selectedHospitalIds.length === availableHospitals.length) {
      setSelectedHospitalIds([]);
    } else {
      setSelectedHospitalIds(availableHospitals.map((h) => h.id));
    }
  }

  function handleToggleHospital(id: string) {
    setSelectedHospitalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Create Emergency Broadcast & Dispatch Twilio Voice Calls
  async function handleCreateEmergency(e: React.FormEvent) {
    e.preventDefault();
    if (!emBloodGroup) {
      alert('Please select a blood group needed');
      return;
    }
    const units = parseInt(emUnits) || 1;
    if (units <= 0) {
      alert('Please specify valid units needed');
      return;
    }

    setSubmittingEmergency(true);
    setCallingProgressText('Initiating Twilio telephony dispatch...');

    const targetHospitalsToCall = availableHospitals.filter((h) =>
      selectedHospitalIds.includes(h.id)
    );

    // 1. Dispatch Twilio Voice Calls to each selected hospital with distinct from and to numbers
    let dispatchLogs: TwilioCallDispatchResult[] = [];
    if (targetHospitalsToCall.length > 0) {
      dispatchLogs = await dispatchTwilioEmergencyCalls(
        {
          callingHospital: {
            id: currentHospitalId,
            name: facilityName || hospital?.hospital_name || 'Accredited Hospital Center',
            city: facilityCity,
            phone: facilityPhone,
            twilio_phone_number: facilityTwilioPhone,
          },
          targetHospitals: targetHospitalsToCall.map((h) => ({
            id: h.id,
            name: h.hospital_name || h.name || 'Medical Center',
            city: h.city,
            phone: h.phone,
            emergency_helpline: h.emergency_helpline,
          })),
          bloodGroup: emBloodGroup,
          unitsNeeded: units,
          urgency: emUrgency,
          notes: emNotes,
        },
        (progress) => {
          setCallingProgressText(`Calling ${progress.targetHospitalName} (${progress.toPhone})...`);
        }
      );
    }

    // 2. Persist Emergency Request record into Firestore
    await createEmergencyRequest({
      requesting_hospital_id: currentHospitalId,
      hospital_name: facilityName || hospital?.hospital_name || 'Accredited Hospital Center',
      blood_group: emBloodGroup,
      units_needed: units,
      urgency: emUrgency,
      status: 'active',
      city: facilityCity,
      notes: emNotes,
      target_hospital_ids: selectedHospitalIds,
      called_hospitals: dispatchLogs.map((d) => ({
        hospital_id: d.targetHospitalId,
        hospital_name: d.targetHospitalName,
        to_phone: d.toPhone,
        from_phone: d.fromPhone,
        call_sid: d.callSid,
        status: d.status,
        timestamp: d.timestamp,
      })),
    });

    setSubmittingEmergency(false);
    setShowEmergencyModal(false);
    setEmNotes('');
    setCallDispatchResults(dispatchLogs);
    if (dispatchLogs.length > 0) {
      setShowCallResultsModal(true);
    }
    loadData();
  }

  // Complete Donation & Issue Certificate
  async function handleCompleteDonation() {
    if (!completingApt) return;
    setCompletingLoading(true);

    const units = parseInt(completingUnits) || 1;

    // 1. Mark appointment as completed
    await updateAppointment(completingApt.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    // 2. Add units to hospital inventory
    await handleAdjustInventory(completingBloodGroup, units);

    // 3. Issue certificate
    const certNumber = `CERT-${completingBloodGroup.replace('+', 'P').replace('-', 'N')}-${Math.floor(10000 + Math.random() * 90000)}`;
    await createCertificate({
      certificate_number: certNumber,
      donor_id: completingApt.donor_id,
      donor_name: completingApt.donor_name || 'Donor',
      donor_blood_group: completingBloodGroup,
      hospital_id: currentHospitalId,
      hospital_name: facilityName,
      appointment_id: completingApt.id,
      donation_date: new Date().toISOString().split('T')[0],
      units_collected: units,
      donation_type: 'blood',
    });

    // 4. Update donor points & completed donations
    const donorRecord = await getDonor(completingApt.donor_id);
    if (donorRecord) {
      const currentPts = donorRecord.donor_points || 0;
      const currentCount = (donorRecord.completed_donations || 0) + 1;
      const addedPts = 30 * units;
      const newTotal = currentPts + addedPts;
      const newLevel = newTotal >= 500 ? 'Platinum Hero' : newTotal >= 250 ? 'Gold Champion' : newTotal >= 100 ? 'Silver Guardian' : 'Bronze Lifesaver';

      await updateDonor(donorRecord.id, {
        donor_points: newTotal,
        donor_level: newLevel,
        completed_donations: currentCount,
        blood_donations: (donorRecord.blood_donations || 0) + units,
        last_donation_date: new Date().toISOString().split('T')[0],
      });

      await addDonorReward({
        donor_id: donorRecord.id,
        points: addedPts,
        reward_title: `Completed ${units} Unit Donation at ${facilityName}`,
      });
    }

    setCompletingLoading(false);
    setCompletingApt(null);
    loadData();
  }

  // Cross-Hospital Transfer Request
  async function handleRequestTransfer(target: NearbyFacility, type: string) {
    setTransferTarget(target.id);
    const isBlood = BLOOD_GROUPS.includes(type);

    await createTransfer({
      from_hospital_id: target.id,
      to_hospital_id: currentHospitalId,
      blood_type: isBlood ? type : null,
      organ_type: !isBlood ? type : null,
      status: 'Approved',
      delivery_time: new Date(Date.now() + target.estTime * 60 * 1000).toISOString(),
    });

    const updated = await getTransfers(currentHospitalId);
    setTransfers(updated);
    setTransferTarget(null);
    setTransferSuccess(`Cold-chain logistics initiated from ${target.hospital_name || target.name}! ETA: ~${target.estTime} mins.`);
    setTimeout(() => setTransferSuccess(null), 5000);
  }

  // Save Facility Settings
  async function handleFacilitySave(e: React.FormEvent) {
    e.preventDefault();
    setFacilitySaving(true);

    await updateHospital(currentHospitalId, {
      hospital_name: facilityName,
      name: facilityName,
      phone: facilityPhone,
      address: facilityAddress,
      city: facilityCity,
      emergency_helpline: facilityHelpline,
      twilio_phone_number: facilityTwilioPhone,
    });

    await refreshProfile();
    setFacilitySaving(false);
    setFacilitySuccess(true);
    setTimeout(() => setFacilitySuccess(false), 3000);
  }

  const upcomingDonors = appointments.filter((a) => a.status === 'scheduled');
  const completedDonations = appointments.filter((a) => a.status === 'completed');
  const activeEmergencies = emergencies.filter((e) => e.status === 'active');
  const totalUnits = inventory.reduce((sum, i) => sum + i.units_available, 0);

  // Nearby hospital calculations relative to current hospital
  const currentCity = facilityCity.toLowerCase().trim();
  const currentLat = hospital?.lat || 19.076;
  const currentLng = hospital?.lng || 72.8777;

  const nearbyHospitals: NearbyFacility[] = allHospitals
    .filter((h) => h.id !== currentHospitalId && (h.city || '').toLowerCase().trim() === currentCity)
    .map((h) => {
      const distance = haversineDistance(currentLat, currentLng, h.lat || 19.076, h.lng || 72.8777);
      return {
        ...h,
        distance: Math.max(1.1, Math.round(distance * 10) / 10),
        estTime: Math.max(6, Math.round(distance * 2.5)),
      };
    })
    .sort((a, b) => a.distance - b.distance);

  const filteredNearby = nearbyHospitals.filter((h) => {
    if (filterNearbyStock === 'all') return true;
    return (h.inventory?.[filterNearbyStock] || 0) > 0;
  });

  const navItems: NavItem[] = [
    { id: 'overview', label: t('hospital.nav_overview'), icon: <Building2 className="h-4 w-4" /> },
    { id: 'appointments', label: t('hospital.nav_appointments'), icon: <Users className="h-4 w-4" /> },
    { id: 'inventory', label: t('hospital.nav_inventory'), icon: <Droplet className="h-4 w-4 text-brand-orange" /> },
    { id: 'emergency', label: t('hospital.nav_emergency'), icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
    { id: 'nearby', label: t('hospital.nav_nearby'), icon: <MapPin className="h-4 w-4 text-brand-teal" /> },
    { id: 'rewards', label: t('hospital.nav_rewards'), icon: <Award className="h-4 w-4 text-amber-500" /> },
    { id: 'settings', label: t('hospital.nav_settings'), icon: <Building2 className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      activeView={view}
      onNavigate={(v) => setView(v as View)}
      roleLabel="Hospital Admin"
    >
      {/* ── VIEW: OVERVIEW ── */}
      {view === 'overview' && (
        <>
          <PageHeader
            title={facilityName || 'Accredited Medical Facility'}
            description={`${facilityCity}, ${facilityAddress || 'Maharashtra'}`}
            badge={
              <Badge variant="teal" dot>
                <ShieldCheck className="h-3 w-3 mr-1" /> {t('hospital.verified_facility')}
              </Badge>
            }
            action={
              <Button variant="danger" onClick={() => setShowEmergencyModal(true)}>
                <AlertTriangle className="h-4 w-4 mr-1.5" /> {t('hospital.broadcast_emergency_sos')}
              </Button>
            }
          />

          {/* Quick Stats */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t('hospital.total_blood_units')}
                value={`${totalUnits}`}
                icon={<Droplet className="h-5 w-5" />}
                color="red"
                subtitle={t('hospital.inhouse_storage')}
              />
              <StatCard
                label={t('hospital.nav_appointments')}
                value={upcomingDonors.length}
                icon={<Calendar className="h-5 w-5" />}
                color="blue"
                subtitle={t('hospital.scheduled_today')}
              />
              <StatCard
                label={t('hospital.active_sos_requests')}
                value={activeEmergencies.length}
                icon={<AlertTriangle className="h-5 w-5" />}
                color="amber"
                subtitle={t('hospital.broadcast_network')}
              />
              <StatCard
                label={t('hospital.network_transfers')}
                value={transfers.length}
                icon={<Truck className="h-5 w-5" />}
                color="teal"
                subtitle={t('hospital.inter_hospital')}
              />
            </div>
          )}

          {/* Blood Inventory Summary Grid */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{t('hospital.quick_inventory')}</h3>
                <p className="text-xs text-slate-500">{t('hospital.live_stock')}</p>
              </div>
              <Button size="xs" variant="outline" onClick={() => setView('inventory')}>
                {t('hospital.manage_full_inventory')} →
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {BLOOD_GROUPS.map((bg) => {
                const count = inventory.find((i) => i.blood_group === bg)?.units_available || 0;
                const isLow = count < 5;
                return (
                  <div
                    key={bg}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      isLow
                        ? 'bg-red-50/50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-1">
                      {bg}
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block font-mono">
                      {count}
                    </span>
                    <span className={`text-[10px] font-bold block mt-1 ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isLow ? t('hospital.critical') : 'Optimal'}
                    </span>
                    <div className="mt-3 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAdjustInventory(bg, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustInventory(bg, 1)}
                        className="w-6 h-6 rounded-lg bg-brand-teal text-white font-bold flex items-center justify-center text-xs hover:bg-brand-teal/90"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two Columns: Incoming Appointments & Active Emergency SOS */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Incoming Donors */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{t('hospital.scheduled_visits')}</h3>
                  <p className="text-xs text-slate-500">{t('hospital.pending_donations')}</p>
                </div>
                <Badge variant="blue" dot>{upcomingDonors.length} {t('hospital.scheduled_today')}</Badge>
              </div>

              {upcomingDonors.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-6 w-6" />}
                  title={t('hospital.no_donors_scheduled')}
                  description="When donors book appointment slots at your hospital, they will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {upcomingDonors.slice(0, 4).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
                    >
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {apt.donor_name || 'Anonymous Donor'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {apt.appointment_date} · {apt.appointment_time}
                        </p>
                      </div>
                      <Button
                        size="xs"
                        variant="teal"
                        onClick={() => {
                          setCompletingApt(apt);
                          setCompletingUnits('1');
                          setCompletingBloodGroup('O+');
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {t('hospital.complete_donation')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Active Emergency Broadcasts */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{t('hospital.emergency_broadcasts')}</h3>
                  <p className="text-xs text-slate-500">{t('hospital.critical_alerts_desc')}</p>
                </div>
                <Button size="xs" variant="danger" onClick={() => setShowEmergencyModal(true)}>
                  + {t('hospital.create_new_sos')}
                </Button>
              </div>

              {activeEmergencies.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle className="h-6 w-6" />}
                  title={t('hospital.all_emergencies_fulfilled')}
                  description="All medical facilities in your district currently have adequate supplies."
                />
              ) : (
                <div className="space-y-3">
                  {activeEmergencies.slice(0, 4).map((em) => (
                    <div
                      key={em.id}
                      className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="red" dot>{em.blood_group} ({em.units_needed} Units)</Badge>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {em.hospital_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {t('hospital.urgency')}: <strong className="uppercase text-red-600">{em.urgency}</strong> · {em.notes || 'Immediate transfusion needed'}
                        </p>
                      </div>
                      {em.requesting_hospital_id === currentHospitalId && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => updateEmergencyRequestStatus(em.id, 'fulfilled').then(loadData)}
                        >
                          Mark Fulfilled
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ── VIEW: INCOMING DONORS ── */}
      {view === 'appointments' && (
        <div>
          <PageHeader
            title={t('hospital.incoming_donors_title')}
            description={t('hospital.incoming_donors_desc')}
            badge={<Badge variant="blue" dot>{appointments.length} Records</Badge>}
          />

          <Card className="p-6">
            {appointments.length === 0 ? (
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title={t('hospital.no_donors_scheduled')}
                description="When donors select your hospital facility to schedule blood donations, their visits will appear here."
              />
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {apt.donor_name || 'Donor'}
                        </h4>
                        <Badge
                          variant={apt.status === 'completed' ? 'green' : apt.status === 'scheduled' ? 'blue' : 'gray'}
                          dot
                        >
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {apt.appointment_date} · {apt.appointment_time}
                      </p>
                      {apt.notes && <p className="text-[11px] text-slate-400 mt-0.5">{apt.notes}</p>}
                    </div>

                    {apt.status === 'scheduled' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="teal"
                          onClick={() => {
                            setCompletingApt(apt);
                            setCompletingUnits('1');
                            setCompletingBloodGroup('O+');
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {t('hospital.complete_donation')}
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => updateAppointment(apt.id, { status: 'cancelled' }).then(loadData)}
                        >
                          {t('donor.cancel_visit')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── VIEW: INVENTORY ── */}
      {view === 'inventory' && (
        <div>
          <PageHeader
            title={t('hospital.inventory_title')}
            description={t('hospital.inventory_desc')}
            badge={<Badge variant="red" dot>{totalUnits} {t('hospital.total_blood_units')}</Badge>}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BLOOD_GROUPS.map((bg) => {
              const count = inventory.find((i) => i.blood_group === bg)?.units_available || 0;
              const isLow = count < 5;
              return (
                <Card key={bg} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-black text-brand-teal dark:text-teal-400">{bg}</span>
                    <Badge variant={isLow ? 'red' : 'green'} dot>
                      {isLow ? t('hospital.critical') : 'Normal'}
                    </Badge>
                  </div>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mb-4">
                    {count} <span className="text-xs font-sans text-slate-400 font-normal">{t('hospital.units_available')}</span>
                  </p>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      onClick={() => handleAdjustInventory(bg, -1)}
                    >
                      <Minus className="h-3.5 w-3.5 mr-1" /> -1
                    </Button>
                    <Button
                      size="sm"
                      variant="teal"
                      fullWidth
                      onClick={() => handleAdjustInventory(bg, 1)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> +1
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIEW: EMERGENCY BROADCASTS ── */}
      {view === 'emergency' && (
        <div>
          <PageHeader
            title={t('hospital.emergency_title')}
            description={t('hospital.emergency_desc')}
            action={
              <Button variant="danger" onClick={() => setShowEmergencyModal(true)}>
                <AlertTriangle className="h-4 w-4 mr-1.5" /> {t('hospital.btn_broadcast_new')}
              </Button>
            }
          />

          <Card className="p-6">
            {emergencies.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="h-6 w-6" />}
                title={t('hospital.all_emergencies_fulfilled')}
                description="When your blood bank is low on critical units, broadcast an emergency SOS to notify all local medical centers."
              />
            ) : (
              <div className="space-y-3">
                {emergencies.map((em) => (
                  <div
                    key={em.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="red">{em.blood_group} Urgent</Badge>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {em.hospital_name}
                        </h4>
                        <Badge variant={em.status === 'active' ? 'amber' : 'green'} dot>
                          {em.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Needed: <strong>{em.units_needed} Units</strong> · {t('hospital.urgency')}: <strong className="uppercase text-red-600">{em.urgency}</strong>
                      </p>
                      {em.notes && <p className="text-[11px] text-slate-400 mt-0.5">{em.notes}</p>}
                    </div>

                    {em.requesting_hospital_id === currentHospitalId && em.status === 'active' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => updateEmergencyRequestStatus(em.id, 'fulfilled').then(loadData)}
                      >
                        Mark As Fulfilled
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── VIEW: NEARBY HOSPITALS (AAROGYAM CORE FEATURE) ── */}
      {view === 'nearby' && (
        <div>
          <PageHeader
            title={t('hospital.nearby_title')}
            description={t('hospital.nearby_desc')}
            badge={<Badge variant="teal" dot>{nearbyHospitals.length} Connected Facilities</Badge>}
          />

          {transferSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 flex items-center gap-3 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              {transferSuccess}
            </div>
          )}

          {/* Interactive Proximity Radar Map */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-teal flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                    City Hospital Network Map — {facilityCity}
                  </h3>
                  <p className="text-xs text-slate-500">Live GPS proximity relative to your center</p>
                </div>
              </div>
            </div>

            <div className="relative h-72 sm:h-80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-inner">
              <svg className="w-full h-full" viewBox="0 0 600 300">
                {/* Radar Grid */}
                {[0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600].map((x) => (
                  <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                ))}
                {[0, 50, 100, 150, 200, 250, 300].map((y) => (
                  <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                ))}
                <circle cx="300" cy="150" r="60" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                <circle cx="300" cy="150" r="110" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 4" />

                {/* Current Hospital Center */}
                <circle cx="300" cy="150" r="12" fill="#00605F" />
                <circle cx="300" cy="150" r="24" fill="#00605F" opacity="0.3" className="animate-ping" />
                <text x="300" y="180" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {facilityName || 'Your Hospital'} (Center)
                </text>

                {/* Nearby Facility Nodes */}
                {filteredNearby.map((h, i) => {
                  const angle = (i / Math.max(1, filteredNearby.length)) * 2 * Math.PI + 0.4;
                  const radius = 65 + i * 28;
                  const x = 300 + Math.cos(angle) * radius;
                  const y = 150 + Math.sin(angle) * radius;
                  return (
                    <g key={h.id}>
                      <line x1="300" y1="150" x2={x} y2={y} stroke="#0d9488" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                      <circle cx={x} cy={y} r="8" fill="#F48552" />
                      <text x={x} y={y - 12} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                        {h.hospital_name || h.name} (~{h.estTime}m)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>

          {/* Filter & Nearby Hospitals Cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Available Medical Centers ({filteredNearby.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">{t('hospital.filter_stock')}:</span>
                <select
                  value={filterNearbyStock}
                  onChange={(e) => setFilterNearbyStock(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold"
                >
                  <option value="all">{t('hospital.all_groups')}</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b} value={b}>{b} In Stock</option>
                  ))}
                  {ORGAN_TYPES.map((o) => (
                    <option key={o} value={o}>{o} Available</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredNearby.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-6 w-6" />}
                title="No Nearby Hospitals Found"
                description={`No other hospitals are registered in ${facilityCity} yet. When more facilities register, instant transfers will be enabled.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNearby.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="teal">{hosp.city}</Badge>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {hosp.distance} km · ~{hosp.estTime} mins transit
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {hosp.hospital_name || hosp.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{hosp.address}</p>
                      {hosp.phone && (
                        <p className="text-xs font-mono text-brand-teal font-bold mt-1">📞 {hosp.phone}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Cold-chain transit ready</span>
                      <Button
                        size="xs"
                        variant="orange"
                        loading={transferTarget === hosp.id}
                        onClick={() => handleRequestTransfer(hosp, 'O-')}
                      >
                        <Truck className="h-3.5 w-3.5 mr-1" /> {t('hospital.request_transfer')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW: REWARDS MANAGEMENT ── */}
      {view === 'rewards' && <RewardManagement />}

      {/* ── VIEW: FACILITY PROFILE SETTINGS ── */}
      {view === 'settings' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t('hospital.settings_title')}</h3>
          <form onSubmit={handleFacilitySave} className="space-y-4">
            <Input
              label={t('auth.hospital_name')}
              value={facilityName}
              onChange={setFacilityName}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Casualty Landline / Phone"
                value={facilityPhone}
                onChange={setFacilityPhone}
                required
              />
              <Input
                label="24x7 Emergency Helpline"
                value={facilityHelpline}
                onChange={setFacilityHelpline}
                placeholder="022-XXXXXXX"
              />
            </div>

            <div>
              <Input
                label={t('hospital.twilio_caller_id')}
                value={facilityTwilioPhone}
                onChange={setFacilityTwilioPhone}
                placeholder="e.g. +12025550199 or +919800000000"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {t('hospital.twilio_caller_id_desc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('hospital.city')}
                value={facilityCity}
                onChange={setFacilityCity}
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
              <Input
                label={t('auth.address')}
                value={facilityAddress}
                onChange={setFacilityAddress}
                required
              />
            </div>

            {facilitySuccess && (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('hospital.facility_saved')}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="primary" type="submit" loading={facilitySaving}>
                {t('hospital.save_changes')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── MODALS ── */}
      {/* Create Emergency Request Modal (Exact Match to User Reference Specification) */}
      <Modal
        open={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title={t('hospital.modal_sos_title_new')}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateEmergency} className="space-y-4">
          {/* Urgency 3-Card Selector */}
          <div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setEmUrgency('critical')}
                className={`py-3 px-2 rounded-2xl text-center border-2 transition-all ${
                  emUrgency === 'critical'
                    ? 'border-red-500 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-black capitalize">Critical</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">&lt; 1 hr need</p>
              </button>

              <button
                type="button"
                onClick={() => setEmUrgency('urgent')}
                className={`py-3 px-2 rounded-2xl text-center border-2 transition-all ${
                  emUrgency === 'urgent'
                    ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-black capitalize text-amber-700 dark:text-amber-300">Urgent</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1-4 hr need</p>
              </button>

              <button
                type="button"
                onClick={() => setEmUrgency('moderate')}
                className={`py-3 px-2 rounded-2xl text-center border-2 transition-all ${
                  emUrgency === 'moderate'
                    ? 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-black capitalize">Moderate</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1-2 day need</p>
              </button>
            </div>
          </div>

          {/* Blood Group and Units Row */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {t('hospital.blood_group_needed')} <span className="text-red-500">*</span>
              </label>
              <select
                value={emBloodGroup}
                onChange={(e) => setEmBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              >
                <option value="">Select group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {t('hospital.units_needed')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={emUnits}
                onChange={(e) => setEmUnits(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              {t('hospital.special_notes')}
            </label>
            <input
              type="text"
              value={emNotes}
              onChange={(e) => setEmNotes(e.target.value)}
              placeholder={t('hospital.notes_placeholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* SELECT HOSPITALS TO CALL Section (Live platform hospitals only) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('hospital.select_hospitals_to_call')} <span className="text-red-500">*</span>
              </label>
              {availableHospitals.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  {selectedHospitalIds.length === availableHospitals.length
                    ? t('hospital.deselect_all')
                    : t('hospital.select_all')}
                </button>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 max-h-56 overflow-y-auto space-y-1.5 bg-slate-50/40 dark:bg-slate-900/60">
              {availableHospitals.length === 0 ? (
                <div className="p-4 text-center">
                  <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('hospital.no_other_hospitals')}
                  </p>
                </div>
              ) : (
                availableHospitals.map((h) => {
                  const isChecked = selectedHospitalIds.includes(h.id);
                  const phoneDisplay = h.emergency_helpline || h.phone || 'No phone recorded';
                  return (
                    <div
                      key={h.id}
                      onClick={() => handleToggleHospital(h.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isChecked
                          ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
                          : 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by parent div click
                        className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {h.hospital_name || h.name || 'Medical Facility'}
                          </p>
                          {h.twilio_phone_number && (
                            <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded">
                              Caller ID Set
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {h.city}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {phoneDisplay}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
              {selectedHospitalIds.length} of {availableHospitals.length} {t('hospital.hospitals_selected')}
            </p>
          </div>

          {submittingEmergency && callingProgressText && (
            <div className="p-3 bg-sky-50 dark:bg-sky-950/50 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-sky-600 animate-pulse" />
              <p className="text-xs font-bold text-sky-800 dark:text-sky-200">
                {callingProgressText}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowEmergencyModal(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t('donor.close')}
            </button>

            <button
              type="submit"
              disabled={submittingEmergency}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <PhoneCall className="h-4 w-4" />
              {submittingEmergency ? 'Connecting Twilio...' : t('hospital.create_and_call')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Twilio Call Dispatch Results Modal */}
      <Modal
        open={showCallResultsModal}
        onClose={() => setShowCallResultsModal(false)}
        title={t('hospital.calling_progress_title')}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                Emergency Telephony SOS Broadcast Complete
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                {callDispatchResults?.length || 0} automated voice calls dispatched via Twilio to selected hospital casualty lines.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Calling Facility:</span>
              <strong className="text-slate-800 dark:text-slate-200">{facilityName} ({facilityCity})</strong>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">From Caller ID:</span>
              <strong className="text-purple-600 dark:text-purple-400 font-bold">
                {resolveFromNumber({
                  id: currentHospitalId,
                  name: facilityName,
                  city: facilityCity,
                  phone: facilityPhone,
                  twilio_phone_number: facilityTwilioPhone,
                })}
              </strong>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Critical Requirement:</span>
              <strong className="text-red-600">{emUnits} Units · {emBloodGroup} ({emUrgency})</strong>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {callDispatchResults?.map((res, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {res.targetHospitalName}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    To: {res.toPhone} · From: {res.fromPhone}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    SID: {res.callSid}
                  </p>
                </div>
                <Badge variant={res.isSimulation ? 'blue' : 'green'} dot>
                  {res.status}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setShowCallResultsModal(false)}>
              {t('donor.close')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verify & Complete Donation Modal */}
      <Modal
        open={Boolean(completingApt)}
        onClose={() => setCompletingApt(null)}
        title={t('hospital.modal_complete_title')}
        description={t('hospital.modal_complete_desc')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Collected Blood Group"
              value={completingBloodGroup}
              onChange={setCompletingBloodGroup}
              options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
            />
            <Input
              label="Units Collected"
              type="number"
              min={1}
              max={3}
              value={completingUnits}
              onChange={setCompletingUnits}
            />
          </div>

          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs text-brand-teal dark:text-teal-300 space-y-1">
            <p className="font-bold">✓ Automated System Actions upon verification:</p>
            <p>1. {completingUnits} unit(s) of {completingBloodGroup} will be immediately added to your blood bank stock.</p>
            <p>2. Official state donation certificate will be generated and signed for {completingApt?.donor_name}.</p>
            <p>3. {parseInt(completingUnits) * 30} LifePoints and milestone honors will be awarded to donor profile.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCompletingApt(null)}>
              {t('donor.close')}
            </Button>
            <Button variant="teal" onClick={handleCompleteDonation} loading={completingLoading}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> {t('hospital.complete_donation')}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
