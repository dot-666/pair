import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SessionResponse, SessionStatus, QuickLink } from "@shared/schema";
import {
  ArrowUpRight,
  Copy,
  Check,
  Wifi,
  QrCode,
  Shield,
  Zap,
  Terminal,
  Trash2,
  Hash,
  Smartphone,
  Link2,
  ExternalLink,
  Rocket,
  AlertCircle,
  Loader2,
  Bot,
  BarChart3,
  Sparkles,
  Clock,
  Lock,
  Server,
  Globe,
  Cpu,
  Key,
} from "lucide-react";
import { Link } from "wouter";
import { SiWhatsapp, SiGithub } from "react-icons/si";

// ... (QuickLinkIcon, QuickLinksSection, GlassCard, GlowText, FeatureCard, useWebSocket remain the same) ...

export default function Home() {
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState<"pairing" | "qr">("pairing");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [initialResponse, setInitialResponse] = useState<SessionResponse | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairServer, setPairServer] = useState(1);
  const [copiedPairing, setCopiedPairing] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const { wsData } = useWebSocket(currentSessionId);

  const generateMutation = useMutation({
    mutationFn: async (method: "pairing" | "qr") => {
      const res = await apiRequest("POST", "/api/generate-session", {
        method,
        phoneNumber: method === "pairing" ? phoneNumber : undefined,
        pairServer,
      });
      return (await res.json()) as SessionResponse;
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      setInitialResponse(data);
      toast({ title: "Session Created", description: `Session initialized` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/terminate-session", {
        sessionId: currentSessionId,
      });
    },
    onSuccess: () => {
      setCurrentSessionId(null);
      setInitialResponse(null);
      setPhoneNumber("");
      toast({ title: "Session Terminated", description: "All session data cleaned up" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleCopy = useCallback(
    (text: string, type: "pairing" | "creds") => {
      navigator.clipboard.writeText(text);
      if (type === "pairing") {
        setCopiedPairing(true);
        setTimeout(() => setCopiedPairing(false), 2000);
      } else {
        setCopiedCreds(true);
        setTimeout(() => setCopiedCreds(false), 2000);
      }
    },
    []
  );

  const displayStatus = wsData?.status || initialResponse?.status || "pending";
  const displayPairingCode = wsData?.pairingCode || initialResponse?.pairingCode || null;
  const displayQrCode = wsData?.qrCode || initialResponse?.qrCode || null;
  const displayCredentials = wsData?.credentialsBase64 || null;

  const formatPairingCode = (code: string): string => {
    if (code.length === 8) {
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    return code;
  };

  const formatFullCredentials = (creds: string): string => {
    if (creds.startsWith('Ultra-X:~')) {
      return creds;
    }
    return `Ultra-X:~${creds}`;
  };

  const isConnecting = displayStatus === "pending" || displayStatus === "connecting";
  const isConnected = displayStatus === "connected";
  const isFailed = displayStatus === "failed";

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden flex items-center justify-center p-4 sm:p-8">
      {/* Background Glow (optional, kept minimal) */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[560px] bg-radial from-[#7c3aed]/20 via-[#5b21b6]/10 to-transparent blur-2xl" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-radial from-[#9b5de5]/15 to-transparent blur-2xl" />
        <div className="absolute w-[360px] h-[360px] top-[10%] left-[-8%] rounded-full bg-[#6d28d9]/15 blur-[60px] animate-drift" />
        <div className="absolute w-[280px] h-[280px] top-[20%] right-[-6%] rounded-full bg-[#9b5de5]/15 blur-[60px] animate-drift animation-delay-[-6s]" />
        <div className="absolute w-[220px] h-[220px] bottom-[15%] left-[30%] rounded-full bg-[#c084fc]/10 blur-[60px] animate-drift animation-delay-[-10s]" />
      </div>

      {/* Main Dashboard Card – Black, rounded, suspended */}
      <div className="relative z-10 w-full max-w-7xl bg-black/80 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-purple-900/30 border border-purple-900/30 p-6 sm:p-10 lg:p-12 animate-fade-in-up">
        {/* Header Section */}
        <header className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-purple-700/40 bg-purple-900/30 backdrop-blur-sm mb-6 animate-fade-in-down">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-blink-dot" />
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono text-xs tracking-wider text-purple-400" data-testid="text-version">
              JUNE-X ULTRA v3.0.0
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4 tracking-tight font-display">
            <GlowText>JUNE-X</GlowText>
            <span className="text-white"> ULTRA</span>
          </h1>
          <p className="text-gray-400 font-mono text-sm max-w-md mx-auto leading-relaxed">
            Enterprise WhatsApp Session Generator
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-500">
              <Lock className="w-3 h-3 text-purple-400" /> E2E Encrypted
            </span>
            <span className="text-purple-900/40">◆</span>
            <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-500">
              <Zap className="w-3 h-3 text-purple-400" /> Instant Sync
            </span>
            <span className="text-purple-900/40">◆</span>
            <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-500">
              <SiWhatsapp className="w-3 h-3 text-purple-400" /> Multi-Device
            </span>
          </div>
        </header>

        {/* Grid Layout */}
        <div className="relative grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-8">
          {/* Left Column - Initialize Connection */}
          <div className="lg:col-span-6 space-y-6">
            <div className="floating-card-main">
              <GlassCard className="p-5 sm:p-7 lg:p-8 rounded-[2rem]">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-purple-900/30">
                  <div className="p-2 rounded-xl bg-purple-900/30 border border-purple-700/40">
                    <Cpu className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-mono">Initialize Connection</h2>
                    <p className="text-xs text-gray-500 font-mono">Deploy secure WhatsApp session</p>
                  </div>
                </div>

                {/* Method Switcher */}
                <div className="relative flex gap-2 mb-8 p-1.5 rounded-xl bg-black/60 border border-purple-900/30">
                  <div
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-4px)] rounded-lg bg-purple-600/30 border border-purple-400/60 transition-all duration-300 ease-out ${
                      activeMethod === "pairing" ? "left-1.5" : "left-[calc(50%-2px)]"
                    }`}
                  />
                  <button
                    data-testid="button-method-pairing"
                    className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm transition-all z-10 ${
                      activeMethod === "pairing" ? "text-purple-300" : "text-gray-500 hover:text-gray-300"
                    }`}
                    onClick={() => setActiveMethod("pairing")}
                  >
                    <Hash className="w-4 h-4" />
                    Pairing Code
                  </button>
                  <button
                    data-testid="button-method-qr"
                    className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm transition-all z-10 ${
                      activeMethod === "qr" ? "text-purple-300" : "text-gray-500 hover:text-gray-300"
                    }`}
                    onClick={() => setActiveMethod("qr")}
                  >
                    <QrCode className="w-4 h-4" />
                    QR Scan
                  </button>
                </div>

                {activeMethod === "pairing" && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div>
                      <label className="block text-gray-400 text-xs uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
                        <Server className="w-3 h-3" />
                        Select Pair Server
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            data-testid={`button-server-${num}`}
                            onClick={() => setPairServer(num)}
                            className={`py-3 px-2 rounded-xl border font-mono text-sm transition-all duration-300 transform hover:scale-105 relative overflow-hidden group font-bold ${
                              pairServer === num
                                ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/30"
                                : "bg-black/60 text-gray-400 border-purple-900/30 hover:border-purple-500/50 hover:text-gray-200"
                            }`}
                          >
                            <div className="relative z-10">
                              Pair {num}
                            </div>
                            {pairServer === num && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                            )}
                          </button>
                        ))}
                      </div>
                      {pairServer && (
                        <p className="text-gray-500 text-[10px] font-mono mt-3 text-center">
                          Selected: <span className="text-purple-400 font-bold">Pair {pairServer}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                        <Smartphone className="w-3 h-3" />
                        WhatsApp Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">+</div>
                        <input
                          data-testid="input-phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="1234567890"
                          className="w-full pl-8 pr-4 py-3.5 bg-black/60 border border-purple-900/30 rounded-xl font-mono text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                      <p className="text-gray-600 text-[10px] font-mono mt-2">
                        Include country code (e.g., 2348012345678)
                      </p>
                    </div>
                  </div>
                )}

                {activeMethod === "qr" && (
                  <div className="text-center py-8 animate-fade-in-up">
                    <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-xl bg-black/40 border border-purple-900/30">
                      <QrCode className="w-8 h-8 text-purple-400/60" />
                      <p className="text-gray-400 text-sm font-mono">
                        QR code will be generated from WhatsApp servers
                      </p>
                    </div>
                  </div>
                )}

                {/* Generate Button – Solid Purple */}
                <button
                  data-testid="button-generate"
                  disabled={generateMutation.isPending || (activeMethod === "pairing" && !phoneNumber) || !!currentSessionId}
                  className="w-full mt-7 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 rounded-xl font-mono text-sm font-bold text-white transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deploying Session...
                    </>
                  ) : currentSessionId ? (
                    <>
                      <Wifi className="w-4 h-4" />
                      Session Live
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Session
                    </>
                  )}
                </button>
              </GlassCard>
            </div>

            {/* Active Session Section */}
            {currentSessionId && (
              <div className="floating-card-active">
                <GlassCard className="p-5 sm:p-7 lg:p-8 rounded-[2rem]">
                  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-purple-900/30">
                    <div className="p-2 rounded-xl bg-purple-900/30 border border-purple-700/40">
                      {isConnected ? <Key className="w-5 h-5 text-purple-400" /> : <Wifi className="w-5 h-5 text-purple-400" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-mono">
                        {isConnected ? "Session Credentials" : "Active Deployment"}
                      </h2>
                      <p className="text-xs text-gray-500 font-mono">
                        {isConnected ? "Your WhatsApp session ID" : "Real-time connection status"}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : isFailed ? "bg-red-500" : "bg-purple-400"} animate-pulse`} />
                      <span className="text-[10px] font-mono text-gray-500">
                        {isConnected ? "CONNECTED" : isFailed ? "FAILED" : "ACTIVE"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {displayPairingCode && (
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-wider font-mono mb-2">
                          Pairing Code
                        </label>
                        <div
                          className="flex items-center justify-between gap-3 p-5 bg-black/60 rounded-xl border border-purple-500/40 cursor-pointer transition-all hover:border-purple-400/70 group"
                          onClick={() => handleCopy(displayPairingCode, "pairing")}
                          data-testid="button-copy-pairing"
                        >
                          <span
                            className="font-mono text-2xl sm:text-3xl tracking-[0.25em] font-bold text-purple-300"
                            style={{ textShadow: "0 0 20px rgba(155,93,229,0.4)" }}
                            data-testid="text-pairing-code"
                          >
                            {formatPairingCode(displayPairingCode)}
                          </span>
                          {copiedPairing ? (
                            <Check className="w-5 h-5 text-purple-400 shrink-0" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-500 shrink-0 group-hover:text-purple-400 transition-colors" />
                          )}
                        </div>
                        <p className="text-gray-600 text-[10px] font-mono mt-2">
                          WhatsApp → Linked Devices → Link with code
                        </p>
                      </div>
                    )}

                    {displayQrCode && (
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase tracking-wider font-mono mb-2">
                          QR Scan Code
                        </label>
                        <div className="flex justify-center p-6 bg-white rounded-xl">
                          <img
                            src={displayQrCode}
                            alt="WhatsApp QR Code"
                            className="w-44 h-44 sm:w-52 sm:h-52"
                            data-testid="img-qr-code"
                          />
                        </div>
                      </div>
                    )}

                    {activeMethod === "pairing" && !displayPairingCode && !displayQrCode && isConnecting && !isFailed && (
                      <div className="flex items-center justify-center gap-3 p-6 bg-black/40 rounded-xl border border-purple-900/30">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                        <span className="text-gray-400 font-mono text-sm">Requesting pairing code...</span>
                      </div>
                    )}

                    {activeMethod === "qr" && !displayQrCode && !displayPairingCode && isConnecting && !isFailed && (
                      <div className="flex items-center justify-center gap-3 p-6 bg-black/40 rounded-xl border border-purple-900/30">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                        <span className="text-gray-400 font-mono text-sm">Generating QR code...</span>
                      </div>
                    )}

                    {isConnected && displayCredentials && (
                      <div className="mt-4 pt-4 border-t border-purple-900/30">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-gray-500 text-[10px] uppercase tracking-wider font-mono flex items-center gap-2">
                            <Key className="w-3 h-3 text-purple-400" />
                            WhatsApp Session ID
                          </label>
                          <button
                            data-testid="button-copy-credentials"
                            onClick={() => handleCopy(formatFullCredentials(displayCredentials), "creds")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 border border-purple-400/50 font-mono text-xs text-purple-300 transition-all hover:bg-purple-600/50"
                          >
                            {copiedCreds ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div
                          className="p-4 bg-black/60 rounded-xl border border-purple-500/40 cursor-pointer transition-all hover:border-purple-400/70"
                          onClick={() => handleCopy(formatFullCredentials(displayCredentials), "creds")}
                          data-testid="div-credentials"
                        >
                          <code className="font-mono text-xs sm:text-sm text-purple-300/90 break-all" data-testid="text-credentials">
                            {formatFullCredentials(displayCredentials)}
                          </code>
                        </div>
                        <p className="text-gray-600 text-[10px] font-mono mt-3">
                          ✓ Session ID sent to your WhatsApp DM • Keep it private • One-time use
                        </p>
                      </div>
                    )}

                    {isFailed && (
                      <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <div>
                          <p className="text-red-400 font-mono text-sm font-medium">Deployment Failed</p>
                          <p className="text-red-400/60 font-mono text-xs">Terminate and retry</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    data-testid="button-terminate"
                    onClick={() => terminateMutation.mutate()}
                    disabled={terminateMutation.isPending}
                    className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl font-mono text-xs text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {terminateMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Terminate Session
                  </button>
                </GlassCard>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-purple-900/30 hover:border-purple-500/40 transition-all hover:scale-105 duration-300">
                <div className="text-2xl font-bold text-purple-400 font-mono">2</div>
                <div className="text-[10px] text-gray-500 font-mono mt-1">PAIRING MODES</div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-purple-900/30 hover:border-purple-500/40 transition-all hover:scale-105 duration-300">
                <div className="text-2xl font-bold text-purple-400 font-mono">&lt;5s</div>
                <div className="text-[10px] text-gray-500 font-mono mt-1">DEPLOY TIME</div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-purple-900/30 hover:border-purple-500/40 transition-all hover:scale-105 duration-300">
                <div className="text-2xl font-bold text-purple-400 font-mono">E2E</div>
                <div className="text-[10px] text-gray-500 font-mono mt-1">ENCRYPTION</div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-purple-900/30 hover:border-purple-500/40 transition-all hover:scale-105 duration-300">
                <div className="text-2xl font-bold text-purple-400 font-mono">24/7</div>
                <div className="text-[10px] text-gray-500 font-mono mt-1">UPTIME</div>
              </div>
            </div>

            {/* Quick Links */}
            <GlassCard className="p-5 sm:p-6 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-purple-900/30 border border-purple-700/40">
                  <Link2 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white font-mono">Resources</h2>
                  <p className="text-[10px] text-gray-500 font-mono">Quick navigation</p>
                </div>
              </div>
              <QuickLinksSection />
            </GlassCard>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 gap-3">
              <FeatureCard
                icon={Shield}
                title="Zero-Knowledge Security"
                desc="End-to-end encrypted sessions"
              />
              <FeatureCard
                icon={Zap}
                title="Sub-5 Second Deploy"
                desc="Lightning fast connection"
              />
              <FeatureCard
                icon={SiWhatsapp}
                title="Multi-Device Native"
                desc="Full WhatsApp MD support"
              />
            </div>

            <GlassCard className="p-4 bg-gradient-to-r from-yellow-500/5 to-transparent rounded-[2rem]">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-500/70" />
                <span className="text-[10px] font-mono text-yellow-500/70 uppercase tracking-wider">Security Notice</span>
              </div>
              <p className="text-gray-600 text-[10px] font-mono leading-relaxed">
                Your session credentials are sent to your WhatsApp DM only once. Keep them secure.
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Footer Section */}
        <footer className="mt-16 sm:mt-20 text-center">
          <div className="border-t border-purple-900/30 pt-6 pb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-purple-400/40" />
              <span className="font-mono text-xs text-gray-500">JUNE-X ULTRA Session Manager</span>
            </div>
            <p className="text-gray-700 text-[10px] font-mono">
              © 2026 JUNE-X ULTRA. Enterprise WhatsApp Session Management.
            </p>
          </div>
          <div className="border-t border-purple-900/20 mt-4 pt-4 pb-6">
            <p className="text-[11px] font-mono tracking-wide">
              <span className="text-gray-600">Pair Site by</span>{' '}
              <span className="text-purple-400 font-semibold">WOLF TECH</span>{' '}
              <span className="text-gray-600">-</span>{' '}
              <span className="text-gray-500">Silent Wolf</span>
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        /* Keep existing keyframes and utility classes */
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -30px); }
          66% { transform: translate(-15px, 20px); }
        }
        @keyframes blink-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes floating-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(155, 93, 229, 0.15), 0 0 40px rgba(155, 93, 229, 0.08),
              inset 0 0 30px rgba(192, 132, 252, 0.05);
          }
          50% {
            box-shadow: 0 0 30px rgba(155, 93, 229, 0.25), 0 0 60px rgba(155, 93, 229, 0.12),
              inset 0 0 40px rgba(192, 132, 252, 0.08);
          }
        }
        .animate-drift { animation: drift 14s ease-in-out infinite; }
        .animate-blink-dot { animation: blink-dot 1.8s ease-in-out infinite; }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease both; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease both; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-[-2s] { animation-delay: -2s; }
        .animation-delay-[-6s] { animation-delay: -6s; }
        .animation-delay-[-10s] { animation-delay: -10s; }
        .bg-radial { background: radial-gradient(ellipse at center, var(--tw-gradient-stops)); }
        .floating-glow {
          animation: floating-glow 4s ease-in-out infinite !important;
        }
        .floating-card-main {
          filter: drop-shadow(0 0 30px rgba(155, 93, 229, 0.1));
        }
        .floating-card-active {
          filter: drop-shadow(0 0 25px rgba(192, 132, 252, 0.15));
        }
      `}</style>
    </div>
  );
}
