"use client";

import { useEffect, useState, use } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  images: string[];
  size_details?: string;
}

interface WaitingListEntry {
  id: number;
  product_id: string;
  pincode: string;
  created_at: string;
  product: Product;
}

interface PastOrder {
  id: number;
  order_no: string;
  product_id: string;
  quantity: number;
  pincode: string;
  status: string;
  created_at: string;
  product: Product;
}

interface Review {
  id: number;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PageProps {
  params: Promise<{ id: string }>;
}

function StarRating({ rating, interactive = false, onRate }: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`text-[18px] transition-colors ${
            interactive ? "cursor-pointer" : "cursor-default"
          } ${star <= (hovered || rating) ? "text-amber-400" : "text-primary/20"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id: productId } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Auth/Orders
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [token, setToken] = useState("");

  // UI
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Waitlist modal
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistPincode, setWaitlistPincode] = useState("");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [waitlistError, setWaitlistError] = useState("");

  // Order Now modal
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [orderEmail, setOrderEmail] = useState("");
  const [orderPincode, setOrderPincode] = useState("");
  const [orderQty, setOrderQty] = useState(1);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderError, setOrderError] = useState("");

  // OTP Auth
  const [authEmail, setAuthEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    const storedToken = localStorage.getItem("auth_token");
    const storedEmail = localStorage.getItem("auth_email");
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUserEmail(storedEmail);
      setIsAuthenticated(true);
      fetchOrders(storedToken);
    }
  }, [productId]);

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      setWaitlistEmail(userEmail);
      setOrderEmail(userEmail);
    }
  }, [isAuthenticated, userEmail]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
      if (res.ok) setProduct(await res.json());
    } catch (err) {
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const fetchOrders = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWaitingList(data.waiting_list || []);
        setPastOrders(data.past_orders || []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError("");
    setWaitlistMessage("");
    if (!waitlistEmail.trim()) return setWaitlistError("Email is required.");
    if (!waitlistPincode.trim() || waitlistPincode.trim().length < 6)
      return setWaitlistError("Please enter a valid 6-digit pincode.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/waitinglist/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: waitlistEmail,
          product_id: productId,
          pincode: waitlistPincode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistMessage(data.message || "Successfully joined!");
        setTimeout(() => setIsWaitlistOpen(false), 3000);
        if (token) fetchOrders(token);
      } else {
        setWaitlistError(data.error || "An error occurred.");
      }
    } catch {
      setWaitlistError("Failed to connect to server.");
    }
  };

  const handleOrderNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    setOrderMessage("");
    if (!orderEmail.trim()) return setOrderError("Email is required.");
    if (!orderPincode.trim() || orderPincode.trim().length < 6)
      return setOrderError("Please enter a valid 6-digit pincode.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: orderEmail,
          product_id: productId,
          pincode: orderPincode,
          quantity: orderQty,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderMessage(data.message || "Order placed!");
        setTimeout(() => setIsOrderOpen(false), 4000);
        if (token) fetchOrders(token);
      } else {
        setOrderError(data.error || "An error occurred.");
      }
    } catch {
      setOrderError("Failed to connect to server.");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");
    if (!reviewName.trim()) return setReviewError("Name is required.");
    if (reviewRating < 1) return setReviewError("Please select a star rating.");
    if (!reviewComment.trim()) return setReviewError("Comment is required.");

    setReviewSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer_name: reviewName,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccess("Thank you for your review!");
        setReviewName("");
        setReviewRating(0);
        setReviewComment("");
        setShowReviewForm(false);
        fetchReviews();
      } else {
        setReviewError(data.error || "Failed to submit review.");
      }
    } catch {
      setReviewError("Failed to connect to server.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    if (!authEmail.trim()) return setAuthError("Email is required.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep("code");
        setAuthMessage(data.message || "OTP sent — check your email.");
      } else {
        setAuthError(data.error || "Failed to request OTP.");
      }
    } catch {
      setAuthError("Failed to connect to server.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!otpCode.trim()) return setAuthError("OTP Code is required.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_email", data.email);
        setToken(data.token);
        setUserEmail(data.email);
        setIsAuthenticated(true);
        setAuthEmail("");
        setOtpCode("");
        setOtpStep("email");
        fetchOrders(data.token);
      } else {
        setAuthError(data.error || "Invalid OTP code.");
      }
    } catch {
      setAuthError("Failed to verify OTP.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");
    setToken("");
    setUserEmail("");
    setIsAuthenticated(false);
    setWaitingList([]);
    setPastOrders([]);
    setOtpStep("email");
  };

  const avgRating =
    reviews.length > 0
      ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
      : 0;

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center font-body">
        <p className="font-label-caps text-label-caps animate-pulse uppercase tracking-[0.2em] text-[12px]">
          Loading Product Details...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center font-body p-6 text-center">
        <h2 className="font-display text-[26px] uppercase text-primary mb-4">Product Not Found</h2>
        <p className="font-body text-on-surface-variant max-w-md mb-8">
          The product you are looking for does not exist or has been removed.
        </p>
        <a
          href="/"
          className="border border-primary px-6 py-3 font-label-caps text-[11px] uppercase tracking-[0.15em] hover:bg-primary/5 transition-colors"
        >
          Return to Catalog
        </a>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body">
      {/* Header */}
      <header className="w-full fixed top-0 z-50 bg-surface/90 backdrop-blur-sm">
        <div className="hairline-solid"></div>
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
          <a href="/" className="font-display text-[18px] md:text-[20px] uppercase tracking-[0.12em] text-primary hover:opacity-80 transition-opacity">
            absoluThings
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <a href="/custom" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Custom
            </a>
            <a href="https://www.instagram.com/theabsoluthings/" target="_blank" rel="noopener noreferrer" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Instagram
            </a>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 border border-primary/25 hover:border-primary/60 transition-all duration-300 rounded-sm flex items-center justify-center group"
              aria-label="View Orders"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary group-hover:scale-105 transition-transform duration-300">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {(waitingList.length + pastOrders.length) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-on-primary font-display text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                  {waitingList.length + pastOrders.length}
                </span>
              )}
            </button>
          </nav>
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 border border-primary/25 hover:border-primary/60 transition-all duration-300 rounded-sm flex items-center justify-center group"
              aria-label="View Orders"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {(waitingList.length + pastOrders.length) > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-on-primary font-display text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-sm">
                  {waitingList.length + pastOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary hover:text-on-surface-variant focus:outline-none p-1 text-[24px]"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden w-full bg-surface border-b border-primary/10 animate-fade-in">
            <div className="flex flex-col px-margin-mobile py-6 gap-4">
              <a href="/" className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
              <a href="/custom" className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5" onClick={() => setIsMobileMenuOpen(false)}>Custom Printing</a>
              <a href="https://www.instagram.com/theabsoluthings/" target="_blank" rel="noopener noreferrer" className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5" onClick={() => setIsMobileMenuOpen(false)}>Instagram</a>
            </div>
          </div>
        )}
        <div className="hairline-solid"></div>
      </header>

      {/* Main */}
      <main className="flex-grow pt-28 pb-16">
        <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 pt-8">
            {/* Gallery */}
            <div className="w-full lg:w-7/12 flex flex-col gap-4">
              <div className="relative w-full aspect-4/3 bg-surface-variant border border-primary/5 rounded-sm overflow-hidden shadow-sm">
                <img
                  src={product.images[activeImageIndex] || product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-500"
                />
                <div className="absolute top-4 left-4 bg-primary text-on-primary font-label-caps text-[9px] px-2.5 py-1 tracking-[0.1em] uppercase">
                  {product.id}
                </div>
                {product.is_available ? (
                  <div className="absolute top-4 right-4 bg-green-600 text-white font-label-caps text-[9px] px-2.5 py-1 tracking-[0.1em] uppercase">
                    In Stock
                  </div>
                ) : (
                  <div className="absolute top-4 right-4 bg-amber-500 text-white font-label-caps text-[9px] px-2.5 py-1 tracking-[0.1em] uppercase">
                    Waitlist
                  </div>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`aspect-square bg-surface-variant border overflow-hidden rounded-sm transition-all duration-300 ${
                        idx === activeImageIndex
                          ? "border-primary scale-[1.03] shadow-sm"
                          : "border-primary/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="w-full lg:w-5/12 flex flex-col py-2">
              <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-[0.15em] mb-3 uppercase">
                Series / {product.id}
              </p>
              <h1 className="font-display text-[28px] md:text-[38px] text-primary uppercase tracking-wide leading-tight mb-3">
                {product.name}
              </h1>
              <p className="font-display text-[20px] text-primary font-medium mb-2">
                ₹{product.price}
              </p>

              {/* Avg rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={avgRating} />
                  <span className="font-body text-[12px] text-on-surface-variant">
                    {avgRating}/5 ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

              <div className="hairline w-16 mb-6"></div>
              <p className="font-body text-[14px] text-on-surface-variant leading-relaxed mb-4">
                {product.description}
              </p>
              {product.size_details && (
                <div className="flex flex-col gap-1 mb-8">
                  <span className="font-label-caps text-[10px] text-on-tertiary-container tracking-wider uppercase">Dimensions</span>
                  <span className="font-body text-[13px] text-primary">{product.size_details}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 mt-auto">
                {product.is_available ? (
                  <button
                    onClick={() => { setIsOrderOpen(true); setOrderError(""); setOrderMessage(""); }}
                    className="w-full bg-primary text-on-primary text-[11px] tracking-[0.18em] uppercase py-4 font-label-caps hover:bg-on-surface-variant transition-colors animate-fade-in"
                  >
                    Order Now
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsWaitlistOpen(true); setWaitlistError(""); setWaitlistMessage(""); }}
                    className="w-full bg-primary text-on-primary text-[11px] tracking-[0.18em] uppercase py-4 font-label-caps hover:bg-on-surface-variant transition-colors animate-fade-in"
                  >
                    Join Waiting List
                  </button>
                )}
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="w-full border border-primary/30 text-primary text-[11px] tracking-[0.18em] uppercase py-3.5 font-label-caps hover:bg-primary/5 transition-colors"
                >
                  {showReviewForm ? "Cancel Review" : "Write a Review"}
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-20">
            <div className="hairline-solid mb-10"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-[0.15em] uppercase mb-1">Customer Feedback</p>
                <h2 className="font-display text-[22px] uppercase text-primary">
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </h2>
              </div>
              {reviews.length > 0 && (
                <div className="flex items-center gap-3 bg-surface-variant/50 px-5 py-3 rounded-sm border border-primary/5">
                  <StarRating rating={avgRating} />
                  <span className="font-body text-[13px] text-primary font-medium">{avgRating}.0 / 5</span>
                </div>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="bg-surface-variant/30 border border-primary/10 rounded-sm p-6 mb-8 animate-fade-in flex flex-col gap-4">
                <p className="font-label-caps text-[11px] text-on-tertiary-container tracking-wider uppercase">Share Your Experience</p>
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Your Name</label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. Rahul S."
                    className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-2 block">Rating</label>
                  <StarRating rating={reviewRating} interactive onRate={setReviewRating} />
                </div>
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Your Review</label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What did you think of this product?"
                    className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm resize-none"
                  />
                </div>
                {reviewError && <p className="text-red-600 font-body text-[12px]">{reviewError}</p>}
                {reviewSuccess && <p className="text-green-600 font-body text-[12px]">{reviewSuccess}</p>}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="bg-primary text-on-primary font-label-caps text-[11px] py-3.5 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors disabled:opacity-60"
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

            {reviewSuccess && !showReviewForm && (
              <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-6 animate-fade-in">
                <p className="text-green-700 font-body text-[13px]">✓ {reviewSuccess}</p>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-16 border border-primary/5 rounded-sm bg-surface-variant/20">
                <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">No Reviews Yet</p>
                <p className="font-body text-[13px] text-on-surface-variant mt-2">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-primary/8 rounded-sm p-5 bg-surface hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-display text-[14px] uppercase text-primary tracking-wide">{review.reviewer_name}</p>
                        <p className="font-body text-[11px] text-on-surface-variant mt-0.5">
                          {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="font-body text-[13px] text-on-surface-variant leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Join Waiting List */}
      {isWaitlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md p-8 rounded-sm border border-primary/15 shadow-xl relative animate-fade-in">
            <button onClick={() => setIsWaitlistOpen(false)} className="absolute top-4 right-4 text-[20px] text-on-surface-variant hover:text-primary">&times;</button>
            <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-widest uppercase mb-2">Join Waiting List</p>
            <h3 className="font-display text-[22px] text-primary mb-6 uppercase">{product.name}</h3>
            <form onSubmit={handleJoinWaitlist} className="flex flex-col gap-4">
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm"
                />
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Pincode</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={waitlistPincode}
                  onChange={(e) => setWaitlistPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit pincode"
                  className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm tracking-widest"
                />
              </div>
              {waitlistError && <p className="text-red-600 font-body text-[12px]">{waitlistError}</p>}
              {waitlistMessage && <p className="text-green-600 font-body text-[12px]">{waitlistMessage}</p>}
              <button type="submit" className="bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors mt-2">
                Confirm Registration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Order Now */}
      {isOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md p-8 rounded-sm border border-primary/15 shadow-xl relative animate-fade-in">
            <button onClick={() => setIsOrderOpen(false)} className="absolute top-4 right-4 text-[20px] text-on-surface-variant hover:text-primary">&times;</button>
            <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-widest uppercase mb-2">Place Order</p>
            <h3 className="font-display text-[22px] text-primary mb-1 uppercase">{product.name}</h3>
            <p className="font-body text-[13px] text-on-surface-variant mb-6">₹{product.price} per unit</p>
            <form onSubmit={handleOrderNow} className="flex flex-col gap-4">
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  required
                  value={orderEmail}
                  onChange={(e) => setOrderEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm"
                />
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Delivery Pincode</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={orderPincode}
                  onChange={(e) => setOrderPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit pincode"
                  className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm tracking-widest"
                />
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setOrderQty((q) => Math.max(1, q - 1))} className="w-10 h-10 border border-primary/20 font-display text-[18px] hover:bg-primary/5 transition-colors rounded-sm">−</button>
                  <span className="font-display text-[18px] text-primary w-8 text-center">{orderQty}</span>
                  <button type="button" onClick={() => setOrderQty((q) => q + 1)} className="w-10 h-10 border border-primary/20 font-display text-[18px] hover:bg-primary/5 transition-colors rounded-sm">+</button>
                  <span className="font-body text-[13px] text-on-surface-variant ml-2">= ₹{product.price * orderQty}</span>
                </div>
              </div>
              {orderError && <p className="text-red-600 font-body text-[12px]">{orderError}</p>}
              {orderMessage && <p className="text-green-600 font-body text-[13px] font-medium">{orderMessage}</p>}
              <button type="submit" className="bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors mt-2">
                Confirm Order — ₹{product.price * orderQty}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Orders Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-sm">
          <div className="flex-grow" onClick={() => setIsCartOpen(false)}></div>
          <div className="w-full max-w-md bg-surface h-full flex flex-col border-l border-primary/10 shadow-2xl relative animate-slide-in">
            <header className="px-8 py-6 border-b border-primary/5 flex justify-between items-center">
              <h2 className="font-display text-[20px] uppercase text-primary tracking-wide">Your Orders</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-[24px] text-on-surface-variant hover:text-primary">&times;</button>
            </header>
            <div className="flex-grow overflow-y-auto p-8">
              {!isAuthenticated ? (
                <div className="flex flex-col gap-6 py-4">
                  <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">
                    Authenticate with your email OTP to view your orders & waiting list entries.
                  </p>
                  {otpStep === "email" ? (
                    <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                      <div>
                        <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Email Address</label>
                        <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@example.com" className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm" />
                      </div>
                      {authError && <p className="text-red-600 font-body text-[12px]">{authError}</p>}
                      <button type="submit" className="w-full bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors">Send Verification Code</button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                      <p className="font-body text-[13px] text-green-600 font-medium">{authMessage}</p>
                      <div>
                        <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">Enter 6-Digit Code</label>
                        <input type="text" required maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm tracking-[0.5em] text-center font-bold" />
                      </div>
                      {authError && <p className="text-red-600 font-body text-[12px]">{authError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setOtpStep("email")} className="w-1/3 border border-primary/20 text-[10px] uppercase font-label-caps py-4 tracking-[0.1em] hover:bg-primary/5 transition-colors">Back</button>
                        <button type="submit" className="w-2/3 bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors">Verify Code</button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-center pb-4 border-b border-primary/5">
                    <p className="font-body text-[12px] text-on-surface-variant">Logged in as: <strong className="text-primary">{userEmail}</strong></p>
                    <button onClick={handleLogout} className="font-label-caps text-[10px] tracking-wider uppercase text-red-600 hover:text-red-800 transition-colors">Logout</button>
                  </div>

                  {/* Confirmed Orders */}
                  <div>
                    <h3 className="font-label-caps text-[11px] uppercase tracking-wider text-on-tertiary-container mb-4 pb-2 border-b border-primary/5">
                      Confirmed Orders ({pastOrders.filter((order) => order.status !== "Delivered").length})
                    </h3>
                    {pastOrders.filter((order) => order.status !== "Delivered").length === 0 ? (
                      <p className="font-body text-[13px] text-on-surface-variant italic py-2">No active orders.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {pastOrders.filter((order) => order.status !== "Delivered").map((order) => (
                          <div key={order.id} className="flex gap-4 items-start bg-surface border border-primary/5 p-3 rounded-sm hover:border-primary/15 transition-colors">
                            <img src={order.product?.image_url} alt={order.product?.name} className="w-12 h-12 object-cover bg-surface-variant rounded-sm flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                              <h4 className="font-display text-[13px] uppercase text-primary tracking-wide truncate">{order.product?.name}</h4>
                              <p className="font-label-caps text-[9px] text-amber-600 tracking-wider mt-0.5">{order.order_no}</p>
                              <p className="font-body text-[11px] text-on-surface-variant mt-1">
                                Qty: {order.quantity} · ₹{order.product ? order.product.price * order.quantity : 0}
                              </p>
                              <p className="font-body text-[10px] text-on-surface-variant">
                                Status: <strong className="text-green-600">{order.status}</strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Orders */}
                  <div>
                    <h3 className="font-label-caps text-[11px] uppercase tracking-wider text-on-tertiary-container mb-4 pb-2 border-b border-primary/5">
                      Past Orders ({pastOrders.filter((order) => order.status === "Delivered").length})
                    </h3>
                    {pastOrders.filter((order) => order.status === "Delivered").length === 0 ? (
                      <p className="font-body text-[13px] text-on-surface-variant italic py-2">No past orders found.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {pastOrders.filter((order) => order.status === "Delivered").map((order) => (
                          <div key={order.id} className="flex gap-4 items-start bg-surface border border-primary/5 p-3 rounded-sm hover:border-primary/15 transition-colors">
                            <img src={order.product?.image_url} alt={order.product?.name} className="w-12 h-12 object-cover bg-surface-variant rounded-sm flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                              <h4 className="font-display text-[13px] uppercase text-primary tracking-wide truncate">{order.product?.name}</h4>
                              <p className="font-label-caps text-[9px] text-amber-600 tracking-wider mt-0.5">{order.order_no}</p>
                              <p className="font-body text-[11px] text-on-surface-variant mt-1">
                                Qty: {order.quantity} · ₹{order.product ? order.product.price * order.quantity : 0}
                              </p>
                              <p className="font-body text-[10px] text-on-surface-variant">
                                Status: <strong className="text-green-600">{order.status}</strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Waiting List */}
                  <div>
                    <h3 className="font-label-caps text-[11px] uppercase tracking-wider text-on-tertiary-container mb-4 pb-2 border-b border-primary/5">
                      Waiting List ({waitingList.length})
                    </h3>
                    {waitingList.length === 0 ? (
                      <p className="font-body text-[13px] text-on-surface-variant italic py-2">Not on any waiting lists.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {waitingList.map((entry) => (
                          <div key={entry.id} className="flex gap-4 items-center bg-surface border border-primary/5 p-3 rounded-sm hover:border-primary/15 transition-colors">
                            <img src={entry.product?.image_url} alt={entry.product?.name} className="w-12 h-12 object-cover bg-surface-variant rounded-sm flex-shrink-0" />
                            <div className="flex-grow">
                              <h4 className="font-display text-[13px] uppercase text-primary tracking-wide">{entry.product?.name}</h4>
                              <p className="font-body text-[11px] text-on-surface-variant mt-1">
                                Status: <span className="text-amber-500 font-medium">Waitlist Active</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto">
        <div className="hairline-solid"></div>
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-10 max-w-container-max mx-auto gap-6">
          <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-[0.2em]">© 2026 Absoluthings. All rights reserved.</p>
          <a className="hidden md:inline-block font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors duration-300 tracking-[0.2em]" href="https://www.instagram.com/theabsoluthings/" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </div>
      </footer>
    </div>
  );
}
