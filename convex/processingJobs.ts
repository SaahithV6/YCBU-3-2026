import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createProcessingJob = mutation({
  args: {
    externalPaperId: v.string(),
    paperId: v.optional(v.id("papers")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("processingJobs", {
      externalPaperId: args.externalPaperId,
      paperId: args.paperId,
      status: "pending",
      progress: 0,
    });
  },
});

export const updateProcessingJob = mutation({
  args: {
    id: v.id("processingJobs"),
    status: v.optional(v.union(
      v.literal("pending"), v.literal("extracting"), v.literal("parsing_math"),
      v.literal("extracting_variables"), v.literal("building_citations"),
      v.literal("generating_notebook"), v.literal("complete"), v.literal("error")
    )),
    stage: v.optional(v.string()),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
    paperId: v.optional(v.id("papers")),
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

export const getProcessingJob = query({
  args: { id: v.id("processingJobs") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getProcessingJobByPaper = query({
  args: { externalPaperId: v.string() },
  handler: async (ctx, args) =>
    ctx.db.query("processingJobs").withIndex("by_paper_id", (q) => q.eq("externalPaperId", args.externalPaperId)).first(),
});
