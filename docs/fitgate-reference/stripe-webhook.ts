import { Request, Response } from "express";
import { stripe } from "../stripe";
import { insertPassSubscription } from "../db";
import { PRODUCTS } from "../products";

function generateRandomPassword(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing stripe-signature header");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).send("Webhook secret not configured");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Test event handling (CRITICAL for webhook verification)
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata;

        if (!metadata || metadata.product_type !== "pass") {
          console.log("[Webhook] Not a Pass purchase, skipping");
          break;
        }

        const email = metadata.customer_email;
        const durationDays = parseInt(metadata.duration_days || "90", 10);
        const stripeSessionId = session.id;

        if (!email) {
          console.error("[Webhook] Missing customer_email in metadata");
          break;
        }

        // Idempotency check: Check if this session has already been processed
        const { getPassSubscriptionByStripeSessionId } = await import("../db");
        const existingSubscription = await getPassSubscriptionByStripeSessionId(stripeSessionId);
        
        if (existingSubscription) {
          console.log(`[Webhook] Session ${stripeSessionId} already processed, skipping`);
          break;
        }

        // Calculate expiry date (90 days from now)
        const purchaseDate = new Date();
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        // Generate login credentials for Vercel app
        const loginId = email;
        const loginPassword = generateRandomPassword(12);

        // Insert Pass subscription
        await insertPassSubscription({
          email,
          stripeCustomerId: session.customer as string,
          stripePaymentIntentId: session.payment_intent as string,
          stripeSessionId,
          loginId,
          loginPassword,
          purchaseDate,
          expiryDate,
          price: PRODUCTS.PASS_90_DAYS.price,
          status: "active",
        });

        console.log(`[Webhook] Pass subscription created for ${email}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent as string;

        if (!paymentIntentId) {
          console.error("[Webhook] Missing payment_intent in charge.refunded event");
          break;
        }

        // Find Pass subscription by payment intent ID and mark as cancelled
        const { getPassSubscriptionByPaymentIntentId, updatePassSubscriptionStatus } = await import("../db");
        const subscription = await getPassSubscriptionByPaymentIntentId(paymentIntentId);

        if (subscription) {
          await updatePassSubscriptionStatus(subscription.id, "cancelled");
          console.log(`[Webhook] Pass subscription ${subscription.id} cancelled due to refund`);
        } else {
          console.log(`[Webhook] No Pass subscription found for payment intent ${paymentIntentId}`);
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object;
        const chargeId = dispute.charge as string;

        if (!chargeId) {
          console.error("[Webhook] Missing charge in charge.dispute.created event");
          break;
        }

        // Retrieve charge to get payment intent
        const charge = await stripe.charges.retrieve(chargeId);
        const paymentIntentId = charge.payment_intent as string;

        if (!paymentIntentId) {
          console.error("[Webhook] Missing payment_intent in charge");
          break;
        }

        // Find Pass subscription by payment intent ID and mark as cancelled
        const { getPassSubscriptionByPaymentIntentId, updatePassSubscriptionStatus } = await import("../db");
        const subscription = await getPassSubscriptionByPaymentIntentId(paymentIntentId);

        if (subscription) {
          await updatePassSubscriptionStatus(subscription.id, "cancelled");
          console.log(`[Webhook] Pass subscription ${subscription.id} cancelled due to chargeback dispute`);
        } else {
          console.log(`[Webhook] No Pass subscription found for payment intent ${paymentIntentId}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).send("Webhook processing failed");
  }
}
