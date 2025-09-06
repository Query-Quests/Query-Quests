# Query Quest Chatbot Setup Guide

## 🎯 Overview
Your chatbot has been successfully integrated with Anthropic Claude! This guide will help you configure and customize the AI assistant.

## 📋 Prerequisites
- Anthropic API account with API key
- Next.js application running

## 🚀 Quick Setup

### 1. Environment Configuration
Create a `.env.local` file in your project root:

```bash
# Copy the config template
cp src/config/chat-config.js src/.env.local
```

Then edit `.env.local` with your actual values:
```env
# Database
DATABASE_URL="file:./dev.db"

# Anthropic Configuration
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=1000
ANTHROPIC_TEMPERATURE=0.7

# Chat Configuration
CHAT_SYSTEM_PROMPT=Your custom system prompt here...
```

### 2. Get Your Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file

### 3. Customize the System Prompt
Edit the system prompt in `src/config/chat-config.js`:

```javascript
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

Always maintain a supportive and educational tone.
  `.trim(),
```

## ⚙️ Configuration Options

### Anthropic Settings
- **ANTHROPIC_MODEL**: Choose your model (`claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`)
- **ANTHROPIC_MAX_TOKENS**: Maximum response length (100-4000 tokens)
- **ANTHROPIC_TEMPERATURE**: Creativity level (0.0-1.0, lower = more focused)

### Chat Behavior
- **MAX_HISTORY_LENGTH**: Number of previous messages to include (default: 10)
- **CONVERSATION_TIMEOUT**: Session timeout in milliseconds (default: 30 minutes)

## 🎨 Customization Features

### 1. System Prompt Refinement
The system prompt controls the AI's personality and behavior. You can customize:

- **Personality**: Make it more formal, casual, or educational
- **Focus Areas**: Emphasize specific SQL topics or learning goals
- **Response Style**: Define how detailed or concise responses should be
- **Safety Guidelines**: Add content restrictions or educational boundaries

### 2. Context Integration
The chatbot automatically includes:
- **User Progress**: Solved challenges, points, role
- **Institution Data**: Stats, popular challenges, recent lessons
- **Personalization**: User name, alias, institutional affiliation

### 3. Conversation Management
- **History Tracking**: Maintains conversation context
- **Token Management**: Prevents exceeding Anthropic limits
- **Error Handling**: Graceful fallbacks for API issues

## 🔧 Advanced Configuration

### Testing Different Models
Update your `.env.local`:
```env
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # For more advanced responses
# ANTHROPIC_MODEL=claude-3-5-haiku-20241022  # For faster, cheaper responses
```

### Adjusting Response Length
```env
ANTHROPIC_MAX_TOKENS=1500  # For longer, more detailed responses
ANTHROPIC_MAX_TOKENS=500   # For shorter, concise responses
```

### Fine-tuning Temperature
```env
ANTHROPIC_TEMPERATURE=0.3  # More focused, consistent responses
ANTHROPIC_TEMPERATURE=0.9  # More creative, varied responses
```

## 🧪 Testing & Development

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test the Chatbot
1. Log in to your application
2. Click the red chat bubble in the bottom-right corner
3. Ask questions like:
   - "What's my progress?"
   - "Help me with SQL JOINs"
   - "Explain database normalization"
   - "Show me a SQL query example"

### 3. Monitor API Usage
Check your Anthropic dashboard for:
- Token usage
- API costs
- Rate limits
- Error rates

## 📊 Monitoring & Analytics

### Anthropic Usage Tracking
- Monitor your API usage in the Anthropic console
- Set up billing alerts for cost management
- Track token consumption patterns

### Error Handling
The system includes built-in error handling for:
- Invalid API keys
- Rate limiting
- Network issues
- Token limits

## 🚨 Troubleshooting

### Common Issues

**"API key not configured"**
- Check your `.env.local` file
- Ensure the API key is valid
- Restart your development server

**"Rate limit exceeded"**
- Anthropic has usage limits based on your plan
- Consider upgrading your Anthropic plan
- Implement caching for repeated questions

**"Empty responses"**
- Check your system prompt configuration
- Verify Anthropic API key permissions
- Check the Anthropic service status

### Getting Help
- Check Anthropic documentation for API issues
- Review the browser console for client-side errors
- Check server logs for API-related errors

## 🎯 Best Practices

### Prompt Engineering
1. **Be Specific**: Clearly define the AI's role and limitations
2. **Provide Context**: Include relevant user and platform information
3. **Set Boundaries**: Define what topics are in/out of scope
4. **Maintain Consistency**: Keep the personality consistent across interactions

### Performance Optimization
1. **Token Management**: Keep responses concise to save tokens
2. **Caching**: Consider caching common responses
3. **Rate Limiting**: Implement user-based rate limiting if needed
4. **Error Recovery**: Provide fallbacks for API failures

### User Experience
1. **Response Time**: Aim for quick responses (< 3 seconds)
2. **Clarity**: Use simple language and clear explanations
3. **Helpfulness**: Always provide actionable advice
4. **Engagement**: Encourage continued learning and practice

## 📝 Example System Prompts

### Educational Focus
```
You are an expert SQL tutor helping students learn database concepts. Explain topics step-by-step, provide examples, and encourage hands-on practice. Always relate concepts back to the Query Quest platform challenges.
```

### Technical Focus
```
You are a senior database engineer helping with SQL queries and database design. Provide technical accuracy, best practices, and optimization tips. Include code examples and explain trade-offs.
```

### Beginner Friendly
```
You are a patient SQL teacher for beginners. Use simple explanations, avoid jargon, and provide lots of examples. Celebrate small wins and encourage continued learning.
```

## 🔄 Updating Configuration

After making changes to your configuration:

1. Restart your development server
2. Test the chatbot with various questions
3. Monitor response quality and adjust as needed
4. Update documentation for your team

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your Anthropic API key is valid
3. Review server logs for API errors
4. Test with simple questions first
5. Check Anthropic's status page for service issues

---

**🎉 Your AI-powered chatbot is ready!** Customize the prompts, test different configurations, and provide excellent SQL learning assistance to your users.
