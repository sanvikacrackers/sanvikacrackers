import { useAuth } from '../../context/AuthContext';
import { formatIST } from '../../utils/billingUtils';
import { User } from 'lucide-react';

export default function StaffProfile() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 24 }}>My Profile</h1>

      <div className="sf-card" style={{ maxWidth: 480 }}>
        <div className="sf-card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#1d4ed8', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800,
            }}>
              {(profile.name || 'S').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{profile.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{profile.email}</div>
              <span className={`sf-badge ${profile.is_active ? 'active' : 'inactive'}`} style={{ marginTop: 4 }}>
                {profile.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 2 }}>Role</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {profile.role === 'admin' ? 'Administrator' : 'Staff'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 2 }}>Member Since</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{formatIST(profile.created_at)}</div>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: '10px 14px', background: '#f1f5f9', borderRadius: 8, fontSize: 13, color: '#64748b' }}>
            To update your password or account details, please contact the administrator.
          </div>
        </div>
      </div>
    </div>
  );
}
