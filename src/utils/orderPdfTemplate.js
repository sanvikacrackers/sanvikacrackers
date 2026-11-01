/**
 * Builds the complete printable HTML for the order PDF.
 * Uses browser native print (window.print) → no screenshot artifacts.
 * Each page is a .page div with @page A5 CSS for perfect sizing.
 */

const HDR_IMG = '/pdfbanner.png';

export const ITEMS_PER_PAGE = 20;

function numberToWords(amount) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function convert(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n/10)] + ' ' + ones[n%10] + ' ';
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred ' + convert(n%100);
    if (n < 100000) return convert(Math.floor(n/1000)) + 'Thousand ' + convert(n%1000);
    if (n < 10000000) return convert(Math.floor(n/100000)) + 'Lakh ' + convert(n%100000);
    return convert(Math.floor(n/10000000)) + 'Crore ' + convert(n%10000000);
  }
  return convert(Math.round(parseFloat(amount||0))).trim() || 'Zero';
}

function buildPageContent({ name, phone, state, address, pageItems, startIdx,
                             pageNum, isLastPage, allTotal, allCount, estimateNo }) {
  const fmt  = (n) => parseFloat(n||0).toFixed(2);
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\//g, '-');
  const estNo = estimateNo || String(Date.now()).slice(-4);
  const words = numberToWords(allTotal);

  const pageSubtotal = pageItems.reduce(
    (s,i) => s + parseFloat(i.price||0) * parseInt(i.qty||0), 0
  );

  const rows = pageItems.map((item, i) => {
    const idx = startIdx + i + 1;
    const rate = parseFloat(item.price||0);
    const mrp  = parseFloat(item.mrp||0) || rate;
    const dis  = mrp > rate ? Math.round((1 - rate / mrp) * 100) : 0;
    const sub  = rate * parseInt(item.qty||0);
    return `<tr>
      <td class="tc">${idx}</td>
      <td class="tc">${item.code||''}</td>
      <td class="tl nm">${item.name||'\u2014'}</td>
      <td class="tr">${fmt(mrp)}</td>
      <td class="tc">${dis}%</td>
      <td class="tc">${item.qty}</td>
      <td class="tr">${fmt(rate)}</td>
      <td class="tr">${fmt(sub)}</td>
    </tr>`;
  }).join('');

  const subtotRow = isLastPage
    ? `<tr class="subtot">
        <td colspan="6"><strong>No Of Items : ${allCount}</strong></td>
        <td></td>
        <td class="tr">${fmt(allTotal)}</td>
      </tr>`
    : `<tr class="subtot">
        <td colspan="5"></td>
        <td class="tc">${pageItems.length}</td>
        <td></td>
        <td class="tr">${fmt(pageSubtotal)}</td>
      </tr>`;

  const bottomSection = isLastPage
    ? `<div class="bill-section">
        <div class="bill-left"><div class="rupees">Rupees : ${words} Only</div></div>
        <div class="bill-right">
          <div class="bill-total-row"><span>Bill total</span><span>${fmt(allTotal)}</span></div>
        </div>
      </div>`
    : `<div class="continued-wrap">
        <div class="cont-left"></div>
        <div class="cont-right">
          <div class="continued">Continued...</div>
          <div class="page-num">Page ${pageNum}</div>
        </div>
      </div>`;

  return `
  <div class="page">
    <div class="hdr"><img src="${HDR_IMG}" alt="Sanvika Crackers"/></div>
    <div class="cust">
      <div class="cust-top">
        <div class="cust-left">
          <div><strong>Name &nbsp;&nbsp;&nbsp;:</strong> ${name||'\u2014'}</div>
          <div><strong>Address :</strong> ${address||'\u2014'}</div>
        </div>
        <div class="cust-right">
          <div><strong>Estimate No : ${estNo}</strong></div>
          <div><strong>Date : ${date}</strong></div>
        </div>
      </div>
      <div class="cust-contact"><strong>Contact &nbsp;:</strong> ${phone||'\u2014'} &nbsp;&nbsp; <strong>State :</strong> ${state||'\u2014'}</div>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:30px">SIno</th>
            <th style="width:36px">Code</th>
            <th>Cracker name</th>
            <th style="width:58px">Actual</th>
            <th style="width:38px">Dis %</th>
            <th style="width:30px">Qty</th>
            <th style="width:58px">Rate</th>
            <th style="width:62px">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${subtotRow}
        </tbody>
      </table>
      <div class="spacer"></div>
    </div>
    ${bottomSection}
    <div class="footer">
      <span>Thank you for business with us!</span>
      <span>www.sanvikacrackers.com</span>
    </div>
  </div>`;
}


/**
 * Single-page HTML for html2canvas rendering (px units, 560x795px = A5 proportions).
 * Called once per page chunk; canvas is added to jsPDF for auto-download.
 */
export function buildPageHTML(params) {
  // Get inner page content and swap .page class to .wrap for standalone rendering
  const inner = buildPageContent(params)
    .replace('<div class="page">', '<div class="wrap">');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,Helvetica,sans-serif; background:#fff; }
  .wrap {
    width:560px; height:795px; background:#fff;
    border:1px solid #000;
    display:flex; flex-direction:column;
  }
  /* Header */
  .hdr { border-bottom:1px solid #000; flex-shrink:0; }
  .hdr img { width:100%; display:block; }
  /* Customer — matches reference: Name/Address left, Estimate/Date right, Contact below */
  .cust { border-bottom:1px solid #000; padding:6px 12px; font-size:9px; flex-shrink:0; }
  .cust-top { display:flex; justify-content:space-between; }
  .cust-left div { margin-bottom:3px; }
  .cust-right { text-align:right; }
  .cust-right div { margin-bottom:3px; }
  .cust-contact { margin-top:3px; font-size:9px; }
  /* Table */
  .tbl-wrap { flex:1; display:flex; flex-direction:column; min-height:0; }
  table { width:100%; border-collapse:collapse; }
  th { border:1px solid #aaa; padding:4px 8px; font-size:9px; font-weight:700; text-align:center; background:#fff; }
  td { border:1px solid #ccc; padding:5px 8px; font-size:9px; color:#000; line-height:1.4; }
  .tc { text-align:center; }
  .tl { text-align:left; }
  .tr { text-align:right; }
  .nm { font-weight:600; }
  tr.subtot td { font-weight:700; border-top:1px solid #888; background:#fff; }
  /* Spacer fills remaining vertical space */
  .spacer { flex:1; border-left:1px solid #ccc; border-right:1px solid #ccc; }
  /* Continued — left half empty, right half has text, divider in middle */
  .continued-wrap { display:flex; border-top:1px solid #888; flex-shrink:0; min-height:50px; }
  .cont-left { flex:1; border-right:1px solid #888; }
  .cont-right { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px 0; }
  .continued { font-size:9px; font-style:italic; font-weight:700; margin-bottom:4px; }
  .page-num { font-size:9px; font-weight:700; }
  /* Bill section (last page) */
  .bill-section { display:flex; border-top:1px solid #888; flex-shrink:0; }
  .bill-left { flex:1; padding:8px 12px; border-right:1px solid #ccc; }
  .rupees { font-size:9px; font-weight:700; }
  .bill-right { display:flex; flex-direction:column; justify-content:center; padding:6px 12px; min-width:130px; }
  .bill-total-row { display:flex; justify-content:space-between; font-size:9px; font-weight:700; gap:10px; }
  /* Footer — outside inner border */
  .footer { border-top:1px solid #bbb; padding:4px 12px; display:flex; justify-content:space-between; font-size:8px; color:#444; flex-shrink:0; }
</style>
</head>
<body>${inner}</body>
</html>`;
}

export function buildPrintHTML({ name, phone, state, address, items, total, estimateNo }) {
  const chunks = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    chunks.push(items.slice(i, i + ITEMS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  const pages = chunks.map((pageItems, idx) =>
    buildPageContent({
      name, phone, state, address,
      pageItems,
      startIdx: idx * ITEMS_PER_PAGE,
      pageNum: idx + 1,
      isLastPage: idx === chunks.length - 1,
      allTotal: total,
      allCount: items.length,
      estimateNo,
    })
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,Helvetica,sans-serif; background:#fff; }

  @page { size: A5 portrait; margin: 0; }

  .page {
    width: 148mm;
    height: 210mm;
    overflow: hidden;
    page-break-after: always;
    border: 1px solid #000;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }

  /* Header */
  .hdr { border-bottom:1px solid #000; flex-shrink:0; }
  .hdr img { width:100%; display:block; }

  /* Customer */
  .cust { border-bottom:1px solid #000; padding:8px 14px; font-size:8.5pt; flex-shrink:0; }
  .cust-top { display:grid; grid-template-columns:1fr 1fr; margin-bottom:4px; }
  .cust-right { text-align:right; }
  .cust div { margin-bottom:2px; }
  .cust-contact { margin-top:2px; }

  /* Table */
  .tbl-wrap { flex:1; display:flex; flex-direction:column; min-height:0; }
  table { width:100%; border-collapse:collapse; }
  th { border:1px solid #bbb; padding:5pt 8pt; font-size:8.5pt; font-weight:700; text-align:center; }
  td { border:1px solid #ccc; padding:3pt 8pt; font-size:8.5pt; color:#000; }
  .tc { text-align:center; }
  .tl { text-align:left; }
  .tr { text-align:right; }
  .nm { font-weight:600; }
  tr.subtot td { font-weight:700; border-top:1px solid #999; }

  /* Spacer */
  .spacer { flex:1; border-left:1px solid #ccc; border-right:1px solid #ccc; }

  /* Continued */
  .continued-wrap { display:flex; border-top:1px solid #999; flex-shrink:0; }
  .cont-left { flex:1; border-right:1px solid #ccc; }
  .cont-right { flex:1; text-align:center; padding:6pt 0; }
  .continued { font-size:9pt; font-style:italic; font-weight:700; margin-bottom:4pt; }
  .page-num { font-size:9pt; font-weight:700; }

  /* Bill section */
  .bill-section { display:flex; border-top:1px solid #999; flex-shrink:0; }
  .bill-left { flex:1; padding:8pt 14pt; border-right:1px solid #ccc; }
  .rupees { font-size:8.5pt; font-weight:700; }
  .bill-right { display:flex; flex-direction:column; justify-content:center; padding:6pt 14pt; min-width:35mm; }
  .bill-total-row { display:flex; justify-content:space-between; font-size:9pt; font-weight:700; gap:8pt; }

  /* Footer */
  .footer { border-top:1px solid #bbb; padding:5pt 14pt; display:flex; justify-content:space-between; font-size:7.5pt; color:#444; flex-shrink:0; }
</style>
</head>
<body>
  ${pages}
</body>
</html>`;
}
