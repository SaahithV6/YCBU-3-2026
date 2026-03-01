import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createThread = mutation({
  args: {
    name: v.string(),
    query: v.string(),
    paperIds: v.array(v.id("papers")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("researchThreads", { ...args, status: "active" });
  },
});

export const updateThread = mutation({
  args: {
    id: v.id("researchThreads"),
    paperIds: v.optional(v.array(v.id("papers"))),
    overview: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const update: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) update[k] = val;
    }
    await ctx.db.patch(id, update);
  },
});

export const getThread = query({
  args: { id: v.id("researchThreads") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const listThreads = query({
  handler: async (ctx) => ctx.db.query("researchThreads").collect(),
});
