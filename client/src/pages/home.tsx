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
} from "lucide-react";
import { Link } from "wouter";
import { SiWhatsapp, SiGithub } from "react-icons/si";

function QuickLinkIcon({ icon }: { icon: string }) {
  if (icon === "Github") return <SiGithub className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#c084fc" }} />;
  if (icon === "Rocket") return <Rocket className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#c084fc" }} />;
  if (icon === "BarChart3") return <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#c084fc" }} />;
  return <Globe className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#c084fc" }} />;
}

function QuickLinksSection() {
  // Fetch links directly from API - NO hardcoding
  const { data: links = [], refetch } = useQuery<QuickLink[]>({
    queryKey: ["/api/quick-links"],
  });

  // Filter out hidden links and sort by order
  const visible = links
    .filter((l) => l.visible === true)
    .sort((a, b) => a.order - b.order);

  // Refetch every 5 seconds to reflect admin changes in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="space-y-3">
      {visible.map((link) => {
        const isInternal = link.url.startsWith("/");
        const inner = (
          <div
            className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#0d0820]/40 backdrop-blur-sm border border-[#9b5de5]/20 transition-all duration-200 hover:border-[#c084fc]/40 hover:bg-[#9b5de5]/10 group cursor-pointer"
            data-testid={`link-${link.key}`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#9b5de5]/15 border border-[#9b5de5]/25 flex items-center justify-center shrink-0">
              <QuickLinkIcon icon={link.icon} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-mono font-medium">{link.label}</p>
              <p className="text-gray-500 text-[10px] font-mono truncate">{link.subtitle}</p>
            </div>
            {isInternal
              ? <ArrowUpRight className="w-4 h-4 text-gray-600 transition-colors shrink-0 group-hover:text-[#c084fc]" />
              : <ExternalLink className="w-4 h-4 text-gray-600 transition-colors shrink-0 group-hover:text-[#c084fc]" />}
          </div>
        );

        return isInternal ? (
          <Link key={link.key} href={link.url}>{inner}</Link>
        ) : (
          <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer">{inner}</a>
        );
      })}
    </div>
  );
}

function GlassCard({
  children,
  className = "",
  hoverable = false,
}: {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}) {
  return (
    <div
      className={`relative backdrop-blur-md bg-[#0d0820]/30 border border-[#9b5de5]/20 rounded-2xl transition-all duration-300 ${
        hoverable ? "hover:border-[#c084fc]/40 hover:scale-[1.01] group" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function GlowText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`${className}`} style={{ color: "#c084fc", textShadow: "0 0 12px rgba(155,93,229,0.55), 0 0 28px rgba(155,93,229,0.2)" }}>
      {children}
    </span>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <GlassCard hoverable className="p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="p-2.5 rounded-xl bg-[#9b5de5]/10 border border-[#9b5de5]/20 shrink-0">
          <Icon className="w-5 h-5 text-[#c084fc]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-mono text-sm font-semibold mb-1">{title}</h3>
          <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#9b5de5]/40 group-hover:text-[#c084fc] transition-all duration-300 group-hover:rotate-45 shrink-0 mt-1" />
      </div>
    </GlassCard>
  );
}

function useWebSocket(sessionId: string | null) {
  const [wsData, setWsData] = useState<{
    status: SessionStatus;
    pairingCode: string | null;
    qrCode: string | null;
    credentialsBase64: string | null;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsData(null);
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", sessionId }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.event === "status") {
          setWsData((prev) => ({
            status: msg.data.status || prev?.status || "pending",
            pairingCode: msg.data.pairingCode || prev?.pairingCode || null,
            qrCode: msg.data.qrCode || prev?.qrCode || null,
            credentialsBase64: msg.data.credentialsBase64 || prev?.credentialsBase64 || null,
          }));
        }

        if (msg.event === "pairing_code") {
          setWsData((prev) => ({
            ...prev!,
            status: prev?.status || "connecting",
            pairingCode: msg.data.code,
            qrCode: prev?.qrCode || null,
            credentialsBase64: prev?.credentialsBase64 || null,
          }));
        }

        if (msg.event === "qr") {
          setWsData((prev) => ({
            ...prev!,
            status: prev?.status || "connecting",
            pairingCode: prev?.pairingCode || null,
            qrCode: msg.data.qrCode,
            credentialsBase64: prev?.credentialsBase64 || null,
          }));
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId]);

  return { wsData };
}

export default function Home() {
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState<"pairing" | "qr">("pairing");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [initialResponse, setInitialResponse] = useState<SessionResponse | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairServer, setPairServer] = useState(1);
  const [copiedPairing, setCopiedPairing] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);
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
      toast({ title: "Session Created", description: `Session ${data.sessionId} initialized` });
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
    (text: string, type: "pairing" | "session" | "creds") => {
      navigator.clipboard.writeText(text);
      if (type === "pairing") {
        setCopiedPairing(true);
        setTimeout(() => setCopiedPairing(false), 2000);
      } else if (type === "session") {
        setCopiedSession(true);
        setTimeout(() => setCopiedSession(false), 2000);
      } else {
        setCopiedCreds(true);
        setTimeout(() => setCopiedCreds(false), 2000);
      }
    },
    []
  );

  const displayStatus: SessionStatus = wsData?.status || initialResponse?.status || "pending";
  const displayPairingCode = wsData?.pairingCode || initialResponse?.pairingCode || null;
  const displayQrCode = wsData?.qrCode || initialResponse?.qrCode || null;
  const displayCredentials = wsData?.credentialsBase64 || null;

  const formatPairingCode = (code: string): string => {
    if (code.length === 8) {
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    return code;
  };

  return (
    <div className="min-h-screen bg-[#06040f] text-white relative overflow-x-hidden">
      {/* Background Image with reduced luminosity */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://i.ibb.co/PzZPCy4m/upload-1777031446938-c2f61fb6-jpg.jpg')] bg-cover bg-center bg-no-repeat opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06040f]/70 via-[#06040f]/50 to-[#06040f]/90" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(155,93,229,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(155,93,229,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[560px] bg-radial from-[#7c3aed]/20 via-[#5b21b6]/10 to-transparent blur-2xl" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-radial from-[#9b5de5]/15 to-transparent blur-2xl" />
        <div className="absolute w-[360px] h-[360px] top-[10%] left-[-8%] rounded-full bg-[#6d28d9]/15 blur-[60px] animate-drift" />
        <div className="absolute w-[280px] h-[280px] top-[20%] right-[-6%] rounded-full bg-[#9b5de5]/15 blur-[60px] animate-drift animation-delay-[-6s]" />
        <div className="absolute w-[220px] h-[220px] bottom-[15%] left-[30%] rounded-full bg-[#c084fc]/10 blur-[60px] animate-drift animation-delay-[-10s]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header Section - Centered */}
        <header className="text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#9b5de5]/30 bg-[#9b5de5]/10 backdrop-blur-sm mb-6 animate-fade-in-down">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-blink-dot" />
            <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
            <span className="font-mono text-xs tracking-wider text-[#c084fc]" data-testid="text-version">
              JUNE-X ULTRA v3.0.0
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4 tracking-tight font-display animate-fade-in-up">
            <GlowText>JUNE-X</GlowText>
            <span className="text-white"> ULTRA</span>
          </h1>
          <p className="text-gray-400 font-mono text-sm max-w-md mx-auto leading-relaxed animate-fade-in-up animation-delay-100">
            Next-Gen WhatsApp Session Generator
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap animate-fade-in-up animation-delay-200">
            <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-500">
              <Lock className="w-3 h-3 text-[#c084fc]" /> E2E Encrypted
            </span>
            <span className="text-[#9b5de5]/30">◆</span>
            <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-500">
              <Zap className="w-3 h-3 text-[#c084fc]" /> Instant Sync
            </span>
            <span className="text-[#9b5de5]/30">◆</span>
            <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-500">
              <SiWhatsapp className="w-3 h-3 text-[#c084fc]" /> Multi-Device
            </span>
          </div>
        </header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-8">
          
          {/* Left Column - Initialize Connection (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <GlassCard className="p-5 sm:p-7 lg:p-8">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[#9b5de5]/15">
                <div className="p-2 rounded-xl bg-[#9b5de5]/15 border border-[#9b5de5]/25">
                  <Cpu className="w-5 h-5 text-[#c084fc]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-mono">Initialize Connection</h2>
                  <p className="text-xs text-gray-500 font-mono">Deploy secure WhatsApp session</p>
                </div>
              </div>

              {/* Method Switcher */}
              <div className="relative flex gap-2 mb-8 p-1.5 rounded-xl bg-[#0d0820]/60 border border-[#9b5de5]/20">
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-[#9b5de5]/20 to-[#7c3aed]/20 border border-[#c084fc]/40 transition-all duration-300 ease-out ${
                    activeMethod === "pairing" ? "left-1.5" : "left-[calc(50%-2px)]"
                  }`}
                />
                <button
                  data-testid="button-method-pairing"
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm transition-all z-10 ${
                    activeMethod === "pairing" ? "text-[#c084fc]" : "text-gray-500 hover:text-gray-300"
                  }`}
                  onClick={() => setActiveMethod("pairing")}
                >
                  <Hash className="w-4 h-4" />
                  Pairing Code
                </button>
                <button
                  data-testid="button-method-qr"
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm transition-all z-10 ${
                    activeMethod === "qr" ? "text-[#c084fc]" : "text-gray-500 hover:text-gray-300"
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
                    <label className="block text-gray-400 text-xs uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                      <Server className="w-3 h-3" />
                      Deployment Server
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          data-testid={`button-server-${num}`}
                          onClick={() => setPairServer(num)}
                          className={`py-2.5 rounded-xl border font-mono text-sm transition-all ${
                            pairServer === num
                              ? "bg-[#9b5de5]/15 border-[#c084fc]/50 text-[#c084fc] shadow-lg shadow-[#9b5de5]/10"
                              : "bg-[#0d0820]/40 text-gray-500 border-[#9b5de5]/20 hover:border-[#9b5de5]/40 hover:text-gray-300"
                          }`}
                        >
                          S{num}
                        </button>
                      ))}
                    </div>
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
                        className="w-full pl-8 pr-4 py-3.5 bg-[#0d0820]/60 border border-[#9b5de5]/20 rounded-xl font-mono text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#c084fc]/50 focus:ring-1 focus:ring-[#c084fc]/20 transition-all"
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
                  <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-xl bg-[#0d0820]/40 border border-[#9b5de5]/20">
                    <QrCode className="w-8 h-8 text-[#c084fc]/60" />
                    <p className="text-gray-400 text-sm font-mono">
                      QR code will be generated from WhatsApp servers
                    </p>
                  </div>
                </div>
              )}

              <button
                data-testid="button-generate"
                disabled={generateMutation.isPending || (activeMethod === "pairing" && !phoneNumber) || !!currentSessionId}
                onClick={() => generateMutation.mutate(activeMethod)}
                className="w-full mt-7 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#9b5de5]/20 to-[#7c3aed]/20 border border-[#c084fc]/40 rounded-xl font-mono text-sm transition-all hover:from-[#9b5de5]/30 hover:to-[#7c3aed]/30 hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                style={{ color: "#c084fc", boxShadow: "0 0 15px rgba(155,93,229,0.15)" }}
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

            {/* Active Session Section */}
            {currentSessionId && (
              <GlassCard className="p-5 sm:p-7 lg:p-8 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[#9b5de5]/15">
                  <div className="p-2 rounded-xl bg-[#9b5de5]/15 border border-[#9b5de5]/25">
                    <Wifi className="w-5 h-5 text-[#c084fc]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-mono">Active Deployment</h2>
                    <p className="text-xs text-gray-500 font-mono">Real-time connection status</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#c084fc] animate-pulse" />
                    <span className="text-[10px] font-mono text-gray-500">ACTIVE</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-gray-500 text-[10px] uppercase tracking-wider font-mono mb-2">
                      Session Fingerprint
                    </label>
                    <div
                      className="flex items-center justify-between gap-3 p-3.5 bg-[#0d0820]/60 rounded-xl border border-[#9b5de5]/20 cursor-pointer transition-all hover:border-[#c084fc]/40 group"
                      onClick={() => handleCopy(currentSessionId, "session")}
                      data-testid="button-copy-session"
                    >
                      <span className="font-mono text-[#c084fc] text-xs tracking-wider truncate" data-testid="text-session-id">
                        {currentSessionId}
                      </span>
                      {copiedSession ? (
                        <Check className="w-4 h-4 text-[#c084fc] shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 shrink-0 group-hover:text-[#c084fc] transition-colors" />
                      )}
                    </div>
                  </div>

                  {displayPairingCode && (
                    <div>
                      <label className="block text-gray-500 text-[10px] uppercase tracking-wider font-mono mb-2">
                        Pairing Code
                      </label>
                      <div
                        className="flex items-center justify-between gap-3 p-5 bg-[#0d0820]/60 rounded-xl border border-[#c084fc]/30 cursor-pointer transition-all hover:border-[#c084fc]/60 group"
                        onClick={() => handleCopy(displayPairingCode, "pairing")}
                        data-testid="button-copy-pairing"
                      >
                        <span
                          className="font-mono text-2xl sm:text-3xl tracking-[0.25em] font-bold"
                          style={{ color: "#c084fc", textShadow: "0 0 20px rgba(155,93,229,0.4)" }}
                          data-testid="text-pairing-code"
                        >
                          {formatPairingCode(displayPairingCode)}
                        </span>
                        {copiedPairing ? (
                          <Check className="w-5 h-5 text-[#c084fc] shrink-0" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-500 shrink-0 group-hover:text-[#c084fc] transition-colors" />
                        )}
                      </div>
                      <p className="text-gray-600 text-[10px] font-mono mt-2">
                        WhatsApp → Linked Devices → Link with code
                      </p>
                    </div>
                  )}

                  {!displayPairingCode && activeMethod === "pairing" && displayStatus !== "connected" && displayStatus !== "failed" && (
                    <div className="flex items-center justify-center gap-3 p-6 bg-[#0d0820]/40 rounded-xl border border-[#9b5de5]/20">
                      <Loader2 className="w-5 h-5 text-[#c084fc] animate-spin shrink-0" />
                      <span className="text-gray-400 font-mono text-sm">Requesting pairing code...</span>
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

                  {!displayQrCode && activeMethod === "qr" && displayStatus !== "connected" && displayStatus !== "failed" && (
                    <div className="flex items-center justify-center gap-3 p-6 bg-[#0d0820]/40 rounded-xl border border-[#9b5de5]/20">
                      <Loader2 className="w-5 h-5 text-[#c084fc] animate-spin shrink-0" />
                      <span className="text-gray-400 font-mono text-sm">Generating QR code...</span>
                    </div>
                  )}

                  {displayStatus === "connected" && displayCredentials && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-gray-500 text-[10px] uppercase tracking-wider font-mono">
                          Session Credentials
                        </label>
                        <button
                          data-testid="button-copy-credentials"
                          onClick={() => handleCopy(`JUNE-X-ULTRA:~${displayCredentials}`, "creds")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9b5de5]/10 border border-[#c084fc]/30 font-mono text-xs text-[#c084fc] transition-all hover:bg-[#9b5de5]/20"
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
                        className="p-3.5 bg-[#0d0820]/60 rounded-xl border border-[#c084fc]/30 cursor-pointer transition-all hover:border-[#c084fc]/50"
                        onClick={() => handleCopy(`JUNE-X-ULTRA:~${displayCredentials}`, "creds")}
                        data-testid="div-credentials"
                      >
                        <code className="font-mono text-xs text-[#c084fc]/80 break-all">
                          JUNE-X-ULTRA:~{displayCredentials}
                        </code>
                      </div>
                    </div>
                  )}

                  {displayStatus === "failed" && (
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
                  className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl font-mono text-xs text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/50"
                >
                  {terminateMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Terminate Session
                </button>
              </GlassCard>
            )}
          </div>

          {/* Right Column - Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Hero Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-[#0d0820]/60 to-[#0d0820]/30 backdrop-blur-sm rounded-2xl p-4 text-center border border-[#9b5de5]/20 hover:border-[#c084fc]/30 transition-all">
                <div className="text-2xl font-bold text-[#c084fc] font-mono">2</div>
                <div className="text-[10px] text-gray-500 font-mono mt-1">PAIRING MODES</div>
              </div>
              <div className="bg-gradient-to-br from-[#0d0820]/60 to-[#0d0820]/30 backdrop-blur-sm rounded-2xl p-4 text-center border border-[#9b5de5]/20 hover:border-[#c084fc]/30 transition-all">
                <div className="text-2xl font-bold text-[#c084fc] font-mono">&lt;5s</div>
                <div className="text-[10px] text-gray-500 font-mono mt-1">DEPLOY TIME</div>
              </div>
              <div className="bg-gradient-to-br from-[#0d0820]/60 to-[#0d0820]/30 backdrop-blur-sm rounded-2xl p-4 text-center border border-[#9b5de5]/20 hover:border-[#c084fc]/30 transition-all">
                <div className="text-2xl font-bold text-[#c084fc] font-mono">E2E</div>
                <div className="text-[10px] text-gray-500 font-mono mt-1">ENCRYPTION</div>
              </div>
              <div className="bg-gradient-to-br from-[#0d0820]/60 to-[#0d0820]/30 backdrop-blur-sm rounded-2xl p-4 text-center border border-[#9b5de5]/20 hover:border-[#c084fc]/30 transition-all">
                <div className="text-2xl font-bold text-[#c084fc] font-mono">24/7</div>
                <div className="text-[10px] text-gray-500 font-mono mt-1">UPTIME</div>
              </div>
            </div>

            {/* Quick Links - FULLY DYNAMIC, reads from API */}
            <GlassCard className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-[#9b5de5]/10 border border-[#9b5de5]/20">
                  <Link2 className="w-4 h-4 text-[#c084fc]" />
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

            <GlassCard className="p-4 bg-gradient-to-r from-yellow-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-500/70" />
                <span className="text-[10px] font-mono text-yellow-500/70 uppercase tracking-wider">Security Protocol</span>
              </div>
              <p className="text-gray-600 text-[10px] font-mono leading-relaxed">
                Sessions auto-terminate after 5 minutes of inactivity. Store credentials securely.
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Footer Section */}
        <footer className="mt-16 sm:mt-20 text-center">
          <div className="border-t border-[#9b5de5]/15 pt-6 pb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-[#c084fc]/40" />
              <span className="font-mono text-xs text-gray-500">JUNE-X ULTRA Session Manager</span>
            </div>
            <p className="text-gray-700 text-[10px] font-mono">
              © 2026 JUNE-X ULTRA. Enterprise WhatsApp Session Management.
            </p>
          </div>
          
          {/* Permanent Footer Addition */}
          <div className="border-t border-[#9b5de5]/10 mt-4 pt-4 pb-6">
            <p className="text-[11px] font-mono tracking-wide">
              <span className="text-gray-600">Pair Site by</span>{' '}
              <span className="text-[#c084fc] font-semibold">WOLF TECH</span>{' '}
              <span className="text-gray-600">-</span>{' '}
              <span className="text-gray-500">Silent Wolf</span>
            </p>
          </div>
        </footer>
      </div>

      <style>{`
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
      `}</style>
    </div>
  );
}