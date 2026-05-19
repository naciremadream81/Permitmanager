import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[Stripe] Signature error:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: sub.customer as string },
      });
      if (org) {
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            orgId: org.id,
            stripeSubscriptionId: sub.id,
            plan: sub.items.data[0]?.price?.lookup_key ?? 'pro',
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            seats: sub.items.data[0]?.quantity ?? 1,
          },
          update: {
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            seats: sub.items.data[0]?.quantity ?? 1,
          },
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'cancelled' },
      });
    }
  } catch (err) {
    console.error('[Stripe] Handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
