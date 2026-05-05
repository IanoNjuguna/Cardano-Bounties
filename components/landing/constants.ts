export const navItems = [
  ["Explore Bounties", "#features"],
  ["How It Works", "#pricing"],
  ["Apply", "#leaderboard"],
];

export const benefits = [
  {
    title: "Wallet-based login",
    text: "No email, no password, no account setup. Your Cardano wallet is your identity on the platform. Connect once and you're in.",
    icon: "bolt",
    highlighted: true,
  },
  {
    title: "Real tasks, real rewards",
    text: "Browse open bounties, choose work that matches your skill level, submit your contribution, and earn ADA when approved.",
    icon: "list",
  },
  {
    title: "Open to all skill levels",
    text: "Developers, designers, writers, researchers, and curious newcomers can all find meaningful work across the ecosystem.",
    icon: "globe",
  },
];

export const features = [
  {
    title: "Code & Smart Contracts",
    text: "Build tools, fix bugs, write Plutus scripts, develop SDKs, and contribute to open source Cardano infrastructure.",
    type: "tasks",
  },
  {
    title: "Design & UI/UX",
    text: "Create interfaces, design assets, and improve user experience for Cardano apps and community platforms.",
    type: "time",
  },
  {
    title: "Content & Documentation",
    text: "Write guides, tutorials, explainers, and technical docs that help the Cardano community learn and grow.",
    type: "integrations",
  },
  {
    title: "Community & Research",
    text: "Research protocols, analyze data, moderate forums, run events, translate content, and onboard newcomers.",
    type: "collaboration",
  },
];

export const plans = [
  {
    name: "01",
    intro: "Visit Cardano Bounties and connect Nami, Eternl, Lace, or any CIP-30 compatible wallet.",
    price: "Connect your wallet",
    action: "Join the Waitlist",
    features: [
      "No email or password required.",
      "Your wallet becomes your account.",
      "Free to participate.",
      "Built for Cardano contributors.",
    ],
  },
  {
    name: "02",
    intro: "Explore open bounties across categories. Filter by type, difficulty, or reward size.",
    price: "Browse and claim a bounty",
    action: "Explore Bounties",
    featured: true,
    features: [
      "Code, design, content, and research.",
      "Beginner-friendly options.",
      "Clear briefs and reward amounts.",
      "Opt in when the work fits.",
    ],
  },
  {
    name: "03",
    intro: "Complete the task and submit your work for review. Approved submissions are paid directly in ADA.",
    price: "Submit your work and earn ADA",
    action: "See How It Works",
    features: [
      "Admin-reviewed submissions.",
      "ADA rewards paid on-chain.",
      "No invoices or middlemen.",
      "Learn while contributing.",
    ],
  },
];

export const testimonials = [
  ["Code", "Smart contracts", "Build tools, fix bugs, write Plutus scripts, and contribute to Cardano infrastructure."],
  ["Design", "UI/UX", "Create interfaces, design assets, and improve product experiences across the ecosystem."],
  ["Docs", "Content", "Write guides, tutorials, explainers, and technical documentation for the community."],
  ["Research", "Analysis", "Investigate on-chain data, benchmark protocols, and surface useful ecosystem insights."],
  ["Community", "Onboarding", "Moderate forums, run events, translate content, and help newcomers find their footing."],
  ["Security", "Audits", "Review contracts and protocols for vulnerabilities through high-value expert bounties."],
];

export const faqs = [
  ["Proof of Stake from day one", "Cardano's Ouroboros protocol is one of the most energy-efficient and peer-reviewed blockchains ever built. Your contributions support a network designed for the long term."],
  ["Low transaction fees", "ADA rewards are paid on-chain with minimal fees, meaning more of the reward actually reaches you."],
  ["A growing global ecosystem", "From DeFi to NFTs to identity and governance, Cardano is expanding rapidly. The earlier you contribute, the more you shape what it becomes."],
];

export const liveBounties = [
  {
    title: "Build a Plutus V3 Smart Contract",
    reward: "5,000 ADA",
    tags: ["Development", "Plutus", "High Priority"],
    description: "We are looking for an experienced Plutus developer to build and audit a V3 smart contract for our new decentralized exchange protocol.",
    link: "#"
  },
  {
    title: "Redesign Landing Page UI",
    reward: "1,200 ADA",
    tags: ["Design", "UI/UX", "Figma"],
    description: "Help us revamp our project's landing page to improve conversion rates. We need a modern, clean, and responsive Figma prototype.",
    link: "#"
  },
  {
    title: "Write Technical Documentation",
    reward: "800 ADA",
    tags: ["Content", "Documentation"],
    description: "Create comprehensive developer documentation and API guides for our newly released Cardano SDK.",
    link: "#"
  }
];
