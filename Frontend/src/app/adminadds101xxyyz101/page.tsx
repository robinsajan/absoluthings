"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images: string[];
  is_available: boolean;
  size_details: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Auth form states
  const [loginEmail, setLoginEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for Add/Edit
  const [prodId, setProdId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodSize, setProdSize] = useState("");
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodPrimaryImage, setProdPrimaryImage] = useState("");
  const [prodGalleryImages, setProdGalleryImages] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Image Cropper / Adjuster state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string>("");
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropRotation, setCropRotation] = useState<number>(0);

  const [cropTarget, setCropTarget] = useState<"primary" | "gallery" | null>(null);
  const [galleryIndexToReplace, setGalleryIndexToReplace] = useState<number | null>(null);
  
  // Crop drag state
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("auth_token");
    const email = localStorage.getItem("auth_email");
    if (!token || !email) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/check`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setIsAdmin(true);
        setUserEmail(email);
        fetchProducts();
      } else {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_email");
      }
    } catch (err) {
      console.error("Auth check failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      if (res.ok) {
        setOtpSent(true);
      } else {
        const data = await res.json();
        setAuthError(data.error || "Failed to request OTP.");
      }
    } catch (err) {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.is_admin) {
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("auth_email", data.email);
          setIsAuthenticated(true);
          setIsAdmin(true);
          setUserEmail(data.email);
          fetchProducts();
        } else {
          setAuthError("Access Denied: This email does not have admin permissions.");
        }
      } else {
        setAuthError(data.error || "Failed to verify OTP.");
      }
    } catch (err) {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserEmail("");
  };

  // Open Edit Form
  const startEdit = (product: Product) => {
    setSelectedProduct(product);
    setProdId(product.id);
    setProdName(product.name);
    setProdDesc(product.description || "");
    setProdPrice(product.price);
    setProdSize(product.size_details || "");
    setProdAvailable(product.is_available);
    setProdPrimaryImage(product.image_url || "");
    setProdGalleryImages(product.images || []);
    setIsEditing(true);
    setIsAdding(false);
    setFormError("");
  };

  // Open Add Form
  const startAdd = () => {
    setSelectedProduct(null);
    setProdId("");
    setProdName("");
    setProdDesc("");
    setProdPrice(0);
    setProdSize("");
    setProdAvailable(true);
    setProdPrimaryImage("");
    setProdGalleryImages([]);
    setIsAdding(true);
    setIsEditing(false);
    setFormError("");
  };

  const toggleAvailability = async (product: Product) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_available: !product.is_available }),
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Failed to toggle availability", err);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm(`Are you sure you want to delete product "${productId}"?`)) return;

    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSaving(true);

    const token = localStorage.getItem("auth_token");
    const payload = {
      id: prodId,
      name: prodName,
      description: prodDesc,
      price: prodPrice,
      size_details: prodSize,
      is_available: prodAvailable,
      image_url: prodPrimaryImage,
      images: prodGalleryImages,
    };

    try {
      let res;
      if (isAdding) {
        res = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/admin/products/${selectedProduct?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsAdding(false);
        setIsEditing(false);
        fetchProducts();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to save product details.");
      }
    } catch (err) {
      setFormError("Network error. Please check your connection.");
    } finally {
      setFormSaving(false);
    }
  };

  // Image Upload & Crop handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "primary" | "gallery", index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropTarget(target);
      setGalleryIndexToReplace(index !== undefined ? index : null);
      setCropZoom(1);
      setCropRotation(0);

      setCropOffset({ x: 0, y: 0 });
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Canvas draw logic — crop, zoom, pan, and rotation
  useEffect(() => {
    if (!cropperOpen || !cropSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = cropSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2 + cropOffset.x, canvas.height / 2 + cropOffset.y);
      ctx.rotate((cropRotation * Math.PI) / 180);
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * cropZoom;
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
      ctx.restore();

      // Rule-of-thirds grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      const w3 = canvas.width / 3;
      const h3 = canvas.height / 3;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(w3 * i, 0); ctx.lineTo(w3 * i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, h3 * i); ctx.lineTo(canvas.width, h3 * i); ctx.stroke();
      }

      // Crop border
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    };
  }, [cropperOpen, cropSrc, cropZoom, cropRotation, cropOffset]);

  // Mouse drag (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  // Touch drag (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: t.clientX - cropOffset.x, y: t.clientY - cropOffset.y };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    const t = e.touches[0];
    setCropOffset({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y });
  };
  const handleTouchEnd = () => setIsDragging(false);

  const handleCropSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("image", blob, "uploaded_image.png");

      const token = localStorage.getItem("auth_token");
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (cropTarget === "primary") {
            setProdPrimaryImage(data.image_url);
          } else if (cropTarget === "gallery") {
            if (galleryIndexToReplace !== null && galleryIndexToReplace !== undefined) {
              const updated = [...prodGalleryImages];
              updated[galleryIndexToReplace] = data.image_url;
              setProdGalleryImages(updated);
            } else {
              setProdGalleryImages([...prodGalleryImages, data.image_url]);
            }
          }
          setCropperOpen(false);
        } else {
          alert("Image upload failed.");
        }
      } catch (err) {
        alert("Upload error.");
      }
    }, "image/png");
  };

  const removeGalleryImage = (idx: number) => {
    setProdGalleryImages(prodGalleryImages.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 bg-surface">
        <div className="text-primary font-label-caps text-xs animate-pulse tracking-[0.2em] uppercase">
          Verifying Admin Access...
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated || !isAdmin) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-4 bg-surface max-w-[480px] mx-auto w-full">
        <div className="w-full border border-primary/10 bg-white p-8 md:p-10 shadow-sm flex flex-col">
          <h1 className="font-display text-[28px] uppercase tracking-normal mb-1 text-center">
            Secret Admin Portal
          </h1>
          <p className="font-body text-xs text-on-surface-variant mb-8 text-center uppercase tracking-widest">
            Absoluthings Catalog Console
          </p>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 font-body text-xs text-center">
              {authError}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Admin Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@absoluthings.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="border border-primary/15 bg-surface/30 py-3 px-4 text-sm focus:outline-none focus:border-primary/40 font-body transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors disabled:opacity-50 mt-2 cursor-pointer"
              >
                {authLoading ? "Sending OTP..." : "Request Admin OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="border border-primary/15 bg-surface/30 py-3 px-4 text-sm text-center tracking-[0.3em] font-body uppercase focus:outline-none focus:border-primary/40 transition-colors"
                />
                <p className="text-[10px] text-on-surface-variant font-body mt-1">
                  Sent to <span className="font-medium">{loginEmail}</span>. Check your inbox.
                </p>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors disabled:opacity-50 mt-2 cursor-pointer"
              >
                {authLoading ? "Verifying..." : "Verify & Access Panel"}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-[11px] font-label-caps text-on-surface-variant tracking-wider uppercase hover:text-primary transition-colors text-center cursor-pointer mt-1"
              >
                Change Email
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  // ADMIN DASHBOARD
  return (
    <main className="flex-grow bg-surface w-full">
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-primary/10 pb-8 mb-10 gap-4">
          <div>
            <h1 className="font-display text-[32px] md:text-[38px] leading-tight uppercase font-bold">
              Absoluthings
            </h1>
            <p className="font-body text-xs text-on-surface-variant tracking-widest uppercase mt-1">
              Catalog Administration | {userEmail}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="border border-primary/15 font-label-caps text-[10px] uppercase tracking-wider py-2.5 px-5 hover:bg-surface-variant transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </a>
            <button
              onClick={handleLogout}
              className="border border-primary/15 font-label-caps text-[10px] uppercase tracking-wider py-2.5 px-6 hover:bg-primary hover:text-white transition-colors cursor-pointer"
            >
              Logout Console
            </button>
          </div>
        </header>

        {/* Catalog Control */}
        {!isEditing && !isAdding ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-xl uppercase tracking-wider">Product Catalog</h2>
              <button
                onClick={startAdd}
                className="bg-primary text-on-primary font-label-caps text-xs py-3 px-6 uppercase tracking-wider hover:bg-on-surface-variant transition-colors cursor-pointer"
              >
                + Add Product
              </button>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="border border-primary/10 bg-white p-5 flex gap-5 shadow-sm group hover:border-primary/25 transition-all duration-300 relative"
                >
                  <div className="w-24 h-24 bg-surface/50 border border-primary/5 flex-shrink-0 relative overflow-hidden">
                    {prod.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-on-surface-variant uppercase font-label-caps tracking-tighter">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-body font-medium text-[15px] leading-snug">{prod.name}</h3>
                        <span className="font-body text-sm font-semibold">₹{prod.price}</span>
                      </div>
                      <p className="font-body text-[11px] text-on-surface-variant mt-1.5 uppercase tracking-wide">
                        ID: <code className="font-semibold bg-surface px-1">{prod.id}</code> | Size: {prod.size_details || "N/A"}
                      </p>
                      
                      {/* Availability status badge */}
                      <span
                        onClick={() => toggleAvailability(prod)}
                        className={`inline-flex items-center gap-1.5 font-label-caps text-[9px] uppercase tracking-wider font-semibold py-1 px-2.5 rounded-full mt-3 cursor-pointer select-none transition-all duration-200 ${
                          prod.is_available
                            ? "bg-green-50 text-green-700 border border-green-200/50"
                            : "bg-amber-50 text-amber-700 border border-amber-200/50"
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${prod.is_available ? "bg-green-600" : "bg-amber-600"}`}></span>
                        {prod.is_available ? "Order Now" : "Waiting List / Hidden"}
                      </span>
                    </div>

                    <div className="flex gap-4 border-t border-primary/5 pt-3 mt-4">
                      <button
                        onClick={() => startEdit(prod)}
                        className="text-[11px] font-label-caps uppercase tracking-wider font-semibold text-primary hover:text-on-surface-variant transition-colors cursor-pointer"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => deleteProduct(prod.id)}
                        className="text-[11px] font-label-caps uppercase tracking-wider font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <div className="col-span-full border border-dashed border-primary/15 py-16 text-center font-body text-xs text-on-surface-variant uppercase tracking-widest">
                  No products in database. Add a product above to get started.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ADD/EDIT FORM CONTAINER */
          <div className="border border-primary/10 bg-white p-6 md:p-10 shadow-sm">
            <div className="flex justify-between items-center border-b border-primary/5 pb-5 mb-8">
              <h2 className="font-display text-xl uppercase tracking-wider">
                {isAdding ? "Add New Product" : `Edit Product details (${prodId})`}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className="font-label-caps text-[10px] uppercase tracking-wider border border-primary/10 py-1.5 px-4 hover:bg-surface transition-colors cursor-pointer"
              >
                Back to Catalog
              </button>
            </div>

            {formError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 font-body text-xs text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Form Block */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BlockIcon: Jesus"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="border border-primary/15 bg-surface/30 py-3 px-4 text-sm focus:outline-none focus:border-primary/40 font-body transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                        Price (in Rupees)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="199"
                        value={prodPrice || ""}
                        onChange={(e) => setProdPrice(Number(e.target.value))}
                        className="border border-primary/15 bg-surface/30 py-3 px-4 text-sm focus:outline-none focus:border-primary/40 font-body transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                        Dimensions / Size details
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 60mm Figure"
                        value={prodSize}
                        onChange={(e) => setProdSize(e.target.value)}
                        className="border border-primary/15 bg-surface/30 py-3 px-4 text-sm focus:outline-none focus:border-primary/40 font-body transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border border-primary/5 bg-surface/20 p-4">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={prodAvailable}
                      onChange={(e) => setProdAvailable(e.target.checked)}
                      className="w-4 h-4 cursor-pointer accent-primary"
                    />
                    <label htmlFor="isAvailable" className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface select-none cursor-pointer">
                      Make available immediately (Order Now status)
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Product Description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe the product details..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="border border-primary/15 bg-surface/30 py-3 px-4 text-sm focus:outline-none focus:border-primary/40 font-body transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Right Form Block (Image management) */}
                <div className="flex flex-col gap-6">
                  
                  {/* Primary Image */}
                  <div className="border border-primary/5 bg-surface/10 p-5 flex flex-col gap-4">
                    <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Primary Display Image
                    </h3>

                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-20 bg-white border border-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {prodPrimaryImage ? (
                          <img
                            src={prodPrimaryImage}
                            alt="Primary Product display"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] uppercase font-label-caps text-on-surface-variant">Empty</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-primary text-on-primary font-label-caps text-[9px] uppercase tracking-wider py-2 px-4 hover:bg-on-surface-variant transition-colors cursor-pointer"
                        >
                          Upload & Crop Primary Image
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "primary")}
                        />
                        <input
                          type="text"
                          placeholder="Or paste external URL"
                          value={prodPrimaryImage}
                          onChange={(e) => setProdPrimaryImage(e.target.value)}
                          className="border border-primary/15 bg-white py-1.5 px-3 text-xs focus:outline-none focus:border-primary/40 font-body w-full max-w-[240px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div className="border border-primary/5 bg-surface/10 p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                        Gallery Images
                      </h3>
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="border border-primary/15 text-primary font-label-caps text-[9px] uppercase tracking-wider py-1.5 px-3 hover:bg-primary hover:text-white transition-colors cursor-pointer"
                      >
                        + Add Gallery Image
                      </button>
                      <input
                        type="file"
                        ref={galleryFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "gallery")}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {prodGalleryImages.map((imgUrl, idx) => (
                        <div key={idx} className="border border-primary/10 bg-white p-2 relative flex flex-col gap-2 shadow-sm group">
                          <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden">
                            <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = (e) => {
                                  handleFileChange(e as any, "gallery", idx);
                                };
                                input.click();
                              }}
                              className="text-[8px] font-label-caps uppercase text-center text-primary bg-surface/50 hover:bg-surface py-1 cursor-pointer transition-colors"
                            >
                              Edit/Crop
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="text-[8px] font-label-caps uppercase text-center text-red-600 bg-red-50 hover:bg-red-100 py-1 cursor-pointer transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {prodGalleryImages.length === 0 && (
                      <p className="text-[10px] text-center text-on-surface-variant uppercase font-label-caps tracking-widest py-3">
                        No gallery images added yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 border-t border-primary/5 pt-6 mt-4">
                <button
                  type="submit"
                  disabled={formSaving}
                  className="bg-primary text-on-primary font-label-caps text-xs py-4 px-8 uppercase tracking-widest hover:bg-on-surface-variant transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {formSaving ? "Saving changes..." : "Save Product Settings"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                  }}
                  className="border border-primary/15 text-primary font-label-caps text-xs py-4 px-8 uppercase tracking-widest hover:bg-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* POPUP IMAGE CROPPER MODAL */}
      {cropperOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-primary/10 max-w-[500px] w-full p-6 shadow-xl flex flex-col gap-6">
            <div>
              <h3 className="font-display text-lg uppercase tracking-wider">Crop & Adjust Image</h3>
              <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                Drag to reposition. Use sliders to zoom, rotate, and adjust properties.
              </p>
            </div>

            {/* Canvas Crop Container */}
            <div className="bg-surface border border-primary/5 relative flex items-center justify-center overflow-hidden aspect-square select-none cursor-move">
              <canvas
                ref={canvasRef}
                width={380}
                height={380}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: "none" }}
                className="max-w-full max-h-full"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 font-body text-xs">
              {/* Zoom Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="font-label-caps text-[9px] uppercase tracking-wider text-on-surface-variant">Zoom</span>
                  <span>{Math.round(cropZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-variant rounded-lg cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="font-label-caps text-[9px] uppercase tracking-wider text-on-surface-variant">Rotation</span>
                  <span>{cropRotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={cropRotation}
                  onChange={(e) => setCropRotation(parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-variant rounded-lg cursor-pointer"
                />
              </div>


            </div>

            {/* Buttons */}
            <div className="flex gap-3 border-t border-primary/5 pt-4">
              <button
                type="button"
                onClick={handleCropSave}
                className="flex-1 bg-primary text-on-primary font-label-caps text-[11px] py-3.5 uppercase tracking-widest hover:bg-on-surface-variant transition-colors cursor-pointer"
              >
                Apply Crop & Upload
              </button>
              <button
                type="button"
                onClick={() => setCropperOpen(false)}
                className="flex-1 border border-primary/15 text-primary font-label-caps text-[11px] py-3.5 uppercase tracking-widest hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
