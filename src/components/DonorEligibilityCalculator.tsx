import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { Calendar, CheckCircle2, Heart, Clock } from 'lucide-react';
import { updateDonor } from '@/lib/firebaseDb';
import type { Donor, Profile } from '@/types';

interface DonorEligibilityProps {
  donor: Donor | null;
  profile?: Profile | null;
  onUpdate?: () => void;
}

export function DonorEligibilityCalculator({ donor, onUpdate }: DonorEligibilityProps) {
  const [lastDate, setLastDate] = useState(
    donor?.last_donation_date ? new Date(donor.last_donation_date).toISOString().split('T')[0] : '',
  );
  const [gender, setGender] = useState<'male' | 'female'>(donor?.gender === 'female' ? 'female' : 'male');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Clinical recovery standard: 90 days for males (whole blood), 120 days for females
  const recoveryDays = gender === 'female' ? 120 : 90;

  let daysElapsed = 999;
  let daysRemaining = 0;
  let progressPercent = 100;
  let nextEligibleDate: Date | null = null;
  let isEligible = true;

  if (lastDate) {
    const last = new Date(lastDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - last.getTime());
    daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    nextEligibleDate = new Date(last);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + recoveryDays);

    if (daysElapsed < recoveryDays) {
      isEligible = false;
      daysRemaining = recoveryDays - daysElapsed;
      progressPercent = Math.min(100, Math.round((daysElapsed / recoveryDays) * 100));
    } else {
      isEligible = true;
      daysRemaining = 0;
      progressPercent = 100;
    }
  }

  async function handleSaveDate() {
    if (!donor) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateDonor(donor.id, {
        last_donation_date: lastDate || null,
        gender: gender,
      });
      setSavedSuccess(true);
      if (onUpdate) onUpdate();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.warn('Save eligibility fallback:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleAddCalendarReminder() {
    if (!nextEligibleDate) return;
    const title = 'Eligible for Blood Donation — Aarogyam';
    const details = 'You are now eligible to donate blood again! Schedule your lifesaving contribution on Aarogyam.';
    const startDate = nextEligibleDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title,
    )}&dates=${startDate}/${startDate}&details=${encodeURIComponent(details)}`;
    window.open(googleCalendarUrl, '_blank');
  }

  return (
    <Card className="p-6 mt-6 max-w-2xl bg-gradient-to-br from-white to-teal-50/20 dark:from-slate-900 dark:to-slate-800/80 border border-teal-100 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal text-white shadow-xs">
            <Heart className="h-4 w-4 fill-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Clinical Eligibility & Recovery Calculator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {gender === 'female' ? '120-day' : '90-day'} biological recovery calculation to safeguard your hemoglobin and wellness.
            </p>
          </div>
        </div>
        <Badge variant={isEligible ? 'green' : 'amber'} dot>
          {isEligible ? 'Eligible to Donate' : `${daysRemaining} Days Left`}
        </Badge>
      </div>

      {/* Progress Status */}
      <div className="mb-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5 shadow-xs">
        {isEligible ? (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">You Are Fully Eligible to Donate Today!</span>
                <Badge variant="green">Cleared</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {lastDate
                  ? `It has been ${daysElapsed} days since your last donation on ${lastDate}. Your iron and red blood cells are 100% restored.`
                  : 'You have no recent donation on record. Schedule a donation to save up to 3 lives!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Cellular Recovery Progress</span>
              <span className="font-mono font-black text-brand-orange">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-orange to-amber-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{daysElapsed} days since last visit</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Eligible on {nextEligibleDate?.toLocaleDateString()} (~{daysRemaining} days)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Date & Gender Config */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Biological Gender
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                  gender === g
                    ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Last Blood Donation Date
          </label>
          <input
            type="date"
            value={lastDate}
            onChange={(e) => setLastDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Medical Registry
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEligible && nextEligibleDate && (
            <Button size="xs" variant="outline" onClick={handleAddCalendarReminder}>
              <Calendar className="h-3.5 w-3.5 mr-1" /> Add Google Reminder
            </Button>
          )}
          <Button size="xs" variant="primary" onClick={handleSaveDate} loading={saving}>
            Save Record
          </Button>
        </div>
      </div>
    </Card>
  );
}
