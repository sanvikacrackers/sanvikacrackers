import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../Staff.css';
import LOGO from '../assets/websitelogo.jpeg';

export default function StaffLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const staffUser = await signIn(email.trim(), password);

      if (staffUser.role === 'admin') {
        localStorage.setItem('sanvikacrackers_admin_logged_in', 'true');
        toast.success(`Welcome back, ${staffUser.name}!`);
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.success(`Welcome, ${staffUser.name}!`);
        navigate('/staff/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-root" style={{ minHeight: '100vh' }}>
      <div className="sf-login-root">
        <div className="sf-login-card">
          <div className="sf-login-logo">
            <img src={LOGO} alt="Sanvika Crackers" style={{ height: 64, width: 'auto', borderRadius: 10 }} />
          </div>
          <div className="sf-login-title">Staff Portal</div>
          <div className="sf-login-desc">Sign in with your staff credentials</div>

          {error && <div className="sf-err-box">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="sf-form-group">
              <label className="sf-form-lbl">Email Address</label>
              <div className="sf-input-wrap">
                <Mail className="sf-input-icon" />
                <input
                  className="sf-input with-icon"
                  type="email"
                  placeholder="staff@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="sf-form-group">
              <label className="sf-form-lbl">Password</label>
              <div className="sf-input-wrap">
                <Lock className="sf-input-icon" />
                <input
                  className="sf-input with-icon"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 36 }}
                />
                <button type="button" className="sf-input-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            <button
              className="sf-btn sf-btn-primary sf-btn-lg sf-btn-block"
              type="submit"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              <Zap style={{ width: 16, height: 16 }} />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
            Admin?{' '}
            <Link to="/admin/login" style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>
              Go to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
