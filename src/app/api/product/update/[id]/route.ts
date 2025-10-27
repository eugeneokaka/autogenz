import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// 🟢 Get single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    const product = await prisma.product.findUnique({
      where: { id: id },
      include: { images: true },
    });

    if (!product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(product);
  } catch (err) {
    console.error("GET product error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🟡 Update product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!seller)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, description, price, condition, stock, images } = body;

    // 🧩 Update product info
    const updatedProduct = await prisma.product.update({
      where: { id: id, sellerId: seller.id },
      data: {
        name,
        description,
        price: parseFloat(price),
        condition,
        stock: parseInt(stock),
      },
    });

    // 🖼 Update product images (delete old + create new)
    if (images && Array.isArray(images)) {
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((url: string) => ({
            imageUrl: url,
            productId: id,
          })),
        });
      }
    }

    const final = await prisma.product.findUnique({
      where: { id: id },
      include: { images: true },
    });

    return NextResponse.json(final);
  } catch (err) {
    console.error("Error updating product:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
