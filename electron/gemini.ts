import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from IPC (stored in renderer's localStorage, passed via IPC)
export async function generateReport(findings: string, apiKeyFromSettings?: string, temperature: number = 0.1, modelName: string = 'gemini-2.5-flash', language: string = 'English'): Promise<string> {
    // Priority: 1) Passed from settings, 2) Environment variable (dev only)
    const apiKey = apiKeyFromSettings || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('API_KEY_NOT_SET');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: temperature,
        }
    });

    const prompt = `You are a senior security researcher and professional report writer. Your task is to transform raw security findings into a comprehensive, professional vulnerability report.

## Input Findings:
${findings}

## Output Requirements:
Generate a detailed security report in Markdown format in the ${language} language.

---

# Security Assessment Report

## Executive Summary
Provide a brief overview including:
- Total number of findings
- Breakdown by severity (Critical, High, Medium, Low, Informational)
- Key risks identified
- Overall security posture assessment

---

## Detailed Findings

For EACH finding, create a section with this exact structure:

### Finding [X]: [Descriptive Title]

| Attribute | Value |
|-----------|-------|
| **Severity** | Critical / High / Medium / Low / Info |
| **CVSS Score** | X.X (estimate if not provided) |
| **Affected Component** | [URL/Endpoint/System] |
| **Status** | Open |

#### Description
Provide a clear, technical explanation of the vulnerability. Explain what it is and why it matters.

#### Technical Details
Include specific technical information:
- Vulnerable parameter/endpoint
- Attack vector
- Prerequisites for exploitation

#### Proof of Concept (PoC)
\`\`\`
[Provide step-by-step reproduction commands, HTTP requests, or code]
[If the input mentions specific payloads or URLs, include them]
[Make the PoC copy-paste ready]
\`\`\`

#### Impact
Describe what an attacker could achieve:
- Data exposure risks
- Privilege escalation potential
- Business impact

#### Remediation
Provide actionable fix recommendations:
1. Immediate mitigation steps
2. Long-term secure coding practices
3. Relevant security controls to implement

---

## Risk Summary

| # | Finding | Severity | CVSS | Component | Status |
|---|---------|----------|------|-----------|--------|
[Table summarizing all findings]

---

## Recommendations

Provide prioritized action items:
1. **Immediate** (24-48 hours): Critical/High severity fixes
2. **Short-term** (1-2 weeks): Medium severity and quick wins
3. **Long-term**: Security improvements and hardening

---

## Appendix
- Testing methodology used
- Tools referenced
- Timeline of assessment

---

**CRITICAL RULES:**
- **LANGUAGE:** The entire report MUST be written in ${language}. Translate all section headers, descriptions, and summaries to ${language}.
- **STRICT ACCURACY:** You must ONLY use the information provided in the input.
- **NO HALLUCINATIONS:** Do NOT invent URLs, paths, IP addresses, parameters, or usernames.
- **PLACEHOLDERS:** If a URL/Path is missing, use EXACTLY the placeholder \`{Target_URL}\` or \`{Endpoint}\`.
- **ANTI-GUESSING:** Do NOT guess plausible paths (e.g., do NOT output \`/messages\`, \`/admin\`, or parameters like \`user_id=123\` unless explicitly provided).
- Do NOT generate fake PoC requests. Describe the attack conceptually if specific details are missing.
- Use proper Markdown formatting.
- Ensure the report is professional.

** Image References:**
        - If the input includes "Available screenshots" with @img - xxx references, USE THEM in the report
            - Place image references on their own line where visual evidence is relevant(e.g., in PoC sections)
                - Format as: @img-xxx(the app will replace this with the actual image)
    - Example: Place @img-abc123 in the PoC section if it shows the vulnerability being exploited`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating report:', error);
        throw new Error('Failed to generate report using Gemini AI.');
    }
}
