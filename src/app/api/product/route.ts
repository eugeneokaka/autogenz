import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // make sure you have this helper
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
        seller: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, price, condition, category, images } = body;

    if (!name || !price || !condition)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    // find seller
    const seller = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!seller)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        condition,
        category,
        sellerId: seller.id,
        images: {
          create: images?.map((url: string) => ({ imageUrl: url })) || [],
        },
      },
      include: { images: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
