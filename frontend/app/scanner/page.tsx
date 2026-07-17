'use client';

import React from 'react';
import QRScanner from '../../components/QRScanner';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

export default function ScannerPage() {
  const router = useRouter();

  const [scanError, setScanError] = React.useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = React.useState(false);
  const [manualId, setManualId] = React.useState('');

  const handleScan = async (data: string) => {
    try {
      setScanError(null);
      setScanSuccess(true);
      const asset = await apiFetch(`/assets/${data}`);
      if (asset && asset.id) {
        setTimeout(() => router.push(`/inventory/${asset.id}`), 500);
      } else {
        setScanSuccess(false);
        setScanError('Asset not found. Check the QR code and try again.');
      }
    } catch {
      setScanSuccess(false);
      setScanError('Asset not found. Check the QR code and try again.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) handleScan(manualId.trim());
  };

  return (
    <div className="scanner-container">
      <header>
        <h1 className="page-title">Hardware Scanner</h1>
        <p className="page-subtitle">Scan QR codes to instantly check-in, check-out, or view asset vitals.</p>
      </header>

      <div className={`scanner-main card-premium ${scanSuccess ? 'scan-success-flash' : ''}`}>
        <div className="scanner-viewport ar-overlay">
          <QRScanner onScanSuccess={handleScan} />
          
          <div className="ar-reticle">
            <div className="reticle-corner top-left"></div>
            <div className="reticle-corner top-right"></div>
            <div className="reticle-corner bottom-left"></div>
            <div className="reticle-corner bottom-right"></div>
          </div>
          <div className="ar-status">
            <span className="ar-dot pulse"></span>
            AR Engine Active: Awaiting Target
          </div>
        </div>
        
        <div className="scanner-instructions">
          <h3 style={{ color: '#fff' }}>AR Scan Mode</h3>
          <ul>
            <li>Point camera at an asset or QR Code.</li>
            <li>VaultIQ will overlay digital twin telemetry.</li>
            <li>Auto-detecting barcodes and NFC tags.</li>
          </ul>
          
          <div className="manual-entry">
            <h4>Or enter ID manually</h4>
            <form onSubmit={handleManualSubmit} className="manual-form">
              <input 
                type="text" 
                value={manualId} 
                onChange={e => setManualId(e.target.value)} 
                placeholder="Tag ID (e.g. AST-101)..." 
                className="manual-input glass-input"
              />
              <button type="submit" className="btn btn-primary glow-border">Override</button>
            </form>
          </div>

          {scanError && (
            <div className="error-toast glass animate-fade-in" style={{ borderColor: 'var(--accent-danger)' }}>
              <strong>Target Lost:</strong> {scanError}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .error-toast {
          margin-top: 20px;
          padding: 16px;
          background: rgba(218, 54, 51, 0.1);
          color: var(--accent-danger);
          border: 1px solid rgba(218, 54, 51, 0.2);
          border-radius: 8px;
        }
        .scanner-container {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .scanner-main {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 40px;
          padding: 40px;
          min-height: 500px;
        }

        .scanner-viewport {
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .ar-overlay {
          box-shadow: inset 0 0 40px rgba(0, 230, 118, 0.1);
        }

        .ar-reticle {
          position: absolute;
          width: 60%;
          height: 60%;
          pointer-events: none;
        }

        .reticle-corner {
          position: absolute;
          width: 30px;
          height: 30px;
          border-color: rgba(0, 230, 118, 0.8);
          border-style: solid;
        }
        .top-left { top: 0; left: 0; border-width: 3px 0 0 3px; }
        .top-right { top: 0; right: 0; border-width: 3px 3px 0 0; }
        .bottom-left { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
        .bottom-right { bottom: 0; right: 0; border-width: 0 3px 3px 0; }

        .ar-status {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.6);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          color: var(--accent-success);
          display: flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(0, 230, 118, 0.3);
        }

        .ar-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-success);
          border-radius: 50%;
        }

        .pulse {
          animation: pulseDot 1.5s infinite;
        }

        @keyframes pulseDot {
          0% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(0, 230, 118, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
        }

        .scanner-instructions {
          display: flex;
          flex-direction: column;
          gap: 24px;
          counter-reset: step;
        }

        .scanner-instructions h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .scanner-instructions ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .scanner-instructions li {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .scanner-instructions li::before {
          counter-increment: step;
          content: counter(step);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent-primary);
          color: white;
          font-size: 0.8rem;
          font-weight: bold;
          flex-shrink: 0;
        }

        .scan-success-flash {
          animation: flashSuccess 0.5s ease;
        }

        @keyframes flashSuccess {
          0% { box-shadow: 0 0 0px 0px rgba(63, 185, 80, 0); }
          50% { box-shadow: 0 0 20px 5px rgba(63, 185, 80, 0.6); }
          100% { box-shadow: 0 0 0px 0px rgba(63, 185, 80, 0); }
        }

        .manual-entry {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .manual-entry h4 {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .manual-form {
          display: flex;
          gap: 8px;
        }

        .manual-input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .manual-input:focus {
          outline: none;
          border-color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
