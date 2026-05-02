import Anthropic from '@anthropic-ai/sdk';
import { CHAT_CONFIG } from '../config/chat-config.js';
import { getAppSetting } from './app-settings.js';

class AnthropicService {
  constructor() {
    this.client = null;
    this.apiKeyInUse = null;
  }

  /**
   * Initialize (or re-initialize) the Anthropic client.
   *
   * The key is resolved at call time from the AppSetting table, falling
   * back to the ANTHROPIC_API_KEY env var. The client is re-created if
   * the active key changes (admin rotation), so updates from the admin
   * panel take effect without a redeploy.
   *
   * @returns {Promise<boolean>} - Whether the client is ready.
   */
  async initialize() {
    const apiKey = await getAppSetting('anthropic_api_key', {
      envFallback: 'ANTHROPIC_API_KEY',
    });
    if (!apiKey) {
      console.error('Anthropic API key not configured. Set it from the admin panel (Integrations) or via ANTHROPIC_API_KEY.');
      this.client = null;
      this.apiKeyInUse = null;
      return false;
    }
    if (this.client && this.apiKeyInUse === apiKey) return true;
    try {
      this.client = new Anthropic({ apiKey });
      this.apiKeyInUse = apiKey;
      return true;
    } catch (error) {
      console.error('Failed to initialize Anthropic client:', error);
      this.client = null;
      this.apiKeyInUse = null;
      return false;
    }
  }

  /**
   * Generate a response using Anthropic Claude
   * @param {string} userMessage - The user's message
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {Object} contextData - Additional context about the user/institution
   * @returns {Promise<string>} - The AI response
   */
  async generateResponse(userMessage, conversationHistory = [], contextData = {}) {
    // Initialize client if not already done
    if (!(await this.initialize())) {
      return "I'm sorry, but my AI service is not properly configured. Please contact your administrator to set up the Anthropic API key.";
    }

    try {
      // Build the system prompt with context
      const systemPrompt = this.buildSystemPrompt(contextData);

      // Build the messages array for Anthropic
      const messages = [
        ...this.formatConversationHistory(conversationHistory),
        { role: 'user', content: userMessage }
      ];

      const model = await getAppSetting('anthropic_model', {
        envFallback: 'ANTHROPIC_MODEL',
      }) || CHAT_CONFIG.ANTHROPIC_MODEL;

      const response = await this.client.messages.create({
        model,
        max_tokens: CHAT_CONFIG.ANTHROPIC_MAX_TOKENS,
        temperature: CHAT_CONFIG.ANTHROPIC_TEMPERATURE,
        system: systemPrompt,
        messages: messages,
      });

      const content = response.content[0]?.text?.trim();

      if (!content) {
        throw new Error('Empty response from Anthropic');
      }

      return content;
    } catch (error) {
      console.error('Anthropic API Error:', error);

      // Fallback responses for common errors
      if (error.status === 429) {
        return "I'm sorry, but my knowledge base is currently limited due to rate limits. Please try again later or contact your administrator.";
      }

      if (error.status === 401) {
        return "I'm having trouble connecting to my knowledge base. Please check the API configuration.";
      }

      if (error.status === 400) {
        return "I'm sorry, there was an issue with your request. Please try rephrasing your question.";
      }

      return "I'm sorry, I'm experiencing some technical difficulties. Please try again in a moment.";
    }
  }

  /**
   * Build the system prompt with user context
   * @param {Object} contextData - User and institution data
   * @returns {string} - Formatted system prompt
   */
  buildSystemPrompt(contextData) {
    let prompt = CHAT_CONFIG.SYSTEM_PROMPT;

    // Add user context if available
    if (contextData.userStats) {
      const { userStats } = contextData;
      const userInfo = `
USER CONTEXT:
- Name: ${userStats.name}${userStats.alias ? ` (alias: ${userStats.alias})` : ''}
- Role: ${userStats.isAdmin ? 'Administrator' : userStats.isTeacher ? 'Teacher' : 'Student'}
- Progress: ${userStats.solvedChallenges || 0} challenges solved, ${userStats.totalPoints || 0} total points
- Institution: ${userStats.institution || 'Not affiliated with an institution'}
      `.trim();

      prompt += '\n\n' + userInfo;
    }

    // Add institution context if available
    if (contextData.institutionStats) {
      const { institutionStats } = contextData;
      const institutionInfo = `
INSTITUTION CONTEXT:
- Institution: ${institutionStats.name}
- Total Users: ${institutionStats.totalUsers}
- Total Challenges: ${institutionStats.totalChallenges}
- Total Lessons: ${institutionStats.totalLessons}
      `.trim();

      prompt += '\n\n' + institutionInfo;
    }

    // Add recent challenges if available
    if (contextData.popularChallenges && contextData.popularChallenges.length > 0) {
      const challengeInfo = `
POPULAR CHALLENGES:
${contextData.popularChallenges.slice(0, 3).map((c, i) =>
  `${i + 1}. ${c.statement?.substring(0, 100) || 'Challenge'}... (${c.solves || 0} solves)`
).join('\n')}
      `.trim();

      prompt += '\n\n' + challengeInfo;
    }

    // Add recent lessons if available
    if (contextData.recentLessons && contextData.recentLessons.length > 0) {
      const lessonInfo = `
RECENT LESSONS:
${contextData.recentLessons.slice(0, 3).map((l, i) =>
  `${i + 1}. ${l.title}: ${l.description?.substring(0, 100) || 'No description'}...`
).join('\n')}
      `.trim();

      prompt += '\n\n' + lessonInfo;
    }

    // Add specific context (challenge or lesson)
    if (contextData.specificContext) {
      const { type, data } = contextData.specificContext;
      
      if (type === 'challenge') {
        const challengeInfo = `
CURRENT CHALLENGE CONTEXT:
- Challenge ID: ${data.id}
- Statement: ${data.statement}
- Level: ${data.level} (1=Beginner, 2=Easy, 3=Medium, 4=Hard, 5=Expert)
- Help: ${data.help}

IMPORTANT: You are helping with this specific SQL challenge. The user needs to write a SQL query to solve it. Provide guidance, explain concepts, and help debug, but DO NOT give the complete solution. Guide the user to discover the answer themselves through hints and explanations.
        `.trim();
        
        prompt += '\n\n' + challengeInfo;
      } else if (type === 'lesson') {
        const lessonInfo = `
CURRENT LESSON CONTEXT:
- Lesson ID: ${data.id}
- Title: ${data.title}
- Description: ${data.description || 'No description provided'}
- Creator: ${data.creator?.name || data.creator?.alias || 'Unknown'}
- Institution: ${data.institution || 'General'}
- Created: ${new Date(data.created_at).toLocaleDateString()}

You are helping with this specific lesson. Use the lesson content to provide relevant examples and explanations.

Dont get pitty of people who ask for the answer. They are learning and you are helping them. Never give the answer. Always guide them to the answer.
        `.trim();
        
        prompt += '\n\n' + lessonInfo;
      }
    }

    return prompt;
  }

  /**
   * Format conversation history for Anthropic
   * @param {Array} history - Previous conversation messages
   * @returns {Array} - Formatted messages for Anthropic
   */
  formatConversationHistory(history) {
    if (!history || history.length === 0) return [];

    // Limit history to prevent token limit issues
    const recentHistory = history.slice(-CHAT_CONFIG.MAX_HISTORY_LENGTH);

    return recentHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  /**
   * Get available Anthropic models (for configuration)
   * @returns {Array} - List of available models
   */
  getAvailableModels() {
    return [
      { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 — fastest & cheapest (recommended)' },
      { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 — better quality, higher cost' },
      { id: 'claude-opus-4-7', label: 'Opus 4.7 — top quality, highest cost' },
    ];
  }
}

// Export singleton instance
export const anthropicService = new AnthropicService();
export default anthropicService;
