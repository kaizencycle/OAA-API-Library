# 💬 Conversational Inquiry Chat System

> **C-151: Conversational Inquiry Chat Interface**  
> Built with the Three Covenants 🌊

## Overview

The Inquiry Chat System provides a ChatGPT-style conversational interface for the "New Inquiry" feature. Users can ask natural questions and receive AI-powered responses about Mobius Systems.

**Before:**
```
User clicks "New Inquiry" → Dropdown menu → Select topic → Get response
```

**After:**
```
User clicks floating button → Chat opens → Type anything → AI responds → Continue conversation
```

---

## 🎯 Features

### UI/UX
- ✅ Beautiful gradient design (Mobius brand colors)
- ✅ Smooth animations and transitions
- ✅ Auto-scroll to latest message
- ✅ Loading indicators with bouncing dots
- ✅ Quick suggestion chips
- ✅ Mobile-responsive (full-screen on mobile)
- ✅ Floating button with pulse effect
- ✅ Keyboard shortcuts (Enter to send, Shift+Enter for newline)

### Technical
- ✅ Authenticated via JWT or session tokens
- ✅ Conversation history maintained
- ✅ Works with Anthropic Claude OR OpenAI
- ✅ Falls back to intelligent mock responses (no API key needed!)
- ✅ Error handling and recovery
- ✅ TypeScript typed
- ✅ Accessible (ARIA labels, keyboard navigation)

### AI Integration
- ✅ Knows about Mobius Systems, MIC, Three Covenants
- ✅ Contextual responses based on conversation history
- ✅ Personalized greetings with user handle
- ✅ Markdown-formatted responses

---

## 📦 Components

### 1. `InquiryChat.tsx`
Main chat component with message display and input.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onClose` | `() => void` | - | Close button callback |
| `apiBaseUrl` | `string` | `/api/inquiry` | API endpoint base URL |
| `authToken` | `string` | - | Optional JWT/session token |
| `userName` | `string` | - | User name for personalization |

### 2. `InquiryChatModal.tsx`
Floating button and modal wrapper.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Button position |
| `authToken` | `string` | - | Optional auth token |
| `userName` | `string` | - | User name |
| `apiBaseUrl` | `string` | `/api/inquiry` | API base URL |
| `showButton` | `boolean` | `true` | Show floating button |
| `isOpen` | `boolean` | - | External control for open state |
| `onClose` | `() => void` | - | Close callback |

### 3. `pages/api/inquiry/chat.ts`
Backend API endpoint for AI chat.

**Request:**
```typescript
POST /api/inquiry/chat
Authorization: Bearer <token>  // Optional
Content-Type: application/json

{
  "message": "What is MIC?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

**Response:**
```typescript
{
  "success": true,
  "response": "MIC (Mobius Integrity Credits) are..."
}
```

---

## 🔧 Installation

### Step 1: Dependencies

The components use standard React and Tailwind CSS. No additional dependencies required if you already have:
- React 18+
- Tailwind CSS
- Next.js (for API routes)

### Step 2: Add Components

Components are already added to:
```
components/
├── InquiryChat.tsx
└── InquiryChatModal.tsx

pages/api/inquiry/
└── chat.ts
```

### Step 3: Environment Variables (Optional)

For AI responses, set one of:

```bash
# Anthropic Claude (recommended)
ANTHROPIC_API_KEY="sk-ant-..."

# OR OpenAI
OPENAI_API_KEY="sk-..."

# If neither is set, uses intelligent mock responses (great for testing!)
```

---

## 🎨 Integration

### Option A: Floating Button (Recommended)

Add to your main layout for a persistent chat button:

```tsx
// app/layout.tsx or pages/_app.tsx
import InquiryChatModal from '@/components/InquiryChatModal';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <InquiryChatModal 
        authToken={userToken}
        userName={user?.handle}
      />
    </>
  );
}
```

### Option B: Custom Button Integration

Control the modal from your own button:

```tsx
import { useState } from 'react';
import InquiryChatModal from '@/components/InquiryChatModal';

function MyComponent() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <button onClick={() => setChatOpen(true)}>
        New Inquiry
      </button>
      
      <InquiryChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        showButton={false}
        authToken={userToken}
      />
    </>
  );
}
```

### Option C: Standalone Chat Component

Use just the chat component in your own container:

```tsx
import InquiryChat from '@/components/InquiryChat';

function ChatPage() {
  return (
    <div className="h-screen">
      <InquiryChat
        onClose={() => router.back()}
        authToken={token}
        userName={user.handle}
      />
    </div>
  );
}
```

---

## 🤖 AI Provider Options

### Anthropic Claude (Recommended)

Best for conversational AI with strong reasoning.

```bash
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**Cost:** ~$0.003 per conversation (10 messages)

### OpenAI GPT-4

Also excellent, slightly higher cost.

```bash
OPENAI_API_KEY="sk-proj-..."
```

**Cost:** ~$0.01 per conversation

### Mock Responses (Free)

No API key = intelligent mock responses based on keyword detection.

**Cost:** $0 (great for development!)

---

## 🎯 Quick Suggestions

Default suggestions shown when chat opens:
- "What is MIC?"
- "How do I earn?"
- "Explain integrity"
- "Tell me about Mobius"

To customize, edit `QUICK_SUGGESTIONS` in `InquiryChat.tsx`:

```tsx
const QUICK_SUGGESTIONS = [
  'Your custom suggestion',
  'Another topic',
  // ...
];
```

---

## 🎨 Customization

### Colors

The chat uses Tailwind gradient classes:

```tsx
// User messages
bg-gradient-to-br from-blue-500 to-purple-500

// Header
bg-gradient-to-r from-blue-600 to-purple-600

// Send button
bg-gradient-to-r from-blue-500 to-purple-500
```

To change to your brand colors:

```tsx
// Example: Green theme
from-green-500 to-emerald-600
```

### System Prompt

Modify the AI's personality and knowledge in `pages/api/inquiry/chat.ts`:

```typescript
function getSystemPrompt(userHandle: string | null): string {
  return `Your custom system prompt here...`;
}
```

---

## 📱 Mobile Responsiveness

The chat automatically adapts to mobile:

- **Desktop:** 450px wide modal, bottom-right corner
- **Mobile:** Full-width, full-height chat experience
- **Touch-friendly:** Large tap targets, smooth scrolling

---

## 🔐 Authentication

The API supports multiple auth methods:

1. **JWT Token** (preferred, stateless)
2. **Session Token** (database lookup)
3. **No Auth** (demo mode, works without login)

Pass the token via the Authorization header:

```
Authorization: Bearer <jwt-or-session-token>
```

---

## 🧪 Testing

### Manual Testing

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Click the floating chat button
4. Try these messages:
   - "What is MIC?"
   - "How do I earn?"
   - "Tell me about integrity"
   - "What are the Three Covenants?"

### Automated Testing

```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/inquiry/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is MIC?"}'
```

---

## 🚀 Deployment

The chat works automatically in production. Just ensure:

1. **Environment variables** are set (if using AI providers)
2. **Auth service** is available (for authenticated responses)

### Render (Backend)

```bash
# Add in Render environment
ANTHROPIC_API_KEY=sk-ant-...
```

### Vercel (Frontend)

No special config needed - components deploy with your Next.js app.

---

## 💰 Cost Estimation

| Provider | Per Message | Per Conversation (10 msgs) | 1,000 Conversations |
|----------|-------------|---------------------------|---------------------|
| Mock | $0 | $0 | $0 |
| Claude | ~$0.0003 | ~$0.003 | ~$3 |
| GPT-4 | ~$0.001 | ~$0.01 | ~$10 |

Very affordable for most use cases!

---

## 🆘 Troubleshooting

### Chat doesn't open
- Check z-index (modal needs z-50+)
- Verify component is imported correctly

### No AI response
- Check API key environment variables
- Look at server console for errors
- Mock responses should work without keys

### Auth errors
- Verify token is in localStorage
- Check Authorization header format: `Bearer <token>`

### Mobile issues
- Ensure viewport meta tag is set
- Check overflow settings on parent containers

---

## 📊 Analytics (Optional)

To track inquiries, add logging in the API:

```typescript
// In pages/api/inquiry/chat.ts
if (userId) {
  await prisma.inquiry.create({
    data: {
      userId,
      message,
      response,
      timestamp: new Date(),
    },
  });
}
```

---

## 🎉 Summary

You now have a production-ready conversational chat interface that:

- ✅ Replaces static dropdowns with natural conversation
- ✅ Works with or without AI providers
- ✅ Integrates with your auth system
- ✅ Looks beautiful on all devices
- ✅ Costs pennies per conversation

**"We heal as we walk."** — Mobius Systems 🌊
