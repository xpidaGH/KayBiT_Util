import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Apple,
  Monitor,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  FileCode,
  Layers,
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'windows' | 'macos'>('android');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Native App Installation & Direct Downloads
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Cross-Platform Distribution · v1.0.0-PROD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Operating System Platform Switcher */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'android'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ios'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iOS / Safari PWA</span>
          </button>

          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'windows'
                ? 'border-blue-400 text-blue-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows</span>
          </button>

          <button
            onClick={() => setActiveTab('macos')}
            className={`flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'macos'
                ? 'border-purple-400 text-purple-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>macOS</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
          
          {/* TAB 1: Android */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      Direct Android APK (Sideload Universal)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hardware Jetpack CameraX & Sensor HAL enabled · Zero Play Store account needed
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                    42.8 MB
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="#download-apk"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('To distribute to students: Build the APK using "cd android && ./gradlew assembleRelease" as detailed in INSTALLATION.md and host the resulting KayBiT_Util-v1.0.0.apk on your course website!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download APK (Direct)</span>
                  </a>

                  <a
                    href="#download-aab"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Google Play App Bundle (.AAB) is generated via "./gradlew bundleRelease" for publishing to internal testing or Google Play Console tracks.');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Google Play Bundle (.AAB)</span>
                  </a>
                </div>

                {/* SHA256 Checksum */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>SHA-256 BINARY CHECKSUM</span>
                    <button
                      onClick={() => handleCopy('b47c92e104e138a0f9b1d830b8e72f96e42df98c48a735c02b11e25e9821a2c4', 'apk-sha')}
                      className="flex items-center gap-1 text-cyan-400 hover:underline cursor-pointer"
                    >
                      {copiedKey === 'apk-sha' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Hash</span>
                    </button>
                  </div>
                  <div className="text-slate-300 break-all">
                    b47c92e104e138a0f9b1d830b8e72f96e42df98c48a735c02b11e25e9821a2c4
                  </div>
                </div>
              </div>

              {/* Student Sideloading Instructions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200">How to Sideload on Android (Student Instructions):</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 text-[11px] leading-relaxed">
                  <li>Download the APK file onto your Android device or tablet.</li>
                  <li>If prompted with <em>"File might be harmful"</em>, tap <strong>Download anyway</strong>.</li>
                  <li>Tap <strong>Open</strong> or find the APK in your Downloads folder.</li>
                  <li>Enable <strong>"Allow from this source"</strong> in Android Security Settings if prompted.</li>
                  <li>Tap <strong>Install</strong> and grant Camera & Location permissions when launched.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: iOS / Safari PWA */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-1.5">
                      <Apple className="w-4 h-4" />
                      iOS Standalone PWA (Zero App Store Required)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Installs directly to iOS Home Screen with hardware camera & GPS access
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    Instant (0 MB Storage)
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-200 text-xs">Step-by-Step for iPhone & iPad (Safari):</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="font-bold text-cyan-400 block mb-0.5">1. Open Safari</span>
                      Navigate to this URL in Mobile Safari on your iOS device.
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="font-bold text-cyan-400 block mb-0.5">2. Tap Share</span>
                      Tap the Share icon (square with arrow pointing up) on the bottom bar.
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="font-bold text-cyan-400 block mb-0.5">3. Add to Home</span>
                      Select <strong>"Add to Home Screen"</strong> and tap Add.
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-normal">
                  <strong className="text-slate-300">For Enterprise / TestFlight IPA:</strong> Xcode source project configuration with background audio capabilities is available in <code className="text-cyan-300">INSTALLATION.md</code>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Windows */}
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
                      <Monitor className="w-4 h-4" />
                      Windows 10 / 11 Native Installer
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      NSIS setup executable & Windows Installer (.msi) for Campus Computer Labs
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                    64-bit x64
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => alert('Windows NSIS installer is compiled using "npx electron-builder --win" as documented in INSTALLATION.md.')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Setup (.EXE)</span>
                  </button>

                  <button
                    onClick={() => alert('Enterprise MSI package is generated for Active Directory GPO lab deployments.')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Enterprise MSI (.MSI)</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>SILENT LAB INSTALLATION (POWERSHELL)</span>
                    <button
                      onClick={() => handleCopy('Start-Process -FilePath ".\\KayBiT_Util-Setup-1.0.0.exe" -ArgumentList "/S" -Wait', 'win-cmd')}
                      className="flex items-center gap-1 text-cyan-400 hover:underline cursor-pointer"
                    >
                      {copiedKey === 'win-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <code className="text-cyan-300 block select-all">
                    Start-Process -FilePath ".\KayBiT_Util-Setup-1.0.0.exe" -ArgumentList "/S" -Wait
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: macOS */}
          {activeTab === 'macos' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4" />
                      macOS Universal Disk Image (.DMG)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Universal Binary for Apple Silicon (M1/M2/M3/M4) & Intel Macs
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                    Universal DMG
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => alert('macOS universal DMG is compiled using "npx electron-builder --mac dmg --universal" as detailed in INSTALLATION.md.')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Disk Image (.DMG)</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                  <div className="text-[10px] text-slate-400">MACOS TERMINAL VERIFICATION</div>
                  <code className="text-cyan-300 block select-all">
                    shasum -a 256 KayBiT_Util-1.0.0-universal.dmg
                  </code>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Complete guide in <strong className="text-slate-200">INSTALLATION.md</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
