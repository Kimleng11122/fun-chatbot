# Usage Tracking and Pricing

This document explains the usage tracking and pricing features implemented in the Fun Chatbot application.

## Features

### 1. Token Usage Tracking
- **Automatic Tracking**: Every AI response is automatically tracked for token usage
- **Token Counting**: Approximate token counting using character-based estimation
- **Cost Calculation**: Real-time cost calculation based on OpenAI's pricing

### 2. Usage Dashboard
- **Comprehensive Statistics**: View total tokens, costs, and message counts
- **Time-based Filtering**: Filter usage by 7, 30, or 90 days
- **Visual Charts**: Interactive charts showing usage trends
- **Model Breakdown**: See usage distribution across different AI models

### 3. Real-time Usage Indicator
- **Quick Overview**: See current usage stats in the chat interface
- **Live Updates**: Usage stats update automatically
- **Minimal UI**: Non-intrusive display in the header

## How It Works

### Token Counting
The application uses an approximate token counting method:
- 1 token ≈ 4 characters for English text
- Counts both input (prompt) and output (completion) tokens
- Calculates total tokens per message

### Cost Calculation
Costs are calculated using OpenAI's current pricing:
- **GPT-4**: $0.03/1K input, $0.06/1K output
- **GPT-4 Turbo**: $0.01/1K input, $0.03/1K output
- **GPT-3.5 Turbo**: $0.0015/1K input, $0.002/1K output

### Data Storage
Usage data is stored in Firebase Firestore:
- Collection: `usage`
- Fields: userId, conversationId, messageId, model, tokens, cost, timestamp

## API Endpoints

### GET /api/usage
Fetches usage statistics for a user.

**Query Parameters:**
- `userId` (required): User ID
- `days` (optional): Number of days to include (default: 30)

**Response:**
```json
{
  "stats": {
    "totalTokens": 15000,
    "totalCost": 0.045,
    "totalMessages": 50,
    "averageTokensPerMessage": 300,
    "usageByModel": {
      "gpt-3.5-turbo": {
        "tokens": 15000,
        "cost": 0.045,
        "messages": 50
      }
    },
    "usageByDate": {
      "2024-01-15": {
        "tokens": 1000,
        "cost": 0.003,
        "messages": 5
      }
    }
  },
  "recentUsage": [...],
  "pricing": [...]
}
```

## Usage Dashboard

### Access
Users can access the usage dashboard by:
1. Clicking the "Usage" link in the chat header
2. Navigating to `/usage` directly

### Features
- **Summary Cards**: Quick overview of total usage
- **Interactive Charts**: Visual representation of usage data
- **Tabbed Interface**: Organized sections for different views
- **Time Range Selection**: Filter data by different time periods

### Charts Available
1. **Daily Token Usage**: Line chart showing token usage over time
2. **Model Distribution**: Pie chart showing usage by AI model
3. **Daily Breakdown**: Bar chart showing tokens and costs per day

## Configuration

### Pricing Updates
To update pricing information, modify the `OPENAI_PRICING` object in `src/lib/openai.ts`:

```typescript
export const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  // Add new models here
};
```

### Token Counting
For more accurate token counting, consider using the `tiktoken` library:

```bash
npm install tiktoken
```

Then update the `countTokens` function in `src/lib/openai.ts`.

## Security Considerations

- Usage data is tied to user authentication
- Users can only view their own usage data
- API endpoints validate user permissions
- Sensitive pricing information is server-side only

## Future Enhancements

1. **Usage Limits**: Implement daily/monthly usage limits
2. **Billing Integration**: Connect to payment processors
3. **Usage Alerts**: Notify users when approaching limits
4. **Export Data**: Allow users to export usage reports
5. **Team Usage**: Track usage across team members

## Troubleshooting

### Common Issues

1. **Usage not showing**: Ensure user is authenticated
2. **Incorrect costs**: Check if pricing is up to date
3. **Missing data**: Verify Firebase connection and permissions

### Debug Mode
Enable debug logging by adding to environment variables:
```
DEBUG_USAGE=true
```

This will log detailed usage information to the console. 