import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createUser = internalMutation({
  args: {
    name: v.string(),
    tokenIdentifier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('users', {
        name: args.name,
        tokenIdentifier: args.tokenIdentifier
    })
  },
});
