import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  searchJobs: defineTable({
    query: v.string(),
    status: v.union(v.literal("pending"), v.literal("searching"), v.literal("complete"), v.literal("error")),
    results: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      authors: v.array(v.string()),
      abstract: v.string(),
      url: v.string(),
      pdfUrl: v.optional(v.string()),
      venue: v.optional(v.string()),
      year: v.optional(v.number()),
      relevanceScore: v.optional(v.number()),
      relevanceExplanation: v.optional(v.string()),
    }))),
    error: v.optional(v.string()),
  }),

  papers: defineTable({
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
    tldr: v.optional(v.array(v.object({
      sentence: v.string(),
      sourceSentence: v.string(),
    }))),
    readingTime: v.optional(v.number()),
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      orientationSentence: v.optional(v.string()),
      equations: v.optional(v.array(v.object({
        id: v.string(),
        latex: v.string(),
        explanation: v.string(),
        variables: v.array(v.string()),
        derivationSteps: v.optional(v.array(v.string())),
      }))),
      figures: v.optional(v.array(v.object({
        id: v.string(),
        url: v.string(),
        caption: v.string(),
        referencedByParagraph: v.optional(v.string()),
      }))),
    }))),
    variables: v.optional(v.array(v.object({
      symbol: v.string(),
      definition: v.string(),
      units: v.optional(v.string()),
      role: v.string(),
      firstAppearsIn: v.string(),
      occurrences: v.number(),
    }))),
    citations: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      authors: v.array(v.string()),
      year: v.optional(v.number()),
      url: v.optional(v.string()),
      type: v.union(v.literal("foundational"), v.literal("recent"), v.literal("related")),
    }))),
    evidenceChains: v.optional(v.array(v.object({
      claim: v.string(),
      experiment: v.string(),
      figure: v.optional(v.string()),
      result: v.string(),
      conclusion: v.string(),
    }))),
    githubRepos: v.optional(v.array(v.object({
      url: v.string(),
      license: v.optional(v.string()),
    }))),
    notebookId: v.optional(v.id("notebooks")),
    processingStatus: v.optional(v.string()),
  }).index("by_external_id", ["externalId"]),

  processingJobs: defineTable({
    paperId: v.optional(v.id("papers")),
    externalPaperId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("extracting"),
      v.literal("parsing_math"),
      v.literal("extracting_variables"),
      v.literal("building_citations"),
      v.literal("generating_notebook"),
      v.literal("complete"),
      v.literal("error")
    ),
    stage: v.optional(v.string()),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_paper_id", ["externalPaperId"]),

  notebooks: defineTable({
    paperId: v.optional(v.id("papers")),
    sandboxUrl: v.optional(v.string()),
    daytonaWorkspaceId: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("spinning_up"), v.literal("ready"), v.literal("error")),
    cells: v.optional(v.array(v.object({
      id: v.string(),
      type: v.union(v.literal("markdown"), v.literal("code"), v.literal("output")),
      content: v.string(),
      output: v.optional(v.string()),
      language: v.optional(v.string()),
    }))),
  }),

  researchThreads: defineTable({
    name: v.string(),
    query: v.string(),
    paperIds: v.array(v.id("papers")),
    status: v.union(v.literal("active"), v.literal("archived")),
    overview: v.optional(v.string()),
  }),
});
