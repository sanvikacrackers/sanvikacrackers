import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { downloadAdminOrderPDF } from '../utils/generateOrderPDF';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import {
  Package, Tag, LogOut, Menu, X,
  Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  Eye, EyeOff, Zap, Sun, Star, Flame,
  Sparkles, Box, Gift, Layers, Shield, TrendingUp, Users,
  CheckCircle, Clock, XCircle, ArrowUpRight, RefreshCw, Save, Lock, Mail, ChevronDown, Check, Megaphone, Bell, Image, Upload, Settings, ShoppingCart, Download, GripVertical
} from 'lucide-react';
import '../Admin.css';
import LOGO from '../assets/websitelogo.jpeg';

/* ── Supabase ─────────────────────────────────────── */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zjjlqewqzhnyfhjqsbwu.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqamxxZXdxemhueWZoanFzYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjAyMzUsImV4cCI6MjEwNzAzNjIzNX0.O99oZizlKObPXHyRkTgDBzw5ZDhHEGhK8h7K8hy2q3Y';
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
export const parseSupabaseError = (rawText) => {
  if (!rawText) return 'An unexpected error occurred.';
  try {
    const json = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
    const msg = json.message || json.details || (typeof rawText === 'string' ? rawText : JSON.stringify(rawText));
    if (typeof msg === 'string') {
      if (msg.includes('null value in column "price"')) return 'Selling Price (₹) is required.';
      if (msg.includes('null value in column "name"')) return 'Product Name is required.';
      if (msg.includes('null value in column "category"')) return 'Category is required.';
      if (msg.includes('null value in column "product_code"')) return 'Product Code is required.';
      if (msg.includes('duplicate key value violates unique constraint')) return 'A product with this information already exists.';
      return msg;
    }
    return String(msg);
  } catch (e) {
    return String(rawText);
  }
};

export const api = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers, ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseSupabaseError(text));
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

/* ── Helpers ──────────────────────────────────────── */
export const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ── Cloudinary Image Deletion ────────────────────── */
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const afterUpload = parts[1];
    const pathSegments = afterUpload.split('/');
    if (pathSegments[0].startsWith('v') && !isNaN(pathSegments[0].slice(1))) {
      pathSegments.shift();
    }
    const fullPathWithExt = pathSegments.join('/');
    const lastDotIdx = fullPathWithExt.lastIndexOf('.');
    return lastDotIdx !== -1 ? fullPathWithExt.slice(0, lastDotIdx) : fullPathWithExt;
  } catch (e) {
    return null;
  }
}

export async function generateCloudinarySignature(paramsToSign, apiSecret) {
  const sortedKeys = Object.keys(paramsToSign).sort();
  const serialized = sortedKeys.map(k => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
  const msgBuffer = new TextEncoder().encode(serialized);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deleteFromCloudinary(url) {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'rnfcnawt';
  const apiKey    = import.meta.env.VITE_CLOUDINARY_API_KEY    || '974363973262235';
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || '_1xEeHWrEPFQeGcuzTKJUAMnozY';

  if (!cloudName || !apiKey || !apiSecret) return false;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateCloudinarySignature({ public_id: publicId, timestamp }, apiSecret);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log('Cloudinary Destroy Result:', data);
    return data.result === 'ok';
  } catch (err) {
    console.warn('Cloudinary delete notice:', err);
    return false;
  }
}

export async function uploadToCloudinarySigned(file) {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME  || 'rnfcnawt';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (data.secure_url) {
    return data.secure_url;
  }
  throw new Error(data.error?.message || 'Cloudinary upload failed');
}

export const STATUS_CONFIG = {
  'Payment Pending':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  'Payment Confirmed': { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: CheckCircle },
  'Shipped':           { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: RefreshCw },
  'Delivered':         { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  icon: CheckCircle },
};

/* ── Custom Select Component ─────────────────────── */
export function CustomSelect({ value, options, onChange, placeholder = 'Select option', style = {}, minWidth }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 230;
      setDropPos({
        left: rect.left,
        width: Math.max(rect.width, 180),
        top: openUp ? rect.top - 6 : rect.bottom + 6,
        openUp,
      });
    }
    setOpen(o => !o);
  };

  const selectedOption = options.find(o => typeof o === 'object' ? String(o.value) === String(value) : String(o) === String(value));
  const selectedLabel = selectedOption ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : value || placeholder;

  const dropStyle = {
    position: 'fixed',
    zIndex: 9999,
    left: dropPos.left,
    width: dropPos.width,
    ...(dropPos.openUp
      ? { bottom: window.innerHeight - dropPos.top, top: 'auto' }
      : { top: dropPos.top }),
  };

  return (
    <div ref={ref} className="adm-custom-select-wrap" style={{ position: 'relative', width: '100%', minWidth, ...style }}>
      <button
        type="button"
        className={`adm-custom-select-trigger ${open ? 'active' : ''}`}
        onClick={handleOpen}
      >
        <span className="adm-select-val">{selectedLabel}</span>
        <ChevronDown className={`adm-select-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="adm-custom-select-dropdown" style={dropStyle}>
          <div className="adm-custom-select-list">
            {options.map((opt, idx) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              const isSelected = String(val) === String(value);
              return (
                <div
                  key={idx}
                  className={`adm-custom-select-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => { onChange(val); setOpen(false); }}
                >
                  <span>{lbl}</span>
                  {isSelected && <Check style={{ width: 14, height: 14, color: '#ff6b35' }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const getCategoryIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('sparkler') || n.includes('star')) return Sparkles;
  if (n.includes('pot') || n.includes('fountain')) return Sun;
  if (n.includes('bomb') || n.includes('sound')) return Zap;
  if (n.includes('chakkar') || n.includes('wheel') || n.includes('chakkara')) return RefreshCw;
  if (n.includes('gift') || n.includes('combo')) return Gift;
  if (n.includes('sky') || n.includes('rocket')) return ArrowUpRight;
  if (n.includes('kids') || n.includes('children')) return Shield;
  if (n.includes('fancy')) return Flame;
  return Layers;
};

/* ── Admin Data Context ───────────────────────────── */
export const AdminCtx = createContext(null);
export const useAdmin = () => useContext(AdminCtx);


export function CategoriesSkeleton() {
  return (
    <>
      <div style={{marginBottom:24}}>
        <div className="adm-skeleton" style={{width:120,height:24,marginBottom:8}} />
        <div className="adm-skeleton" style={{width:200,height:14}} />
      </div>
      <div className="adm-skeleton" style={{width:150,height:14,marginBottom:20}} />
      <div className="cats-grid">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="cat-card" style={{pointerEvents:'none'}}>
            <div className="adm-skeleton" style={{width:48,height:48,borderRadius:12,marginBottom:14}} />
            <div className="adm-skeleton" style={{width:120,height:16,marginBottom:8}} />
            <div className="adm-skeleton" style={{width:140,height:12}} />
          </div>
        ))}
      </div>
    </>
  );
}

export function ProductsSkeleton() {
  const isMobile = window.innerWidth < 768;
  return (
    <div className="adm-page-container">
      <div className="adm-page-header">
        <div style={{marginBottom:16}}>
          <div className="adm-skeleton" style={{width:120,height:22,marginBottom:6,borderRadius:4}} />
          <div className="adm-skeleton" style={{width:160,height:13,borderRadius:4}} />
        </div>

        <div className="adm-search-bar">
          <div className="adm-skeleton" style={{flex:1,height:44,borderRadius:10}} />
          {!isMobile && <div className="adm-skeleton" style={{width:220,height:44,borderRadius:10}} />}
          <div className="adm-skeleton" style={{width: isMobile ? 100 : 135,height:44,borderRadius:9}} />
        </div>

        <div style={{marginBottom:12}}>
          <div className="adm-skeleton" style={{width:180,height:13,borderRadius:4}} />
        </div>
      </div>

      {/* Desktop table skeleton */}
      {!isMobile && (
        <div className="adm-card adm-scroll-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th><th>Product</th><th>Category</th><th>MRP</th>
                  <th>Discount</th><th>Price</th><th>Unit</th><th>Status</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <tr key={i}>
                    <td><div className="adm-skeleton" style={{width:16,height:12,borderRadius:3}} /></td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div className="adm-skeleton" style={{width:44,height:44,borderRadius:8,flexShrink:0}} />
                        <div>
                          <div className="adm-skeleton" style={{width:140+(i%3)*25,height:14,marginBottom:6,borderRadius:4}} />
                          <div className="adm-skeleton" style={{width:85,height:11,borderRadius:3}} />
                        </div>
                      </div>
                    </td>
                    <td><div className="adm-skeleton" style={{width:110,height:13,borderRadius:4}} /></td>
                    <td><div className="adm-skeleton" style={{width:50,height:13,borderRadius:4}} /></td>
                    <td><div className="adm-skeleton" style={{width:40,height:13,borderRadius:4}} /></td>
                    <td><div className="adm-skeleton" style={{width:55,height:13,borderRadius:4}} /></td>
                    <td><div className="adm-skeleton" style={{width:45,height:12,borderRadius:3}} /></td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="adm-skeleton" style={{width:38,height:22,borderRadius:12,flexShrink:0}} />
                        <div className="adm-skeleton" style={{width:40,height:12,borderRadius:3}} />
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                        <div className="adm-skeleton" style={{width:30,height:30,borderRadius:8}} />
                        <div className="adm-skeleton" style={{width:30,height:30,borderRadius:8}} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile card skeletons */}
      {isMobile && (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{background:'#fff',borderRadius:14,border:'1px solid #e8edf2',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',overflow:'hidden'}}>
              {/* Top row */}
              <div style={{display:'flex',gap:12,padding:'12px 12px 10px',alignItems:'flex-start'}}>
                <div className="adm-skeleton" style={{width:58,height:58,borderRadius:10,flexShrink:0}} />
                <div style={{flex:1,minWidth:0}}>
                  <div className="adm-skeleton" style={{width:'80%',height:14,borderRadius:4,marginBottom:6}} />
                  <div className="adm-skeleton" style={{width:60,height:10,borderRadius:3,marginBottom:8}} />
                  <div className="adm-skeleton" style={{width:90,height:18,borderRadius:6}} />
                </div>
                <div className="adm-skeleton" style={{width:38,height:22,borderRadius:12,flexShrink:0}} />
              </div>
              {/* Price strip */}
              <div style={{display:'flex',gap:8,padding:'8px 12px',background:'#fafbfc',borderTop:'1px solid #f1f5f9',borderBottom:'1px solid #f1f5f9'}}>
                {[50,40,55,45].map((w,j) => (
                  <div key={j} style={{flex:1}}>
                    <div className="adm-skeleton" style={{width:'60%',height:9,borderRadius:3,marginBottom:5}} />
                    <div className="adm-skeleton" style={{width:`${w}%`,height:13,borderRadius:4}} />
                  </div>
                ))}
              </div>
              {/* Actions row */}
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,padding:'8px 12px'}}>
                <div className="adm-skeleton" style={{width:64,height:30,borderRadius:8}} />
                <div className="adm-skeleton" style={{width:64,height:30,borderRadius:8}} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════════
   LOGIN PAGE  →  /admin/login
══════════════════════════════════════════════════ */
export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('sriveerafireworks_admin_logged_in') === 'true') navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    if (email.trim() === 'veerafireworks2020@gmail.com' && password.trim() === 'Sriveera$77') {
      localStorage.setItem('sriveerafireworks_admin_logged_in', 'true');
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="adm">
      <div className="login-root">
        <div className="login-glow" />
        <div className="login-card">
          <div className="login-logo">
            <img src={LOGO} alt="Sri Veera Fireworks" style={{height:72,width:'auto',objectFit:'contain',borderRadius:10,marginBottom:6}} />
          </div>
          <div className="login-title">Admin Sign In</div>
          <div className="login-desc">Enter your credentials to access the dashboard</div>
          {error && <div className="adm-err-box">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="adm-form-group">
              <label className="adm-form-lbl">Email Address</label>
              <div className="adm-inp-wrap">
                <Mail className="adm-inp-icon" />
                <input className="adm-form-input" type="email" placeholder="admin@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="adm-form-group">
              <label className="adm-form-lbl">Password</label>
              <div className="adm-inp-wrap">
                <Lock className="adm-inp-icon" />
                <input className="adm-form-input" type={showPw?'text':'password'} placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} required />
                <button type="button" className="adm-inp-eye" onClick={()=>setShowPw(!showPw)}>
                  {showPw ? <EyeOff style={{width:16,height:16}} /> : <Eye style={{width:16,height:16}} />}
                </button>
              </div>
            </div>
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SHARED LAYOUT  →  /admin/*
   Provides sidebar + header + data context
══════════════════════════════════════════════════ */
const DEFAULT_CATEGORIES_DATA = [
  { id: 'cat-1', name: 'Single Sound Crackers', image_url: '', description: 'Loud single sound crackers & Lakshmi crackers' },
  { id: 'cat-2', name: 'Chakkars', image_url: '', description: 'Ground spinning chakkars and wheels' },
  { id: 'cat-3', name: 'Flower Pots & Fountains', image_url: '', description: 'Sparkling colorful fountains & flower pots' },
  { id: 'cat-4', name: 'Sparklers', image_url: '', description: 'Handheld electric and colorful sparklers' },
  { id: 'cat-5', name: 'Rockets & Sky Shots', image_url: '', description: 'High aerial sky shots and rockets' },
  { id: 'cat-6', name: 'Fancy Novelties', image_url: '', description: 'Special light, sound and color novelties' },
  { id: 'cat-7', name: 'Kids Special', image_url: '', description: 'Safe & fun soundless crackers for children' },
  { id: 'cat-8', name: 'Gift Boxes & Combos', image_url: '', description: 'Assorted Diwali crackers gift boxes' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const isLoggedIn = localStorage.getItem('sriveerafireworks_admin_logged_in') === 'true';

  const [categoryData, setCategoryData] = useState(() => {
    try {
      const saved = localStorage.getItem('sriveerafireworks_admin_categories_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter(c => {
          const name = typeof c === 'object' ? c?.name : String(c);
          return name && !name.startsWith('__');
        });
      }
    } catch (e) {}
    return DEFAULT_CATEGORIES_DATA;
  });
  const [loading, setLoading] = useState(false);

  // Auth guard — moved to useEffect to avoid hooks-after-return violation
  useEffect(() => {
    if (!isLoggedIn) navigate('/admin/login', { replace: true });
  }, [isLoggedIn, navigate]);

  const fetchAll = useCallback(async () => {
    if (products.length === 0) {
      setLoading(true);
    }
    try {
      const [prods] = await Promise.all([
        api('/products?order=product_code.asc'),
      ]);
      const ps = (prods || [])
        .filter(p => !p.category || !p.category.startsWith('__'))
        .sort((a, b) => (parseInt(a.product_code, 10) || 0) - (parseInt(b.product_code, 10) || 0));
      setProducts(ps);

      // Merge any category names found in DB products into categoryData
      const dbCatNames = [...new Set(ps.map(p => p.category).filter(n => n && !n.startsWith('__')))];
      setCategoryData(prev => {
        const existingNames = new Set(prev.map(c => c.name));
        const missing = dbCatNames.filter(n => !existingNames.has(n)).map((name, idx) => ({
          id: 'cat-db-' + idx + '-' + Date.now(),
          name,
          image_url: '',
          description: ''
        }));
        if (missing.length > 0) {
          const updated = [...prev, ...missing];
          try { localStorage.setItem('sriveerafireworks_admin_categories_v3', JSON.stringify(updated)); } catch (e) {}
          return updated;
        }
        return prev;
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [products.length]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCategory = async (catObj) => {
    let nextList = [...categoryData];
    const isEdit = !!catObj.id;

    if (isEdit) {
      nextList = nextList.map(c => c.id === catObj.id ? { ...c, ...catObj } : c);
      if (catObj.oldName && catObj.oldName !== catObj.name) {
        try {
          await api(`/products?category=eq.${encodeURIComponent(catObj.oldName)}`, {
            method: 'PATCH',
            body: JSON.stringify({ category: catObj.name })
          });
          await fetchAll();
        } catch (e) {
          console.error('Failed to update product categories:', e);
        }
      }
    } else {
      const newCat = {
        id: 'cat-' + Date.now(),
        name: catObj.name,
        image_url: catObj.image_url || '',
        description: catObj.description || '',
      };
      nextList.push(newCat);
    }

    setCategoryData(nextList);
    try {
      localStorage.setItem('sriveerafireworks_admin_categories_v3', JSON.stringify(nextList));
    } catch (e) {}
  };

  const deleteCategory = async (catObj) => {
    if (catObj.image_url) {
      deleteFromCloudinary(catObj.image_url);
    }
    const nextList = categoryData.filter(c => c.id !== catObj.id && c.name !== catObj.name);
    setCategoryData(nextList);
    try {
      localStorage.setItem('sriveerafireworks_admin_categories_v3', JSON.stringify(nextList));
    } catch (e) {}
  };

  if (!isLoggedIn) return null;

  const categories = categoryData.map(c => c.name);

  const handleLogout = () => {
    localStorage.removeItem('sriveerafireworks_admin_logged_in');
    navigate('/admin/login', { replace: true });
  };

  const navItems = [
    { to: '/admin/dashboard',    label: 'Dashboard',         icon: TrendingUp },
    { to: '/admin/orders',       label: 'Orders',            icon: ShoppingCart },
    { to: '/admin/categories',   label: 'Categories',        icon: Tag,             badge: categoryData.length || null },
    { to: '/admin/products',     label: 'Products',          icon: Package,         badge: products.length || null },
    { to: '/admin/banners',      label: 'Hero Banners',      icon: Image },
    { to: '/admin/announcement', label: 'Important Message', icon: Megaphone },
    { to: '/admin/settings',     label: 'Settings',          icon: Settings },
  ];

  return (
    <AdminCtx.Provider value={{ products, setProducts, categories, categoryData, saveCategory, deleteCategory, loading, fetchAll }}>
      <div className="adm">
        <div className="adm-layout">
          {sidebarOpen && <div className="sb-ov" onClick={()=>setSidebarOpen(false)} />}

          {/* Sidebar */}
          <aside className={`adm-sidebar${sidebarOpen ? ' sb-open' : ''}`}>
            <div className="sb-logo">
              <img src={LOGO} alt="Sri Veera Fireworks" style={{height:40,width:'auto',objectFit:'contain',borderRadius:8,flexShrink:0}} />
              <div><div className="sb-brand">Sri Veera Fireworks</div><div className="sb-sub">Admin Panel</div></div>
            </div>
            <div className="sb-section">Navigation</div>
            <nav className="sb-nav">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({isActive})=>`sb-item${isActive?' active':''}`}
                  onClick={()=>setSidebarOpen(false)}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  {item.badge ? <span className="sb-badge">{item.badge}</span> : null}
                </NavLink>
              ))}
            </nav>
            <div className="sb-section">Account</div>
            <div style={{padding:'4px 20px 12px',fontSize:12,color:'#64748b'}}>
              <div style={{fontWeight:600,color:'#94a3b8',marginBottom:2}}>admin@sriveerafireworks.com</div>
              <div>Super Administrator</div>
            </div>
            <div className="sb-footer">
              <button className="logout-btn" onClick={handleLogout}><LogOut style={{width:16,height:16}} />Sign Out</button>
            </div>
          </aside>

          {/* Main */}
          <main className="adm-main">
            <header className="adm-header">
              <div className="hdr-left">
                <button className="menu-toggle" onClick={()=>setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <X style={{width:18,height:18}} /> : <Menu style={{width:18,height:18}} />}
                </button>
                <img src={LOGO} alt="Sri Veera Fireworks" className="hdr-title" style={{height:36,width:'auto',objectFit:'contain'}} />
              </div>
              <div className="hdr-right">
                <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={fetchAll} disabled={loading}>
                  <RefreshCw style={{width:14,height:14}} className={loading?'spinning':''} />
                  {loading?'Loading...':'Refresh'}
                </button>
                <div className="hdr-adm-info" style={{textAlign:'right'}}>
                  <div className="adm-name">Admin</div>
                  <div className="adm-role">Super Administrator</div>
                </div>
                <div className="avatar">A</div>
              </div>
            </header>

            {/* Page content rendered here */}
            <div className="adm-content">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AdminCtx.Provider>
  );
}

/* ══════════════════════════════════════════════════
   CATEGORY MODAL (Add & Edit Category with Cloudinary Image Upload)
══════════════════════════════════════════════════ */
function CategoryModal({ category, onClose, onSave }) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name || '');
  const [imageUrl, setImageUrl] = useState(category?.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return;

    if (imageUrl) {
      deleteFromCloudinary(imageUrl);
    }

    setUploading(true);
    setErr('');

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ler130g0';
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'pyropark_uploads';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
      }

      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
      }
    } catch (err) {
      setErr('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Category Name is required.');
      return;
    }
    onSave({
      id: category?.id,
      name: name.trim(),
      oldName: category?.name,
      image_url: imageUrl,
    });
    onClose();
  };

  return (
    <div className="adm-modal-ov">
      <div className="adm-modal" style={{maxWidth:480}}>
        <div className="adm-modal-hdr">
          <div className="adm-modal-title">{isEdit ? '✏ Edit Category' : '＋ Add New Category'}</div>
          <button className="adm-close-btn" onClick={onClose}><X style={{width:16,height:16}} /></button>
        </div>
        <form onSubmit={handleSubmit} className="adm-modal-body">
          {err && <div className="adm-err-box" style={{marginBottom:16}}>{err}</div>}
          <div className="adm-form-group">
            <label className="adm-form-lbl">Category Name *</label>
            <input
              className="adm-form-input"
              placeholder="e.g. Mega Sky Shots"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="adm-form-group">
            <label className="adm-form-lbl">Category Banner Image (Cloudinary Upload)</label>
            {imageUrl ? (
              <div className="adm-img-preview-box">
                <img src={imageUrl} alt="Category" className="adm-img-preview" style={{width:90,height:65,objectFit:'cover',borderRadius:8}} />
                <div className="adm-img-preview-info">
                  <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>Category Image Uploaded</div>
                  <div style={{fontSize:11,color:'#10b981',marginTop:2}}>✓ Ready for saving</div>
                  <div className="adm-img-preview-actions" style={{marginTop:6}}>
                    <label className="adm-btn adm-btn-secondary adm-btn-sm" style={{cursor:'pointer',padding:'4px 8px',fontSize:11}}>
                      <RefreshCw style={{width:11,height:11}} /> Change
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} disabled={uploading} />
                    </label>
                    <button
                      type="button"
                      className="adm-btn adm-btn-danger adm-btn-sm"
                      onClick={() => {
                        if (imageUrl) {
                          deleteFromCloudinary(imageUrl);
                        }
                        setImageUrl('');
                        if (category?.id) {
                          onSave({
                            id: category.id,
                            name: name.trim() || category.name,
                            oldName: category.name,
                            image_url: '',
                          });
                        }
                      }}
                      style={{padding:'4px 8px',fontSize:11}}
                    >
                      <Trash2 style={{width:11,height:11}} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                className="adm-gallery-dropzone"
                style={{
                  cursor: 'pointer',
                  height: 90,
                  border: isDragging ? '2.5px dashed #ff6b35' : '1.5px dashed #cbd5e1',
                  background: isDragging ? '#fff5ee' : '#ffffff',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px'
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) uploadFile(file);
                }}
              >
                {uploading ? (
                  <RefreshCw className="spinning" style={{width:20,height:20,color:'#ff6b35'}} />
                ) : (
                  <>
                    <Plus style={{width:20,height:20,color:'#ff6b35'}} />
                    <span style={{fontSize:12,fontWeight:600,color:'#ff6b35'}}>Upload or Drag & Drop Category Image</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} disabled={uploading} />
              </label>
            )}
          </div>
          <div className="adm-modal-ftr" style={{padding:'12px 0 0 0',marginTop:16,borderTop:'1px solid #e2e8f0'}}>
            <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary">
              <Save style={{width:14,height:14}} /> {isEdit ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CATEGORIES  →  /admin/categories
══════════════════════════════════════════════════ */
export function AdminCategories() {
  const { categoryData, products, saveCategory, deleteCategory, loading } = useAdmin();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalCat, setModalCat] = useState(null); // null = closed, false = new, object = edit
  const [confirmDelete, setConfirmDelete] = useState(null);

  const colors = ['#ff6b35','#3b82f6','#10b981','#8b5cf6','#f59e0b','#ec4899','#14b8a6','#f97316'];

  const cleanCategories = (categoryData || []).filter(c => {
    const name = typeof c === 'object' ? (c?.name || '') : String(c || '');
    return name && !name.startsWith('__');
  });

  const filtered = cleanCategories.filter(c => {
    const q = search.toLowerCase();
    const name = typeof c === 'object' ? (c?.name || '') : String(c || '');
    return !q || name.toLowerCase().includes(q);
  });

  if (loading) return <CategoriesSkeleton />;

  return (
    <div className="adm-page-container">
      {modalCat !== null && (
        <CategoryModal
          category={modalCat || null}
          onClose={() => setModalCat(null)}
          onSave={(catObj) => {
            saveCategory(catObj);
            setModalCat(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Category?"
          message={`Permanently delete category "${confirmDelete.name}"? Products in this category will remain, but the category card will be removed.`}
          onConfirm={() => {
            deleteCategory(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="adm-page-header">
        <div style={{marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div className="pg-title">Categories</div>
            <div className="pg-sub">{cleanCategories.length} product categories</div>
          </div>
          <button className="adm-btn adm-btn-primary" onClick={() => setModalCat(false)}>
            <Plus /> Add Category
          </button>
        </div>

        <div className="adm-search-bar" style={{marginBottom:12}}>
          <div className="adm-search-wrap" style={{flex:1}}>
            <Search className="si" />
            <input
              className="adm-form-input"
              placeholder="Search categories by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{marginBottom:12,fontSize:13,color:'#64748b'}}>
          Showing {filtered.length} of {cleanCategories.length} categories
        </div>
      </div>

      <div className="cats-grid">
        {filtered.map((cat, i) => {
          const catName = typeof cat === 'object' ? (cat?.name || 'Uncategorized') : String(cat || '');
          const catImg = typeof cat === 'object' ? (cat?.image_url || '') : '';
          const Icon = getCategoryIcon(catName);

          const prods = products.filter(p => (p.category || '').toLowerCase() === catName.toLowerCase());
          const count = prods.length;
          const activeCount = prods.filter(p => p.is_active !== false).length;
          const color = colors[i % colors.length];

          return (
            <div
              key={typeof cat === 'object' ? (cat.id || catName) : catName}
              className="cat-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '18px',
                minHeight: '140px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Header row: Icon/Image on left + Edit/Delete action buttons on right */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: `1px solid ${color}33`,
                  }}
                >
                  {catImg ? (
                    <img src={catImg} alt={catName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon style={{ width: 22, height: 22, color }} />
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    title="Edit Category"
                    style={{ padding: '5px 9px', fontSize: 12, borderRadius: 8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalCat(typeof cat === 'object' ? cat : { name: catName, image_url: '' });
                    }}
                  >
                    <Edit2 style={{ width: 13, height: 13 }} />
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn-danger adm-btn-sm"
                    title="Delete Category"
                    style={{ padding: '5px 9px', fontSize: 12, borderRadius: 8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(typeof cat === 'object' ? cat : { name: catName, image_url: '' });
                    }}
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>

              {/* Body: Category Title + Product Counts */}
              <div
                style={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
                onClick={() => navigate(`/admin/products?cat=${encodeURIComponent(catName)}`)}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: 4 }}>
                  {catName}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{activeCount} active · {count} total products</span>
                  <ArrowUpRight style={{ width: 15, height: 15, color: '#ff6b35', flexShrink: 0, marginLeft: 4 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PRODUCTS  →  /admin/products
══════════════════════════════════════════════════ */
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="adm-modal-ov">
      <div className="adm-modal adm-modal-sm">
        <div className="adm-modal-hdr">
          <div className="adm-modal-title" style={{color:'#ef4444'}}>⚠ Confirm Delete</div>
          <button className="adm-close-btn" onClick={onCancel}><X style={{width:16,height:16}} /></button>
        </div>
        <div className="adm-modal-body">
          <div style={{fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:8}}>{title}</div>
          <div style={{fontSize:13,color:'#64748b',lineHeight:1.6}}>{message}</div>
        </div>
        <div className="adm-modal-ftr">
          <button className="adm-btn adm-btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="adm-btn adm-btn-danger" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSaved }) {
  const isEdit = !!product;
  const { products } = useAdmin();
  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({ category: false, name: false, price: false });

  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || categories[0] || '',
    mrp: product?.mrp || '',
    price: product?.price || '',
    image_url: product?.image_url || '',
    is_active: product?.is_active !== false,
  });

  const initUnitParsed = (() => {
    const raw = (product?.order_unit || product?.quantity || product?.unit || '').trim();
    if (!raw) return { unitType: '1 Box', subQty: '10', customStr: '' };
    if (raw === '1 Piece' || raw === '1 Pc' || raw.toLowerCase().includes('single item')) {
      return { unitType: '1 Piece', subQty: '', customStr: '' };
    }
    const boxMatch = raw.match(/1\s*Box/i);
    if (boxMatch) {
      const q = raw.match(/\((\d+)/);
      return { unitType: '1 Box', subQty: q ? q[1] : '10', customStr: '' };
    }
    const pktMatch = raw.match(/1\s*(Pkt|Packet)/i);
    if (pktMatch) {
      const q = raw.match(/\((\d+)/);
      return { unitType: '1 Packet', subQty: q ? q[1] : '5', customStr: '' };
    }
    const bdlMatch = raw.match(/1\s*Bundle/i);
    if (bdlMatch) {
      const q = raw.match(/\((\d+)/);
      return { unitType: '1 Bundle', subQty: q ? q[1] : '10', customStr: '' };
    }
    return { unitType: 'Custom', subQty: '', customStr: raw };
  })();

  const [unitType, setUnitType] = useState(initUnitParsed.unitType);
  const [subQty, setSubQty] = useState(initUnitParsed.subQty);
  const [customUnit, setCustomUnit] = useState(initUnitParsed.customStr);

  const computedUnit = (() => {
    if (unitType === '1 Box') return `1 Box (${subQty || '1'} Pcs)`;
    if (unitType === '1 Packet') return `1 Packet (${subQty || '1'} Pcs)`;
    if (unitType === '1 Bundle') return `1 Bundle (${subQty || '1'} Pkts)`;
    if (unitType === '1 Piece') return '1 Piece';
    return customUnit || '';
  })();

  const parseImages = (raw) => {
    if (!raw) return ['', '', '', ''];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [
          parsed[0] || '',
          parsed[1] || '',
          parsed[2] || '',
          parsed[3] || '',
        ];
      }
    } catch (e) {}
    return [raw, '', '', ''];
  };

  const [images, setImages] = useState(() => parseImages(product?.image_url));
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const calcDiscount = (mrpVal, priceVal) => {
    const m = parseFloat(mrpVal);
    const p = parseFloat(priceVal);
    if (!isNaN(m) && !isNaN(p) && m > 0 && m >= p) {
      return Math.round(((m - p) / m) * 100);
    }
    return 0;
  };

  const [dragOverIdx, setDragOverIdx] = useState(null);

  const uploadSlotFile = async (file, slotIdx) => {
    if (!file) return;

    const oldUrl = images[slotIdx];
    if (oldUrl) {
      deleteFromCloudinary(oldUrl);
    }

    setUploadingIdx(slotIdx);
    setErr('');

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ler130g0';
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'pyropark_uploads';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
      }

      const data = await res.json();
      if (data.secure_url) {
        setImages(prev => {
          const next = [...prev];
          next[slotIdx] = data.secure_url;
          return next;
        });
      }
    } catch (err) {
      setErr('Image upload failed: ' + err.message);
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSlotImageUpload = (e, slotIdx) => {
    const file = e.target.files?.[0];
    if (file) uploadSlotFile(file, slotIdx);
  };

  const removeSlotImage = async (slotIdx) => {
    const oldUrl = images[slotIdx];
    if (oldUrl) {
      deleteFromCloudinary(oldUrl);
    }
    const nextImages = [...images];
    nextImages[slotIdx] = '';
    setImages(nextImages);

    if (isEdit && product?.id) {
      const activeImgs = nextImages.filter(url => url && url.trim() !== '');
      let finalImageUrl = null;
      if (activeImgs.length === 1) {
        finalImageUrl = activeImgs[0];
      } else if (activeImgs.length > 1) {
        finalImageUrl = JSON.stringify(activeImgs);
      }
      try {
        await api(`/products?id=eq.${product.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ image_url: finalImageUrl })
        });
      } catch (e) {
        console.error('Failed to immediately clear image from Supabase:', e);
      }
    }
  };

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (fieldErrors[k]) {
      setFieldErrors(prev => ({ ...prev, [k]: false }));
    }
  };

  const save = async () => {
    const errs = {
      category: !form.category,
      name: !form.name || !form.name.trim(),
      price: !form.price || isNaN(parseFloat(form.price)),
    };

    if (errs.category || errs.name || errs.price) {
      setFieldErrors(errs);
      if (errs.category) {
        const msg = 'Please select a Category';
        setErr(msg);
        toast.error(msg);
      } else if (errs.name) {
        const msg = 'Please fill out Product Name';
        setErr(msg);
        toast.error(msg);
        if (nameRef.current) {
          nameRef.current.focus();
          nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (errs.price) {
        const msg = 'Please fill out Selling Price (₹)';
        setErr(msg);
        toast.error(msg);
        if (priceRef.current) {
          priceRef.current.focus();
          priceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    setFieldErrors({ category: false, name: false, price: false });
    setSaving(true); setErr('');
    try {
      const disc = calcDiscount(form.mrp, form.price);
      const activeImgs = images.filter(url => url && url.trim() !== '');
      let finalImageUrl = null;
      if (activeImgs.length === 1) {
        finalImageUrl = activeImgs[0];
      } else if (activeImgs.length > 1) {
        finalImageUrl = JSON.stringify(activeImgs);
      }

      let assignedCode = product?.product_code;
      if (!isEdit || !assignedCode) {
        const maxCodeNum = (products || []).reduce((max, p) => {
          const n = parseInt(p.product_code, 10);
          return !isNaN(n) && n > max ? n : max;
        }, 0);
        assignedCode = String(maxCodeNum + 1);
      }

      const body = {
        product_code: assignedCode,
        name: form.name,
        category: form.category,
        mrp: form.mrp ? parseFloat(form.mrp) : null,
        price: form.price ? parseFloat(form.price) : null,
        discount_percentage: disc,
        order_unit: computedUnit || null,
        image_url: finalImageUrl,
        is_active: form.is_active,
      };
      if (isEdit) await api(`/products?id=eq.${product.id}`,{method:'PATCH',body:JSON.stringify(body)});
      else await api('/products',{method:'POST',body:JSON.stringify(body)});
      onSaved();
    } catch(e) {
      const errMsg = parseSupabaseError(e.message);
      setErr(errMsg);
      toast.error(errMsg);
    }
    setSaving(false);
  };

  return (
    <div className="adm-modal-ov">
      <div className="adm-modal" style={{maxWidth:680}}>
        <div className="adm-modal-hdr">
          <div className="adm-modal-title">{isEdit ? '✏ Edit Product' : '＋ Add New Product'}</div>
          <button className="adm-close-btn" onClick={onClose}><X style={{width:16,height:16}} /></button>
        </div>
        <div className="adm-modal-body">
          {err && <div className="adm-err-box" style={{marginBottom:16}}>{err}</div>}
          <div className="adm-form-group">
            <label className="adm-form-lbl">Category <span style={{color:'#ef4444'}}>*</span></label>
            <CustomSelect
              value={form.category}
              options={categories}
              onChange={val => set('category', val)}
              placeholder="Select category"
            />
            {fieldErrors.category && (
              <div style={{fontSize:11, color:'#ef4444', marginTop:4, fontWeight:600}}>
                ⚠️ Please select a Category
              </div>
            )}
          </div>
          <div className="adm-form-group">
            <label className="adm-form-lbl">Product Name <span style={{color:'#ef4444'}}>*</span></label>
            <input
              ref={nameRef}
              className="adm-form-input"
              style={fieldErrors.name ? { border: '1.5px solid #ef4444', backgroundColor: '#fef2f2' } : {}}
              placeholder="e.g. Premium Sparklers 4 inch"
              value={form.name}
              onChange={e=>set('name',e.target.value)}
            />
            {fieldErrors.name && (
              <div style={{fontSize:11, color:'#ef4444', marginTop:4, fontWeight:600}}>
                ⚠️ Please fill out Product Name
              </div>
            )}
          </div>
          <div className="adm-form-row-3">
            <div className="adm-form-group">
              <label className="adm-form-lbl">MRP Price (₹)</label>
              <input className="adm-form-input" type="number" placeholder="e.g. 1000" value={form.mrp} onChange={e=>set('mrp',e.target.value)} />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-lbl">Selling Price (₹) <span style={{color:'#ef4444'}}>*</span></label>
              <input
                ref={priceRef}
                className="adm-form-input"
                type="number"
                style={fieldErrors.price ? { border: '1.5px solid #ef4444', backgroundColor: '#fef2f2' } : {}}
                placeholder="e.g. 800"
                value={form.price}
                onChange={e=>set('price',e.target.value)}
              />
              {fieldErrors.price && (
                <div style={{fontSize:11, color:'#ef4444', marginTop:4, fontWeight:600}}>
                  ⚠️ Please fill out Selling Price
                </div>
              )}
            </div>
            <div className="adm-form-group">
              <label className="adm-form-lbl">Discount (%)</label>
              <input className="adm-form-input" type="text" value={form.mrp && form.price ? `${calcDiscount(form.mrp, form.price)}% OFF` : '0%'} style={{background:'#f8fafc',fontWeight:700,color:'#f59e0b'}} disabled />
            </div>
          </div>
          {form.mrp && form.price && parseFloat(form.mrp) >= parseFloat(form.price) && (
            <div className="adm-price-calc">
              Auto-calculated Discount: MRP ₹{form.mrp} − Selling Price ₹{form.price} = Save ₹{parseFloat(form.mrp) - parseFloat(form.price)} (<strong style={{color:'#f59e0b'}}>{calcDiscount(form.mrp, form.price)}% OFF</strong>)
            </div>
          )}

          <div className="adm-form-row" style={{alignItems:'flex-start'}}>
            <div className="adm-form-group">
              <label className="adm-form-lbl">Packaging Unit Type</label>
              <CustomSelect
                value={unitType}
                options={[
                  { label: '📦 1 Box', value: '1 Box' },
                  { label: '🏷 1 Packet', value: '1 Packet' },
                  { label: '🎁 1 Bundle', value: '1 Bundle' },
                  { label: '✨ 1 Piece', value: '1 Piece' },
                  { label: '✍ Custom Unit...', value: 'Custom' },
                ]}
                onChange={(val) => setUnitType(val)}
                placeholder="Select unit type"
              />
            </div>

            {unitType === '1 Box' && (
              <div className="adm-form-group">
                <label className="adm-form-lbl">Pieces Inside Box (Pcs)</label>
                <input
                  className="adm-form-input"
                  type="number"
                  placeholder="e.g. 10"
                  min="1"
                  value={subQty}
                  onChange={e => setSubQty(e.target.value)}
                />
              </div>
            )}

            {unitType === '1 Packet' && (
              <div className="adm-form-group">
                <label className="adm-form-lbl">Pieces Inside Packet (Pcs)</label>
                <input
                  className="adm-form-input"
                  type="number"
                  placeholder="e.g. 5"
                  min="1"
                  value={subQty}
                  onChange={e => setSubQty(e.target.value)}
                />
              </div>
            )}

            {unitType === '1 Bundle' && (
              <div className="adm-form-group">
                <label className="adm-form-lbl">Packets Inside Bundle (Pkts)</label>
                <input
                  className="adm-form-input"
                  type="number"
                  placeholder="e.g. 10"
                  min="1"
                  value={subQty}
                  onChange={e => setSubQty(e.target.value)}
                />
              </div>
            )}

            {unitType === 'Custom' && (
              <div className="adm-form-group">
                <label className="adm-form-lbl">Custom Unit Text</label>
                <input
                  className="adm-form-input"
                  placeholder="e.g. 1 Roll / 25 Pcs"
                  value={customUnit}
                  onChange={e => setCustomUnit(e.target.value)}
                />
              </div>
            )}

            <div className="adm-form-group">
              <label className="adm-form-lbl">Status</label>
              <CustomSelect
                value={form.is_active ? 'true' : 'false'}
                options={[
                  { label: 'Active', value: 'true' },
                  { label: 'Inactive', value: 'false' }
                ]}
                onChange={val => set('is_active', val === 'true')}
              />
            </div>
          </div>

          <div style={{marginTop: -6, marginBottom: 16, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{fontSize: 12, fontWeight: 600, color: '#64748b'}}>Live Unit Preview:</span>
            <strong style={{color: '#ff6b35', fontSize: 13, background: '#fff3ee', padding: '2px 8px', borderRadius: 6, border: '1px solid #ff6b3533'}}>{computedUnit || '—'}</strong>
          </div>

          <div className="adm-form-group" style={{marginTop:12}}>
            <label className="adm-form-lbl">Product Image Gallery</label>
            <div className="adm-gallery-layout">
              {/* Row 1: Main Display Image */}
              <div className="adm-gallery-main-row">
                <div className="adm-gallery-card main-card">
                  <div className="adm-gallery-card-hdr">
                    <span className="adm-gallery-tag main">★ Main Display Image (Primary)</span>
                    {images[0] && <span style={{fontSize:11,color:'#10b981',fontWeight:600}}>✓ Uploaded</span>}
                  </div>
                  {images[0] ? (
                    <div className="adm-gallery-main-body">
                      <div className="adm-gallery-main-thumb-wrap">
                        <img src={images[0]} alt="Main Display" className="adm-gallery-main-thumb" />
                      </div>
                      <div className="adm-gallery-main-info">
                        <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>Main Product Photo</div>
                        <div style={{fontSize:11,color:'#64748b',marginTop:2}}>Appears on search results, cards & catalog view</div>
                        <div className="adm-gallery-actions" style={{marginTop:10,justifyContent:'flex-start'}}>
                          <label className="adm-btn adm-btn-secondary adm-btn-sm" style={{cursor:'pointer',padding:'6px 12px',fontSize:12}}>
                            <RefreshCw style={{width:12,height:12}} /> Change Main Image
                            <input type="file" accept="image/*" onChange={(e) => handleSlotImageUpload(e, 0)} style={{display:'none'}} disabled={uploadingIdx === 0} />
                          </label>
                          <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => removeSlotImage(0)} style={{padding:'6px 12px',fontSize:12}}>
                            <Trash2 style={{width:12,height:12}} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      className="adm-gallery-dropzone main-dropzone"
                      style={{
                        cursor: 'pointer',
                        border: dragOverIdx === 0 ? '2.5px dashed #ff6b35' : '1.5px dashed #cbd5e1',
                        background: dragOverIdx === 0 ? '#fff5ee' : '#ffffff',
                        transition: 'all 0.2s ease',
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIdx(0); }}
                      onDragLeave={() => setDragOverIdx(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverIdx(null);
                        const file = e.dataTransfer.files?.[0];
                        if (file) uploadSlotFile(file, 0);
                      }}
                    >
                      {uploadingIdx === 0 ? (
                        <div className="adm-dropzone-content">
                          <RefreshCw className="spinning" style={{width:22,height:22,color:'#ff6b35'}} />
                          <span style={{fontSize:13,fontWeight:600,color:'#ff6b35'}}>Uploading Main Image to Cloudinary...</span>
                        </div>
                      ) : (
                        <div className="adm-dropzone-content">
                          <div className="adm-dropzone-icon">
                            <Plus style={{width:20,height:20,color:'#ff6b35'}} />
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>Click or Drag & Drop Main Display Image</div>
                            <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>Primary thumbnail for product card</div>
                          </div>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleSlotImageUpload(e, 0)} style={{display:'none'}} disabled={uploadingIdx === 0} />
                    </label>
                  )}
                </div>
              </div>

              {/* Row 2: 3 Slide Gallery Images */}
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:8}}>Additional Gallery Slide Images (3 Slots)</div>
                <div className="adm-gallery-slides-grid">
                  {[1, 2, 3].map((slotIdx) => (
                    <div key={slotIdx} className="adm-gallery-card slide-card">
                      <span className="adm-gallery-tag slide">Slide Image {slotIdx}</span>
                      {images[slotIdx] ? (
                        <>
                          <div className="adm-gallery-thumb-wrap">
                            <img src={images[slotIdx]} alt={`Slide ${slotIdx}`} className="adm-gallery-thumb" />
                          </div>
                          <div className="adm-gallery-actions">
                            <label className="adm-btn adm-btn-secondary adm-btn-sm" style={{cursor:'pointer',padding:'4px 8px',fontSize:11}}>
                              <RefreshCw style={{width:11,height:11}} />
                              <input type="file" accept="image/*" onChange={(e) => handleSlotImageUpload(e, slotIdx)} style={{display:'none'}} disabled={uploadingIdx === slotIdx} />
                            </label>
                            <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => removeSlotImage(slotIdx)} style={{padding:'4px 8px',fontSize:11}}>
                              <Trash2 style={{width:11,height:11}} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label
                          className="adm-gallery-dropzone"
                          style={{
                            cursor: 'pointer',
                            border: dragOverIdx === slotIdx ? '2.5px dashed #ff6b35' : '1.5px dashed #cbd5e1',
                            background: dragOverIdx === slotIdx ? '#fff5ee' : '#ffffff',
                            transition: 'all 0.2s ease',
                          }}
                          onDragOver={(e) => { e.preventDefault(); setDragOverIdx(slotIdx); }}
                          onDragLeave={() => setDragOverIdx(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverIdx(null);
                            const file = e.dataTransfer.files?.[0];
                            if (file) uploadSlotFile(file, slotIdx);
                          }}
                        >
                          {uploadingIdx === slotIdx ? (
                            <RefreshCw className="spinning" style={{width:18,height:18,color:'#64748b'}} />
                          ) : (
                            <>
                              <Plus style={{width:18,height:18,color:'#94a3b8'}} />
                              <span style={{fontSize:11,color:'#64748b'}}>+ Slide {slotIdx}</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={(e) => handleSlotImageUpload(e, slotIdx)} style={{display:'none'}} disabled={uploadingIdx === slotIdx} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="adm-modal-ftr">
          <button className="adm-btn adm-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
            <Save style={{width:14,height:14}} />
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const { products, setProducts, categories, loading, fetchAll } = useAdmin();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalProd, setModalProd] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Support ?cat= from categories page
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('cat');
    if (p) setCatFilter(decodeURIComponent(p));
  }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (!q || ((p.product_code||'').toLowerCase().includes(q) || (p.name||'').toLowerCase().includes(q)))
        && (!catFilter || p.category === catFilter);
  });

  const toggleActive = async (prod) => {
    const newVal = !prod.is_active;
    setToggling(prod.id);
    setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, is_active: newVal } : p));
    try {
      await api(`/products?id=eq.${prod.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: newVal }) });
    } catch(e) {
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, is_active: prod.is_active } : p));
      toast.error(parseSupabaseError(e.message));
    }
    setToggling(null);
  };

  const deleteProduct = async (prod) => {
    try {
      const imgUrlStr = typeof prod === 'object' ? prod.image_url : null;
      const targetId = typeof prod === 'object' ? prod.id : prod;

      if (imgUrlStr) {
        try {
          const arr = JSON.parse(imgUrlStr);
          if (Array.isArray(arr)) {
            arr.forEach(url => deleteFromCloudinary(url));
          } else {
            deleteFromCloudinary(imgUrlStr);
          }
        } catch(e) {
          deleteFromCloudinary(imgUrlStr);
        }
      }

      await api(`/products?id=eq.${targetId}`, { method: 'DELETE' });
      fetchAll();
    } catch(e) {
      toast.error(parseSupabaseError(e.message));
    }
    setConfirm(null);
  };

  const handleDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    let updatedProducts = [...products];

    if (catFilter || search) {
      const sourceProd = filtered[source.index];
      const destProd = filtered[destination.index];

      const realSourceIdx = updatedProducts.findIndex(p => p.id === sourceProd.id);
      const realDestIdx = updatedProducts.findIndex(p => p.id === destProd.id);

      if (realSourceIdx !== -1 && realDestIdx !== -1) {
        const [moved] = updatedProducts.splice(realSourceIdx, 1);
        updatedProducts.splice(realDestIdx, 0, moved);
      }
    } else {
      const [moved] = updatedProducts.splice(source.index, 1);
      updatedProducts.splice(destination.index, 0, moved);
    }

    const changedProducts = [];
    const resequencedProducts = updatedProducts.map((p, idx) => {
      const newCode = String(idx + 1);
      if (p.product_code !== newCode) {
        changedProducts.push({ id: p.id, product_code: newCode });
        return { ...p, product_code: newCode };
      }
      return p;
    });

    // 2. Set UI state immediately — item stays at dropped location with zero flicker
    setProducts(resequencedProducts);

    // 3. Persist to API in background quietly. On success, DO NOT touch products state!
    if (changedProducts.length > 0) {
      try {
        await Promise.all(
          changedProducts.map(cp =>
            api(`/products?id=eq.${cp.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ product_code: cp.product_code })
            })
          )
        );
      } catch (err) {
        console.error('Failed to save reordered products:', err);
        toast.error('Failed to save product order');
        fetchAll();
      }
    }
  };

  if (loading && products.length === 0) return <ProductsSkeleton />;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="adm-page-container">
        {modalProd !== null && <ProductModal product={modalProd||null} categories={categories} onClose={()=>setModalProd(null)} onSaved={()=>{setModalProd(null);fetchAll();}} />}
        {confirm && <ConfirmDialog title="Delete Product?" message={`Permanently delete "${confirm.name}"? This cannot be undone.`} onConfirm={()=>deleteProduct(confirm)} onCancel={()=>setConfirm(null)} />}

        <div className="adm-page-header">
          <div style={{marginBottom:16}}>
            <div className="pg-title">Products</div>
            <div className="pg-sub">{products.length} products in catalog • Drag & drop rows to reorder</div>
          </div>

          <div className="adm-search-bar">
            <div className="adm-search-wrap">
              <Search className="si" />
              <input className="adm-form-input" placeholder="Search by name or order code..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <div style={{minWidth:220}}>
              <CustomSelect
                value={catFilter}
                options={[
                  { label: 'All Categories', value: '' },
                  ...categories.map(c => ({ label: c, value: c }))
                ]}
                onChange={val => setCatFilter(val)}
                placeholder="All Categories"
              />
            </div>
            <button className="adm-btn adm-btn-primary" onClick={()=>setModalProd(false)}><Plus />Add Product</button>
          </div>

          <div style={{marginBottom:12,fontSize:13,color:'#64748b',display:'flex',alignItems:'center',justify:'space-between'}}>
            <span>Showing {filtered.length} of {products.length} products{catFilter&&<span> in <strong style={{color:'#ff6b35'}}>{catFilter}</strong></span>}</span>
            <span style={{fontSize:12,color:'#94a3b8'}}><GripVertical style={{width:14,height:14,display:'inline',verticalAlign:'middle',marginRight:4}} />Drag grip handle to reorder list</span>
          </div>
        </div>

        {/* ── Desktop table ── */}
        <div className="adm-card adm-scroll-card" style={{display: isMobile ? 'none' : ''}}>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th style={{width:40}}></th><th>#</th><th>Product</th><th>Category</th><th>MRP</th><th>Discount</th><th>Price</th><th>Unit</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
              <Droppable droppableId="admin-products-table-droppable">
                {(provided) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {filtered.length===0 ? (
                      <tr><td colSpan={10}><div className="adm-empty-state"><Package /><p>No products found</p></div></td></tr>
                    ) : filtered.map((p, idx) => (
                      <Draggable key={String(p.id)} draggableId={String(p.id)} index={idx}>
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              display: snapshot.isDragging ? 'table' : undefined,
                              background: snapshot.isDragging ? '#f0f9ff' : undefined,
                              boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.1)' : undefined,
                            }}
                          >
                            <td {...provided.dragHandleProps} style={{cursor:'grab',width:36,color:'#94a3b8',textAlign:'center'}}>
                              <GripVertical style={{width:16,height:16}} />
                            </td>
                            <td style={{color:'#94a3b8',fontFamily:'monospace',fontSize:11,fontWeight:600}}>{p.product_code || String(idx+1)}</td>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:12}}>
                                {(() => {
                                  let thumb = p.image_url;
                                  if (thumb) {
                                    try {
                                      const arr = JSON.parse(thumb);
                                      if (Array.isArray(arr) && arr.length > 0) thumb = arr[0];
                                    } catch(e) {}
                                  }
                                  return thumb ? <img src={thumb} alt="" className="prod-thumb" onError={e=>{e.target.style.display='none'}} /> : <div className="prod-thumb-ph"><Box style={{width:18,height:18}} /></div>;
                                })()}
                                <div><div className="prod-name">{p.name}</div><div className="prod-code">Code: {p.product_code}</div></div>
                              </div>
                            </td>
                            <td style={{fontSize:12,color:'#94a3b8',maxWidth:180}}>{p.category}</td>
                            <td style={{fontSize:13,color:'#64748b'}}>{p.mrp?`₹${p.mrp}`:'—'}</td>
                            <td style={{fontSize:13,color:'#f59e0b',fontWeight:600}}>
                              {(() => {
                                const m = parseFloat(p.mrp);
                                const pr = parseFloat(p.price);
                                if (!isNaN(m) && !isNaN(pr) && m > 0 && m >= pr) {
                                  return `${Math.round(((m - pr) / m) * 100)}%`;
                                }
                                return p.discount ? `${p.discount}%` : '—';
                              })()}
                            </td>
                            <td style={{fontSize:13,fontWeight:700,color:'#10b981'}}>{p.price?`₹${p.price}`:'—'}</td>
                            <td style={{fontSize:12,color:'#64748b'}}>{p.order_unit || p.quantity || p.unit || '—'}</td>
                            <td>
                              <button
                                className={`adm-toggle-sw ${p.is_active !== false ? 'on' : ''} ${toggling === p.id ? 'toggling' : ''}`}
                                onClick={() => toggleActive(p)}
                                disabled={toggling === p.id}
                                title={p.is_active !== false ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                              >
                                <span className="adm-toggle-track"><span className="adm-toggle-thumb" /></span>
                                <span className="adm-toggle-lbl">{p.is_active !== false ? 'Active' : 'Inactive'}</span>
                              </button>
                            </td>
                            <td>
                              <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                                <button className="adm-btn adm-btn-secondary adm-btn-icon adm-btn-sm" onClick={()=>setModalProd(p)} title="Edit"><Edit2 style={{width:14,height:14}} /></button>
                                <button className="adm-btn adm-btn-danger adm-btn-icon adm-btn-sm" onClick={()=>setConfirm(p)} title="Delete"><Trash2 style={{width:14,height:14}} /></button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </div>
        </div>

        {/* ── Mobile cards ── */}
        <Droppable droppableId="admin-products-mobile-droppable">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} style={{display: isMobile ? 'flex' : 'none', flexDirection:'column', gap:'10px'}}>
              {filtered.length === 0 ? (
                <div className="adm-empty-state"><Package /><p>No products found</p></div>
              ) : filtered.map((p, idx) => {
                const thumb = (() => {
                  let t = p.image_url;
                  if (t) { try { const arr = JSON.parse(t); if (Array.isArray(arr) && arr.length > 0) t = arr[0]; } catch(e) {} }
                  return t;
                })();
                const disc = (() => {
                  const m = parseFloat(p.mrp), pr = parseFloat(p.price);
                  if (!isNaN(m) && !isNaN(pr) && m > 0 && m >= pr) return `${Math.round(((m - pr) / m) * 100)}%`;
                  return p.discount ? `${p.discount}%` : null;
                })();
                const isActive = p.is_active !== false;
                return (
                  <Draggable key={String(p.id)} draggableId={String(p.id)} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          background: snapshot.isDragging ? '#f0f9ff' : '#fff',
                          borderRadius:'14px',
                          border:'1px solid #e8edf2',
                          boxShadow: snapshot.isDragging ? '0 6px 16px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
                          overflow:'hidden'
                        }}
                      >
                        {/* Drag Handle Row */}
                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc', padding:'6px 12px', borderBottom:'1px solid #f1f5f9'}}>
                          <div {...provided.dragHandleProps} style={{cursor:'grab', display:'flex', alignItems:'center', gap:'6px', color:'#64748b', fontSize:'0.75rem', fontWeight:600}}>
                            <GripVertical style={{width:16, height:16}} /> Drag to reorder
                          </div>
                          <div style={{fontSize:'0.72rem', color:'#94a3b8', fontFamily:'monospace', fontWeight:700}}>
                            #{p.product_code}
                          </div>
                        </div>
                        {/* Top row */}
                        <div style={{display:'flex', gap:'12px', padding:'12px 12px 10px'}}>
                          {/* Image */}
                          <div style={{width:'58px', height:'58px', borderRadius:'10px', background:'#f8fafc', border:'1px solid #e2e8f0', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                            {thumb
                              ? <img src={thumb} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={e=>{e.target.style.display='none'}} />
                              : <Box style={{width:22, height:22, color:'#94a3b8'}} />
                            }
                          </div>
                          {/* Info */}
                          <div style={{flex:1, minWidth:0}}>
                            <div style={{fontSize:'0.88rem', fontWeight:700, color:'#0f172a', lineHeight:1.3, marginBottom:'2px'}}>{p.name}</div>
                            <div style={{fontSize:'0.7rem', color:'#94a3b8', fontFamily:'monospace', marginBottom:'4px'}}>Code: {p.product_code}</div>
                            <span style={{fontSize:'0.68rem', fontWeight:700, color:'#6366f1', background:'#eef2ff', borderRadius:'6px', padding:'1px 7px'}}>{p.category}</span>
                          </div>
                          {/* Status toggle */}
                          <button
                            className={`adm-toggle-sw ${isActive ? 'on' : ''} ${toggling === p.id ? 'toggling' : ''}`}
                            onClick={() => toggleActive(p)}
                            disabled={toggling === p.id}
                            style={{alignSelf:'flex-start', flexShrink:0}}
                          >
                            <span className="adm-toggle-track"><span className="adm-toggle-thumb" /></span>
                          </button>
                        </div>
                        {/* Price row */}
                        <div style={{display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', background:'#fafbfc', borderTop:'1px solid #f1f5f9', borderBottom:'1px solid #f1f5f9'}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, marginBottom:'1px'}}>MRP</div>
                            <div style={{fontSize:'0.82rem', color:'#64748b', textDecoration:'line-through'}}>{p.mrp ? `₹${p.mrp}` : '—'}</div>
                          </div>
                          {disc && (
                            <div style={{flex:1}}>
                              <div style={{fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, marginBottom:'1px'}}>DISCOUNT</div>
                              <div style={{fontSize:'0.82rem', color:'#f59e0b', fontWeight:700}}>{disc}</div>
                            </div>
                          )}
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, marginBottom:'1px'}}>PRICE</div>
                            <div style={{fontSize:'0.95rem', color:'#10b981', fontWeight:800}}>{p.price ? `₹${p.price}` : '—'}</div>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, marginBottom:'1px'}}>UNIT</div>
                            <div style={{fontSize:'0.78rem', color:'#64748b'}}>{p.order_unit || p.quantity || p.unit || '—'}</div>
                          </div>
                        </div>
                        {/* Actions row */}
                        <div style={{display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'8px', padding:'8px 12px'}}>
                          <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={()=>setModalProd(p)} style={{display:'flex', alignItems:'center', gap:'5px'}}>
                            <Edit2 style={{width:13,height:13}} /> Edit
                          </button>
                          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={()=>setConfirm(p)} style={{display:'flex', alignItems:'center', gap:'5px'}}>
                            <Trash2 style={{width:13,height:13}} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}



/* ══════════════════════════════════════════════════
   IMPORTANT MESSAGE (MARQUEE ANNOUNCEMENT)
══════════════════════════════════════════════════ */
export function AdminAnnouncement() {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchFromDB = useCallback(async () => {
    try {
      const s = await fetchSiteSettings();
      if (s.announcement) setMessage(s.announcement);
    } catch(e) {}
  }, []);

  useEffect(() => {
    fetchFromDB();
  }, [fetchFromDB]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const existing = await api(`/products?category=eq.${encodeURIComponent(SETTINGS_KEY)}`);
      if (existing && existing.length > 0) {
        const current = (() => { try { return JSON.parse(existing[0].description || '{}'); } catch { return {}; } })();
        await api(`/products?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ description: JSON.stringify({ ...current, announcement: message }), is_active: true }),
        });
      }
      window.dispatchEvent(new CustomEvent('marquee_updated', { detail: message }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save announcement:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setMessage('');
    try {
      const existing = await api(`/products?category=eq.${encodeURIComponent(SETTINGS_KEY)}`);
      if (existing && existing.length > 0) {
        const current = (() => { try { return JSON.parse(existing[0].description || '{}'); } catch { return {}; } })();
        await api(`/products?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ description: JSON.stringify({ ...current, announcement: '' }), is_active: true }),
        });
      }
      window.dispatchEvent(new CustomEvent('marquee_updated', { detail: '' }));
    } catch(e) {}
  };

  return (
    <div className="adm-page-container">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone color="#ff6b35" /> Important Message (Marquee Banner)
          </h1>
          <p className="adm-sub">Manage and update the scrolling notification message displayed at the top of all website pages.</p>
        </div>
      </div>

      {success && (
        <div className="adm-card p-3 mb-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div className="d-flex align-items-center text-success font-weight-bold" style={{ gap: '8px', color: '#166534' }}>
            <CheckCircle size={20} />
            <span>Important Message updated and published to live website marquee successfully!</span>
          </div>
        </div>
      )}

      {/* Live Marquee Preview */}
      <div className="adm-card mb-4">
        <div className="adm-card-hdr">
          <div>
            <h3 className="adm-card-title d-flex align-items-center" style={{ gap: '8px' }}>
              <Bell size={18} color="#ff6b35" /> Live Marquee Banner Preview
            </h3>
            <p className="adm-card-sub">This is how your message appears to users scrolling the website:</p>
          </div>
        </div>
        <div className="adm-card-body" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="py-2 px-2" style={{ backgroundColor: '#0a539f', color: '#ffffff', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <marquee behavior="scroll" direction="left" scrollamount="6" style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', display: 'block' }}>
              {message || 'No announcement message set...'}
            </marquee>
          </div>
        </div>
      </div>

      {/* Announcement Edit Form */}
      <div className="adm-card">
        <div className="adm-card-hdr">
          <div>
            <h3 className="adm-card-title">Edit Announcement Message</h3>
            <p className="adm-card-sub">Type your custom notification. Emojis, phone numbers, and formatting are fully supported.</p>
          </div>
        </div>
        <div className="adm-card-body">
          <form onSubmit={handleSave}>
            <div className="adm-form-group">
              <label className="adm-form-lbl">Important Message Text</label>
              <textarea
                className="adm-form-input"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your important announcement message here..."
                style={{ padding: '12px', fontSize: '0.95rem', lineHeight: '1.6', borderRadius: '10px' }}
                required
              />
              <div className="d-flex justify-content-between text-muted small mt-1" style={{ fontSize: '0.85rem' }}>
                <span>Characters: {message.length}</span>
                <span>Words: {message.trim() ? message.trim().split(/\s+/).length : 0}</span>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-3 border-top" style={{ gap: '12px' }}>
              <button
                type="button"
                onClick={handleReset}
                className="adm-btn adm-btn-secondary"
              >
                Reset to Default
              </button>

              <button
                type="submit"
                className="adm-btn adm-btn-primary"
                disabled={saving}
                style={{ backgroundColor: '#ff6b35', borderColor: '#ff6b35' }}
              >
                <Save size={16} className="mr-1" />
                {saving ? 'Saving & Publishing...' : 'Save & Publish Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HERO BANNERS MANAGEMENT
══════════════════════════════════════════════════ */
export function AdminHeroBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api('/hero_banners?order=sort_order.asc,created_at.asc');
      } catch (err) {
        res = await api('/products?category=eq.__HERO_BANNER__&order=created_at.asc');
      }
      setBanners(res || []);
    } catch (e) {
      console.error('Failed to fetch hero banners:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const uploadBannerFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinarySigned(file);
      if (url) {
        setImageUrl(url);
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      alert('Upload failed: ' + (err.message || 'Could not upload image'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) uploadBannerFile(file);
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setImageUrl('');
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setImageUrl(banner.image_url || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setImageUrl('');
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setSaving(true);

    try {
      if (editingBanner) {
        // Delete old image from Cloudinary if it changed
        if (editingBanner.image_url && editingBanner.image_url !== imageUrl.trim()) {
          deleteFromCloudinary(editingBanner.image_url);
        }
        try {
          await api(`/hero_banners?id=eq.${editingBanner.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ image_url: imageUrl.trim(), title: 'Hero Banner', target_url: '/products' })
          });
        } catch (err) {
          await api(`/products?id=eq.${editingBanner.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: 'Hero Banner', image_url: imageUrl.trim(), description: '/products' })
          });
        }
      } else {
        try {
          await api('/hero_banners', {
            method: 'POST',
            body: JSON.stringify({ image_url: imageUrl.trim(), title: 'Hero Banner', target_url: '/products' })
          });
        } catch (err) {
          await api('/products', {
            method: 'POST',
            body: JSON.stringify({
              name: 'Hero Banner',
              category: '__HERO_BANNER__',
              image_url: imageUrl.trim(),
              description: '/products',
              price: 0,
              stock: 0,
              is_active: true
            })
          });
        }
      }

      closeModal();
      await fetchBanners();
    } catch (err) {
      console.error('Failed to save banner:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (banner) => {
    if (!window.confirm('Are you sure you want to delete this hero banner image?')) return;

    try {
      if (banner.image_url) {
        deleteFromCloudinary(banner.image_url);
      }
      try {
        await api(`/hero_banners?id=eq.${banner.id}`, { method: 'DELETE' });
      } catch (err) {
        await api(`/products?id=eq.${banner.id}`, { method: 'DELETE' });
      }
      await fetchBanners();
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };

  const dragIndexRef = useRef(null);

  const handleDragStart = (index) => {
    dragIndexRef.current = index;
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) return;
    // Live reorder as you drag over
    const newBanners = [...banners];
    const [moved] = newBanners.splice(from, 1);
    newBanners.splice(index, 0, moved);
    dragIndexRef.current = index;
    setDragIndex(index);
    setDragOverIndex(index);
    setBanners(newBanners);
  };

  const handleDrop = async () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragIndexRef.current = null;
    try {
      await Promise.all(banners.map((b, i) =>
        api(`/hero_banners?id=eq.${b.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ sort_order: i })
        })
      ));
    } catch (err) {
      console.error('Failed to reorder:', err);
      await fetchBanners();
    }
  };

  return (
    <div className="adm-page-container">
      <div className="adm-page-header d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4" style={{ gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 className="adm-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image color="#ff6b35" /> Hero Banner Images
          </h1>
          <p className="adm-sub" style={{ marginBottom: '12px' }}>Upload carousel images to display on the home page hero slider.</p>
        </div>

        <button
          onClick={openAddModal}
          className="adm-btn adm-btn-primary"
          style={{ backgroundColor: '#ff6b35', borderColor: '#ff6b35', padding: '10px 20px', borderRadius: '10px' }}
        >
          <Plus size={18} className="mr-1" /> Add New Hero Banner
        </button>
      </div>

      {/* Hero Banner Images Grid */}
      <div className="adm-card">
        <div className="adm-card-hdr d-flex align-items-center justify-content-between">
          <h3 className="adm-card-title">Active Carousel Images ({banners.length})</h3>
        </div>
        <div className="adm-card-body">
          {loading ? (
            <div className="text-center py-5 text-muted">Loading banner images...</div>
          ) : banners.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center' }}>
              <Image size={52} color="#cbd5e1" style={{ marginBottom: 14 }} />
              <h4 className="adm-card-title mt-2">No Dynamic Banners Uploaded</h4>
              <p className="text-muted small mb-4">Click <strong>Add New Hero Banner</strong> to upload carousel images for your home page!</p>
              <button
                onClick={openAddModal}
                className="adm-btn adm-btn-primary"
                style={{ backgroundColor: '#ff6b35', borderColor: '#ff6b35' }}
              >
                <Upload size={16} className="mr-1" /> Upload First Banner
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop()}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  style={{
                    borderRadius: 14, overflow: 'hidden',
                    border: dragOverIndex === index ? '2px dashed #ff6b35' : '1px solid #e2e8f0',
                    background: dragOverIndex === index ? '#fff5ee' : '#fff',
                    boxShadow: dragIndex === index ? '0 8px 24px rgba(0,0,0,0.15)' : '0 1px 6px rgba(0,0,0,0.06)',
                    opacity: dragIndex === index ? 0.5 : 1,
                    cursor: 'grab',
                    transition: 'border 0.15s, background 0.15s',
                  }}
                >
                  {/* Drag handle hint */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 4px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#94a3b8', fontSize: 18, letterSpacing: 2 }}>⠿</span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Drag to reorder</span>
                  </div>
                  {/* Image */}
                  <div style={{ position: 'relative', width: '100%', background: '#f1f5f9' }}>
                    <img
                      src={banner.image_url}
                      alt={`Hero Banner ${index + 1}`}
                      style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'contain', background: '#f8fafc' }}
                    />
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      fontSize: '0.78rem', fontWeight: 700,
                      borderRadius: 6, padding: '4px 10px',
                    }}>
                      Slide #{index + 1}
                    </span>
                  </div>
                  {/* Footer row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Banner #{index + 1}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(banner)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Upload Modal Popup */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="adm-card shadow-lg"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              border: 'none'
            }}
          >
            {/* Close X Button at Top Right End */}
            <button
              type="button"
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer',
                zIndex: 10
              }}
              title="Close Modal"
            >
              <X size={20} />
            </button>

            <div style={{ padding: '24px 24px 20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 className="mb-0 d-flex align-items-center" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', gap: 10 }}>
                <Upload size={22} color="#ff6b35" />
                {editingBanner ? 'Edit Hero Banner Image' : 'Upload New Hero Banner Image'}
              </h3>
            </div>

            <div style={{ padding: '20px 24px 24px' }}>
              <form onSubmit={handleSaveBanner}>
                {/* Drag and Drop File Upload Area */}
                <div className="mb-4">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 8 }}>
                    {imageUrl ? 'Uploaded Banner Image Preview:' : 'Select Image File'}
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: imageUrl ? '16px' : '35px 20px',
                      border: isDragging ? '2.5px dashed #ff6b35' : (imageUrl ? '2px solid #22c55e' : '2px dashed #cbd5e1'),
                      borderRadius: '16px',
                      backgroundColor: isDragging ? '#fff5ee' : (imageUrl ? '#f0fdf4' : '#f8fafc'),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      position: 'relative',
                      minHeight: '180px'
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) uploadBannerFile(file);
                    }}
                  >
                    {uploading ? (
                      <div className="py-4 text-center">
                        <RefreshCw size={36} color="#ff6b35" className="spinning mb-2 mx-auto d-block" />
                        <span className="font-weight-bold text-dark d-block">Uploading image to server...</span>
                      </div>
                    ) : imageUrl ? (
                      <div className="w-100 text-center py-2">
                        <img
                          src={imageUrl}
                          alt="Banner Preview"
                          style={{ maxHeight: '190px', maxWidth: '100%', objectFit: 'contain', borderRadius: '10px' }}
                        />
                        <div className="mt-3 d-flex align-items-center justify-content-center">
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#ffffff',
                              color: '#ff6b35',
                              border: '1.5px solid #ff6b35',
                              padding: '8px 18px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              boxShadow: '0 2px 5px rgba(255, 107, 53, 0.15)'
                            }}
                          >
                            <Upload size={16} color="#ff6b35" />
                            {editingBanner ? 'Change Banner Image' : 'Change Image'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={36} color="#ff6b35" className="mb-2" />
                        <span className="font-weight-bold text-dark mb-1" style={{ fontSize: '1rem' }}>
                          Click to Choose Banner Image
                        </span>
                        <span className="text-muted small">PNG, JPG, WEBP formats supported</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="adm-btn adm-btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="adm-btn adm-btn-primary px-4"
                    disabled={saving || uploading || !imageUrl}
                    style={{
                      backgroundColor: imageUrl ? '#22c55e' : '#ff6b35',
                      borderColor: imageUrl ? '#22c55e' : '#ff6b35',
                      fontWeight: 700,
                      padding: '10px 24px'
                    }}
                  >
                    <Save size={16} className="mr-1" />
                    {saving ? 'Publishing Banner...' : editingBanner ? 'Update Banner Image' : 'Save & Publish Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SETTINGS  →  /admin/settings
══════════════════════════════════════════════════ */
const SETTINGS_KEY = '__SITE_SETTINGS__';

export async function fetchSiteSettings() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?category=eq.${encodeURIComponent(SETTINGS_KEY)}&limit=1`,
      { headers }
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (data && data.length > 0) {
      try { return JSON.parse(data[0].description || '{}'); } catch { return {}; }
    }
  } catch { }
  return {};
}

export function AdminSettings() {
  const [minTN,    setMinTN]    = useState('');
  const [minOther, setMinOther] = useState('');
  const [labelTN,    setLabelTN]    = useState('Tamil Nadu');
  const [labelOther, setLabelOther] = useState('Other State');
  const [announcement, setAnnouncement] = useState('');
  const [pricelistUrlState, setPricelistUrlState] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const s = await fetchSiteSettings();
      setMinTN   (s.min_order_tn    != null ? String(s.min_order_tn)    : '');
      setMinOther(s.min_order_other != null ? String(s.min_order_other) : '');
      setLabelTN   (s.state_label_tn    || 'Tamil Nadu');
      setLabelOther(s.state_label_other || 'Other State');
      setAnnouncement(s.announcement ?? '');
      setPricelistUrlState(s.pricelist_url || '');
      setLoading(false);
    })();
  }, []);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Max 20MB allowed.');
      return;
    }
    setUploadingPdf(true);
    try {
      const fileName = `pricelist.pdf`;
      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/pricelists/${fileName}`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/pdf',
            'x-upsert': 'true',
          },
          body: file,
        }
      );
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(err);
      }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/pricelists/${fileName}`;
      setPricelistUrlState(publicUrl);

      // Auto-save URL to DB immediately
      const existing = await api(`/products?category=eq.${encodeURIComponent(SETTINGS_KEY)}`);
      if (existing && existing.length > 0) {
        const current = (() => { try { return JSON.parse(existing[0].description || '{}'); } catch { return {}; } })();
        await api(`/products?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ description: JSON.stringify({ ...current, pricelist_url: publicUrl }), is_active: true }),
        });
      }
      toast.success('PDF uploaded and saved!');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const settingsObj = {
      min_order_tn:    parseFloat(minTN)    || 0,
      min_order_other: parseFloat(minOther) || 0,
      state_label_tn:    labelTN.trim()    || 'Tamil Nadu',
      state_label_other: labelOther.trim() || 'Other State',
      announcement:    announcement.trim(),
      pricelist_url:   pricelistUrlState || '',
    };
    const settingsJson = JSON.stringify(settingsObj);
    try { localStorage.setItem('sriveerafireworks_site_settings', settingsJson); } catch {}
    window.dispatchEvent(new CustomEvent('site_settings_updated', { detail: settingsObj }));
    try {
      const existing = await api(`/products?category=eq.${encodeURIComponent(SETTINGS_KEY)}`);
      if (existing && existing.length > 0) {
        await api(`/products?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ description: settingsJson, is_active: true }),
        });
      } else {
        await api('/products', {
          method: 'POST',
          body: JSON.stringify({ name: 'Site Settings', category: SETTINGS_KEY, description: settingsJson, price: 0, stock: 0, is_active: true }),
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) { console.error('Failed to save settings:', err); }
    setSaving(false);
  };

  return (
    <div className="adm-page-container">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings color="#ff6b35" /> Store Settings
          </h1>
          <p className="adm-sub">Set minimum order amounts per region. Customers below the limit cannot place an enquiry.</p>
        </div>
      </div>

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontWeight: 700 }}>
          <CheckCircle size={18} /> Settings saved and published successfully!
        </div>
      )}

      <div className="adm-card">
        <div className="adm-card-hdr">
          <div>
            <div className="adm-card-title">Minimum Order Amount</div>
            <div className="adm-card-sub">Set different minimums for Tamil Nadu customers and customers from other states.</div>
          </div>
        </div>
        <div className="adm-card-body">
          {loading ? (
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="adm-skeleton" style={{ flex: 1, height: 80, borderRadius: 10 }} />
              <div className="adm-skeleton" style={{ flex: 1, height: 80, borderRadius: 10 }} />
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
                {/* Tamil Nadu */}
                <div style={{ flex: '1 1 260px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 22 }}>🏛️</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>State 1 (Local)</div>
                      <div style={{ fontSize: 11, color: '#b45309' }}>Label shown on cart toggle</div>
                    </div>
                  </div>
                  <input
                    className="adm-form-input"
                    type="text"
                    placeholder="e.g. Tamil Nadu"
                    value={labelTN}
                    onChange={e => setLabelTN(e.target.value)}
                    style={{ background: '#fff', border: '1.5px solid #fcd34d', marginBottom: 10 }}
                  />
                  <div className="adm-inp-wrap">
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#ff6b35', fontSize: 16, pointerEvents: 'none', zIndex: 5 }}>₹</span>
                    <input
                      className="adm-form-input"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 1000"
                      value={minTN}
                      onChange={e => setMinTN(e.target.value)}
                      style={{ background: '#fff', border: '1.5px solid #fcd34d' }}
                    />
                  </div>
                  <div style={{ marginTop: 7, fontSize: 12, color: minTN && parseFloat(minTN) > 0 ? '#92400e' : '#b45309', fontWeight: 500 }}>
                    {minTN && parseFloat(minTN) > 0
                      ? `Customers must order at least ₹${parseFloat(minTN).toLocaleString('en-IN')}`
                      : 'Set to 0 or leave blank — no minimum'}
                  </div>
                </div>

                {/* Other States */}
                <div style={{ flex: '1 1 260px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 22 }}>🇮🇳</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 14 }}>State 2 (Other)</div>
                      <div style={{ fontSize: 11, color: '#3b82f6' }}>Label shown on cart toggle</div>
                    </div>
                  </div>
                  <input
                    className="adm-form-input"
                    type="text"
                    placeholder="e.g. Other State"
                    value={labelOther}
                    onChange={e => setLabelOther(e.target.value)}
                    style={{ background: '#fff', border: '1.5px solid #93c5fd', marginBottom: 10 }}
                  />
                  <div className="adm-inp-wrap">
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#3b82f6', fontSize: 16, pointerEvents: 'none', zIndex: 5 }}>₹</span>
                    <input
                      className="adm-form-input"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 2500"
                      value={minOther}
                      onChange={e => setMinOther(e.target.value)}
                      style={{ background: '#fff', border: '1.5px solid #93c5fd' }}
                    />
                  </div>
                  <div style={{ marginTop: 7, fontSize: 12, color: minOther && parseFloat(minOther) > 0 ? '#1e3a8a' : '#3b82f6', fontWeight: 500 }}>
                    {minOther && parseFloat(minOther) > 0
                      ? `Customers must order at least ₹${parseFloat(minOther).toLocaleString('en-IN')}`
                      : 'Set to 0 or leave blank — no minimum'}
                  </div>
                </div>
              </div>

              {/* Price List PDF Upload */}
              <div style={{ marginBottom: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: 4 }}>Price List PDF Document</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Upload a PDF price list sheet. This file will be downloaded by customers when they click "Download Pricelist" on the website.</div>
                
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div className="adm-inp-wrap" style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                        id="pricelist-pdf-upload"
                      />
                      <label
                        htmlFor="pricelist-pdf-upload"
                        className="adm-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          backgroundColor: uploadingPdf ? '#f1f5f9' : '#fff',
                          border: '1.5px dashed #ff6b35',
                          color: '#ff6b35',
                          padding: '12px 20px',
                          borderRadius: 10,
                          fontWeight: 700
                        }}
                      >
                        <Upload size={16} />
                        {uploadingPdf ? 'Uploading PDF...' : 'Choose PDF Price List'}
                      </label>
                    </div>
                  </div>

                  {pricelistUrlState && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>📄 pricelist.pdf</span>
                      <a
                        href={pricelistUrlState}
                        download="pricelist.pdf"
                        className="adm-btn adm-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Download PDF
                      </a>
                      <button
                        type="button"
                        className="adm-btn"
                        onClick={() => setPricelistUrlState('')}
                        style={{
                          backgroundColor: '#fef2f2',
                          borderColor: '#fca5a5',
                          color: '#dc2626',
                          padding: '6px 8px',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="adm-btn adm-btn-primary"
                disabled={saving}
                style={{ backgroundColor: '#ff6b35', borderColor: '#ff6b35', minWidth: 140 }}
              >
                <Save size={15} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Default export kept for backward compat ───────── */
export default AdminLayout;


/* ══════════════════════════════════════════════════
   ORDERS / ENQUIRIES  →  /admin/orders
══════════════════════════════════════════════════ */
// downloadOrderPDF is now handled by downloadAdminOrderPDF from utils/generateOrderPDF

export function AdminOrders() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear]   = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('/orders?order=created_at.desc');
      setOrders(res || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api(`/orders?id=eq.${orderId}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) { console.error(err); }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await api(`/orders?id=eq.${orderId}`, { method: 'DELETE' });
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) { console.error(err); }
  };

  const getStatusColorStyle = (status) => {
    const cfg = STATUS_CONFIG[status] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
    return { color: cfg.color, backgroundColor: cfg.bg, padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-block' };
  };

  const getOrderTotal = (order) => {
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      return items.reduce((s, i) => s + parseFloat(i.price || 0) * parseInt(i.quantity || 0), 0);
    } catch { return 0; }
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years  = [...new Set([new Date().getFullYear(), ...orders.map(o => new Date(o.created_at).getFullYear())])].sort((a,b) => b-a);

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase().trim();
    const dt = new Date(o.created_at);
    if (filterYear  !== 'all' && dt.getFullYear() !== parseInt(filterYear))  return false;
    if (filterMonth !== 'all' && dt.getMonth()    !== parseInt(filterMonth)) return false;
    if (!q) return true;
    return (o.customer_name || '').toLowerCase().includes(q) || (o.phone || '').toLowerCase().includes(q);
  });
  const filteredRevenue = filteredOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  return (
    <div className="adm-page-container">
      <div className="adm-page-header d-flex align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="adm-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart color="#ff6b35" /> Order Enquiries
          </h1>
          <p className="adm-sub">Manage enquiries, update statuses, and download PDF sheets.</p>
        </div>
      </div>

      {/* ── Filters + Search ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div className="adm-search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search className="si" />
          <input type="text" className="adm-form-input" placeholder="Search name or phone…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <CustomSelect
          value={filterYear}
          onChange={val => { setFilterYear(val); setFilterMonth('all'); }}
          options={[{ value: 'all', label: 'All Years' }, ...years.map(y => ({ value: y, label: String(y) }))]}
          minWidth={130}
        />
        <CustomSelect
          value={filterMonth}
          onChange={val => setFilterMonth(val)}
          options={[{ value: 'all', label: 'All Months' }, ...MONTHS.map((m, i) => ({ value: i, label: m }))]}
          minWidth={140}
        />
        {(filterYear !== 'all' || filterMonth !== 'all' || searchQuery) && (
          <div style={{ fontSize: '0.82rem', color: '#64748b', background: '#f1f5f9', borderRadius: 8, padding: '8px 12px', fontWeight: 600 }}>
            {filteredOrders.length} orders · ₹{filteredRevenue.toLocaleString('en-IN')}
          </div>
        )}
      </div>

      {/* ── Orders List ───────────────────────────────────────────────────────── */}
      <div className="adm-card adm-scroll-card">
        <div className="adm-scroll-list" style={{ padding: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <RefreshCw size={24} className="spinning" style={{ display: 'block', margin: '0 auto 8px' }} />
              Loading enquiries...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              {searchQuery || filterYear !== 'all' || filterMonth !== 'all' ? 'No matching enquiries found.' : 'No order enquiries found.'}
            </div>
          ) : (
            filteredOrders.map((order, idx) => {
              let items = [];
              try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch {}
              const totalVal  = items.reduce((acc, i) => acc + (parseFloat(i.price || 0) * (i.quantity || 0)), 0);
              const itemCount = items.reduce((acc, i) => acc + (i.quantity || 0), 0);
              let region = 'Tamil Nadu';
              let cleanAddress = order.address || '';
              if (cleanAddress.startsWith('[Other State]')) { region = 'Other State'; cleanAddress = cleanAddress.replace('[Other State]', '').trim(); }
              else if (cleanAddress.startsWith('[Tamil Nadu]')) { cleanAddress = cleanAddress.replace('[Tamil Nadu]', '').trim(); }
              const regionStyle = {
                backgroundColor: region === 'Tamil Nadu' ? '#fff7ed' : '#eff6ff',
                color: region === 'Tamil Nadu' ? '#c2410c' : '#1d4ed8',
                border: `1px solid ${region === 'Tamil Nadu' ? '#fed7aa' : '#bfdbfe'}`,
                padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-block',
              };

              return (
                <div key={order.id} className="order-card">
                  {/* Top row: serial + date + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ff6b35', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900, flexShrink: 0 }}>
                        {filteredOrders.length - idx}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: 1 }}>#{String(order.id).substring(0, 8)}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{fmtDate(order.created_at)}</div>
                      </div>
                    </div>
                    <span style={getStatusColorStyle(order.status || 'Payment Pending')}>{order.status || 'Payment Pending'}</span>
                  </div>

                  {/* Customer + region */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: 2 }}>{order.customer_name || '—'}</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>📞 {order.phone || '—'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <span style={regionStyle}>{region === 'Tamil Nadu' ? '🏛️ TN' : '🇮🇳 Other States'}</span>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4, lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {cleanAddress || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No address</span>}
                      </div>
                    </div>
                  </div>

                  {/* Total + actions */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#ff6b35', fontSize: '1rem' }}>₹{totalVal.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {order.phone && (
                        <a
                          href={`https://wa.me/91${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customer_name || ''},\n\nThank you for your order with Sri Veera Fireworks!\n\nYour order total: ₹${totalVal.toLocaleString('en-IN')}\n\nPlease let us know if you have any questions.`)}`}
                          target="_blank" rel="noreferrer"
                          className="adm-btn adm-btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, background: '#25d366', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                          title="Reply on WhatsApp"
                        >
                          💬 Reply
                        </a>
                      )}
                      <button onClick={() => downloadAdminOrderPDF(order, filteredOrders.length - idx)} className="adm-btn adm-btn-sm adm-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600 }} title="Download PDF">
                        <Download size={12} style={{ marginRight: 4 }} /> PDF
                      </button>
                      <CustomSelect
                        value={order.status || 'Payment Pending'}
                        options={[
                          { label: 'Payment Pending',   value: 'Payment Pending' },
                          { label: 'Payment Confirmed', value: 'Payment Confirmed' },
                          { label: 'Shipped',           value: 'Shipped' },
                          { label: 'Delivered',         value: 'Delivered' },
                        ]}
                        onChange={val => handleUpdateStatus(order.id, val)}
                        style={{ width: '160px' }}
                      />
                      <button onClick={() => handleDeleteOrder(order.id)} className="adm-btn adm-btn-sm" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626', padding: '6px 8px' }} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DASHBOARD  →  /admin/dashboard
══════════════════════════════════════════════════ */
export function AdminDashboard() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('all');

  useEffect(() => {
    api('/orders?order=created_at.desc')
      .then(res => setOrders(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getOrderTotal = (order) => {
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      return items.reduce((s, i) => s + parseFloat(i.price || 0) * parseInt(i.quantity || 0), 0);
    } catch { return 0; }
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years  = [...new Set([new Date().getFullYear(), ...orders.map(o => new Date(o.created_at).getFullYear())])].sort((a,b) => b-a);
  const curYear = new Date().getFullYear();

  const totalRevenue    = orders.reduce((s, o) => s + getOrderTotal(o), 0);
  const thisYearOrders  = orders.filter(o => new Date(o.created_at).getFullYear() === curYear);
  const thisYearRevenue = thisYearOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const thisMonth       = new Date().getMonth();
  const thisMonthOrders = thisYearOrders.filter(o => new Date(o.created_at).getMonth() === thisMonth);
  const thisMonthRevenue= thisMonthOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  const yearStats = years.map(yr => {
    const yo = orders.filter(o => new Date(o.created_at).getFullYear() === yr);
    return { year: yr, count: yo.length, revenue: yo.reduce((s, o) => s + getOrderTotal(o), 0) };
  });

  const baseForMonth = filterYear === 'all' ? orders : orders.filter(o => new Date(o.created_at).getFullYear() === parseInt(filterYear));
  const monthStats = MONTHS.map((m, idx) => {
    const mo = baseForMonth.filter(o => new Date(o.created_at).getMonth() === idx);
    return { month: m, idx, count: mo.length, revenue: mo.reduce((s, o) => s + getOrderTotal(o), 0) };
  });
  const maxMonthRev = Math.max(...monthStats.map(m => m.revenue), 1);

  if (loading) return (
    <div className="adm-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <RefreshCw size={28} className="spinning" color="#ff6b35" />
    </div>
  );

  return (
    <div className="adm-page-container">
      <div className="adm-page-header mb-4">
        <h1 className="adm-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp color="#ff6b35" /> Dashboard
        </h1>
        <p className="adm-sub">Overview of all order enquiries and revenue.</p>
      </div>

      {/* ── Top stat cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Orders',      value: orders.length,                                         icon: <ShoppingCart size={22} color="#ff6b35"/>, bg: '#fff5ef', border: '#fed7aa', val_color: '#ff6b35' },
          { label: 'Total Revenue',     value: `₹${totalRevenue.toLocaleString('en-IN')}`,            icon: <TrendingUp   size={22} color="#22c55e"/>, bg: '#f0fdf4', border: '#86efac', val_color: '#16a34a' },
          { label: `${curYear} Orders`, value: thisYearOrders.length,                                 icon: <Star         size={22} color="#8b5cf6"/>, bg: '#faf5ff', border: '#c4b5fd', val_color: '#7c3aed' },
          { label: `${curYear} Revenue`,value: `₹${thisYearRevenue.toLocaleString('en-IN')}`,         icon: <ArrowUpRight size={22} color="#0ea5e9"/>, bg: '#f0f9ff', border: '#7dd3fc', val_color: '#0284c7' },
          { label: 'This Month Orders', value: thisMonthOrders.length,                                icon: <Clock        size={22} color="#f59e0b"/>, bg: '#fffbeb', border: '#fde68a', val_color: '#d97706' },
          { label: 'This Month Rev.',   value: `₹${thisMonthRevenue.toLocaleString('en-IN')}`,        icon: <CheckCircle  size={22} color="#10b981"/>, bg: '#ecfdf5', border: '#6ee7b7', val_color: '#059669' },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, border: `1.5px solid ${card.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {card.icon}
              <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#64748b' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: card.val_color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Year-wise summary ───────────────────────────────────────────────── */}
      {yearStats.length > 0 && (
        <div className="adm-card" style={{ marginBottom: 20, padding: '16px 18px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Year-wise Summary</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {yearStats.map(y => (
              <div key={y.year} style={{ background: y.year === curYear ? '#fff5ef' : '#f8fafc', border: `1.5px solid ${y.year === curYear ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 16px', minWidth: 140 }}>
                <div style={{ fontWeight: 900, color: '#ff6b35', fontSize: '1.1rem' }}>{y.year}</div>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 3 }}>{y.count} orders</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>₹{y.revenue.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Month-wise bar chart ─────────────────────────────────────────────── */}
      <div className="adm-card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Month-wise Summary
          </div>
          <CustomSelect
            value={filterYear}
            onChange={val => setFilterYear(val)}
            options={[{ value: 'all', label: 'All Years' }, ...years.map(y => ({ value: y, label: String(y) }))]}
            minWidth={130}
          />
        </div>

        {/* Bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, overflowX: 'auto', paddingBottom: 4 }}>
          {monthStats.map(m => {
            const pct = maxMonthRev > 0 ? (m.revenue / maxMonthRev) * 100 : 0;
            const isCurrentMonth = m.idx === thisMonth && (filterYear === 'all' || parseInt(filterYear) === curYear);
            return (
              <div key={m.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: '1 0 40px', minWidth: 40 }}>
                {m.count > 0 && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {m.count}
                  </div>
                )}
                <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: m.count === 0 ? '#f1f5f9' : isCurrentMonth ? '#ff6b35' : '#fb923c', height: `${Math.max(pct, m.count > 0 ? 6 : 2)}%`, transition: 'height 0.3s', position: 'relative', minHeight: m.count > 0 ? 6 : 2 }} />
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isCurrentMonth ? '#ff6b35' : '#64748b' }}>{m.month}</div>
              </div>
            );
          })}
        </div>

        {/* Month detail cards for months with data */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {monthStats.filter(m => m.count > 0).map(m => (
            <div key={m.month} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', minWidth: 110 }}>
              <div style={{ fontWeight: 700, color: '#0ea5e9', fontSize: '0.85rem' }}>{m.month}</div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>{m.count} orders</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>₹{m.revenue.toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
