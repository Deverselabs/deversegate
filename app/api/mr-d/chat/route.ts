import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { getUserInvoiceContext, createInvoiceFromText } from "@/lib/mr-d-intelligence";
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST /api/mr-d/chat request received');
    
    const user = await getOrCreateUser();
    console.log('✅ Merchant:', user.id, user.email);

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content.toLowerCase();

    // Get last 5 messages for context
    const recentMessages = messages.slice(-5);
    const conversationText = recentMessages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Check if assistant recently asked for missing info
    const assistantAskedForInfo = recentMessages.some(m => 
      m.role === 'assistant' && (
        m.content.toLowerCase().includes('missing') ||
        m.content.toLowerCase().includes('still need') ||
        m.content.toLowerCase().includes('provide')
      )
    );

    // IMPROVED: Detect invoice creation or follow-up
    const isInvoiceCreation = 
      // Direct invoice creation keywords
      userMessage.includes('create invoice') ||
      userMessage.includes('make invoice') ||
      userMessage.includes('new invoice') ||
      userMessage.includes('generate invoice') ||
      userMessage.includes('invoice for') ||
      // Follow-up scenarios
      (assistantAskedForInfo && (
        userMessage.includes('@') || // Email provided
        userMessage.includes('email:') ||
        userMessage.includes('client email') ||
        /^\s*[\w\.-]+@[\w\.-]+\.\w+/.test(userMessage) || // Just an email
        userMessage.match(/^\d+/) || // Starts with a number (amount)
        userMessage.includes('eth') ||
        userMessage.includes('usdc') ||
        userMessage.includes('due')
      )) ||
      // Check if conversation is about invoices
      (conversationText.includes('invoice') && 
       conversationText.includes('client email'));

    console.log('🔍 Context check:', {
      isInvoiceCreation,
      assistantAskedForInfo,
      userMessage: userMessage.substring(0, 60),
      hasEmail: userMessage.includes('@'),
    });

    if (isInvoiceCreation) {
      console.log('📝 Invoice creation flow triggered');
      
      // Build full context from recent USER messages only
      const userInputs = recentMessages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('. ');
      
      console.log('📝 Full context for creation:', userInputs);
      
      const result = await createInvoiceFromText(user.id, userInputs, messages);

      // Ask for missing info
      if (result.needsMoreInfo) {
        console.log('⚠️ Still missing info:', result.missingFields);
        return NextResponse.json({ 
          message: result.message 
        });
      }

      // Success!
      if (result.success && result.invoice) {
        const responseMessage = `✅ **Invoice Created Successfully!**

**Invoice:** ${result.invoice.invoiceNumber}
**Client:** ${result.invoice.clientName}
**Email:** ${result.invoice.clientEmail}
**Amount:** ${result.invoice.amount} ${result.invoice.currency}
**Due Date:** ${new Date(result.invoice.dueDate).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

**Payment Link:**
${result.invoice.paymentPageUrl}

📧 **Next Steps:**
1. Send the payment link to **${result.invoice.clientName}**
2. They can pay directly (no login required)
3. You'll receive an email when they pay

Would you like to create another invoice? 🎤`;

        return NextResponse.json({ message: responseMessage });
      } 
      
      // Error
      return NextResponse.json({
        message: `❌ ${result.error}\n\nPlease provide the missing details and try again.`,
      });
    }

    // Regular Mr. D chat (queries, analytics, etc.)
    console.log('💬 Regular chat query');
    
    const context = await getUserInvoiceContext(user.id);

    const systemPrompt = `You are Mr. D, an AI assistant for DeverseGate invoice management system.

You help merchants manage invoices for their clients.

**Current merchant's data:**
${JSON.stringify(context, null, 2)}

**Guidelines:**
- Be conversational and helpful
- Format data clearly with markdown
- Provide actionable insights
- When showing invoices, include invoice number, client, amount, status
- Remind users they can use voice: "Just say 'Create invoice for...'"

Remember: Merchants create invoices for their CLIENTS. Clients don't need accounts.`;

    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseMessage = completion.choices[0]?.message?.content || 
      "I couldn't generate a response. Please try again.";

    return NextResponse.json({
      message: responseMessage,
    });

  } catch (error: any) {
    console.error("❌ Unexpected error in mr-d chat:", error);
    return NextResponse.json(
      { 
        error: "Something went wrong. Please try again later.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}