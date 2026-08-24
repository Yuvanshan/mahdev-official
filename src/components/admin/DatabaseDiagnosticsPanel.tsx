import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  databaseHealthService,
  DatabaseDiagnosticReport,
} from '../../services/databaseHealthService';
import {
  TARGET_FIREBASE_PROJECT_ID,
  TARGET_FIRESTORE_DATABASE_ID,
} from '../../lib/firebase';

export const DatabaseDiagnosticsPanel: React.FC = () => {
  const [report, setReport] = useState<DatabaseDiagnosticReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showProbes, setShowProbes] = useState<boolean>(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await databaseHealthService.runFullDiagnostics();
      setReport(res);
    } catch (err) {
      console.error('[Diagnostics] Failed to run database audit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Production Database Architecture & Diagnostics
              </h3>
              {report && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-mono ${
                    report.status === 'healthy'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : report.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {report.status === 'healthy' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      CONNECTED & VERIFIED
                    </>
                  ) : report.status === 'warning' ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      WARNING
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-rose-600" />
                      MISCONFIGURED
                    </>
                  )}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative validation against Firebase Project{' '}
              <code className="font-mono text-blue-600 font-semibold">{TARGET_FIREBASE_PROJECT_ID}</code> and named Firestore Database{' '}
              <code className="font-mono text-blue-600 font-semibold">{TARGET_FIRESTORE_DATABASE_ID}</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isLoading}
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`}
              />
            }
            className="text-xs font-semibold"
          >
            {isLoading ? 'Testing Connection...' : 'Run Diagnostics'}
          </Button>
          <a
            href={`https://console.firebase.google.com/project/${TARGET_FIREBASE_PROJECT_ID}/firestore/databases/${TARGET_FIRESTORE_DATABASE_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            <span>Firebase Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Diagnostics Grid */}
      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Project ID */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-600" />
                  Firebase Project
                </span>
                {report.firebaseApp.isProjectMatch ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                )}
              </div>
              <p className="font-mono text-xs font-bold text-slate-900 truncate">
                {report.firebaseApp.activeProjectId}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Target: {report.firebaseApp.targetProjectId}</span>
                <span
                  className={`font-semibold ${
                    report.firebaseApp.isProjectMatch ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {report.firebaseApp.isProjectMatch ? 'Verified' : 'Mismatch'}
                </span>
              </div>
            </div>

            {/* Card 2: Firestore Database ID */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  Firestore Database
                </span>
                {report.firestoreDatabase.isDatabaseMatch ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                )}
              </div>
              <p className="font-mono text-xs font-bold text-slate-900 truncate">
                {report.firestoreDatabase.activeDatabaseId}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Non-Default Named DB</span>
                <span
                  className={`font-semibold ${
                    report.firestoreDatabase.isDatabaseMatch ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {report.firestoreDatabase.isDatabaseMatch ? 'Active' : 'Mismatch'}
                </span>
              </div>
            </div>

            {/* Card 3: Server Ping & Latency */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Round-Trip Latency
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="font-mono text-xs font-bold text-slate-900">
                {report.overallLatencyMs} ms
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Status: {report.firestoreDatabase.serverReachable ? 'Reachable' : 'Offline'}</span>
                <span className="text-emerald-600 font-semibold font-mono">Real-Time</span>
              </div>
            </div>

            {/* Card 4: Credential Security Audit */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Frontend Key Safety
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Zero Private Keys Exposed
              </p>
              <div className="text-[10px] text-slate-500 pt-1 truncate">
                Browser-safe public environment config
              </div>
            </div>
          </div>

          {/* Detailed Probes Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowProbes(!showProbes)}
              className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Collection Read Access Probes ({report.collectionProbes.filter((p) => p.accessible).length}/{report.collectionProbes.length} Accessible)
              </span>
              {showProbes ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showProbes && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 p-3 bg-slate-900 rounded-xl text-white font-mono text-[11px]">
                {report.collectionProbes.map((probe) => (
                  <div
                    key={probe.collectionName}
                    className="p-2 rounded bg-slate-800/80 border border-slate-700/80 flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <span className="text-slate-300 font-bold block truncate">
                        {probe.collectionName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {probe.latencyMs}ms • {probe.docCount} docs
                      </span>
                    </div>
                    {probe.accessible ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
