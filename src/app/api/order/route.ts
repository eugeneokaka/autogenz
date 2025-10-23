import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userClerkId, pickupLocationId } = await req.json();

    if (!userClerkId)
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    if (!pickupLocationId)
      return NextResponse.json(
        { error: "Pickup location required" },
        { status: 400 }
      );

    const user = await prisma.user.findUnique({
      where: { clerkId: userClerkId },
      include: {
        cart: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!user || !user.cart)
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const items = user.cart.items.filter((i) => i.product !== null);
    if (!items.length)
      return NextResponse.json(
        { error: "No valid items in cart" },
        { status: 400 }
      );

    const totalAmount = items.reduce(
      (sum, i) => sum + (i.product?.price ?? 0) * i.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        buyer: { connect: { id: user.id } },
        pickupLocation: { connect: { id: pickupLocationId } },
        totalAmount,
        items: {
          create: items.map((i) => ({
            productId: i.productId!,
            quantity: i.quantity,
            price: i.product?.price ?? 0,
          })),
        },
      },
      include: { items: true, pickupLocation: true },
    });

    await prisma.cartItem.deleteMany({
      where: { cartId: user.cart.id },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Error placing order:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
