import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuickLink } from "@shared/schema";
import {
  Shield,
  Link2,
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
  LogOut,
  BarChart3,
  Rocket,
  Bot,
  Sparkles,
  Lock,
  Cpu,
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { Link } from "wouter";

function QuickLinkIcon({ icon }: { icon: string }) {
  if (icon === "Github") return <SiGithub className="w-4 h-4 text-[#c084fc]" />;
  if (icon === "Rocket") return <Rocket className="w-4 h-4 text-[#c084fc]" />;
  return <BarChart3 className="w-4 h-4 text-[#c084fc]" />;
}

function LoginScreen({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("POST", "/api/admin/verify", { password });
      onLogin(password);
    } catch {
      setError("Invalid password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(155,93,229,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(155,93,229,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[560px] bg-radial from-[#7c3aed]/20 via-[#5b21b6]/10 to-transparent blur-2xl" />
        <div className="absolute w-[360px] h-[360px] top-[10%] left-[-8%] rounded-full bg-[#6d28d9]/15 blur-[60px] animate-drift" />
        <div className="absolute w-[280px] h-[280px] top-[20%] right-[-6%] rounded-full bg-[#9b5de5]/15 blur-[60px] animate-drift animation-delay-[-6s]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="p-2 rounded-xl bg-[#9b5de5]/10 border border-[#c084fc]/30 animate-pulse-ring">
            <Shield className="w-6 h-6 text-[#c084fc]" />
          </div>
          <div>
            <h1 className="text-white font-display font-bold text-lg font-mono">JUNE-X ULTRA</h1>
            <p className="text-gray-500 font-mono text-xs">Admin Management</p>
          </div>
        </div>
        <div className="backdrop-blur-md bg-[#0d0820]/40 border border-[#9b5de5]/20 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-2 block flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                data-testid="input-admin-password"
                className="w-full bg-[#0d0820]/60 border border-[#9b5de5]/20 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-[#c084fc]/50 transition-colors"
              />
            </div>
            {error && (
              <p className="text-red-400 font-mono text-xs" data-testid="text-login-error">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              data-testid="button-admin-login"
              className="w-full bg-gradient-to-r from-[#9b5de5]/20 to-[#7c3aed]/20 border border-[#c084fc]/40 rounded-xl font-mono text-sm py-3 text-[#c084fc] transition-all hover:from-[#9b5de5]/30 hover:to-[#7c3aed]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -30px); }
          66% { transform: translate(-15px, 20px); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-drift { animation: drift 14s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
        .animation-delay-[-6s] { animation-delay: -6s; }
        .bg-radial { background: radial-gradient(ellipse at center, var(--tw-gradient-stops)); }
      `}</style>
    </div>
  );
}

function EditLinkRow({ link, adminPassword, onSaved }: { link: QuickLink; adminPassword: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(link.label);
  const [subtitle, setSubtitle] = useState(link.subtitle);
  const [url, setUrl] = useState(link.url);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<QuickLink>) =>
      apiRequest("PATCH", `/api/admin/quick-links/${link.key}`, data, {
        "x-admin-password": adminPassword,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-links"] });
      onSaved();
      setEditing(false);
    },
    onError: () => toast({ title: "Error", description: "Failed to update link", variant: "destructive" }),
  });

  const toggleVisible = () => updateMutation.mutate({ visible: !link.visible });
  const saveEdit = () => updateMutation.mutate({ label, subtitle, url });
  const cancelEdit = () => { setLabel(link.label); setSubtitle(link.subtitle); setUrl(link.url); setEditing(false); };

  return (
    <div
      className={`border rounded-xl p-4 transition-all duration-200 ${link.visible ? "border-[#9b5de5]/20 bg-[#0d0820]/30" : "border-[#9b5de5]/10 bg-[#0d0820]/15 opacity-60"}`}
      data-testid={`row-link-${link.key}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#9b5de5]/10 border border-[#9b5de5]/20 flex items-center justify-center shrink-0 mt-0.5">
          <QuickLinkIcon icon={link.icon} />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label"
                data-testid={`input-label-${link.key}`}
                className="w-full bg-[#0d0820]/60 border border-[#9b5de5]/20 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-[#c084fc]/50 transition-colors"
              />
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Subtitle"
                data-testid={`input-subtitle-${link.key}`}
                className="w-full bg-[#0d0820]/60 border border-[#9b5de5]/20 rounded-lg px-3 py-1.5 text-gray-400 font-mono text-xs focus:outline-none focus:border-[#c084fc]/50 transition-colors"
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URL"
                data-testid={`input-url-${link.key}`}
                className="w-full bg-[#0d0820]/60 border border-[#9b5de5]/20 rounded-lg px-3 py-1.5 text-gray-400 font-mono text-xs focus:outline-none focus:border-[#c084fc]/50 transition-colors"
              />
            </div>
          ) : (
            <div>
              <p className="text-white font-mono text-sm font-medium truncate">{link.label}</p>
              <p className="text-gray-500 font-mono text-[10px] truncate">{link.subtitle}</p>
              <p className="text-gray-700 font-mono text-[10px] truncate mt-0.5">{link.url}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={updateMutation.isPending}
                data-testid={`button-save-${link.key}`}
                className="p-1.5 rounded-lg bg-[#9b5de5]/10 hover:bg-[#9b5de5]/20 text-[#c084fc] transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEdit}
                data-testid={`button-cancel-${link.key}`}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                data-testid={`button-edit-${link.key}`}
                className="p-1.5 rounded-lg bg-[#0d0820]/50 hover:bg-[#9b5de5]/10 text-gray-400 hover:text-[#c084fc] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={toggleVisible}
                disabled={updateMutation.isPending}
                data-testid={`button-toggle-${link.key}`}
                className={`p-1.5 rounded-lg transition-colors ${link.visible ? "bg-[#9b5de5]/10 hover:bg-[#9b5de5]/20 text-[#c084fc]" : "bg-[#0d0820]/50 hover:bg-[#0d0820]/80 text-gray-600"}`}
              >
                {link.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [adminPassword, setAdminPassword] = useState<string | null>(() => sessionStorage.getItem("june_x_admin_pw"));
  const { toast } = useToast();

  const { data: links = [], refetch } = useQuery<QuickLink[]>({
    queryKey: ["/api/quick-links"],
    enabled: !!adminPassword,
  });

  function handleLogin(password: string) {
    sessionStorage.setItem("june_x_admin_pw", password);
    setAdminPassword(password);
    toast({ title: "Access Granted", description: "Welcome to JUNE-X ULTRA Admin" });
  }

  function handleLogout() {
    sessionStorage.removeItem("june_x_admin_pw");
    setAdminPassword(null);
  }

  if (!adminPassword) return <LoginScreen onLogin={handleLogin} />;

  const sorted = [...links].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[#06040f] p-4 sm:p-8 relative overflow-hidden">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(155,93,229,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(155,93,229,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[560px] bg-radial from-[#7c3aed]/20 via-[#5b21b6]/10 to-transparent blur-2xl" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-radial from-[#9b5de5]/15 to-transparent blur-2xl" />
        <div className="absolute w-[360px] h-[360px] top-[10%] left-[-8%] rounded-full bg-[#6d28d9]/15 blur-[60px] animate-drift" />
        <div className="absolute w-[280px] h-[280px] top-[20%] right-[-6%] rounded-full bg-[#9b5de5]/15 blur-[60px] animate-drift animation-delay-[-6s]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#9b5de5]/10 border border-[#c084fc]/30">
              <Cpu className="w-5 h-5 text-[#c084fc]" />
            </div>
            <div>
              <h1 className="text-white font-display font-bold font-mono text-xl">JUNE-X ULTRA</h1>
              <p className="text-gray-500 font-mono text-xs">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <button
                data-testid="button-goto-home"
                className="px-3 py-2 rounded-xl bg-[#0d0820]/40 border border-[#9b5de5]/20 hover:border-[#c084fc]/40 text-gray-400 hover:text-white font-mono text-xs transition-all"
              >
                Home
              </button>
            </Link>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="backdrop-blur-md bg-[#0d0820]/30 border border-[#9b5de5]/20 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-[#9b5de5]/10 border border-[#9b5de5]/20">
              <Link2 className="w-4 h-4 text-[#c084fc]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono">Quick Links Manager</h2>
              <p className="text-xs text-gray-500 font-mono">Toggle visibility or edit any link</p>
            </div>
          </div>
          <div className="space-y-3">
            {sorted.map((link) => (
              <EditLinkRow
                key={link.key}
                link={link}
                adminPassword={adminPassword}
                onSaved={() => refetch()}
              />
            ))}
            {sorted.length === 0 && (
              <p className="text-gray-600 font-mono text-sm text-center py-6">No links found</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Bot className="w-3 h-3 text-gray-700" />
          <span className="text-gray-700 font-mono text-[10px]">JUNE-X ULTRA Admin v3.0.0</span>
        </div>
      </div>

      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -30px); }
          66% { transform: translate(-15px, 20px); }
        }
        .animate-drift { animation: drift 14s ease-in-out infinite; }
        .animation-delay-[-6s] { animation-delay: -6s; }
        .bg-radial { background: radial-gradient(ellipse at center, var(--tw-gradient-stops)); }
      `}</style>
    </div>
  );
}