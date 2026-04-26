import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:8081/api/v1';

async function fetchUsers() {
  const res = await fetch(`${API}/admin/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

async function deleteUser(userId) {
  const res = await fetch(`${API}/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
}

function StatCard({ label, value, sub, color = '#c6ff00' }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '28px',
      flex: 1,
    }}>
      <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>{label}</div>
      <div style={{ fontSize: '40px', fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{sub}</div>}
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (userId) => {
    if (!window.confirm(`Permanently revoke identity "${userId}"? This cannot be undone.`)) return;
    setDeleting(userId);
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.userId !== userId));
      setToast({ type: 'success', msg: `Identity "${userId}" revoked.` });
    } catch (e) {
      setToast({ type: 'error', msg: e.message });
    } finally {
      setDeleting(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filtered = users.filter(u =>
    u.userId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalFeatureBytes = users.reduce((acc, u) => acc + (u.featureBytes || 0), 0);

  return (
    <div style={{ padding: '48px 40px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
      
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '14px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '14px',
          background: toast.type === 'success' ? '#c6ff00' : '#ff4444',
          color: toast.type === 'success' ? '#000' : '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'fade-up 0.3s ease',
        }}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '9999px',
              background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)',
              fontSize: '12px', fontWeight: 600, color: '#c6ff00',
              fontFamily: 'var(--font-mono)', marginBottom: '16px', letterSpacing: '0.06em'
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c6ff00', boxShadow: '0 0 6px #c6ff00' }} />
              LIVE DATABASE
            </div>
            <h1 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-bright)', marginBottom: '8px' }}>
              Identity Registry
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              All enrolled biometric identities stored in MySQL · <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>palmauth.enrolled_users</code>
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: '12px 20px', borderRadius: '10px',
              background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>⟳</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Enrolled Identities" value={users.length} sub="Active biometric profiles" />
        <StatCard label="Feature Data Stored" value={totalFeatureBytes > 0 ? `${(totalFeatureBytes / 1024).toFixed(1)} KB` : '—'} sub="Compressed WPCA vectors" color="#00e5ff" />
        <StatCard label="Security Model" value="SHA-256" sub="BioHash + Fuzzy Vault" color="#a78bfa" />
        <StatCard label="Database" value="MySQL" sub="palmauth · port 3306" color="#f59e0b" />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
          background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
          color: '#ff6b6b', fontSize: '14px', fontFamily: 'var(--font-mono)',
        }}>
          ✗ {error} — Make sure the Java backend is running on port 8081.
        </div>
      )}

      {/* Table card */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', overflow: 'hidden',
      }}>
        {/* Table toolbar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-bright)' }}>
            {loading ? 'Loading...' : `${filtered.length} identit${filtered.length === 1 ? 'y' : 'ies'}`}
          </div>
          <input
            placeholder="Search by User ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '9px 16px', borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)', fontSize: '14px', outline: 'none', width: '220px',
            }}
          />
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto',
          padding: '12px 28px', gap: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px', fontWeight: 700, color: 'var(--text-faint)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <span>User ID</span>
          <span>BioHash (SHA-256)</span>
          <span>Feature Size</span>
          <span>Security</span>
          <span>Actions</span>
        </div>

        {/* Table rows */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
            <div>Fetching database records...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '14px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗃️</div>
            <div>{search ? 'No users match your search.' : 'No identities enrolled yet. Enroll your first user!'}</div>
          </div>
        ) : (
          filtered.map((user, i) => (
            <div key={user.userId} style={{
              display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto',
              padding: '18px 28px', gap: '16px', alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              transition: 'background 0.15s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* User ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `hsl(${user.userId.charCodeAt(0) * 37 % 360}, 60%, 50%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: '#fff',
                }}>
                  {user.userId.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '14px' }}>{user.userId}</span>
              </div>

              {/* BioHash */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ color: '#c6ff00' }}>{user.bioHash?.substring(0, 16)}</span>
                <span style={{ color: 'var(--text-faint)' }}>{user.bioHash?.substring(16, 32)}...</span>
              </div>

              {/* Feature size */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {user.featureBytes ? `${(user.featureBytes / 1024).toFixed(1)} KB` : '—'}
              </div>

              {/* Security badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '9999px',
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                fontSize: '11px', fontWeight: 600, color: '#a78bfa', width: 'fit-content',
              }}>
                🔒 BioHash
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(user.userId)}
                disabled={deleting === user.userId}
                style={{
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
                  color: '#ff6b6b', fontWeight: 600, fontSize: '12px',
                  cursor: deleting === user.userId ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  opacity: deleting === user.userId ? 0.5 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.08)'; }}
              >
                {deleting === user.userId ? '...' : 'Revoke'}
              </button>
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
