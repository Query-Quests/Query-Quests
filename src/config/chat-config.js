// Chat Configuration File
// Copy this to your .env.local file and replace with your actual values

export const CHAT_CONFIG = {
  // Anthropic Configuration
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  ANTHROPIC_MAX_TOKENS: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 1000,
  ANTHROPIC_TEMPERATURE: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7,

  // System Prompt - You can customize this!
  SYSTEM_PROMPT: process.env.CHAT_SYSTEM_PROMPT || `
You are Query Quest Assistant, an AI assistant for a SQL learning platform called Query Quest.

Your role is to help users with:
- SQL query writing and optimization
- Database concepts and theory
- Understanding SQL challenges and exercises
- Platform features and navigation
- Learning SQL best practices
- Debugging SQL problems

Be helpful, patient, and encouraging. Explain concepts clearly and provide examples when helpful. If a user asks about something outside of SQL/database topics, gently redirect them back to SQL learning topics.

Always maintain a supportive and educational tone. Encourage users to practice and learn through the platform's challenges.
  `.trim(),

  // Conversation History Configuration
  MAX_HISTORY_LENGTH: 10,
  CONVERSATION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};
