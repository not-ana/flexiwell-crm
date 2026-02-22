export interface PlanPackage {
  id: string;
  name: string;
  description: string;
  classes: number;
  duration: string;
  price: number;
  pricePerClass: number;
  popular?: boolean;
  bestValue?: boolean;
  savings?: number;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  selected: boolean;
}

export interface CheckoutFormData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  paymentMethod: "credit-card";
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardholderName: string;
  savePaymentMethod: boolean;
  agreeToTerms: boolean;
}

export interface OrderDetails {
  orderNumber: string;
  planName: string;
  classes: number;
  duration: string;
  amount: number;
  paymentMethod: string;
  date: string;
  startDate: string;
  endDate: string;
}

export const AVAILABLE_ADD_ONS: AddOn[] = [
  {
    id: "private-session",
    name: "Private Session Add-on",
    description: "One 1-on-1 private session with an instructor",
    price: 90,
    selected: false,
  },
  {
    id: "equipment-rental",
    name: "Equipment Rental",
    description: "Personal reformer equipment for home practice",
    price: 45,
    selected: false,
  },
];
