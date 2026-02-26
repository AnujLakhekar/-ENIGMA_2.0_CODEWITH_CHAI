import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

// Generate upload URL for file storage
export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }
  return await ctx.storage.generateUploadUrl();
});

// Get file URL for reading
export const getFileUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
