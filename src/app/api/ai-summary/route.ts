import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
- RR (Ransomware) - Ransomware simulation campaigns
- ADPA (Active Directory Password Assessment) - Password strength evaluation
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
- Include specific test types: BB (Black Box), GB (Gray Box), RR (Ransomware), ADPA
- Reference protocols: LLMNR/NetBios/mDns, SNMP, HTTP, etc.
- Mention remediation actions and wiki guides when relevant
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, meetingNotes, customerName, meetingType, screenshots } = body;

    // Validate input
    if (!provider || !apiKey || !meetingNotes || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields (provider, apiKey, meetingNotes, customerName)' },
        { status: 400 }
      );
    }

    // Validate API key format based on provider
    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key format' },
        { status: 400 }
      );
    }

    if (provider === 'gemini' && !apiKey.startsWith('AIza')) {
      return NextResponse.json(
        { error: 'Invalid Gemini API key format' },
        { status: 400 }
      );
    }

    try {
      // Generate AI analysis using enhanced Pentera context
    const analysisPrompt = `${CYBERSECURITY_CONTEXT}

MEETING CONTEXT:
- Customer: ${customerName}
- Meeting Type: ${meetingType || 'consultation'}

MEETING NOTES:
${meetingNotes}

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

    let analysisResult;

    if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use gpt-4o-mini for better rate limit handling
        messages: [
          {
            role: "system",
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      analysisResult = response.choices[0]?.message?.content;
    } else if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      analysisResult = response.text();
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider. Use "openai" or "gemini".' },
        { status: 400 }
      );
    }
    
    if (!analysisResult) {
      throw new Error(`No analysis result from ${provider}`);
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(analysisResult);
    } catch (parseError) {
      parsedResult = {
        summary: analysisResult.substring(0, 500),
        keyFindings: ['Analysis generated - see summary for details'],
        actionItems: ['Review full analysis and create specific action items'],
        technicalRecommendations: ['Technical review recommended'],
        nextSteps: ['Schedule follow-up meeting']
      };
    }

    // Add a small delay to help with rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate Hebrew email draft using enhanced context
    const emailPrompt = `${CYBERSECURITY_CONTEXT}

${EMAIL_TEMPLATE_CONTEXT}

Generate a professional follow-up email in Hebrew for a Pentera cybersecurity consultation meeting.

MEETING DETAILS:
- Customer: ${customerName}
- Meeting Notes: ${meetingNotes}
- Key Findings: ${JSON.stringify(parsedResult.keyFindings)}
- Action Items: ${JSON.stringify(parsedResult.actionItems)}
- Technical Recommendations: ${JSON.stringify(parsedResult.technicalRecommendations)}
- Next Steps: ${JSON.stringify(parsedResult.nextSteps)}

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

Generate only the email content starting with "צוות [CUSTOMER_NAME] היקרים,".`;

    let emailDraft;

    if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const emailResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use gpt-4o-mini for better rate limit handling
        messages: [
          {
            role: "system",
            content: emailPrompt
          }
        ],
        temperature: 0.5, // Lower temperature for more consistent formatting
        max_tokens: 1500
      });

      emailDraft = emailResponse.choices[0]?.message?.content || 'Email generation failed';
    } else if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(emailPrompt);
      const response = await result.response;
      emailDraft = response.text() || 'Email generation failed';
    }

    return NextResponse.json({
      success: true,
      data: {
        ...parsedResult,
        emailDraft
      }
    });
    
    } catch (innerError: any) {
      // Handle inner try-catch errors (AI generation failures)
      throw innerError;
    }
    
  } catch (error: any) {
    console.error('AI analysis error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to generate AI analysis';
    let statusCode = 500;
    
    if (error.status === 401) {
      errorMessage = 'Invalid API key - Authentication failed';
      statusCode = 401;
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded - Please wait a moment and try again';
      statusCode = 429;
    } else if (error.status === 403) {
      errorMessage = 'API key does not have required permissions';
      statusCode = 403;
    } else if (error.status === 400) {
      errorMessage = 'Bad request - Check input data format';
      statusCode = 400;
    } else if (error.message) {
      errorMessage = `AI Service Error: ${error.message}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.status ? `HTTP ${error.status}` : 'No status code',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}
