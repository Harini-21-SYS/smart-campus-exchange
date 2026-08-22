/* ---------------------------------------------------------
   Shared constants — imported by StudentDashboard and by
   any section/component that needs them.
--------------------------------------------------------- */

export const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Books & Stationery",
  "Clothing",
  "Sports & Fitness",
  "Furniture",
  "Others",
];

export const TYPES = ["Sell", "Exchange", "Donate"];
export const CONDITIONS = ["New", "Like New", "Good", "Fair"];
export const MAX_IMAGES = 4;
export const PAGE_SIZE = 8;

export const HISTORY_STORAGE_KEYS = {
  browsing: "cx_browsingHistory",
  purchase: "cx_purchaseHistory",
};

export const TYPE_INFO = {
  Sell: { badgeClass: "type-sell", actionLabel: "Request to Buy" },
  Exchange: { badgeClass: "type-exchange", actionLabel: "Request Exchange" },
  Donate: { badgeClass: "type-donate", actionLabel: "Request Donate" },
};

// The lifecycle every request (Sell / Donate / Exchange) moves through.
// Exchange requests additionally carry an `offeredProduct` chosen from
// the buyer's My Purchases before the request is even sent.
export const REQUEST_STATUS = {
  PENDING: "pending", // sent, awaiting seller response
  AWAITING_CONFIRMATION: "awaiting_confirmation", // seller accepted + gave pickup info, awaiting buyer
  CONFIRMED: "confirmed", // buyer confirmed pickup — done
  REJECTED: "rejected", // seller rejected
};

export const SAMPLE_PRODUCTS = [
  { id: 1, name: "Scientific Calculator (Casio fx-991)", price: 450, category: "Electronics", type: "Sell", condition: "Good", sellerName: "Rahul Nair", department: "Computer Science", description: "Barely used, all functions working perfectly. Great for engineering coursework.", images: [] },
  { id: 2, name: "Data Structures & Algorithms Textbook", price: 0, category: "Books & Stationery", type: "Exchange", condition: "Good", sellerName: "Priya Suresh", department: "Computer Application", description: "Looking to exchange for a Database Management Systems textbook, any edition.", images: [] },
  { id: 3, name: "Winter Hostel Jacket (L)", price: 0, category: "Clothing", type: "Donate", condition: "Like New", sellerName: "Arjun Kumar", department: "Mechanical Engineering", description: "Warm and in good condition, just doesn't fit me anymore.", images: [] },
  { id: 4, name: "Badminton Racket + Cover", price: 550, category: "Sports & Fitness", type: "Sell", condition: "Good", sellerName: "Sneha Reddy", department: "Commerce", description: "Yonex racket, used for one semester of intramurals only.", images: [] },
  { id: 5, name: "Study Table Lamp", price: 200, category: "Furniture", type: "Sell", condition: "Like New", sellerName: "Vikram Singh", department: "Electrical Engineering", description: "LED lamp with adjustable brightness, works great for late-night study.", images: [] },
  { id: 6, name: "Drafting Kit (Full Set)", price: 0, category: "Others", type: "Exchange", condition: "Fair", sellerName: "Ananya Iyer", department: "Civil Engineering", description: "Complete drafting set, looking to exchange for a graphic calculator.", images: [] },
  { id: 7, name: "Wireless Mouse", price: 250, category: "Electronics", type: "Sell", condition: "New", sellerName: "Karthik Raj", department: "Information Technology", description: "Logitech wireless mouse, works perfectly, includes USB receiver.", images: [] },
  { id: 8, name: "Old Semester Notes Bundle", price: 0, category: "Books & Stationery", type: "Donate", condition: "Good", sellerName: "Divya Menon", department: "Business Administration", description: "Handwritten notes for first-year core subjects, neatly organized.", images: [] },
  { id: 9, name: "Chemistry Lab Manual", price: 150, category: "Books & Stationery", type: "Sell", condition: "Fair", sellerName: "Meera Pillai", department: "Chemistry", description: "Second-hand lab manual, all pages intact, minor highlighting.", images: [] },
  { id: 10, name: "Bluetooth Earphones", price: 550, category: "Electronics", type: "Sell", condition: "Good", sellerName: "Rohit Sharma", department: "Electronics & Comm.", description: "6 months old, comes with charging case.", images: [] },
  { id: 11, name: "Mechanical Keyboard", price: 1200, category: "Electronics", type: "Sell", condition: "Good", sellerName: "Farhan Ali", department: "Computer Science", description: "Blue-switch keyboard, RGB backlight, barely used.", images: [] },
  { id: 12, name: "Organic Chemistry Guide", price: 0, category: "Books & Stationery", type: "Exchange", condition: "Good", sellerName: "Meera Pillai", department: "Chemistry", description: "Looking to exchange for an Inorganic Chemistry reference.", images: [] },
];

// Top-level sidebar items (no grouping needed).
export const SIDEBAR_ITEMS = [
  { id: "myProducts", label: "My Products" },
  { id: "myRequests", label: "My Requests" },
  { id: "myPurchases", label: "My Purchases" },
];

// Grouped separately since it has its own sub-menu.
export const COMPLAINTS_SIDEBAR_GROUP = {
  label: "Complaints",
  items: [
    { id: "myComplaints", label: "My Complaints" },
    { id: "raiseComplaint", label: "Raise Complaint" },
    { id: "complaintsAgainstMe", label: "Complaints Raised on Me" },
  ],
};

// Matches complaint_table.complaint_type — reasonable defaults; adjust
// to whatever enum/values your backend actually stores.
export const COMPLAINT_TYPES = [
  "Item Not as Described",
  "Item Not Received",
  "Payment Issue",
  "No-Show for Pickup",
  "Damaged Item",
  "Other",
];

// Matches complaint_table.status.
export const COMPLAINT_STATUS = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
  ESCALATED: "ESCALATED",
};

export const PROFILE_IMAGE_BASE_URL = "http://localhost:8081/uploads/profile-images/";

// Sample incoming requests — demo data standing in for requests
// other students have sent for your listings. Shape matches what a
// real backend request record would carry once wired up.
export const SAMPLE_INCOMING_REQUESTS = [
  {
    id: "inc-1",
    productName: "Graphing Calculator (TI-84 Plus)",
    requesterName: "Ishaan Verma",
    department: "Electronics & Comm.",
    year: "2",
    type: "Sell",
    message: "Hi, is this still available? I can pick up anytime this week.",
    offeredProduct: null,
    status: "pending",
    pickupLocation: null,
    pickupTime: null,
    time: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "inc-2",
    productName: "Hostel Study Chair",
    requesterName: "Fatima Sheikh",
    department: "Business Administration",
    year: "1",
    type: "Donate",
    message: "Would really appreciate this for my room!",
    offeredProduct: null,
    status: "pending",
    pickupLocation: null,
    pickupTime: null,
    time: Date.now() - 1000 * 60 * 60 * 26,
  },
];

// Complaints other students have raised against YOU. Per the safety
// rule, the complainant's name and department are intentionally never
// included in this data at all — not just hidden in the UI — so a
// future dev can't accidentally render them.
export const SAMPLE_COMPLAINTS_AGAINST_ME = [
  {
    id: "cam-1",
    productName: "Mechanical Keyboard",
    complaintType: "Item Not as Described",
    description: "The keyboard had a sticky spacebar that wasn't mentioned in the listing.",
    status: COMPLAINT_STATUS.UNDER_REVIEW,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
];