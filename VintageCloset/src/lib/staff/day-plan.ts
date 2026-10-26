import { db } from './db';

// The shop's day plan for the Today pipeline: which built-in steps show, the daily goal for new pieces,
// and the shop's own daily tasks. One shared row in public.staff_settings (key 'day_plan'); managers edit it.
export interface CustomTask {
  id: string;
  emoji: string;
  title: string;
}

export interface DayPlan {
  hidden: string[];
  goal: number;
  custom: CustomTask[];
}

export const DEFAULT_DAY_PLAN: DayPlan = { hidden: [], goal: 3, custom: [] };
export const MAX_CUSTOM_TASKS = 8;
// Starting the shift is how the day begins; it cannot be hidden
export const LOCKED_STEPS = ['shift'];

function clean(value: unknown): DayPlan {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<DayPlan>;
  const goal = Number(v.goal);
  return {
    hidden: Array.isArray(v.hidden) ? v.hidden.filter((k): k is string => typeof k === 'string' && !LOCKED_STEPS.includes(k)) : [],
    goal: Number.isFinite(goal) ? Math.min(20, Math.max(1, Math.round(goal))) : DEFAULT_DAY_PLAN.goal,
    custom: Array.isArray(v.custom)
      ? v.custom
          .filter((c): c is CustomTask => !!c && typeof c.id === 'string' && typeof c.title === 'string' && c.title.trim() !== '')
          .slice(0, MAX_CUSTOM_TASKS)
          .map((c) => ({ id: c.id, emoji: (c.emoji || '✅').slice(0, 4), title: c.title.trim().slice(0, 60) }))
      : [],
  };
}

/** The saved plan, or the default when nothing is saved yet (or the table is not set up). */
export async function loadDayPlan(): Promise<DayPlan> {
  const { data, error } = await db.from('staff_settings').select('value').eq('key', 'day_plan').maybeSingle();
  if (error || !data) return DEFAULT_DAY_PLAN;
  return clean((data as { value: unknown }).value);
}

export async function saveDayPlan(plan: DayPlan): Promise<boolean> {
  const { error } = await db.from('staff_settings').upsert({ key: 'day_plan', value: clean(plan), updated_at: new Date().toISOString() });
  return !error;
}

export const customKey = (task: CustomTask) => `custom:${task.id}`;
