import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Leaf, Shield, Blocks, Cpu, MapPin, FlaskConical, Package, QrCode, Camera } from "lucide-react";
import { Button } from "../components/button";
import { Html5QrcodeScanner } from "html5-qrcode";
import { BlockchainStatus, EndorsementPanel } from "../components/BlockchainStatus";

export default function LandingPage() {
  const navigate = useNavigate();
  const [traceInput, setTraceInput] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleTrace = () => {
    const id = traceInput.trim();
    if (!id) return;
    navigate(`/trace/${id}`);
  };

  useEffect(() => {
    if (!isScannerOpen) return;

    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          "landing-qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            let batchId = decodedText.trim();
            if (decodedText.includes("/trace/")) {
              const parts = decodedText.split("/trace/");
              batchId = parts[parts.length - 1];
            }
            navigate(`/trace/${batchId}`);
            scanner.clear().catch(e => console.warn(e));
            setIsScannerOpen(false);
          },
          (err) => {
            // silent
          }
        );

        return () => {
          scanner.clear().catch(e => console.warn(e));
        };
      } catch (e) {
        console.error("Scanner setup failed", e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isScannerOpen, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">HerBlock</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
            <Link to="/" className="text-foreground">Home</Link>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/blockchain" className="hover:text-emerald-400 hover:text-foreground transition-colors flex items-center gap-1 font-semibold text-emerald-450">
              <Blocks className="w-4 h-4" /> Blockchain Explorer
            </Link>
            <Link to="/trace/ASHWA-TRACE-001" className="hover:text-foreground transition-colors">Demo Trace</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-sm font-medium">Log In</Button>
            </Link>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,0,0.3)]" onClick={() => navigate('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50 pointer-events-none"></div>
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Patent Pending · Hyperledger Fabric · GPS Validated
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Ayurvedic Herb<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-green-400 to-primary drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
              Traceability System
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            From field to pharmacy — every Ayurvedic herb batch tracked with GPS-validated blockchain records, immutable quality tests, and real-time supply chain transparency.
          </p>

          {/* Quick Trace Bar */}
          <div className="flex gap-2 max-w-lg mx-auto mb-6">
            <input
              type="text"
              placeholder="Enter Batch ID (e.g. ASHWA-TRACE-001) to verify..."
              value={traceInput}
              onChange={e => setTraceInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrace()}
              className="flex-1 h-12 px-4 rounded-lg bg-card border border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button 
              type="button"
              className="h-12 px-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 flex items-center gap-1.5 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              onClick={() => setIsScannerOpen(true)}
            >
              <Camera className="w-5 h-5" /> Scan QR
            </Button>
            <Button className="h-12 px-5 bg-primary text-primary-foreground" onClick={handleTrace}>
              Verify
            </Button>
          </div>

          {/* Quick Ledger Status Box */}
          <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="shadow-lg hover:shadow-emerald-500/5 transition-all">
              <BlockchainStatus />
            </div>
            <div className="shadow-lg hover:shadow-blue-500/5 transition-all">
              <EndorsementPanel />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,0,0.4)]" onClick={() => navigate('/login')}>
              Open Dashboard <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7 border-border/60" onClick={() => navigate('/trace/ASHWA-TRACE-001')}>
              See Demo Trace
            </Button>
          </div>
        </div>
      </section>

      {/* Supply Chain Steps */}
      <section className="border-y border-border/40 bg-card/50 py-16">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-muted-foreground mb-10 uppercase tracking-widest">
            Complete Supply Chain Visibility
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-0">
            {[
              { icon: MapPin, label: "GPS Collection", desc: "Field → GPS validated" },
              { icon: Package, label: "Aggregation", desc: "Batch consolidation" },
              { icon: Leaf, label: "Processing", desc: "Drying · Grinding" },
              { icon: FlaskConical, label: "Lab Testing", desc: "Quality certification" },
              { icon: Shield, label: "Consumer Verify", desc: "QR → Blockchain proof" },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-primary/40 hidden md:block flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Leaf, label: "Blockchain Txs", value: "10,000+" },
              { icon: Blocks, label: "Herb Batches", value: "3,200+" },
              { icon: Shield, label: "GPS Validated", value: "99.8%" },
              { icon: Cpu, label: "Hyperledger Fabric", value: "2-Org" },
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-xl p-6 flex items-center gap-4 hover:border-primary/50 transition-colors">
                <stat.icon className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="text-2xl font-bold">{stat.value}</h4>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patent Features */}
      <section className="py-16 px-4 bg-card/30 border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium mb-4">
              🔬 Patent Pending Technology
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why HerBlock is <span className="text-primary">Unique</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: "GPS Geo-Fence Validation",
                desc: "Haversine formula validates every herb collection GPS coordinate against approved NMPB zones. Collections outside geographic limits are automatically rejected by the blockchain.",
                badge: "Patent Claim 1",
              },
              {
                icon: Shield,
                title: "Immutable SHA-256 Records",
                desc: "Every supply chain event is cryptographically fingerprinted with SHA-256 before recording. A Merkle root ties all batch records together — tampering is mathematically detectable.",
                badge: "Patent Claim 2",
              },
              {
                icon: Blocks,
                title: "Multi-Org Endorsement",
                desc: "Org1 (Farmers) and Org2 (Processors/QC) must both endorse every transaction. No single party can forge supply chain records — requires consensus from both organisations.",
                badge: "Patent Claim 3",
              },
            ].map((f, i) => (
              <div key={i} className="group bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all hover:shadow-[0_0_30px_rgba(0,255,0,0.08)]">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-500/30 text-amber-400 bg-amber-500/10">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Herbs */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-8">Supported Ayurvedic Species</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "Ashwagandha", latin: "Withania somnifera", zones: "MP · RJ · GJ · MH" },
              { name: "Tulsi", latin: "Ocimum sanctum", zones: "UP · MP · BR · KA" },
              { name: "Brahmi", latin: "Bacopa monnieri", zones: "KL · TN · WB · AS" },
              { name: "Giloy", latin: "Tinospora cordifolia", zones: "KA · MH · TN" },
              { name: "Shatavari", latin: "Asparagus racemosus", zones: "RJ · MP · UP · HP" },
            ].map((herb, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-xl px-5 py-4 text-left hover:border-primary/40 transition-colors">
                <p className="font-semibold text-foreground">{herb.name}</p>
                <p className="text-xs text-muted-foreground italic mt-0.5">{herb.latin}</p>
                <p className="text-xs text-primary mt-1">📍 {herb.zones}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center border border-primary">
              <Leaf className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg">HerBlock</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 HerBlock India · Patent Pending · Indian Patent Office · Built on Hyperledger Fabric
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
            <Link to="/trace/ASHWA-TRACE-001" className="hover:text-foreground transition-colors">Demo Trace</Link>
          </div>
        </div>
      </footer>

      {/* QR Code Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-105 animate-in fade-in-50 zoom-in-95 duration-200">
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-202 text-xl font-semibold"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              Scan Product QR Code
            </h3>
            <p className="text-xs text-slate-450 mb-6 leading-relaxed">
              Present the printed Ayurvedic product label QR code to your device camera. The ledger will automatically pull the complete geofenced supply chain pedigree.
            </p>
            <div id="landing-qr-reader" className="w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800 shadow-inner"></div>
          </div>
        </div>
      )}
    </div>
  );
}
