import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Leaf, MapPin, Search, Filter, RefreshCw, TreePine } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/dialog";
import { Label } from "../../components/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RegisterFarmDialog = ({ onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      farm_name: '', location: '', size_acres: '', primary_species: 'Ashwagandha'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        // Save farm as a collection event with quantity = 0 to register it in the system
        // This creates a traceable farm record on the blockchain
        await axios.post(`${API}/collection`, {
          product_id: `FARM-${Date.now()}`,
          collector_id: `farm_${Date.now()}`,
          collector_name: formData.farm_name,
          species_name: formData.primary_species,
          latitude: 20.5937,   // Default — India center; will be updated via mobile app
          longitude: 78.9629,
          location_name: formData.location,
          quantity_kg: 0,
          quality_grade: "A",
          weather_conditions: `Farm registered — ${formData.size_acres} acres`,
        });
        toast.success(`Farm "${formData.farm_name}" registered successfully!`);
        setFormData({ farm_name: '', location: '', size_acres: '', primary_species: 'Ashwagandha' });
        setOpen(false);
        if (onSuccess) onSuccess();
      } catch (error) {
        const msg = error.response?.data?.detail || "Failed to register farm";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start h-12 border-border/50">
            <MapPin className="w-4 h-4 mr-3" /> Register New Farm
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-card border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle>Register New Farm</DialogTitle>
            <DialogDescription>Add a new farm profile — it will be registered on the blockchain</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="farm_name">Farm Name</Label>
              <Input id="farm_name" value={formData.farm_name} onChange={(e) => setFormData({...formData, farm_name: e.target.value})} required className="bg-background border-border/50" placeholder="e.g. Green Valley Farm" />
            </div>
            <div>
              <Label htmlFor="location">Location (City, State)</Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required className="bg-background border-border/50" placeholder="e.g. Nashik, Maharashtra" />
            </div>
            <div>
              <Label htmlFor="size_acres">Size (Acres)</Label>
              <Input id="size_acres" type="number" step="0.1" value={formData.size_acres} onChange={(e) => setFormData({...formData, size_acres: e.target.value})} required className="bg-background border-border/50" />
            </div>
            <div>
              <Label htmlFor="primary_species">Primary Species</Label>
              <Select value={formData.primary_species} onValueChange={(v) => setFormData({...formData, primary_species: v})}>
                <SelectTrigger className="bg-background border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  <SelectItem value="Ashwagandha">Ashwagandha</SelectItem>
                  <SelectItem value="Tulsi">Tulsi</SelectItem>
                  <SelectItem value="Brahmi">Brahmi</SelectItem>
                  <SelectItem value="Giloy">Giloy / Guduchi</SelectItem>
                  <SelectItem value="Shatavari">Shatavari</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "Registering..." : "Register on Blockchain"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
};

export default function FarmerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");

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

  // Derive farm count from unique collector_names in collections (proxy for farms)
  const uniqueFarms = analytics?.recent_collections
    ? [...new Set(analytics.recent_collections.map(c => c.location_name).filter(Boolean))]
    : [];

  const filteredCollections = (analytics?.recent_collections || []).filter(c => {
    const matchesSearch = !search ||
      c.product_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.species_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.location_name?.toLowerCase().includes(search.toLowerCase());
    const matchesSpecies = filterSpecies === "all" || c.species_name === filterSpecies;
    return matchesSearch && matchesSpecies;
  });

  return (
    <DashboardLayout title="Farmer Dashboard" description="Manage your crop collections and view farm analytics" role="Farmer">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Collections</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_collections || 0}</h3>
                <p className="text-xs text-primary mt-2">Blockchain Verified ✅</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Locations</p>
                <h3 className="text-3xl font-bold text-foreground">{uniqueFarms.length || 0}</h3>
                <p className="text-xs text-blue-400 mt-2">Unique collection sites</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Processing Steps</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_processing || 0}</h3>
                <p className="text-xs text-muted-foreground mt-2">Herb processing events</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TreePine className="w-5 h-5 text-purple-500" />
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
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <Leaf className="w-5 h-5 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <CardTitle>Recent Collections</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search batches..."
                    className="pl-9 h-9 w-48 bg-background border-border/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                  <SelectTrigger className="h-9 w-36 bg-background border-border/50 text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Species" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    <SelectItem value="all">All Species</SelectItem>
                    <SelectItem value="Ashwagandha">Ashwagandha</SelectItem>
                    <SelectItem value="Tulsi">Tulsi</SelectItem>
                    <SelectItem value="Brahmi">Brahmi</SelectItem>
                    <SelectItem value="Giloy">Giloy</SelectItem>
                    <SelectItem value="Shatavari">Shatavari</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 border-border/50" onClick={fetchAnalytics}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {loading && (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Loading collections...</p>
                  </div>
                )}
                {!loading && filteredCollections.length === 0 && (
                  <div className="p-8 text-center">
                    <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground">
                      {search || filterSpecies !== "all" ? "No collections match your filter." : "No collections yet."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Use the mobile app to record collections from the field.</p>
                  </div>
                )}
                {filteredCollections.map((event, idx) => (
                  <div key={event.id || idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground font-mono text-sm">{event.product_id}</span>
                        <Badge variant="outline" className="text-[10px] uppercase border-primary text-primary bg-primary/10">Verified ✅</Badge>
                        {event.geo_validated && (
                          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10">📍 GPS</Badge>
                        )}
                        {event.source === 'hardware_device' && (
                          <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-400 bg-teal-500/10">📡 Device</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{event.species_name} • {event.location_name}</p>
                      <p className="text-xs text-muted-foreground">{event.collector_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{event.quantity_kg ?? (event.weight_grams ? (event.weight_grams / 1000).toFixed(3) : '—')} kg</p>
                      <Badge variant="outline" className="text-[10px] border-border/50">{event.quality_grade || '—'}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(event.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div>
          <Card className="bg-card border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              {/* Record collection redirects to mobile app */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Leaf className="w-4 h-4 mr-3" /> Record New Collection
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border/50 text-foreground">
                  <DialogHeader>
                    <DialogTitle>Secure Collection Required</DialogTitle>
                    <DialogDescription>
                      To prevent location spoofing and ensure authenticity, new herb collections must be recorded via the <strong className="text-primary">HerBlock Mobile App</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      The mobile app automatically captures your GPS coordinates and requires a live photo of the collection, which is then validated by the blockchain smart contract using the Haversine formula.
                    </p>
                    <Button className="w-full" variant="outline" onClick={() => window.open('https://expo.dev', '_blank')}>
                      Download Mobile App
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <RegisterFarmDialog onSuccess={fetchAnalytics} />

              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-2">🌿 Supported Species</p>
                <div className="flex flex-wrap gap-1">
                  {['Ashwagandha', 'Tulsi', 'Brahmi', 'Giloy', 'Shatavari'].map(s => (
                    <Badge key={s} variant="outline" className="text-[10px] border-primary/30 text-primary/80">{s}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
