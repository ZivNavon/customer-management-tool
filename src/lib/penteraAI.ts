import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Note: In production, this should be handled server-side
});

export interface AIAnalysisInput {
  meetingNotes: string;
  screenshots: File[];
  customerName: string;
  customerContext?: {
    previousMeetings?: string[];
    communicationStyle?: string;
    technicalBackground?: string;
  };
  meetingType?: 'consultation' | 'follow-up' | 'technical' | 'planning';
}

export interface AIAnalysisResult {
  summary: string;
  keyFindings: string[];
  actionItems: string[];
  technicalRecommendations: string[];
  nextSteps: string[];
  emailDraft: string;
}

// Pentera/Cybersecurity specific terminology and context
const CYBERSECURITY_CONTEXT = `
You are an AI assistant helping a cybersecurity consultant at Pentera who conducts penetration testing and network validation for enterprise clients.

IMPORTANT CONTEXT:
- Pentera is a continuous automated penetration testing platform
- The consultant helps customers understand security findings, build remediation plans, and optimize their security posture
- Meetings typically involve reviewing attack simulation results, discussing vulnerabilities, and planning security improvements
- The consultant speaks Hebrew but uses English technical terms
- Always anonymize any IP addresses, domain names, or sensitive identifiers in outputs

COMMON TERMS:
- Attack Surface Management (ASM)
- Continuous Automated Red Team (CART)
- Lateral Movement
- Privilege Escalation
- Network Segmentation
- Vulnerability Assessment
- Penetration Testing
- Security Controls Validation
- Remediation Priorities
- Risk Assessment
- CVE (Common Vulnerabilities and Exposures)
- MITRE ATT&CK Framework
- Zero Trust Architecture
- SOC (Security Operations Center)
- SIEM (Security Information and Event Management)
`;

const EMAIL_TEMPLATE_CONTEXT = `
EXPECTED EMAIL FORMAT (Hebrew + English technical terms):
Subject: סיכום פגישה - [Customer Name] - [Date]

היי [Contact Name],

תודה על הפגישה היום. להלן סיכום הנקודות העיקריות:

**ממצאים עיקריים:**
[Key findings from penetration testing/validation]

**משימות שהוגדרו:**
[Defined tasks and action items]

**המלצות טכניות:**
[Technical recommendations]

**צעדים הבאים:**
[Next steps]

**קישורים וחומרים מועילים:**
[Helpful links and guides]

אשמח לענות על כל שאלה נוספת.

בברכה,
[Name]
`;

export class PenteraAIService {
  private static instance: PenteraAIService;

  public static getInstance(): PenteraAIService {
    if (!PenteraAIService.instance) {
      PenteraAIService.instance = new PenteraAIService();
    }
    return PenteraAIService.instance;
  }

  private async analyzeScreenshots(screenshots: File[]): Promise<string[]> {
    const analyses: string[] = [];
    
    for (const screenshot of screenshots.slice(0, 3)) { // Limit to 3 screenshots for cost control
      try {
        // Convert file to base64
        const base64 = await this.fileToBase64(screenshot);
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Use gpt-4o-mini for image analysis (cost-effective)
          messages: [
            {
              role: "system",
              content: `${CYBERSECURITY_CONTEXT}

Analyze this screenshot from a cybersecurity consultation meeting. Focus on:
1. Any visible security findings or vulnerabilities
2. System configurations or network topology
3. Security tools or dashboards visible
4. Technical details that might be relevant to remediation

CRITICAL: Anonymize all IP addresses, domain names, usernames, and company-specific identifiers. Replace with generic placeholders like [IP_ADDRESS], [DOMAIN], [USERNAME], etc.

Provide a brief technical analysis in 2-3 sentences.`
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        });

        if (response.choices[0]?.message?.content) {
          analyses.push(response.choices[0].message.content);
        }
      } catch (error) {
        console.error('Error analyzing screenshot:', error);
        analyses.push('Screenshot analysis failed - manual review required');
      }
    }

    return analyses;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  public async generateMeetingSummary(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    try {
      // Analyze screenshots if provided
      let screenshotAnalyses: string[] = [];
      if (input.screenshots.length > 0) {
        screenshotAnalyses = await this.analyzeScreenshots(input.screenshots);
      }

      // Generate comprehensive meeting analysis
      const analysisPrompt = `${CYBERSECURITY_CONTEXT}

MEETING CONTEXT:
- Customer: ${input.customerName}
- Meeting Type: ${input.meetingType || 'consultation'}
- Screenshots Analyzed: ${screenshotAnalyses.length}

MEETING NOTES:
${input.meetingNotes}

SCREENSHOT ANALYSES:
${screenshotAnalyses.map((analysis, i) => `Screenshot ${i + 1}: ${analysis}`).join('\n')}

CUSTOMER CONTEXT:
${input.customerContext ? JSON.stringify(input.customerContext, null, 2) : 'No additional context provided'}

Please provide a structured analysis with the following sections:
1. **MEETING_SUMMARY** - Brief overview of the meeting
2. **KEY_FINDINGS** - Main security findings and observations
3. **ACTION_ITEMS** - Specific tasks and deliverables
4. **TECHNICAL_RECOMMENDATIONS** - Technical guidance and recommendations
5. **NEXT_STEPS** - Immediate next steps and follow-up actions

Format your response as a JSON object with these exact keys: summary, keyFindings, actionItems, technicalRecommendations, nextSteps

IMPORTANT: Anonymize all sensitive information (IPs, domains, usernames) in your response.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Use GPT-4 for complex analysis
        messages: [
          {
            role: "system",
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const analysisResult = response.choices[0]?.message?.content;
      
      if (!analysisResult) {
        throw new Error('No analysis result from OpenAI');
      }

      // Parse the JSON response
      let parsedResult;
      try {
        parsedResult = JSON.parse(analysisResult);
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        parsedResult = {
          summary: analysisResult.substring(0, 500),
          keyFindings: ['Analysis generated - see summary for details'],
          actionItems: ['Review full analysis and create specific action items'],
          technicalRecommendations: ['Technical review recommended'],
          nextSteps: ['Schedule follow-up meeting']
        };
      }

      // Generate Hebrew email draft
      const emailDraft = await this.generateEmailDraft(input, parsedResult);

      return {
        summary: parsedResult.summary || 'Summary generation failed',
        keyFindings: Array.isArray(parsedResult.keyFindings) ? parsedResult.keyFindings : [],
        actionItems: Array.isArray(parsedResult.actionItems) ? parsedResult.actionItems : [],
        technicalRecommendations: Array.isArray(parsedResult.technicalRecommendations) ? parsedResult.technicalRecommendations : [],
        nextSteps: Array.isArray(parsedResult.nextSteps) ? parsedResult.nextSteps : [],
        emailDraft
      };

    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw new Error('Failed to generate AI analysis');
    }
  }

  private async generateEmailDraft(input: AIAnalysisInput, analysis: any): Promise<string> {
    const emailPrompt = `${CYBERSECURITY_CONTEXT}

${EMAIL_TEMPLATE_CONTEXT}

Generate a professional follow-up email in Hebrew for a Pentera cybersecurity consultation meeting.

MEETING DETAILS:
- Customer: ${input.customerName}
- Meeting Notes: ${input.meetingNotes}
- Key Findings: ${JSON.stringify(analysis.keyFindings)}
- Action Items: ${JSON.stringify(analysis.actionItems)}
- Technical Recommendations: ${JSON.stringify(analysis.technicalRecommendations)}
- Next Steps: ${JSON.stringify(analysis.nextSteps)}

REQUIREMENTS:
1. Write primarily in Hebrew
2. Use English for technical terms (leave untranslated)
3. Follow the provided email template structure
4. Be professional and concise
5. Include specific action items and next steps
6. Anonymize any sensitive information
7. Include placeholder for helpful links/guides section

Generate only the email content (no subject line needed).`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: emailPrompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1500
      });

      return response.choices[0]?.message?.content || 'Email draft generation failed';
    } catch (error) {
      console.error('Error generating email draft:', error);
      return 'שגיאה ביצירת טיוטת המייל - יש לבדוק ידנית';
    }
  }
}

export const penteraAI = PenteraAIService.getInstance();
