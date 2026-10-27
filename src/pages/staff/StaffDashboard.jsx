import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Package, TrendingUp, Receipt, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatIST, fmtINR, istDayStart, istDayEnd } from '../../utils/billingUtils';

export default function StaffDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ today: 0, todayTotal: 0, allTime: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const todayStart = istDayStart(0);
      const todayEnd = istDayEnd(0);

      const [todayRes, allRes, recentRes] = await Promise.all([
        supabase
          .from('billing_orders')
          .select('grand_total')
          .eq('staff_id', user.id)
          .eq('status', 'finalized')
          .gte('finalized_at', todayStart)
          .lte('finalized_at', todayEnd),
        supabase
          .from('billing_orders')
          .select('id', { count: 'exact', head: true })
          .eq('staff_id', user.id)
          .eq('status', 'finalized'),
        supabase
          .from('billing_orders')
          .select('id, bill_number, grand_total, status, created_at, finalized_at')
          .eq('staff_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const todayOrders = todayRes.data || [];
      const todayTotal = todayOrders.reduce((s, o) => s + Number(o.grand_total || 0), 0);

      setStats({
        today: todayOrders.length,
        todayTotal,
        allTime: allRes.count || 0,
      });
      setRecentOrders(recentRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const statusColor = (s) => {
    if (s === 'finalized') return '#15803d';
    if (s === 'cancelled') return '#dc2626';
    return '#64748b';
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
          Welcome back, {profile?.name || 'Staff'}!
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Here's your billing summary for today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="sf-stat-grid">
        <div className="sf-stat">
          <div className="sf-stat-icon blue"><TrendingUp /></div>
          <div>
            <div className="sf-stat-val">{loading ? '—' : stats.today}</div>
            <div className="sf-stat-lbl">Bills Today</div>
          </div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-icon green"><Receipt /></div>
          <div>
            <div className="sf-stat-val" style={{ fontSize: 18 }}>
              {loading ? '—' : fmtINR(stats.todayTotal)}
            </div>
            <div className="sf-stat-lbl">Today's Sales</div>
          </div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-icon purple"><ClipboardList /></div>
          <div>
            <div className="sf-stat-val">{loading ? '—' : stats.allTime}</div>
            <div className="sf-stat-lbl">Total Bills</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="sf-quick-actions" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/staff/new-bill" className="sf-btn sf-btn-primary sf-btn-lg">
          <Plus style={{ width: 18, height: 18 }} />
          New Bill
        </Link>
        <Link to="/staff/products" className="sf-btn sf-btn-secondary">
          <Package style={{ width: 15, height: 15 }} />
          Browse Products
        </Link>
        <Link to="/staff/orders" className="sf-btn sf-btn-secondary">
          <ClipboardList style={{ width: 15, height: 15 }} />
          My Orders
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="sf-card">
        <div className="sf-card-header">
          <span className="sf-card-title">Recent Orders</span>
          <Link to="/staff/orders" style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>
        ) : recentOrders.length === 0 ? (
          <div className="sf-empty">
            <Clock />
            <div className="sf-empty-title">No orders yet</div>
            <div className="sf-empty-desc">Create your first bill to get started.</div>
          </div>
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table sf-table-card">
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td data-label="Bill No." style={{ fontWeight: 700 }}>{o.bill_number}</td>
                    <td data-label="Date" style={{ color: '#64748b', fontSize: 12 }}>{formatIST(o.created_at)}</td>
                    <td data-label="Amount" style={{ fontWeight: 700 }}>{fmtINR(o.grand_total)}</td>
                    <td data-label="Status">
                      <span className={`sf-badge ${o.status}`}>
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/staff/orders/${o.id}`}
                        style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
