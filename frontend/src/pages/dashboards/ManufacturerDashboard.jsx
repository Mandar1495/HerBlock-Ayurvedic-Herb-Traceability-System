import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Users, Plus, Package, Activity } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/dialog";
import { Label } from "../../components/label";
import { Input } from "../../components/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddProcessingDialog = ({ onSuccess }) => {
    const [open, setOpen] = useState(false); const [formData, setFormData] = useState({ product_id: '', facility_name: '', process_type: 'drying', equipment_used: '', operator_name: '', output_quantity_kg: '' });
    const handleSubmit = async (e) => { e.preventDefault(); try { await axios.post(`${API}/processing`, { ...formData, facility_id: `facility_${Date.now()}`, output_quantity_kg: parseFloat(formData.output_quantity_kg) }); toast.success("Processing step added!"); setOpen(false); if(onSuccess) onSuccess(); } catch (error) { toast.error("Failed to add processing step"); } };
    return ( <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="w-full justify-start h-12 bg-blue-600 text-white hover:bg-blue-700"><Users className="w-4 h-4 mr-3" />Record Processing Step</Button></DialogTrigger><DialogContent className="max-w-md bg-card border-border/50 text-foreground"><DialogHeader><DialogTitle>Add Processing Step</DialogTitle><DialogDescription>Record herb processing operation</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-4"><div><Label htmlFor="product_id">Batch ID</Label><Input id="product_id" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} required className="bg-background border-border/50" /></div><div><Label htmlFor="facility_name">Facility Name</Label><Input id="facility_name" value={formData.facility_name} onChange={(e) => setFormData({...formData, facility_name: e.target.value})} required className="bg-background border-border/50" /></div><div><Label htmlFor="process_type">Process Type</Label><Select value={formData.process_type} onValueChange={(v) => setFormData({...formData, process_type: v})}><SelectTrigger className="bg-background border-border/50"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border/50"><SelectItem value="drying">Drying</SelectItem><SelectItem value="grinding">Grinding</SelectItem><SelectItem value="extraction">Extraction</SelectItem></SelectContent></Select></div><div><Label htmlFor="equipment_used">Equipment Used</Label><Input id="equipment_used" value={formData.equipment_used} onChange={(e) => setFormData({...formData, equipment_used: e.target.value})} required className="bg-background border-border/50" /></div><div><Label htmlFor="operator_name">Operator Name</Label><Input id="operator_name" value={formData.operator_name} onChange={(e) => setFormData({...formData, operator_name: e.target.value})} required className="bg-background border-border/50" /></div><div><Label htmlFor="output_quantity_kg">Output Quantity (kg)</Label><Input id="output_quantity_kg" type="number" step="0.1" value={formData.output_quantity_kg} onChange={(e) => setFormData({...formData, output_quantity_kg: e.target.value})} required className="bg-background border-border/50" /></div><Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Add Processing Step</Button></form></DialogContent></Dialog> );
};

const AddProductDialog = ({ onSuccess }) => {
    const [open, setOpen] = useState(false); const [formData, setFormData] = useState({ product_name: '', batch_id: '', species_name: 'Ashwagandha', manufacturer: '', final_quantity_kg: '' });
    const handleSubmit = async (e) => { e.preventDefault(); try { await axios.post(`${API}/product`, { ...formData, manufacturing_date: new Date().toISOString(), expiry_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), final_quantity_kg: parseFloat(formData.final_quantity_kg), certifications: ['Organic', 'GMP'] }); toast.success("Product created!"); setOpen(false); if(onSuccess) onSuccess(); } catch (error) { toast.error("Failed to create product"); } };
    return ( <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2"/> Add Product</Button></DialogTrigger><DialogContent className="max-w-md bg-card border-border/50 text-foreground"><DialogHeader><DialogTitle>Add New Product</DialogTitle><DialogDescription>Create final formulated product</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-4"><div><Label htmlFor="product_name">Product Name</Label><Input id="product_name" value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} required className="bg-background border-border/50" /></div><div><Label htmlFor="batch_id">Batch ID</Label><Input id="batch_id" value={formData.batch_id} onChange={(e) => setFormData({...formData, batch_id: e.target.value})} required className="bg-background border-border/50" /></div><div><Label htmlFor="species_name">Primary Species</Label><Select value={formData.species_name} onValueChange={(v) => setFormData({...formData, species_name: v})}><SelectTrigger className="bg-background border-border/50"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border/50"><SelectItem value="Ashwagandha">Ashwagandha</SelectItem><SelectItem value="Turmeric">Turmeric</SelectItem><SelectItem value="Tulsi">Tulsi</SelectItem></SelectContent></Select></div><div><Label htmlFor="manufacturer">Manufacturer</Label><Input id="manufacturer" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} required className="bg-background border-border/50" /></div><div><Label htmlFor="final_quantity_kg">Final Quantity (kg)</Label><Input id="final_quantity_kg" type="number" step="0.1" value={formData.final_quantity_kg} onChange={(e) => setFormData({...formData, final_quantity_kg: e.target.value})} required className="bg-background border-border/50" /></div><Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Create Product</Button></form></DialogContent></Dialog> );
};

const ViewQRDialog = ({ product }) => {
  if (!product.qr_code_image) return null;
  
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${product.qr_code_image}`;
    a.download = `QR_${product.batch_id}.png`;
    a.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mr-2 text-emerald-500 border-emerald-500/30">
          Print QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs text-center bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Product QR Code</DialogTitle>
          <DialogDescription>Attach this QR code to the final packaging.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl mx-auto my-2">
          <img src={`data:image/png;base64,${product.qr_code_image}`} alt="QR Code" className="w-48 h-48" />
        </div>
        <p className="text-xs font-mono text-muted-foreground mt-2">{product.batch_id}</p>
        <Button onClick={handleDownload} className="w-full mt-4 bg-emerald-600 text-white hover:bg-emerald-700">
          Download PNG
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default function ManufacturerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <DashboardLayout title="Manufacturer Dashboard" description="Manage processing steps and final products" role="Manufacturer">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Products</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_products || 0}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
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
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <CardTitle>Recent Products</CardTitle>
            <AddProductDialog onSuccess={fetchAnalytics} />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {analytics?.recent_products?.map((product, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{product.product_name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase border-primary text-primary bg-primary/10">Tokenized</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Batch: {product.batch_id}</p>
                  </div>
                    <div className="text-right flex items-center justify-end">
                      <ViewQRDialog product={product} />
                      <Button variant="ghost" size="sm" onClick={() => window.location.href=`/trace/${product.batch_id}`}>Trace</Button>
                    </div>
                </div>
              ))}
              {(!analytics?.recent_products || analytics.recent_products.length === 0) && (
                 <p className="p-8 text-center text-muted-foreground">No recent products found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-3">
            <AddProcessingDialog onSuccess={fetchAnalytics} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
