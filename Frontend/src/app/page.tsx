"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  image_url: string;
}

interface WaitingListEntry {
  id: number;
  product_id: string;
  created_at: string;
  product: Product;
}

interface PastOrder {
  id: number;
  product_id: string;
  quantity: number;
  status: string;
  created_at: string;
  product: Product;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [token, setToken] = useState("");

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [waitlistProductId, setWaitlistProductId] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [waitlistError, setWaitlistError] = useState("");

  // OTP Auth state
  const [authEmail, setAuthEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // Hero Image Scroller state
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  // Auto-scroll hero images
  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [products]);

  // Load products and local session
  useEffect(() => {
    fetchProducts();
    const storedToken = localStorage.getItem("auth_token");
    const storedEmail = localStorage.getItem("auth_email");
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUserEmail(storedEmail);
      setIsAuthenticated(true);
      fetchOrders(storedToken);
    }
  }, []);

  // Set waitlistEmail automatically if authenticated
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      setWaitlistEmail(userEmail);
    }
  }, [isAuthenticated, userEmail]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
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

    if (!waitlistEmail.trim() || !waitlistProductId) {
      setWaitlistError("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/waitinglist/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: waitlistEmail,
          product_id: waitlistProductId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setWaitlistMessage(data.message || "Successfully joined!");
        if (isAuthenticated && userEmail) {
          setWaitlistEmail(userEmail);
        } else {
          setWaitlistEmail("");
        }
        setTimeout(() => setWaitlistProductId(null), 3000);
        if (token) {
          fetchOrders(token);
        }
      } else {
        setWaitlistError(data.error || "An error occurred.");
      }
    } catch (err) {
      setWaitlistError("Failed to connect to backend server.");
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!authEmail.trim()) {
      setAuthError("Email is required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpStep("code");
        setAuthMessage(data.message || "OTP requested. Please check your email inbox.");
      } else {
        setAuthError(data.error || "Failed to request OTP.");
      }
    } catch (err) {
      setAuthError("Failed to connect to backend server.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!otpCode.trim()) {
      setAuthError("OTP Code is required.");
      return;
    }

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
    } catch (err) {
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

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body">
      {/* Header */}
      <header className="w-full fixed top-0 z-50 bg-surface/90 backdrop-blur-sm">
        <div className="hairline-solid"></div>
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
          <a href="/" className="font-display text-[18px] md:text-[20px] uppercase tracking-[0.12em] text-primary hover:opacity-80 transition-opacity">
            absoluThings
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/custom" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Custom
            </a>
            <a href="https://www.instagram.com/theabsoluthings/" target="_blank" rel="noopener noreferrer" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Instagram
            </a>
            <button
              onClick={() => setIsCartOpen(true)}
              className="font-label-caps text-label-caps border border-primary/20 hover:border-primary px-5 py-2 uppercase transition-all duration-300 flex items-center gap-2"
            >
              View Orders {(waitingList.length + pastOrders.length) > 0 && `(${waitingList.length + pastOrders.length})`}
            </button>
          </nav>

          {/* Mobile Trigger Buttons */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="font-label-caps text-[10px] border border-primary/20 hover:border-primary px-3 py-1.5 uppercase transition-all duration-300 flex items-center gap-1"
            >
              Orders {(waitingList.length + pastOrders.length) > 0 && `(${waitingList.length + pastOrders.length})`}
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

        {/* Mobile Dropdown Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden w-full bg-surface border-b border-primary/10 animate-fade-in">
            <div className="flex flex-col px-margin-mobile py-6 gap-4">
              <a
                href="/custom"
                className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Custom Printing
              </a>
              <a
                href="https://www.instagram.com/theabsoluthings/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Instagram
              </a>
            </div>
          </div>
        )}
        <div className="hairline-solid"></div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-10 pb-8 md:pt-16 md:pb-12 flex flex-col items-center text-center">

          {/* Hero Image — static if 1 product, crossfade carousel if many */}
          {products.length > 0 ? (
            <div className="relative w-full max-w-3xl h-[260px] sm:h-[380px] md:h-[480px] overflow-hidden bg-surface-variant border border-primary/5 rounded-sm my-6 sm:my-8 shadow-sm">
              {products.length === 1 ? (
                <>
                  <img
                    src={products[0].image_url}
                    alt={products[0].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10 text-left z-10">
                    <p className="font-label-caps text-[10px] text-white/70 tracking-widest uppercase mb-1">
                      Featured Series / {products[0].id}
                    </p>
                    <h2 className="font-display text-[22px] md:text-[34px] text-white uppercase tracking-wide leading-tight">
                      {products[0].name}
                    </h2>
                    <a
                      href={`/product/${products[0].id}`}
                      className="mt-4 self-start bg-white/15 backdrop-blur-sm border border-white/30 hover:bg-white/25 text-white font-label-caps text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-sm transition-all duration-300"
                    >
                      Order Now
                    </a>
                  </div>
                </>
              ) : (
                products.map((product, idx) => (
                  <div
                    key={product.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === heroImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                      }`}
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10 text-left">
                      <p className="font-label-caps text-[10px] text-white/70 tracking-widest uppercase mb-1">
                        Featured Series / {product.id}
                      </p>
                      <h2 className="font-display text-[22px] md:text-[34px] text-white uppercase tracking-wide leading-tight">
                        {product.name}
                      </h2>
                      <a
                        href={`/product/${product.id}`}
                        className="mt-4 self-start bg-white/15 backdrop-blur-sm border border-white/30 hover:bg-white/25 text-white font-label-caps text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-sm transition-all duration-300"
                      >
                        Order Now
                      </a>
                    </div>
                  </div>
                ))
              )}

              {/* Down arrow scroll indicator */}
              <a
                href="#products"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white/70 hover:text-white transition-colors duration-300 animate-bounce"
                aria-label="Scroll to products"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          ) : (
            <div className="w-full max-w-3xl h-[260px] sm:h-[480px] bg-surface-variant/50 animate-pulse rounded-sm my-6 sm:my-8 flex items-center justify-center">
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-tertiary-container">Loading Collection...</span>
            </div>
          )}

          <div className="hairline w-24 md:w-32 my-8 md:my-10"></div>
          <blockquote className="font-display text-[20px] md:text-[28px] italic leading-relaxed text-on-surface max-w-xl px-4">
            "Precision is the bridge between the digital void and physical permanence."
          </blockquote>
          <cite className="font-label-caps text-label-caps text-on-tertiary-container not-italic mt-4 block">
            — ChatGPT
          </cite>
          </section>


        {/* Intro Section */}


        {/* Product Catalog Section */}
        <section id="products" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16 bg-white/50 backdrop-blur-sm rounded-lg border border-primary/[0.03] my-8">

          <div className="text-center mb-12">
            <p className="font-label-caps text-label-caps text-on-tertiary-container mb-2">Exclusive Series</p>
            <h2 className="font-display text-display-sm uppercase tracking-tight text-primary">
              Our Products
            </h2>
            <div className="hairline w-16 mx-auto mt-6"></div>
          </div>

          {products.length === 0 ? (
            <p className="text-center font-body text-on-surface-variant italic">Loading products catalog...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col bg-surface border border-primary/5 hover:border-primary/20 transition-all duration-300 rounded-sm overflow-hidden group"
                >
                  <div className="h-64 bg-surface-variant relative overflow-hidden">
                    <a href={`/product/${product.id}`} className="block w-full h-full">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      />
                    </a>
                    <div className="absolute top-3 left-3 bg-primary text-on-primary font-label-caps text-[9px] px-2.5 py-1 tracking-[0.1em] uppercase pointer-events-none">
                      {product.id}
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-[18px] text-primary mb-1 uppercase tracking-wide hover:opacity-80 transition-opacity">
                        <a href={`/product/${product.id}`}>{product.name}</a>
                      </h3>
                      <p className="font-label-caps text-[12px] text-primary mb-3">
                        ₹{product.price}
                      </p>
                      <p className="font-body text-[13px] text-on-surface-variant leading-relaxed mb-6">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 mt-auto">
                      <button
                        onClick={() => {
                          setWaitlistProductId(product.id);
                          setWaitlistError("");
                          setWaitlistMessage("");
                        }}
                        className="w-full bg-primary text-on-primary text-[10px] tracking-[0.15em] uppercase py-3.5 font-label-caps hover:bg-on-surface-variant transition-colors"
                      >
                        Join Waitlist
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal: Join Waiting List */}
        {waitlistProductId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
            <div className="bg-surface w-full max-w-md p-8 rounded-sm border border-primary/15 shadow-xl relative animate-fade-in">
              <button
                onClick={() => setWaitlistProductId(null)}
                className="absolute top-4 right-4 text-[20px] text-on-surface-variant hover:text-primary"
              >
                &times;
              </button>
              <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-widest uppercase mb-2">
                Join Waiting List
              </p>
              <h3 className="font-display text-[22px] text-primary mb-6 uppercase">
                {products.find((p) => p.id === waitlistProductId)?.name || waitlistProductId}
              </h3>

              <form onSubmit={handleJoinWaitlist} className="flex flex-col gap-4">
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm"
                  />
                </div>

                {waitlistError && (
                  <p className="text-red-600 font-body text-[12px]">{waitlistError}</p>
                )}
                {waitlistMessage && (
                  <p className="text-green-600 font-body text-[12px]">{waitlistMessage}</p>
                )}

                <button
                  type="submit"
                  className="bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors mt-2"
                >
                  Confirm Registration
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Info Grid Section */}
        <div className="hairline-solid"></div>
        <section className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 text-left">
            <div>
              <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-[0.15em] mb-3">
                01 / IDEATION
              </p>
              <h3 className="font-display text-[20px] text-primary mb-2">Digital to Physical</h3>
              <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">
                Simply bring your designs or choose your parameters, and we take care of moving it seamlessly from a screen into your hands.
              </p>
            </div>
            <div>
              <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-[0.15em] mb-3">
                02 / CRAFT
              </p>
              <h3 className="font-display text-[20px] text-primary mb-2">Clean, Crisp Finishes</h3>
              <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">
                We focus on exceptional execution. Every single item is printed with close care so that the final object looks smooth and handles beautifully.
              </p>
            </div>
            <div>
              <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-[0.15em] mb-3">
                03 / PURPOSE
              </p>
              <h3 className="font-display text-[20px] text-primary mb-2">Built for Utility</h3>
              <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">
                Whether you are trying to make a highly useful organizational holder or custom structural piece, we emphasize everyday real-world utility.
              </p>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}

      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-sm">
          {/* Backdrop Click */}
          <div className="flex-grow" onClick={() => setIsCartOpen(false)}></div>

          {/* Drawer Panel */}
          <div className="w-full max-w-md bg-surface h-full flex flex-col border-l border-primary/10 shadow-2xl relative animate-slide-in">
            <header className="px-8 py-6 border-b border-primary/5 flex justify-between items-center">
              <h2 className="font-display text-[20px] uppercase text-primary tracking-wide">
                Your Orders
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-[24px] text-on-surface-variant hover:text-primary"
              >
                &times;
              </button>
            </header>

            <div className="flex-grow overflow-y-auto p-8">
              {!isAuthenticated ? (
                // Authentication Form
                <div className="flex flex-col gap-6 py-6">
                  <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">
                    To protect your orders and view your selected items, please authenticate using a One-Time Password (OTP) sent to your email.
                  </p>

                  {otpStep === "email" ? (
                    <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                      <div>
                        <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm"
                        />
                      </div>
                      {authError && <p className="text-red-600 font-body text-[12px]">{authError}</p>}
                      <button
                        type="submit"
                        className="w-full bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors"
                      >
                        Send Verification Code
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                      <p className="font-body text-[13px] text-green-600 font-medium">
                        {authMessage}
                      </p>
                      <div>
                        <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                          Enter 6-Digit Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm tracking-[0.5em] text-center font-bold"
                        />
                      </div>
                      {authError && <p className="text-red-600 font-body text-[12px]">{authError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setOtpStep("email")}
                          className="w-1/3 border border-primary/20 text-[10px] uppercase font-label-caps py-4 tracking-[0.1em] hover:bg-primary/5 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors"
                        >
                          Verify Code
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                // Orders Drawer lists
                <div className="flex flex-col gap-8">
                  {/* User info & Logout */}
                  <div className="flex justify-between items-center pb-4 border-b border-primary/5">
                    <p className="font-body text-[12px] text-on-surface-variant">
                      Logged in as: <strong className="text-primary">{userEmail}</strong>
                    </p>
                    <button
                      onClick={handleLogout}
                      className="font-label-caps text-[10px] tracking-wider uppercase text-red-600 hover:text-red-800 transition-colors"
                    >
                      Logout
                    </button>
                  </div>

                  {/* Section 1: Waiting List */}
                  <div>
                    <h3 className="font-label-caps text-[11px] uppercase tracking-wider text-on-tertiary-container mb-4 pb-2 border-b border-primary/5">
                      Waiting List ({waitingList.length})
                    </h3>
                    {waitingList.length === 0 ? (
                      <p className="font-body text-[13px] text-on-surface-variant italic py-2">
                        Not registered on any waiting lists.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {waitingList.map((entry) => (
                          <div key={entry.id} className="flex gap-4 items-center bg-surface border border-primary/5 p-3 rounded-sm">
                            <img
                              src={entry.product?.image_url}
                              alt={entry.product?.name}
                              className="w-12 h-12 object-cover bg-surface-variant rounded-sm flex-shrink-0"
                            />
                            <div className="flex-grow">
                              <h4 className="font-display text-[13px] uppercase text-primary tracking-wide">
                                {entry.product?.name}
                              </h4>
                              <p className="font-body text-[11px] text-on-surface-variant">
                                Status: <span className="text-green-600 font-medium">Waitlist - Active</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Past Orders */}
                  <div>
                    <h3 className="font-label-caps text-[11px] uppercase tracking-wider text-on-tertiary-container mb-4 pb-2 border-b border-primary/5">
                      Past Orders ({pastOrders.length})
                    </h3>
                    {pastOrders.length === 0 ? (
                      <p className="font-body text-[13px] text-on-surface-variant italic py-2">
                        No past orders found.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {pastOrders.map((order) => (
                          <div key={order.id} className="flex gap-4 items-center bg-surface border border-primary/5 p-3 rounded-sm">
                            <img
                              src={order.product?.image_url}
                              alt={order.product?.name}
                              className="w-12 h-12 object-cover bg-surface-variant rounded-sm flex-shrink-0"
                            />
                            <div className="flex-grow">
                              <h4 className="font-display text-[13px] uppercase text-primary tracking-wide">
                                {order.product?.name}
                              </h4>
                              <p className="font-body text-[11px] text-on-surface-variant">
                                Qty: {order.quantity} | Total: ₹{order.product ? (order.product.price * order.quantity) : 0}
                              </p>
                              <p className="font-body text-[10px] text-on-surface-variant mt-1">
                                Status: <strong className="text-primary">{order.status}</strong>
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

        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-10 max-w-container-max mx-auto gap-6">
          <p className="font-label-caps text-[10px] text-on-tertiary-container tracking-[0.2em]">
            © 2026 Absoluthings. All rights reserved.
          </p>
          <a
            className="hidden md:inline-block font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors duration-300 tracking-[0.2em]"
            href="https://www.instagram.com/theabsoluthings/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
        </div>
      </footer>
    </div>
  );
}
