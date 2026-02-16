import { useEffect, useState } from 'react';
import browser from '../shared/browser';
import { getToken, setToken, clearToken, getApiBase } from '../shared/auth';
import type {
  LinkedInScrapedProfile,
  LinkedInJobPayload,
  ExtensionUser,
  JobStatus,
  MessageResponse,
} from '../shared/types';

// ── API helper — all calls go through the service worker ─────────────────────
// webextension-polyfill makes sendMessage return a Promise, no callbacks needed.

async function swFetch<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = (await browser.runtime.sendMessage(
    { type: 'API_FETCH', path, method, body },
  )) as MessageResponse<T>;
  if (response.error) throw new Error(response.error);
  return response.data as T;
}

async function getCachedProfile(): Promise<LinkedInScrapedProfile | null> {
  const r = (await browser.runtime.sendMessage({ type: 'GET_CACHED_PROFILE' })) as MessageResponse;
  return (r.data as LinkedInScrapedProfile) ?? null;
}

async function getCachedJob(): Promise<LinkedInJobPayload | null> {
  const r = (await browser.runtime.sendMessage({ type: 'GET_CACHED_JOB' })) as MessageResponse;
  return (r.data as LinkedInJobPayload) ?? null;
}

// ── Shared style primitives ───────────────────────────────────────────────────

const s = {
  wrapper: { padding: '16px', fontFamily: 'inherit' } as const,
  header: {
    display: 'flex', alignItems: 'center', gap: '8px',
    paddingBottom: '12px', borderBottom: '1px solid #e5e7eb', marginBottom: '14px',
  } as const,
  logo: { fontSize: '15px', fontWeight: 700, color: '#2563eb' } as const,
  userBadge: { marginLeft: 'auto', fontSize: '11px', color: '#6b7280' } as const,
  card: {
    background: '#f9fafb', border: '1px solid #e5e7eb',
    borderRadius: '8px', padding: '12px', marginBottom: '12px',
  } as const,
  label: { fontSize: '11px', color: '#6b7280', marginBottom: '2px' } as const,
  value: { fontSize: '13px', fontWeight: 500, color: '#111827' } as const,
  sub: { fontSize: '12px', color: '#4b5563' } as const,
  btn: (color = '#2563eb') =>
    ({
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
      border: 'none', cursor: 'pointer', background: color, color: '#fff',
      width: '100%', transition: 'opacity .15s',
    } as const),
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
    border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff',
    color: '#374151', width: '100%',
  } as const,
  input: {
    width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '12px',
    border: '1px solid #d1d5db', background: '#fff', color: '#111827',
    fontFamily: 'inherit', outline: 'none',
  } as const,
  select: {
    width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '13px',
    border: '1px solid #d1d5db', background: '#fff', color: '#111827',
    fontFamily: 'inherit', outline: 'none', marginBottom: '8px',
  } as const,
  error: {
    fontSize: '12px', color: '#dc2626', background: '#fef2f2',
    border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 10px',
    marginBottom: '10px',
  } as const,
  success: {
    fontSize: '12px', color: '#16a34a', background: '#f0fdf4',
    border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 10px',
    marginBottom: '10px',
  } as const,
  hint: {
    fontSize: '12px', color: '#6b7280', lineHeight: '1.5',
    marginBottom: '10px',
  } as const,
  tag: {
    display: 'inline-block', padding: '2px 8px', borderRadius: '999px',
    fontSize: '11px', fontWeight: 500,
    background: '#eff6ff', color: '#2563eb', marginRight: '4px', marginBottom: '4px',
  } as const,
};

// ── Auth Screen ───────────────────────────────────────────────────────────────

function AuthScreen({ onConnected }: { onConnected: (user: ExtensionUser) => void }) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function connect() {
    if (!tokenInput.trim()) { setError('Please paste your HandisCV token.'); return; }
    setLoading(true);
    setError('');
    try {
      await setToken(tokenInput.trim());
      const user = await swFetch<ExtensionUser>('/auth/me');
      onConnected(user);
    } catch {
      await clearToken();
      setError('Invalid or expired token. Get a new one from HandisCV Settings.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <span style={s.logo}>HandisCV</span>
      </div>
      <p style={s.hint}>
        Paste your HandisCV token below to connect. You can find it in{' '}
        <strong>Settings → Browser Extension</strong>.
      </p>
      {error && <div style={s.error}>{error}</div>}
      <textarea
        style={{ ...s.input, height: '72px', resize: 'none', fontFamily: 'monospace', fontSize: '11px', marginBottom: '8px' }}
        placeholder="Paste token here..."
        value={tokenInput}
        onChange={(e) => setTokenInput(e.target.value)}
      />
      <button style={s.btn()} onClick={connect} disabled={loading}>
        {loading ? 'Connecting…' : 'Connect Account'}
      </button>
    </div>
  );
}

// ── Profile Import Card ───────────────────────────────────────────────────────

function ProfileCard({ user, onDisconnect }: { user: ExtensionUser; onDisconnect: () => void }) {
  const [profile, setProfile] = useState<LinkedInScrapedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [appBase, setAppBase] = useState('https://app.handiscv.com');

  useEffect(() => {
    getCachedProfile().then(setProfile).finally(() => setLoading(false));
    getApiBase().then((base) => {
      // Derive app URL from API URL (strip /api suffix, replace api. with app.)
      const appUrl = base.replace(/\/api$/, '').replace('://api.', '://app.');
      setAppBase(appUrl);
    });
  }, []);

  async function handleImport() {
    if (!profile) return;
    setImporting(true);
    setError('');
    try {
      const result = await swFetch<{ resumeId: string; title: string }>(
        '/import/linkedin-extension',
        'POST',
        { profileData: profile },
      );
      setResumeId(result.resumeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div style={s.wrapper}>
        <Header user={user} onDisconnect={onDisconnect} />
        <p style={{ ...s.hint, textAlign: 'center', padding: '20px 0' }}>Loading profile…</p>
      </div>
    );
  }

  if (!profile || !profile.fullName) {
    return (
      <div style={s.wrapper}>
        <Header user={user} onDisconnect={onDisconnect} />
        <div style={s.card}>
          <p style={s.hint}>
            Could not read this LinkedIn profile. Try scrolling down to load all sections, then
            re-open this popup.
          </p>
        </div>
      </div>
    );
  }

  if (resumeId) {
    return (
      <div style={s.wrapper}>
        <Header user={user} onDisconnect={onDisconnect} />
        <div style={s.success}>Resume imported successfully!</div>
        <a
          href={`${appBase}/editor/${resumeId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...s.btn(), textDecoration: 'none', display: 'block', textAlign: 'center' }}
        >
          Open in HandisCV Editor →
        </a>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <Header user={user} onDisconnect={onDisconnect} />
      <div style={s.card}>
        <div style={{ marginBottom: '8px' }}>
          <div style={s.label}>Name</div>
          <div style={s.value}>{profile.fullName}</div>
        </div>
        {profile.headline && (
          <div style={{ marginBottom: '8px' }}>
            <div style={s.label}>Headline</div>
            <div style={s.sub}>{profile.headline}</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#4b5563' }}>
          {profile.experience.length > 0 && (
            <span>{profile.experience.length} experience{profile.experience.length !== 1 ? 's' : ''}</span>
          )}
          {profile.education.length > 0 && (
            <span>{profile.education.length} education</span>
          )}
          {profile.skills.length > 0 && (
            <span>{profile.skills.length} skills</span>
          )}
        </div>
      </div>
      {error && <div style={s.error}>{error}</div>}
      <button style={s.btn()} onClick={handleImport} disabled={importing}>
        {importing ? 'Importing…' : 'Import to HandisCV'}
      </button>
    </div>
  );
}

// ── Job Save Card ─────────────────────────────────────────────────────────────

const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'SAVED', label: 'Save for later' },
  { value: 'APPLIED', label: 'Already applied' },
  { value: 'INTERVIEW', label: 'Interview scheduled' },
  { value: 'OFFER', label: 'Received offer' },
  { value: 'REJECTED', label: 'Rejected' },
];

function JobCard({ user, onDisconnect }: { user: ExtensionUser; onDisconnect: () => void }) {
  const [job, setJob] = useState<LinkedInJobPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<JobStatus>('SAVED');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [appBase, setAppBase] = useState('https://app.handiscv.com');

  useEffect(() => {
    getCachedJob().then(setJob).finally(() => setLoading(false));
    getApiBase().then((base) => {
      setAppBase(base.replace(/\/api$/, '').replace('://api.', '://app.'));
    });
  }, []);

  async function handleSave() {
    if (!job) return;
    setSaving(true);
    setError('');
    try {
      await swFetch('/jobs', 'POST', {
        jobTitle: job.jobTitle,
        company: job.company,
        url: job.url,
        status,
        notes: notes.trim() || undefined,
      });
      // Reset badge (tracker handles real count)
      await browser.runtime.sendMessage({ type: 'SET_BADGE', count: 0 });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={s.wrapper}>
        <Header user={user} onDisconnect={onDisconnect} />
        <p style={{ ...s.hint, textAlign: 'center', padding: '20px 0' }}>Loading job…</p>
      </div>
    );
  }

  if (!job || !job.jobTitle) {
    return (
      <div style={s.wrapper}>
        <Header user={user} onDisconnect={onDisconnect} />
        <div style={s.card}>
          <p style={s.hint}>
            Could not read this job listing. Try reloading the page, then re-open this popup.
          </p>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div style={s.wrapper}>
        <Header user={user} onDisconnect={onDisconnect} />
        <div style={s.success}>Job saved to your tracker!</div>
        <a
          href={`${appBase}/jobs`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...s.btn(), textDecoration: 'none', display: 'block', textAlign: 'center' }}
        >
          View Job Tracker →
        </a>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <Header user={user} onDisconnect={onDisconnect} />
      <div style={s.card}>
        <div style={{ marginBottom: '6px' }}>
          <div style={s.label}>Job Title</div>
          <div style={s.value}>{job.jobTitle}</div>
        </div>
        {job.company && (
          <div>
            <div style={s.label}>Company</div>
            <div style={s.sub}>{job.company}</div>
          </div>
        )}
        {job.location && (
          <div style={{ marginTop: '4px' }}>
            <div style={s.label}>Location</div>
            <div style={s.sub}>{job.location}</div>
          </div>
        )}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div style={s.label}>Status</div>
        <select
          style={s.select}
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus)}
        >
          {JOB_STATUSES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={s.label}>Notes (optional)</div>
        <textarea
          style={{ ...s.input, height: '56px', resize: 'none', marginTop: '4px' }}
          placeholder="e.g. referral from John, salary 100k–120k..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <div style={s.error}>{error}</div>}
      <button style={s.btn()} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save to Job Tracker'}
      </button>
    </div>
  );
}

// ── Guide (user on a non-LinkedIn page) ──────────────────────────────────────

function GuideScreen({ user, onDisconnect }: { user: ExtensionUser; onDisconnect: () => void }) {
  return (
    <div style={s.wrapper}>
      <Header user={user} onDisconnect={onDisconnect} />
      <div style={s.card}>
        <p style={{ ...s.hint, marginBottom: '8px' }}>Navigate to LinkedIn to use this extension:</p>
        <ul style={{ paddingLeft: '16px', fontSize: '12px', color: '#4b5563', lineHeight: '1.8' }}>
          <li>
            <strong>Profile page</strong> (<code>linkedin.com/in/…</code>) — import your profile
            into a HandisCV resume
          </li>
          <li>
            <strong>Job listing</strong> (<code>linkedin.com/jobs/view/…</code>) — save the job to
            your Job Tracker
          </li>
        </ul>
      </div>
    </div>
  );
}

// ── Shared Header ─────────────────────────────────────────────────────────────

function Header({ user, onDisconnect }: { user: ExtensionUser; onDisconnect: () => void }) {
  return (
    <div style={s.header}>
      <span style={s.logo}>HandisCV</span>
      <span style={s.userBadge}>{user.email}</span>
      <button
        onClick={onDisconnect}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '11px', color: '#9ca3af', padding: '0 0 0 6px',
        }}
        title="Disconnect"
      >
        ×
      </button>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

type PageType = 'profile' | 'job' | 'other';

export default function App() {
  const [user, setUser] = useState<ExtensionUser | null>(null);
  const [pageType, setPageType] = useState<PageType>('other');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function boot() {
      // 1. Check stored token
      const token = await getToken();
      if (token) {
        try {
          const me = await swFetch<ExtensionUser>('/auth/me');
          setUser(me);
        } catch {
          await clearToken();
        }
      }

      // 2. Detect current tab URL
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url ?? '';
      if (/linkedin\.com\/in\//.test(url)) setPageType('profile');
      else if (/linkedin\.com\/jobs\/view\//.test(url)) setPageType('job');
      else setPageType('other');

      setBooting(false);
    }
    boot();
  }, []);

  async function handleDisconnect() {
    await clearToken();
    setUser(null);
  }

  if (booting) {
    return (
      <div style={{ ...s.wrapper, textAlign: 'center', padding: '32px 16px' }}>
        <span style={{ color: '#9ca3af', fontSize: '13px' }}>Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onConnected={setUser} />;
  }

  if (pageType === 'profile') {
    return <ProfileCard user={user} onDisconnect={handleDisconnect} />;
  }

  if (pageType === 'job') {
    return <JobCard user={user} onDisconnect={handleDisconnect} />;
  }

  return <GuideScreen user={user} onDisconnect={handleDisconnect} />;
}
