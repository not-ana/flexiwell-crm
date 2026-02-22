export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  image: string;
  category: "equipment" | "accessories" | "apparel";
  inStock: boolean;
  badge?: "Best Seller" | "New" | "Sale";
  weight: number; // oz
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  isFree?: boolean;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ShopCheckoutFormData {
  email: string;
  shipping: ShippingAddress;
  shippingMethodId: string;
  sameAsShipping: boolean;
  billing: ShippingAddress;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardholderName: string;
  savePaymentMethod: boolean;
  agreeToTerms: boolean;
}

export interface ShopOrderDetails {
  orderNumber: string;
  items: { name: string; sku: string; quantity: number; price: number; image: string }[];
  subtotal: number;
  shipping: number;
  shippingMethod: string;
  estimatedTax: number;
  discount: number;
  total: number;
  email: string;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  date: string;
  estimatedDelivery: string;
}

export type ShopCheckoutStep = 1 | 2 | 3 | 4 | 5;

export const EMPTY_ADDRESS: ShippingAddress = {
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
};

export const INITIAL_SHOP_FORM: ShopCheckoutFormData = {
  email: "",
  shipping: { ...EMPTY_ADDRESS },
  shippingMethodId: "standard",
  sameAsShipping: true,
  billing: { ...EMPTY_ADDRESS },
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
  cardholderName: "",
  savePaymentMethod: false,
  agreeToTerms: false,
};
