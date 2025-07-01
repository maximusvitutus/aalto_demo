export const HELSINGIN_SANOMAT_PRESET = {
  readers: 'Journalist at Helsingin Sanomat',
  interests: 'As a journalist, I\'m particularly interested in studies that explain the development of quantum technology in an accessible way – both for general audiences and experts. I closely follow the progress of quantum bits, or qubits, their stabilization, and their practical applications in fields like medicine and logistics. I seek out research that goes beyond speculation about the future and presents concrete steps toward functional quantum computers. I especially value publications that address the challenges of quantum computing, such as error correction, scalability, and energy consumption. I also often write about how these breakthroughs are covered in the media and how they influence the broader societal discourse around technology.',
  cannedResults: [
    {
      title: "Quantum Error Correction Breakthroughs: From Laboratory to Commercial Viability",
      year: 2023,
      affinityScore: 9.3,
      summary: {
        topic: "Recent advances in quantum error correction methods and their practical implications for scalable quantum computing",
        methodology: "Technical analysis of error correction protocols tested across different quantum computing platforms over 24 months",
        findings: "New error correction methods reduced computational errors by 60% while requiring 40% fewer physical qubits",
        implications: "Brings commercial quantum computing significantly closer to reality, with potential applications in drug discovery and logistics optimization"
      }
    },
    {
      title: "Quantum Computing in Healthcare: Real-World Applications and Limitations",
      year: 2023,
      affinityScore: 9.0,
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
      affinityScore: 8.7,
      summary: {
        topic: "Analysis of how quantum computing breakthroughs are communicated to the public and the gap between scientific reality and media portrayal",
        methodology: "Content analysis of 500 quantum computing articles across major news outlets compared with peer-reviewed research",
        findings: "70% of media coverage overstated near-term quantum capabilities, while underemphasizing genuine current achievements",
        implications: "Suggests need for improved science communication that balances excitement about quantum potential with realistic timelines"
      }
    }
  ]
};
