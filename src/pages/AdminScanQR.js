import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserQRCodeReader } from '@zxing/library';
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
      codeReader.current = new BrowserQRCodeReader();
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
          console.warn(`Failed to use camera: ${err.message}`);
          if (attempt === videoInputDevices.length - 1) throw err;
        }
        attempt++;
      }

      if (!stream) throw new Error('No camera accessible');

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      const timeoutId = setTimeout(() => {
        console.warn('Scan timeout after 60 seconds');
        setError('No QR code detected after 60 seconds.');
        toast.error('No QR code detected after 60 seconds.', { position: 'top-right', autoClose: 5000 });
        stopScanning();
      }, 60000);

      const result = await codeReader.current.decodeFromInputVideoDevice(deviceId, videoRef.current);
      clearTimeout(timeoutId);
      console.log('QR code detected:', result.getText());
      handleScan(result.getText());
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Scan QR</h1>
      <div className="mb-4 flex gap-4">
        <button
          onClick={startScanning}
          disabled={scanning}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {scanning ? 'Scanning...' : 'Start'}
        </button>
        {scanning && (
          <button
            onClick={stopScanning}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Stop
          </button>
        )}
      </div>
      {scanning && (
        <div className="w-full max-w-md mx-auto mt-4">
          <video ref={videoRef} style={{ width: '100%' }} autoPlay />
        </div>
      )}
      {result && <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">{result}</div>}
      {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
    </div>
  );
};

export default AdminScanQR;