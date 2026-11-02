import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { connectBluetoothPrinter, printViaBluetooth } from '../utils/bluetoothPrinter';

const BluetoothPrinterContext = createContext(null);

// status: 'disconnected' | 'connecting' | 'connected' | 'printing'
export function BluetoothPrinterProvider({ children }) {
  const [status, setStatus]         = useState('disconnected');
  const [deviceName, setDeviceName] = useState(null);
  const connRef                     = useRef(null); // { device, server, characteristic }

  const connect = useCallback(async () => {
    if (status === 'connecting') return;
    setStatus('connecting');
    try {
      const conn = await connectBluetoothPrinter();
      connRef.current = conn;
      const name = conn.device.name || 'Bluetooth Printer';
      setDeviceName(name);
      setStatus('connected');
      toast.success(`Connected: ${name}`, { icon: '🖨️' });

      // Auto-update when printer disconnects (e.g. turned off)
      conn.device.addEventListener('gattserverdisconnected', () => {
        connRef.current = null;
        setStatus('disconnected');
        setDeviceName(null);
        toast.error('Printer disconnected');
      });
    } catch (err) {
      setStatus('disconnected');
      // 'NotFoundError' = user cancelled the browser dialog — no toast needed
      if (err.name !== 'NotFoundError') {
        toast.error(err.message || 'Failed to connect to printer');
      }
    }
  }, [status]);

  const disconnect = useCallback(() => {
    try {
      if (connRef.current?.device?.gatt?.connected) {
        connRef.current.device.gatt.disconnect();
      }
    } catch {}
    connRef.current = null;
    setStatus('disconnected');
    setDeviceName(null);
    toast.success('Printer disconnected');
  }, []);

  // Returns true on success, false on failure
  const print = useCallback(async (order, items) => {
    if (!connRef.current) {
      toast.error('No printer connected. Connect a Bluetooth printer first.');
      return false;
    }

    // Re-connect if the GATT connection was lost silently
    if (!connRef.current.device?.gatt?.connected) {
      try {
        connRef.current.server = await connRef.current.device.gatt.connect();
        const services = await connRef.current.server.getPrimaryServices();
        // Re-acquire the characteristic from the same server
        for (const svc of services) {
          try {
            const chars = await svc.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                connRef.current.characteristic = c;
                break;
              }
            }
          } catch {}
          if (connRef.current.characteristic) break;
        }
      } catch (err) {
        connRef.current = null;
        setStatus('disconnected');
        setDeviceName(null);
        toast.error('Printer reconnection failed. Please connect again.');
        return false;
      }
    }

    setStatus('printing');
    try {
      await printViaBluetooth(connRef.current.characteristic, order, items);
      toast.success('Printed!', { icon: '🖨️', duration: 2000 });
      setStatus('connected');
      return true;
    } catch (err) {
      toast.error('Print failed: ' + (err.message || 'Unknown error'));
      setStatus('connected');
      return false;
    }
  }, []);

  return (
    <BluetoothPrinterContext.Provider value={{ status, deviceName, connect, disconnect, print }}>
      {children}
    </BluetoothPrinterContext.Provider>
  );
}

export function useBluetoothPrinter() {
  const ctx = useContext(BluetoothPrinterContext);
  if (!ctx) throw new Error('useBluetoothPrinter must be used inside BluetoothPrinterProvider');
  return ctx;
}
