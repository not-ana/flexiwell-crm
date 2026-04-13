/**
 * Script para criar produtos e preços no Stripe
 *
 * Execute com: npx ts-node --esm scripts/setup-stripe-products.ts
 */

import Stripe from "stripe";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Carrega variáveis de ambiente
dotenv.config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

// Plan definitions (prices in cents)
// Retention Pro: $799/mo or $549/mo (annual = $6,588/yr)
// Retention Pro — Founding Member: $299/mo (locked 24 months)
// Retention Pro — Early Adopter: $499/mo (locked 12 months)
const plans = [
  {
    id: "retention_pro",
    name: "FlexiWell Retention Pro",
    description: "The Retention Engine™ for established studios. Unlimited clients and team.",
    monthlyPrice: 79900, // $799/mo
    annualPrice: 658800, // $6,588/yr ($549/mo)
  },
  {
    id: "retention_pro_founding",
    name: "FlexiWell Retention Pro — Founding Member",
    description: "Founding Member pricing. Full Retention Engine™ locked at $299/mo for 24 months.",
    monthlyPrice: 29900, // $299/mo (locked 24 months)
    annualPrice: 0, // monthly only
  },
  {
    id: "retention_pro_early_adopter",
    name: "FlexiWell Retention Pro — Early Adopter",
    description: "Early Adopter pricing. Full Retention Engine™ locked at $499/mo for 12 months.",
    monthlyPrice: 49900, // $499/mo (locked 12 months)
    annualPrice: 0, // monthly only
  },
];

// Definição dos add-ons
const addons = [
  {
    id: "whatsapp",
    name: "Extra WhatsApp Messages",
    description: "Additional 1,000 WhatsApp Bot messages per month",
    price: 1900,
    recurring: true,
  },
  {
    id: "ai",
    name: "Extra AI Chats",
    description: "Additional 500 AI Support chats per month",
    price: 2900,
    recurring: true,
  },
  {
    id: "sms",
    name: "SMS Bundle (1000)",
    description: "1000 SMS credits for notifications and reminders",
    price: 2500,
    recurring: true,
  },
  {
    id: "storage",
    name: "Additional Storage (50GB)",
    description: "Add 50GB of storage to your account",
    price: 1500,
    recurring: true,
  },
  {
    id: "migration",
    name: "White Glove Migration",
    description: "Full-service data migration from your current platform",
    price: 29900,
    recurring: false,
  },
];

async function createProducts() {
  console.log("🚀 Iniciando criação de produtos no Stripe...\n");

  const envUpdates: string[] = [];

  // Criar planos
  console.log("📦 Criando planos...\n");

  for (const plan of plans) {
    try {
      // Criar produto
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
        },
      });
      console.log(`✅ Produto criado: ${plan.name} (${product.id})`);

      // Criar preço mensal
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: "usd",
        recurring: {
          interval: "month",
        },
        metadata: {
          plan_id: plan.id,
          billing_period: "monthly",
        },
      });
      console.log(`   💵 Preço mensal: $${plan.monthlyPrice / 100}/mês (${monthlyPrice.id})`);
      envUpdates.push(`STRIPE_PRICE_${plan.id.toUpperCase()}_MONTHLY=${monthlyPrice.id}`);

      // Criar preço anual
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annualPrice,
        currency: "usd",
        recurring: {
          interval: "year",
        },
        metadata: {
          plan_id: plan.id,
          billing_period: "annual",
        },
      });
      console.log(`   💵 Preço anual: $${plan.annualPrice / 100}/ano (${annualPrice.id})`);
      envUpdates.push(`STRIPE_PRICE_${plan.id.toUpperCase()}_ANNUAL=${annualPrice.id}`);

      console.log("");
    } catch (error) {
      console.error(`❌ Erro ao criar plano ${plan.name}:`, error);
    }
  }

  // Criar add-ons
  console.log("\n📦 Criando add-ons...\n");

  for (const addon of addons) {
    try {
      // Criar produto
      const product = await stripe.products.create({
        name: addon.name,
        description: addon.description,
        metadata: {
          addon_id: addon.id,
        },
      });
      console.log(`✅ Add-on criado: ${addon.name} (${product.id})`);

      // Criar preço
      const priceParams: Stripe.PriceCreateParams = {
        product: product.id,
        unit_amount: addon.price,
        currency: "usd",
        metadata: {
          addon_id: addon.id,
        },
      };

      if (addon.recurring) {
        priceParams.recurring = {
          interval: "month",
        };
      }

      const price = await stripe.prices.create(priceParams);
      const priceLabel = addon.recurring ? `$${addon.price / 100}/mês` : `$${addon.price / 100} (único)`;
      console.log(`   💵 Preço: ${priceLabel} (${price.id})`);

      const envKey = `STRIPE_PRICE_ADDON_${addon.id.toUpperCase()}`;
      envUpdates.push(`${envKey}=${price.id}`);

      console.log("");
    } catch (error) {
      console.error(`❌ Erro ao criar add-on ${addon.name}:`, error);
    }
  }

  // Mostrar variáveis para o .env
  console.log("\n" + "=".repeat(60));
  console.log("📋 COPIE ESTAS VARIÁVEIS PARA SEU .env.local:");
  console.log("=".repeat(60) + "\n");

  for (const update of envUpdates) {
    console.log(update);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Produtos criados com sucesso!");
  console.log("=".repeat(60));

  // Tentar atualizar o .env.local automaticamente
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = fs.readFileSync(envPath, "utf-8");

    for (const update of envUpdates) {
      const [key, value] = update.split("=");
      const regex = new RegExp(`^${key}=.*$`, "m");

      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      }
    }

    fs.writeFileSync(envPath, envContent);
    console.log("\n✅ .env.local atualizado automaticamente!");
  } catch {
    console.log("\n⚠️  Não foi possível atualizar o .env.local automaticamente.");
    console.log("   Copie as variáveis acima manualmente.");
  }
}

// Executar
createProducts().catch(console.error);
