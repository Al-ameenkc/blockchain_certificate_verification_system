import { supabase } from './supabaseClient';

export async function logActivity(action: string, details: string, url?: string) {
  if (typeof window === 'undefined') return;

  try {
    const { error } = await supabase.from('activities').insert([
      { action, details, url, timestamp: new Date().toISOString() }
    ]);
    if (error) console.error("Supabase insert error:", error);
  } catch (err) {
    console.error("Supabase not configured properly.", err);
  }

  // Fallback to local storage for instant UI updates or missing env constraints
  const activitiesStr = localStorage.getItem('activities') || '[]';
  const activities = JSON.parse(activitiesStr);
  activities.unshift({
    id: Math.random().toString(36).substring(2, 9),
    action,
    details,
    url,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('activities', JSON.stringify(activities));
}
