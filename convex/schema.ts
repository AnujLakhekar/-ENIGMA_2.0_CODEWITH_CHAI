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
});