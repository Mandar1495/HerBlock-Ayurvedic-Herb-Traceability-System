import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../app";
import { LayoutDashboard, Package, TrendingUp, LineChart, ShieldCheck, FileText, Network, Settings, LogOut, Bell } from "lucide-react";
import { Button } from "../components/button";

export default function DashboardLayout({ children, title, description, role }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border/50 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary">
              <span className="w-4 h-4 text-primary">🌿</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight leading-none block">AgriChain</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mt-0.5">Ledger Portal</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium text-sm">Overview</span>
          </Link>
          <Link to="/trace/ASHWA-TRACE-001" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            <Package className="w-5 h-5" />
            <span className="font-medium text-sm">Batch Tracking</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium text-sm">Farm Analytics</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            <LineChart className="w-5 h-5" />
            <span className="font-medium text-sm">Market Intel</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium text-sm">Token Vault</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            <FileText className="w-5 h-5" />
            <span className="font-medium text-sm">Smart Contracts</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            <Network className="w-5 h-5" />
            <span className="font-medium text-sm">Network</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </Link>
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="bg-background border border-border/50 rounded-lg p-3">
            <p className="text-xs font-semibold mb-2 text-foreground">Network Status</p>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground">Polygon zkEVM</span>
              <span className="flex items-center text-primary"><span className="w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse"></span>Online</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Gas Price</span>
              <span className="text-foreground">0.02 MATIC</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border/50 bg-card/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-bold text-lg">{title || "Dashboard Overview"}</h2>
              <p className="text-xs text-muted-foreground">{description || "Real-time supply chain intelligence"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-background border border-border/50 rounded-full px-4 py-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize px-2 py-0.5 rounded text-xs bg-primary/20 text-primary border border-primary/30 font-semibold">{role || "User"}</span>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
