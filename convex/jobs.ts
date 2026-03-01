import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    paperId: v.id("papers"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", {
      paperId: args.paperId,
      stage: args.stage,
      status: "running",
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("jobs"),
    status: v.union(v.literal("running"), v.literal("done"), v.literal("error")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const update: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) update[k] = val;
    }
    await ctx.db.patch(id, update);
  },
});

export const listByPaper = query({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) =>
    ctx.db.query("jobs").withIndex("by_paper", q => q.eq("paperId", args.paperId)).collect(),
});
