# AI Chat Platform Implementation Plan

## Phase 1: Database Setup ✅ COMPLETED

### 1.1 Prisma Schema
- ✅ Added 10 new models to `prisma/schema.prisma`:
  - `Conversation` - Chat conversations
  - `Message` - Individual messages
  - `ChatAttachment` - Files attached to messages (uses Cloudinary)
  - `UserMemory` - User memory system
  - `UserSettings` - User preferences
  - `ChatFolder` - Conversation organization
  - `SavedPrompt` - Reusable prompts
  - `SharedConversation` - Public sharing
  - `ChatUsageLog` - Token tracking
  - Enums: `MessageRole`, `ChatModel`

### 1.2 Run Migration
```bash
# Start database first
docker compose up -d

# Generate Prisma Client
pnpm db:generate

# Create migration
pnpm db:migrate --name ai_chat_platform
```

---

## Phase 2: Backend API Routes (Priority Order)

### 2.1 Core Chat API (`/api/gemma/chat/*`)
- `POST /api/gemma/chat/conversations` - Create new conversation
- `GET /api/gemma/chat/conversations` - List user conversations (with pagination, search, filters)
- `GET /api/gemma/chat/conversations/[id]` - Get conversation with messages
- `PATCH /api/gemma/chat/conversations/[id]` - Update conversation (rename, pin, archive, change model)
- `DELETE /api/gemma/chat/conversations/[id]` - Delete conversation
- `POST /api/gemma/chat/conversations/[id]/duplicate` - Duplicate conversation

### 2.2 Message API
- `POST /api/gemma/chat/conversations/[id]/messages` - Send message (streaming response)
- `GET /api/gemma/chat/conversations/[id]/messages` - Get messages (pagination)
- `PATCH /api/gemma/chat/messages/[id]` - Edit message
- `DELETE /api/gemma/chat/messages/[id]` - Delete message
- `POST /api/gemma/chat/messages/[id]/regenerate` - Regenerate assistant response

### 2.3 File Upload API (Cloudinary Integration)
- `POST /api/gemma/chat/attachments/upload` - Upload files to Cloudinary
- `DELETE /api/gemma/chat/attachments/[id]` - Delete attachment
- `POST /api/gemma/chat/attachments/[id]/ocr` - Extract text from images
- `GET /api/gemma/chat/attachments/[id]` - Get attachment metadata

### 2.4 User Settings API
- `GET /api/gemma/chat/settings` - Get user settings
- `PATCH /api/gemma/chat/settings` - Update user settings

### 2.5 Memory API
- `GET /api/gemma/chat/memory` - List user memories
- `POST /api/gemma/chat/memory` - Create memory
- `PATCH /api/gemma/chat/memory/[id]` - Update memory
- `DELETE /api/gemma/chat/memory/[id]` - Delete memory

### 2.6 Folders API
- `GET /api/gemma/chat/folders` - List folders
- `POST /api/gemma/chat/folders` - Create folder
- `PATCH /api/gemma/chat/folders/[id]` - Rename folder
- `DELETE /api/gemma/chat/folders/[id]` - Delete folder
- `POST /api/gemma/chat/folders/[id]/move` - Move conversations to folder

### 2.7 Prompts API
- `GET /api/gemma/chat/prompts` - List saved prompts
- `POST /api/gemma/chat/prompts` - Save prompt
- `PATCH /api/gemma/chat/prompts/[id]` - Update prompt
- `DELETE /api/gemma/chat/prompts/[id]` - Delete prompt

### 2.8 Sharing API
- `POST /api/gemma/chat/conversations/[id]/share` - Create share link
- `DELETE /api/gemma/chat/share/[token]` - Revoke share link
- `GET /api/share/[token]` - Public share view
- `GET /api/gemma/chat/conversations/[id]/export` - Export conversation (markdown, JSON, PDF)

### 2.9 Search API
- `GET /api/gemma/chat/search` - Search conversations, messages, files, memories

---

## Phase 3: Frontend Components

### 3.1 Core Layout Components
- `ChatSidebar` - Main sidebar with conversation list
- `ConversationList` - Infinite scrolling conversation list
- `ConversationItem` - Individual conversation with hover actions
- `ChatContainer` - Main chat area container
- `MessageList` - Virtualized message list
- `MessageBubble` - Enhanced with copy/edit/retry actions ✅ DONE
- `ChatInput` - Auto-growing input with file uploads ✅ DONE
- `AttachmentPreview` - File preview with OCR ✅ DONE

### 3.2 Feature Components
- `ModelSelector` - Multi-model dropdown selector
- `SettingsPanel` - User settings management
- `MemoryPanel` - Memory management UI
- `FolderTree` - Folder hierarchy with drag-drop
- `PromptLibrary` - Saved prompts browser
- `ShareDialog` - Share conversation modal
- `ExportDialog` - Export options modal
- `SearchBar` - Global search with filters
- `CommandPalette` - Keyboard shortcuts (Cmd+K)

### 3.3 Message Actions
- Copy message button
- Edit message button
- Regenerate button
- Stop generation button
- Continue generation button
- Message context menu

---

## Phase 4: State Management (Redux Toolkit)

### 4.1 RTK Query API Slices
- `conversationsApi` - Conversation CRUD operations
- `messagesApi` - Message operations with streaming
- `attachmentsApi` - File upload/download
- `settingsApi` - User settings
- `memoryApi` - Memory management
- `foldersApi` - Folder operations
- `promptsApi` - Saved prompts
- `sharingApi` - Share links

### 4.2 Redux Slices
- `chatSlice` - Active conversation, selected message, UI state
- `sidebarSlice` - Sidebar state, filters, search
- `uiSlice` - Theme, modals, notifications

---

## Phase 5: Streaming Implementation

### 5.1 Server-Sent Events (SSE)
- Enhance existing `/api/gemma/chat` streaming
- Add conversation_id and message_id to responses
- Stream token-by-token updates
- Handle streaming cancellation
- Save messages to database during streaming

### 5.2 Client Streaming
- Real-time message updates
- Auto-scroll during generation
- Typing indicators
- Stop/pause controls

---

## Phase 6: Multi-Model Support

### 6.1 Model Configuration
```typescript
// lib/ai/models.ts
export const AI_MODELS = {
  GEMMA_LOCAL: {
    id: 'gemma-local',
    name: 'Gemma (Local)',
    provider: 'ollama',
    endpoint: process.env.OLLAMA_BASE_URL,
    model: process.env.OLLAMA_MODEL,
    features: ['multimodal', 'streaming'],
  },
  GEMMA_GATEWAY: {
    id: 'gemma-gateway',
    name: 'Gemma (Gateway)',
    provider: 'vllm',
    endpoint: process.env.GATEWAY_API_URL,
    model: process.env.GATEWAY_MODEL,
    features: ['streaming', 'text-only'],
  },
  // Add more models as needed
}
```

### 6.2 Model Adapter Pattern
- Create unified interface for different AI providers
- Handle different API formats (OpenAI, Anthropic, etc.)
- Manage model-specific features and limitations

---

## Phase 7: File Upload & Knowledge Base

### 7.1 Cloudinary Integration ✅ EXISTS
- Use existing `lib/storage/CloudinaryAdapter`
- Upload to `ai-chat/{userId}/{conversationId}/{filename}`

### 7.2 File Processing
- PDF text extraction
- OCR for images ✅ DONE (kagoj.ai API)
- Document chunking for context
- Embeddings generation (future)

### 7.3 Knowledge Retrieval
- Search through uploaded documents
- Semantic search (future with vector DB)
- Citation generation

---

## Phase 8: Memory System

### 8.1 Memory Storage
- Key-value memory store in database
- User-controlled enable/disable
- Memory search and filtering

### 8.2 Memory Integration
- Inject relevant memories into context
- Memory suggestions during chat
- Memory extraction from conversations

---

## Phase 9: UX Enhancements

### 9.1 Markdown & Code Rendering
- ✅ Markdown rendering (react-markdown)
- ✅ Syntax highlighting
- Code copy button
- Table rendering
- Math rendering (KaTeX)

### 9.2 Keyboard Shortcuts
- `Cmd/Ctrl + K` - Command palette
- `Cmd/Ctrl + N` - New chat
- `Cmd/Ctrl + /` - Toggle sidebar
- `Cmd/Ctrl + F` - Search
- `Esc` - Stop generation

### 9.3 Animations & Transitions
- Smooth message animations
- Loading skeletons
- Toast notifications
- Hover effects

---

## Phase 10: Mobile Responsiveness

### 10.1 Mobile Layout
- Bottom sheet sidebar
- Touch-optimized controls
- Swipe gestures
- Mobile-friendly file uploads

---

## Phase 11: Performance Optimization

### 11.1 Optimizations
- Message virtualization (react-window)
- Lazy loading conversations
- Image lazy loading
- Code splitting
- Query caching (RTK Query)

### 11.2 Database
- Proper indexing ✅ DONE
- Query optimization
- Pagination everywhere
- Background jobs for heavy processing

---

## Phase 12: Security & Authorization

### 12.1 Security Checks
- User ownership validation on all queries
- Rate limiting on AI endpoints
- Input sanitization
- XSS protection
- Secure file access (Cloudinary signed URLs)

### 12.2 Audit Logging
- Log all AI interactions
- Track token usage
- Monitor costs
- User activity tracking

---

## Implementation Priority

### Week 1: Core Foundation
1. ✅ Database schema
2. Core API routes (conversations, messages)
3. Basic sidebar and message list
4. Streaming chat with database persistence

### Week 2: File & Multi-Model
5. Cloudinary file upload integration
6. Multi-model selector
7. Model switching
8. File attachment rendering

### Week 3: Advanced Features
9. Memory system
10. Folders & organization
11. Saved prompts
12. User settings

### Week 4: Polish & UX
13. Search functionality
14. Sharing & export
15. Keyboard shortcuts
16. Mobile optimization

---

## Next Steps

1. **Start database**: `docker compose up -d`
2. **Run migration**: `pnpm db:migrate --name ai_chat_platform`
3. **Start with core API**: Create conversation and message endpoints
4. **Build basic UI**: Sidebar + Chat panel integration
5. **Add streaming**: Persist messages during streaming
6. **Iterate**: Add features one by one

All features will be added to the existing `/gemma/chat` route, preserving your current Gemma implementation and enhancing it with production-ready features.
