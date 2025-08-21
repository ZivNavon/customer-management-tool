# AI Meeting Summary Setup Guide

## Overview
The AI Meeting Summary feature uses OpenAI's GPT-4 and GPT-4o-mini models to analyze meeting notes and screenshots, generating structured summaries in Hebrew with English technical terms specifically tailored for Pentera cybersecurity consultations.

## Features
- **Meeting Notes Analysis**: Extracts key findings, action items, and technical recommendations
- **Screenshot Analysis**: Analyzes up to 3 screenshots using GPT-4o-mini vision capabilities
- **Anonymization**: Automatically anonymizes IP addresses, domains, and sensitive information
- **Hebrew Email Drafts**: Generates professional follow-up emails in Hebrew with English technical terms
- **Cybersecurity Context**: Understands Pentera-specific terminology and penetration testing concepts

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Configure Environment
1. Open `.env.local` file in the project root
2. Replace `your_openai_api_key_here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 3. Security Note
⚠️ **Important**: The current implementation uses `dangerouslyAllowBrowser: true` for development purposes. For production, you should:
- Move API calls to server-side (Next.js API routes)
- Never expose API keys in client-side code
- Implement proper authentication and rate limiting

## Usage

### 1. In Meeting Modal
1. Add meeting notes in the text area
2. Upload screenshots (optional but recommended)
3. Click "Generate AI Summary" button
4. Review the generated analysis

### 2. Generated Output
The AI will provide:
- **Meeting Summary**: Overview of the consultation
- **Key Findings**: Security findings and observations
- **Action Items**: Specific tasks and deliverables
- **Technical Recommendations**: Technical guidance
- **Hebrew Email Draft**: Professional follow-up email

### 3. Saving and Retrieval
- AI summaries are automatically saved with meetings
- Previously generated summaries are loaded when editing meetings
- Full analysis can be copied to clipboard

## Customization

### 1. Technical Terms Glossary
Edit `src/lib/penteraAI.ts` to add or modify cybersecurity terms in the `CYBERSECURITY_CONTEXT` constant.

### 2. Email Template
Modify the `EMAIL_TEMPLATE_CONTEXT` in `src/lib/penteraAI.ts` to change the Hebrew email format.

### 3. Meeting Types
Add more meeting types by extending the `meetingType` parameter options in the `AIAnalysisInput` interface.

## Cost Considerations
- **GPT-4o**: Used for text analysis and email generation (~$0.03 per 1K tokens)
- **GPT-4o-mini**: Used for image analysis (~$0.0005 per 1K tokens)
- **Rate Limits**: OpenAI has rate limits based on your subscription tier

## Troubleshooting

### Common Issues
1. **"API key not found"**: Check your `.env.local` file
2. **"Failed to generate"**: Check internet connection and API key validity
3. **"Rate limit exceeded"**: Wait or upgrade your OpenAI subscription

### Error Handling
The system gracefully handles:
- Network failures
- API rate limits
- Image processing errors
- Invalid API responses

## Development Notes

### File Structure
- `src/lib/penteraAI.ts`: Core AI service
- `src/components/AISummary.tsx`: UI component
- `src/components/MeetingModal.tsx`: Integration point
- `src/types/index.ts`: TypeScript interfaces

### Testing
- Test with various note lengths and screenshot types
- Verify Hebrew text rendering (right-to-left)
- Check anonymization of sensitive data

## Future Enhancements
- Server-side API implementation
- Custom model fine-tuning for Pentera-specific language
- Integration with meeting transcripts
- Multi-language support
- Customer-specific terminology learning
