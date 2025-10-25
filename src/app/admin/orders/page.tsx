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

  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");

  const debounceRef = useRef<number | null>(null);
  const DEBOUNCE_MS = 500;

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/pickup-locations");
        const data = await res.json();
        setLocations(data || []);
      } catch {
        toast.error("Failed to load pickup locations");
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  const fetchOrders = async () => {
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
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data || []);
    } catch (err: any) {
      toast.error(err.message || "Error fetching orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchOrders();
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
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
      toast.success("Order status updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleReset = () => {
    setSelectedLocation("");
    setOrderIdSearch("");
    setEmailSearch("");
    setTimeout(fetchOrders, 0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin — Orders</h1>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div className="min-w-[280px]">
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

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Order ID</label>
          <Input
            placeholder="Search by Order ID"
            value={orderIdSearch}
            onChange={(e) => setOrderIdSearch(e.target.value)}
          />
        </div>

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

      {/* Orders */}
      {loadingOrders ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" /> Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">No orders found.</p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="border border-gray-100 shadow-sm hover:shadow-md transition rounded-2xl"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <div>
                    <span className="block font-semibold text-gray-800">
                      Order #{order.id}
                    </span>
                    <span className="text-sm text-gray-500 sm:hidden block">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 hidden sm:block">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-sm text-gray-700">
                  <p>
                    <strong>Buyer:</strong>{" "}
                    {order.buyer?.firstName ?? "Unknown"}{" "}
                    {order.buyer?.lastName ?? ""}{" "}
                    <span className="text-gray-500">
                      ({order.buyer?.email ?? "No email"})
                    </span>
                  </p>
                  <p className="font-medium">
                    Total:{" "}
                    <span className="text-gray-900">
                      KSh {order.totalAmount.toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Status:{" "}
                    <span className="font-semibold text-gray-900">
                      {order.status}
                    </span>
                  </p>
                </div>

                <div className="border-t pt-3 space-y-2">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {it.product?.name ?? "Deleted product"}
                        </p>
                        <p className="text-gray-500">
                          Qty: {it.quantity} • KSh {it.price}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        KSh {(it.price * it.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
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
