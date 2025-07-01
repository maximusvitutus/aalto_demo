export const HELSINGIN_SANOMAT_PRESET = {
  readers: 'Technology Journalist at Helsingin Sanomat',
  interests: 'As a technology journalist covering quantum technology, I\'m interested in studies that explain the development of quantum technology in an accessible way – focusing on relevance for society and the general public. I closely follow the progress of quantum bits, or qubits, their stabilization, and their practical applications in fields like medicine and logistics. I seek out research that goes beyond speculation about the future and presents concrete steps toward functional quantum computers.',
  cannedResults: [
    {
      title: "Surface-Code Quantum Memory Beats Physical Qubits",
      year: 2025,
      affinityScore: 10,
      summary: {
        topic: "The study shows that bundling many imperfect qubits into a surface-code ‘logical qubit’ can now cut errors just as theory predicted.",
        methodology: "Google’s team built two next-gen superconducting chips and ran thousands to a million error-correction cycles while a live decoder fixed mistakes in real time.",
        findings: "The larger 105-qubit code slashed the error rate by about half compared with the 72-qubit code and kept information alive more than twice as long as any single qubit.",
        implications: "Practical, fault-tolerant quantum computers are now a scaling and engineering problem - trying to suppress rare error bursts and push for faster decoders."
      }
    },
    {
      title: "Quantum Computing in Healthcare: Real-World Applications and Limitations",
      year: 2025,
      affinityScore: 9,
      summary: {
        topic: "Current and near-term applications of quantum computing in medical research, drug discovery, and diagnostic systems",
        methodology: "Case study analysis of quantum computing pilots in 8 pharmaceutical companies and 3 medical research institutions",
        findings: "Quantum systems accelerated molecular simulation by 100x but remain limited to specific problem types and small molecules",
        implications: "Quantum computing shows genuine medical promise but public expectations need calibration regarding timeline and scope"
      }
    },
    {
      title: "Media Coverage of Quantum Technology: Hype vs. Reality in Science Communication",
      year: 2023,
      affinityScore: 8,
      summary: {
        topic: "Analysis of how quantum computing breakthroughs are communicated to the public and the gap between scientific reality and media portrayal",
        methodology: "Content analysis of 500 quantum computing articles across major news outlets compared with peer-reviewed research",
        findings: "70% of media coverage overstated near-term quantum capabilities, while underemphasizing genuine current achievements",
        implications: "Suggests need for improved science communication that balances excitement about quantum potential with realistic timelines"
      }
    }
  ]
};
