"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { ShoppingCart } from "lucide-react";

export default function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="text-2xl font-bold text-gray-900">
          <span className="text-black">AutopartZ </span>
          <span className="text-gray-500">gartage</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-black transition" />
            {/* You can add a badge here later if you track cart item count */}
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
      </div>
    </nav>
  );
}
