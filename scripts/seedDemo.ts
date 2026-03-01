#!/usr/bin/env npx ts-node
/**
 * Demo seed script - populates demo data.
 * Run with: npx ts-node scripts/seedDemo.ts
 */
import * as fs from 'fs'
import * as path from 'path'

const demoData = {
  query: 'mechanistic interpretability in large language models',
  papers: [
    {
      id: 'arxiv:2209.11895',
      title: 'Toy Models of Superposition',
      authors: ['Nelson Elhage', 'Tristan Hume', 'Catherine Olsson', 'Nicholas Schiefer', 'Tom Henighan'],
      arxivId: '2209.11895',
      venue: 'Anthropic',
      year: 2022,
      pdfUrl: 'https://arxiv.org/pdf/2209.11895',
      sourceUrl: 'https://arxiv.org/abs/2209.11895',
      sourceName: 'arXiv',
      relevanceScore: 98,
      relevanceReason: 'Foundational paper on superposition directly relevant to LLM mechanistic interpretability',
      status: 'ready',
      tldr: [
        { sentence: 'Neural networks represent more features than dimensions by using superposition, packing multiple features into shared directions.', sourceSentenceId: 'blk-intro-1' },
        { sentence: 'Toy model experiments reveal superposition emerges with sparse features and forms geometric configurations like antipodal pairs.', sourceSentenceId: 'blk-intro-2' },
        { sentence: 'Superposition may be a primary obstacle to neural network interpretability.', sourceSentenceId: 'blk-intro-3' },
      ],
      sections: [
        {
          id: 'sec-intro',
          title: 'Introduction',
          level: 1,
          isAppendix: false,
          content: [
            { id: 'blk-intro-1', type: 'paragraph', raw: 'One of the most fundamental questions in mechanistic interpretability is how neural networks represent information internally. The linear representation hypothesis suggests that features correspond to directions in activation space.' },
            { id: 'blk-intro-2', type: 'paragraph', raw: 'Neural networks often pack many features into a small number of dimensions through superposition—representing more features than there are dimensions.' },
            { id: 'blk-intro-3', type: 'paragraph', raw: 'We find that superposition may be linked to neural network interpretability challenges, providing a mechanism for why networks are hard to interpret.' },
          ],
          marginNotes: [],
        },
        {
          id: 'sec-method',
          title: 'Toy Model Setup',
          level: 1,
          isAppendix: false,
          content: [
            { id: 'blk-method-1', type: 'paragraph', raw: 'We use a simple linear encoder-decoder model to study superposition. The encoder compresses input to a lower-dimensional hidden state, then a ReLU decoder reconstructs the input.' },
            { id: 'blk-eq-1', type: 'equation', raw: 'h = Wx + b, \\quad x\' = \\text{ReLU}(W^T h + b\')' },
          ],
          marginNotes: [],
        },
      ],
      variables: [
        { symbol: 'h', name: 'hidden state', definition: 'Compressed representation of input', firstSeenSectionId: 'sec-method', allOccurrences: ['blk-method-1', 'blk-eq-1'] },
        { symbol: 'W', name: 'weight matrix', definition: 'Encoder weight matrix mapping input to hidden', firstSeenSectionId: 'sec-method', allOccurrences: ['blk-eq-1'] },
      ],
      equations: [
        { id: 'eq-1', latex: 'h = Wx + b', label: 'Eq. 1', storySteps: ['Input x is compressed by W', 'Bias b is added', 'Result h has fewer dimensions than x'], relatedVariables: ['h', 'W', 'x', 'b'], blockId: 'blk-eq-1' },
      ],
      figures: [
        { id: 'fig-1', url: '', caption: 'Superposition: features (arrows) packed into fewer dimensions', label: 'Figure 1', referencedByBlockIds: ['blk-intro-1'] },
      ],
      citations: [
        { id: 'cite-1', title: 'Attention is All You Need', authors: ['Vaswani et al.'], year: 2017, arxivId: '1706.03762', isFoundational: true },
      ],
      notationWarnings: [],
      evidenceChains: [
        { claim: 'Superposition occurs when features are sparse', experiment: 'Vary feature sparsity in toy model and measure reconstruction loss', figureId: 'fig-1', statisticalResult: 'Superposition increases monotonically with sparsity (p < 0.001)', conclusion: 'Sparse features drive superposition formation', blockId: 'blk-method-1' },
      ],
      notebookCells: [
        { id: 'nb-1', type: 'markdown', content: '# Toy Models of Superposition\n\nInteractive exploration of superposition in neural networks.', sectionId: 'sec-intro', isEditable: false },
        { id: 'nb-2', type: 'code', content: 'import numpy as np\nimport matplotlib.pyplot as plt\n\n# Toy model parameters\nn_features = 5\nn_hidden = 2\nsparsity = 0.8', sectionId: 'sec-method', isEditable: true },
      ],
      readersOnline: 0,
    },
    {
      id: 'arxiv:2211.00593',
      title: 'Interpretability in the Wild: a Circuit for Indirect Object Identification in GPT-2 small',
      authors: ['Kevin Wang', 'Alexandre Variengien', 'Arthur Conmy', 'Buck Shlegeris', 'Jacob Steinhardt'],
      arxivId: '2211.00593',
      venue: 'ICLR 2023',
      year: 2023,
      pdfUrl: 'https://arxiv.org/pdf/2211.00593',
      sourceUrl: 'https://arxiv.org/abs/2211.00593',
      sourceName: 'arXiv',
      relevanceScore: 95,
      relevanceReason: 'Directly demonstrates circuit-level mechanistic interpretability in a production LLM',
      status: 'ready',
      tldr: [
        { sentence: 'The authors identify and characterize a complete circuit implementing indirect object identification in GPT-2 small.', sourceSentenceId: 'blk-ioi-intro-1' },
        { sentence: 'This circuit involves 26 attention heads across 9 distinct head types performing specific computations.', sourceSentenceId: 'blk-ioi-intro-2' },
        { sentence: 'The findings demonstrate that circuits can be faithfully reverse-engineered in real language models.', sourceSentenceId: 'blk-ioi-intro-3' },
      ],
      sections: [
        {
          id: 'sec-ioi-intro',
          title: 'Introduction',
          level: 1,
          isAppendix: false,
          content: [
            { id: 'blk-ioi-intro-1', type: 'paragraph', raw: 'We study indirect object identification (IOI), a well-studied NLP task, and identify a complete circuit implementing it in GPT-2 small.' },
            { id: 'blk-ioi-intro-2', type: 'paragraph', raw: 'The circuit involves 26 attention heads performing 9 distinct functions, from duplicate token detection to name mover heads.' },
            { id: 'blk-ioi-intro-3', type: 'paragraph', raw: 'Our work demonstrates that mechanistic interpretability can reverse-engineer real neural network behavior.' },
          ],
          marginNotes: [],
        },
      ],
      variables: [],
      equations: [],
      figures: [],
      citations: [
        { id: 'cite-ioi-1', title: 'Toy Models of Superposition', authors: ['Elhage et al.'], year: 2022, arxivId: '2209.11895', isFoundational: true },
      ],
      notationWarnings: [],
      evidenceChains: [],
      notebookCells: [],
      readersOnline: 0,
    },
    {
      id: 'pmc:PMC9890000',
      title: 'Sparse Autoencoders Find Highly Interpretable Features in Language Models',
      authors: ['Hoagy Cunningham', 'Aidan Ewart', 'Logan Riggs', 'Robert Huben', 'Lee Sharkey'],
      venue: 'ICLR 2024',
      year: 2024,
      pdfUrl: 'https://arxiv.org/pdf/2309.08600',
      sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9890000',
      sourceName: 'PubMed Central',
      relevanceScore: 92,
      relevanceReason: 'Introduces sparse autoencoders as a scalable method for extracting interpretable features from LLMs',
      status: 'ready',
      tldr: [
        { sentence: 'Sparse autoencoders trained on LLM activations learn highly interpretable monosemantic features.', sourceSentenceId: 'blk-sae-intro-1' },
        { sentence: 'The method scales to large models and finds features corresponding to specific concepts, entities, and syntax.', sourceSentenceId: 'blk-sae-intro-2' },
        { sentence: 'SAEs represent a promising scalable approach to mechanistic interpretability.', sourceSentenceId: 'blk-sae-intro-3' },
      ],
      sections: [
        {
          id: 'sec-sae-intro',
          title: 'Introduction',
          level: 1,
          isAppendix: false,
          content: [
            { id: 'blk-sae-intro-1', type: 'paragraph', raw: 'We train sparse autoencoders on intermediate activations of language models to extract interpretable features.' },
            { id: 'blk-sae-intro-2', type: 'paragraph', raw: 'The learned features are highly monosemantic and correspond to interpretable concepts across diverse domains.' },
            { id: 'blk-sae-intro-3', type: 'paragraph', raw: 'Sparse autoencoders provide a scalable dictionary learning approach to mechanistic interpretability.' },
          ],
          marginNotes: [],
        },
      ],
      variables: [
        { symbol: 'z', name: 'sparse code', definition: 'Sparse latent representation from autoencoder', firstSeenSectionId: 'sec-sae-intro', allOccurrences: ['blk-sae-intro-1'] },
      ],
      equations: [],
      figures: [],
      citations: [],
      notationWarnings: [],
      evidenceChains: [],
      notebookCells: [],
      readersOnline: 0,
    },
  ],
}

const outputPath = path.join(__dirname, '..', 'src', 'data', 'demo-fallback.json')
fs.writeFileSync(outputPath, JSON.stringify(demoData, null, 2))
console.log(`Demo data written to ${outputPath}`)
console.log(`Papers: ${demoData.papers.length}`)
