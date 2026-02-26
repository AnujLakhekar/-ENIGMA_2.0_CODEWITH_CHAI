import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { name, description }) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new ConvexError("User not authenticated");
    }

    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();
    
    // If user doesn't exist yet, create them
    if (!user) {
      const userId = await ctx.db.insert("users", {
        name: identity.name || identity.email || "User",
        email: identity.email,
        tokenIdentifier: identity.tokenIdentifier,
      });
      user = await ctx.db.get(userId);
      if (!user) {
        throw new ConvexError("Failed to create user");
      }
    }

    const projectId = await ctx.db.insert("projects", {
      name,
      description,
      owner: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add project to user's projectIds array
    await ctx.db.patch(user._id, {
      projectIds: [...(user.projectIds || []), projectId],
    });

    return projectId;
  },
});

export const getUserProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();
    
    if (!user) {
      // User hasn't been created in database yet (webhook hasn't fired)
      return [];
    }

    if (!user.projectIds || user.projectIds.length === 0) {
      return [];
    }

    const projects = await Promise.all(
      user.projectIds.map((projectId) => ctx.db.get(projectId))
    );

    return projects.filter((p) => p !== null);
  },
});

export const getProjectById = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const user = await getAuthenticatedUser(ctx);
    
    if (!user) {
      throw new ConvexError("User not authenticated");
    }

    const project = await ctx.db.get(projectId);
    
    if (!project) {
      throw new ConvexError("Project not found");
    }

    // Check if user owns this project
    if (project.owner !== user._id) {
      throw new ConvexError("Unauthorized access to this project");
    }

    return project;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, description }) => {
    const user = await getAuthenticatedUser(ctx);
    
    if (!user) {
      throw new ConvexError("User not authenticated");
    }

    const project = await ctx.db.get(projectId);
    
    if (!project) {
      throw new ConvexError("Project not found");
    }

    // Check if user owns this project
    if (project.owner !== user._id) {
      throw new ConvexError("Unauthorized to update this project");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    await ctx.db.patch(projectId, updates);
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const user = await getAuthenticatedUser(ctx);
    
    if (!user) {
      throw new ConvexError("User not authenticated");
    }

    const project = await ctx.db.get(projectId);
    
    if (!project) {
      throw new ConvexError("Project not found");
    }

    // Check if user owns this project
    if (project.owner !== user._id) {
      throw new ConvexError("Unauthorized to delete this project");
    }

    // Remove project from user's projectIds array
    await ctx.db.patch(user._id, {
      projectIds: (user.projectIds || []).filter((id) => id !== projectId),
    });

    // Delete the project
    await ctx.db.delete(projectId);
  },
});

export const internalDeleteUserProjects = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Delete all projects owned by user
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("owner"), userId))
      .collect();

    for (const project of projects) {
      await ctx.db.delete(project._id);
    }
  },
});
