// /app/api/product/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            clerkId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            imageUrl: true,
            role: true,
            location: true,
            hasCompletedOnboarding: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.log("Fetched product:", product);

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!seller)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
      name,
      description,
      price,
      condition,
      stock,
      category,
      model,
      brand,
      images,
    } = body;

    const data: any = {
      name,
      description,
      price: parseFloat(price),
      condition,
      stock: parseInt(stock),
      category,
      model,
      brand,
    };

    // ✅ If images array is present, replace them
    if (Array.isArray(images)) {
      data.images = {
        deleteMany: {}, // remove old
        create: images.map((img: any) => ({
          imageUrl: typeof img === "string" ? img : img.imageUrl,
        })),
      };
    }

    const updated = await prisma.product.update({
      where: { id, sellerId: seller.id },
      data,
      include: { images: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating product:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
