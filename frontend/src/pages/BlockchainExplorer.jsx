import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Blocks, 
  ArrowLeft, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Activity, 
  Lock, 
  FileCode2, 
  RefreshCw,
  Clock
} from "lucide-react";
import { Button } from "../components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import { Badge } from "../components/badge";
import { BlockchainStatus, EndorsementPanel } from "../components/BlockchainStatus";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

export default function BlockchainExplorer() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/blockchain/transactions`);
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to load blockchain transactions", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 py-8 px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
        <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 mb-2 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Blocks className="w-8 h-8 text-emerald-400 animate-pulse" />
              HerBlock Ledger Explorer
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Audit the cryptographic blocks, multi-signature endorsements, and Merkle tree roots committed to the Hyperledger Fabric blockchain.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={fetchTransactions} 
              variant="outline" 
              className="border-slate-700 hover:bg-slate-800 text-slate-350"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Sync Ledger
            </Button>
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Ledger Connected
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Network Infrastructure Status */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-lg font-bold text-slate-350 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Network Status
            </h2>
            <BlockchainStatus />
            <EndorsementPanel />

            <Card className="bg-slate-900/50 border-slate-800 text-slate-205">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-350">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Cryptographic Integrity
                </CardTitle>
                <CardDescription className="text-slate-450 text-xs">Ledger hashing specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-450">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span>State Consensus</span>
                  <span className="font-mono text-emerald-400">Raft Ordering Service</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span>Block Hashing</span>
                  <span className="font-mono text-emerald-400">SHA-256 (Patent Claim 3)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span>Merkle Integration</span>
                  <span className="font-mono text-emerald-400">Tied Root Fingerprints</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-2">
                  Every batch record holds a link to the previous block's Merkle root. Any offline tampering triggers an immediate validation mismatch in the consumer app.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Block and Transaction Logs */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-350 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Committed Ledger Blocks
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
                <p className="text-sm text-slate-450">Retrieving ledger blocks from nodes...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
                <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-350">No Transactions Logged Yet</h3>
                <p className="text-xs text-slate-505 mt-1 max-w-sm mx-auto">
                  Add a crop collection or processing event from the dashboard to trigger the automatic cryptographic block generation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx, idx) => (
                  <div 
                    key={tx.id || idx}
                    className="group bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-lg relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent pointer-events-none" />
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                          #{tx.block_index ?? tx.block_number ?? idx}
                        </span>
                        <div>
                          <Badge className="bg-slate-800 hover:bg-slate-700 text-slate-205 border-slate-700 text-[10px] uppercase font-bold tracking-wider">
                            {tx.transaction_type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-505">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "Just now"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-350">
                      <div>
                        <p className="text-slate-505 font-semibold mb-0.5">Product / Batch ID</p>
                        <p className="font-mono text-slate-205 select-all">{tx.product_id}</p>
                      </div>
                      <div>
                        <p className="text-slate-505 font-semibold mb-0.5">Merkle Root Hash</p>
                        <p className="font-mono text-emerald-400 select-all bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 inline-block overflow-hidden max-w-full text-ellipsis">
                          {tx.merkle_root || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row gap-3 md:items-center justify-between text-[11px] text-slate-505">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div>
                          <span className="font-semibold text-slate-606">Block Hash: </span>
                          <span className="font-mono text-slate-450">{tx.data_hash ? tx.data_hash.substring(0, 16) + '...' : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-606">Prev Hash: </span>
                          <span className="font-mono text-slate-450">{tx.previous_hash ? tx.previous_hash.substring(0, 16) + '...' : 'N/A'}</span>
                        </div>
                      </div>
                      <Link 
                        to={`/trace/${tx.product_id}`}
                        className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors self-end md:self-auto"
                      >
                        Verify Trace Screen →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
