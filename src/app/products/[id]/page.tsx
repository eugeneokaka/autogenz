"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  condition: string;
  category?: string;
  images?: { id: string; imageUrl: string }[];
  seller?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    imageUrl?: string;
  };
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/product/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please sign in to add to cart.");
      return;
    }
    if (!product) return;

    try {
      const res = await fetch("/api/cart/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userClerkId: user.id,
          productId: product.id,
          quantity: 1, // fixed quantity
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add to cart");
        return;
      }

      toast.success("Product added to cart!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );

  if (!product)
    return (
      <p className="text-center text-muted-foreground mt-10">
        Product not found.
      </p>
    );

  const images = product.images || [];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <Card className="shadow-md border border-border/40">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
          <p className="text-muted-foreground capitalize text-sm mt-1">
            {product.category} • {product.condition}
          </p>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Product Images */}
          <div className="space-y-2">
            {images.length > 0 ? (
              <Image
                src={images[0].imageUrl}
                alt={product.name}
                width={600}
                height={400}
                className="rounded-lg object-cover w-full h-80 border"
              />
            ) : (
              <div className="w-full h-80 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1).map((img) => (
                  <Image
                    key={img.id}
                    src={img.imageUrl}
                    alt="Product"
                    width={100}
                    height={100}
                    className="rounded-md object-cover h-20 w-full border"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">
              KSh {product.price?.toLocaleString()}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {product.description || "No description available."}
            </p>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="bg-black text-white hover:bg-gray-800 mt-4"
            >
              Add to Cart
            </Button>

            {/* Seller Info */}
            <div className="mt-4 border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Seller Information</h3>
              <div className="flex items-center gap-3">
                {product.seller?.imageUrl ? (
                  <Image
                    src={product.seller.imageUrl}
                    alt="Seller"
                    width={40}
                    height={40}
                    className="rounded-full border"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                )}
                <div>
                  <p className="font-medium">
                    {product.seller?.firstName} {product.seller?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.seller?.email && (
                      <span>Email: {product.seller.email}</span>
                    )}
                    {product.seller?.phone && (
                      <span> • Phone: {product.seller.phone}</span>
                    )}
                    {!product.seller?.email &&
                      !product.seller?.phone &&
                      "No contact info"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
