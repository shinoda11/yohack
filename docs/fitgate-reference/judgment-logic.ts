// Extracted from server/routers.ts L62-155
// FitGate judgment logic — reference only

import { z } from "zod";

// Input schema (tRPC)
const fitGateInput = z.object({
  email: z.string().email().optional(),
  q1DecisionDeadline: z.string(),
  q2HousingStatus: z.string(),
  q3PriceRange: z.string(),
  q4IncomeRange: z.string(),
  q5AssetRange: z.string(),
  q6NumberInputTolerance: z.string(),
  q7CareerChange: z.string(),
  q8LifeEvent: z.string(),
  q9CurrentQuestion: z.string(),
  q10PreferredApproach: z.string(),
  q11PrivacyConsent: z.boolean(),
  q12BudgetSense: z.string(),
  invitationToken: z.string().optional(),
});

// Judgment logic
let judgmentResult: "prep" | "ready" | "session" = "prep";

// Check invitation token
let hasValidToken = false;
// (token validation logic removed — Phase 2)

// Judgment criteria
const incomeOk = ["世帯年収1,500万～2,499万", "世帯年収2,500万以上"].includes(input.q4IncomeRange);
const assetOk = ["金融資産・流動性資産を2,000万～4,999万", "金融資産・流動性資産を5,000万以上"].includes(input.q5AssetRange);
const numberInputOk = input.q6NumberInputTolerance === "年収/資産/支出/物件価格を入力できる";
const budgetOk = ["3万～4.9万なら検討", "5万円以上でも意思決定が進むなら払う"].includes(input.q12BudgetSense);

// Prep bucket classification (near vs notyet)
let prepBucket: "near" | "notyet" | undefined = undefined;

if (hasValidToken && incomeOk && assetOk && numberInputOk) {
  judgmentResult = "session";
} else if (incomeOk && assetOk && numberInputOk && budgetOk) {
  judgmentResult = "ready";
} else {
  judgmentResult = "prep";

  // Classify prep into near or notyet
  const decisionUrgent = ["決断期限3か月以内", "決断期限3～6か月"].includes(input.q1DecisionDeadline || "");
  const housingActive = ["物件を見ている", "資金計画を立てている"].includes(input.q2HousingStatus || "");
  const numberInputWilling = input.q6NumberInputTolerance !== "入力したくない";

  // notyet: 意思決定期限が「未定」or「6か月以上」かつ住宅「まだ漠然」かつ数字「入力したくない」
  if (!decisionUrgent && !housingActive && !numberInputWilling) {
    prepBucket = "notyet";
  } else {
    prepBucket = "near";
  }
}

// NOTE: "session" judgment is invitation-token based (Phase 2).
// For Phase 1, only "ready" and "prep" are used.
// NOTE: The q4/q5 values in routers.ts have prefixes like "世帯年収" and "金融資産・流動性資産を"
// but FitGate.tsx radio values do NOT have these prefixes. The old system added them somewhere.
// For the new implementation, match against the actual radio values from FitGate.tsx.
