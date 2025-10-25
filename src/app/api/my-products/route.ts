import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // 🔒 Get logged-in user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🎯 Find user in your Prisma database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Fetch only products belonging to this logged-in user
    const products = await prisma.product.findMany({
      where: { sellerId: user.id },
      include: {
        images: true,
        orderItems: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("❌ Error fetching user products:", error);
    return NextResponse.json(
      { error: "Failed to fetch user products" },
      { status: 500 }
    );
  }
}
