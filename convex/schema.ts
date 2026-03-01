import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  threads: defineTable({
    userId: v.string(),
    query: v.string(),
    title: v.string(),
    status: v.union(v.literal("searching"), v.literal("processing"), v.literal("ready")),
    paperIds: v.array(v.id("papers")),
    conceptMap: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  papers: defineTable({
    threadId: v.id("threads"),
    arxivId: v.optional(v.string()),
    title: v.string(),
    authors: v.array(v.string()),
    venue: v.optional(v.string()),
    year: v.optional(v.number()),
    pdfUrl: v.string(),
    doi: v.optional(v.string()),
    relevanceScore: v.number(),
    relevanceReason: v.string(),
    sourceUrl: v.string(),
    sourceName: v.string(),
    status: v.union(v.literal("queued"), v.literal("extracting"), v.literal("parsing"), v.literal("ready"), v.literal("error")),
    tldr: v.optional(v.array(v.object({ sentence: v.string(), sourceSentenceId: v.string() }))),
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
  }).index("by_thread", ["threadId"]),

  jobs: defineTable({
    paperId: v.id("papers"),
    stage: v.string(),
    status: v.union(v.literal("running"), v.literal("done"), v.literal("error")),
    error: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_paper", ["paperId"]),
});
