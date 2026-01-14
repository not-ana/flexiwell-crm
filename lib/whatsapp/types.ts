// WhatsApp Integration Types

export type WhatsAppProvider = "twilio" | "cloud-api" | "meta" | "360dialog";

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  apiKey: string;
  phoneNumberId: string;
  webhookSecret: string;
  businessId: string;
}

// Twilio-specific credentials
export interface TwilioCredentials {
  provider: "twilio";
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Format: +14155238886
}

// WhatsApp Cloud API credentials (Meta official)
export interface CloudApiCredentials {
  provider: "cloud-api";
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  verifyToken: string;
}

// Union type for all WhatsApp credentials
export type WhatsAppCredentials = TwilioCredentials | CloudApiCredentials;

export interface WhatsAppMessage {
  id: string;
  from: string; // Phone number
  to: string;
  type: "text" | "interactive" | "template";
  timestamp: Date;
  content: TextContent | InteractiveContent | TemplateContent;
}

export interface TextContent {
  body: string;
}

export interface InteractiveContent {
  type: "button" | "list";
  header?: { type: "text"; text: string };
  body: { text: string };
  footer?: { text: string };
  action: ButtonAction | ListAction;
}

export interface ButtonAction {
  buttons: Array<{
    type: "reply";
    reply: { id: string; title: string };
  }>;
}

export interface ListAction {
  button: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

export interface TemplateContent {
  name: string;
  language: { code: string };
  components?: Array<{
    type: "header" | "body" | "button";
    parameters: Array<{ type: "text"; text: string }>;
  }>;
}

// Bot conversation state
export interface ConversationState {
  clientId: string;
  phoneNumber: string;
  currentFlow: BotFlow;
  step: number;
  data: Record<string, unknown>;
  lastInteraction: Date;
}

export type BotFlow =
  | "main_menu"
  | "view_classes"
  | "confirm_class"
  | "cancel_class"
  | "book_class"
  | "view_plan"
  | "talk_to_human";

// Webhook events
export interface WebhookEvent {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<IncomingMessage>;
        statuses?: Array<MessageStatus>;
      };
      field: string;
    }>;
  }>;
}

export interface IncomingMessage {
  id: string;
  from: string;
  timestamp: string;
  type: "text" | "interactive" | "button";
  text?: { body: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { payload: string; text: string };
}

export interface MessageStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
}

// Feature flags for plans
export interface WhatsAppPlanFeatures {
  viewClasses: boolean;
  confirmClass: boolean;
  cancelClass: boolean;
  bookNewClass: boolean;
  viewPlan: boolean;
  autoReminders: boolean;
  multiUnit: boolean;
  customTemplates: boolean;
  analytics: boolean;
  apiAccess: boolean;
  maxConversations: number;
}

export const WHATSAPP_PLANS: Record<string, WhatsAppPlanFeatures> = {
  starter: {
    viewClasses: true,
    confirmClass: true,
    cancelClass: false,
    bookNewClass: false,
    viewPlan: true,
    autoReminders: false,
    multiUnit: false,
    customTemplates: false,
    analytics: false,
    apiAccess: false,
    maxConversations: 500,
  },
  pro: {
    viewClasses: true,
    confirmClass: true,
    cancelClass: true,
    bookNewClass: true,
    viewPlan: true,
    autoReminders: true,
    multiUnit: false,
    customTemplates: false,
    analytics: true,
    apiAccess: false,
    maxConversations: 2000,
  },
  enterprise: {
    viewClasses: true,
    confirmClass: true,
    cancelClass: true,
    bookNewClass: true,
    viewPlan: true,
    autoReminders: true,
    multiUnit: true,
    customTemplates: true,
    analytics: true,
    apiAccess: true,
    maxConversations: -1, // Unlimited
  },
};
