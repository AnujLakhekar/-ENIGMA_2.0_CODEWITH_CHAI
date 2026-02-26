"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  Brain,
  Activity,
  Download,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "signals", label: "EEG Signals" },
  { id: "explainable", label: "Explainable AI" },
  { id: "connectivity", label: "Connectivity" },
  { id: "performance", label: "Model Performance" },
];

export default function ProjectAnalysisPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const projectId = id as Id<"projects">;

  const [activeTab, setActiveTab] = useState("overview");
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(true);

  // Form state
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const project = useQuery(
    api.projects.getProjectById, 
    isLoaded && isSignedIn ? { projectId } : "skip"
  );
  const analyses = useQuery(
    api.eegAnalyses.getProjectAnalyses, 
    isLoaded && isSignedIn ? { projectId } : "skip"
  );
  const latestAnalysis = analyses?.[0];

  const createAnalysis = useMutation(api.eegAnalyses.createAnalysis);

  const handleRunDemoAnalysis = async () => {
    if (!patientName.trim()) {
      alert("Please enter patient name");
      return;
    }

    setIsUploading(true);
    try {
      await createAnalysis({
        projectId,
        patientName: patientName.trim(),
        patientId: `PT-${Date.now().toString().slice(-6)}`,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        fileName: "S001R02.edf",
        isDemoMode: true,
      });
      setShowUploadForm(false);
      setPatientName("");
      setAge("");
      setGender("");
    } catch (error) {
      console.error("Failed to create analysis:", error);
      alert("Failed to create analysis. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-foreground/20 border-t-foreground rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isSignedIn) {
    router.push("/");
    return null;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-foreground/20 border-t-foreground rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-background/50 border-b border-foreground/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="rounded-lg">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {project.description || "EEG Analysis Project"}
                </p>
              </div>
            </div>
            {latestAnalysis && (
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                    latestAnalysis.riskLevel === "Low"
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : latestAnalysis.riskLevel === "Moderate"
                      ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-semibold">
                    {latestAnalysis.riskLevel} Risk — {latestAnalysis.riskScore}%
                  </span>
                </div>
                <Button className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showUploadForm || !latestAnalysis ? (
          <UploadSection
            patientName={patientName}
            setPatientName={setPatientName}
            age={age}
            setAge={setAge}
            gender={gender}
            setGender={setGender}
            isUploading={isUploading}
            onRunDemo={handleRunDemoAnalysis}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-8 border-b border-foreground/10">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <OverviewTab analysis={latestAnalysis} />
            )}
            {activeTab === "signals" && (
              <SignalsTab analysis={latestAnalysis} />
            )}
            {activeTab === "explainable" && (
              <ExplainableTab analysis={latestAnalysis} />
            )}
            {activeTab === "connectivity" && (
              <ConnectivityTab analysis={latestAnalysis} />
            )}
            {activeTab === "performance" && (
              <PerformanceTab analysis={latestAnalysis} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Upload Section Component
function UploadSection({ patientName, setPatientName, age, setAge, gender, setGender, isUploading, onRunDemo }: any) {
  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="border-2 border-dashed border-foreground/20 rounded-2xl p-12 text-center hover:border-foreground/40 transition-colors bg-linear-to-br from-foreground/5 to-foreground/2">
        <div className="mx-auto w-16 h-16 mb-6 rounded-2xl bg-foreground/10 flex items-center justify-center">
          <Upload className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Drop EEG file here or click to browse</h2>
        <p className="text-muted-foreground mb-4">
          .edf · .csv · .mat · .eeg — up to 64 channels
        </p>
      </div>

      {/* Demo Mode Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
        <Zap className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-yellow-500 mb-1">Demo Mode:</p>
          <p className="text-sm text-muted-foreground">
            No file? No problem — we'll simulate a realistic EEG dataset for demonstration.
          </p>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="h-5 w-5 text-cyan-400" />
          <h3 className="text-xl font-bold">Patient Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">
              PATIENT NAME <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-muted-foreground">
              PATIENT ID
            </label>
            <input
              type="text"
              value="Auto-generated"
              disabled
              className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-muted/30 text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-muted-foreground">
              AGE
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-muted-foreground">
              GENDER
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/20 transition-all">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Run Analysis Button */}
      <Button
        onClick={onRunDemo}
        disabled={isUploading || !patientName.trim()}
        className="w-full h-14 rounded-xl text-lg font-semibold bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
        {isUploading ? (
          <>
            <div className="animate-spin h-5 w-5 border-3 border-white/30 border-t-white rounded-full mr-3" />
            Processing...
          </>
        ) : (
          <>
            <Brain className="h-5 w-5 mr-3" />
            Run Demo Analysis
          </>
        )}
      </Button>
    </div>
  );
}

// Overview Tab Component  
function OverviewTab({ analysis }: any) {
  if (!analysis) return null;

  const brainMapData = analysis.brainMapData ? JSON.parse(analysis.brainMapData) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Risk Score Card */}
      <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-8">
        <h3 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wide">
          Schizophrenia Risk Score
        </h3>
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-foreground/10"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${analysis.riskScore * 5.53} 553`}
              className={
                analysis.riskLevel === "Low"
                  ? "text-green-400"
                  : analysis.riskLevel === "Moderate"
                  ? "text-yellow-400"
                  : "text-red-400"
              }
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold">{analysis.riskScore}%</div>
            <div
              className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                analysis.riskLevel === "Low"
                  ? "bg-green-500/20 text-green-400"
                  : analysis.riskLevel === "Moderate"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}>
              {analysis.riskLevel} Risk
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-4">
          <span>Low<br/>0</span>
          <span>Moderate<br/>30</span>
          <span>High<br/>60+</span>
        </div>
      </div>

      {/* Brain Topographic Map */}
      <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-8">
        <h3 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wide">
          Brain Topographic Map
        </h3>
        <div className="relative w-full aspect-square max-w-md mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Base head circle */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground/20" />
            
            {/* Electrodes */}
            {brainMapData.map((electrode: any, idx: number) => {
              const x = electrode.x * 100;
              const y = electrode.y * 100;
              const value = electrode.value;
              
              const color = value > 0.7
                ? "#f97316" // orange
                : value > 0.6
                ? "#eab308" // yellow
                : value > 0.4
                ? "#84cc16" // lime
                : "#22c55e"; // green
                
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="6" fill={color} opacity="0.8" />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[4px] font-bold fill-background">
                    {electrode.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex items-center justify-between mt-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-12 h-2 bg-linear-to-r from-green-500 via-yellow-500 to-red-500 rounded" />
          </div>
          <div className="flex justify-between w-full ml-4">
            <span className="text-muted-foreground">Normal</span>
            <span className="text-muted-foreground">Abnormal</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-6">
        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Channels Analyzed</span>
            <span className="text-3xl font-bold text-cyan-400">
              {analysis.channelsAnalyzed}
              <span className="text-sm text-muted-foreground ml-1">ch</span>
            </span>
          </div>
        </div>

        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Abnormal Segments</span>
            <span className="text-3xl font-bold text-red-400">
              {analysis.abnormalSegments}
              <span className="text-sm text-muted-foreground ml-1">segs</span>
            </span>
          </div>
        </div>

        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Model Accuracy</span>
            <span className="text-3xl font-bold text-green-400">
              {analysis.modelAccuracy}%
            </span>
          </div>
        </div>

        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Confidence</span>
            <span className="text-3xl font-bold text-blue-400">
              {analysis.confidence}%
            </span>
          </div>
        </div>

        <div className="bg-linear-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-cyan-400 mb-1">AI MODEL USED</p>
              <p className="text-lg font-bold">{analysis.aiModel}</p>
              <p className="text-sm text-muted-foreground">+ SHAP Explainability Layer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Signals Tab Component
function SignalsTab({ analysis }: any) {
  if (!analysis) return null;

  const waveformData = analysis.waveformData ? JSON.parse(analysis.waveformData) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
          EEG Waveforms — 7-Channel Preview
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span>Anomaly</span>
          </div>
        </div>
      </div>

      <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-8">
        {waveformData.map((channel: any, idx: number) => (
          <div key={idx} className="relative h-24 mb-1 border-b border-foreground/5 last:border-0">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground w-12">
              {channel.channel}
            </div>
            <svg viewBox="0 0 1400 100" className="w-full h-full pl-14" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={channel.isAnomalous ? "text-red-400" : "text-cyan-400"}
                points={channel.data
                  .map((point: any, i: number) => `${(i / channel.data.length) * 1400},${50 - point.y * 0.4}`)
                  .join(" ")}
              />
            </svg>
            {channel.isAnomalous && (
              <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
            )}
          </div>
        ))}
        <div className="flex justify-between text-xs text-muted-foreground mt-4 pl-14">
          <span>0s</span>
          <span>15</span>
          <span>25</span>
          <span>35</span>
        </div>
      </div>
    </div>
  );
}

// Explainable AI Tab Component
function ExplainableTab({ analysis }: any) {
  if (!analysis) return null;

  const shapValues = analysis.shapValues ? JSON.parse(analysis.shapValues) : [];

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-cyan-400 mb-1">Explainable AI (XAI) — SHAP Analysis</h3>
            <p className="text-sm text-muted-foreground">
              SHapley Additive exPanations reveal which EEG biomarkers drive the model's prediction. Red bars increase schizophrenia risk; green bars decrease it.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-8">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
          SHAP Feature Importance
        </h4>
        <p className="text-xs text-muted-foreground mb-6">
          Explainable AI — which biomarkers drive the risk prediction
        </p>

        <div className="space-y-3">
          {shapValues.map((item: any, idx: number) => {
            const isPositive = item.value > 0;
            const width = Math.abs(item.value) * 100;

            return (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-40 text-right text-sm">{item.feature}</div>
                <div className="flex-1 h-8 relative">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/20" />
                  {isPositive ? (
                    <div
                      className="absolute left-1/2 top-0 h-full bg-linear-to-r from-red-400/80 to-red-500/80 rounded-r"
                      style={{ width: `${width}%` }}
                    />
                  ) : (
                    <div
                      className="absolute right-1/2 top-0 h-full bg-linear-to-l from-green-400/80 to-green-500/80 rounded-l"
                      style={{ width: `${width}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span>Increases risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span>Decreases risk</span>
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-6">
          <span>-0.3</span>
          <span>-0.15</span>
          <span>0</span>
          <span>0.15</span>
          <span>0.3</span>
        </div>
      </div>
    </div>
  );
}

// Connectivity Tab Component
function ConnectivityTab({ analysis }: any) {
  return (
    <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-12 text-center">
      <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-xl font-semibold mb-2">Brain Connectivity Analysis</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Functional connectivity maps and phase-locking value (PLV) analysis will be displayed here.
        This feature visualizes neural synchronization patterns across brain regions.
      </p>
    </div>
  );
}

// Performance Tab Component
function PerformanceTab({ analysis }: any) {
  if (!analysis) return null;

  const modelMetrics = analysis.modelMetrics ? JSON.parse(analysis.modelMetrics) : null;

  if (!modelMetrics) return null;

  return (
    <div className="space-y-6">
      {/* Model Metrics Header */}
      <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide mb-6">
          AI Model Performance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar Chart Placeholder */}
          <div>
            <h4 className="text-sm text-muted-foreground mb-4">CNN-LSTM Ensemble (Best Model)</h4>
            <div className="aspect-square bg-foreground/5 rounded-xl flex items-center justify-center border border-foreground/10">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-cyan-400" />
                <p className="text-sm text-muted-foreground">Radar Chart:<br/>Accuracy, Precision<br/>Recall, F1-Score, ROC-AUC</p>
              </div>
            </div>
          </div>

          {/* Model Comparison */}
          <div>
            <h4 className="text-sm text-muted-foreground mb-4">Model Comparison</h4>
            <div className="space-y-4">
              {modelMetrics.models.map((model: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">{model.name}</div>
                  <div className="flex-1 h-8 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        model.name === "CNN-LSTM"
                          ? "bg-linear-to-r from-cyan-400 to-cyan-500"
                          : "bg-linear-to-r from-foreground/30 to-foreground/40"
                      }`}
                      style={{ width: `${model.accuracy}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-semibold">
                    {model.accuracy}%
                  </div>
                  {model.name === "CNN-LSTM" && (
                    <span className="text-cyan-400">★</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{modelMetrics.accuracy}%</div>
          <div className="text-sm text-muted-foreground">Accuracy</div>
        </div>
        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{modelMetrics.precision}%</div>
          <div className="text-sm text-muted-foreground">Precision</div>
        </div>
        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{modelMetrics.recall}%</div>
          <div className="text-sm text-muted-foreground">Recall</div>
        </div>
        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{modelMetrics.f1Score}%</div>
          <div className="text-sm text-muted-foreground">F1-Score</div>
        </div>
        <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{modelMetrics.rocAuc}%</div>
          <div className="text-sm text-muted-foreground">ROC-AUC</div>
        </div>
      </div>

      {/* Dataset Pipeline */}
      <div className="bg-linear-to-br from-foreground/5 to-foreground/2 border border-foreground/10 rounded-2xl p-8">
        <h4 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wide">
          Dataset Pipeline
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6">
            <h5 className="font-semibold text-cyan-400 mb-2">PhysioNet EEG-MMN</h5>
            <p className="text-xs text-muted-foreground">Open-source EEG dataset</p>
          </div>
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-6">
            <h5 className="font-semibold text-pink-400 mb-2">SchizConnect DB</h5>
            <p className="text-xs text-muted-foreground">Multi-site schizophrenia database</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
            <h5 className="font-semibold text-purple-400 mb-2">OpenNeuro ds003499</h5>
            <p className="text-xs text-muted-foreground">Curated EEG research dataset</p>
          </div>
        </div>
      </div>
    </div>
  );
}