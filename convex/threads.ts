import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    query: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("threads", {
      userId: args.userId,
      query: args.query,
      title: args.title,
      status: "searching",
      paperIds: [],
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("threads"),
    status: v.union(v.literal("searching"), v.literal("processing"), v.literal("ready")),
    paperIds: v.optional(v.array(v.id("papers"))),
    conceptMap: v.optional(v.any()),
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

export const get = query({
  args: { id: v.id("threads") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) =>
    ctx.db.query("threads").withIndex("by_user", q => q.eq("userId", args.userId)).collect(),
});
