import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createSearchJob = mutation({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("searchJobs", { query: args.query, status: "pending" });
  },
});

export const updateSearchJob = mutation({
  args: {
    id: v.id("searchJobs"),
    status: v.union(v.literal("pending"), v.literal("searching"), v.literal("complete"), v.literal("error")),
    results: v.optional(v.any()),
    error: v.optional(v.string()),
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

export const getSearchJob = query({
  args: { id: v.id("searchJobs") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});
