import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

export const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }
  
  const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
    .unique();

  return user;
};

export const getUserById = query({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, { tokenIdentifier }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError("user not found");
    }

    return user;
  },
});

export const createUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      tokenIdentifier: args.tokenIdentifier,
    });
  },
});


export const deleteUser = internalMutation({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, { tokenIdentifier }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError("user not found");
    }

    // Delete user's projects
    await ctx.runMutation(internal.projects.internalDeleteUserProjects, {
      userId: user._id,
    });

    // Delete the user
    await ctx.db.delete(user._id);
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthenticatedUser(ctx);
  },
});