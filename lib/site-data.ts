export type NavItem = {
  href: string;
  label: string;
};

export type Feature = {
  title: string;
  description: string;
  badge: string;
};

export type FeedPost = {
  author: string;
  summary: string;
  market: string;
  likes: number;
  comments: number;
};

export type MessageThread = {
  name: string;
  status: "online" | "away";
  lastMessage: string;
  time: string;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/network", label: "Network" },
  { href: "/feed", label: "Feed" },
  { href: "/messages", label: "Messages" },
  { href: "/features", label: "Features" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/settings", label: "Settings" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign Up" },
];

export const featureList: Feature[] = [
  {
    title: "Portfolio Intelligence",
    description: "Track performance with live P/L tiles, weighted risk scores, and asset heatmaps.",
    badge: "Analytics",
  },
  {
    title: "Signal Exchange",
    description: "Publish market ideas to your network and subscribe to curated sector channels.",
    badge: "Community",
  },
  {
    title: "Order Workspace",
    description: "Preview slippage impact, set bracket orders, and stage trades before execution.",
    badge: "Execution",
  },
  {
    title: "Risk Shields",
    description: "Use loss limits, volatility alerts, and cooldown automation to prevent overtrading.",
    badge: "Safety",
  },
  {
    title: "Team Rooms",
    description: "Coordinate with analysts, mentors, and partners in private topic channels.",
    badge: "Collaboration",
  },
  {
    title: "Session Journals",
    description: "Write post-trade notes and convert them into repeatable playbooks automatically.",
    badge: "Learning",
  },
];

export const feedPosts: FeedPost[] = [
  {
    author: "Ava Stone",
    summary: "Watching breakout pressure in EV basket; reduced exposure after second rejection.",
    market: "US Equities",
    likes: 82,
    comments: 14,
  },
  {
    author: "Rami Khan",
    summary: "Scaled into gold momentum as dollar eased. Looking for continuation into next session.",
    market: "Commodities",
    likes: 65,
    comments: 9,
  },
  {
    author: "Nina Petrov",
    summary: "Crypto perp funding normalized. Bias neutral until volume confirms trend direction.",
    market: "Digital Assets",
    likes: 91,
    comments: 23,
  },
];

export const messageThreads: MessageThread[] = [
  {
    name: "Marcus Vega",
    status: "online",
    lastMessage: "Can you review the EUR/USD setup before open?",
    time: "2m",
  },
  {
    name: "Desk - Macro Alerts",
    status: "away",
    lastMessage: "Rate decision briefing uploaded.",
    time: "18m",
  },
  {
    name: "Sophie Lin",
    status: "online",
    lastMessage: "Your watchlist filter is clean now.",
    time: "1h",
  },
];

export const faqItems = [
  {
    question: "Can I edit every page in this recovered project?",
    answer: "Yes. This project now uses route files and reusable components, so each screen can be updated in VS Code directly.",
  },
  {
    question: "Does this include backend and database code?",
    answer: "No. Public website recovery only restores frontend-delivered files. Backend logic and secrets are not recoverable from the live site.",
  },
  {
    question: "How do I continue rebuilding from here?",
    answer: "Replace mock data with real API calls, then migrate each section into dedicated components and server actions as needed.",
  },
];
