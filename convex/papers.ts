import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.string(),
    authors: v.array(v.string()),
    pdfUrl: v.string(),
    sourceUrl: v.string(),
    sourceName: v.string(),
    relevanceScore: v.number(),
    relevanceReason: v.string(),
    arxivId: v.optional(v.string()),
    venue: v.optional(v.string()),
    year: v.optional(v.number()),
    doi: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("papers", {
      ...args,
      status: "queued",
    });
  },
});

export const get = query({
  args: { id: v.id("papers") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const update = mutation({
  args: {
    id: v.id("papers"),
    status: v.optional(v.union(v.literal("queued"), v.literal("extracting"), v.literal("parsing"), v.literal("ready"), v.literal("error"))),
    tldr: v.optional(v.array(v.any())),
    sections: v.optional(v.array(v.any())),
    variables: v.optional(v.array(v.any())),
    equations: v.optional(v.array(v.any())),
    figures: v.optional(v.array(v.any())),
    citations: v.optional(v.array(v.any())),
    notationWarnings: v.optional(v.array(v.any())),
    evidenceChains: v.optional(v.array(v.any())),
    githubUrl: v.optional(v.string()),
    notebookCells: v.optional(v.array(v.any())),
    sandboxId: v.optional(v.string()),
    readersOnline: v.optional(v.number()),
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

export const listByThread = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) =>
    ctx.db.query("papers").withIndex("by_thread", q => q.eq("threadId", args.threadId)).collect(),
});

export const incrementReaders = mutation({
  args: { id: v.id("papers"), delta: v.number() },
  handler: async (ctx, args) => {
    const paper = await ctx.db.get(args.id);
    if (!paper) return;
    await ctx.db.patch(args.id, { readersOnline: Math.max(0, (paper.readersOnline || 0) + args.delta) });
  },
});
