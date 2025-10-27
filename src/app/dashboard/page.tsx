"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";

type Order = {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      images?: { imageUrl: string }[];
    } | null;
  }[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  condition: string;
  createdAt: string;
  images: { imageUrl: string }[];
};

export default function DashboardPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/order?userClerkId=${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("❌ Error fetching orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/my-products`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchOrders();
    fetchProducts();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* =======================
          🧭 Top Dashboard Header
      ======================= */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex gap-3">
          {/* 🟢 Admin Orders Button */}
          <Link href="/admin/orders">
            <Button variant="outline" size="lg">
              🧾 View Admin Orders
            </Button>
          </Link>

          {/* 🟢 Add New Product Button */}
          <Link href="/products/new">
            <Button size="lg" className="bg-black text-white">
              + Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* =======================
          🛍️ My Orders Section
      ======================= */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">My Orders</h2>
        </div>

        <div className="grid gap-6">
          {loadingOrders ? (
            <Card className="p-6 text-gray-500">Loading orders...</Card>
          ) : orders.length === 0 ? (
            <Card className="p-6 text-gray-500">No orders found.</Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Ksh {order.totalAmount}</p>
                    <p className="text-sm px-2 py-1 rounded bg-gray-100 inline-block">
                      {order.status}
                    </p>
                  </div>
                </div>

                {/* ✅ Order Items */}
                <div className="border-t pt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0]?.imageUrl && (
                          <img
                            src={item.product.images[0].imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {item.product?.name ?? "Deleted Product"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        Ksh {item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* =======================
          🧰 My Products Section
      ======================= */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">My Products</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loadingProducts ? (
            <Card className="p-6 text-gray-500">Loading products...</Card>
          ) : products.length === 0 ? (
            <Card className="p-6 text-gray-500">No products listed yet.</Card>
          ) : (
            products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {product.images[0] && (
                  <div className="h-48 relative">
                    <img
                      src={product.images[0].imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium mb-2">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">Ksh {product.price}</p>
                    <span className="text-sm text-gray-500">
                      {product.condition}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link href={`/products/${product.id}`}>
                      <Button className="w-full" variant="outline">
                        View
                      </Button>
                    </Link>

                    <Link href={`/products/${product.id}/edit`}>
                      <Button className="w-full">Edit</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
