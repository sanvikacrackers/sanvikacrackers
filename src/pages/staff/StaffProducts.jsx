import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fmtINR } from '../../utils/billingUtils';

export default function StaffProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    supabase
      .from('products')
      .select('id, product_code, name, category, price, mrp, discount_percentage, barcode, image_url, is_active')
      .eq('is_active', true)
      .order('product_code')
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  const categories = [...new Set(products.map((p) => p.category))].sort();

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q
      || p.name?.toLowerCase().includes(q)
      || p.product_code?.toLowerCase().includes(q)
      || p.barcode?.toLowerCase().includes(q);
    const matchC = !category || p.category === category;
    return matchQ && matchC;
  });

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Products</h1>
        <Link to="/staff/new-bill" className="sf-btn sf-btn-primary sf-btn-sm">
          <Plus style={{ width: 14, height: 14 }} /> New Bill
        </Link>
      </div>

      <div className="sf-card" style={{ marginBottom: 16 }}>
        <div className="sf-card-body" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="sf-input-wrap" style={{ flex: 1, minWidth: 200 }}>
              <Search className="sf-input-icon" />
              <input
                className="sf-input with-icon"
                placeholder="Search by name, code, or barcode…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="sf-input"
              style={{ width: 'auto' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>
      ) : (
        <div className="sf-products-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 14,
        }}>
          {filtered.map((p) => (
            <div key={p.id} className="sf-card" style={{ overflow: 'hidden' }}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} loading="lazy" />
              ) : (
                <div style={{ width: '100%', height: 140, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package style={{ width: 40, height: 40, color: '#cbd5e1' }} />
                </div>
              )}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>#{p.product_code}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8' }}>{fmtINR(p.price)}</div>
                {p.mrp && Number(p.mrp) > Number(p.price) && (
                  <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>{fmtINR(p.mrp)}</div>
                )}
                {p.barcode && (
                  <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', marginTop: 4 }}>
                    {p.barcode}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{p.category}</div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <div className="sf-empty">
                <Package />
                <div className="sf-empty-title">No products found</div>
                <div className="sf-empty-desc">Try a different search</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
