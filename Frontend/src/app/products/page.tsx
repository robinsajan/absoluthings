"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in Rupees
  image_url: string;
  is_available: boolean;
  size_details?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 5000);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (product: Product) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const shareText = `Check out this 3D-printed creation: ${product.name}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(shareText, shareUrl);
        }
      }
    } else {
      copyToClipboard(shareText, shareUrl);
    }
  };

  const copyToClipboard = async (text: string, url: string) => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      showToast("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast("Could not copy link automatically.");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <a href="/" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Home
            </a>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em] text-[10px] border-b border-primary/40 pb-0.5">
              Products
            </span>
            <a href="/custom" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Custom
            </a>
            <a href="https://www.instagram.com/theabsoluthings/" target="_blank" rel="noopener noreferrer" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Instagram
            </a>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-primary hover:text-on-surface-variant focus:outline-none p-1 text-[24px]"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? "×" : "☰"}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden w-full bg-surface border-b border-primary/10 animate-fade-in">
            <div className="flex flex-col px-margin-mobile py-6 gap-4">
              <a
                href="/"
                className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
              <span className="font-label-caps text-[12px] text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5">
                Products
              </span>
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
      <main className="flex-grow pt-32 pb-16">
        <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          
          {/* Header Title */}
          <div className="text-center mb-10">
            <p className="font-label-caps text-label-caps text-on-tertiary-container mb-3">Our Collection</p>
            <h1 className="font-display text-[28px] md:text-[36px] uppercase tracking-tight text-primary leading-tight">
              Products
            </h1>
            <div className="hairline w-16 mx-auto mt-6"></div>
          </div>

          {/* Premium Search Bar */}
          <div className="max-w-md mx-auto mb-12 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-5 pr-12 py-3.5 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-white rounded-sm transition-colors shadow-sm"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <p className="text-center font-body text-on-surface-variant italic my-12">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white/40 border border-primary/5 rounded-sm">
              <p className="font-body text-on-surface-variant italic mb-2">
                {searchQuery ? "No products match your search." : "No products available in the catalog yet."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="font-label-caps text-[10px] text-primary uppercase tracking-widest underline mt-2 hover:opacity-85"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col bg-white border border-primary/5 hover:border-primary/20 transition-all duration-300 rounded-sm overflow-hidden group"
                >
                  {/* Photo Section */}
                  <div className="h-72 bg-surface-variant relative overflow-hidden">
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
                    <div className="absolute top-3 right-3 font-label-caps text-[9px] px-2.5 py-1 tracking-[0.1em] uppercase pointer-events-none">
                      {product.is_available ? (
                        <span className="bg-green-600 text-white px-2 py-0.5">In Stock</span>
                      ) : (
                        <span className="bg-amber-500 text-white px-2 py-0.5">Waitlist</span>
                      )}
                    </div>
                  </div>

                  {/* Info Section (Price and Name) */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-[18px] text-primary mb-1.5 uppercase tracking-wide hover:opacity-80 transition-opacity">
                        <a href={`/product/${product.id}`}>{product.name}</a>
                      </h3>
                      <p className="font-label-caps text-[13px] text-primary font-medium">
                        ₹{product.price}
                      </p>
                    </div>

                    {/* Action: Order Button */}
                    <div className="mt-6">
                      <a
                        href={`/product/${product.id}`}
                        className="w-full border border-primary/25 text-primary text-[10px] tracking-[0.15em] uppercase py-3 font-label-caps hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-300 flex items-center justify-center gap-2 rounded-sm"
                      >
                        Order
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="hairline-solid"></div>
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

      {/* Toast Notification */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: toastVisible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(120%)",
          opacity: toastVisible ? 1 : 0,
          transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease",
          zIndex: 9999,
          pointerEvents: toastVisible ? "auto" : "none",
          maxWidth: "min(480px, calc(100vw - 2rem))",
          width: "100%",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          background: "#ffffff",
          border: "1px solid #000000",
          borderRadius: "0px",
          padding: "18px 20px",
          boxShadow: "4px 4px 0px #000000",
        }}>
          <div style={{
            flexShrink: 0,
            width: "32px",
            height: "32px",
            border: "1.5px solid #000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "15px",
            color: "#000000",
            fontWeight: 700,
          }}>
            ✓
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontWeight: 600,
              fontSize: "12px",
              color: "#000000",
              letterSpacing: "0.02em",
              lineHeight: "1.5",
              textTransform: "uppercase",
            }}>
              {toastMessage}
            </p>
            <p style={{
              margin: "4px 0 0",
              fontSize: "10px",
              color: "rgba(0,0,0,0.45)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              absoluThings
            </p>
          </div>
          <button
            onClick={() => setToastVisible(false)}
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              color: "rgba(0,0,0,0.4)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "0",
              lineHeight: 1,
              marginTop: "-1px",
            }}
          >
            ×
          </button>
        </div>
        {toastVisible && (
          <div style={{
            height: "2px",
            background: "rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              background: "#000000",
              animation: "toastProgress 5s linear forwards",
            }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
