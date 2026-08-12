export interface DailySales {
  date: string;
  revenue: number;
  tickets: number;
}

export interface EventSalesBreakdown {
  id: string;
  eventName: string;
  category: string;
  date: string;
  ticketsSold: number;
  totalQuota: number;
  grossRevenue: number;
  avgOrderValue: number;
  status: "Active" | "Draft" | "Ended";
}

export interface EventItem {
  id: string;
  name: string;
  category: "Music" | "Festival" | "Conference" | "Sports" | "Theater" | "Workshop";
  date: string;
  time: string;
  location: string;
  venue: string;
  price: number;
  quota: number;
  sold: number;
  status: "Active" | "Draft" | "Ended";
  image: string;
  description: string;
}

export interface TransactionItem {
  id: string;
  buyerName: string;
  buyerEmail: string;
  eventName: string;
  eventId: string;
  quantity: number;
  totalPrice: number;
  paymentStatus: "Paid" | "Pending" | "Failed";
  paymentMethod: "Credit Card" | "QRIS" | "Bank Transfer" | "E-Wallet";
  date: string;
  time: string;
}

export interface DailySales {
  date: string;
  revenue: number;
  tickets: number;
}

export interface EventSalesBreakdown {
  id: string;
  eventName: string;
  category: string;
  date: string;
  ticketsSold: number;
  totalQuota: number;
  grossRevenue: number;
  avgOrderValue: number;
  status: "Active" | "Draft" | "Ended";
}

export const MOCK_EVENTS: EventItem[] = [
  {
    id: "EVT-1001",
    name: "Neon Horizon Music Festival 2026",
    category: "Festival",
    date: "2026-09-15",
    time: "18:00 WIB",
    location: "Jakarta International Stadium",
    venue: "Main Outdoor Arena",
    price: 750000,
    quota: 15000,
    sold: 12450,
    status: "Active",
    image: "/images/concert-banner.png",
    description: "Experience Asia's premier EDM and synthwave festival featuring international headliners, immersive 3D light shows, and state-of-the-art acoustic setups."
  },
  {
    id: "EVT-1002",
    name: "Global Tech Innovation Summit",
    category: "Conference",
    date: "2026-10-02",
    time: "09:00 WIB",
    location: "BCC Grand Ballroom, Bali",
    venue: "Hall A & B",
    price: 1200000,
    quota: 2500,
    sold: 2180,
    status: "Active",
    image: "/images/tech-conference.png",
    description: "Connect with global tech leaders, AI pioneers, and venture capitalists in a 3-day deep dive into artificial intelligence, cloud architectures, and web3."
  },
  {
    id: "EVT-1003",
    name: "Symphony Under The Stars: Royal Orchestra",
    category: "Music",
    date: "2026-08-28",
    time: "19:30 WIB",
    location: "Taman Ismail Marzuki, Jakarta",
    venue: "Concert Hall",
    price: 450000,
    quota: 1200,
    sold: 1200,
    status: "Ended",
    image: "/images/concert-banner.png",
    description: "An enchanting evening featuring timeless classical masterpieces played by the 80-piece National Philharmonic Orchestra."
  },
  {
    id: "EVT-1004",
    name: "National eSports Championship Final",
    category: "Sports",
    date: "2026-11-12",
    time: "13:00 WIB",
    location: "Istora Senayan, Jakarta",
    venue: "Main Court Arena",
    price: 250000,
    quota: 8000,
    sold: 5600,
    status: "Active",
    image: "/images/tech-conference.png",
    description: "Witness the nation's top eSports teams compete live for the grand trophy and $100,000 prize pool."
  },
  {
    id: "EVT-1005",
    name: "Broadways Drama: Phantom Mirage",
    category: "Theater",
    date: "2026-12-05",
    time: "20:00 WIB",
    location: "Ciputra Artpreneur Theatre",
    venue: "Main Auditorium",
    price: 600000,
    quota: 1500,
    sold: 420,
    status: "Active",
    image: "/images/concert-banner.png",
    description: "A breathtaking theatrical mystery drama filled with soaring vocals, gothic set design, and unforgettable character portrayals."
  },
  {
    id: "EVT-1006",
    name: "UI/UX & Product Design Masterclass",
    category: "Workshop",
    date: "2026-09-20",
    time: "10:00 WIB",
    location: "CoWork Space Studio, Bandung",
    venue: "Creative Lab 3",
    price: 350000,
    quota: 100,
    sold: 85,
    status: "Active",
    image: "/images/tech-conference.png",
    description: "Hands-on intensive workshop covering design systems, micro-interactions, Figma component architecture, and usability testing."
  },
  {
    id: "EVT-1007",
    name: "Indie Rock Night Live",
    category: "Music",
    date: "2026-10-18",
    time: "19:00 WIB",
    location: "Gelora Bung Karno Park",
    venue: "Stage 2",
    price: 300000,
    quota: 3000,
    sold: 0,
    status: "Draft",
    image: "/images/concert-banner.png",
    description: "An intimate indie rock gathering bringing together rising underground talent and iconic guest indie bands."
  },
  {
    id: "EVT-1008",
    name: "International Culinary & Wine Expo",
    category: "Festival",
    date: "2026-11-25",
    time: "11:00 WIB",
    location: "Convention Exhibition Center, Surabaya",
    venue: "Exhibition Hall 1-4",
    price: 150000,
    quota: 5000,
    sold: 0,
    status: "Draft",
    image: "/images/tech-conference.png",
    description: "Sample exquisite dishes and rare vintages from world-renowned chefs and master sommeliers."
  }
];

export const MOCK_TRANSACTIONS: TransactionItem[] = [
  {
    id: "TRX-98201",
    buyerName: "Alexander Wright",
    buyerEmail: "alex.wright@example.com",
    eventName: "Neon Horizon Music Festival 2026",
    eventId: "EVT-1001",
    quantity: 2,
    totalPrice: 1500000,
    paymentStatus: "Paid",
    paymentMethod: "QRIS",
    date: "2026-08-10",
    time: "14:23 WIB"
  },
  {
    id: "TRX-98202",
    buyerName: "Sophia Martinez",
    buyerEmail: "sophia.m@example.com",
    eventName: "Global Tech Innovation Summit",
    eventId: "EVT-1002",
    quantity: 1,
    totalPrice: 1200000,
    paymentStatus: "Paid",
    paymentMethod: "Credit Card",
    date: "2026-08-10",
    time: "13:10 WIB"
  },
  {
    id: "TRX-98203",
    buyerName: "Budi Santoso",
    buyerEmail: "budi.santoso@example.com",
    eventName: "National eSports Championship Final",
    eventId: "EVT-1004",
    quantity: 4,
    totalPrice: 1000000,
    paymentStatus: "Paid",
    paymentMethod: "E-Wallet",
    date: "2026-08-10",
    time: "11:45 WIB"
  },
  {
    id: "TRX-98204",
    buyerName: "Emily Chen",
    buyerEmail: "emily.chen@example.com",
    eventName: "Neon Horizon Music Festival 2026",
    eventId: "EVT-1001",
    quantity: 1,
    totalPrice: 750000,
    paymentStatus: "Pending",
    paymentMethod: "Bank Transfer",
    date: "2026-08-10",
    time: "10:15 WIB"
  },
  {
    id: "TRX-98205",
    buyerName: "Marcus Vance",
    buyerEmail: "marcus.vance@example.com",
    eventName: "Broadways Drama: Phantom Mirage",
    eventId: "EVT-1005",
    quantity: 2,
    totalPrice: 1200000,
    paymentStatus: "Failed",
    paymentMethod: "Credit Card",
    date: "2026-08-09",
    time: "21:30 WIB"
  },
  {
    id: "TRX-98206",
    buyerName: "Jessica Alba",
    buyerEmail: "jessica.a@example.com",
    eventName: "Global Tech Innovation Summit",
    eventId: "EVT-1002",
    quantity: 2,
    totalPrice: 2400000,
    paymentStatus: "Paid",
    paymentMethod: "Credit Card",
    date: "2026-08-09",
    time: "18:04 WIB"
  },
  {
    id: "TRX-98207",
    buyerName: "Rizky Pratama",
    buyerEmail: "rizky.pratama@example.com",
    eventName: "UI/UX & Product Design Masterclass",
    eventId: "EVT-1006",
    quantity: 1,
    totalPrice: 350000,
    paymentStatus: "Paid",
    paymentMethod: "QRIS",
    date: "2026-08-09",
    time: "16:20 WIB"
  },
  {
    id: "TRX-98208",
    buyerName: "David Kim",
    buyerEmail: "david.kim@example.com",
    eventName: "Neon Horizon Music Festival 2026",
    eventId: "EVT-1001",
    quantity: 3,
    totalPrice: 2250000,
    paymentStatus: "Paid",
    paymentMethod: "E-Wallet",
    date: "2026-08-08",
    time: "15:40 WIB"
  },
  {
    id: "TRX-98209",
    buyerName: "Amanda Seyfried",
    buyerEmail: "amanda.s@example.com",
    eventName: "National eSports Championship Final",
    eventId: "EVT-1004",
    quantity: 2,
    totalPrice: 500000,
    paymentStatus: "Pending",
    paymentMethod: "Bank Transfer",
    date: "2026-08-08",
    time: "12:12 WIB"
  },
  {
    id: "TRX-98210",
    buyerName: "Clara Oswald",
    buyerEmail: "clara.o@example.com",
    eventName: "Broadways Drama: Phantom Mirage",
    eventId: "EVT-1005",
    quantity: 1,
    totalPrice: 600000,
    paymentStatus: "Paid",
    paymentMethod: "QRIS",
    date: "2026-08-07",
    time: "19:05 WIB"
  }
];

export const MOCK_REVENUE_7_DAYS: DailySales[] = [
  { date: "Aug 04", revenue: 12500000, tickets: 95 },
  { date: "Aug 05", revenue: 18200000, tickets: 140 },
  { date: "Aug 06", revenue: 15400000, tickets: 110 },
  { date: "Aug 07", revenue: 24800000, tickets: 185 },
  { date: "Aug 08", revenue: 31000000, tickets: 230 },
  { date: "Aug 09", revenue: 27500000, tickets: 205 },
  { date: "Aug 10", revenue: 38400000, tickets: 290 }
];

export const MOCK_REVENUE_30_DAYS: DailySales[] = [
  { date: "Jul 12", revenue: 8500000, tickets: 60 },
  { date: "Jul 15", revenue: 14200000, tickets: 110 },
  { date: "Jul 18", revenue: 19800000, tickets: 145 },
  { date: "Jul 21", revenue: 16400000, tickets: 120 },
  { date: "Jul 24", revenue: 28500000, tickets: 210 },
  { date: "Jul 27", revenue: 22100000, tickets: 165 },
  { date: "Jul 30", revenue: 34000000, tickets: 250 },
  { date: "Aug 02", revenue: 29500000, tickets: 220 },
  { date: "Aug 05", revenue: 38200000, tickets: 280 },
  { date: "Aug 08", revenue: 41000000, tickets: 310 },
  { date: "Aug 10", revenue: 45800000, tickets: 345 }
];

export const MOCK_SALES_BREAKDOWN: EventSalesBreakdown[] = [
  {
    id: "EVT-1001",
    eventName: "Neon Horizon Music Festival 2026",
    category: "Festival",
    date: "Sep 15, 2026",
    ticketsSold: 12450,
    totalQuota: 15000,
    grossRevenue: 9337500000,
    avgOrderValue: 1245000,
    status: "Active"
  },
  {
    id: "EVT-1002",
    eventName: "Global Tech Innovation Summit",
    category: "Conference",
    date: "Oct 02, 2026",
    ticketsSold: 2180,
    totalQuota: 2500,
    grossRevenue: 2616000000,
    avgOrderValue: 1800000,
    status: "Active"
  },
  {
    id: "EVT-1003",
    eventName: "Symphony Under The Stars: Royal Orchestra",
    category: "Music",
    date: "Aug 28, 2026",
    ticketsSold: 1200,
    totalQuota: 1200,
    grossRevenue: 540000000,
    avgOrderValue: 675000,
    status: "Ended"
  },
  {
    id: "EVT-1004",
    eventName: "National eSports Championship Final",
    category: "Sports",
    date: "Nov 12, 2026",
    ticketsSold: 5600,
    totalQuota: 8000,
    grossRevenue: 1400000000,
    avgOrderValue: 420000,
    status: "Active"
  },
  {
    id: "EVT-1005",
    eventName: "Broadways Drama: Phantom Mirage",
    category: "Theater",
    date: "Dec 05, 2026",
    ticketsSold: 420,
    totalQuota: 1500,
    grossRevenue: 252000000,
    avgOrderValue: 850000,
    status: "Active"
  },
  {
    id: "EVT-1006",
    eventName: "UI/UX & Product Design Masterclass",
    category: "Workshop",
    date: "Sep 20, 2026",
    ticketsSold: 85,
    totalQuota: 100,
    grossRevenue: 29750000,
    avgOrderValue: 350000,
    status: "Active"
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "N-1",
    title: "New High Volume Purchase",
    message: "Alexander Wright bought 2x Tickets for Neon Horizon Festival.",
    time: "5 mins ago",
    unread: true,
    type: "sale"
  },
  {
    id: "N-2",
    title: "Event Sold Out Warning",
    message: "Symphony Under The Stars has reached 100% ticket capacity.",
    time: "42 mins ago",
    unread: true,
    type: "warning"
  },
  {
    id: "N-3",
    title: "Payment Gateway Alert",
    message: "Bank Transfer response delay detected on Transaction #TRX-98205.",
    time: "2 hours ago",
    unread: false,
    type: "system"
  }
];
