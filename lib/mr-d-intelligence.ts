/**
 * Mr. D Intelligence Layer
 *
 * Analyzes invoice data for AI context. Uses Prisma for DB and date-fns for dates.
 * Designed to be modular and testable; foundation for Mr. D SDK.
 */

import { db as prisma } from "@/lib/db";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  format as fmtFns,
  formatDistanceToNow,
  differenceInDays,
  parseISO,
  isValid,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Prisma } from "@prisma/client";
import Groq from "groq-sdk";

// =============================================================================
// TYPES
// =============================================================================

export type Intent =
  | "revenue"
  | "unpaid"
  | "client"
  | "search"
  | "analytics"
  | "general";

export type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE";

export interface UserInvoiceContext {
  totalInvoices: number;
  totalRevenue: string;
  unpaidAmount: string;
  paymentRate: number;
  invoicesByStatus: { paid: number; unpaid: number; overdue: number };
  topClients: Array<{ name: string; revenue: string; invoiceCount: number }>;
  recentActivity: Array<{ date: string; action: string; invoice: string }>;
  monthlyTrend: Array<{ month: string; revenue: string; count: number }>;
}

export interface UnpaidInvoiceItem {
  invoiceNumber: string;
  clientName: string;
  amount: string;
  currency: string;
  dueDate: Date;
  dueDateFormatted: string;
  daysUntilDue: number;
  isOverdue: boolean;
  overdueWarning?: string;
}

export interface GetUnpaidInvoicesOptions {
  sortBy?: "dueDate" | "amount" | "clientName";
  clientName?: string;
  dueDateRange?: { start: Date; end: Date };
}

export interface RevenueAnalyticsResult {
  totalRevenue: string;
  paidCount: number;
  averageInvoiceAmount: string;
  monthOverMonthGrowthPercent: number | null;
  bestPerformingClient: { name: string; revenue: string } | null;
  busiestMonth: { month: string; revenue: string; count: number } | null;
  currency: string;
}

export interface ClientAnalysisItem {
  clientName: string;
  totalRevenue: string;
  averagePaymentTimeDays: number | null;
  paymentReliabilityScore: number;
  outstandingAmount: string;
  invoiceCount: number;
  paidCount: number;
  unpaidCount: number;
  currency: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Format a numeric amount with currency symbol/label.
 * @param amount - Numeric amount or string (e.g. from Decimal)
 * @param currency - Currency code (e.g. USDC, ETH)
 */
export function formatCurrency(amount: number | string, currency: string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "0 " + currency;
  const symbol =
    currency.toUpperCase() === "ETH" ? "ETH" : currency === "USDC" ? "USDC" : currency;
  return `${n.toFixed(2)} ${symbol}`;
}

/**
 * Format a date for display.
 * @param date - Date or ISO string
 * @param format - 'short' (MMM d, yyyy), 'long' (full), or 'relative' (e.g. "3 days ago")
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "relative" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "Invalid date";
  if (format === "relative") return formatDistanceToNow(d, { addSuffix: true });
  if (format === "long") return fmtFns(d, "EEEE, MMMM d, yyyy");
  return fmtFns(d, "MMM d, yyyy");
}

/**
 * Payment rate as percentage string (e.g. "85.5%").
 */
export function calculatePaymentRate(paid: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((paid / total) * 100).toFixed(1)}%`;
}

/**
 * Whether the due date is in the past.
 */
export function isOverdue(dueDate: Date | string): boolean {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return isValid(d) && d < new Date();
}

/**
 * Days until due (negative = overdue).
 */
export function getDaysUntilDue(dueDate: Date | string): number {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (!isValid(d)) return 0;
  return differenceInDays(d, new Date());
}

/** Amount to number helper (schema uses amount as String). */
function amountToNumber(
  value: string | number | null | undefined | { toString(): string }
): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const s = typeof value === "string" ? value : String(value);
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Returns comprehensive invoice data for AI context.
 * @param userId - Prisma User id (owner of invoices)
 */
export async function getUserInvoiceContext(
  userId: string
): Promise<UserInvoiceContext> {
  const [allInvoices, byStatus, recentInvoices, monthlyData] =
    await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          currency: true,
          status: true,
          clientName: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
        },
      }),
      prisma.invoice.groupBy({
        by: ["status"],
        where: { userId },
        _count: { id: true },
      }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          invoiceNumber: true,
          status: true,
          amount: true,
          currency: true,
          clientName: true,
          createdAt: true,
          paidAt: true,
        },
      }),
      prisma.invoice.findMany({
        where: { userId, status: "PAID" },
        select: { amount: true, currency: true, paidAt: true },
      }),
    ]);

  const totalRevenueNum = allInvoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + amountToNumber(i.amount), 0);
  const unpaidAmountNum = allInvoices
    .filter((i) => i.status === "UNPAID" || i.status === "OVERDUE")
    .reduce((s, i) => s + amountToNumber(i.amount), 0);
  const totalAmount = totalRevenueNum + unpaidAmountNum;
  const paymentRate = totalAmount > 0 ? (totalRevenueNum / totalAmount) * 100 : 0;
  const primaryCurrency = allInvoices[0]?.currency ?? "USDC";

  const invoicesByStatus = {
    paid: 0,
    unpaid: 0,
    overdue: 0,
  };
  byStatus.forEach((r) => {
    if (r.status === "PAID") invoicesByStatus.paid = r._count.id;
    else if (r.status === "UNPAID") invoicesByStatus.unpaid = r._count.id;
    else if (r.status === "OVERDUE") invoicesByStatus.overdue = r._count.id;
  });

  const clientRevenue = new Map<string, { revenue: number; count: number }>();
  allInvoices.forEach((inv) => {
    if (inv.status !== "PAID") return;
    const amt = amountToNumber(inv.amount);
    const cur = inv.currency;
    const existing = clientRevenue.get(inv.clientName);
    if (existing) {
      existing.revenue += amt;
      existing.count += 1;
    } else {
      clientRevenue.set(inv.clientName, { revenue: amt, count: 1 });
    }
  });
  const topClients = Array.from(clientRevenue.entries())
    .map(([name, { revenue, count }]) => ({
      name,
      revenue: formatCurrency(revenue, primaryCurrency),
      invoiceCount: count,
    }))
    .sort((a, b) => {
      const aNum = parseFloat(a.revenue);
      const bNum = parseFloat(b.revenue);
      return (Number.isNaN(bNum) ? 0 : bNum) - (Number.isNaN(aNum) ? 0 : aNum);
    })
    .slice(0, 5);

  const recentActivity = recentInvoices.map((i) => {
    const action =
      i.status === "PAID"
        ? "Paid"
        : i.status === "OVERDUE"
          ? "Overdue"
          : "Unpaid";
    const invLabel = `${i.invoiceNumber} (${i.clientName}) ${formatCurrency(amountToNumber(i.amount), i.currency)}`;
    const date = i.paidAt ?? i.createdAt;
    return {
      date: formatDate(date, "short"),
      action,
      invoice: invLabel,
    };
  });

  const monthMap = new Map<
    string,
    { revenue: number; count: number; currency: string }
  >();
  monthlyData.forEach((i) => {
    const d = i.paidAt;
    if (!d) return;
    const key = fmtFns(d, "yyyy-MM");
    const amt = amountToNumber(i.amount);
    const cur = i.currency;
    const existing = monthMap.get(key);
    if (existing) {
      existing.revenue += amt;
      existing.count += 1;
    } else {
      monthMap.set(key, { revenue: amt, count: 1, currency: cur });
    }
  });
  const monthlyTrend = Array.from(monthMap.entries())
    .map(([month, { revenue, count, currency }]) => ({
      month: fmtFns(parseISO(month + "-01"), "MMM yyyy"),
      revenue: formatCurrency(revenue, currency),
      count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  return {
    totalInvoices: allInvoices.length,
    totalRevenue: formatCurrency(totalRevenueNum, primaryCurrency),
    unpaidAmount: formatCurrency(unpaidAmountNum, primaryCurrency),
    paymentRate,
    invoicesByStatus,
    topClients,
    recentActivity,
    monthlyTrend,
  };
}

/**
 * Filter and return unpaid (including overdue) invoices with optional sorting and filters.
 */
export async function getUnpaidInvoices(
  userId: string,
  options?: GetUnpaidInvoicesOptions
): Promise<UnpaidInvoiceItem[]> {
  const where: Prisma.InvoiceWhereInput = {
    userId,
    status: { in: ["UNPAID", "OVERDUE"] },
  };
  if (options?.clientName?.trim()) {
    where.clientName = { contains: options.clientName.trim(), mode: "insensitive" };
  }
  if (options?.dueDateRange) {
    where.dueDate = {
      gte: options.dueDateRange.start,
      lte: options.dueDateRange.end,
    };
  }

  const orderBy: { amount?: "asc" | "desc"; clientName?: "asc" | "desc"; dueDate?: "asc" | "desc" } =
    options?.sortBy === "amount"
      ? { amount: "desc" }
      : options?.sortBy === "clientName"
        ? { clientName: "asc" }
        : { dueDate: "asc" };

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy,
    select: {
      invoiceNumber: true,
      clientName: true,
      amount: true,
      currency: true,
      dueDate: true,
    },
  });

  return invoices.map((i) => {
    const dueDate = i.dueDate;
    const days = getDaysUntilDue(dueDate);
    const overdue = isOverdue(dueDate);
    return {
      invoiceNumber: i.invoiceNumber,
      clientName: i.clientName,
      amount: formatCurrency(amountToNumber(i.amount), i.currency),
      currency: i.currency,
      dueDate,
      dueDateFormatted: formatDate(dueDate, "short"),
      daysUntilDue: days,
      isOverdue: overdue,
      overdueWarning: overdue
        ? `Overdue by ${Math.abs(days)} day(s)`
        : undefined,
    };
  });
}

/**
 * Revenue metrics for a date range (default: last 90 days).
 */
export async function getRevenueAnalytics(
  userId: string,
  dateRange?: DateRange
): Promise<RevenueAnalyticsResult> {
  const end = dateRange?.end ?? new Date();
  const start =
    dateRange?.start ?? new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [paidInPeriod, previousPeriod, paidInPeriodForClient] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId,
        status: "PAID",
        paidAt: { gte: start, lte: end },
      },
      select: { amount: true, currency: true, clientName: true, paidAt: true },
    }),
    prisma.invoice.findMany({
      where: {
        userId,
        status: "PAID",
        paidAt: {
          gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
          lt: start,
        },
      },
      select: { amount: true },
    }),
    prisma.invoice.findMany({
      where: {
        userId,
        status: "PAID",
        paidAt: { gte: start, lte: end },
      },
      select: { amount: true, clientName: true },
    }),
  ]);

  const byClient = paidInPeriodForClient.reduce(
    (acc, i) => {
      const name = i.clientName;
      if (!acc[name]) acc[name] = 0;
      acc[name] += amountToNumber(i.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  const monthMap = new Map<string, { revenue: number; count: number }>();
  paidInPeriod.forEach((i) => {
    const d = i.paidAt;
    if (!d) return;
    const key = fmtFns(d, "yyyy-MM");
    const amt = amountToNumber(i.amount);
    const existing = monthMap.get(key);
    if (existing) {
      existing.revenue += amt;
      existing.count += 1;
    } else {
      monthMap.set(key, { revenue: amt, count: 1 });
    }
  });
  const monthTotalsForBusiest = Array.from(monthMap.entries()).map(([month, data]) => ({
    month: parseISO(month + "-01"),
    revenue: data.revenue,
    count: data.count,
  }));

  const totalRevenueNum = paidInPeriod.reduce(
    (s, i) => s + amountToNumber(i.amount),
    0
  );
  const prevTotal = previousPeriod.reduce(
    (s, i) => s + amountToNumber(i.amount),
    0
  );
  const monthOverMonthGrowthPercent =
    prevTotal > 0
      ? ((totalRevenueNum - prevTotal) / prevTotal) * 100
      : totalRevenueNum > 0
        ? 100
        : null;
  const primaryCurrency = paidInPeriod[0]?.currency ?? "USDC";
  const paidCount = paidInPeriod.length;
  const averageInvoiceAmount =
    paidCount > 0 ? totalRevenueNum / paidCount : 0;

  const clientTotals = Object.entries(byClient).map(([name, revenue]) => ({
    name,
    revenue,
  }));
  const best =
    clientTotals.length > 0
      ? clientTotals.reduce((a, b) => (a.revenue >= b.revenue ? a : b))
      : null;

  const busiest =
    monthTotalsForBusiest.length > 0
      ? monthTotalsForBusiest.reduce((a, b) =>
          a.revenue >= b.revenue ? a : b
        )
      : null;

  return {
    totalRevenue: formatCurrency(totalRevenueNum, primaryCurrency),
    paidCount,
    averageInvoiceAmount: formatCurrency(averageInvoiceAmount, primaryCurrency),
    monthOverMonthGrowthPercent,
    bestPerformingClient: best
      ? {
          name: best.name,
          revenue: formatCurrency(best.revenue, primaryCurrency),
        }
      : null,
    busiestMonth: busiest
      ? {
          month: formatDate(busiest.month ?? new Date(), "short"),
          revenue: formatCurrency(busiest.revenue, primaryCurrency),
          count: busiest.count,
        }
      : null,
    currency: primaryCurrency,
  };
}

/**
 * Analyze client payment patterns. If clientName is omitted, returns all clients.
 */
export async function getClientAnalysis(
  userId: string,
  clientName?: string
): Promise<ClientAnalysisItem[]> {
  const where: Prisma.InvoiceWhereInput = {
    userId,
  };
  if (clientName?.trim()) {
    where.clientName = { contains: clientName.trim(), mode: "insensitive" };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      clientName: true,
      amount: true,
      currency: true,
      status: true,
      dueDate: true,
      paidAt: true,
      createdAt: true,
    },
  });

  const byClient = new Map<
    string,
    {
      totalRevenue: number;
      paidRevenue: number;
      paidDurations: number[];
      paidCount: number;
      unpaidCount: number;
      currency: string;
    }
  >();

  invoices.forEach((inv) => {
    const name = inv.clientName;
    const amt = amountToNumber(inv.amount);
    const cur = inv.currency;
    const isPaid = inv.status === "PAID";
    let entry = byClient.get(name);
    if (!entry) {
      entry = {
        totalRevenue: 0,
        paidRevenue: 0,
        paidDurations: [],
        paidCount: 0,
        unpaidCount: 0,
        currency: cur,
      };
      byClient.set(name, entry);
    }
    entry.totalRevenue += amt;
    if (isPaid) {
      entry.paidCount += 1;
      entry.paidRevenue += amt;
      if (inv.paidAt && inv.dueDate) {
        entry.paidDurations.push(
          differenceInDays(inv.paidAt, inv.dueDate)
        );
      }
    } else {
      entry.unpaidCount += 1;
    }
  });

  return Array.from(byClient.entries()).map(([clientName, data]) => {
    const totalRevenue = data.totalRevenue;
    const unpaidTotal = data.totalRevenue - data.paidRevenue;
    const paidCount = data.paidCount;
    const totalCount = data.paidCount + data.unpaidCount;
    const avgPaymentDays =
      data.paidDurations.length > 0
        ? Math.round(
            data.paidDurations.reduce((a, b) => a + b, 0) / data.paidDurations.length
          )
        : null;
    const onTimeRatio =
      data.paidDurations.length > 0
        ? data.paidDurations.filter((d) => d <= 0).length / data.paidDurations.length
        : 1;
    const paymentReliabilityScore = Math.round(
      (paidCount / totalCount) * 100 * 0.5 + onTimeRatio * 100 * 0.5
    );

    return {
      clientName,
      totalRevenue: formatCurrency(totalRevenue, data.currency),
      averagePaymentTimeDays: avgPaymentDays,
      paymentReliabilityScore: Math.min(100, Math.max(0, paymentReliabilityScore)),
      outstandingAmount: formatCurrency(unpaidTotal, data.currency),
      invoiceCount: totalCount,
      paidCount,
      unpaidCount: data.unpaidCount,
      currency: data.currency,
    };
  });
}

/**
 * Smart search: invoice number (exact), client name (partial), amount (range), description (text).
 */
export async function searchInvoices(
  userId: string,
  query: string
): Promise<
  Array<{
    invoiceNumber: string;
    clientName: string;
    amount: string;
    currency: string;
    status: string;
    dueDate: string;
    description: string;
  }>
> {
  const q = query.trim();
  if (!q) return [];

  const amountMatch = q.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  const conditions: Prisma.InvoiceWhereInput[] = [
    { invoiceNumber: { equals: q, mode: "insensitive" } },
    { clientName: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ];

  let amountFilter: ((amt: string) => boolean) | null = null;
  if (amountMatch) {
    const low = parseFloat(amountMatch[1]);
    const high = parseFloat(amountMatch[2]);
    if (!Number.isNaN(low) && !Number.isNaN(high)) {
      amountFilter = (amt) => {
        const n = parseFloat(amt);
        return !Number.isNaN(n) && n >= low && n <= high;
      };
    }
  } else {
    const singleAmount = parseFloat(q.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(singleAmount)) {
      amountFilter = (amt) => {
        const n = parseFloat(amt);
        return !Number.isNaN(n) && n >= singleAmount * 0.99 && n <= singleAmount * 1.01;
      };
    }
  }

  const invoices = await prisma.invoice.findMany({
    where:
      amountFilter
        ? { userId }
        : { userId, OR: conditions as Prisma.InvoiceWhereInput["OR"] },
    select: {
      invoiceNumber: true,
      clientName: true,
      amount: true,
      currency: true,
      status: true,
      dueDate: true,
      description: true,
    },
  });

  const filtered = amountFilter
    ? invoices.filter((i) => amountFilter!(i.amount))
    : invoices;

  return filtered.map((i) => ({
    invoiceNumber: i.invoiceNumber,
    clientName: i.clientName,
    amount: formatCurrency(amountToNumber(i.amount), i.currency),
    currency: i.currency,
    status: i.status,
    dueDate: formatDate(i.dueDate, "short"),
    description: i.description ?? "",
  }));
}

/**
 * Create an invoice from natural language text (e.g. voice or chat).
 * @param userId - Prisma User id (owner of invoices)
 * @param text - User message, e.g. "Create invoice for John Doe, $500, due next Friday"
 * @param _conversationHistory - Optional (kept for API compatibility; extraction uses current message)
 */
export async function createInvoiceFromText(
  userId: string,
  text: string,
  _conversationHistory?: Array<{ role: string; content: string }>
): Promise<{
  success: boolean;
  invoice?: unknown;
  error?: string;
  needsMoreInfo?: boolean;
  missingFields?: string[];
  message?: string;
}> {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log("🤖 Extracting invoice data from:", text);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system" as const,
          content: `You are an invoice data extraction assistant. Extract invoice details from user input.

Return ONLY valid JSON (no markdown, no explanations):
{
  "clientName": "string or null",
  "clientEmail": "string or null",
  "amount": "number or null",
  "currency": "ETH|USDC|USDT|DAI|WETH or null",
  "dueDate": "YYYY-MM-DD or null",
  "description": "string or null"
}

Rules:
- Extract what's mentioned, set null for missing fields
- For relative dates like "next Friday", calculate actual date (today is ${new Date().toISOString().split("T")[0]})
- Amount should be number only (no currency symbols)
- If currency not mentioned, set to null (don't assume)
- For "$500" extract amount as 500, currency as null

Examples:
"Create invoice for John Doe, $500, due next Friday"
→ {"clientName":"John Doe","clientEmail":null,"amount":500,"currency":null,"dueDate":"2026-02-27","description":null}

"Create invoice for Alice Smith at alice@test.com, 1 ETH, due 2026-02-25"
→ {"clientName":"Alice Smith","clientEmail":"alice@test.com","amount":1,"currency":"ETH","dueDate":"2026-02-25","description":null}

"Email is john@test.com, make it 0.5 ETH"
→ {"clientName":null,"clientEmail":"john@test.com","amount":0.5,"currency":"ETH","dueDate":null,"description":null}`,
        },
        {
          role: "user" as const,
          content: text,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content ?? "";
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();

    let extractedData: {
      clientName?: string | null;
      clientEmail?: string | null;
      amount?: number | null;
      currency?: string | null;
      dueDate?: string | null;
      description?: string | null;
    };
    try {
      extractedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response:", responseText);
      return {
        success: false,
        error:
          "Could not understand the invoice details. Please try again with clear information.",
      };
    }

    console.log("📊 Extracted data:", extractedData);

    const invoiceData = {
      clientName: extractedData.clientName ?? null,
      clientEmail: extractedData.clientEmail ?? null,
      amount: extractedData.amount ?? null,
      currency: (extractedData.currency || "ETH").toUpperCase(),
      dueDate: extractedData.dueDate ?? null,
      description: extractedData.description ?? null,
    };

    const missingFields: string[] = [];
    if (!invoiceData.clientName) missingFields.push("client name");
    if (!invoiceData.clientEmail) missingFields.push("client email");
    if (invoiceData.amount == null) missingFields.push("amount");
    if (!invoiceData.dueDate) missingFields.push("due date");

    if (missingFields.length > 0) {
      console.log("⚠️ Missing fields:", missingFields);

      const fieldsList = missingFields
        .map(
          (f) =>
            `• **${f.charAt(0).toUpperCase() + f.slice(1)}**`
        )
        .join("\n");

      return {
        success: false,
        needsMoreInfo: true,
        missingFields,
        message: `I have some details, but I still need:

${fieldsList}

Please provide the missing information and I'll create the invoice!

💡 **Examples:**
- "Client is John Doe at john@example.com"
- "Amount is $500, due next Friday"
- "Email is alice@company.com, 0.5 ETH, due tomorrow"`,
      };
    }

    if (invoiceData.amount! <= 0) {
      return {
        success: false,
        error: "Amount must be greater than 0",
      };
    }

    const clientEmail =
      (invoiceData.clientEmail || "").trim() ||
      `${invoiceData.clientName!.toLowerCase().replace(/\s+/g, "")}@example.com`;
    const currency = (invoiceData.currency || "ETH").toUpperCase();
    const description =
      invoiceData.description?.trim() ||
      `Invoice for ${invoiceData.clientName}`;

    console.log("💰 Creating invoice:", {
      client: invoiceData.clientName,
      amount: invoiceData.amount,
      currency,
    });

    try {
      console.log("💰 Creating invoice for user:", userId);

      const currentYear = new Date().getFullYear();

      // Get existing invoices (no transaction)
      const userInvoices = await prisma.invoice.findMany({
        where: {
          userId,
          invoiceNumber: {
            startsWith: `INV-${currentYear}-`,
          },
        },
        select: { invoiceNumber: true },
        orderBy: { invoiceNumber: "desc" },
        take: 1, // Only need the latest one
      });

      console.log(`📊 Found ${userInvoices.length} existing invoices`);

      let maxNumber = 0;
      if (userInvoices.length > 0) {
        const match = userInvoices[0].invoiceNumber.match(/INV-\d{4}-(\d+)/);
        if (match) {
          maxNumber = parseInt(match[1], 10);
        }
      }

      const nextNumber = maxNumber + 1;
      const invoiceNumber = `INV-${currentYear}-${String(nextNumber).padStart(4, "0")}`;
      const paymentPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/${invoiceNumber}`;

      console.log(`📝 Creating invoice ${invoiceNumber}`);

      // Create invoice directly (no transaction)
      const invoice = await prisma.invoice.create({
        data: {
          userId,
          invoiceNumber,
          clientName: invoiceData.clientName!,
          clientEmail: clientEmail,
          amount: invoiceData.amount!.toString(),
          currency: currency,
          dueDate: new Date(invoiceData.dueDate!),
          description: description,
          status: "UNPAID",
          paymentPageUrl: paymentPageUrl,
          merchantWallet: process.env.MERCHANT_WALLET_ADDRESS || "",
        },
      });

      console.log("✅ Invoice created successfully!");
      console.log("Invoice ID:", invoice.id);
      console.log("Invoice Number:", invoice.invoiceNumber);

      return {
        success: true,
        invoice: {
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          amount: invoice.amount,
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          paymentPageUrl: invoice.paymentPageUrl,
        },
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string; meta?: unknown };
      console.error("❌ Error creating invoice:", error);
      console.error("Error code:", err?.code);
      console.error("Error message:", err?.message);

      // Log the full error for debugging
      if (err?.meta) {
        console.error("Error meta:", JSON.stringify(err.meta, null, 2));
      }

      return {
        success: false,
        error: `Failed to create invoice: ${err?.message ?? "Unknown error"}`,
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ Error creating invoice from text:", err);
    return {
      success: false,
      error: err?.message || "Failed to create invoice",
    };
  }
}

// =============================================================================
// FORMATTING & PARSING
// =============================================================================

/**
 * Format data structures for AI consumption: markdown tables, labels, currency/dates, insights.
 */
export function formatForAI(data: unknown): string {
  if (data == null) return "No data.";
  if (Array.isArray(data)) {
    if (data.length === 0) return "No items.";
    const first = data[0];
    if (typeof first !== "object" || first === null) {
      return data.map((x) => String(x)).join("\n");
    }
    const keys = Object.keys(first as Record<string, unknown>);
    const header = "| " + keys.join(" | ") + " |";
    const sep = "| " + keys.map(() => "---").join(" | ") + " |";
    const rows = data.map((row) => {
      const r = row as Record<string, unknown>;
      return "| " + keys.map((k) => String(r[k] ?? "")).join(" | ") + " |";
    });
    return [header, sep, ...rows].join("\n");
  }
  if (typeof data === "object") {
    const lines: string[] = [];
    const obj = data as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
      if (Array.isArray(value)) {
        lines.push(`**${label}**`);
        lines.push(formatForAI(value));
      } else if (value !== null && typeof value === "object") {
        lines.push(`**${label}**`);
        lines.push(formatForAI(value));
      } else {
        lines.push(`**${label}**: ${value}`);
      }
    }
    return lines.join("\n");
  }
  return String(data);
}

/**
 * Detect user intent from natural language query.
 */
export function parseUserIntent(query: string): Intent {
  const lower = query.toLowerCase().trim();
  if (!lower) return "general";

  const revenueKeywords = ["revenue", "income", "earned", "total paid", "how much made"];
  if (revenueKeywords.some((k) => lower.includes(k))) return "revenue";

  const unpaidKeywords = ["unpaid", "owe", "owing", "outstanding", "who owes", "overdue", "due"];
  if (unpaidKeywords.some((k) => lower.includes(k))) return "unpaid";

  const findKeywords = ["find", "search", "look up", "show me invoice", "get invoice"];
  if (findKeywords.some((k) => lower.includes(k))) return "search";

  const clientKeywords = ["client", "customer", "payer"];
  if (clientKeywords.some((k) => lower.includes(k))) return "client";

  const analyticsKeywords = ["analytics", "trend", "growth", "month over month", "best month"];
  if (analyticsKeywords.some((k) => lower.includes(k))) return "analytics";

  return "general";
}

/**
 * Parse natural language date range into start and end dates.
 * Supports: "this month", "last week", "January", "Q1", "last 30 days", etc.
 */
export function formatDateRange(range: string): DateRange {
  const now = new Date();
  const lower = range.toLowerCase().trim();

  if (lower === "this month" || lower === "current month") {
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }
  if (lower === "last month" || lower === "previous month") {
    const last = subMonths(now, 1);
    return { start: startOfMonth(last), end: endOfMonth(last) };
  }
  if (lower === "last week" || lower === "previous week") {
    const last = subWeeks(now, 1);
    return { start: startOfWeek(last), end: endOfWeek(last) };
  }
  if (lower === "this week") {
    return { start: startOfWeek(now), end: endOfWeek(now) };
  }

  const lastNDays = range.match(/last\s+(\d+)\s+days?/i);
  if (lastNDays) {
    const n = parseInt(lastNDays[1], 10);
    const days = Number.isNaN(n) ? 30 : Math.min(365, Math.max(1, n));
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    return { start, end: new Date(now) };
  }

  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const monthIndex = monthNames.findIndex((m) => lower.includes(m));
  if (monthIndex !== -1) {
    const yearMatch = range.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : now.getFullYear();
    const start = new Date(year, monthIndex, 1);
    const end = endOfMonth(start);
    return { start, end };
  }

  const qMatch = range.match(/q([1-4])\s*(\d{4})?/i);
  if (qMatch) {
    const q = parseInt(qMatch[1], 10);
    const year = qMatch[2] ? parseInt(qMatch[2], 10) : now.getFullYear();
    const start = startOfQuarter(new Date(year, (q - 1) * 3, 1));
    const end = endOfQuarter(start);
    return { start, end };
  }

  if (lower === "this year" || lower === "ytd") {
    return { start: startOfYear(now), end: endOfYear(now) };
  }

  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);
  return { start: defaultStart, end: new Date(now) };
}
