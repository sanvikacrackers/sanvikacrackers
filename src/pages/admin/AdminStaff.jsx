import { useCallback, useEffect, useState } from 'react';
import {
  UserPlus, Search,
  Lock, X, Eye, EyeOff, Users, Mail, ChevronRight, TrendingUp, Receipt, BarChart2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { formatIST, fmtINR, istDayStart, istDayEnd } from '../../utils/billingUtils';
import { CustomSelect } from '../Admin';
import '../../Staff.css';

const STAFF_START_YEAR = 2025;
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// 6 pale avatar background hues + matching darker text colors
const AVATAR_HUES = [
  { bg: '#fef2f2', text: '#991b1b' },
  { bg: '#f0f9ff', text: '#075985' },
  { bg: '#f0fdf4', text: '#166534' },
  { bg: '#fefce8', text: '#854d0e' },
  { bg: '#f5f3ff', text: '#5b21b6' },
  { bg: '#fff7ed', text: '#9a3412' },
];

function getAvatarColors(name) {
  const str = name || 'S';
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
  return AVATAR_HUES[sum % 6];
}

function formatJoinDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const day = d.getDate();
  const mon = MONTH_NAMES[d.getMonth()];
  const yr = d.getFullYear();
  return `${day} ${mon} ${yr}`;
}

function getYearOpts(maxYear) {
  const top = Math.max(maxYear, new Date().getFullYear());
  const opts = [];
  for (let y = top; y >= STAFF_START_YEAR; y--) opts.push({ value: String(y), label: String(y) });
  return opts;
}

// ── Inline styles ──────────────────────────────────────────────────────────

const S = {
  // Page
  page: {
    fontFamily: 'system-ui, "Inter", -apple-system, sans-serif',
    background: 'transparent',
  },

  // Header
  pageHeader: {
    marginBottom: 20,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111111',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    color: '#6b6b6b',
    fontSize: 13,
    margin: '3px 0 0',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 14px',
    height: 32,
    background: '#1d1f20',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },

  // Search
  searchWrap: {
    position: 'relative',
    maxWidth: 360,
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 14,
    height: 14,
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: 36,
    padding: '0 12px 0 32px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 13,
    color: '#111111',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  },

  // Staff card
  card: {
    background: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    padding: 18,
    position: 'relative',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  cardTopLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    flex: 1,
  },
  avatar: (colors) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: colors.bg,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
    flexShrink: 0,
  }),
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111111',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardEmail: {
    fontSize: 12,
    color: '#6b6b6b',
    marginTop: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badgeRow: {
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap',
  },
  pillActive: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 600,
    background: '#dcfae5',
    color: '#14532d',
  },
  pillInactive: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 600,
    background: '#f3f4f6',
    color: '#374151',
  },
  pillRole: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 600,
    background: '#f3f4f6',
    color: '#374151',
  },
  statsLine: {
    fontSize: 12,
    color: '#6b6b6b',
    margin: '10px 0',
  },
  joinedText: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 12,
  },
  cardDivider: {
    borderTop: '1px solid #e8e8e8',
    marginBottom: 12,
  },
  cardBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resetBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },

  // Empty state
  emptyCard: {
    background: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    padding: '60px 20px',
    textAlign: 'center',
    color: '#6b6b6b',
  },
  emptyIcon: {
    width: 40,
    height: 40,
    color: '#d1d5db',
    margin: '0 auto 12px',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111111',
    marginBottom: 4,
  },

  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    background: '#fff',
    borderRadius: 10,
    width: '100%',
    maxWidth: 460,
    border: '1px solid #e8e8e8',
  },
  modalHeader: {
    padding: '18px 20px 14px',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111111',
  },
  modalBody: {
    padding: '18px 20px',
  },
  modalFooter: {
    padding: '14px 20px 18px',
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 5,
  },
  formInput: {
    width: '100%',
    height: 36,
    padding: '0 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 13,
    color: '#111111',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  },
  formInputWithIcon: {
    width: '100%',
    height: 36,
    padding: '0 12px 0 32px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 13,
    color: '#111111',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  },
  formInputPwWrap: {
    position: 'relative',
  },
  formInputIconLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 14,
    height: 14,
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  formInputEyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: 0,
    display: 'flex',
  },
  errBox: {
    background: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: 7,
    padding: '9px 12px',
    fontSize: 12,
    marginBottom: 14,
  },
  cancelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '0 14px',
    height: 32,
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 14px',
    height: 32,
    background: '#1d1f20',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b6b6b',
    padding: 4,
    borderRadius: 6,
    display: 'flex',
  },
};

// ── Detail Panel ────────────────────────────────────────────────────────────

function StaffDetailPanel({ member, onClose }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selYear, setSelYear] = useState(String(new Date().getFullYear()));
  const [maxYear, setMaxYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    supabase
      .from('billing_orders')
      .select('grand_total, finalized_at, status')
      .eq('staff_id', member.id)
      .eq('status', 'finalized')
      .then(({ data }) => {
        const rows = data || [];
        setOrders(rows);
        if (rows.length > 0) {
          const max = Math.max(...rows.map(o => new Date(o.finalized_at).getFullYear()));
          setMaxYear(max);
        }
        setLoading(false);
      });
  }, [member.id]);

  // Year-wise stats
  const yearMap = {};
  for (const o of orders) {
    const y = new Date(o.finalized_at).getFullYear();
    if (!yearMap[y]) yearMap[y] = { count: 0, total: 0 };
    yearMap[y].count++;
    yearMap[y].total += Number(o.grand_total || 0);
  }
  const yearStats = Object.entries(yearMap)
    .map(([year, v]) => ({ year: Number(year), ...v }))
    .sort((a, b) => b.year - a.year);

  // Monthly stats for selected year
  const monthStats = MONTH_NAMES.map((m, idx) => {
    const mo = orders.filter(o => {
      const d = new Date(o.finalized_at);
      return d.getFullYear() === Number(selYear) && d.getMonth() === idx;
    });
    return { month: m, count: mo.length, total: mo.reduce((s, o) => s + Number(o.grand_total || 0), 0) };
  });
  const maxMonthTotal = Math.max(...monthStats.map(m => m.total), 1);

  const totalOrders  = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.grand_total || 0), 0);
  const avgBill      = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const avatarColors = getAvatarColors(member.name);

  // Y-axis labels for bar chart
  const yLabels = [
    fmtINR(maxMonthTotal),
    fmtINR(maxMonthTotal * 0.66),
    fmtINR(maxMonthTotal * 0.33),
    '0',
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', fontFamily: 'system-ui, "Inter", -apple-system, sans-serif' }}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />

      {/* Panel */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: '#f9fafb',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.22s ease',
      }}>
        {/* Panel header */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: avatarColors.bg, color: avatarColors.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 700, flexShrink: 0,
            }}>
              {(member.name || 'S').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111111' }}>{member.name}</div>
              <div style={{ fontSize: 12, color: '#6b6b6b' }}>{member.email}</div>
              <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                <span style={S.pillRole}>{member.role}</span>
                <span style={member.is_active ? S.pillActive : S.pillInactive}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Joined */}
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            Joined {formatJoinDate(member.created_at)}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Loading stats…</div>
          ) : (
            <>
              {/* KPI strip — 3 sections, no icon circles */}
              <div style={{
                background: '#fff',
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                display: 'flex',
              }}>
                {[
                  { label: 'Total bills', value: totalOrders },
                  { label: 'Total revenue', value: fmtINR(totalRevenue) },
                  { label: 'Avg bill', value: fmtINR(avgBill) },
                ].map((kpi, i, arr) => (
                  <div key={kpi.label} style={{
                    flex: 1,
                    padding: '14px 12px',
                    borderRight: i < arr.length - 1 ? '1px solid #e8e8e8' : 'none',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{kpi.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#111111', lineHeight: 1 }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Year-wise table */}
              {yearStats.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #e8e8e8' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b' }}>Year-wise summary</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 500, color: '#9ca3af', fontSize: 11 }}>Year</th>
                        <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 500, color: '#9ca3af', fontSize: 11 }}>Bills</th>
                        <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 500, color: '#9ca3af', fontSize: 11 }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearStats.map((y, i) => (
                        <tr
                          key={y.year}
                          style={{
                            borderBottom: i < yearStats.length - 1 ? '1px solid #e8e8e8' : 'none',
                            cursor: 'pointer',
                            background: String(y.year) === selYear ? '#fafafa' : '#fff',
                          }}
                          onClick={() => setSelYear(String(y.year))}
                        >
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111111' }}>{y.year}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#374151' }}>{y.count}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#111111' }}>{fmtINR(y.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Monthly breakdown */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b' }}>Monthly breakdown</span>
                  <CustomSelect
                    value={selYear}
                    onChange={setSelYear}
                    options={getYearOpts(maxYear)}
                    minWidth={80}
                  />
                </div>

                {/* SVG bar chart */}
                <div style={{ display: 'flex', gap: 3, height: 100, alignItems: 'flex-end', marginBottom: 4 }}>
                  {monthStats.map((m) => {
                    const pct = maxMonthTotal > 0 ? (m.total / maxMonthTotal) * 100 : 0;
                    const barH = m.count > 0 ? Math.max(pct, 6) : 3;
                    return (
                      <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        {m.count > 0 && (
                          <div style={{ fontSize: 9, fontWeight: 600, color: '#6b6b6b' }}>{m.count}</div>
                        )}
                        <div style={{
                          width: '100%',
                          borderRadius: '4px 4px 0 0',
                          background: m.count === 0 ? '#e8e8e8' : '#7f1d1d',
                          height: `${barH}%`,
                          minHeight: m.count > 0 ? 6 : 2,
                          transition: 'height 0.3s',
                        }} />
                        <div style={{ fontSize: 8, fontWeight: 500, color: '#9ca3af', marginTop: 2 }}>{m.month}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Month detail rows */}
                {monthStats.filter(m => m.count > 0).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '10px 0', color: '#9ca3af', fontSize: 12 }}>
                    No bills in {selYear}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #e8e8e8' }}>
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Month</span>
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Bills</span>
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Revenue</span>
                    </div>
                    {monthStats.filter(m => m.count > 0).map((m, i, arr) => (
                      <div key={m.month} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 8px',
                        borderBottom: i < arr.length - 1 ? '1px solid #e8e8e8' : 'none',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', width: 36 }}>{m.month}</span>
                        <span style={{ fontSize: 12, color: '#6b6b6b', textAlign: 'right' }}>{m.count}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#111111', textAlign: 'right' }}>{fmtINR(m.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create Staff Modal ──────────────────────────────────────────────────────

function CreateStaffModal({ onClose, onCreated }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Add staff member</span>
          <button style={S.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={S.modalBody}>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.formGroup}>
              <label style={S.formLabel}>Full name</label>
              <input
                style={S.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Staff member's name"
                required
              />
            </div>
            <div style={S.formGroup}>
              <label style={S.formLabel}>Email address</label>
              <div style={S.formInputPwWrap}>
                <Mail style={S.formInputIconLeft} />
                <input
                  style={S.formInputWithIcon}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@example.com"
                  required
                />
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.formLabel}>Password</label>
              <div style={S.formInputPwWrap}>
                <input
                  style={{ ...S.formInput, paddingRight: 36 }}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a password"
                  required
                />
                <button type="button" style={S.formInputEyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div style={S.modalFooter}>
            <button type="button" style={S.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" style={{ ...S.submitBtn, opacity: loading ? 0.55 : 1 }} disabled={loading}>
              <UserPlus size={13} />
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reset Password Modal ────────────────────────────────────────────────────

function ResetPasswordModal({ staff, onClose }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Reset password — {staff.name}</span>
          <button style={S.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={S.modalBody}>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.formGroup}>
              <label style={S.formLabel}>New password</label>
              <div style={S.formInputPwWrap}>
                <input
                  style={{ ...S.formInput, paddingRight: 36 }}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                />
                <button type="button" style={S.formInputEyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div style={S.modalFooter}>
            <button type="button" style={S.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" style={{ ...S.submitBtn, opacity: loading ? 0.55 : 1 }} disabled={loading}>
              <Lock size={13} />
              {loading ? 'Saving…' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, disabled, onChange }) {
  return (
    <label
      style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, flexShrink: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
      />
      <span style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 22,
        background: checked ? '#16a34a' : '#d1d5db',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        opacity: disabled ? 0.55 : 1,
      }}>
        <span style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }} />
      </span>
    </label>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminStaff() {
  const [staff, setStaff]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [staffStats, setStaffStats]   = useState({});
  const [togglingId, setTogglingId]   = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: false });
    setStaff(data || []);

    const todayStart = istDayStart(0);
    const todayEnd   = istDayEnd(0);
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
    setStaff(prev => prev.map(s => s.id === member.id ? { ...s, is_active: newVal } : s));
    const { error } = await supabase
      .from('staff_users')
      .update({ is_active: newVal })
      .eq('id', member.id);
    if (error) {
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

  const activeCount = staff.filter((s) => s.is_active).length;

  return (
    <div style={S.page}>
      {/* Page header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Staff</h1>
          <p style={S.subtitle}>{activeCount} active member{activeCount !== 1 ? 's' : ''}</p>
        </div>
        <button style={S.addBtn} onClick={() => setShowCreate(true)}>
          <UserPlus size={14} />
          Add member
        </button>
      </div>

      {/* Search */}
      <div style={S.searchWrap}>
        <Search style={S.searchIcon} />
        <input
          style={S.searchInput}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Card grid */}
      {loading ? (
        <div style={S.grid}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ ...S.card, cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="adm-skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <div className="adm-skeleton" style={{ width: 110, height: 14, marginBottom: 5 }} />
                  <div className="adm-skeleton" style={{ width: 150, height: 11 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <div className="adm-skeleton" style={{ width: 46, height: 20, borderRadius: 9999 }} />
                <div className="adm-skeleton" style={{ width: 58, height: 20, borderRadius: 9999 }} />
              </div>
              <div className="adm-skeleton" style={{ width: '70%', height: 11, marginBottom: 10 }} />
              <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <div className="adm-skeleton" style={{ width: 40, height: 22, borderRadius: 20 }} />
                <div className="adm-skeleton" style={{ width: 100, height: 28, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={S.emptyCard}>
          <Users style={S.emptyIcon} />
          <div style={S.emptyTitle}>No staff members yet</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Click "Add member" to create the first account</div>
        </div>
      ) : (
        <div style={S.grid}>
          {filtered.map((member) => {
            const st = staffStats[member.id] || {};
            const colors = getAvatarColors(member.name);
            return (
              <div
                key={member.id}
                style={S.card}
                onClick={() => setSelectedStaff(member)}
              >
                {/* Top row: avatar + name/email | badges */}
                <div style={S.cardTop}>
                  <div style={S.cardTopLeft}>
                    <div style={S.avatar(colors)}>
                      {(member.name || 'S').slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={S.cardName}>{member.name}</div>
                      <div style={S.cardEmail}>{member.email}</div>
                    </div>
                  </div>
                  <div style={{ ...S.badgeRow, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={S.pillRole}>{member.role}</span>
                    <span style={{ ...(member.is_active ? S.pillActive : S.pillInactive), marginTop: 4 }}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Stats line */}
                <div style={S.statsLine}>
                  {st.count || 0} bills today · {st.total ? fmtINR(st.total) : '₹0'} sales
                </div>

                {/* Joined */}
                <div style={S.joinedText}>Joined {formatJoinDate(member.created_at)}</div>

                {/* Divider + actions */}
                <div style={S.cardDivider} />
                <div style={S.cardBottom}>
                  <Toggle
                    checked={member.is_active}
                    disabled={togglingId === member.id}
                    onChange={() => toggleActive(member)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      style={S.resetBtn}
                      title="Reset password"
                      onClick={(e) => { e.stopPropagation(); setResetTarget(member); }}
                    >
                      <Lock size={12} />
                      Reset password
                    </button>
                    <ChevronRight size={15} color="#d1d5db" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {selectedStaff && (
        <StaffDetailPanel
          member={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
}
