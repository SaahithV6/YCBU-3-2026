export interface PaperMetadata {
  id: string
  title: string
  authors: string[]
  abstract: string
  url: string
  pdfUrl?: string
  venue?: string
  year?: number
  relevanceScore?: number
  relevanceExplanation?: string
}

export interface TldrSentence {
  sentence: string
  sourceSentence: string
}

export interface Variable {
  symbol: string
  definition: string
  units?: string
  role: string
  firstAppearsIn: string
  occurrences: number
}

export interface Equation {
  id: string
  latex: string
  explanation: string
  variables: string[]
  derivationSteps?: string[]
}

export interface Figure {
  id: string
  url: string
  caption: string
  referencedByParagraph?: string
}

export interface Section {
  id: string
  title: string
  content: string
  orientationSentence?: string
  equations?: Equation[]
  figures?: Figure[]
}

export interface Citation {
  id: string
  title: string
  authors: string[]
  year?: number
  url?: string
  type: 'foundational' | 'recent' | 'related'
}

export interface EvidenceChain {
  claim: string
  experiment: string
  figure?: string
  result: string
  conclusion: string
}

export interface NotebookCell {
  id: string
  type: 'markdown' | 'code' | 'output'
  content: string
  output?: string
  language?: string
}

export interface ProcessedPaper extends PaperMetadata {
  tldr?: TldrSentence[]
  readingTime?: number
  sections?: Section[]
  variables?: Variable[]
  citations?: Citation[]
  evidenceChains?: EvidenceChain[]
  githubRepos?: { url: string; license?: string }[]
  notebookCells?: NotebookCell[]
}

export type ReadingMode = 'skim' | 'read' | 'deep-dive'

export interface RabbitHoleItem {
  id: string
  title: string
  type: 'paper' | 'term' | 'author' | 'concept'
  paperId?: string
  term?: string
}
