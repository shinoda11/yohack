// Extracted from server/routers.ts L190-242
// Stripe Checkout session creation — reference only (Phase 2-3)

import { z } from "zod";
import { PRODUCTS } from "./products";

// createCheckoutSession
const input = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

// Check if user already has active Pass subscription
const hasActivePass = await hasActivePassSubscription(input.email);
if (hasActivePass) {
  throw new Error("既にアクティブなPass購入があります");
}

const product = PRODUCTS.PASS_90_DAYS;
const origin = ctx.req.headers.origin || "http://localhost:3000";

const session = await stripe.checkout.sessions.create({
  mode: "payment",
  payment_method_types: ["card"],
  line_items: [
    {
      price_data: {
        currency: product.currency,
        product_data: {
          name: product.name,
          description: product.description,
        },
        unit_amount: product.price,
      },
      quantity: 1,
    },
  ],
  customer_email: input.email,
  client_reference_id: input.email,
  metadata: {
    product_type: "pass",
    customer_email: input.email,
    customer_name: input.name || "",
    duration_days: product.durationDays.toString(),
  },
  success_url: `${origin}/pass/onboarding?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/fit-result?result=ready`,
  allow_promotion_codes: true,
});
