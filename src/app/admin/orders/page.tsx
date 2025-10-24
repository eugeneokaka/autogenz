"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PickupLocation = {
  id: string;
  name: string;
  city: string;
  address: string;
};
type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product?: {
    id?: string;
    name?: string;
    images?: { imageUrl: string }[];
  } | null;
};
type Order = {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  buyer?: { firstName?: string; lastName?: string; email?: string } | null;
  items: OrderItem[];
};

export default function AdminOrdersPage() {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // 🔍 separate filters
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");

  // debounce ref
  const debounceRef = useRef<number | null>(null);
  const DEBOUNCE_MS = 500;

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/pickup-locations");
        const data = await res.json();
        setLocations(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load pickup locations");
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  // fetchOrders function - used by debounced effect, Search button, reset, etc.
  const fetchOrders = async () => {
    // Build query params. Note: if selectedLocation is empty, we omit pickupLocationId.
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        ...(selectedLocation ? { pickupLocationId: selectedLocation } : {}),
        ...(orderIdSearch ? { orderId: orderIdSearch } : {}),
        ...(emailSearch ? { email: emailSearch } : {}),
      });

      const url = `/api/admin/orders${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Failed to fetch orders" }));
        throw new Error(err?.error || "Failed to fetch orders");
      }
      const data = await res.json();
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  // Run when selectedLocation changes (immediate)
  useEffect(() => {
    // Immediately fetch when the location changes
    // (selectedLocation may be empty after reset - we still call fetchOrders)
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  // Debounced live search: runs when orderIdSearch or emailSearch changes
  useEffect(() => {
    // clear previous debounce
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    // set new debounce
    debounceRef.current = window.setTimeout(() => {
      // If both search fields empty, we do nothing here and rely on selectedLocation effect or Search button.
      // But still call fetchOrders so typing backspace to empty fields reflects results.
      fetchOrders();
      debounceRef.current = null;
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdSearch, emailSearch]);

  const updateStatus = async (
    orderId: string,
    status: "READY_FOR_PICKUP" | "PAID" | "CANCELLED"
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update order");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success("Order updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Reset: clears everything (pickupLocationId, orderId, email) and refetches
  const handleReset = () => {
    setSelectedLocation("");
    setOrderIdSearch("");
    setEmailSearch("");
    // Call fetchOrders after clearing state. Small timeout to allow state to flush (not required but avoids race)
    setTimeout(() => {
      fetchOrders();
    }, 0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin — Orders</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        {/* Pickup location selector */}
        <div className="min-w-[320px]">
          <label className="block text-sm font-medium mb-2">
            Pickup Location
          </label>
          <Select
            onValueChange={(v) => setSelectedLocation(v)}
            value={selectedLocation}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  loadingLocations ? "Loading..." : "Select location"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name} — {loc.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔍 Order ID search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Order ID</label>
          <Input
            placeholder="Search by Order ID"
            value={orderIdSearch}
            onChange={(e) => setOrderIdSearch(e.target.value)}
          />
        </div>

        {/* 🔍 Buyer email search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Buyer Email</label>
          <Input
            placeholder="Search by Buyer Email"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={fetchOrders}
            className="bg-black hover:bg-gray-800 text-white"
          >
            Search
          </Button>
          <Button onClick={handleReset} variant="ghost" className="border">
            Reset
          </Button>
        </div>
      </div>

      {/* Orders list */}
      {loadingOrders ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" /> Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Order #{order.id.slice(0, 8)}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <p>
                    Buyer: {order.buyer?.firstName ?? "Unknown"}{" "}
                    {order.buyer?.lastName ?? ""} —{" "}
                    <span className="text-sm text-gray-500">
                      {order.buyer?.email ?? "No email"}
                    </span>
                  </p>
                  <p className="font-semibold">
                    Total: KSh {order.totalAmount.toLocaleString()}
                  </p>
                  <p>
                    Status: <strong>{order.status}</strong>
                  </p>
                </div>
                <div className="border-t pt-3 space-y-2">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {it.product?.name ?? "Deleted product"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {it.quantity} • KSh {it.price}
                        </p>
                      </div>
                      <p className="font-semibold">
                        KSh {(it.price * it.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2 justify-end">
                  <Button
                    disabled={updatingOrderId === order.id}
                    onClick={() => updateStatus(order.id, "READY_FOR_PICKUP")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {updatingOrderId === order.id
                      ? "Updating..."
                      : "Mark Ready"}
                  </Button>
                  <Button
                    disabled={updatingOrderId === order.id}
                    onClick={() => updateStatus(order.id, "PAID")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {updatingOrderId === order.id ? "Updating..." : "Mark Paid"}
                  </Button>
                  <Button
                    disabled={updatingOrderId === order.id}
                    onClick={() => updateStatus(order.id, "CANCELLED")}
                    variant="destructive"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
