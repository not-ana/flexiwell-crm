import { describe, it, expect } from "vitest";
import {
  pricingPlans,
  formatPrice,
  calculateAnnualSavings,
  getPlanByTier,
  getTransactionFee,
  getAvailableAddOns,
  isFeatureAvailable,
  getPlanRecommendation,
} from "@/lib/config/pricing";

describe("Pricing Utils", () => {
  describe("pricingPlans", () => {
    it("should have all required plan tiers (4 plans)", () => {
      const planIds = pricingPlans.map((p) => p.id);
      expect(planIds).toContain("starter");
      expect(planIds).toContain("growth");
      expect(planIds).toContain("business");
      expect(planIds).toContain("enterprise");
      expect(planIds.length).toBe(4);
    });

    it("should have monthly and annual prices for each plan", () => {
      pricingPlans.forEach((plan) => {
        expect(plan.pricing).toHaveProperty("monthly");
        expect(plan.pricing).toHaveProperty("annual");
        expect(typeof plan.pricing.monthly).toBe("number");
        expect(typeof plan.pricing.annual).toBe("number");
      });
    });

    it("should have annual price lower than monthly for non-enterprise plans", () => {
      pricingPlans
        .filter((plan) => !plan.pricing.customPricing)
        .forEach((plan) => {
          expect(plan.pricing.annual).toBeLessThan(plan.pricing.monthly);
        });
    });

    it("should have features array for each plan", () => {
      pricingPlans.forEach((plan) => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it("should mark business plan as highlighted", () => {
      const businessPlan = pricingPlans.find((p) => p.id === "business");
      expect(businessPlan?.highlighted).toBe(true);
      expect(businessPlan?.badge).toBe("Most popular");
    });

    it("should have unlimited team members for all plans", () => {
      pricingPlans.forEach((plan) => {
        expect(plan.limits.teamMembers).toBe("unlimited");
      });
    });
  });

  describe("getPlanByTier", () => {
    it("should return correct plan for starter tier", () => {
      const plan = getPlanByTier("starter");
      expect(plan.id).toBe("starter");
      expect(plan.pricing.monthly).toBe(49);
    });

    it("should return correct plan for business tier", () => {
      const plan = getPlanByTier("business");
      expect(plan.id).toBe("business");
      expect(plan.pricing.monthly).toBe(249);
    });
  });

  describe("formatPrice", () => {
    it("should format price with USD symbol by default", () => {
      const formatted = formatPrice(99);
      expect(formatted).toBe("$99");
    });

    it("should handle zero price", () => {
      const formatted = formatPrice(0);
      expect(formatted).toBe("$0");
    });

    it("should format with BRL currency", () => {
      const formatted = formatPrice(199, "BRL");
      expect(formatted).toBe("R$199");
    });

    it("should format with EUR currency", () => {
      const formatted = formatPrice(149, "EUR");
      expect(formatted).toBe("€149");
    });
  });

  describe("calculateAnnualSavings", () => {
    it("should calculate savings for starter plan", () => {
      const starterPlan = getPlanByTier("starter");
      const savings = calculateAnnualSavings(starterPlan);
      // monthly: 49 * 12 = 588, annualTotal: 468, savings: 120
      expect(savings).toBe(120);
    });

    it("should calculate savings for business plan", () => {
      const businessPlan = getPlanByTier("business");
      const savings = calculateAnnualSavings(businessPlan);
      // monthly: 249 * 12 = 2988, annualTotal: 2388, savings: 600
      expect(savings).toBe(600);
    });

    it("should return 0 for enterprise plan (custom pricing)", () => {
      const enterprisePlan = getPlanByTier("enterprise");
      const savings = calculateAnnualSavings(enterprisePlan);
      expect(savings).toBe(0);
    });
  });

  describe("getTransactionFee", () => {
    it("should calculate correct fee for starter plan", () => {
      // 2.9% + $0.30
      const fee = getTransactionFee("starter", 100);
      expect(fee).toBeCloseTo(3.2, 2);
    });

    it("should calculate correct fee for business plan", () => {
      // 1.9% + $0.15
      const fee = getTransactionFee("business", 100);
      expect(fee).toBeCloseTo(2.05, 2);
    });
  });

  describe("getAvailableAddOns", () => {
    it("should return add-ons for business plan", () => {
      const addOns = getAvailableAddOns("business");
      expect(addOns.length).toBeGreaterThan(0);
      const addOnIds = addOns.map((a) => a.id);
      expect(addOnIds).toContain("extra_whatsapp_msgs");
      expect(addOnIds).toContain("extra_ai_chats");
    });

    it("should return SMS bundle for starter plan", () => {
      const addOns = getAvailableAddOns("starter");
      const addOnIds = addOns.map((a) => a.id);
      expect(addOnIds).toContain("sms_bundle");
    });
  });

  describe("isFeatureAvailable", () => {
    it("should return true for basic features on starter", () => {
      expect(isFeatureAvailable("online_scheduling", "starter")).toBe(true);
      expect(isFeatureAvailable("email_support", "starter")).toBe(true);
    });

    it("should return false for advanced features on starter", () => {
      expect(isFeatureAvailable("api_access", "starter")).toBe(false);
      expect(isFeatureAvailable("white_label", "starter")).toBe(false);
    });

    it("should return limit string for AI features on business", () => {
      expect(isFeatureAvailable("ai_support_assistant", "business")).toBe("2,000 chats/mo");
    });

    it("should return unlimited for AI features on enterprise", () => {
      expect(isFeatureAvailable("ai_support_assistant", "enterprise")).toBe("unlimited");
    });
  });

  describe("getPlanRecommendation", () => {
    it("should recommend starter for solo instructor", () => {
      const recommendation = getPlanRecommendation(50, 1, false, false);
      expect(recommendation).toBe("starter");
    });

    it("should recommend growth for growing studio", () => {
      const recommendation = getPlanRecommendation(200, 1, false, false);
      expect(recommendation).toBe("growth");
    });

    it("should recommend business for AI needs", () => {
      const recommendation = getPlanRecommendation(50, 1, true, false);
      expect(recommendation).toBe("business");
    });

    it("should recommend business for WhatsApp bot", () => {
      const recommendation = getPlanRecommendation(50, 1, false, true);
      expect(recommendation).toBe("business");
    });

    it("should recommend enterprise for large scale", () => {
      const recommendation = getPlanRecommendation(3000, 10, true, true);
      expect(recommendation).toBe("enterprise");
    });
  });
});
