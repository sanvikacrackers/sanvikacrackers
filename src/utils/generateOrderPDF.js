import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { buildPageHTML, ITEMS_PER_PAGE } from './orderPdfTemplate';

async function renderPage(html) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  container.innerHTML = html;
  document.body.appendChild(container);
  const el = container.querySelector('.wrap') || container.firstElementChild;

  await new Promise(r => setTimeout(r, 400));

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 560,
  });

  document.body.removeChild(container);
  return canvas;
}

async function buildPDF(data, fileName) {
  const { name, phone, state, address, items, total, estimateNo } = data;

  const chunks = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) chunks.push(items.slice(i, i + ITEMS_PER_PAGE));
  if (chunks.length === 0) chunks.push([]);

  const pdf = new jsPDF('p', 'mm', 'a5');

  for (let idx = 0; idx < chunks.length; idx++) {
    const html = buildPageHTML({
      name, phone, state, address,
      pageItems: chunks[idx],
      startIdx:  idx * ITEMS_PER_PAGE,
      pageNum:   idx + 1,
      isLastPage: idx === chunks.length - 1,
      allTotal:  total,
      allCount:  items.length,
      estimateNo,
    });

    const canvas  = await renderPage(html);
    const imgData = canvas.toDataURL('image/jpeg', 0.9);

    if (idx > 0) { pdf.addPage(); pdf.setFillColor(255, 255, 255); }
    pdf.addImage(imgData, 'JPEG', 10, 10, 128, 190);
  }

  pdf.save(fileName);
}

/** Called from Cart.jsx */
export async function generateOrderPDF({ form, cartItems, cartTotal, estimateNo }) {
  const data = {
    name:       form.name,
    phone:      form.phone,
    state:      form.isTN ? 'Tamil Nadu' : 'Other State',
    address:    form.address || '',
    estimateNo: estimateNo ? 2000 + estimateNo : null,
    items:      cartItems.map(({ product, qty }) => ({
      code:     product.product_code || '',
      name:     product.name,
      qty,
      price:    parseFloat(product.price || 0),
      mrp:      parseFloat(product.mrp || product.price || 0),
      discount: parseFloat(product.discount_percentage || 0),
    })),
    total: cartTotal,
  };

  const cleanName  = (form.name  || 'Customer').replace(/\s+/g, '_');
  const cleanPhone = (form.phone || 'NoPhone').replace(/\s+/g, '_');
  await buildPDF(data, `SriVeera_Order_${cleanName}_${cleanPhone}.pdf`);
}

/** Called from Admin.jsx */
export async function downloadAdminOrderPDF(order, serialNo) {
  let items = [];
  try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch {}

  let state   = 'Tamil Nadu';
  let address = order.address || '';
  if (address.startsWith('[Other State]')) { state = 'Other State'; address = address.replace('[Other State]', '').trim(); }
  else if (address.startsWith('[Tamil Nadu]')) { address = address.replace('[Tamil Nadu]', '').trim(); }

  const total = items.reduce((s, i) => s + parseFloat(i.price || 0) * parseInt(i.quantity || 0), 0);

  const data = {
    name:       order.customer_name,
    phone:      order.phone,
    state,
    address,
    estimateNo: serialNo ? 2000 + serialNo : null,
    items:      items.map(i => ({
      code:     i.product_code || '',
      name:     i.name,
      qty:      i.quantity,
      price:    parseFloat(i.price || 0),
      mrp:      parseFloat(i.mrp || i.price || 0),
      discount: parseFloat(i.discount_percentage || 0),
    })),
    total,
  };

  const cleanName  = (order.customer_name || 'Customer').replace(/\s+/g, '_');
  const cleanPhone = (order.phone || 'NoPhone').replace(/\s+/g, '_');
  await buildPDF(data, `SriVeera_Order_${cleanName}_${cleanPhone}.pdf`);
}
