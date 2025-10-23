import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userClerkId = searchParams.get("userClerkId");

    if (!userClerkId)
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userClerkId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: { images: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // If user has no cart yet
    if (!user.cart) return NextResponse.json({ items: [] });

    return NextResponse.json({ items: user.cart.items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userClerkId, productId, quantity } = await req.json();

    if (!userClerkId || !productId || !quantity) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Find the user
    const user = await prisma.user.findUnique({
      where: { clerkId: userClerkId },
      include: { cart: { include: { items: true } } },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. Create cart if not exists
    let cart = user.cart;
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: { items: true },
      });
    }

    // 3. Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.productId === productId
    );

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
