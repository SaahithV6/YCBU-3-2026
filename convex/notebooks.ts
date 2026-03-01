import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createNotebook = mutation({
  args: { paperId: v.optional(v.id("papers")) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notebooks", { paperId: args.paperId, status: "pending" });
  },
});

export const updateNotebook = mutation({
  args: {
    id: v.id("notebooks"),
    sandboxUrl: v.optional(v.string()),
    daytonaWorkspaceId: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("spinning_up"), v.literal("ready"), v.literal("error"))),
    cells: v.optional(v.any()),
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

export const getNotebook = query({
  args: { id: v.id("notebooks") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});
