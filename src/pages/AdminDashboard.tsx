import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, Building2, Calendar, CheckCircle2,
  XCircle, AlertTriangle, Award, Search, Phone, MapPin, Download,
  ShieldCheck, Activity, Droplets, Trash2, ShieldAlert
} from 'lucide-react';
import { DashboardLayout, PageHeader, StatCard, type NavItem } from '@/components/DashboardLayout';
import { Card, Badge, Input, Button, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui';
import {
  getDonors,
  getHospitals,
  updateHospital,
  deleteHospital,
  deleteDonor,
  getAppointments,
  getCertificates,
  getEmergencyRequests,
  getTransparencyLogs,
} from '@/lib/firebaseDb';
import { RewardManagement } from '@/components/RewardManagement';
import { buildCertificateHtml } from '@/lib/certificateTemplate';
import type { Donor, Hospital, Appointment, Certificate, EmergencyRequest, AuditLog } from '@/types';

type View = 'overview' | 'donors' | 'hospitals' | 'appointments' | 'certificates' | 'emergencies' | 'rewards' | 'transparency';

export default function AdminDashboard() {
  const [view, setView] = useState<View>('overview');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [donorList, hospList, apptList, certList, emList, logList] = await Promise.all([
      getDonors(),
      getHospitals(),
      getAppointments(),
      getCertificates(),
      getEmergencyRequests(),
      getTransparencyLogs(),
    ]);
    setDonors(donorList);
    setHospitals(hospList);
    setAppointments(apptList);
    setCertificates(certList);
    setEmergencies(emList);
    setLogs(logList);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleHospitalApproval(hosp: Hospital) {
    const isApproved = !hosp.is_approved;
    await updateHospital(hosp.id, { is_approved: isApproved, verified: isApproved });
    loadData();
  }

  function confirmDeleteHospital(hospitalId: string) {
    setConfirmDialog({
      open: true,
      title: 'Revoke & Delete Hospital Facility?',
      message: 'This will remove the facility from the active Aarogyam registry and cancel pending transfer routes.',
      onConfirm: async () => {
        setActionLoading(true);
        await deleteHospital(hospitalId);
        setActionLoading(false);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        loadData();
      },
    });
  }

  function confirmDeleteDonor(donorId: string) {
    setConfirmDialog({
      open: true,
      title: 'Remove Donor Record?',
      message: 'This will remove the donor profile from the voluntary registry.',
      onConfirm: async () => {
        setActionLoading(true);
        await deleteDonor(donorId);
        setActionLoading(false);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        loadData();
      },
    });
  }

  const pendingHospitals = hospitals.filter((h) => !h.is_approved);
  const activeEmergencies = emergencies.filter((e) => e.status === 'active');

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Network Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'donors', label: 'Donor Directory', icon: <Users className="h-4 w-4" /> },
    { id: 'hospitals', label: 'Hospital Facilities', icon: <Building2 className="h-4 w-4" /> },
    { id: 'appointments', label: 'All Appointments', icon: <Calendar className="h-4 w-4" /> },
    { id: 'certificates', label: 'Issued Certificates', icon: <Award className="h-4 w-4 text-amber-500" /> },
    { id: 'emergencies', label: 'Emergency Alerts', icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
    { id: 'rewards', label: 'Reward Rules', icon: <Award className="h-4 w-4 text-brand-orange" /> },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      activeView={view}
      onNavigate={(v) => setView(v as View)}
      roleLabel="Central Network Admin"
    >
      {/* ── VIEW: OVERVIEW ── */}
      {view === 'overview' && (
        <>
          <PageHeader
            title="Aarogyam State Central Oversight"
            description="Maharashtra healthcare coordination, facility accreditation, and real-time emergency allocations."
            badge={<Badge variant="teal" dot>Live Operations</Badge>}
          />

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
                label="Registered Donors"
                value={donors.length}
                icon={<Users className="h-5 w-5" />}
                color="blue"
                subtitle="Verified citizens"
              />
              <StatCard
                label="Hospital Facilities"
                value={hospitals.length}
                icon={<Building2 className="h-5 w-5" />}
                color="green"
                subtitle="Accredited centers"
              />
              <StatCard
                label="Total Appointments"
                value={appointments.length}
                icon={<Calendar className="h-5 w-5" />}
                color="teal"
                subtitle="Scheduled & completed"
              />
              <StatCard
                label="Active Emergency SOS"
                value={activeEmergencies.length}
                icon={<AlertTriangle className="h-5 w-5" />}
                color="red"
                subtitle="Urgent broadcasts"
              />
            </div>
          )}

          {/* Pending Hospital Approvals Card */}
          <div className="mt-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Facility Accreditation Queue
                  </h3>
                  <p className="text-xs text-slate-500">Hospitals requiring state health directorate verification</p>
                </div>
                <Badge variant={pendingHospitals.length > 0 ? 'yellow' : 'green'} dot>
                  {pendingHospitals.length} Pending
                </Badge>
              </div>

              {pendingHospitals.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="h-6 w-6 text-emerald-600" />}
                  title="All Facilities Accredited"
                  description="All registered hospital medical facilities are verified and operational."
                />
              ) : (
                <div className="space-y-3">
                  {pendingHospitals.map((hosp) => (
                    <div
                      key={hosp.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/40"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {hosp.hospital_name || hosp.name}
                          </h4>
                          <Badge variant="yellow">Pending Review</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {hosp.city} · {hosp.address} · Contact: {hosp.phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="xs" variant="teal" onClick={() => handleToggleHospitalApproval(hosp)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve Accreditation
                        </Button>
                        <Button size="xs" variant="ghost" className="text-red-600" onClick={() => confirmDeleteHospital(hosp.id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ── VIEW: DONOR DIRECTORY ── */}
      {view === 'donors' && (
        <div>
          <PageHeader
            title="Voluntary Donor Directory"
            description="All real registered voluntary blood donors and organ pledgers in Maharashtra."
            badge={<Badge variant="blue" dot>{donors.length} Registered</Badge>}
          />

          <Card className="p-6">
            {donors.length === 0 ? (
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="No Donors Registered Yet"
                description="When citizens register via the Aarogyam Donor registration form, their profiles will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Donor Name</th>
                      <th className="py-3 px-3">Blood Group</th>
                      <th className="py-3 px-3">City</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Pledged Organs</th>
                      <th className="py-3 px-3">Honor Tier</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {donors.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{d.full_name}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-black text-brand-orange">{d.blood_group}</span>
                        </td>
                        <td className="py-3 px-3">{d.city}</td>
                        <td className="py-3 px-3 font-mono">{d.phone}</td>
                        <td className="py-3 px-3">{d.organs?.length ? d.organs.join(', ') : 'None'}</td>
                        <td className="py-3 px-3">
                          <Badge variant="teal">{d.donor_level || 'Bronze'}</Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => confirmDeleteDonor(d.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── VIEW: HOSPITALS ── */}
      {view === 'hospitals' && (
        <div>
          <PageHeader
            title="Hospital Facilities Registry"
            description="Manage hospital accreditation, active trauma bays, and cold-chain blood banks."
            badge={<Badge variant="green" dot>{hospitals.length} Centers</Badge>}
          />

          <Card className="p-6">
            {hospitals.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-6 w-6" />}
                title="No Hospitals Registered Yet"
                description="When medical centers register via Aarogyam Hospital Registration, they will appear here for verification."
              />
            ) : (
              <div className="space-y-3">
                {hospitals.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {h.hospital_name || h.name}
                        </h4>
                        <Badge variant={h.is_approved ? 'green' : 'yellow'} dot>
                          {h.is_approved ? 'Accredited' : 'Pending Review'}
                        </Badge>
                        <Badge variant="teal">{h.city}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Address: {h.address} · Phone: {h.phone} {h.emergency_helpline ? `· Emergency: ${h.emergency_helpline}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        variant={h.is_approved ? 'outline' : 'teal'}
                        onClick={() => handleToggleHospitalApproval(h)}
                      >
                        {h.is_approved ? 'Revoke Approval' : 'Approve Facility'}
                      </Button>
                      <button
                        onClick={() => confirmDeleteHospital(h.id)}
                        className="text-red-500 hover:text-red-700 p-1.5"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── VIEW: APPOINTMENTS ── */}
      {view === 'appointments' && (
        <Card className="p-6">
          <PageHeader
            title="System-Wide Donation Appointments"
            description="Real-time log of voluntary donor visits across all hospital centers."
            badge={<Badge variant="blue">{appointments.length} Total</Badge>}
          />
          {appointments.length === 0 ? (
            <EmptyState icon={<Calendar className="h-6 w-6" />} title="No Appointments on Record" />
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{a.donor_name || 'Donor'}</span>
                    <span className="text-slate-400"> → </span>
                    <span className="font-semibold text-brand-teal">{a.hospital_name || 'Hospital'}</span>
                    <p className="text-slate-500 mt-0.5">{a.appointment_date} · {a.appointment_time}</p>
                  </div>
                  <Badge variant={a.status === 'completed' ? 'green' : a.status === 'scheduled' ? 'blue' : 'gray'} dot>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── VIEW: CERTIFICATES ── */}
      {view === 'certificates' && (
        <Card className="p-6">
          <PageHeader
            title="System-Wide Certificates Issued"
            description="Archive of all state honor certificates generated for blood donations and organ pledges."
            badge={<Badge variant="amber">{certificates.length} Issued</Badge>}
          />
          {certificates.length === 0 ? (
            <EmptyState icon={<Award className="h-6 w-6" />} title="No Certificates Issued Yet" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map((cert) => (
                <div key={cert.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-mono font-bold text-brand-teal">{cert.certificate_number}</p>
                    <p className="font-bold text-slate-800 dark:text-white mt-0.5">{cert.donor_name}</p>
                    <p className="text-slate-500">{cert.hospital_name || 'Aarogyam State Registry'} · {cert.donation_date}</p>
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
                    <Download className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── VIEW: EMERGENCIES ── */}
      {view === 'emergencies' && (
        <Card className="p-6">
          <PageHeader
            title="Emergency SOS History"
            description="Live feed of critical blood shortages and bystander trauma incidents."
          />
          {emergencies.length === 0 ? (
            <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="No Emergency Alerts" />
          ) : (
            <div className="space-y-3">
              {emergencies.map((em) => (
                <div key={em.id} className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-red-700">{em.hospital_name}</span>
                    <span className="text-slate-500"> — {em.blood_group} ({em.units_needed} Units needed)</span>
                    <p className="text-slate-400 mt-0.5">{em.created_at}</p>
                  </div>
                  <Badge variant={em.status === 'active' ? 'red' : 'green'}>{em.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── VIEW: REWARDS ── */}
      {view === 'rewards' && <RewardManagement />}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        confirmLabel="Confirm Action"
        danger
        loading={actionLoading}
      />
    </DashboardLayout>
  );
}
