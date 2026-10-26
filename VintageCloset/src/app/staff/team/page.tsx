'use client';

import { useMemo, useState } from 'react';
import { useT } from '@/lib/staff/i18n';
import { useStaff } from '@/lib/staff/session';
import { useLoad, must } from '@/lib/staff/useLoad';
import { db, viennaToday, ActivityRow, EventRow, Note, Shift, Task } from '@/lib/staff/db';
import { authFetch } from '@/lib/auth-fetch';
import { Btn, Card, CardTitle, inputCls, Pill, Spinner, useToast } from '@/components/staff/ui';
import { formatDuration } from '@/components/staff/Shell';
import { cn } from '@/lib/utils';

const NOTE_COLORS: Record<string, string> = {
  teal: 'bg-[#e3f6f4]',
  plum: 'bg-[#f6e6ee]',
  sun: 'bg-amber-50',
  sky: 'bg-sky-50',
};
const TASK_EMOJIS = ['✨', '📦', '📸', '🧥', '🧹', '🎉', '💶', '📞'];

function weekStart(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

interface TeamData {
  now: number;
  shifts: Shift[];
  tasks: Task[];
  notes: Note[];
  events: EventRow[];
}

async function loadTeam(): Promise<TeamData> {
  const start = weekStart();
  const end = new Date(start.getTime() + 7 * 86400_000);
  const iso = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(d);
  const [shifts, tasks, notes, events] = await Promise.all([
    db.from('staff_shifts').select('*').gte('started_at', start.toISOString()).order('started_at', { ascending: false }).then(must<Shift[]>),
    db.from('staff_tasks').select('*').order('done').order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).limit(100).then(must<Task[]>),
    db.from('staff_notes').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(60).then(must<Note[]>),
    db.from('events').select('id,slug,title,date,time,location,is_published').gte('date', iso(start)).lt('date', iso(end)).order('date').then(must<EventRow[]>),
  ]);
  return { now: Date.now(), shifts, tasks, notes, events };
}

function SystemStatus() {
  const { t } = useT();
  const { data, loading } = useLoad(async () => {
    const res = await authFetch('/api/staff/health');
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as { checks: { name: string; ok: boolean }[] };
  });
  return (
    <Card>
      <CardTitle>🩺 {t('systemStatus')}</CardTitle>
      {loading ? (
        <Spinner />
      ) : (
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {(data?.checks ?? []).map((c) => (
            <li key={c.name} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2">
              <span>{c.name}</span>
              <Pill tone={c.ok ? 'good' : 'bad'}>{c.ok ? `✓ ${t('ok')}` : `✕ ${t('missing')}`}</Pill>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Activity({ isManager }: { isManager: boolean }) {
  const { t, lang } = useT();
  const { data, loading } = useLoad(() => db.from('activity_log').select('*').order('at', { ascending: false }).limit(40).then(must<ActivityRow[]>));
  const icon: Record<string, string> = { insert: '➕', update: '✏️', delete: '🗑️' };
  return (
    <Card>
      <CardTitle tip={t('activityTip')}>🔍 {t('activity')}</CardTitle>
      {loading ? (
        <Spinner />
      ) : (
        <ul className="max-h-96 space-y-1.5 overflow-y-auto text-sm">
          {(data ?? []).map((a) => (
            <li key={a.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-black/[0.03]">
              <span aria-hidden>{icon[a.action] ?? '•'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <b>{a.entity}</b> · {a.summary}
                </p>
                <p className="text-xs text-muted">
                  {isManager && <span dir="ltr">{a.actor} · </span>}
                  {new Date(a.at).toLocaleString(lang === 'ar' ? 'ar' : 'de-AT', { dateStyle: 'short', timeStyle: 'short' })}
                  {a.changes && ` · ${Object.keys(a.changes).slice(0, 3).join(', ')}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function TeamPage() {
  const { t, lang } = useT();
  const { worker, isManager } = useStaff();
  const toast = useToast();
  const { data, loading, reload } = useLoad(loadTeam);
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('teal');
  const [taskText, setTaskText] = useState('');
  const [taskDue, setTaskDue] = useState(viennaToday());
  const [taskEmoji, setTaskEmoji] = useState('✨');

  const locale = lang === 'ar' ? 'ar' : 'de-AT';
  const days = useMemo(() => {
    const s = weekStart();
    return Array.from({ length: 7 }, (_, i) => new Date(s.getTime() + i * 86400_000));
  }, []);
  const iso = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(d);
  const today = viennaToday();

  const hoursByWorker = useMemo(() => {
    const m = new Map<string, number>();
    (data?.shifts ?? []).forEach((s) => {
      const end = s.ended_at ? new Date(s.ended_at).getTime() : (data?.now ?? 0);
      const k = s.worker_name || '—';
      m.set(k, (m.get(k) ?? 0) + (end - new Date(s.started_at).getTime()));
    });
    return [...m.entries()];
  }, [data]);

  const addNote = async () => {
    if (!noteText.trim()) return;
    const { error } = await db.from('staff_notes').insert({ body: noteText.trim(), color: noteColor, author_name: worker });
    if (error) toast('⚠️ ' + t('error'));
    else {
      setNoteText('');
      toast('📝 ' + t('saved'));
      reload();
    }
  };
  const patchNote = async (n: Note, patch: Partial<Note>) => {
    await db.from('staff_notes').update(patch).eq('id', n.id);
    reload();
  };
  const deleteNote = async (n: Note) => {
    await db.from('staff_notes').delete().eq('id', n.id);
    reload();
  };
  const addTask = async () => {
    if (!taskText.trim()) return;
    const { error } = await db.from('staff_tasks').insert({ title: taskText.trim(), emoji: taskEmoji, due_date: taskDue || null });
    if (error) toast('⚠️ ' + t('error'));
    else {
      setTaskText('');
      reload();
    }
  };
  const toggleTask = async (task: Task) => {
    await db
      .from('staff_tasks')
      .update(task.done ? { done: false, done_by: null, done_at: null } : { done: true, done_by: worker, done_at: new Date().toISOString() })
      .eq('id', task.id);
    if (!task.done) toast('🎉 ' + task.title);
    reload();
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">🗓️ {t('teamTitle')}</h1>

      {/* Week plan */}
      <Card>
        <CardTitle tip={t('scheduleTip')}>📅 {t('schedule')}</CardTitle>
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-7 gap-2">
            {days.map((d) => {
              const key = iso(d);
              const ev = (data?.events ?? []).filter((e) => e.date === key);
              const tasks = (data?.tasks ?? []).filter((tk) => tk.due_date === key);
              const workers = [...new Set((data?.shifts ?? []).filter((s) => iso(new Date(s.started_at)) === key).map((s) => s.worker_name || '—'))];
              return (
                <div key={key} className={cn('min-h-36 rounded-2xl border p-2', key === today ? 'border-brand-teal bg-brand-teal/5' : 'border-hairline bg-white')}>
                  <p className="mb-2 text-xs font-semibold text-muted">
                    {d.toLocaleDateString(locale, { weekday: 'short' })} <span className="text-ink">{d.getDate()}</span>
                  </p>
                  <div className="space-y-1">
                    {ev.map((e) => (
                      <p key={e.id} className="truncate rounded-lg bg-brand-plum px-2 py-1 text-[11px] font-semibold text-white" title={e.title}>
                        🎉 {e.title}
                      </p>
                    ))}
                    {tasks.map((tk) => (
                      <p key={tk.id} className={cn('truncate rounded-lg bg-amber-50 px-2 py-1 text-[11px]', tk.done && 'line-through opacity-60')} title={tk.title}>
                        {tk.emoji} {tk.title}
                      </p>
                    ))}
                    {workers.map((w) => (
                      <p key={w} className="truncate rounded-lg bg-black/5 px-2 py-1 text-[11px]">
                        🙋 {w}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks */}
        <Card>
          <CardTitle tip={t('tasksTip')}>✅ {t('tasks')}</CardTitle>
          <form
            className="mb-4 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addTask();
            }}
          >
            <select id="task-emoji" aria-label="Emoji" className={cn(inputCls, 'w-16 px-2')} value={taskEmoji} onChange={(e) => setTaskEmoji(e.target.value)}>
              {TASK_EMOJIS.map((em) => (
                <option key={em}>{em}</option>
              ))}
            </select>
            <input id="task-title" className={cn(inputCls, 'min-w-0 flex-1')} placeholder={t('newTask')} value={taskText} onChange={(e) => setTaskText(e.target.value)} maxLength={200} />
            <input id="task-due" aria-label={t('dueDate')} type="date" className={cn(inputCls, 'w-40')} value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
            <Btn type="submit" variant="primary" disabled={!taskText.trim()}>
              {t('add')}
            </Btn>
          </form>
          <ul className="space-y-1.5">
            {(data?.tasks ?? []).map((tk) => {
              const overdue = !tk.done && tk.due_date && tk.due_date < today;
              return (
                <li key={tk.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-black/[0.03]">
                  <button
                    onClick={() => toggleTask(tk)}
                    aria-label={tk.title}
                    className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs', tk.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-hairline hover:border-brand-teal')}
                  >
                    {tk.done && '✓'}
                  </button>
                  <span className={cn('flex-1 text-sm', tk.done && 'text-muted line-through')}>
                    {tk.emoji} {tk.title}
                  </span>
                  {tk.done && tk.done_by && <span className="text-xs text-muted">🙋 {tk.done_by}</span>}
                  {tk.due_date && !tk.done && <Pill tone={overdue ? 'bad' : 'neutral'}>{new Date(`${tk.due_date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</Pill>}
                  {isManager && (
                    <button onClick={async () => { await db.from('staff_tasks').delete().eq('id', tk.id); reload(); }} className="text-xs text-muted hover:text-red-600" aria-label={t('delete')}>
                      🗑️
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Shifts */}
        <Card>
          <CardTitle>⏱️ {t('shiftsWeek')}</CardTitle>
          {hoursByWorker.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {hoursByWorker.map(([w, ms]) => (
                <Pill key={w} tone="teal">
                  🙋 {w}: {formatDuration(ms, t('hours'))}
                </Pill>
              ))}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="text-start text-xs uppercase tracking-wider text-muted">
                  <th className="pb-2 text-start font-semibold">{t('worker')}</th>
                  <th className="pb-2 text-start font-semibold">{t('start')}</th>
                  <th className="pb-2 text-start font-semibold">{t('end')}</th>
                  <th className="pb-2 text-end font-semibold">{t('duration')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.shifts ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-hairline">
                    <td className="py-2">{s.worker_name || '—'}</td>
                    <td className="py-2 tabular-nums">{new Date(s.started_at).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2 tabular-nums">{s.ended_at ? new Date(s.ended_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : <Pill tone="good">●</Pill>}</td>
                    <td className="py-2 text-end tabular-nums">{formatDuration((s.ended_at ? new Date(s.ended_at).getTime() : (data?.now ?? 0)) - new Date(s.started_at).getTime(), t('hours'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <div id="notes" className="scroll-mt-24" />
        <CardTitle tip={t('notesTip')}>📝 {t('notes')}</CardTitle>
        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            addNote();
          }}
        >
          <textarea id="note-text" className={cn(inputCls, 'min-h-16 flex-1')} placeholder={t('writeNote')} value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={2000} />
          <div className="flex items-center gap-2 sm:flex-col">
            <div className="flex gap-1">
              {Object.keys(NOTE_COLORS).map((c) => (
                <button key={c} type="button" onClick={() => setNoteColor(c)} aria-label={c} className={cn('h-7 w-7 rounded-full border-2', NOTE_COLORS[c], noteColor === c ? 'border-ink' : 'border-transparent')} />
              ))}
            </div>
            <Btn type="submit" variant="primary" disabled={!noteText.trim()} className="w-full">
              {t('add')}
            </Btn>
          </div>
        </form>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.notes ?? []).map((n) => (
            <li key={n.id} className={cn('relative rounded-2xl p-4 shadow-sm transition hover:-rotate-[0.5deg]', NOTE_COLORS[n.color] ?? NOTE_COLORS.teal, n.done && 'opacity-50')}>
              {n.pinned && <span className="absolute -top-2 end-3 text-lg" aria-hidden>📌</span>}
              <p className={cn('whitespace-pre-wrap text-sm', n.done && 'line-through')}>{n.body}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                <span>
                  {n.author_name || '—'} · {new Date(n.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                </span>
                <span className="ms-auto flex gap-1">
                  <button onClick={() => patchNote(n, { pinned: !n.pinned })} className="rounded px-1 hover:bg-black/5" title={t('pin')}>
                    📌
                  </button>
                  <button onClick={() => patchNote(n, { done: !n.done })} className="rounded px-1 hover:bg-black/5" title={t('markDone')}>
                    ✓
                  </button>
                  {isManager && (
                    <button onClick={() => deleteNote(n)} className="rounded px-1 hover:bg-black/5" title={t('delete')}>
                      🗑️
                    </button>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Activity isManager={isManager} />
        {isManager && <SystemStatus />}
      </div>
    </div>
  );
}
