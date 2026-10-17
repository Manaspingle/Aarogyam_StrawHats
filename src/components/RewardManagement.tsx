import { useCallback, useEffect, useState } from 'react';
import { Award, Edit3, Plus, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button, Card, EmptyState, Input, Modal, Badge } from '@/components/ui';
import { getRewardRules, saveRewardRule, toggleRewardRule } from '@/lib/firebaseDb';
import type { RewardRule } from '@/types';

const emptyForm = { donation_count: '2', points: '50', title: '', description: '', badge: '' };

export function RewardManagement() {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRules = useCallback(async () => {
    const data = await getRewardRules();
    setRules(data);
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  function startEdit(rule?: RewardRule) {
    setEditingId(rule?.id || null);
    setForm(
      rule
        ? {
            donation_count: String(rule.donation_count),
            points: String(rule.points),
            title: rule.title,
            description: rule.description,
            badge: rule.badge,
          }
        : emptyForm,
    );
    setError('');
    setOpen(true);
  }

  async function handleSave() {
    const donationCount = Number(form.donation_count);
    const points = Number(form.points);
    if (!donationCount || !points || !form.title.trim()) {
      setError('Donation count, points, and title are required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      await saveRewardRule({
        id: editingId || undefined,
        donation_count: donationCount,
        points,
        title: form.title.trim(),
        description: form.description.trim(),
        badge: form.badge.trim(),
        active: true,
      });
      setOpen(false);
      loadRules();
    } catch (err: any) {
      setError(err.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: RewardRule) {
    await toggleRewardRule(rule.id, !rule.active);
    loadRules();
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
              <Award className="h-5 w-5 text-amber-500" /> Milestone Gamification & Rewards
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Configure automated milestone incentives, points, and digital honors for verified life gifts.
            </p>
          </div>
          <Button size="sm" variant="orange" onClick={() => startEdit()}>
            <Plus className="h-4 w-4 mr-1" /> Add Milestone
          </Button>
        </div>

        {rules.length === 0 ? (
          <EmptyState
            icon={<Award className="h-6 w-6" />}
            title="No Reward Milestones Configured"
            description="Create milestone tiers to motivate voluntary donors in your district."
          />
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 p-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{rule.title}</p>
                      <Badge variant={rule.active ? 'green' : 'gray'}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </Badge>
                      {rule.badge && <Badge variant="amber">{rule.badge}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {rule.donation_count} verified donation(s) · {rule.points} LifePoints · {rule.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="xs" variant="outline" onClick={() => startEdit(rule)}>
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleToggle(rule)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={rule.active ? 'Deactivate' : 'Activate'}
                  >
                    {rule.active ? (
                      <ToggleRight className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit Milestone Rule' : 'Create New Milestone Rule'}
        description="Milestone rewards and honors trigger automatically when a hospital verifies a donation."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Required Donations"
              type="number"
              min={1}
              value={form.donation_count}
              onChange={(value) => setForm({ ...form, donation_count: value })}
            />
            <Input
              label="LifePoints Awarded"
              type="number"
              min={5}
              value={form.points}
              onChange={(value) => setForm({ ...form, points: value })}
            />
          </div>

          <Input
            label="Milestone Title"
            value={form.title}
            onChange={(value) => setForm({ ...form, title: value })}
            placeholder="e.g. Dedicated Lifesaver"
          />

          <Input
            label="Badge Honorific"
            value={form.badge}
            onChange={(value) => setForm({ ...form, badge: value })}
            placeholder="e.g. Silver Guardian"
          />

          <Input
            label="Description"
            value={form.description}
            onChange={(value) => setForm({ ...form, description: value })}
            placeholder="e.g. Awarded for saving lives in 3 hospital visits."
          />

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4 mr-1.5" /> Save Milestone
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
