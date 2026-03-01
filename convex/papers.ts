import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPaper = mutation({
  args: {
    externalId: v.string(),
    title: v.string(),
    authors: v.array(v.string()),
    abstract: v.string(),
    url: v.string(),
    pdfUrl: v.optional(v.string()),
    venue: v.optional(v.string()),
    year: v.optional(v.number()),
    relevanceScore: v.optional(v.number()),
    relevanceExplanation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("papers")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("papers", { ...args, processingStatus: "pending" });
  },
});

export const updatePaper = mutation({
  args: {
    id: v.id("papers"),
    tldr: v.optional(v.array(v.object({ sentence: v.string(), sourceSentence: v.string() }))),
    readingTime: v.optional(v.number()),
    sections: v.optional(v.any()),
    variables: v.optional(v.any()),
    citations: v.optional(v.any()),
    evidenceChains: v.optional(v.any()),
    githubRepos: v.optional(v.any()),
    notebookId: v.optional(v.id("notebooks")),
    processingStatus: v.optional(v.string()),
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

export const getPaper = query({
  args: { id: v.id("papers") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getPaperByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) =>
    ctx.db.query("papers").withIndex("by_external_id", (q) => q.eq("externalId", args.externalId)).first(),
});

export const listPapers = query({
  handler: async (ctx) => ctx.db.query("papers").collect(),
});
