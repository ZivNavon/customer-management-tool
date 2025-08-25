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
- The consultant speaks Hebrew but uses English technical terms integrated naturally
- Always anonymize any IP addresses, domain names, company names, or sensitive identifiers in outputs

COMMON TEST TYPES:
- BB (Black Box) - External penetration testing without internal knowledge
- GB (Gray Box) - Internal testing with limited access and credentials
- RR (Ransomware) - Ransomware simulation campaigns (Cl0p, Lockbit, etc.)
- ADPA (Active Directory Password Assessment) - Password strength and policy evaluation
- AB (Attack Bridge) - Agent-based attack deployment method
- RAN (Remote Attack Node) - Remote testing infrastructure deployment
- DAN (Dynamic Attack Node) - Dynamic attack infrastructure

COMMON TECHNICAL FINDINGS:
- SNMP v1/2 vulnerabilities (recommend SNMPv3)
- LLMNR/NetBios/mDns exploitation
- Reverse shell establishment
- Crypto mining malware deployment
- EDR/AV bypasses
- Privilege escalation
- Lateral movement
- Persistent access mechanisms
- Password policy violations
- Network segmentation issues

COMMON RECOMMENDATIONS:
- Network protocol hardening
- EDR configuration optimization
- User awareness training
- Regular penetration testing schedules
- MDR team response procedures
- SIEM integration
- Wiki documentation updates
- Scheduled recurring assessments

INFRASTRUCTURE TERMS:
- VLAN segmentation
- Domain controllers
- Attack surface management
- Network interface configurations
- RAN (Remote Attack Node) - Remote testing infrastructure
- AB (Attack Bridge) - Agent-based deployment method
- DAN (Dynamic Attack Node) - Dynamic attack infrastructure
- Ubuntu migration procedures
- SSH service accounts
- Network topology analysis
`;

const EMAIL_TEMPLATE_CONTEXT = `
EXPECTED EMAIL FORMAT (Based on authentic Pentera consultation emails):

צוות [CUSTOMER_NAME] היקרים,
להלן עיקרי הדברים שעברנו עליהם בפגישתינו האחרונה

מעבר על תוצאות:
	1. [Test Type] - [Campaign/Test Name]
		a. [Finding 1 with technical details]
		b. [Finding 2 with remediation recommendations]
		c. [Additional findings if applicable]

הגדרת ריצות מתוזמנות:
	1. [Scheduled test configuration]
	2. [Additional scheduling details]

בקשות טכניות:
	1. [Technical requests or configurations needed]

צעדים להמשך:
	1. [Next steps and action items]
	2. [Follow-up activities]

במידה ויש לכם שאלות/בקשות נוספות, תרגישו חופשי לפנות אליי.

בברכה,

STYLE NOTES:
- Use formal Hebrew with technical English terms integrated naturally
- Structure with numbered lists and sub-items (a., b., c.)
- Include specific technical recommendations with acronyms (EDR, SNMP, VLAN, etc.)
- Always end with the standard closing phrase
- Use "Pentera" consistently for the platform name
- Include specific test types: BB (Black Box), GB (Grey Box), RR (Red Team), ADPA
- Reference protocols: LLMNR/NetBios/mDns, SNMP, HTTP, etc.
- Mention remediation actions and wiki guides when relevant
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

Please analyze this Pentera cybersecurity consultation meeting and structure your response as follows:

1. **MEETING_SUMMARY** - Brief overview focusing on test results and security posture
2. **KEY_FINDINGS** - Extract specific technical findings like:
   - Test type results (BB/GB/RR/ADPA outcomes)
   - Protocol vulnerabilities (SNMP, LLMNR/NetBios/mDns)
   - Malware deployment success (crypto mining, ransomware)
   - EDR/AV bypass incidents
   - Privilege escalation paths
   - Network segmentation issues
   - Password policy violations
   - Active Directory security gaps
3. **ACTION_ITEMS** - Specific technical tasks like:
   - Schedule recurring tests (BB, GB, RR, ADPA cycles)
   - Configure test environments (RAN, AB, DAN deployments)
   - Deploy infrastructure components
   - Update security policies and configurations
   - Coordinate with MDR teams
4. **TECHNICAL_RECOMMENDATIONS** - Specific remediation advice:
   - Protocol hardening (SNMPv3, disable LLMNR)
   - EDR configuration improvements
   - Network segmentation enhancements
   - User awareness training needs
5. **NEXT_STEPS** - Immediate follow-up actions and scheduling

Format your response as a JSON object with these exact keys: summary, keyFindings, actionItems, technicalRecommendations, nextSteps

IMPORTANT: 
- Focus on cybersecurity findings and remediation
- Use technical terminology consistent with Pentera platform
- Anonymize all sensitive information (IPs, domains, usernames)
- Prioritize actionable recommendations`;

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
      
      // Check for specific OpenAI errors
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          throw new Error('⏱️ Rate limit exceeded. Please wait 1-2 minutes and try again. Consider upgrading your OpenAI plan for higher limits.');
        } else if (error.message.includes('401')) {
          throw new Error('🔑 Invalid API key. Please check your OpenAI API key in settings.');
        } else if (error.message.includes('403')) {
          throw new Error('🚫 API key lacks required permissions. Ensure it has access to GPT-4o models.');
        }
      }
      
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
1. Write primarily in Hebrew with professional tone
2. Use English for ALL technical terms (SNMP, VLAN, EDR, etc.) - do NOT translate them
3. Follow the numbered structure exactly as shown in the template
4. Use tabs for sub-items (a., b., c.)
5. Include specific technical details like protocol names, vulnerability types
6. Mention "מומלץ" (recommended) for remediation actions
7. Reference wiki guides and documentation when relevant
8. End with the exact phrase: "במידה ויש לכם שאלות/בקשות נוספות, תרגישו חופשי לפנות אליי."
9. Include "בברכה," at the end
10. Anonymize any sensitive data with [PLACEHOLDER] format
11. Use "Pentera" consistently (not פנטרה)
12. Structure findings by test types (BB, GB, RR, ADPA, AB, RAN, DAN)
13. Use correct abbreviations:
    - BB = Black Box testing
    - GB = Gray Box testing  
    - RR = Ransomware testing
    - ADPA = Active Directory Password Assessment
    - AB = Attack Bridge
    - RAN = Remote Attack Node
    - DAN = Dynamic Attack Node

Generate only the email content starting with "צוות [CUSTOMER_NAME] היקרים,".`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: emailPrompt
          }
        ],
        temperature: 0.5, // Lower temperature for more consistent formatting
        max_tokens: 1500
      });

      return response.choices[0]?.message?.content || 'Email draft generation failed';
    } catch (error) {
      console.error('Error generating email draft:', error);
      
      // Check for specific OpenAI errors
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          return 'שגיאה: הגיעה למגבלת הבקשות. יש להמתין 1-2 דקות ולנסות שוב.';
        } else if (error.message.includes('401')) {
          return 'שגיאה: מפתח API לא תקין. יש לבדוק את ההגדרות.';
        }
      }
      
      return 'שגיאה ביצירת טיוטת המייל - יש לבדוק ידנית';
    }
  }
}

export const penteraAI = PenteraAIService.getInstance();
