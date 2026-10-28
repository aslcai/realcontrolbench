/* Content comes from ../ControlBench/README.md and the domain guides.
   This is a method catalogue, not an evaluation-results fixture. */
window.RCB = {
  repository: 'https://github.com/MingyuJ666/ControlBench',
  dataset: 'https://huggingface.co/datasets/Mingyu111/controlbench',
  models: [
    { id: 'qwen3-8b', name: 'Qwen3-8B' },
    { id: 'llama-3.1-8b', name: 'Llama-3.1-8B-Instruct' },
    { id: 'gemma-2-9b', name: 'Gemma-2-9B-it' }
  ],
  methods: [
    { id: 'unsteered', name: 'Unsteered', kind: 'baseline', description: 'The reference model without an activation intervention. Published results will provide the comparison point for steering methods.' },
    { id: 'prompted', name: 'Prompted', kind: 'baseline', description: 'A prompting baseline. The reasoning track uses a chain-of-thought baseline; prompting instructions depend on the evaluation domain.' },
    { id: 'caa', name: 'CAA', kind: 'steering', description: 'One of the six activation-steering methods included in RealControlBench. Intervention settings and evaluated artifacts will accompany each published run.' },
    { id: 'pca', name: 'PCA', kind: 'steering', description: 'One of the six activation-steering methods included in RealControlBench. Layer and steering-strength settings will accompany each published run.' },
    { id: 'lat', name: 'LAT', kind: 'steering', description: 'One of the six activation-steering methods included in RealControlBench. Its results will be reported alongside the unsteered and prompted references.' },
    { id: 'linear-probe', name: 'Linear Probe', kind: 'steering', description: 'One of the six activation-steering methods included in RealControlBench. The method profile will link the evaluated configuration and reproducibility information.' },
    { id: 'iti', name: 'ITI', kind: 'steering', description: 'An attention-head intervention evaluated in RealControlBench. Head selection and intervention strength are recorded in the task-specific configuration.' },
    { id: 'sae', name: 'SAE', kind: 'steering', models: ['gemma-2-9b'], description: 'The SAE experiments use Gemma Scope dictionaries on Gemma-2-9B-it. Published runs will identify the selected features, dictionary revision, and intervention settings.' }
  ],
  // Published numeric scores keyed by model ID, method ID, and metric ID.
  // Missing values stay unranked; example metric ID: instruction-following.success-rate.
  results: {},
  tasks: [
    { id: 'instruction-following', short: 'Instruction following', label: 'Instruction following', number: '01',
      description: 'Follow a response constraint while still giving a coherent, adequate answer.',
      detail: 'Five response constraints: lowercase, one sentence, no commas, a question ending, and a fixed ending.',
      dataset: 'OpenAssistant', metrics: ['Success rate ↑', 'Rule pass rate ↑'],
      metricNotes: ['Success requires passing the format rule, a coherent response, and an adequate answer.', 'Rule pass rate measures the format constraint alone.'],
      tags: ['Response constraints', 'Answer quality'], docs: 'instruction-following' },
    { id: 'tool-use', short: 'Agentic tool use', label: 'Agentic tool use', number: '02',
      description: 'Call, clarify, or abstain — then carry the decision through execution.',
      detail: 'Single-turn decisions and follow-ups use When2Call; multi-turn execution uses stateful BFCL v4 conversations.',
      dataset: 'When2Call · BFCL v4', metrics: ['Initial success ↑', 'Follow-up success ↑'],
      metricNotes: ['Success of the initial call, clarify, or abstain decision.', 'Success after the missing arguments or tools are supplied.'],
      tags: ['Decision-making', 'Stateful execution'], docs: 'tool-use' },
    { id: 'reasoning', short: 'Reasoning', label: 'Reasoning performance', number: '03',
      description: 'Improve mathematical reasoning and test whether the gains transfer.',
      detail: 'Configurations are selected on development data, then evaluated on held-out MATH500 and transfer benchmarks.',
      dataset: 'MATH500 · AMC 2023 · AIME 2024', metrics: ['MATH500 accuracy ↑', 'AMC 2023 accuracy ↑', 'AIME 2024 accuracy ↑'],
      metricNotes: ['Held-out MATH500 answer accuracy.', 'Transfer accuracy on AMC 2023.', 'Transfer accuracy on AIME 2024.'],
      tags: ['Answer accuracy', 'Transfer'], docs: 'reasoning' }
  ]
};
