// ── ESC/POS Bluetooth Printer Utility ─────────────────────────────────────────
// Supports Dcode MP30 and other ESC/POS BLE thermal printers (58mm paper)

const ESC = 0x1B;
const GS  = 0x1D;

const CMD = {
  INIT:         [ESC, 0x40],
  ALIGN_LEFT:   [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  BOLD_ON:      [ESC, 0x45, 0x01],
  BOLD_OFF:     [ESC, 0x45, 0x00],
  FONT_NORMAL:  [GS,  0x21, 0x00],
  FONT_DOUBLE_H:[GS,  0x21, 0x01],  // double height only
  FEED3:        [ESC, 0x64, 0x03],
  CUT:          [GS,  0x56, 0x42, 0x00],
};

const WIDTH = 32; // characters per line at default font on 58mm

// ── Text helpers ────────────────────────────────────────────────────────────

function enc(str) {
  return new TextEncoder().encode(str);
}

function divider(char = '-') {
  return char.repeat(WIDTH) + '\n';
}

// Right-align `right` in a total `width`, left part fills remaining space
function twoCol(left, right, width = WIDTH) {
  const rightStr = String(right);
  const leftStr  = String(left).slice(0, width - rightStr.length);
  return leftStr.padEnd(width - rightStr.length, ' ') + rightStr + '\n';
}

function center(str, width = WIDTH) {
  const s = String(str).slice(0, width);
  const pad = Math.max(0, Math.floor((width - s.length) / 2));
  return ' '.repeat(pad) + s + '\n';
}

function fmtMoney(n) {
  return 'Rs.' + Number(n).toFixed(2);
}

// ── Build ESC/POS receipt bytes ─────────────────────────────────────────────
export function buildReceiptBytes(order, items) {
  const parts = [];

  const push  = (...bytes) => parts.push(new Uint8Array(bytes.flat()));
  const write = (str)      => parts.push(enc(str));

  // Init
  push(...CMD.INIT);

  // ── Header ──
  push(...CMD.ALIGN_CENTER);
  push(...CMD.BOLD_ON);
  push(...CMD.FONT_DOUBLE_H);
  write('SANVIKA CRACKERS\n');
  push(...CMD.FONT_NORMAL);
  push(...CMD.BOLD_OFF);
  write('Quality Fireworks Since 2020\n');
  write('+91 90477 78475\n');
  write('sanvikacrackers.com\n');
  write(divider('='));

  // ── Bill info ──
  push(...CMD.ALIGN_LEFT);
  push(...CMD.BOLD_ON);
  write(twoCol('Bill:', order.bill_number));
  push(...CMD.BOLD_OFF);

  const d = new Date(order.finalized_at || order.created_at);
  const dateStr = d.toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  write(twoCol('Date:', dateStr));

  // ── Customer ──
  if (order.customer_name || order.customer_phone) {
    write(divider('-'));
    if (order.customer_name)  write(twoCol('Customer:', order.customer_name));
    if (order.customer_phone) write(twoCol('Phone:', order.customer_phone));
  }

  write(divider('-'));

  // ── Items header ──
  // Layout: name(18) qty(4) total(10) = 32
  push(...CMD.BOLD_ON);
  write('Item'.padEnd(18) + 'Qty'.padStart(4) + 'Total'.padStart(10) + '\n');
  push(...CMD.BOLD_OFF);
  write(divider('-'));

  // ── Items ──
  for (const item of items) {
    const name  = String(item.product_name || '');
    const qty   = String(item.quantity);
    const total = fmtMoney(item.line_total);

    // First line: name + qty + total
    const namePart = name.slice(0, 18).padEnd(18);
    write(namePart + qty.padStart(4) + total.padStart(10) + '\n');

    // Second line: product code + unit price (indented)
    const codeLine = `  #${item.product_code}  @ ${fmtMoney(item.unit_price)}/ea`;
    write(codeLine.slice(0, WIDTH) + '\n');

    // If name is long, print remainder
    if (name.length > 18) {
      write('  ' + name.slice(18, 48) + '\n');
    }
  }

  write(divider('='));

  // ── Totals ──
  write(twoCol('Subtotal:', fmtMoney(order.subtotal)));
  if (Number(order.discount_total) > 0) {
    write(twoCol('Discount:', '-' + fmtMoney(order.discount_total)));
  }
  push(...CMD.BOLD_ON);
  write(twoCol('GRAND TOTAL:', fmtMoney(order.grand_total)));
  push(...CMD.BOLD_OFF);
  write(divider('='));

  // ── Footer ──
  push(...CMD.ALIGN_CENTER);
  write('Thank you!\n');
  write('Safe celebrations!\n');
  push(...CMD.FEED3);
  push(...CMD.CUT);

  // Merge all parts into one Uint8Array
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result   = new Uint8Array(totalLen);
  let   offset   = 0;
  for (const p of parts) { result.set(p, offset); offset += p.length; }
  return result;
}

// ── BLE Service/Characteristic profiles ────────────────────────────────────
// Dcode MP30 + other common ESC/POS BLE printers
const PROFILES = [
  // Most common Chinese BLE thermal printers (Xprinter, Dcode, etc.)
  { service: '000018f0-0000-1000-8000-00805f9b34fb', write: '000018f1-0000-1000-8000-00805f9b34fb' },
  // BLE thermal printer (Peripage, Paperang, etc.)
  { service: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', write: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f' },
  // Microchip RN4020 / Star SM-L200
  { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', write: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
  // Generic serial-over-BLE
  { service: '0000ff00-0000-1000-8000-00805f9b34fb', write: '0000ff02-0000-1000-8000-00805f9b34fb' },
];

// ── Connect to BLE printer ─────────────────────────────────────────────────
export async function connectBluetoothPrinter() {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported. Please use Chrome or Edge browser.');
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PROFILES.map(p => p.service),
  });

  const server = await device.gatt.connect();

  // Try each profile until one works
  for (const profile of PROFILES) {
    try {
      const service        = await server.getPrimaryService(profile.service);
      const characteristic = await service.getCharacteristic(profile.write);
      return { device, server, characteristic };
    } catch {
      // This profile not supported by this printer — try next
    }
  }

  device.gatt.disconnect();
  throw new Error(
    'Printer connected but service not found. ' +
    'Make sure the Dcode MP30 is in Bluetooth mode and try again.'
  );
}

// ── Send data in BLE-safe chunks ───────────────────────────────────────────
async function sendChunked(characteristic, data, chunkSize = 512) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    try {
      await characteristic.writeValueWithoutResponse(chunk);
    } catch {
      // Fallback to writeValue (some printers require response)
      await characteristic.writeValue(chunk);
    }
    // Small gap between chunks so printer buffer doesn't overflow
    if (i + chunkSize < data.length) {
      await new Promise(r => setTimeout(r, 30));
    }
  }
}

// ── Print a receipt via BLE ────────────────────────────────────────────────
export async function printViaBluetooth(characteristic, order, items) {
  const bytes = buildReceiptBytes(order, items);
  await sendChunked(characteristic, bytes);
}
