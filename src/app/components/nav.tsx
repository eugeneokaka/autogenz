"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { isSignedIn } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="text-xl font-bold text-gray-900">
          <span className="text-white font-bold font-sans bg-gray-900 px-2 py-1 rounded-md">
            AutopartZ
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          {isSignedIn && (
            <Link href="/dashboard">
              <Button className="bg-gray-800 hover:bg-gray-300 text-white hover:text-black">
                Dashboard
              </Button>
            </Link>
          )}

          {/* Cart Icon */}
          <Link href="/cart">
            <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-black transition" />
          </Link>

          {/* Auth Buttons */}
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <Button className="bg-black hover:bg-gray-800 text-white">
                Login
              </Button>
            </SignInButton>
          )}
        </div>

        {/* Mobile Right Section */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Cart Icon (Mobile) */}
          <Link href="/cart">
            <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-black transition" />
          </Link>

          {/* If NOT signed in → Show Login button instead of hamburger */}
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button className="bg-black text-white hover:bg-gray-800 px-3 py-1 text-sm">
                Login
              </Button>
            </SignInButton>
          ) : (
            // If signed in → Show Hamburger
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition"
            >
              {menuOpen ? (
                <X className="h-6 w-6 text-gray-800" />
              ) : (
                <Menu className="h-6 w-6 text-gray-800" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu (only for logged-in users) */}
      {isSignedIn && menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-md animate-slideDown">
          <div className="px-4 py-3 flex flex-col gap-4">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="text-gray-700 hover:text-black"
            >
              <Button className="w-full bg-gray-800 text-white hover:bg-gray-300 hover:text-black">
                Dashboard
              </Button>
            </Link>

            <div className="flex justify-start">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
