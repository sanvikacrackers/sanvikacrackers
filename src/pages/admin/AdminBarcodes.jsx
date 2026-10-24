import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Plus, Minus, Printer, Download, X, Barcode, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import { supabase } from '../../lib/supabase';
import { fmtINR } from '../../utils/billingUtils';
import '../../Staff.css';

/* ── Render a single barcode SVG via JsBarcode ── */
const jb = typeof JsBarcode === 'function' ? JsBarcode : JsBarcode?.default;

function makeSvgHtml(value, height, fontSize) {
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    jb(svg, value, {
      format: 'CODE128',
      height,
      fontSize,
      displayValue: true,
      margin: 4,
    });
    svg.setAttribute('width', '100%');
    return svg.outerHTML;
  } catch {
    return '';
  }
}

function BarcodeImage({ value, height = 50, fontSize = 11 }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    if (value) setHtml(makeSvgHtml(value, height, fontSize));
  }, [value, height, fontSize]);
  if (!value || !html) return <div style={{ fontSize: 11, color: '#94a3b8', padding: 8 }}>No barcode</div>;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ── Generate a barcode value from product code ── */
function generateBarcodeValue(product) {
  // Use existing product_code; prefix with SC to ensure Code128 compatibility
  const raw = (product.product_code || '').replace(/[^\x20-\x7E]/g, '');
  return raw ? `SC${raw.padStart(5, '0')}` : `SC${Date.now().toString().slice(-8)}`;
}

/* ── Label preview for the print sheet ── */
function LabelCell({ product, showPrice }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    if (product.barcode) setHtml(makeSvgHtml(product.barcode, 36, 9));
  }, [product.barcode]);

  return (
    <div className="barcode-label">
      <div className="barcode-label-name" title={product.name}>{product.name}</div>
      <div className="barcode-label-code">#{product.product_code}</div>
      {product.barcode && html
        ? <div dangerouslySetInnerHTML={{ __html: html }} style={{ width: '100%' }} />
        : <div style={{ fontSize: 9, color: '#999', padding: 4 }}>No barcode</div>}
      {showPrice && product.price && (
        <div className="barcode-label-price">{fmtINR(product.price)}</div>
      )}
    </div>
  );
}

export default function AdminBarcodes() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]); // [{ product, qty }]
  const [showPrice, setShowPrice] = useState(true);
  const [labelsPerRow, setLabelsPerRow] = useState(4);
  const [generating, setGenerating] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, product_code, name, category, price, barcode, image_url, is_active')
      .order('product_code');
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  /* ── Generate missing barcodes for all products ── */
  const generateAllBarcodes = async () => {
    const missing = products.filter((p) => !p.barcode);
    if (missing.length === 0) { toast('All products already have barcodes'); return; }
    if (!window.confirm(`Generate barcodes for ${missing.length} product(s)?`)) return;

    setGenerating(true);
    let ok = 0;
    for (const p of missing) {
      const barcodeValue = generateBarcodeValue(p);
      const { error } = await supabase
        .from('products')
        .update({ barcode: barcodeValue })
        .eq('id', p.id);
      if (!error) ok++;
    }
    toast.success(`Generated ${ok} barcodes`);
    await loadProducts();
    setGenerating(false);
  };

  /* ── Generate barcode for a single product ── */
  const generateOne = async (product) => {
    const barcodeValue = generateBarcodeValue(product);
    const { error } = await supabase
      .from('products')
      .update({ barcode: barcodeValue })
      .eq('id', product.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Barcode generated for ${product.name}`);
    loadProducts();
  };

  /* ── Add to print selection ── */
  const addToSelection = (product) => {
    if (!product.barcode) {
      toast.error('Generate a barcode for this product first.');
      return;
    }
    setSelected((prev) => {
      const existing = prev.find((s) => s.product.id === product.id);
      if (existing) return prev.map((s) => s.product.id === product.id ? { ...s, qty: s.qty + 1 } : s);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id, val) => {
    const n = Math.max(1, Math.min(999, Number(val) || 1));
    setSelected((prev) => prev.map((s) => s.product.id === id ? { ...s, qty: n } : s));
  };

  const removeFromSelection = (id) => setSelected((prev) => prev.filter((s) => s.product.id !== id));

  const totalLabels = selected.reduce((s, e) => s + e.qty, 0);

  /* ── Build flat label array for printing ── */
  const labels = selected.flatMap(({ product, qty }) =>
    Array.from({ length: qty }, (_, i) => ({ ...product, _key: `${product.id}-${i}` }))
  );

  /* ── Print — open dedicated window ── */
  const handlePrint = () => {
    if (labels.length === 0) { toast.error('Add at least one product to print'); return; }

    const labelHtml = labels.map((p) => {
      const svgHtml = p.barcode ? makeSvgHtml(p.barcode, 40, 9) : '';
      return `<div class="label">
        <div class="lname" title="${p.name}">${p.name}</div>
        <div class="lcode">#${p.product_code}</div>
        ${svgHtml ? `<div class="lbc">${svgHtml}</div>` : '<div class="lno">No barcode</div>'}
        ${showPrice && p.price ? `<div class="lprice">&#8377;${parseFloat(p.price).toFixed(2)}</div>` : ''}
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Barcode Labels</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;}
  .sheet{display:grid;grid-template-columns:repeat(${labelsPerRow},1fr);gap:4px;padding:6mm;}
  .label{border:1px solid #ccc;padding:4px 6px;text-align:center;break-inside:avoid;}
  .lname{font-size:8px;font-weight:700;margin-bottom:1px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
  .lcode{font-size:7px;color:#666;margin-bottom:2px;}
  .lbc svg{width:100%!important;display:block;}
  .lno{font-size:8px;color:#999;padding:4px 0;}
  .lprice{font-size:10px;font-weight:900;margin-top:2px;}
  @media print{@page{margin:4mm;}}
</style></head><body>
<div class="sheet">${labelHtml}</div>
</body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return !q
      || p.name?.toLowerCase().includes(q)
      || p.product_code?.toLowerCase().includes(q)
      || p.barcode?.toLowerCase().includes(q);
  });

  const missingCount = products.filter((p) => !p.barcode).length;

  return (
    <div className="staff-root" style={{ background: 'transparent' }}>
      {/* Screen UI (hidden on print) */}
      <div className="no-print">
        <div className="barcode-page-header">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Barcode Printing</h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
              {products.length} products · {missingCount} missing barcodes
            </p>
          </div>
          <div className="barcode-page-actions">
            {missingCount > 0 && (
              <button
                className="sf-btn sf-btn-secondary"
                onClick={generateAllBarcodes}
                disabled={generating}
              >
                <Barcode style={{ width: 14, height: 14 }} />
                {generating ? 'Generating…' : `Generate ${missingCount} Missing`}
              </button>
            )}
            <button
              className="sf-btn sf-btn-primary barcode-header-print"
              onClick={handlePrint}
              disabled={labels.length === 0}
            >
              <Printer style={{ width: 14, height: 14 }} />
              Print {totalLabels > 0 ? `${totalLabels} Labels` : 'Labels'}
            </button>
          </div>
        </div>

        <div className="barcode-layout">
          {/* Left: Product list */}
          <div>
            <div className="sf-card" style={{ marginBottom: 12 }}>
              <div className="sf-card-body" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <div className="sf-input-wrap" style={{ flex: 1 }}>
                    <Search className="sf-input-icon" />
                    <input
                      className="sf-input with-icon"
                      placeholder="Search products…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="sf-table-wrap">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th className="barcode-sn-col" style={{ color: '#94a3b8' }}>#</th><th className="barcode-cb-col"></th><th>Product</th><th className="barcode-col-hide">Code</th><th className="barcode-col-hide">Barcode</th><th className="barcode-col-hide">Preview</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1,2,3,4,5,6].map(i => (
                          <tr key={i}>
                            <td><div className="adm-skeleton" style={{ width: 16, height: 13 }} /></td>
                            <td><div className="adm-skeleton" style={{ width: 16, height: 16, borderRadius: 3 }} /></td>
                            <td><div className="adm-skeleton" style={{ width: 180, height: 15 }} /></td>
                            <td><div className="adm-skeleton" style={{ width: 80, height: 13 }} /></td>
                            <td className="barcode-col-hide"><div className="adm-skeleton" style={{ width: 110, height: 13 }} /></td>
                            <td className="barcode-col-hide"><div className="adm-skeleton" style={{ width: 120, height: 32 }} /></td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <div className="adm-skeleton" style={{ width: 50, height: 28, borderRadius: 6 }} />
                                <div className="adm-skeleton" style={{ width: 50, height: 28, borderRadius: 6 }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="sf-table-wrap">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th className="barcode-sn-col" style={{ color: '#94a3b8' }}>#</th>
                          <th className="barcode-cb-col">
                            <input
                              type="checkbox"
                              title="Select all"
                              checked={filtered.filter((p) => p.barcode).length > 0 && filtered.filter((p) => p.barcode).every((p) => selected.find((s) => s.product.id === p.id))}
                              onChange={(e) => {
                                const barcoded = filtered.filter((p) => p.barcode);
                                if (e.target.checked) {
                                  barcoded.forEach((p) => {
                                    if (!selected.find((s) => s.product.id === p.id)) addToSelection(p);
                                  });
                                } else {
                                  barcoded.forEach((p) => removeFromSelection(p.id));
                                }
                              }}
                            />
                          </th>
                          <th>Product</th>
                          <th className="barcode-col-hide">Code</th>
                          <th className="barcode-col-hide">Barcode</th>
                          <th className="barcode-col-hide">Preview</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, idx) => {
                          const selEntry = selected.find((s) => s.product.id === p.id);
                          return (
                            <tr key={p.id} style={selEntry ? { background: '#dcfce7' } : undefined}>
                              <td className="barcode-sn-col" style={{ color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                              <td className="barcode-cb-col">
                                <input
                                  type="checkbox"
                                  checked={!!selEntry}
                                  disabled={!p.barcode}
                                  onChange={(e) => {
                                    if (e.target.checked) addToSelection(p);
                                    else removeFromSelection(p.id);
                                  }}
                                />
                              </td>
                              <td style={{ fontWeight: 600 }}>{p.name}</td>
                              <td className="barcode-col-hide" style={{ fontSize: 12, color: '#64748b' }}>{p.product_code}</td>
                              <td className="barcode-col-hide" style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>
                                {p.barcode || <span style={{ color: '#f59e0b' }}>Not set</span>}
                              </td>
                              <td className="barcode-col-hide">
                                {p.barcode && (
                                  <div style={{ width: 120, overflow: 'hidden' }}>
                                    <BarcodeImage value={p.barcode} height={32} width={1} fontSize={7} />
                                  </div>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {selEntry ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                    <button className="bill-qty-btn" onClick={() => updateQty(p.id, selEntry.qty - 1)}>
                                      <Minus style={{ width: 10, height: 10 }} />
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={selEntry.qty}
                                      onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); updateQty(p.id, v || '1'); }}
                                      style={{ width: 36, textAlign: 'center', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                                    />
                                    <button className="bill-qty-btn" onClick={() => updateQty(p.id, selEntry.qty + 1)}>
                                      <Plus style={{ width: 10, height: 10 }} />
                                    </button>
                                    <button
                                      className="sf-btn sf-btn-ghost sf-btn-sm barcode-remove-btn"
                                      style={{ padding: '3px 6px' }}
                                      onClick={() => removeFromSelection(p.id)}
                                      title="Remove from queue"
                                    >
                                      <X style={{ width: 12, height: 12 }} />
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    {!p.barcode && (
                                      <button
                                        className="sf-btn sf-btn-secondary sf-btn-sm"
                                        onClick={() => generateOne(p)}
                                        title="Generate barcode"
                                      >
                                        <Barcode style={{ width: 12, height: 12 }} />
                                        Gen
                                      </button>
                                    )}
                                    <button
                                      className="sf-btn sf-btn-primary sf-btn-sm"
                                      onClick={() => addToSelection(p)}
                                      disabled={!p.barcode}
                                      title={!p.barcode ? 'Generate barcode first' : 'Add to print queue'}
                                    >
                                      <Plus style={{ width: 12, height: 12 }} />
                                      Add
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Print selection */}
          <div className="sf-card barcode-queue-card">
            <div className="sf-card-header">
              <span className="sf-card-title">Print Queue</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{totalLabels} labels</span>
            </div>
            <div className="sf-card-body">
              {selected.length === 0 ? (
                <div className="sf-empty" style={{ padding: '20px 0' }}>
                  <Barcode />
                  <div className="sf-empty-desc">Add products to print their barcodes</div>
                </div>
              ) : (
                <>
                  {selected.map(({ product, qty }) => (
                    <div key={product.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 0', borderBottom: '1px solid #e2e8f0',
                    }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>#{product.product_code}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button className="bill-qty-btn" onClick={() => updateQty(product.id, qty - 1)}>
                          <Minus style={{ width: 10, height: 10 }} />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={qty}
                          onChange={(e) => { const v = e.target.value.replace(/\D/g,''); updateQty(product.id, v || '1'); }}
                          style={{ width: 44, textAlign: 'center', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                        />
                        <button className="bill-qty-btn" onClick={() => updateQty(product.id, qty + 1)}>
                          <Plus style={{ width: 10, height: 10 }} />
                        </button>
                      </div>
                      <button
                        className="sf-btn sf-btn-ghost sf-btn-sm"
                        onClick={() => removeFromSelection(product.id)}
                      >
                        <X style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  ))}

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={showPrice}
                        onChange={(e) => setShowPrice(e.target.checked)}
                      />
                      Show price on labels
                    </label>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Labels per row</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[2, 3, 4, 5, 6].map((n) => (
                          <button
                            key={n}
                            onClick={() => setLabelsPerRow(n)}
                            style={{
                              padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                              border: `1.5px solid ${labelsPerRow === n ? '#7F1D1D' : '#e2e8f0'}`,
                              background: labelsPerRow === n ? '#7F1D1D' : '#fff',
                              color: labelsPerRow === n ? '#fff' : '#475569',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className="sf-btn sf-btn-primary sf-btn-block"
                      onClick={handlePrint}
                    >
                      <Printer style={{ width: 15, height: 15 }} />
                      Print {totalLabels} Label{totalLabels !== 1 ? 's' : ''}
                    </button>
                    <button
                      className="sf-btn sf-btn-ghost sf-btn-sm sf-btn-block"
                      style={{ marginTop: 6 }}
                      onClick={() => { if (window.confirm('Clear print queue?')) setSelected([]); }}
                    >
                      Clear Queue
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visible print preview (screen only) */}
      {labels.length > 0 && (
        <div className="no-print" style={{ marginTop: 20 }}>
          <div className="sf-card">
            <div className="sf-card-header">
              <span className="sf-card-title">Print Preview — {totalLabels} labels</span>
            </div>
            <div style={{ padding: 16, background: '#f8fafc' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${labelsPerRow}, 1fr)`,
                  gap: 6,
                  maxWidth: '100%',
                }}
              >
                {labels.slice(0, labelsPerRow * 3).map((product) => (
                  <LabelCell key={product._key} product={product} showPrice={showPrice} />
                ))}
              </div>
              {labels.length > labelsPerRow * 3 && (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 12, padding: 8 }}>
                  … and {labels.length - labelsPerRow * 3} more labels (shown on print)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
