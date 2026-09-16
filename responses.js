import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const $ = (id) => document.getElementById(id);
let session = null;
let rows = [];
let loading = false;
let generation = 0;

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}

async function request(path, options = {}, token = session?.access_token) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Supabase request failed.');
  return data;
}

function reset() {
  generation++;
  session = null;
  rows = [];
  $('responses').replaceChildren();
  $('dashboard').hidden = true;
  $('login-panel').hidden = false;
}

function cell(text, detail) {
  const td = document.createElement('td');
  td.textContent = String(text ?? '—');
  if (detail) {
    const span = document.createElement('span');
    span.className = 'detail';
    span.textContent = detail;
    td.append(span);
  }
  return td;
}

function render() {
  const attending = rows.filter((row) => row.attendance === 'yes');
  $('total').textContent = rows.length;
  $('attending').textContent = attending.length;
  $('declined').textContent = rows.filter((row) => row.attendance === 'no').length;
  $('guests').textContent = attending.reduce((sum, row) => sum + (Number(row.guest_count) || 1), 0);
  const term = $('search').value.trim().toLowerCase();
  const filter = $('attendance').value;
  const visible = rows.filter((row) => (filter === 'all' || (row.attendance || 'pending') === filter) && JSON.stringify(row).toLowerCase().includes(term));
  $('count').textContent = `${visible.length} of ${rows.length} replies`;
  $('empty').hidden = visible.length !== 0;
  $('empty').textContent = rows.length ? 'No replies match your filters.' : 'No RSVP responses yet.';
  $('responses').replaceChildren(...visible.map((row) => {
    const tr = document.createElement('tr');
    const companions = Array.isArray(row.companions) ? row.companions.map((person) => `${person.name || 'Unnamed'} (${person.type || 'adult'})${person.allergies ? ` — ${person.allergies}` : ''}`).join('\n') : '';
    tr.append(cell(row.full_name, [row.phone, row.email].filter(Boolean).join(' · ')), cell(row.attendance === 'yes' ? 'Attending' : row.attendance === 'no' ? 'Declined' : 'Pending'), cell(row.guest_count ?? 1), cell(companions || '—'), cell(row.song_request), cell([row.message, row.dietary_requirements, row.accommodation && `Accommodation: ${row.accommodation}`, row.needs_transport && 'Transport requested'].filter(Boolean).join('\n') || '—'), cell(row.responded_at ? new Date(row.responded_at).toLocaleString() : '—'));
    return tr;
  }));
}

async function load() {
  if (!session || loading) return;
  const current = generation;
  loading = true;
  $('refresh').disabled = true;
  try {
    if (session.expires_at <= Date.now() / 1000 + 60) {
      const refreshed = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) });
      if (current !== generation) return;
      session = { ...refreshed, expires_at: Date.now() / 1000 + refreshed.expires_in };
    }
    // Fetch every page; Supabase may cap each response at 1,000 rows.
    const collected = [];
    for (let offset = 0; ; offset += 500) {
      const page = await request(`/rest/v1/guests?select=*&responded_at=not.is.null&order=responded_at.desc,id.desc&limit=500&offset=${offset}`);
      if (current !== generation) return;
      collected.push(...page);
      if (page.length < 500) break;
    }
    rows = collected;
    render();
    $('updated').textContent = `Updated ${new Date().toLocaleTimeString()} · Refreshes every 30 seconds`;
    status('');
  } catch (error) {
    if (current === generation) status(`Could not refresh responses: ${error.message} Check the admin account and the guests table permissions, then try Refresh.`, true);
  } finally {
    loading = false;
    $('refresh').disabled = false;
  }
}

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('login-button').disabled = true;
  status('Signing in…');
  try {
    const signedIn = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: $('email').value.trim(), password: $('password').value }) });
    const roles = await request(`/rest/v1/user_roles?select=role&user_id=eq.${encodeURIComponent(signedIn.user.id)}&role=eq.admin`, {}, signedIn.access_token);
    if (!roles.length) throw new Error('This account does not have the existing admin role.');
    session = { ...signedIn, expires_at: Date.now() / 1000 + signedIn.expires_in };
    generation++;
    $('password').value = '';
    $('login-panel').hidden = true;
    $('dashboard').hidden = false;
    status('Loading responses…');
    await load();
  } catch (error) {
    reset();
    status(`Could not sign in: ${error.message}`, true);
  } finally {
    $('login-button').disabled = false;
  }
});
$('sign-out').addEventListener('click', async () => {
  const token = session?.access_token;
  reset();
  status('Signed out.');
  try { await request('/auth/v1/logout', { method: 'POST' }, token); } catch { /* Local session is already cleared. */ }
});
$('refresh').addEventListener('click', load);
$('search').addEventListener('input', render);
$('attendance').addEventListener('change', render);
setInterval(() => { if (!document.hidden) load(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
