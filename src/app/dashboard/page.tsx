"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserRole = async () => {
      try {
        const res = await fetch(`/api/role?clerkId=${user.id}`);
        const data = await res.json();
        setRole(data.role);
      } catch (err) {
        console.error("Error fetching user role:", err);
      } finally {
        setLoadingRole(false);
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/order?userClerkId=${user.id}`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/my-products`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchUserRole();
    fetchOrders();
    fetchProducts();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {!loadingRole && role === "ADMIN" && (
          <Link href="/admin/orders">
            <Button className="bg-black text-white hover:bg-gray-800 transition">
              View Admin Orders
            </Button>
          </Link>
        )}
      </div>

      {/* My Orders */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">My Orders</h2>
        </div>

        {loadingOrders ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-8 text-center text-gray-500 shadow-sm">
            No orders yet. Start shopping to see them here!
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="p-6 shadow-sm hover:shadow-md transition rounded-2xl border border-gray-100"
              >
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      Ksh {order.totalAmount}
                    </p>
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100">
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b last:border-0 pb-2"
                    >
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0]?.imageUrl && (
                          <img
                            src={item.product.images[0].imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.product?.name ?? "Deleted Product"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-800">
                        Ksh {item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* My Products */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">My Products</h2>
          <Link href="/products/new">
            <Button className="bg-black text-white hover:bg-gray-800 transition">
              + Add Product
            </Button>
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : products.length === 0 ? (
          <Card className="p-8 text-center text-gray-500 shadow-sm">
            You haven’t listed any products yet.
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <div className="relative h-48 bg-gray-50">
                  {product.images?.[0]?.imageUrl ? (
                    <img
                      src={product.images[0].imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-t-2xl"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-lg text-gray-800 mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-lg font-semibold text-gray-900">
                      Ksh {product.price}
                    </p>
                    <span className="text-gray-500 capitalize">
                      {product.condition}
                    </span>
                  </div>

                  <Link href={`/products/${product.id}`}>
                    <Button
                      className="w-full mt-4 border border-gray-300 hover:bg-gray-100"
                      variant="outline"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
