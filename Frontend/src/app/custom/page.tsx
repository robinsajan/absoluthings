"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CustomPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [material, setMaterial] = useState("PLA");
  const [quantity, setQuantity] = useState(1);
  const [fileLink, setFileLink] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/custom-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          material,
          quantity,
          file_link: fileLink,
          description,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message || "Thank you! Your custom printing request has been received. Our team will contact you shortly.");
        setName("");
        setEmail("");
        setMaterial("PLA");
        setQuantity(1);
        setFileLink("");
        setDescription("");
      } else {
        setErrorMessage(data.error || "Something went wrong. Please try again or email us directly at theabsoluthings@gmail.com");
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please try again or email us directly at theabsoluthings@gmail.com");
    } finally {
      setIsSubmitting(false);
    }
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
            <a href="/" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Home
            </a>
            <a href="/products" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] text-[10px]">
              Products
            </a>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em] text-[10px] border-b border-primary/40 pb-0.5">
              Custom
            </span>
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
              <a
                href="/products"
                className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </a>
              <span className="font-label-caps text-[12px] text-primary uppercase tracking-[0.15em] py-2 border-b border-primary/5">
                Custom
              </span>
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
        <div className="w-full max-w-2xl mx-auto px-margin-mobile md:px-0">
          <div className="text-center mb-10">
            <p className="font-label-caps text-label-caps text-on-tertiary-container mb-3">Tailored To You</p>
            <h1 className="font-display text-[28px] md:text-[36px] uppercase tracking-tight text-primary leading-tight">
              Custom Printing Requests
            </h1>
            <div className="hairline w-16 mx-auto mt-6"></div>
          </div>

          <div className="bg-white/40 backdrop-blur-sm border border-primary/5 rounded-sm p-6 md:p-10 shadow-sm">
            <p className="font-body text-[14px] text-on-surface-variant leading-relaxed mb-8 text-center max-w-lg mx-auto">
              Have a specific 3D model, custom modification, or engineering draft you need printed with absolute precision?
              Fill out the details below, and we will get back to you with a quote.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Smith"
                    className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                    Material Preference
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm transition-colors appearance-none cursor-pointer"
                  >
                    <option value="PLA">PLA (Detail & Aesthetics)</option>
                    <option value="PETG">PETG (Durable & Weatherproof)</option>
                    <option value="ABS">ABS / ASA (Structural & High Temp)</option>
                    <option value="Resin">Resin (High Detail / Miniature)</option>
                  </select>
                </div>

                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                  Link to 3D Model File (STL, OBJ, STEP, etc.)
                </label>
                <input
                  type="url"
                  value={fileLink}
                  onChange={(e) => setFileLink(e.target.value)}
                  placeholder="e.g. link to Google Drive, Dropbox, Printables, etc."
                  className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm transition-colors"
                />
                <span className="text-[11px] text-on-surface-variant/70 mt-1 block">
                  Optional. You can also send the file to us directly via email.
                </span>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1.5 block">
                  Project Details / Requirements
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe dimensions, infill, usage, or any specific finish requests..."
                  className="w-full px-4 py-3 border border-primary/20 focus:border-primary outline-none font-body text-[14px] bg-surface rounded-sm transition-colors resize-y"
                ></textarea>
              </div>

              {errorMessage && (
                <p className="text-red-600 font-body text-[13px]">{errorMessage}</p>
              )}
              {successMessage && (
                <p className="text-green-700 font-body text-[13px] bg-green-50 p-4 border border-green-200 rounded-sm">
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-on-primary font-label-caps text-[11px] py-4 uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors disabled:opacity-55 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? "Submitting..." : "Send Request"}
              </button>
            </form>
          </div>

          <div className="text-center mt-8">
            <p className="font-body text-[13px] text-on-surface-variant">
              Or email us directly at{" "}
              <a href="mailto:theabsoluthings@gmail.com" className="text-primary underline hover:opacity-80 transition-opacity">
                theabsoluthings@gmail.com
              </a>
            </p>
          </div>
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
    </div>
  );
}
