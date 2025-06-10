import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { scanQR } from '../services/api';
import { toast } from 'react-toastify';

const AdminScanQR = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    try {
      console.log('Initializing QR code reader...');
      codeReader.current = new BrowserMultiFormatReader();
      console.log('QR code reader initialized');
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to initialize QR scanner: ' + err.message);
      toast.error('Failed to initialize QR scanner: ' + err.message, {
        position: 'top-right',
        autoClose: 5000,
      });
    }

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
    };
  }, []);

  const startScanning = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in as admin.');
      toast.error('Please log in as admin.', { position: 'top-right', autoClose: 3000 });
      navigate('/login');
      return;
    }

    if (!codeReader.current) {
      setError('QR scanner not initialized.');
      toast.error('QR scanner not initialized.', { position: 'top-right', autoClose: 5000 });
      return;
    }

    setScanning(true);
    setResult(null);
    setError(null);

    let stream = null;
    let deviceId = null;

    try {
      console.log('Starting scan...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter((device) => device.kind === 'videoinput');
      console.log('Available cameras:', videoInputDevices);
      if (videoInputDevices.length === 0) throw new Error('No camera found');

      let attempt = 0;
      while (attempt < videoInputDevices.length && !stream) {
        const currentDevice = videoInputDevices[attempt];
        console.log(`Trying camera: ${currentDevice.label} (ID: ${currentDevice.deviceId})`);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: currentDevice.deviceId } },
          });
          deviceId = currentDevice.deviceId;
          break;
        } catch (err) {
          if (err.name === 'OverconstrainedError') {
            // Fallback: try without deviceId
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: true });
              deviceId = undefined;
              break;
            } catch (fallbackErr) {
              console.warn(`Fallback camera failed: ${fallbackErr.message}`);
            }
          }
          console.warn(`Failed to use camera: ${err.message}`);
          if (attempt === videoInputDevices.length - 1) throw err;
        }
        attempt++;
      }

      if (!stream) throw new Error('No camera accessible');

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // Wait for video to be ready
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          resolve();
        };
      });

      // Reset code reader before scanning
      codeReader.current.reset();

      const timeoutId = setTimeout(() => {
  console.warn('Scan timeout after 60 seconds');
  setError('No QR code detected after 60 seconds.');
  toast.error('No QR code detected after 60 seconds.', { position: 'top-right', autoClose: 5000 });
  stopScanning();
}, 60000);

try {
  // Use decodeFromVideoDevice for more reliability
  codeReader.current.decodeFromVideoDevice(
  deviceId,
  videoRef.current,
  (result, err) => {
    if (result) {
      clearTimeout(timeoutId);
      console.log('QR code detected:', result.getText());
      codeReader.current.reset();
      handleScan(result.getText());
    } else if (err && !(err instanceof NotFoundException)) {
      clearTimeout(timeoutId);
      console.error('Scan error:', err);
      setError('Failed to scan QR code.');
      toast.error('Failed to scan QR code.', { position: 'top-right', autoClose: 5000 });
      setScanning(false);
      stopScanning();
    }
    // else: NotFoundException means no QR code in frame, keep scanning
  }
);
} catch (scanErr) {
  clearTimeout(timeoutId);
  throw scanErr;
}
    } catch (err) {
      console.error('Scan error:', err);
      let errorMessage = 'Failed to scan.';
      if (err.name === 'NotAllowedError') errorMessage = 'Camera permission denied.';
      else if (err.name === 'NotFoundError') errorMessage = 'No camera found.';
      else if (err.name === 'NotReadableError') errorMessage = 'Camera in use. Close other apps.';
      else if (err.name === 'OverconstrainedError') errorMessage = 'Camera unsupported.';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 });
      setScanning(false);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (codeReader.current) {
      codeReader.current.reset();
    }
  };

  const handleScan = async (data) => {
    if (data) {
      try {
        console.log('Processing QR:', data);
        const response = await scanQR(data);
        console.log('API response:', response);
        setResult(response.message);
        toast.success(response.message, { position: 'top-right', autoClose: 3000 });
      } catch (err) {
        console.error('API error:', err);
        const message = err.response?.data?.message || err.response?.data?.error || 'Scan failed';
        setError(message);
        toast.error(message, { position: 'top-right', autoClose: 5000 });
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    } else {
      setError('No QR code detected.');
      toast.error('No QR code detected.', { position: 'top-right', autoClose: 5000 });
    }
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  return (
  <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">Admin Scan QR</h1>
      <div className="mb-6 flex gap-4 w-full justify-center">
        <button
          onClick={startScanning}
          disabled={scanning}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition disabled:bg-gray-400"
        >
          {scanning ? 'Scanning...' : 'Start'}
        </button>
        {scanning && (
          <button
            onClick={stopScanning}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded transition"
          >
            Stop
          </button>
        )}
      </div>
      {scanning && (
        <div className="w-full flex justify-center mb-4">
          <div className="rounded-lg overflow-hidden border-4 border-blue-200 shadow">
            <video
              ref={videoRef}
              style={{ width: 320, height: 240, background: '#000' }}
              autoPlay
              className="block"
            />
          </div>
        </div>
      )}
      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded w-full text-center font-semibold shadow">
          {result}
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded w-full text-center font-semibold shadow">
          {error}
        </div>
      )}
    </div>
  </div>
);
};

export default AdminScanQR;