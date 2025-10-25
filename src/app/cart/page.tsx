"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: { imageUrl: string }[];
  };
}

interface PickupLocation {
  id: string;
  name: string;
  city: string;
  address: string;
}

export default function CartPage() {
  const { user } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Fetch cart
  useEffect(() => {
    if (!user) return;
    const fetchCart = async () => {
      try {
        const res = await fetch(`/api/cart?userClerkId=${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load cart");
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
        toast.error("Could not load cart");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user]);

  // Fetch pickup locations
  useEffect(() => {
    const fetchPickupLocations = async () => {
      try {
        const res = await fetch("/api/pickup-locations");
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to load pickup locations");
        setPickupLocations(data);
      } catch {
        toast.error("Failed to load pickup locations");
      }
    };
    fetchPickupLocations();
  }, []);

  // Handle quantity update
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      const res = await fetch(`/api/cart/item`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    } catch (err) {
      toast.error("Failed to update quantity");
    }
  };

  // Handle remove item
  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/item`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!selectedPickupId) {
      toast.error("Please select a pickup location");
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await fetch(`/api/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userClerkId: user.id,
          pickupLocationId: selectedPickupId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Order placed successfully!");
      setItems([]); // Clear cart
      setSelectedPickupId("");
    } catch (err) {
      toast.error("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Calculate total
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );

  if (!items.length)
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Your cart is empty.</p>
        <Link href="/" className="text-blue-600 underline">
          Go shopping →
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <Card className="shadow-md border border-border/40">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Your Cart</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 mt-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b pb-4"
            >
              <div className="flex items-center gap-4">
                {item.product.images?.[0]?.imageUrl ? (
                  <Image
                    src={item.product.images[0].imageUrl}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="rounded-md object-cover border"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-md" />
                )}
                <div>
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    KSh {item.product.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.id, Number(e.target.value))
                  }
                  className="w-16 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Select pickup location */}
          <div className="pt-4">
            <label className="block font-medium mb-2">Pickup Location</label>
            <select
              className="border rounded-md p-2 w-full"
              value={selectedPickupId}
              onChange={(e) => setSelectedPickupId(e.target.value)}
            >
              <option value="">Select a pickup location</option>
              {pickupLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} — {loc.city}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between pt-6">
            <p className="text-lg font-semibold">
              Total: KSh {total.toLocaleString()}
            </p>
            <Button
              onClick={placeOrder}
              disabled={placingOrder}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {placingOrder ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
