import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Package, Truck, BarChart3, RefreshCw, Search, QrCode, ArrowRight } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/card";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from "../../components/dialog";
import { Label } from "../../components/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Aggregators receive batches from farmers, consolidate, and pass to processors.
// They can log a processing step (type = "aggregation") to record receipt + dispatch.
const LogAggregationDialog = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    facility_name: '',
    operator_name: '',
    input_quantity_kg: '',
    output_quantity_kg: '',
    destination: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/processing`, {
        product_id: formData.product_id,
        facility_id: `agg_${Date.now()}`,
        facility_name: formData.facility_name,
        process_type: "aggregation",
        equipment_used: `Aggregation Centre — ${formData.destination}`,
        operator_name: formData.operator_name,
        output_quantity_kg: parseFloat(formData.output_quantity_kg) || parseFloat(formData.input_quantity_kg),
      });
      toast.success("Aggregation step recorded on blockchain!");
      setOpen(false);
      setFormData({ product_id: '', facility_name: '', operator_name: '', input_quantity_kg: '', output_quantity_kg: '', destination: '', notes: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to record aggregation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start h-12 bg-indigo-600 text-white hover:bg-indigo-700">
          <Truck className="w-4 h-4 mr-3" /> Log Batch Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border/50 text-foreground">
        <DialogHeader>
          <DialogTitle>Log Batch Aggregation</DialogTitle>
          <DialogDesc>Record receipt of a farmer batch at your aggregation centre</DialogDesc>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="agg_product_id">Batch ID (from farmer)</Label>
            <Input id="agg_product_id" value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} required className="bg-background border-border/50 font-mono" placeholder="e.g. ASHWA-A-20260514-ABC123" />
          </div>
          <div>
            <Label htmlFor="agg_facility">Aggregation Centre Name</Label>
            <Input id="agg_facility" value={formData.facility_name} onChange={e => setFormData({...formData, facility_name: e.target.value})} required className="bg-background border-border/50" />
          </div>
          <div>
            <Label htmlFor="agg_operator">Aggregator Name</Label>
            <Input id="agg_operator" value={formData.operator_name} onChange={e => setFormData({...formData, operator_name: e.target.value})} required className="bg-background border-border/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agg_input">Received (kg)</Label>
              <Input id="agg_input" type="number" step="0.1" value={formData.input_quantity_kg} onChange={e => setFormData({...formData, input_quantity_kg: e.target.value})} required className="bg-background border-border/50" />
            </div>
            <div>
              <Label htmlFor="agg_output">Dispatched (kg)</Label>
              <Input id="agg_output" type="number" step="0.1" value={formData.output_quantity_kg} onChange={e => setFormData({...formData, output_quantity_kg: e.target.value})} className="bg-background border-border/50" placeholder="Optional" />
            </div>
          </div>
          <div>
            <Label htmlFor="agg_dest">Destination Processor</Label>
            <Input id="agg_dest" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} className="bg-background border-border/50" placeholder="e.g. Himalaya Drug Company" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? "Recording..." : "Record on Blockchain"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const FarmVerificationDialog = ({ event }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collector, setCollector] = useState(null);

  useEffect(() => {
    if (open && event?.collector_id && !collector) {
      setLoading(true);
      // Fetch collector profile to get farm_photos
      axios.get(`${API}/collector/${event.collector_id}`)
        .then(res => setCollector(res.data))
        .catch(err => toast.error("Failed to fetch collector profile"))
        .finally(() => setLoading(false));
    }
  }, [open, event, collector]);

  const batchPhoto = event?.photo_base64 ? `data:image/jpeg;base64,${event.photo_base64}` : null;
  const farmPhotos = collector?.farm_photos || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs mt-1 border-indigo-500/30 text-indigo-400">
          🔍 Verify Visuals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-card border-border/50 text-foreground">
        <DialogHeader>
          <DialogTitle>Visual Farm Verification</DialogTitle>
          <DialogDesc>Compare the submitted batch photo against the collector's registered farm photos.</DialogDesc>
        </DialogHeader>
        
        {loading ? (
          <div className="py-10 text-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Batch Photo */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-indigo-400">Submitted Crop Photo</h3>
              <p className="text-xs text-muted-foreground">From Batch: {event?.product_id}</p>
              <div className="aspect-square bg-black/20 rounded-lg overflow-hidden border border-border/50 flex items-center justify-center">
                {batchPhoto ? (
                  <img src={batchPhoto} alt="Batch Crop" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-xs">No crop photo provided</span>
                )}
              </div>
            </div>

            {/* Farm Reference Photos */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-green-400">Registered Farm Photos</h3>
              <p className="text-xs text-muted-foreground">Collector: {event?.collector_name || event?.collector_id}</p>
              
              <div className="grid grid-cols-2 gap-2 h-full">
                {farmPhotos.length > 0 ? farmPhotos.map((photoBase64, idx) => (
                  <div key={idx} className="aspect-square bg-black/20 rounded-lg overflow-hidden border border-border/50">
                    <img src={`data:image/jpeg;base64,${photoBase64}`} alt={`Farm ${idx}`} className="w-full h-full object-cover" />
                  </div>
                )) : (
                  <div className="col-span-2 aspect-square flex items-center justify-center border border-dashed border-border/50 rounded-lg">
                    <span className="text-muted-foreground text-xs text-center px-4">No reference photos uploaded by this collector.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function AggregatorDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [traceId, setTraceId] = useState("");

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const handleTrace = () => {
    if (!traceId.trim()) { toast.error("Enter a Batch ID to trace"); return; }
    window.location.href = `/trace/${traceId.trim()}`;
  };

  // Filter recent collections as incoming batches from farmers
  const incoming = (analytics?.recent_collections || []).filter(c => {
    return !search || c.product_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.species_name?.toLowerCase().includes(search.toLowerCase());
  });

  // Filter recent products as outgoing dispatches
  const outgoing = analytics?.recent_products || [];

  return (
    <DashboardLayout title="Aggregator Dashboard" description="Manage batch receipt, consolidation, and dispatch to processors" role="Aggregator">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Batches Received</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_collections || 0}</h3>
                <p className="text-xs text-primary mt-2">From farmers</p>
              </div>
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Package className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Dispatched</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_processing || 0}</h3>
                <p className="text-xs text-muted-foreground mt-2">Processing steps logged</p>
              </div>
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <Truck className="w-5 h-5 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Products Traced</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_products || 0}</h3>
                <p className="text-xs text-muted-foreground mt-2">Final formulations</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Blockchain Txs</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_blockchain_transactions || 0}</h3>
                <p className="text-xs text-muted-foreground mt-2">Immutable records</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <QrCode className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Trace */}
      <Card className="bg-card border-border/50 mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <QrCode className="w-5 h-5 text-primary flex-shrink-0" />
            <Input
              placeholder="Enter a Batch ID to trace its full supply chain..."
              value={traceId}
              onChange={e => setTraceId(e.target.value)}
              className="bg-background border-border/50"
              onKeyDown={e => e.key === 'Enter' && handleTrace()}
            />
            <Button onClick={handleTrace} className="bg-primary text-primary-foreground flex-shrink-0">
              Trace <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Incoming Batches */}
        <div className="md:col-span-2">
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div>
                <CardTitle>Incoming Batches</CardTitle>
                <CardDescription className="text-xs mt-1">Recent collections from farmers</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-9 h-9 w-40 bg-background border-border/50" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="h-9 border-border/50" onClick={fetchAnalytics}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {loading && (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Loading batches...</p>
                  </div>
                )}
                {!loading && incoming.length === 0 && (
                  <div className="p-8 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground">No incoming batches found.</p>
                  </div>
                )}
                {incoming.map((event, idx) => (
                  <div key={event.id || idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground font-mono text-sm">{event.product_id}</span>
                        {event.geo_validated && <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">📍 GPS ✅</Badge>}
                        {event.source === 'hardware_device' && <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-400">📡 Device</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{event.species_name} • {event.location_name}</p>
                      <p className="text-xs text-muted-foreground">From: {event.collector_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{event.quantity_kg ?? '—'} kg</p>
                      <Badge variant="outline" className="text-[10px] border-border/50">{event.quality_grade || '—'}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(event.timestamp).toLocaleDateString()}</p>
                      <div className="flex flex-col items-end gap-1 mt-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => window.location.href = `/trace/${event.product_id}`}>
                          Trace →
                        </Button>
                        <FarmVerificationDialog event={event} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              <LogAggregationDialog onSuccess={fetchAnalytics} />
              <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20 mt-2">
                <p className="text-xs font-semibold text-indigo-400 mb-2">📦 Your Role</p>
                <p className="text-xs text-muted-foreground">
                  As an aggregator, you receive raw herb batches from multiple farmers, consolidate them, and dispatch to processors or manufacturers. All receipts and dispatches are recorded on the blockchain.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent products dispatched */}
          <Card className="bg-card border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm">Recent Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {outgoing.length === 0 && (
                  <p className="p-4 text-xs text-center text-muted-foreground">No products yet.</p>
                )}
                {outgoing.map((p, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.batch_id}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => window.location.href = `/trace/${p.batch_id}`}>
                      <QrCode className="w-3 h-3 mr-1" /> Trace
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
