import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    user: v.id("users"),
  }),
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    projectIds: v.optional(v.array(v.id("projects"))),
    tokenIdentifier: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    owner: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["owner"]),
  eegAnalyses: defineTable({
    projectId: v.id("projects"),
    patientName: v.string(),
    patientId: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileStorageId: v.optional(v.string()),
    // Analysis Results
    riskScore: v.number(),
    riskLevel: v.string(), // "Low", "Moderate", "High"
    channelsAnalyzed: v.number(),
    abnormalSegments: v.number(),
    modelAccuracy: v.number(),
    confidence: v.number(),
    aiModel: v.string(),
    // Signal Data (stored as JSON strings for flexibility)
    waveformData: v.optional(v.string()),
    shapValues: v.optional(v.string()),
    brainMapData: v.optional(v.string()),
    modelMetrics: v.optional(v.string()),
    createdAt: v.number(),
    status: v.string(), // "pending", "processing", "completed", "failed"
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),
});