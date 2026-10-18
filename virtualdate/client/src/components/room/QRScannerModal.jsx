import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScannerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload'
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper to extract roomId from various QR formats
  const extractRoomId = (decodedText) => {
    if (!decodedText) return null;
    const trimmed = decodedText.trim();
    // 1. Matches /room/:id or https://domain.com/room/:id
    const urlMatch = trimmed.match(/\/room\/([a-zA-Z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    // 2. Direct roomId string (UUID or alphanumeric 6+ chars)
    if (/^[a-zA-Z0-9_-]{6,64}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  };

  const handleScanSuccess = async (decodedText) => {
    const roomId = extractRoomId(decodedText);
    if (roomId) {
      await stopScanner();
      onClose();
      navigate(`/room/${roomId}`);
    } else {
      setScanError('QR code detected, but it does not contain a valid Oedg room link.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setScanError('');
    setCameraPermissionError(false);

    try {
      await stopScanner();

      const qrCodeRegionId = 'qr-camera-stream';
      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame scanned with no QR code - ignore
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.warn('Camera scan failed or not supported:', err);
      setCameraPermissionError(true);
      setScanError('Camera access unavailable. You can upload a QR image below.');
      setIsScanning(false);
    }
  };

  // Start or stop camera depending on tab & open state
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, activeTab]);

  // Handle uploaded QR image
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError('');
    try {
      const tempScanner = new Html5Qrcode('qr-camera-stream');
      const decodedText = await tempScanner.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      setScanError('Could not find a valid QR code in this image. Please try another.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: '2rem 1.75rem',
          position: 'relative',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.9)',
          textAlign: 'center',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            stopScanner();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--k2)',
            border: '1px solid var(--line)',
            color: 'var(--w2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ✕
        </button>

        {/* Title */}
        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--w)' }}>
          ✦
        </div>
        <h3
          style={{
            fontSize: '1.35rem',
            fontWeight: 500,
            color: 'var(--w)',
            letterSpacing: '-0.03em',
            marginBottom: '0.35rem',
          }}
        >
          Scan Room QR
        </h3>
        <p
          style={{
            color: 'var(--w2)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          Scan with your camera or upload a QR image to enter a room without logging in.
        </p>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--k2)',
            borderRadius: 999,
            padding: 4,
            marginBottom: '1.5rem',
            border: '1px solid var(--line)',
          }}
        >
          <button
            onClick={() => setActiveTab('camera')}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 999,
              background: activeTab === 'camera' ? 'var(--w)' : 'transparent',
              color: activeTab === 'camera' ? 'var(--k)' : 'var(--w2)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Camera Scan
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 999,
              background: activeTab === 'upload' ? 'var(--w)' : 'transparent',
              color: activeTab === 'upload' ? 'var(--k)' : 'var(--w2)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Upload Image
          </button>
        </div>

        {/* Scanner View Area */}
        <div
          style={{
            minHeight: 260,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--k)',
            borderRadius: 16,
            border: '1px solid var(--line)',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '1.25rem',
          }}
        >
          {activeTab === 'camera' ? (
            <div style={{ width: '100%', position: 'relative' }}>
              <div id="qr-camera-stream" style={{ width: '100%', minHeight: 250 }} />
              {cameraPermissionError && (
                <div style={{ padding: '2rem 1.5rem', color: 'var(--w2)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.6 }}>📷</div>
                  <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Camera access was denied or not available.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="pill-ghost"
                    style={{ fontSize: '0.8125rem', padding: '8px 18px' }}
                  >
                    Upload QR Image Instead
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '3rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem', color: 'var(--w2)' }}>
                📁
              </div>
              <p style={{ color: 'var(--w)', fontSize: '0.9375rem', fontWeight: 500, margin: '0 0 0.35rem' }}>
                Select or drop a QR code image
              </p>
              <p style={{ color: 'var(--w3)', fontSize: '0.75rem', margin: 0 }}>
                Supports PNG, JPG, WEBP, or screenshot
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {scanError && (
          <div
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--w1)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}
          >
            {scanError}
          </div>
        )}

        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--w3)' }}>
          Direct peer entry &middot; No account required
        </div>
      </div>
    </div>
  );
}
