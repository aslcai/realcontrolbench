/* Task definitions and method descriptions for the supplied evaluation results. */
window.RCB = {
  repository: 'https://github.com/MingyuJ666/ControlBench',
  paper: 'https://arxiv.org/abs/2610.27295',
  dataset: 'https://huggingface.co/datasets/Mingyu111/controlbench',
  models: [
    { id: 'qwen3-8b', name: 'Qwen3-8B' },
    { id: 'llama-3.1-8b', name: 'Llama-3.1-8B-Instruct' },
    { id: 'gemma-2-9b', name: 'Gemma-2-9B-it' }
  ],
  methods: [
    { id: 'unsteered', name: 'Unsteered', kind: 'baseline', description: 'The reference model without an activation intervention.' },
    { id: 'prompted', name: 'Prompted', kind: 'baseline', description: 'The prompting baseline, using task-specific instructions.' },
    { id: 'caa', name: 'CAA', kind: 'steering', description: 'One of the six activation-steering methods evaluated in RealControlBench.' },
    { id: 'pca', name: 'PCA', kind: 'steering', description: 'One of the six activation-steering methods evaluated in RealControlBench.' },
    { id: 'lat', name: 'LAT', kind: 'steering', description: 'One of the six activation-steering methods evaluated in RealControlBench.' },
    { id: 'linear-probe', name: 'Linear Probe', kind: 'steering', description: 'One of the six activation-steering methods evaluated in RealControlBench.' },
    { id: 'iti', name: 'ITI', kind: 'steering', description: 'An attention-head intervention evaluated in RealControlBench. Head selection and intervention strength are recorded in the task-specific configuration.' },
    { id: 'sae', name: 'SAE', kind: 'steering', models: ['gemma-2-9b'], description: 'The SAE experiments use Gemma Scope dictionaries on Gemma-2-9B-it.' }
  ],
  // Values are already percentages. Missing metrics remain unranked.
  results: window.RCB_RESULTS.scores,
  resultSelection: window.RCB_RESULTS.selection,
  tasks: [
    { id: 'instruction-following', short: 'Instruction following', label: 'Instruction following', number: '01',
      description: 'Follow a response constraint while still giving a coherent, adequate answer.',
      detail: 'Five response constraints: lowercase, one sentence, no commas, a question ending, and a fixed ending.',
      dataset: 'OpenAssistant', metrics: ['Success rate ↑'],
      metricNotes: ['Success requires passing the format rule, a coherent response, and an adequate answer.'],
      tags: ['Response constraints', 'Answer quality'], docs: 'instruction-following' },
    { id: 'tool-use', short: 'Agentic tool use', label: 'Agentic tool use', number: '02',
      description: 'Call, clarify, or abstain — then carry the decision through execution.',
      detail: 'Single-turn decisions and follow-ups use When2Call; multi-turn execution uses stateful BFCL v4 conversations.',
      dataset: 'When2Call · BFCL v4', metrics: ['Single-turn decision ↑', 'Single-turn follow-up ↑'],
      metricIds: ['initial-success', 'follow-up-success'],
      metricNotes: ['Success of the initial call, clarify, or abstain decision, averaged equally across the three targets.', 'The initial decision and follow-up action both succeed for the same item, averaged equally across clarify and abstain targets. Configurations are selected independently for this metric.'],
      tags: ['Decision-making', 'Stateful execution'], docs: 'tool-use' },
    { id: 'reasoning', short: 'Reasoning', label: 'Reasoning performance', number: '03',
      description: 'Improve mathematical reasoning and test whether the gains transfer.',
      detail: 'Configurations are selected on development data, then evaluated on held-out MATH500 and transfer benchmarks.',
      dataset: 'MATH500 · AMC 2023 · AIME 2024', metrics: ['MATH500 accuracy ↑', 'AMC 2023 accuracy ↑', 'AIME 2024 accuracy ↑'],
      metricNotes: ['Held-out MATH500 answer accuracy.', 'Transfer accuracy on AMC 2023.', 'Transfer accuracy on AIME 2024.'],
      tags: ['Answer accuracy', 'Transfer'], docs: 'reasoning' }
  ]
};
