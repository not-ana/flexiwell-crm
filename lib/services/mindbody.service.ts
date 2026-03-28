// Mindbody API v6 Integration Service
// Docs: https://developers.mindbodyonline.com/PublicDocumentation/V6

import { getDatabase } from "@/lib/db/mongodb";

const BASE_URL = "https://api.mindbodyonline.com/public/v6";

interface MindbodyCredentials {
  siteId: string;
  apiKey: string;
  username: string;
  password: string;
}

// Mindbody API response types
interface MindbodyClient {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  MobilePhone: string;
  HomePhone: string;
  BirthDate: string | null;
  Gender: string;
  Status: string;
  CreationDate: string;
  Active: boolean;
  Address?: {
    AddressLine1: string;
    City: string;
    State: string;
    PostalCode: string;
    Country: string;
  };
  EmergencyContactInfoName?: string;
  EmergencyContactInfoPhone?: string;
}

interface MindbodyVisit {
  Id: number;
  ClientId: string;
  ClassId: number;
  ClassName: string;
  StaffName: string;
  StartDateTime: string;
  EndDateTime: string;
  SignedIn: boolean;
  LateCancelled: boolean;
  Missed: boolean;
}

interface MindbodyContract {
  Id: number;
  ClientId: string;
  ContractName: string;
  StartDate: string;
  EndDate: string;
  AutopaySchedule?: {
    Amount: number;
    FrequencyType: string;
  };
  RemainingSessionCount: number | null;
  AgreementDate: string;
  IsActive: boolean;
}

interface PaginatedResponse<T> {
  PaginationResponse: {
    RequestedLimit: number;
    RequestedOffset: number;
    PageSize: number;
    TotalResults: number;
  };
  [key: string]: T[] | unknown;
}

export class MindbodyService {
  private credentials: MindbodyCredentials;
  private userToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(credentials: MindbodyCredentials) {
    this.credentials = credentials;
  }

  /**
   * Load credentials from the database
   */
  static async fromDatabase(): Promise<MindbodyService> {
    const db = await getDatabase();
    const creds = await db.collection("integration_credentials").findOne({ provider: "mindbody" });

    if (!creds || !creds.siteId || !creds.apiKey || !creds.username || !creds.password) {
      throw new Error("Mindbody credentials not configured. Go to Settings > Integrations to connect.");
    }

    return new MindbodyService({
      siteId: creds.siteId,
      apiKey: creds.apiKey,
      username: creds.username,
      password: creds.password,
    });
  }

  /**
   * Authenticate and get a user token
   */
  async authenticate(): Promise<string> {
    // Reuse token if still valid (tokens last 7 days of non-use)
    if (this.userToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.userToken;
    }

    const response = await this.request("POST", "/usertoken/issue", {
      Username: this.credentials.username,
      Password: this.credentials.password,
    });

    this.userToken = response.AccessToken;
    // Tokens expire after 7 days of non-use; refresh after 6 days to be safe
    this.tokenExpiresAt = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);

    return this.userToken!;
  }

  /**
   * Get all clients, paginated
   */
  async getClients(offset = 0, limit = 200): Promise<{ clients: MindbodyClient[]; total: number }> {
    const token = await this.authenticate();
    const response = await this.request("GET", `/client/clients?Limit=${limit}&Offset=${offset}`, undefined, token);

    return {
      clients: response.Clients || [],
      total: response.PaginationResponse?.TotalResults || 0,
    };
  }

  /**
   * Get all clients across all pages
   */
  async getAllClients(): Promise<MindbodyClient[]> {
    const allClients: MindbodyClient[] = [];
    let offset = 0;
    const limit = 200;

    while (true) {
      const { clients, total } = await this.getClients(offset, limit);
      allClients.push(...clients);

      if (allClients.length >= total || clients.length === 0) break;
      offset += limit;
    }

    return allClients;
  }

  /**
   * Get visit history for a specific client
   */
  async getClientVisits(clientId: string, startDate: Date, endDate: Date): Promise<MindbodyVisit[]> {
    const token = await this.authenticate();
    const allVisits: MindbodyVisit[] = [];
    let offset = 0;
    const limit = 200;

    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    while (true) {
      const response = await this.request(
        "GET",
        `/client/clientvisits?ClientId=${clientId}&StartDate=${start}&EndDate=${end}&Limit=${limit}&Offset=${offset}`,
        undefined,
        token
      );

      const visits: MindbodyVisit[] = response.Visits || [];
      allVisits.push(...visits);

      const total = response.PaginationResponse?.TotalResults || 0;
      if (allVisits.length >= total || visits.length === 0) break;
      offset += limit;
    }

    return allVisits;
  }

  /**
   * Get active contracts/memberships
   */
  async getClientContracts(clientId: string): Promise<MindbodyContract[]> {
    const token = await this.authenticate();
    const response = await this.request(
      "GET",
      `/client/clientcontracts?ClientId=${clientId}`,
      undefined,
      token
    );

    return response.Contracts || [];
  }

  /**
   * Make an API request with retry on rate limit
   */
  private async request(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>,
    userToken?: string
  ): Promise<Record<string, any>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Api-Key": this.credentials.apiKey,
      "SiteId": this.credentials.siteId,
    };

    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }

    const options: RequestInit = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    // Retry with backoff on 429
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${BASE_URL}${path}`, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "5");
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000 * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Mindbody API error ${response.status}: ${errorBody}`);
      }

      return response.json();
    }

    throw new Error("Mindbody API rate limit exceeded after 3 retries");
  }
}

// --- Data mapping utilities ---

export function mapMindbodyClientStatus(mbClient: MindbodyClient): "active" | "inactive" | "pending" {
  if (mbClient.Active && mbClient.Status?.toLowerCase() !== "declined") return "active";
  if (mbClient.Status?.toLowerCase() === "suspended") return "inactive";
  return "inactive";
}

export function mapMindbodyPlanType(contractName: string): "monthly" | "quarterly" | "annual" | "drop-in" {
  const name = contractName.toLowerCase();
  if (name.includes("annual") || name.includes("yearly") || name.includes("year")) return "annual";
  if (name.includes("quarter") || name.includes("3 month") || name.includes("3-month")) return "quarterly";
  if (name.includes("drop") || name.includes("single") || name.includes("punch") || name.includes("pack")) return "drop-in";
  return "monthly";
}

export function mapVisitToBookingStatus(visit: MindbodyVisit): "completed" | "cancelled" | "no-show" {
  if (visit.LateCancelled) return "cancelled";
  if (visit.Missed || !visit.SignedIn) return "no-show";
  return "completed";
}