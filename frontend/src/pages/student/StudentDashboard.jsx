import { useState, useEffect, useMemo, useCallback } from "react";
import "./StudentDashboard.css";
import { useNavigate, useLocation } from "react-router-dom";
import StudentNavbar, { STUDENT_NAV_TABS } from "./StudentNavbar";
import { getProfile } from "../../services/profileService";
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
import { FaUser, FaCheckCircle } from "react-icons/fa";

import {
  SIDEBAR_ITEMS,
  COMPLAINTS_SIDEBAR_GROUP,
  PROFILE_IMAGE_BASE_URL,
  HISTORY_STORAGE_KEYS,
  SAMPLE_INCOMING_REQUESTS,
  SAMPLE_COMPLAINTS_AGAINST_ME,
  TYPE_INFO,
  REQUEST_STATUS,
  COMPLAINT_STATUS,
} from "./constants";
import { loadHistory, getRecommendations, mapBackendProduct } from "./utils/dashboardUtils";

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
            + time in the same step               -> AWAITING_CONFIRMATION
          - Reject                                  -> REJECTED
     3. Buyer reviews the proposed pickup details,
        in My Requests, and confirms                -> CONFIRMED
        (this is what shows up in My Purchases)

   There's no backend endpoint for requests yet, so this all
   runs on local state — same pattern as the rest of this mock
   dashboard. Swap the four handlers below (send / accept /
   reject / confirm) for real API calls when the backend is
   ready; the UI already expects exactly this shape.
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

function StudentDashboard() {
  const location = useLocation();

  const [mainSection, setMainSection] = useState(() => {
    const requested = location.state?.section;
    return VALID_SECTIONS.includes(requested) ? requested : "products";
  });
  const [subView, setSubView] = useState(null); // null | "detail" | "add" | "edit"
  const [selectedProduct, setSelectedProduct] = useState(null);
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
  const [incomingRequests, setIncomingRequests] = useState(SAMPLE_INCOMING_REQUESTS);
  const [complaints, setComplaints] = useState([]); // complaints YOU raised
  const [complaintsAgainstMe] = useState(SAMPLE_COMPLAINTS_AGAINST_ME); // complaints raised on you
  const [notifications, setNotifications] = useState(() => [
    {
      id: "n-seed-1",
      message: "Ishaan Verma requested your Graphing Calculator (TI-84 Plus).",
      time: Date.now() - 1000 * 60 * 60 * 3,
      read: false,
    },
    {
      id: "n-seed-2",
      message: "Fatima Sheikh requested to donate-adopt your Hostel Study Chair.",
      time: Date.now() - 1000 * 60 * 60 * 26,
      read: false,
    },
  ]);

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
useEffect(() => {
  let cancelled = false;

  getBrowseProducts()
    .then((data) => {
      if (cancelled) return;

      setProducts((data || []).map(mapBackendProduct));
    })
    .catch((error) => {
      console.error("Failed to load browse products:", error);
    });

  return () => {
    cancelled = true;
  };
}, []);

// ---------- My Products ----------
useEffect(() => {
  let cancelled = false;

  getMyProducts()
    .then((data) => {
      if (cancelled) return;

      setMyProducts((data || []).map(mapBackendProduct));
    })
    .catch((error) => {
      console.error("Failed to load my products:", error);
    });

  return () => {
    cancelled = true;
  };
}, []);

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

  // "Purchases" = requests you sent where the seller accepted AND you
  // confirmed the pickup. This is also the pool Exchange offers are
  // picked from — you can only offer something you've actually received.
  const myPurchases = useMemo(
    () => myRequests.filter((r) => r.status === REQUEST_STATUS.CONFIRMED),
    [myRequests]
  );

  const unreadNotifCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const incomingPendingCount = useMemo(
    () => incomingRequests.filter((r) => r.status === REQUEST_STATUS.PENDING).length,
    [incomingRequests]
  );

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
  const goToSection = (id) => {
    // Guard here too: any caller of goToSection/goToSidebarItem with a
    // bad id falls back to "products" instead of blanking the page.
    setMainSection(VALID_SECTIONS.includes(id) ? id : "products");
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

    if (tab.id === "notifications") {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
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

  const createOutgoingRequest = (product, offeredProduct) => {
    setPurchaseHistory((prev) =>
      [
        ...prev,
        { id: product.id, category: product.category, type: product.type, time: Date.now() },
      ].slice(-50)
    );

    setMyRequests((prev) => [
      ...prev,
      {
        id: `req-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[product.primaryIndex ?? 0]?.url || null,
        category: product.category,
        sellerName: product.sellerName,
        type: product.type,
        price: product.price,
        message: "",
        offeredProduct: offeredProduct || null,
        status: REQUEST_STATUS.PENDING,
        pickupLocation: null,
        pickupTime: null,
        time: Date.now(),
      },
    ]);

    const info = TYPE_INFO[product.type];
    addNotification(`${info.actionLabel} sent to ${product.sellerName} for "${product.name}".`);
    showToast(`${info.actionLabel} sent to ${product.sellerName}.`);

    if (subView === "detail") closeDetail();
  };

  // Sell / Donate confirm
  const handleConfirmRequest = () => {
    createOutgoingRequest(requestTarget, null);
    setRequestTarget(null);
  };

  // Exchange: buyer picked an item from My Purchases to offer
  const handleConfirmExchangeItem = (offeredPurchase) => {
    createOutgoingRequest(exchangeTarget, {
      id: offeredPurchase.id,
      productId: offeredPurchase.productId,
      productName: offeredPurchase.productName,
      productImage: offeredPurchase.productImage,
      category: offeredPurchase.category,
    });
    setExchangeTarget(null);
  };

  // ---------- Step 2: seller accepts (with pickup details) or rejects ----------
  // NOTE: incomingRequests is seeded from sample data in this mock —
  // in a real backend, a request sent via createOutgoingRequest() above
  // would show up here on the seller's side via the same request id.
  const handleSellerAccept = (request, { location, time }) => {
    setIncomingRequests((prev) =>
      prev.map((r) =>
        r.id === request.id
          ? { ...r, status: REQUEST_STATUS.AWAITING_CONFIRMATION, pickupLocation: location, pickupTime: time }
          : r
      )
    );
    addNotification(
      `You accepted ${request.requesterName}'s request for "${request.productName}" and sent pickup details.`
    );
    showToast(`Pickup details sent to ${request.requesterName}.`);
  };

  const handleSellerReject = (request) => {
    setIncomingRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: REQUEST_STATUS.REJECTED } : r))
    );
    addNotification(`You declined ${request.requesterName}'s request for "${request.productName}".`);
    showToast(`Declined ${request.requesterName}'s request.`);
  };

  // ---------- Step 3: buyer confirms pickup, or cancels a pending request ----------
  const handleBuyerConfirmPickup = (request) => {
    setMyRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: REQUEST_STATUS.CONFIRMED } : r))
    );
    addNotification(`You confirmed pickup for "${request.productName}" with ${request.sellerName}.`);
    showToast("Pickup confirmed — check My Purchases.");
  };

  const handleCancelMyRequest = (request) => {
    setMyRequests((prev) => prev.filter((r) => r.id !== request.id));
    showToast(`Cancelled your request for "${request.productName}".`);
  };

  // ---------- Complaints ----------
  // Only completed transactions (confirmed pickups) are eligible —
  // enforced by only ever passing `myPurchases` into RaiseComplaintSection.
  const handleRaiseComplaint = (payload) => {
    setComplaints((prev) => [
      ...prev,
      {
        id: `cmp-${Date.now()}`,
        productId: payload.productId,
        productName: payload.productName,
        productImage: payload.productImage,
        requestId: payload.requestId,
        complaintType: payload.complaintType,
        description: payload.description,
        status: COMPLAINT_STATUS.PENDING,
        createdAt: Date.now(),
        resolvedAt: null,
      },
    ]);
    addNotification(`Your complaint about "${payload.productName}" has been submitted.`);
    showToast("Complaint submitted.");
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
      await updateProduct(
        productId,
        productData
      );

      // 2. Delete removed old images
      for (const imageId of deletedImageIds) {
        await deleteProductImage(
          productId,
          imageId
        );
      }

      // 3. Upload newly selected images
      if (imageFiles.length > 0) {
  await uploadProductImages(
    productId,
    imageFiles,
     primaryImageIndex
  );
}

      // 4. Set existing image as primary
      if (primaryImageId) {
        await setPrimaryImage(
          productId,
          primaryImageId
        );
      }

      // 5. Reload My Products
      const updatedProducts =
        await getMyProducts();

      setMyProducts(
        (updatedProducts || []).map(
          mapBackendProduct
        )
      );

      showToast("Product updated successfully.");

    } else {
      // ==========================================
      // ADD NEW PRODUCT
      // ==========================================

      const savedProduct = await addProduct(
        productData,
        imageFiles,
        primaryImageIndex
      );

      const mappedProduct =
        mapBackendProduct(savedProduct);

      setMyProducts((prev) => [
        mappedProduct,
        ...prev,
      ]);

      showToast("Product listed successfully.");

      addNotification(
        `Your listing "${mappedProduct.name}" has been submitted.`
      );
    }

    // ==========================================
    // CLOSE FORM
    // ==========================================

    setEditingProduct(null);
    setSubView(null);
    setMainSection("myProducts");

  } catch (error) {
    console.error(
      "Product save failed:",
      error
    );

    showToast(
      error.response?.data?.message ||
      "Failed to save product."
    );
  }
};

  const handleConfirmDelete = async () => {
  if (!deleteTarget) {
    return;
  }

  try {
    await deleteProduct(
      deleteTarget.id
    );

    setMyProducts((prev) =>
      prev.filter(
        (p) => p.id !== deleteTarget.id
      )
    );

    showToast("Product deleted.");
    setDeleteTarget(null);

    if (subView === "detail") {
      closeDetail();
    }

  } catch (error) {
    console.error(
      "Failed to delete product:",
      error
    );

    showToast(
      error.response?.data?.message ||
      "Failed to delete product."
    );
  }
};

  const renderMain = () => {
    if (subView === "detail" && selectedProduct) {
      const isOwner = selectedProduct.sellerName === "You";
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
            onAccept={handleSellerAccept}
            onReject={handleSellerReject}
          />
        );
      case "notifications":
        return <NotificationsSection notifications={notifications} />;
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
          />
        );
      case "myPurchases":
        return <MyPurchasesSection purchases={myPurchases} />;
      case "myComplaints":
        return <MyComplaintsSection complaints={complaints} />;
      case "raiseComplaint":
        return (
          <RaiseComplaintSection
            completedTransactions={myPurchases}
            onSubmit={handleRaiseComplaint}
          />
        );
      case "complaintsAgainstMe":
        return <ComplaintsAgainstMeSection complaints={complaintsAgainstMe} />;
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
        incomingPendingCount={incomingPendingCount}
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