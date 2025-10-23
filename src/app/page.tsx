"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  condition: string;
  category?: string;
  images: { imageUrl: string }[];
  seller: {
    firstName?: string;
    lastName?: string;
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/product");
        const data = await res.json();
        setProducts(data);
        setFiltered(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFilter = () => {
    let results = [...products];
    if (search) {
      results = results.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (minPrice) {
      results = results.filter((p) => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      results = results.filter((p) => p.price <= parseFloat(maxPrice));
    }
    setFiltered(results);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Search + Filters */}
      <div className="sticky top-0 bg-background z-10 pb-3 border-b border-border/40 mb-6">
        <div className="flex flex-wrap items-center gap-3 justify-center">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <Input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-32"
          />
          <Input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-32"
          />
          <Button
            onClick={handleFilter}
            className="bg-black text-white hover:bg-gray-800"
          >
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Products grid or skeletons */}
      {loading ? (
        <div className="flex flex-wrap justify-center gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card
              key={i}
              className="p-0 border border-border/40 rounded-xl w-72"
            >
              <CardContent className="p-4">
                <Skeleton className="w-full h-56 rounded-md mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground mt-10">
          No products found
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-8">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className="p-0 hover:shadow-md transition-all border border-border/40 rounded-xl overflow-hidden w-72"
            >
              <Link href={`/products/${product.id}`}>
                {/* Image fills the top completely with no gap */}
                <div className="relative w-full h-56 overflow-hidden">
                  <Image
                    src={product.images[0]?.imageUrl || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover h-full w-full"
                  />
                </div>

                <CardContent className="p-4 space-y-2">
                  <h2 className="text-lg font-semibold line-clamp-1">
                    {product.name}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>

                  <p className="text-base font-medium mt-2">
                    KES {product.price.toLocaleString()}
                  </p>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Condition: {product.condition}</span>
                    <span>
                      {product.seller?.firstName
                        ? `${product.seller.firstName} ${
                            product.seller.lastName || ""
                          }`
                        : "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
