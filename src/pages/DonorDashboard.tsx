import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Award, User, Droplet, Plus, Clock, Download,
  CheckCircle2, AlertCircle, MapPin, ShieldCheck, Trophy,
  Star, Sparkles, Phone, Heart, FileText, Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DashboardLayout, PageHeader, StatCard, type NavItem } from '@/components/DashboardLayout';
import { Button, Input, Select, Card, Badge, Modal, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  getAppointments,
  cancelAppointment,
  createAppointment,
  getCertificates,
  getHospitals,
  getDonations,
  getDonorRewards,
  getRewardRules,
  getEmergencyRequests,
  updateDonor,
  createDonation,
  createCertificate,
} from '@/lib/firebaseDb';
import { buildCertificateHtml } from '@/lib/certificateTemplate';
import { DonorEligibilityCalculator } from '@/components/DonorEligibilityCalculator';
import { InteractiveEmergencyMap } from '@/components/InteractiveEmergencyMap';
import { BLOOD_GROUPS, ORGAN_TYPES, CITIES } from '@/lib/mockData';
import type { Appointment, Certificate, Donation, DonorReward, RewardRule, EmergencyRequest, Hospital } from '@/types';

type View = 'overview' | 'organ_pledge' | 'appointments' | 'certificates' | 'map' | 'profile';
type AppointmentFilter = 'all' | 'scheduled' | 'completed' | 'cancelled';

const organPositions: Record<string, { cx: number; cy: number; label: string }> = {
  Heart: { cx: 100, cy: 95, label: 'Heart' },
  Lungs: { cx: 100, cy: 125, label: 'Lungs' },
  Liver: { cx: 105, cy: 160, label: 'Liver' },
  Kidney: { cx: 80, cy: 190, label: 'Kidney' },
  Cornea: { cx: 100, cy: 40, label: 'Cornea' },
  'Bone Marrow': { cx: 100, cy: 235, label: 'Bone Marrow' },
};

export default function DonorDashboard() {
  const { donor, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [view, setView] = useState<View>('overview');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [rewards, setRewards] = useState<DonorReward[]>([]);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Appointment scheduling
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('all');
  const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Organ Pledge state
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>(donor?.organs || ['Kidney', 'Liver']);
  const [allergies, setAllergies] = useState(donor?.medical_allergies || '');
  const [conditions, setConditions] = useState(donor?.medical_conditions || '');
  const [pledgeSubmitting, setPledgeSubmitting] = useState(false);
  const [pledgeSuccess, setPledgeSuccess] = useState(false);
  const [showPledgeCertModal, setShowPledgeCertModal] = useState(false);

  // Profile update state
  const [profileName, setProfileName] = useState(donor?.full_name || '');
  const [profilePhone, setProfilePhone] = useState(donor?.phone || '');
  const [profileCity, setProfileCity] = useState(donor?.city || 'Mumbai');
  const [profileBloodGroup, setProfileBloodGroup] = useState(donor?.blood_group || 'O+');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const loadData = useCallback(async () => {
    if (!donor) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [appts, certs, hospList, donList, rewList, rules, emList] = await Promise.all([
      getAppointments({ donor_id: donor.id }),
      getCertificates({ donor_id: donor.id }),
      getHospitals(),
      getDonations(donor.id),
      getDonorRewards(donor.id),
      getRewardRules(),
      getEmergencyRequests(),
    ]);

    setAppointments(appts);
    setCertificates(certs);
    setHospitals(hospList);
    setDonations(donList);
    setRewards(rewList);
    setRewardRules(rules);
    setEmergencies(emList);
    setLoading(false);
  }, [donor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (donor) {
      setSelectedOrgans(donor.organs || []);
      setAllergies(donor.medical_allergies || '');
      setConditions(donor.medical_conditions || '');
      setProfileName(donor.full_name || '');
      setProfilePhone(donor.phone || '');
      setProfileCity(donor.city || 'Mumbai');
      setProfileBloodGroup(donor.blood_group || 'O+');
    }
  }, [donor]);

  async function handleConfirmCancel() {
    if (!cancelAppointmentId) return;
    setCancelling(true);
    await cancelAppointment(cancelAppointmentId);
    setCancelling(false);
    setCancelAppointmentId(null);
    loadData();
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!donor || !selectedHospitalId || !appointmentDate) return;
    setScheduling(true);

    const chosenHosp = hospitals.find((h) => h.id === selectedHospitalId);

    await createAppointment({
      donor_id: donor.id,
      donor_name: donor.full_name,
      hospital_id: selectedHospitalId,
      hospital_name: chosenHosp?.hospital_name || chosenHosp?.name || 'Accredited Medical Center',
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: 'scheduled',
      notes: appointmentNotes,
    });

    setScheduling(false);
    setShowSchedule(false);
    setSelectedHospitalId('');
    setAppointmentNotes('');
    loadData();
  }

  function toggleOrgan(organ: string) {
    setSelectedOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  }

  async function handlePledgeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!donor) return;
    setPledgeSubmitting(true);

    const newPoints = (donor.donor_points || 0) + (selectedOrgans.length > (donor.organs?.length || 0) ? 60 : 0);
    const newLevel = newPoints >= 500 ? 'Platinum Hero' : newPoints >= 250 ? 'Gold Champion' : newPoints >= 100 ? 'Silver Guardian' : 'Bronze Lifesaver';

    await updateDonor(donor.id, {
      organs: selectedOrgans,
      medical_allergies: allergies,
      medical_conditions: conditions,
      consent: true,
      donor_points: newPoints,
      donor_level: newLevel,
    });

    // Create record in donations
    await createDonation({
      donor_id: donor.id,
      donation_type: 'organ_pledge',
      donation_date: new Date().toISOString().split('T')[0],
      points_earned: 60,
    });

    // Create official certificate
    const certNumber = `PLEDGE-${donor.blood_group}-${Math.floor(10000 + Math.random() * 90000)}`;
    await createCertificate({
      certificate_number: certNumber,
      donor_id: donor.id,
      donor_name: donor.full_name,
      donor_blood_group: donor.blood_group,
      donation_date: new Date().toISOString().split('T')[0],
      donation_type: 'organ_pledge',
      organs: selectedOrgans,
      hospital_name: 'Aarogyam State Registry of Maharashtra',
    });

    await refreshProfile();
    await loadData();
    setPledgeSubmitting(false);
    setPledgeSuccess(true);
    setShowPledgeCertModal(true);
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!donor) return;
    setProfileSaving(true);

    await updateDonor(donor.id, {
      full_name: profileName,
      phone: profilePhone,
      city: profileCity,
      blood_group: profileBloodGroup,
    });

    await refreshProfile();
    setProfileSaving(false);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  }

  const upcoming = appointments.filter((a) => a.status === 'scheduled');
  const completed = appointments.filter((a) => a.status === 'completed');

  const filteredAppointments = appointments.filter((apt) => {
    if (appointmentFilter === 'all') return true;
    return apt.status === appointmentFilter;
  });

  const navItems: NavItem[] = [
    { id: 'overview', label: t('donor.nav_overview'), icon: <Droplet className="h-4 w-4" /> },
    { id: 'organ_pledge', label: t('donor.nav_organ_pledge'), icon: <Heart className="h-4 w-4 text-brand-orange" /> },
    { id: 'appointments', label: t('donor.nav_appointments'), icon: <Calendar className="h-4 w-4" /> },
    { id: 'certificates', label: t('donor.nav_certificates'), icon: <Award className="h-4 w-4 text-amber-500" /> },
    { id: 'map', label: t('donor.nav_map'), icon: <MapPin className="h-4 w-4" /> },
    { id: 'profile', label: t('donor.nav_profile'), icon: <User className="h-4 w-4" /> },
  ];

  const donorCode = donor ? `AAROGYAM-${donor.blood_group.replace('+', 'POS').replace('-', 'NEG')}-${donor.id.slice(-6).toUpperCase()}` : 'AAROGYAM-DONOR';

  return (
    <DashboardLayout
      navItems={navItems}
      activeView={view}
      onNavigate={(v) => setView(v as View)}
      roleLabel="Verified Donor"
    >
      {/* ── VIEW: OVERVIEW ── */}
      {view === 'overview' && (
        <>
          <PageHeader
            title={`${t('donor.welcome_back')}, ${donor?.full_name?.split(' ')[0] || t('donor.badge_donor')}`}
            description={t('donor.overview_desc')}
            badge={
              <Badge variant="teal" dot>
                <ShieldCheck className="h-3 w-3 mr-1" />
                {donor?.donor_level || 'Bronze Lifesaver'}
              </Badge>
            }
            action={
              <Button variant="orange" onClick={() => setShowSchedule(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> {t('donor.btn_schedule_donation')}
              </Button>
            }
          />

          {/* Quick Stat Cards */}
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
                label={t('donor.blood_group')}
                value={donor?.blood_group || '—'}
                icon={<Droplet className="h-5 w-5" />}
                color="red"
                subtitle="Universal compatibility profile"
              />
              <StatCard
                label={t('donor.donations_completed')}
                value={completed.length + (donor?.blood_donations || 0)}
                icon={<CheckCircle2 className="h-5 w-5" />}
                color="green"
                subtitle={t('donor.verified_contributions')}
              />
              <StatCard
                label={t('donor.pledged_organs')}
                value={donor?.organs?.length || selectedOrgans.length}
                icon={<Heart className="h-5 w-5" />}
                color="orange"
                subtitle={t('donor.posthumous_gifts')}
              />
              <StatCard
                label={t('donor.honor_certificates')}
                value={certificates.length}
                icon={<Award className="h-5 w-5" />}
                color="amber"
                subtitle={t('donor.state_recognitions')}
              />
            </div>
          )}

          {/* Middle Two-Column Section */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Upcoming Appointments Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{t('donor.upcoming_visits')}</h3>
                  <p className="text-xs text-slate-500">{t('donor.scheduled_drives')}</p>
                </div>
                {upcoming.length > 0 && (
                  <Badge variant="blue" dot>{upcoming.length} {t('donor.scheduled_badge')}</Badge>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-6 w-6" />}
                  title={t('donor.no_upcoming_visits')}
                  description={t('donor.no_upcoming_desc')}
                  action={
                    <Button size="sm" variant="orange" onClick={() => setShowSchedule(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> {t('donor.book_slot')}
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-teal dark:text-teal-400">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {apt.hospital_name || 'Accredited Medical Center'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {apt.appointment_date} · {apt.appointment_time}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setCancelAppointmentId(apt.id)}
                      >
                        {t('donor.cancel_visit')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Certificates Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{t('donor.state_certificates')}</h3>
                  <p className="text-xs text-slate-500">{t('donor.govt_recognized')}</p>
                </div>
                {certificates.length > 0 && (
                  <Badge variant="amber">{certificates.length} Earned</Badge>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : certificates.length === 0 ? (
                <EmptyState
                  icon={<Award className="h-6 w-6" />}
                  title={t('donor.no_certs')}
                  description={t('donor.no_certs_desc')}
                />
              ) : (
                <div className="space-y-3">
                  {certificates.slice(0, 3).map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {cert.certificate_number}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {cert.donation_type === 'organ_pledge' ? 'Organ Pledge' : `${cert.hospital_name || 'Hospital'}`} · {cert.donation_date}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          const html = buildCertificateHtml(cert);
                          const blob = new Blob([html], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${cert.certificate_number}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> {t('donor.view_print_cert')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Clinical Eligibility Calculator */}
          <DonorEligibilityCalculator donor={donor} onUpdate={loadData} />
        </>
      )}

      {/* ── VIEW: ORGAN PLEDGE (AAROGYAM CORE FEATURE) ── */}
      {view === 'organ_pledge' && (
        <div>
          <PageHeader
            title={t('donor.organ_pledge_title')}
            description={t('donor.organ_pledge_desc')}
            badge={
              <Badge variant="orange" dot>
                {selectedOrgans.length} {t('donor.pledged_organs')}
              </Badge>
            }
          />

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Anatomical Body Diagram */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 dark:text-white text-lg">{t('donor.select_organs')}</h3>
                <span className="text-xs font-bold text-brand-teal dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-brand-teal/20">
                  {t('donor.status_affirmative')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                {t('donor.pledge_affirmation')}
              </p>

              <div className="flex justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                <svg viewBox="0 0 200 280" className="w-64 h-80 drop-shadow-sm select-none">
                  {/* Stylized Body Silhouette */}
                  <ellipse cx="100" cy="35" rx="16" ry="20" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                  <path
                    d="M 80 58 Q 75 55 82 55 L 118 55 Q 125 55 120 58 L 126 100 L 122 150 L 126 210 L 110 265 L 90 265 L 74 210 L 78 150 L 74 100 Z"
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                  />
                  <path d="M 75 60 L 52 130 L 48 140" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 125 60 L 148 130 L 152 140" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Organ Nodes */}
                  {ORGAN_TYPES.map((organ) => {
                    const pos = organPositions[organ];
                    if (!pos) return null;
                    const isSelected = selectedOrgans.includes(organ);
                    return (
                      <g
                        key={organ}
                        onClick={() => toggleOrgan(organ)}
                        className="cursor-pointer group"
                      >
                        <circle
                          cx={pos.cx}
                          cy={pos.cy}
                          r={isSelected ? 11 : 7}
                          fill={isSelected ? '#F48552' : '#94a3b8'}
                          stroke={isSelected ? '#00605F' : '#cbd5e1'}
                          strokeWidth={isSelected ? 2.5 : 1}
                          className="transition-all duration-300"
                        />
                        {isSelected && (
                          <circle
                            cx={pos.cx}
                            cy={pos.cy}
                            r={16}
                            fill="none"
                            stroke="#F48552"
                            strokeWidth="1.5"
                            className="animate-ping"
                          />
                        )}
                        <text
                          x={pos.cx > 100 ? pos.cx + 15 : pos.cx - 15}
                          y={pos.cy + 4}
                          textAnchor={pos.cx > 100 ? 'start' : 'end'}
                          fill={isSelected ? '#00605F' : '#64748b'}
                          fontSize="10"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                        >
                          {pos.label} {isSelected ? '✓' : ''}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Quick Select Organ Pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {ORGAN_TYPES.map((organ) => {
                  const isSelected = selectedOrgans.includes(organ);
                  return (
                    <button
                      key={organ}
                      type="button"
                      onClick={() => toggleOrgan(organ)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {organ}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medical Disclosures & Official Pledge Submit */}
            <div className="lg:col-span-6 space-y-6">
              <form onSubmit={handlePledgeSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-7 space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white text-lg">
                  {t('donor.legal_consent')}
                </h3>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t('donor.allergies_label')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa drugs"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t('donor.conditions_label')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Mild Asthma"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-brand-teal/20 text-xs text-brand-teal dark:text-teal-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-teal" /> {t('donor.registry_subtitle')}
                  </p>
                  <p>
                    {t('donor.pledge_affirmation')}
                  </p>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                  loading={pledgeSubmitting}
                  className="py-3"
                >
                  <Heart className="w-4 h-4 mr-2 fill-white" />
                  {pledgeSubmitting ? t('donor.pledge_updating') : t('donor.sign_pledge_btn')}
                </Button>
              </form>

              {/* Digital Donor Pledge Card Preview */}
              <div className="bg-gradient-to-br from-brand-teal to-[#004746] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <img src="/aarogyam-logo.jpg" alt="Aarogyam" className="w-10 h-10 rounded-xl border border-brand-orange" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('donor.registry_subtitle')}</span>
                      <h4 className="text-base font-black leading-tight">{t('donor.organ_pledge_title')}</h4>
                    </div>
                  </div>
                  <Badge variant="amber">{t('donor.status_affirmative')}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div>
                    <span className="text-teal-200 text-[10px] uppercase font-bold">{t('auth.full_name')}</span>
                    <p className="font-black text-sm">{donor?.full_name || 'Donor'}</p>
                  </div>
                  <div>
                    <span className="text-teal-200 text-[10px] uppercase font-bold">{t('donor.blood_group')}</span>
                    <p className="font-black text-sm">{donor?.blood_group || 'O+'}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-teal-200 text-[10px] uppercase font-bold">{t('donor.pledged_organs')}</span>
                  <p className="font-bold text-xs text-white">
                    {selectedOrgans.length > 0 ? selectedOrgans.join(', ') : 'None yet'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/20">
                  <div className="font-mono text-[10px] text-teal-200">
                    ID: {donorCode}
                  </div>
                  <QRCodeSVG value={`https://aarogyam.health/verify/${donorCode}`} size={42} bgColor="transparent" fgColor="#ffffff" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW: APPOINTMENTS ── */}
      {view === 'appointments' && (
        <div>
          <PageHeader
            title={t('donor.appointments_title')}
            description={t('donor.appointments_desc')}
            action={
              <Button variant="orange" onClick={() => setShowSchedule(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> {t('donor.book_slot')}
              </Button>
            }
          />

          <div className="mb-6 flex gap-2">
            {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setAppointmentFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  appointmentFilter === f
                    ? 'bg-brand-teal text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {f === 'all' ? (t('common.all') || 'All') : t('donor.' + f)} ({appointments.filter((a) => f === 'all' || a.status === f).length})
              </button>
            ))}
          </div>

          <Card className="p-6">
            {filteredAppointments.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-6 w-6" />}
                title={t('donor.no_upcoming_visits')}
                description={t('donor.no_upcoming_desc')}
                action={
                  <Button size="sm" variant="orange" onClick={() => setShowSchedule(true)}>
                    <Plus className="h-4 w-4 mr-1.5" /> {t('donor.book_slot')}
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-teal dark:text-teal-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {apt.hospital_name || 'Accredited Medical Center'}
                          </h4>
                          <Badge
                            variant={
                              apt.status === 'completed'
                                ? 'green'
                                : apt.status === 'scheduled'
                                ? 'blue'
                                : 'gray'
                            }
                            dot
                          >
                            {apt.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('donor.date')}: {apt.appointment_date} · {t('donor.time_slot')}: {apt.appointment_time}
                        </p>
                        {apt.notes && <p className="text-[11px] text-slate-400 mt-0.5">{apt.notes}</p>}
                      </div>
                    </div>

                    {apt.status === 'scheduled' && (
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setCancelAppointmentId(apt.id)}
                      >
                        {t('donor.cancel_visit')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── VIEW: CERTIFICATES & HONORS ── */}
      {view === 'certificates' && (
        <div>
          <PageHeader
            title={t('donor.certificates_title')}
            description={t('donor.certificates_desc')}
          />

          <Card className="p-6">
            {certificates.length === 0 ? (
              <EmptyState
                icon={<Award className="h-6 w-6" />}
                title={t('donor.no_certs')}
                description={t('donor.no_certs_desc')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                          <Award className="h-5 w-5" />
                        </div>
                        <Badge variant="amber">{t('donor.govt_recognized')}</Badge>
                      </div>
                      <h4 className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {cert.certificate_number}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Type: {cert.donation_type === 'organ_pledge' ? t('donor.nav_organ_pledge') : t('donor.blood_donations')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Facility: {cert.hospital_name || 'Aarogyam Accredited Facility'} · {t('donor.date')}: {cert.donation_date}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => {
                          const html = buildCertificateHtml(cert);
                          const blob = new Blob([html], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${cert.certificate_number}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> {t('donor.view_print_cert')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── VIEW: MAP ── */}
      {view === 'map' && <InteractiveEmergencyMap hospitals={hospitals} emergencies={emergencies} />}

      {/* ── VIEW: PROFILE ── */}
      {view === 'profile' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t('donor.profile_title')}</h3>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('auth.full_name')}
                value={profileName}
                onChange={setProfileName}
                required
              />
              <Input
                label={t('auth.phone')}
                value={profilePhone}
                onChange={setProfilePhone}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('donor.blood_group')}
                value={profileBloodGroup}
                onChange={setProfileBloodGroup}
                options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
              />
              <Select
                label={t('auth.city_select')}
                value={profileCity}
                onChange={setProfileCity}
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            {profileSuccess && (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('donor.profile_saved')}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="primary" type="submit" loading={profileSaving}>
                {t('donor.save_changes')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── MODALS ── */}
      {/* Schedule Donation Modal */}
      <Modal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        title={t('donor.modal_schedule_title')}
        description={t('donor.modal_schedule_desc')}
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <Select
            label={t('donor.select_hospital')}
            value={selectedHospitalId}
            onChange={setSelectedHospitalId}
            required
            placeholder="Choose an accredited medical center..."
            options={hospitals.map((h) => ({
              value: h.id,
              label: `${h.hospital_name || h.name} (${h.city})`,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {t('donor.date')} *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {t('donor.time_slot')}
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          <Input
            label={t('donor.notes')}
            value={appointmentNotes}
            onChange={setAppointmentNotes}
            placeholder="e.g. First time blood donor, prefer morning slot"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSchedule(false)}>
              {t('donor.close')}
            </Button>
            <Button variant="orange" type="submit" loading={scheduling}>
              {t('donor.confirm_appointment')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Appointment Dialog */}
      <ConfirmDialog
        open={Boolean(cancelAppointmentId)}
        title={t('donor.cancel_appointment_title')}
        message={t('donor.cancel_appointment_desc')}
        confirmLabel={t('donor.confirm_cancel')}
        danger
        loading={cancelling}
        onCancel={() => setCancelAppointmentId(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* Organ Pledge Certificate Success Modal */}
      <Modal
        open={showPledgeCertModal}
        onClose={() => setShowPledgeCertModal(false)}
        title={t('donor.modal_pledge_title')}
        description={t('donor.modal_pledge_desc')}
      >
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
            Your pledge for <strong>{selectedOrgans.join(', ')}</strong> has been recorded in the central Maharashtra registry under ID: <strong className="font-mono text-brand-teal">{donorCode}</strong>.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPledgeCertModal(false);
                setView('certificates');
              }}
            >
              {t('donor.nav_certificates')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const latestCert = certificates.find((c) => c.donation_type === 'organ_pledge') || {
                  certificate_number: donorCode,
                  donor_name: donor?.full_name || 'Donor',
                  donation_date: new Date().toISOString(),
                  donation_type: 'organ_pledge',
                  organs: selectedOrgans,
                  hospital_name: 'Aarogyam State Registry',
                } as Certificate;
                const html = buildCertificateHtml(latestCert);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Aarogyam_Pledge_${donorCode}.html`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4 mr-1.5" /> {t('donor.download_cert')}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
