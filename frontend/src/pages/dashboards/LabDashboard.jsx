import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FlaskConical, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/dialog";
import { Label } from "../../components/label";
import { Input } from "../../components/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/select";
import { Textarea } from "../../components/textarea";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TEST_TYPE_LABELS = {
  moisture: "Moisture Content",
  pesticide: "Pesticide Analysis",
  heavy_metals: "Heavy Metals",
  microbial: "Microbial Count",
  alkaloid: "Alkaloid Profiling",
};

const AddQualityTestDialog = ({ onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
      product_id: '', lab_name: '', test_type: 'moisture',
      test_result: '', pass_fail: 'PASS', tested_by: ''
    });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`${API}/quality`, { ...formData, lab_id: `lab_${Date.now()}` });
        toast.success("Quality test recorded on blockchain!");
        setOpen(false);
        if (onSuccess) onSuccess();
      } catch (error) {
        toast.error("Failed to add quality test");
      }
    };
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full justify-start h-12 bg-orange-600 text-white hover:bg-orange-700">
            <FlaskConical className="w-4 h-4 mr-3" />Record Quality Test
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-card border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle>Add Quality Test</DialogTitle>
            <DialogDescription>Record quality test results on the blockchain</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="product_id">Batch ID</Label>
              <Input id="product_id" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} required className="bg-background border-border/50" placeholder="e.g. ASHWA-TRACE-001" />
            </div>
            <div>
              <Label htmlFor="lab_name">Lab Name</Label>
              <Input id="lab_name" value={formData.lab_name} onChange={(e) => setFormData({...formData, lab_name: e.target.value})} required className="bg-background border-border/50" />
            </div>
            <div>
              <Label htmlFor="test_type">Test Type</Label>
              <Select value={formData.test_type} onValueChange={(v) => setFormData({...formData, test_type: v})}>
                <SelectTrigger className="bg-background border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  <SelectItem value="moisture">Moisture Content</SelectItem>
                  <SelectItem value="pesticide">Pesticide Analysis</SelectItem>
                  <SelectItem value="heavy_metals">Heavy Metals</SelectItem>
                  <SelectItem value="microbial">Microbial Count</SelectItem>
                  <SelectItem value="alkaloid">Alkaloid Profiling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="test_result">Test Result</Label>
              <Textarea id="test_result" value={formData.test_result} onChange={(e) => setFormData({...formData, test_result: e.target.value})} required className="bg-background border-border/50" placeholder="e.g. Moisture: 8.2% (within limits)" />
            </div>
            <div>
              <Label htmlFor="pass_fail">Result</Label>
              <Select value={formData.pass_fail} onValueChange={(v) => setFormData({...formData, pass_fail: v})}>
                <SelectTrigger className="bg-background border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  <SelectItem value="PASS">✅ PASS</SelectItem>
                  <SelectItem value="FAIL">❌ FAIL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tested_by">Tested By</Label>
              <Input id="tested_by" value={formData.tested_by} onChange={(e) => setFormData({...formData, tested_by: e.target.value})} required className="bg-background border-border/50" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Submit to Blockchain
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
};

export default function LabDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [analyticsRes, collectionsRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        // Reuse the collection_events endpoint; for quality tests we query via tracing
        // Quality tests are stored in the same analytics response — we also call
        // a direct query via the analytics which includes recent collections
        axios.get(`${API}/analytics/dashboard`),
      ]);
      setAnalytics(analyticsRes.data);

      // Fetch recent quality tests directly from the quality tests endpoint
      // The backend exposes quality tests through the trace endpoint.
      // We build a list from the analytics recent_collections product_ids
      const recentProductIds = analyticsRes.data?.recent_collections?.map(c => c.product_id) || [];
      const testsMap = {};

      // Fetch quality tests for each recent product
      const testPromises = recentProductIds.slice(0, 5).map(async (pid) => {
        try {
          const res = await axios.get(`${API}/trace/${pid}`);
          return res.data?.quality_tests || [];
        } catch {
          return [];
        }
      });
      const allResults = await Promise.all(testPromises);
      const flatTests = allResults.flat();

      // Also fetch using a broader approach — query all quality tests via dashboard
      // The analytics endpoint doesn't return individual tests; we use the trace data
      setRecentTests(flatTests.slice(0, 10));

    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Dedicated function to fetch latest quality tests
  const fetchRecentQualityTests = async () => {
    try {
      const [analyticsRes, testsRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        axios.get(`${API}/quality-tests?limit=20`),
      ]);
      setAnalytics(analyticsRes.data);
      const tests = testsRes.data?.tests || analyticsRes.data?.recent_quality_tests || [];
      tests.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setRecentTests(tests);
    } catch (error) {
      toast.error("Failed to load quality tests");
    }
  };

  useEffect(() => {
    fetchRecentQualityTests();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecentQualityTests();
    setRefreshing(false);
  };

  const passCount = recentTests.filter(t => t.pass_fail === 'PASS').length;
  const failCount = recentTests.filter(t => t.pass_fail === 'FAIL').length;
  const passRate = recentTests.length > 0 ? Math.round((passCount / recentTests.length) * 100) : 0;

  return (
    <DashboardLayout title="Quality Control Dashboard" description="Manage lab tests and quality certifications" role="Lab Tester">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Tests</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_quality_tests || 0}</h3>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <FlaskConical className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pass Rate</p>
                <h3 className="text-3xl font-bold text-green-500">{passRate}%</h3>
                <p className="text-xs text-muted-foreground mt-1">{passCount} passed / {failCount} failed</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Batches Tested</p>
                <h3 className="text-3xl font-bold text-foreground">{analytics?.statistics?.total_collections || 0}</h3>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FlaskConical className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Failed Tests</p>
                <h3 className="text-3xl font-bold text-red-500">{failCount}</h3>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Tests List */}
        <div className="md:col-span-2">
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <CardTitle>Recent Quality Tests</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-border/50"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentTests.length === 0 && !loading && (
                  <div className="p-8 text-center">
                    <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground text-sm">No quality tests found.</p>
                    <p className="text-muted-foreground text-xs mt-1">Record a test using the button on the right.</p>
                  </div>
                )}
                {loading && (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Loading tests...</p>
                  </div>
                )}
                {recentTests.map((test, idx) => (
                  <div key={test.id || idx} className="p-4 flex items-start justify-between hover:bg-white/5 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-sm">
                          {TEST_TYPE_LABELS[test.test_type] || test.test_type}
                        </span>
                        <Badge
                          className={`text-[10px] ${test.pass_fail === 'PASS'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                          variant="outline"
                        >
                          {test.pass_fail === 'PASS' ? '✅ PASS' : '❌ FAIL'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Lab: {test.lab_name || '—'} · By: {test.tested_by || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Batch: <span className="font-mono text-primary">{test._product_id || test.product_id || '—'}</span>
                      </p>
                      {test.test_result && (
                        <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{test.test_result}</p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {test.timestamp ? new Date(test.timestamp).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {test.timestamp ? new Date(test.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="bg-card border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              <AddQualityTestDialog onSuccess={handleRefresh} />

              <div className="mt-4 p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                <p className="text-xs font-semibold text-orange-400 mb-2">🔬 Supported Tests</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Moisture Content</li>
                  <li>• Pesticide Analysis</li>
                  <li>• Heavy Metals</li>
                  <li>• Microbial Count</li>
                  <li>• Alkaloid Profiling</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-1">🔒 Blockchain Verified</p>
                <p className="text-xs text-muted-foreground">All test results are immutably recorded on Hyperledger Fabric and cannot be modified after submission.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
