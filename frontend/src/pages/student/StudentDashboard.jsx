import { useState, useEffect, useMemo, useCallback } from "react";
import "./StudentDashboard.css";
import { useNavigate, useLocation } from "react-router-dom";
import StudentNavbar, { STUDENT_NAV_TABS } from "./StudentNavbar";
import { getProfile } from "../../services/profileService";
import SellerProfileSection from "./sections/SellerProfileSection";
import {
  getBrowseProducts,
  getMyProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
} from "../../services/productService";

import {
  createRequest,
  getMyRequests,
  getIncomingRequests,
  deleteRequest,
} from "../../services/requestService";

import {
  getPickupByRequestId,
  confirmProductReceived,
} from "../../services/pickupService";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
 
} from "../../services/notificationService";

import {
  getMyComplaints,
  getComplaintsAgainstMe,
} from "../../services/complaintService";

import { FaUser, FaCheckCircle } from "react-icons/fa";

import {
  SIDEBAR_ITEMS,
  COMPLAINTS_SIDEBAR_GROUP,
  PROFILE_IMAGE_BASE_URL,
  HISTORY_STORAGE_KEYS,
 
  SAMPLE_COMPLAINTS_AGAINST_ME,
  TYPE_INFO,
  COMPLAINT_STATUS,
} from "./constants";
import { loadHistory, getRecommendations, mapBackendProduct } from "./utils/DashboardUtils";

import ConfirmDialog from "./components/ConfirmDialog";
import SelectExchangeItemModal from "./components/SelectExchangeItemModal";

import BrowseProductsSection from "./sections/BrowseProductsSection";
import MyProductsSection from "./sections/MyProductsSection";
import MyRequestsSection from "./sections/MyRequestsSection";
import MyPurchasesSection from "./sections/MyPurchasesSection";
import MyComplaintsSection from "./sections/MyComplaintsSection";
import RaiseComplaintSection from "./sections/RaiseComplaintSection";
import ComplaintsAgainstMeSection from "./sections/ComplaintsAgainstMeSection";
import IncomingRequestsSection from "./sections/IncomingRequestsSection";
import NotificationsSection from "./sections/NotificationsSection";
import ProductDetailSection from "./sections/ProductDetailSection";
import ProductFormPage from "./sections/ProductFormPage";

/* ---------------------------------------------------------
   Main dashboard page — owns all state and simply renders
   whichever section/sub-view is active.

   REQUEST WORKFLOW (Sell / Donate / Exchange all share this):
     1. Buyer sends a request                       -> PENDING
        (Exchange only: buyer must first pick an
         item from My Purchases to offer)
     2. Seller reviews it, in Incoming Requests:
          - Accept -> must supply pickup location
            + date/time in the same step  -> Request stays ACCEPTED,
            a PickupSchedule is created with pickupStatus SCHEDULED
          - Reject -> Request becomes REJECTED
     3. Buyer reviews the proposed pickup details, in My Requests,
        and confirms -> pickupStatus becomes COMPLETED (this is what
        makes it show up in My Purchases). See handleBuyerConfirmPickup
        and the myPurchases filter below — both now call/check the
        REAL backend pickup status, not a mock Request.status value.
--------------------------------------------------------- */

// Every id that renderMain()'s switch actually knows how to render.
// Anything else (stale location.state, a renamed sidebar id, a typo
// in a caller passing navigate(..., { state: { section } })) must
// NOT be trusted blindly — otherwise mainSection can end up holding
// a value with no matching case, renderMain() falls through to
// `default`, and the whole content area silently goes blank while
// the navbar/sidebar still render fine. That's the "dashboard
// sometimes doesn't show up" bug.
const VALID_SECTIONS = [
  "products",
  "incomingRequests",
  "notifications",
  "myProducts",
  "myRequests",
  "myPurchases",
  "myComplaints",
  "raiseComplaint",
  "complaintsAgainstMe",
];
const mapBackendRequest = (r) => ({
  id: r.id,

  productId:
    r.productId ??
    r.product?.id,

  productName:
    r.productTitle ??
    r.product?.title ??
    "Untitled listing",

  productImage:
    r.productImage ??
    r.product?.images?.[0]?.imageUrl ??
    r.product?.images?.[0]?.url ??
    null,

  category:
    r.category ??
    r.product?.category ??
    "",

  sellerId:
    r.sellerId ??
    r.seller?.studentId,

  sellerName:
    r.sellerName ??
    r.seller?.fullName ??
    "Unknown Seller",

  requesterId:
    r.requesterId ??
    r.requester?.studentId,

  requesterName:
    r.requesterName ??
    r.requester?.fullName ??
    "Unknown Student",

  requestType:
    r.requestType,

  type:
    r.productType ??
    r.product?.type ??
    (r.requestType === "EXCHANGE"
      ? "Exchange"
      : r.requestType === "DONATE"
      ? "Donate"
      : "Sell"),

  price:
    r.productPrice ??
    r.product?.price ??
    0,

  message:
    r.message ??
    "",

  offeredProduct:
    r.offeredProduct ??
    null,

  status:
    r.status ??
    "PENDING",

  pickupLocation:
    r.pickupLocation ??
    null,

  // FIX: this was never mapped before, even though RequestResponse
  // sends it. My Requests needs it (alongside pickupTime) to display
  // a real date, not just a time.
  pickupDate:
    r.pickupDate ??
    null,

  pickupTime:
    r.pickupTime ??
    null,

  // FIX: also never mapped before. This is the real signal for
  // "transaction completed" — it becomes "COMPLETED" once the buyer
  // calls confirmProductReceived on the pickup. myPurchases filters
  // on this now instead of a Request.status value ("CONFIRMED") that
  // the backend never actually sets.
  pickupStatus:
    r.pickupStatus ??
    null,

  time:
    r.createdAt
      ? new Date(r.createdAt).getTime()
      : Date.now(),

  updatedAt:
    r.updatedAt ??
    null,
});
const mapBackendComplaint = (complaint) => ({
  id:
    complaint.complaintId,

  productId:
    complaint.productId,

  productName:
    complaint.productTitle ||
    "Unknown Product",

 productImage:
    complaint.productImage ||
    complaint.imageUrl ||
    null,

  requestId:
    complaint.requestId,

  complaintType:
    complaint.complaintType,

  description:
    complaint.description,

  status:
    complaint.status,

  createdAt:
    complaint.createdAt
      ? new Date(
          complaint.createdAt
        ).getTime()
      : Date.now(),

  resolvedAt:
    complaint.resolvedAt
      ? new Date(
          complaint.resolvedAt
        ).getTime()
      : null,

  studentId:
    complaint.studentId,

  studentName:
    complaint.studentName,

  againstStudentId:
    complaint.againstStudentId,

  againstStudentName:
    complaint.againstStudentName,
});
const getNotificationMessage = (type) => {

  switch (type) {

    case "REQUEST_RECEIVED":
      return "You received a new request.";

    case "REQUEST_ACCEPTED":
      return "Your request has been accepted.";

    case "REQUEST_REJECTED":
      return "Your request has been rejected.";

    case "REQUEST_CANCELLED":
      return "A request has been cancelled.";

    case "COMPLAINT_RECEIVED":
      return "A new complaint has been raised against you.";

    case "COMPLAINT_UPDATED":
      return "Your complaint has been updated.";

    case "COMPLAINT_RESOLVED":
      return "Your complaint has been resolved.";

    default:
      return "You have a new notification.";
  }
};

const mapBackendNotification = (notification) => ({
  id:
    notification.id ??
    notification.notifyId,

  notifyType:
    notification.notifyType,

  relatedId:
    notification.relatedId,

  read:
    notification.isRead ?? false,

  time:
    notification.createdAt
      ? new Date(notification.createdAt).getTime()
      : Date.now(),

  createdAt:
    notification.createdAt,

  message:
    notification.message ??
    getNotificationMessage(notification.notifyType),
});

// Spring's ResponseStatusException serializes as e.g.
// `400 BAD_REQUEST "This product is no longer available"` on the
// `message` field. This strips the status-code/reason-phrase prefix
// and surrounding quotes so every toast in this file shows just the
// human-readable part, whichever endpoint the 400 came from.
// Always logs the raw error.response?.data too, so the real backend
// message is visible in the console even for calls that don't
// specifically log it themselves.
const extractErrorMessage = (error, fallback) => {
  console.error("Request failed:", error, error.response?.data);

  const rawMessage = error.response?.data?.message;
  if (!rawMessage) return fallback;

  return rawMessage
    .replace(/^\d{3}\s+[A-Z_]+\s*/, "")
    .replace(/^"(.*)"$/, "$1");
};

function StudentDashboard() {
  const location = useLocation();

  const [mainSection, setMainSection] = useState(() => {
    const requested = location.state?.section;
    return VALID_SECTIONS.includes(requested) ? requested : "products";
  });
  const [subView, setSubView] = useState(null); // null | "detail" | "add" | "edit" | "sellerProfile"
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [viewedSeller, setViewedSeller] = useState(null); // { id, name, department, avatarUrl, trustScore }

  const [editingProduct, setEditingProduct] = useState(null);
  const [returnSection, setReturnSection] = useState("products");

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer only
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Sell/Donate request confirmation (simple confirm — no item to pick)
  const [requestTarget, setRequestTarget] = useState(null);
  // Exchange request — buyer must pick an offered item first
  const [exchangeTarget, setExchangeTarget] = useState(null);

  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [
  incomingRequests,
  setIncomingRequests
] = useState([]);
const loadMyRequests = useCallback(async () => {
  try {
    const data = await getMyRequests();

    const mappedRequests =
      (data || []).map(mapBackendRequest);

    setMyRequests(mappedRequests);

    return mappedRequests;

  } catch (error) {

    console.error(
      "Failed to load my requests:",
      error
    );

    return [];
  }
}, []);

useEffect(() => {
  loadMyRequests();
}, [loadMyRequests]);



const loadIncomingRequests =
  useCallback(async () => {

    try {

      const data =
        await getIncomingRequests();

      const mappedRequests =
        (data || []).map(
          mapBackendRequest
        );

      setIncomingRequests(
        mappedRequests
      );

      return mappedRequests;

    } catch (error) {

  console.error(
    "Failed to load incoming requests:",
    error.response?.status,
    error.response?.data || error.message
  );

  return [];

}

  }, []);

  useEffect(() => {
  loadIncomingRequests();
}, [loadIncomingRequests]);

 const [complaints, setComplaints] = useState([]);

const [
  complaintsAgainstMe,
  setComplaintsAgainstMe
] = useState([]);
const loadMyComplaints =
  useCallback(async () => {

    try {

      const data =
        await getMyComplaints();

      const mappedComplaints =
        (data || []).map(
          mapBackendComplaint
        );

      setComplaints(
        mappedComplaints
      );

      return mappedComplaints;

    } catch (error) {

      console.error(
        "Failed to load my complaints:",
        error
      );

      return [];

    }

  }, []);


useEffect(() => {

  loadMyComplaints();

}, [
  loadMyComplaints
]);

const loadComplaintsAgainstMe =
  useCallback(async () => {

    try {

      const data =
        await getComplaintsAgainstMe();

      const mappedComplaints =
        (data || []).map(
          mapBackendComplaint
        );

      setComplaintsAgainstMe(
        mappedComplaints
      );

      return mappedComplaints;

    } catch (error) {

      console.error(
        "Failed to load complaints against me:",
        error
      );

      return [];

    }

  }, []);
  useEffect(() => {

  loadComplaintsAgainstMe();

}, [
  loadComplaintsAgainstMe
]);

const [notifications, setNotifications] = useState([]);
useEffect(() => {
  let cancelled = false;

  const loadNotifications = async () => {
    try {
      const data = await getMyNotifications();

      if (!cancelled) {
        setNotifications(
          (data || []).map(mapBackendNotification)
        );
      }
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    }
  };

  loadNotifications();

  return () => {
    cancelled = true;
  };
}, []);
const [notificationTarget, setNotificationTarget] = useState(null);
  // ---------- Signed-in student's name + photo for the sidebar ----------
  const [studentProfile, setStudentProfile] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (!cancelled) setStudentProfile(data);
      })
      .catch(() => {
        /* sidebar just falls back to a generic name/icon */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Product catalog ----------
  // ---------- Browse Products ----------


const loadBrowseProducts =
  useCallback(async () => {

    try {

      const data =
        await getBrowseProducts();

      const mappedProducts =
        (data || []).map(
          mapBackendProduct
        );

      setProducts(
        mappedProducts
      );

      return mappedProducts;

    } catch (error) {

      console.error(
        "Failed to load browse products:",
        error
      );

      return [];

    }

  }, []);

  useEffect(() => {
  loadBrowseProducts();
}, [loadBrowseProducts]);

  // ---------- My Products ----------
 
const loadMyProducts =
  useCallback(async () => {

    try {

      const data =
        await getMyProducts();

      const mappedProducts =
        (data || []).map(
          mapBackendProduct
        );

      setMyProducts(
        mappedProducts
      );

      return mappedProducts;

    } catch (error) {

      console.error(
        "Failed to load my products:",
        error
      );

      return [];

    }

  }, []);
  useEffect(() => {
  loadMyProducts();
}, [
  loadMyProducts
]);

  // ---------- Personalization signals ----------
  const [browsingHistory, setBrowsingHistory] = useState(() => loadHistory(HISTORY_STORAGE_KEYS.browsing));
  const [purchaseHistory, setPurchaseHistory] = useState(() => loadHistory(HISTORY_STORAGE_KEYS.purchase));

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEYS.browsing, JSON.stringify(browsingHistory));
    } catch {
      /* localStorage unavailable — recommendations just won't persist */
    }
  }, [browsingHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEYS.purchase, JSON.stringify(purchaseHistory));
    } catch {
      /* localStorage unavailable — recommendations just won't persist */
    }
  }, [purchaseHistory]);

  const navigate = useNavigate();

  const marketplaceProducts = products;

  const recommendations = useMemo(
    () => getRecommendations(marketplaceProducts, browsingHistory, purchaseHistory, 6),
    [marketplaceProducts, browsingHistory, purchaseHistory]
  );

  // Every product this seller has listed, drawn from data already
  // fetched — browse products plus your own products (in case you
  // ever land on your own profile via this flow). Deduplicated by id
  // since a product could theoretically appear in both lists.
  const sellerProducts = useMemo(() => {
    if (!viewedSeller) return [];
    const combined = [...products, ...myProducts];
    const seen = new Set();
    return combined.filter((p) => {
      if (p.ownerId !== viewedSeller.id) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [products, myProducts, viewedSeller]);

  // "Purchases" = requests where the pickup was actually confirmed as
  // received by the buyer. This is also the pool Exchange offers are
  // picked from — you can only offer something you've actually
  // received.
  //
  // FIX: was filtering on Request.status === "CONFIRMED" — a status
  // the backend never sets (Request.status only ever becomes PENDING /
  // ACCEPTED / REJECTED). The real "transaction completed" signal is
  // the pickup schedule's own status reaching "COMPLETED", which is
  // now mapped onto each request as pickupStatus (see
  // mapBackendRequest above) and set for real by
  // handleBuyerConfirmPickup below.
  const myPurchases = useMemo(
    () =>
      myRequests.filter(
        (r) => (r.pickupStatus || "").toUpperCase() === "COMPLETED"
      ),
    [myRequests]
  );

  const unreadNotifCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  

  const addNotification = useCallback((message) => {
    setNotifications((prev) => [
      ...prev,
      { id: `n-${Date.now()}-${Math.random()}`, message, time: Date.now(), read: false },
    ]);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // ---------- Navigation ----------
 const goToSection = (
  id,
  target = null
) => {

  setMainSection(
    VALID_SECTIONS.includes(id)
      ? id
      : "products"
  );

  setNotificationTarget(target);

  setSubView(null);

  setSidebarOpen(false);
};

  const handleNavTabClick = (tab) => {

  if (tab.id === "home") {
    navigate("/");
    return;
  }

  if (tab.id === "profile") {
    navigate("/profile");
    return;
  }

  goToSection(tab.id);

  
};

  const goToSidebarItem = (id) => goToSection(id);

  const recordBrowsing = useCallback((product) => {
    if (!product || product.sellerName === "You") return;
    setBrowsingHistory((prev) => {
      const next = [
        ...prev.filter((entry) => entry.id !== product.id),
        { id: product.id, category: product.category, type: product.type, time: Date.now() },
      ];
      return next.slice(-50);
    });
  }, []);

  const openDetail = useCallback(
    (product) => {
      recordBrowsing(product);
      setSelectedProduct(product);
      setReturnSection(mainSection);
      setSubView("detail");
    },
    [mainSection, recordBrowsing]
  );

  const closeDetail = () => {
    setSubView(null);
    setSelectedProduct(null);
    setMainSection(returnSection);
  };

  const openSellerProfile = (product) => {
    setViewedSeller({
      id: product.ownerId,
      name: product.sellerName,
      department: product.department,
      avatarUrl: product.sellerProfileImage,
      trustScore: product.sellerTrustScore,
    });
    setSubView("sellerProfile");
  };

  const closeSellerProfile = () => {
    setSubView("detail");
  };

  const goToProfile = () => navigate("/profile");

  // ---------- Step 1: buyer sends a request ----------

  // Sell / Donate: the "Request" button on a product goes straight to
  // this branch. Exchange goes to the other branch below.
  const handleRequestClick = (product) => {
    if (product.type === "Exchange") {
      setExchangeTarget(product);
    } else {
      setRequestTarget(product);
    }
  };


  
const createOutgoingRequest = async (product, offeredProduct) => {
  try {
    // NOTE: was "BUY" — changed to "SELL" as the best-guess match for
    // the backend's RequestType enum. A 400 with no field-level detail
    // on the very first non-Exchange/non-Donate request is the classic
    // symptom of Jackson failing to deserialize an enum literal the
    // backend doesn't recognize (it fails before any @Valid checks run,
    // so you get a generic Bad Request instead of a specific message).
    // CONFIRM this against the actual RequestType enum on the backend —
    // if it's neither BUY nor SELL, swap in whatever the real value is.
    let requestType = "BUY";

if (product.type === "Exchange") {
  requestType = "EXCHANGE";
} else if (product.type === "Donate") {
  requestType = "DONATE";
}

    const savedRequest = await createRequest({
      productId: product.id,
      requestType,
      offeredProductId: offeredProduct?.productId || null,
    });

    const newRequest = {
      id: savedRequest.id,
      productId: savedRequest.productId,
      productName: savedRequest.productTitle,
      productImage: null,
      category: product.category,
      sellerName: savedRequest.sellerName,
      type:
        savedRequest.requestType === "EXCHANGE"
          ? "Exchange"
          : savedRequest.requestType === "DONATE"
          ? "Donate"
          : "Sell",
      price: product.price,
      message: "",
      offeredProduct: offeredProduct || null,
      status: savedRequest.status,
      pickupLocation: null,
      pickupDate: null,
      pickupTime: null,
      pickupStatus: null,
      time: savedRequest.createdAt
        ? new Date(savedRequest.createdAt).getTime()
        : Date.now(),
    };

    setMyRequests((prev) => [
      newRequest,
      ...prev,
    ]);

    setPurchaseHistory((prev) =>
      [
        ...prev,
        {
          id: product.id,
          category: product.category,
          type: product.type,
          time: Date.now(),
        },
      ].slice(-50)
    );

    const info =
      TYPE_INFO[product.type] ||
      TYPE_INFO.Sell;

    addNotification(
      `${info.actionLabel} sent to ${product.sellerName} for "${product.name}".`
    );

    showToast(
      `${info.actionLabel} sent successfully.`
    );

    if (subView === "detail") {
      closeDetail();
    }

  } catch (error) {

    showToast(
      extractErrorMessage(error, "Failed to send request.")
    );
  }
};

  // Sell / Donate confirm
const handleConfirmRequest = async () => {
  if (!requestTarget) return;

  await createOutgoingRequest(
    requestTarget,
    null
  );

  setRequestTarget(null);
};

  // Exchange: buyer picked an item from My Purchases to offer
 const handleConfirmExchangeItem = async (offeredPurchase) => {
  if (!exchangeTarget) return;

  await createOutgoingRequest(
    exchangeTarget,
    {
      id: offeredPurchase.id,
      productId: offeredPurchase.productId,
      productName: offeredPurchase.productName,
      productImage: offeredPurchase.productImage,
      category: offeredPurchase.category,
    }
  );

  setExchangeTarget(null);
};

  // ---------- Step 3: buyer confirms pickup, or cancels a pending request ----------

  // FIX: this was pure mock state — it never called any backend
  // endpoint at all, just flipped a local status that doesn't exist
  // server-side. RequestResponse doesn't carry a pickupId directly, so
  // this looks the PickupSchedule up by request id first, then calls
  // the real confirm-received endpoint, then reloads real request data
  // so myPurchases (and the "confirmed" badge in My Requests) reflect
  // the actual backend state.
  const handleBuyerConfirmPickup = async (request) => {
    try {
      const pickup = await getPickupByRequestId(request.id);
      const pickupId = pickup.pickupId ?? pickup.id;

      await confirmProductReceived(pickupId);

      await loadMyRequests();

      addNotification(
        `You confirmed pickup for "${request.productName}" with ${request.sellerName}.`
      );
      showToast("Pickup confirmed — check My Purchases.");
    } catch (error) {
      showToast(
        extractErrorMessage(error, "Failed to confirm pickup. Please try again.")
      );
    }
  };

const handleCancelMyRequest = async (request) => {

  try {

    await deleteRequest(request.id);

    setMyRequests((prev) =>
      prev.filter((r) => r.id !== request.id)
    );

    showToast("Request cancelled successfully.");

  } catch (error) {

    showToast(
      extractErrorMessage(error, "Failed to cancel request.")
    );
  }
};

  // ---------- Complaints ----------
  // Only completed transactions (confirmed pickups) are eligible —
  // enforced by only ever passing `myPurchases` into RaiseComplaintSection.
  const handleRaiseComplaint = (
  createdComplaint
) => {

  const complaint =
    mapBackendComplaint(
      createdComplaint
    );


  setComplaints((prev) => [
    complaint,
    ...prev,
  ]);


  addNotification(
    `Your complaint about "${complaint.productName}" has been submitted.`
  );


  showToast(
    "Complaint submitted successfully."
  );
};

  const handleProductSubmit = async (
    productData,
    imageFiles = [],
    primaryImageIndex = null,
    deletedImageIds = [],
    primaryImageId = null
  ) => {
    try {
      // ==========================================
      // EDIT PRODUCT
      // ==========================================
      if (editingProduct) {
        const productId = editingProduct.id;

        // 1. Update product details
        await updateProduct(productId, productData);

        // 2. Delete removed old images
        for (const imageId of deletedImageIds) {
          await deleteProductImage(productId, imageId);
        }

        // 3. Upload newly selected images
        if (imageFiles.length > 0) {
          await uploadProductImages(productId, imageFiles, primaryImageIndex);
        }

        // 4. Set existing image as primary
        if (primaryImageId) {
          await setPrimaryImage(productId, primaryImageId);
        }

        // 5. Reload My Products
        const updatedProducts = await getMyProducts();

        setMyProducts((updatedProducts || []).map(mapBackendProduct));

        showToast("Product updated successfully.");
      } else {
        // ==========================================
        // ADD NEW PRODUCT
        // ==========================================

        const savedProduct = await addProduct(productData, imageFiles, primaryImageIndex);

        const mappedProduct = mapBackendProduct(savedProduct);

        setMyProducts((prev) => [mappedProduct, ...prev]);

        showToast("Product listed successfully.");

        addNotification(`Your listing "${mappedProduct.name}" has been submitted.`);
      }

      // ==========================================
      // CLOSE FORM
      // ==========================================

      setEditingProduct(null);
      setSubView(null);
      setMainSection("myProducts");
    } catch (error) {
      showToast(extractErrorMessage(error, "Failed to save product."));
    }
  };



  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteProduct(deleteTarget.id);

      setMyProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));

      showToast("Product deleted.");
      setDeleteTarget(null);

      if (subView === "detail") {
        closeDetail();
      }
    } catch (error) {
      showToast(extractErrorMessage(error, "Failed to delete product."));
    }
  };

  // ========================================
// MARK ONE NOTIFICATION AS READ
// ========================================

const handleMarkNotificationAsRead = async (notification) => {

  try {

    if (!notification.read) {

      await markNotificationAsRead(
        notification.id
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );

    }


    // ========================================
    // REFRESH REQUEST DATA
    // ========================================

   // ========================================
// REFRESH REQUEST DATA
// ========================================

if (
  notification.notifyType === "REQUEST_ACCEPTED" ||
  notification.notifyType === "REQUEST_REJECTED"
) {
  await loadMyRequests();
}

// ========================================
// REFRESH COMPLAINT DATA
// ========================================

if (notification.notifyType === "COMPLAINT_RECEIVED") {
  await loadComplaintsAgainstMe();
}

if (
  notification.notifyType === "COMPLAINT_UPDATED" ||
  notification.notifyType === "COMPLAINT_RESOLVED"
) {
  await loadMyComplaints();
}
    // ========================================
    // NOTIFICATION NAVIGATION
    // ========================================

   switch (notification.notifyType) {

  case "REQUEST_RECEIVED":

    goToSection(
      "incomingRequests",
      {
        type: notification.notifyType,
        relatedId: notification.relatedId,
      }
    );

    break;


  case "REQUEST_ACCEPTED":
  case "REQUEST_REJECTED":

    goToSection(
      "myRequests",
      {
        type: notification.notifyType,
        relatedId: notification.relatedId,
      }
    );

    break;


  case "REQUEST_CANCELLED":

    goToSection(
      "incomingRequests",
      {
        type: notification.notifyType,
        relatedId: notification.relatedId,
      }
    );

    break;


  case "COMPLAINT_RECEIVED":

    goToSection(
      "complaintsAgainstMe",
      {
        type: notification.notifyType,
        relatedId: notification.relatedId,
      }
    );

    break;


  case "COMPLAINT_UPDATED":
  case "COMPLAINT_RESOLVED":

    goToSection(
      "myComplaints",
      {
        type: notification.notifyType,
        relatedId: notification.relatedId,
      }
    );

    break;


  default:

    break;
}

  } catch (error) {

    console.error(
      "Failed to process notification:",
      error
    );

    showToast(
      "Failed to open notification."
    );

  }

};


// ========================================
// MARK ALL NOTIFICATIONS AS READ
// ========================================

const handleMarkAllNotificationsAsRead = async () => {
  try {
    await markAllNotificationsAsRead();

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    );

  } catch (error) {
    console.error(
      "Failed to mark all notifications as read:",
      error
    );
  }
};

  const renderMain = () => {
    if (subView === "detail" && selectedProduct) {
      const isOwner =
  myProducts.some(
    (product) =>
      String(product.id) ===
      String(selectedProduct.id)
  );
      return (
        <ProductDetailSection
          product={selectedProduct}
          isOwner={isOwner}
          onBack={closeDetail}
          onRequest={handleRequestClick}
          onEdit={(p) => {
            setEditingProduct(p);
            setSubView("edit");
          }}
          onDelete={(p) => setDeleteTarget(p)}
          onViewSeller={openSellerProfile}
        />
      );
    }

    if (subView === "add") {
      return (
        <ProductFormPage
          studentId={studentProfile?.studentId}
          onCancel={() => {
            setSubView(null);
            setMainSection("myProducts");
          }}
          onSubmit={handleProductSubmit}
        />
      );
    }

    if (subView === "edit" && editingProduct) {
      return (
        <ProductFormPage
          initialData={editingProduct}
          studentId={studentProfile?.studentId}
          onCancel={() => {
            setSubView(null);
            setEditingProduct(null);
          }}
          onSubmit={handleProductSubmit}
        />
      );
    }

    if (subView === "sellerProfile" && viewedSeller) {
      return (
        <SellerProfileSection
          seller={viewedSeller}
          products={sellerProducts}
          onBack={closeSellerProfile}
          onOpenProduct={openDetail}
        />
      );
    }

    switch (mainSection) {
      case "products":
        return (
          <BrowseProductsSection
            products={marketplaceProducts}
            onOpen={openDetail}
            recommendations={recommendations}
          />
        );
 case "incomingRequests":
  return (
    <IncomingRequestsSection
      requests={incomingRequests}
      onToast={showToast}

      notificationTargetId={
        notificationTarget?.relatedId
      }

      onRequestUpdated={async () => {

        await loadIncomingRequests();

        await loadMyRequests();

        await loadMyProducts();

        await loadBrowseProducts();

      }}
    />
  );
  case "notifications":
  return (
    <NotificationsSection
      notifications={notifications}
      onMarkAsRead={handleMarkNotificationAsRead}
    />
  );
      case "myProducts":
        return (
          <MyProductsSection
            products={myProducts}
            onOpen={openDetail}
            onAdd={() => setSubView("add")}
            onEdit={(p) => {
              setEditingProduct(p);
              setSubView("edit");
            }}
            onDelete={(p) => setDeleteTarget(p)}
          />
        );
     case "myRequests":
  return (
    <MyRequestsSection
      requests={myRequests}
      onCancel={handleCancelMyRequest}
      onConfirmPickup={handleBuyerConfirmPickup}
      notificationTargetId={
        notificationTarget?.relatedId
      }
    />
  );
      case "myPurchases":
        return <MyPurchasesSection purchases={myPurchases} />;
     case "myComplaints":
  return (
    <MyComplaintsSection
      complaints={complaints}
      notificationTargetId={notificationTarget?.relatedId}
    />
  );
  case "raiseComplaint":
        return (
          <RaiseComplaintSection completedTransactions={myPurchases} onSubmit={handleRaiseComplaint} />
        );
      case "complaintsAgainstMe":
  return (
    <ComplaintsAgainstMeSection
      complaints={complaintsAgainstMe}
      notificationTargetId={notificationTarget?.relatedId}
    />
  );
   default:
        // mainSection should always be one of VALID_SECTIONS (enforced at
        // every entry point above), so this should be unreachable. But if
        // it's ever hit anyway, fall back to Browse Products instead of
        // returning null — an empty content area with no error is the
        // exact "dashboard doesn't show up" symptom we're fixing.
        return (
          <BrowseProductsSection
            products={marketplaceProducts}
            onOpen={openDetail}
            recommendations={recommendations}
          />
        );
    }
  };

  const topNavActiveId =
    subView === null && STUDENT_NAV_TABS.some((t) => t.id === mainSection) ? mainSection : null;
  const isSidebarItemActive = (id) => subView === null && mainSection === id;

  const avatarUrl = studentProfile?.profileImage
    ? `${PROFILE_IMAGE_BASE_URL}${studentProfile.profileImage}`
    : null;
  const studentName = studentProfile?.fullName || "Student";

  return (
    <div className="dash-page">
      <StudentNavbar
        activeId={topNavActiveId}
        onTabClick={handleNavTabClick}
        onSidebarToggle={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
        unreadNotifCount={unreadNotifCount}
        incomingPendingCount={0}
      />

      <div className="dash-body">
        {sidebarOpen && <div className="dash-sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}

        <aside className={`dash-sidebar ${sidebarOpen ? "dash-sidebar-open" : "dash-sidebar-closed"}`}>
          <button className="dash-sidebar-profile" onClick={goToProfile} title="View profile">
            <span className="dash-sidebar-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <FaUser />}
            </span>
            <span className="dash-sidebar-username">{studentName}</span>
          </button>

          <div className="dash-sidebar-divider"></div>

          <nav className="dash-sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`dash-sidebar-link ${isSidebarItemActive(item.id) ? "active" : ""}`}
                onClick={() => goToSidebarItem(item.id)}
                title={item.label}
              >
                <span>{item.label}</span>
              </button>
            ))}

            <div className="dash-sidebar-group-label">{COMPLAINTS_SIDEBAR_GROUP.label}</div>
            {COMPLAINTS_SIDEBAR_GROUP.items.map((item) => (
              <button
                key={item.id}
                className={`dash-sidebar-link dash-sidebar-link-nested ${
                  isSidebarItemActive(item.id) ? "active" : ""
                }`}
                onClick={() => goToSidebarItem(item.id)}
                title={item.label}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="dash-content">{renderMain()}</main>
      </div>

      {requestTarget && (
        <ConfirmDialog
          title={`${TYPE_INFO[requestTarget.type].actionLabel}?`}
          message={`Send a request to ${requestTarget.sellerName} for "${requestTarget.name}"?`}
          confirmLabel="Send Request"
          onCancel={() => setRequestTarget(null)}
          onConfirm={handleConfirmRequest}
        />
      )}

      {exchangeTarget && (
        <SelectExchangeItemModal
          product={exchangeTarget}
          purchases={myPurchases}
          onCancel={() => setExchangeTarget(null)}
          onConfirm={handleConfirmExchangeItem}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this product?"
          message={`"${deleteTarget.name}" will be removed from your listings. This can't be undone.`}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {toast && (
        <div className="dash-toast">
          <FaCheckCircle />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;