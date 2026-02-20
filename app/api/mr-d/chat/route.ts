import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { db as prisma } from "@/lib/db";
import { getUserInvoiceContext } from "@/lib/mr-d-intelligence";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Auth check (Clerk userId)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve Clerk user to Prisma User id (invoices are linked by User.id, not Clerk id)
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "User account not found. Please complete sign-up." },
        { status: 404 }
      );
    }

    // Parse request
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get user's invoice context (use Prisma User id)
    const context = await getUserInvoiceContext(user.id);

    // Build system prompt with invoice data
    const systemPrompt = `You are Mr. D, an AI assistant for DeverseGate invoice management system.

Your role:
- Help users query their invoices
- Provide revenue analytics
- Analyze client payment patterns
- Find specific invoices
- Offer business insights

Current user's data:
${JSON.stringify(context, null, 2)}

Guidelines:
- Be concise and professional
- Format data in markdown tables when appropriate
- Use bullet points for lists
- Include currency symbols (ETH, $)
- Provide actionable insights
- If asking about transactions beyond invoices, explain you focus on invoice management
- Suggest next actions when relevant

When showing invoice data:
- Format amounts clearly
- Show due dates
- Highlight overdue invoices
- Provide totals

Example responses:
User: "Show unpaid invoices"
You: "You have 2 unpaid invoices:

| Invoice | Client | Amount | Due Date | Status |
|---------|--------|--------|----------|--------|
| INV-2026-0002 | Jane Smith | 200 ETH | Feb 25 | Due in 5 days |
| INV-2026-0003 | John Doe | 150 ETH | Feb 18 | ⚠️ Overdue by 2 days |

**Total unpaid:** 350 ETH

Would you like me to help you send payment reminders?"`;

    // Prepare messages for Groq
    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile", // Fast and high quality
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    const responseMessage = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // Return response
    return NextResponse.json({
      message: responseMessage,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error("Unexpected error in mr-d chat:", error);
    return NextResponse.json(
      { 
        error: "Something went wrong. Please try again later.",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
