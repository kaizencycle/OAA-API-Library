/**
 * Inquiry Chat API
 * POST /api/inquiry/chat
 * 
 * Conversational AI endpoint for New Inquiry
 * Supports Anthropic Claude, OpenAI, and mock responses
 * 
 * C-151: Conversational Inquiry Chat Interface
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyJWT, extractBearerToken } from '../../../src/lib/auth/jwt';
import { AuthService } from '../../../src/lib/auth/authService';

// Message interface
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Response interface
interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    // Verify authentication (optional - can work without for demo)
    let userId: string | null = null;
    let userHandle: string | null = null;

    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (token) {
      // Try JWT first
      const jwtPayload = verifyJWT(token);
      if (jwtPayload) {
        userId = jwtPayload.userId;
        userHandle = jwtPayload.handle;
      } else {
        // Try session token
        try {
          const session = await AuthService.verifySession(token);
          userId = session.user.id;
          userHandle = session.user.handle;
        } catch {
          // Continue without auth - demo mode
        }
      }
    }

    // Get message and history from request body
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 4000 characters.',
      });
    }

    // Generate AI response
    const response = await generateAIResponse(message, history || [], userHandle);

    // Log inquiry for analytics (optional)
    if (userId) {
      console.log(`[Inquiry] User ${userId} asked: ${message.substring(0, 100)}...`);
    }

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('[Inquiry/Chat] Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process inquiry',
    });
  }
}

/**
 * Generate AI response using available providers
 */
async function generateAIResponse(
  message: string,
  history: Message[],
  userHandle: string | null
): Promise<string> {
  // Option 1: Anthropic Claude (recommended)
  if (process.env.ANTHROPIC_API_KEY) {
    return await callAnthropicAPI(message, history, userHandle);
  }

  // Option 2: OpenAI
  if (process.env.OPENAI_API_KEY) {
    return await callOpenAIAPI(message, history, userHandle);
  }

  // Option 3: Mock responses (for testing/demo)
  return generateMockResponse(message, userHandle);
}

/**
 * System prompt for AI - explains Mobius context
 */
function getSystemPrompt(userHandle: string | null): string {
  const greeting = userHandle ? `The user's handle is "${userHandle}". ` : '';
  
  return `You are a helpful AI assistant for Mobius Systems, a civic AI infrastructure platform built on integrity-first principles.

${greeting}Your role is to help users understand and navigate the Mobius ecosystem.

Key concepts to know:
- **MIC (Mobius Integrity Credits)**: Work-backed universal basic income currency earned through learning and demonstrating integrity. Not speculative - backed by real work.
- **Three Covenants**: Integrity (truth-telling), Ecology (regenerative systems), Custodianship (long-term thinking for future generations)
- **Learn-to-Earn**: Users complete educational modules and quizzes to earn MIC. Accuracy of 70%+ required.
- **Integrity Score**: Measures user trustworthiness through quiz accuracy, participation, and contribution quality.
- **Global Integrity Index (GII)**: System-wide health metric that affects rewards.
- **Constitutional AI**: Our AI systems are constrained by ethical principles to serve humanity.
- **Democratic Superintelligence**: Multiple AI agents can participate in democratic decision-making.

Topics users can learn about:
- Constitutional AI & Governance
- Neural Networks & Deep Learning
- Cryptography & Blockchain
- Quantum Computing
- Climate Science & AI

Be conversational, helpful, and knowledgeable. Keep responses concise but informative (2-4 paragraphs max unless asked for more detail). Use markdown formatting for lists and emphasis when helpful.`;
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropicAPI(
  message: string,
  history: Message[],
  userHandle: string | null
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: getSystemPrompt(userHandle),
      messages: [
        ...history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[Anthropic] Error:', data);
    throw new Error(data.error?.message || 'Failed to get response from Claude');
  }

  return data.content[0].text;
}

/**
 * Call OpenAI API
 */
async function callOpenAIAPI(
  message: string,
  history: Message[],
  userHandle: string | null
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(userHandle),
        },
        ...history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[OpenAI] Error:', data);
    throw new Error(data.error?.message || 'Failed to get response from OpenAI');
  }

  return data.choices[0].message.content;
}

/**
 * Generate mock response for testing/demo mode
 * Provides intelligent responses without requiring API keys
 */
function generateMockResponse(message: string, userHandle: string | null): string {
  const lowerMessage = message.toLowerCase();
  const greeting = userHandle ? `${userHandle}, ` : '';

  // Topic detection and responses
  if (lowerMessage.includes('mic') || lowerMessage.includes('credit') || lowerMessage.includes('token') || lowerMessage.includes('currency')) {
    return `${greeting}**MIC (Mobius Integrity Credits)** are work-backed universal basic income earned through learning and demonstrating integrity.

Unlike speculative cryptocurrencies, MIC is backed by real work and learning. When you complete educational modules with high accuracy and maintain good integrity scores, you earn MIC that's automatically credited to your wallet.

**How MIC is calculated:**
\`MIC = base_reward × accuracy × integrity_score × global_integrity_index\`

This means your earnings scale with:
- 📚 How well you learn (quiz accuracy)
- 🎯 Your personal integrity score
- 🌍 The health of the overall system (GII)

Would you like to know how to start earning, or learn more about the integrity scoring system?`;
  }

  if (lowerMessage.includes('integrity') || lowerMessage.includes('trust')) {
    return `${greeting}**Integrity** is one of the Three Covenants that form the foundation of Mobius Systems.

In practical terms, integrity in Mobius means:
1. **Truthfulness** - Honest interactions and accurate information
2. **Consistency** - Reliable behavior over time
3. **Alignment** - Actions that benefit the collective good

**Your integrity score** is measured through:
- Quiz accuracy in learning modules
- System participation quality
- Contribution authenticity
- Historical consistency

The **Global Integrity Index (GII)** reflects the overall health and trustworthiness of the entire Mobius ecosystem. It affects everyone's MIC earnings - when the system is healthy, everyone benefits more!

Higher integrity = more rewards. It's a virtuous cycle! 🔄`;
  }

  if (lowerMessage.includes('learn') || lowerMessage.includes('earn') || lowerMessage.includes('module') || lowerMessage.includes('quiz')) {
    return `${greeting}The **Learn & Earn** system is how you earn MIC while gaining valuable knowledge!

**How it works:**
1. 📚 Choose a learning module (Constitutional AI, Neural Networks, etc.)
2. 📖 Study the material at your own pace
3. ✅ Take the quiz (need 70%+ accuracy to earn)
4. 💰 Earn MIC based on your performance!

**Current modules include:**
- Constitutional AI & Governance (50 MIC)
- Neural Networks & Deep Learning (75 MIC)
- Integrity Economics (75 MIC)
- Cryptography & Blockchain (100 MIC)
- Quantum Computing Basics (100 MIC)

**Pro tips:**
- Study the explanations after each answer
- Retake modules to improve accuracy
- Higher difficulty = higher rewards

Ready to start your first module? 🎓`;
  }

  if (lowerMessage.includes('covenant') || lowerMessage.includes('principle')) {
    return `${greeting}The **Three Covenants** are the foundational principles of Mobius Systems:

**1. Integrity** 🎯
Truth-telling and alignment with collective benefit. We build systems where honesty is rewarded and deception is costly.

**2. Ecology** 🌱
Regenerative rather than extractive systems. We create value that sustains and grows the ecosystem, not depletes it.

**3. Custodianship** 🏛️
Long-term thinking for future generations. Every decision considers its impact on those who come after us.

These covenants guide everything we build - from how MIC is minted to how AI systems are constrained. They're not just ideals; they're operational principles encoded into our infrastructure.

"We heal as we walk." — Mobius Systems`;
  }

  if (lowerMessage.includes('wallet') || lowerMessage.includes('balance')) {
    return `${greeting}Your **Mobius Wallet** is where your MIC (Mobius Integrity Credits) are stored securely.

**Key features:**
- 🔒 **Secure** - Custodial wallet managed by Mobius (we handle the keys)
- 💰 **Real-time** - MIC from completed modules credited instantly
- 📊 **Transparent** - Full transaction history on the integrity ledger
- 🔗 **Verifiable** - All transactions cryptographically signed

**Your wallet receives MIC when you:**
- Complete learning modules (70%+ accuracy)
- Contribute to the community
- Maintain high integrity scores

You can view your balance and transaction history anytime. Would you like to know more about how transfers work or how to check your balance?`;
  }

  if (lowerMessage.includes('mobius') || lowerMessage.includes('platform') || lowerMessage.includes('what is this')) {
    return `${greeting}**Mobius Systems** is civic AI infrastructure built on integrity-first principles.

**What we're building:**
- 🤖 **Constitutional AI** - AI systems constrained by ethical principles
- 💰 **Integrity Economics** - Work-backed currency (MIC) that rewards learning
- 🏛️ **Democratic Superintelligence** - AI that serves humanity through collective governance
- 📚 **Learn-to-Earn** - Education that pays you to grow

**Why it matters:**
In a world where AI is transforming everything, we need systems that are aligned with human values. Mobius creates infrastructure where doing good is rewarded, truth-telling is incentivized, and long-term thinking is built into the code.

We're not just building technology - we're building a new kind of economy where integrity has real value.

Want to learn more about any specific aspect?`;
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('help')) {
    return `Hello${userHandle ? ` ${userHandle}` : ''}! 👋 Welcome to Mobius Systems!

I'm here to help you explore our platform. Here's what I can assist with:

**Popular topics:**
- 💰 How MIC (Mobius Integrity Credits) works
- 📚 The Learn-to-Earn system
- 🎯 Understanding integrity scoring
- 🏛️ The Three Covenants
- 🤖 Constitutional AI principles

**Quick actions you might want:**
- Start a learning module
- Check your wallet balance
- Understand how to earn more MIC

What would you like to explore? Feel free to ask anything!`;
  }

  if (lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence') || lowerMessage.includes('alignment')) {
    return `${greeting}**Constitutional AI** is at the heart of Mobius Systems.

**What makes our AI different:**
- 🎯 **Constrained by principles** - Our AI operates within ethical boundaries defined by the Three Covenants
- 🔒 **Alignment-first** - Safety and human benefit are not afterthoughts, they're core design principles
- 🏛️ **Democratic oversight** - Multiple AI agents can participate in collective decision-making
- 📜 **Transparent reasoning** - AI decisions can be audited and understood

**Key concepts:**
- **Value alignment** - AI goals match human values
- **Drift suppression** - Mechanisms prevent AI from straying from intended behavior
- **Integrity checks** - Continuous monitoring ensures honest operation

We believe AI should serve humanity, not the other way around. That's why we're building infrastructure that makes beneficial AI the default.

Would you like to learn more about AI alignment or take a module on Constitutional AI?`;
  }

  // Default conversational response
  return `${greeting}That's a great question! Let me help you with that.

Mobius Systems is built on three core principles (the **Three Covenants**):
1. **Integrity** - Truth-telling and alignment
2. **Ecology** - Regenerative, not extractive
3. **Custodianship** - Thinking long-term for future generations

We're creating a new kind of civic AI infrastructure where:
- Learning is rewarded with MIC (Mobius Integrity Credits)
- AI systems are constrained by constitutional principles
- Integrity has real, measurable value

I can dive deeper into any of these topics:
- How to earn MIC through learning
- The integrity scoring system
- Constitutional AI principles
- Wallet and balance management

What interests you most? 🚀`;
}
