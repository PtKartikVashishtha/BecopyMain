import Talk from 'talkjs';

// TalkJS App ID and configuration
const TALKJS_APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID;

if (!TALKJS_APP_ID) {
  throw new Error('NEXT_PUBLIC_TALKJS_APP_ID is not defined in environment variables');
}

// TalkJS instance singleton
let talkjsInstance: typeof Talk | null = null;

/**
 * Initialize TalkJS SDK
 */
export const initializeTalkJS = async (): Promise<typeof Talk> => {
  if (talkjsInstance) {
    return talkjsInstance;
  }

  try {
    await Talk.ready;
    talkjsInstance = Talk;
    return Talk;
  } catch (error) {
    console.error('Failed to initialize TalkJS:', error);
    throw new Error('TalkJS initialization failed');
  }
};

/**
 * Create TalkJS User from your user data
 */
export const createTalkJSUser = (userData: {
  id: string;
  name: string;
  email: string;
  userType?: string;
  country?: string;
}): Talk.User => {
  if (!talkjsInstance) {
    throw new Error('TalkJS not initialized. Call initializeTalkJS() first.');
  }

  return new talkjsInstance.User({
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.userType || 'user',
    photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userData.name
    )}&background=0D8ABC&color=fff&size=128`,
    custom: {
      userType: userData.userType || 'user',
      country: userData.country || ''
    }
  });
};

/**
 * Create TalkJS Session with authentication
 */
export const createTalkJSSession = async (
  user: {
    id: string;
    name: string;
    email: string;
    userType?: string;
    country?: string;
  },
  sessionToken?: string
): Promise<Talk.Session> => {
  const Talk = await initializeTalkJS();

  const talkjsUser = createTalkJSUser(user);

  const session = new Talk.Session({
    appId: TALKJS_APP_ID,
    me: talkjsUser,
    ...(sessionToken && { signature: sessionToken })
  });

  return session;
};

/**
 * Create TalkJS Conversation
 */
export const createTalkJSConversation = (
  session: Talk.Session,
  conversationId: string,
  participants: Array<{
    id: string;
    name: string;
    email: string;
    userType?: string;
    country?: string;
  }>,
  options?: {
    subject?: string;
    photoUrl?: string;
    welcomeMessages?: string[];
  }
): Talk.ConversationBuilder => {
  const conversation = session.getOrCreateConversation(conversationId);

  // Add all participants
  participants.forEach((participant) => {
    const talkjsUser = createTalkJSUser(participant);
    conversation.setParticipant(talkjsUser);
  });

  // Set conversation properties
  if (options?.subject || options?.photoUrl) {
    conversation.setAttributes({
      subject: options.subject,
      photoUrl: options.photoUrl
    });
  }

  // Add welcome messages
  if (options?.welcomeMessages && options.welcomeMessages.length > 0) {
    options.welcomeMessages.forEach((message) => {
      conversation.sendMessage({
        text: message,
        type: 'system'
      } as Talk.Message);
    });
  }

  return conversation;
};

/**
 * Chat UI Theme Styles (instead of invalid `theme` object)
 */
export const chatUITheme: Talk.StyleSet = {
  colors: {
    primary: '#0D8ABC',
    secondary: '#f1f5f9',
    background: '#ffffff',
    accent: '#06b6d4',
    chatBackground: '#f8fafc',
    messageBackground: '#ffffff',
    userMessageBackground: '#0D8ABC'
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif'
  }
};

/**
 * Mobile responsive chat configuration
 */
export const mobileConfig = {
  showMobileHeader: true,
  showSendingIndicator: true,
  showOnlineStatus: true,
  maxCharacters: 5000,
  messageSizeLimit: 1024 * 1024 * 5, // 5MB
  enableFileSharing: true,
  enableReactions: true
};

/**
 * Desktop chat configuration
 */
export const desktopConfig = {
  enableFullscreen: true,
  showOnlineStatus: true,
  maxCharacters: 5000,
  messageSizeLimit: 1024 * 1024 * 10, // 10MB
  enableFileSharing: true,
  enableReactions: true,
  enableMarkdown: true
};

/**
 * Chatbox mount options for different screen sizes
 */
export const getChatboxOptions = (
  isMobile: boolean = false
): Talk.ChatboxOptions => ({
  theme: 'default',
  styles: chatUITheme,
  ...(isMobile ? mobileConfig : desktopConfig)
});

/**
 * Popup mount options
 */
export const getPopupOptions = (): Talk.PopupOptions => ({
  theme: 'default',
  styles: chatUITheme,
  ...desktopConfig
});

/**
 * Inbox mount options for conversation list
 */
export const getInboxOptions = (): Talk.InboxOptions => ({
  theme: 'default',
  styles: chatUITheme,
  showMobileHeader: true,
  feedFilter: { hasUnreadMessages: false, custom: { archived: ['!=', 'true'] } }
});

/**
 * Utility function to get conversation ID format
 */
export const getConversationId = (inviteId: string): string => {
  return `chat_${inviteId}`;
};

/**
 * Utility function to detect mobile devices
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Cleanup TalkJS session
 */
export const cleanupTalkJSSession = (session: Talk.Session): void => {
  try {
    session.destroy();
  } catch (error) {
    console.error('Error cleaning up TalkJS session:', error);
  }
};

/**
 * Error handler for TalkJS operations
 */
export const handleTalkJSError = (error: any, operation: string): void => {
  console.error(`TalkJS ${operation} error:`, error);

  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
};

/**
 * Check if TalkJS is ready
 */
export const isTalkJSReady = (): boolean => {
  return talkjsInstance !== null;
};

/**
 * Get TalkJS instance (use with caution)
 */
export const getTalkJSInstance = (): typeof Talk | null => {
  return talkjsInstance;
};

export default {
  initializeTalkJS,
  createTalkJSUser,
  createTalkJSSession,
  createTalkJSConversation,
  chatUITheme,
  getChatboxOptions,
  getPopupOptions,
  getInboxOptions,
  getConversationId,
  isMobileDevice,
  cleanupTalkJSSession,
  handleTalkJSError,
  isTalkJSReady,
  getTalkJSInstance
};
