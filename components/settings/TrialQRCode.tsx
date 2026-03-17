"use client";

import { useState, useRef } from "react";
import { QrCode, Download, Copy, Check, Printer, ExternalLink, Monitor, X } from "lucide-react";

// Lightweight QR code generator — no extra dependency
function getQRCodeUrl(data: string, size: number = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png&margin=8`;
}

// ── Fullscreen Kiosk Display ───────────────────────────────────────────
// Shows the QR code on a tablet/monitor at the front desk.
// Click anywhere or press Escape to exit.

function KioskDisplay({
  qrUrl,
  trialUrl,
  onClose,
}: {
  qrUrl: string;
  trialUrl: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      tabIndex={0}
      role="button"
      aria-label="Close fullscreen display"
    >
      {/* Close hint */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-500 transition-colors"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Content */}
      <div className="text-center px-8 max-w-lg">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
          Try Your First Class Free
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Scan with your phone camera to book — takes 60 seconds
        </p>

        {/* QR Code */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt="Scan to book a trial class"
          width={320}
          height={320}
          className="mx-auto rounded-2xl border-2 border-gray-100 shadow-lg mb-8"
        />

        <p className="text-sm text-gray-400 font-mono mb-8">{trialUrl}</p>

        <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">1</span>
            Scan QR code
          </span>
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">2</span>
            Pick a class
          </span>
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">3</span>
            Show up & move
          </span>
        </div>
      </div>

      {/* Tap to dismiss */}
      <p className="absolute bottom-6 text-xs text-gray-300">
        Tap anywhere or press Esc to close
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function TrialQRCode() {
  const [copied, setCopied] = useState(false);
  const [showKiosk, setShowKiosk] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // In production, this would come from establishment settings
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const trialUrl = `${baseUrl}/trial`;
  const qrImageUrl = getQRCodeUrl(trialUrl, 400);
  const qrImageUrlLarge = getQRCodeUrl(trialUrl, 600);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trialUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = "flexiwell-trial-qr-code.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trial Class QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: white;
            }
            .card {
              text-align: center;
              padding: 48px;
              max-width: 400px;
            }
            .card h1 {
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 8px 0;
              color: #111;
            }
            .card p {
              font-size: 16px;
              color: #666;
              margin: 0 0 24px 0;
            }
            .card img {
              width: 280px;
              height: 280px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              margin-bottom: 16px;
            }
            .card .url {
              font-size: 13px;
              color: #999;
              font-family: monospace;
            }
            .card .tagline {
              font-size: 14px;
              color: #444;
              margin-top: 20px;
              padding-top: 16px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Try Your First Class Free</h1>
            <p>Scan to book your trial — no app needed</p>
            <img src="${qrImageUrl}" alt="QR Code" />
            <div class="url">${trialUrl}</div>
            <div class="tagline">Just scan, pick a time, and show up. We'll handle the rest.</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Trial Class QR Code</h3>
            <p className="text-sm text-gray-500">
              Display at your front desk so walk-ins can book instantly
            </p>
          </div>
        </div>

        {/* QR Preview */}
        <div
          ref={printRef}
          className="bg-gray-50 rounded-xl p-6 flex flex-col items-center mb-4"
        >
          <p className="text-sm font-medium text-gray-700 mb-3">
            Scan to book your free trial class
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="Trial booking QR code"
            width={200}
            height={200}
            className="rounded-lg border border-gray-200"
          />
          <p className="text-xs text-gray-400 mt-3 font-mono">{trialUrl}</p>
        </div>

        {/* URL + Actions */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-4">
          <input
            type="text"
            readOnly
            value={trialUrl}
            className="flex-1 bg-transparent text-sm text-gray-700 font-mono px-2 outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setShowKiosk(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <Monitor className="w-4 h-4" />
            Display
          </button>
          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <a
            href={trialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          <strong>Display:</strong> Show fullscreen on a tablet or monitor at the front desk — walk-ins scan it with their phone.{" "}
          <strong>Print:</strong> Place at your entrance or check-in area.
        </p>
      </div>

      {/* Fullscreen Kiosk Mode */}
      {showKiosk && (
        <KioskDisplay
          qrUrl={qrImageUrlLarge}
          trialUrl={trialUrl}
          onClose={() => setShowKiosk(false)}
        />
      )}
    </>
  );
}
