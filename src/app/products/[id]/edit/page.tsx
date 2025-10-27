"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 🟢 Fetch product
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/product/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        data.images = data.images?.map((img: any) => img.imageUrl) || [];
        setProduct(data);
      } catch (err) {
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (key: string, value: any) =>
    setProduct({ ...product, [key]: value });

  const handleFileValidation = (files: FileList) => {
    for (let file of Array.from(files)) {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 4) {
        toast.error(`"${file.name}" is too large. Max 4MB.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/product/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }

      toast.success("✅ Product updated successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Error updating product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!product) return <p className="text-center mt-10">Product not found</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Name"
              value={product.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <Textarea
              placeholder="Description"
              value={product.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Price"
              value={product.price}
              onChange={(e) =>
                handleChange("price", parseFloat(e.target.value))
              }
            />
            <Input
              placeholder="Condition"
              value={product.condition}
              onChange={(e) => handleChange("condition", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Stock"
              value={product.stock}
              onChange={(e) => handleChange("stock", parseInt(e.target.value))}
            />

            {/* 🖼 Upload Images */}
            <div className="space-y-2">
              <Label>Upload Product Images (Max 4MB each)</Label>
              <div className="border border-dashed rounded-md p-4">
                <UploadButton<OurFileRouter, "imageUploader">
                  endpoint="imageUploader"
                  onBeforeUploadBegin={(files) => {
                    if (!handleFileValidation(files as unknown as FileList))
                      throw new Error("Invalid file");
                    return files;
                  }}
                  onUploadBegin={() => {
                    setUploading(true);
                    setProgress(0);
                    toast.message("Starting upload...");
                  }}
                  onUploadProgress={(p) => setProgress(p)}
                  onClientUploadComplete={(res) => {
                    const urls = res?.map((f) => f.url) || [];
                    setProduct({
                      ...product,
                      images: [...(product.images || []), ...urls],
                    });
                    setUploading(false);
                    setProgress(100);
                    toast.success("Images uploaded!");
                  }}
                  onUploadError={(err) => {
                    toast.error(`Upload failed: ${err.message}`);
                    setUploading(false);
                  }}
                />
              </div>

              {uploading && (
                <div className="mt-2">
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-black transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm mt-1">Uploading... {progress}%</p>
                </div>
              )}

              {product.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {product.images.map((url: string, i: number) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="rounded-md object-cover w-full h-24 border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-xs"
                        onClick={() =>
                          handleChange(
                            "images",
                            product.images.filter(
                              (_: any, idx: number) => idx !== i
                            )
                          )
                        }
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
