import { useCallback, useEffect, useState } from 'react';
import {
  UserPlus, Search, ToggleLeft, ToggleRight,
  Lock, X, Eye, EyeOff, Users, Mail, RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { formatIST, fmtINR, istDayStart, istDayEnd } from '../../utils/billingUtils';
import '../../Staff.css';

function CreateStaffModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('staff_users')
        .insert({ name: name.trim(), email: email.trim().toLowerCase(), password, role: 'staff' });
      if (err) throw new Error(err.message);
      toast.success(`Staff account created for ${name.trim()}`);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message.includes('duplicate') ? 'An account with this email already exists.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sf-overlay">
      <div className="sf-modal">
        <div className="sf-modal-header">
          <span className="sf-modal-title">Add Staff Member</span>
          <button className="sf-close-btn" onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="sf-modal-body">
            {error && <div className="sf-err-box">{error}</div>}
            <div className="sf-form-group">
              <label className="sf-form-lbl">Full Name</label>
              <input className="sf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Staff member's name" required />
            </div>
            <div className="sf-form-group">
              <label className="sf-form-lbl">Email Address</label>
              <div className="sf-input-wrap">
                <Mail className="sf-input-icon" />
                <input className="sf-input with-icon" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" required />
              </div>
            </div>
            <div className="sf-form-group">
              <label className="sf-form-lbl">Password</label>
              <div className="sf-input-wrap">
                <input
                  className="sf-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a password"
                  required
                  style={{ paddingRight: 36 }}
                />
                <button type="button" className="sf-input-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>
          </div>
          <div className="sf-modal-footer">
            <button type="button" className="sf-btn sf-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="sf-btn sf-btn-primary" disabled={loading}>
              <UserPlus style={{ width: 14, height: 14 }} />
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ staff, onClose }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('staff_users')
        .update({ password })
        .eq('id', staff.id);
      if (err) throw new Error(err.message);
      toast.success(`Password reset for ${staff.name}`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sf-overlay">
      <div className="sf-modal">
        <div className="sf-modal-header">
          <span className="sf-modal-title">Reset Password — {staff.name}</span>
          <button className="sf-close-btn" onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="sf-modal-body">
            {error && <div className="sf-err-box">{error}</div>}
            <div className="sf-form-group">
              <label className="sf-form-lbl">New Password</label>
              <div className="sf-input-wrap">
                <input
                  className="sf-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                  style={{ paddingRight: 36 }}
                />
                <button type="button" className="sf-input-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>
          </div>
          <div className="sf-modal-footer">
            <button type="button" className="sf-btn sf-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="sf-btn sf-btn-primary" disabled={loading}>
              <Lock style={{ width: 14, height: 14 }} />
              {loading ? 'Saving…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [staffStats, setStaffStats] = useState({});
  const [togglingId, setTogglingId] = useState(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: false });
    setStaff(data || []);

    const todayStart = istDayStart(0);
    const todayEnd = istDayEnd(0);
    const { data: todayOrders } = await supabase
      .from('billing_orders')
      .select('staff_id, grand_total')
      .eq('status', 'finalized')
      .gte('finalized_at', todayStart)
      .lte('finalized_at', todayEnd);

    const statsMap = {};
    for (const o of (todayOrders || [])) {
      if (!statsMap[o.staff_id]) statsMap[o.staff_id] = { count: 0, total: 0 };
      statsMap[o.staff_id].count++;
      statsMap[o.staff_id].total += Number(o.grand_total || 0);
    }
    setStaffStats(statsMap);
    setLoading(false);
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const toggleActive = async (member) => {
    if (togglingId) return;
    setTogglingId(member.id);
    const newVal = !member.is_active;
    // optimistic update
    setStaff(prev => prev.map(s => s.id === member.id ? { ...s, is_active: newVal } : s));
    const { error } = await supabase
      .from('staff_users')
      .update({ is_active: newVal })
      .eq('id', member.id);
    if (error) {
      // revert on failure
      setStaff(prev => prev.map(s => s.id === member.id ? { ...s, is_active: member.is_active } : s));
      toast.error(error.message);
    } else {
      toast.success(`${member.name} ${newVal ? 'activated' : 'deactivated'}`);
    }
    setTogglingId(null);
  };

  const filtered = staff.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  const activeCount = staff.filter((s) => s.is_active && s.role === 'staff').length;

  return (
    <div className="staff-root" style={{ background: 'transparent' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Staff Management</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>{activeCount} active staff member{activeCount !== 1 ? 's' : ''}</p>
        </div>
        <button className="sf-btn sf-btn-primary" onClick={() => setShowCreate(true)}>
          <UserPlus style={{ width: 15, height: 15 }} />
          Add Staff Member
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="sf-input-wrap" style={{ maxWidth: 360 }}>
          <Search className="sf-input-icon" />
          <input
            className="sf-input with-icon"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="sf-card">
        {loading ? (
          <div style={{ padding: '12px 0' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #F5F5F4' }}>
                <div className="adm-skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="adm-skeleton" style={{ width: 140, height: 15, marginBottom: 6 }} />
                  <div className="adm-skeleton" style={{ width: 180, height: 12 }} />
                </div>
                <div className="adm-skeleton" style={{ width: 70, height: 24, borderRadius: 20 }} />
                <div className="adm-skeleton" style={{ width: 60, height: 28, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="sf-empty">
            <Users />
            <div className="sf-empty-title">No staff members yet</div>
            <div className="sf-empty-desc">Click "Add Staff Member" to create the first account</div>
          </div>
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Today's Bills</th>
                  <th>Today's Sales</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => {
                  const st = staffStats[member.id] || {};
                  return (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: member.role === 'admin' ? '#7c3aed' : '#1d4ed8',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                          }}>
                            {(member.name || 'S').slice(0, 1).toUpperCase()}
                          </div>
                          {member.name}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{member.email}</td>
                      <td>
                        <span className={`sf-badge ${member.role === 'admin' ? 'finalized' : 'draft'}`}
                          style={{ background: member.role === 'admin' ? '#ede9fe' : '#dbeafe', color: member.role === 'admin' ? '#6d28d9' : '#1d4ed8' }}>
                          {member.role}
                        </span>
                      </td>
                      <td>{st.count || 0}</td>
                      <td>{st.total ? fmtINR(st.total) : '—'}</td>
                      <td>
                        <span className={`sf-badge ${member.is_active ? 'active' : 'inactive'}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{formatIST(member.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="sf-btn sf-btn-sm"
                            title={member.is_active ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleActive(member)}
                            disabled={togglingId === member.id}
                            style={{
                              background: member.is_active ? '#dcfce7' : '#fee2e2',
                              color: member.is_active ? '#16a34a' : '#dc2626',
                              border: `1px solid ${member.is_active ? '#86efac' : '#fca5a5'}`,
                              display: 'flex', alignItems: 'center', gap: 4,
                              opacity: togglingId === member.id ? 0.6 : 1,
                            }}
                          >
                            {togglingId === member.id
                              ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 0.8s linear infinite' }} />
                              : member.is_active
                                ? <ToggleRight style={{ width: 14, height: 14 }} />
                                : <ToggleLeft style={{ width: 14, height: 14 }} />}
                            {togglingId === member.id ? '' : member.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            className="sf-btn sf-btn-secondary sf-btn-sm"
                            title="Reset password"
                            onClick={() => setResetTarget(member)}
                          >
                            <Lock style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateStaffModal
          onClose={() => setShowCreate(false)}
          onCreated={loadStaff}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          staff={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
