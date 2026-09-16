import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const $ = (id) => document.getElementById(id);
let rows = [];
let loading = false;

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}

async function request(path) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Supabase request failed.');
  return data;
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
  if (loading) return;
  loading = true;
  $('refresh').disabled = true;
  try {
    // Fetch every page; Supabase may cap each response at 1,000 rows.
    const collected = [];
    for (let offset = 0; ; offset += 500) {
      const page = await request(`/rest/v1/guests?select=*&responded_at=not.is.null&order=responded_at.desc,id.desc&limit=500&offset=${offset}`);
      collected.push(...page);
      if (page.length < 500) break;
    }
    rows = collected;
    render();
    $('updated').textContent = `Updated ${new Date().toLocaleTimeString()} · Refreshes every 30 seconds`;
    status('');
  } catch (error) {
    status(`Could not refresh responses: ${error.message} Check that the guests table permits public reads, then try Refresh.`, true);
  } finally {
    loading = false;
    $('refresh').disabled = false;
  }
}

$('refresh').addEventListener('click', load);
$('search').addEventListener('input', render);
$('attendance').addEventListener('change', render);
setInterval(() => { if (!document.hidden) load(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
status('Loading responses…');
load();
