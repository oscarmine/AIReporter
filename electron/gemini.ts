import { GoogleGenerativeAI } from '@google/generative-ai';

// Redaction level instructions
const REDACTION_INSTRUCTIONS: Record<string, string> = {
    none: '',
    low: `\n\n**REDACTION (Low):** Mask personal usernames and API keys/tokens (e.g., show as \`user_***\`, \`sk-***abc\`). Keep IP addresses, domains, and endpoints fully visible for reproducibility.`,
    medium: `\n\n**REDACTION (Medium):** Redact internal/private IP addresses (10.x, 192.168.x), personal usernames, email addresses, and API keys/secrets. KEEP the target domain, public endpoints, and asset URLs fully visible - the company needs to identify where the vulnerability is.`,
    high: `\n\n**REDACTION (High - MANDATORY):** You MUST fully anonymize this report for public disclosure. Apply ALL of the following replacements without exception:
- ALL domain names → \`target.example.com\` or \`api.example.com\`
- ALL IP addresses → \`[REDACTED-IP]\`
- ALL usernames/emails → \`[USER]\` or \`user@example.com\`
- ALL User-Agent strings → \`[REDACTED-UA]\`
- ALL OS/browser versions → \`[REDACTED-OS]\`
- ALL API keys/tokens/secrets → \`[REDACTED-KEY]\`
- ALL company/product names → \`[COMPANY]\` or \`[PRODUCT]\`
- ALL internal paths → \`/redacted/path/\`
Do NOT leave any real identifying information. This report must be safe for public blog posts or Twitter.`
};

// Get API key from IPC (stored in renderer's localStorage, passed via IPC)
export async function generateReport(findings: string, apiKeyFromSettings?: string, temperature: number = 0.1, modelName: string = 'gemini-2.5-flash', language: string = 'English', mode: string = 'standard', redaction: string = 'none'): Promise<string> {
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

    // Get redaction instruction based on level
    const redactionInstruction = REDACTION_INSTRUCTIONS[redaction] || '';

    let prompt = '';

    if (mode === 'hackerone') {
        prompt = `You are a top-tier Bug Bounty Hunter on HackerOne. Your goal is to write a clear, reproducible, and high-impact vulnerability report.
You must structure the output using STRICT DELIMITERS so it can be parsed by software.

## Input Findings:
${findings}

## Output Requirements:
Generate the report content in Markdown in the ${language} language. Use the following structure EXACTLY. Do not add any text outside the delimiters.

<<<ASSET>>>
[Identify the specific asset/URL/Endpoint from findings]
<<<END_ASSET>>>

<<<WEAKNESS>>>
[Select the most accurate CWE/Weakness type]
<<<END_WEAKNESS>>>

<<<SEVERITY>>>
[Severity Level] - CVSS: [Estimate CVSS Vector if enough info]
<<<END_SEVERITY>>>

<<<TITLE>>>
[Clear and concise title including vulnerability type. DO NOT include the domain name or asset name here.]
<<<END_TITLE>>>

<<<DESCRIPTION>>>
## Summary:
[A 2-3 sentence overview of the vulnerability]

## Steps To Reproduce:
[Detailed steps to reproduce]
1. [Step 1]
2. [Step 2]

### Proof of Concept (PoC):
\`\`\`http
[Request/Response]
\`\`\`

[If screenshots exist, place them here directly using the @img-xxx format without any markdown formatting, bullets, or headers. Just put the raw @img-xxx reference on its own line.]
<<<END_DESCRIPTION>>>

<<<IMPACT>>>
[What security impact can an attacker achieve? detailed explanation]
<<<END_IMPACT>>>

---

**CRITICAL RULES FOR HACKERONE MODE:**
- **LANGUAGE:** The entire report MUST be in ${language}.
- **DELIMITERS:** You MUST use the <<<SECTION>>> and <<<END_SECTION>>> tags exactly as shown.
- **IMAGE REFERENCES:** Use @img-xxx references from the input if available.
- **NO FLUFF:** Be technical and precise.${redactionInstruction}
`;
    } else {
        // Standard Mode (Default) - Optimized for clarity, brevity, and high-impact detail
        prompt = `You are an elite security researcher. Your goal is to transform raw findings into a professional, high-impact vulnerability report.
        
## Input Findings:
${findings}

## Output Requirements:
Generate a professional security report in Markdown (${language}).
Focus on **clarity**, **reproducibility**, and **impact**. No fluff.

---

# [Vulnerability Name]

**Severity:** [Critical/High/Medium/Low] | **CVSS:** [Estimate X.X]

**Asset:** \`[Affected URL/Endpoint/Component]\`

**Weakness:** [CWE Name]

## Summary
[Concise 2-3 sentence overview of the vulnerability and its root cause.]

## Steps To Reproduce
[Clear, numbered steps to reproduce the issue. Be precise.]
1. [Step 1]
2. [Step 2]
...

## Proof of Concept
[Provide specific payloads, HTTP requests, or code snippets. Use code blocks.]

For HTTP Requests, use the language 'request':
\`\`\`request
GET /api/v1/user HTTP/1.1
Host: target.com
...
\`\`\`

For HTTP Responses, use the language 'response':
\`\`\`response
HTTP/1.1 200 OK
Content-Type: application/json
...
\`\`\`

[If screenshots exist in input as @img-xxx, place them here on their own line. Example: @img-123]

## Impact
[Explain the specific security impact. What can an attacker achieve? e.g., "Attacker can read arbitrary user data," "Remote Code Execution via..."]

## Recommendation
[Specific, actionable steps to fix the vulnerability.]
1. [Step 1]
2. [Step 2]

---

**CRITICAL RULES:**
- **LANGUAGE:** Write in ${language}.
- **ACCURACY:** extensive detail based ONLY on provided findings. No hallucinations.
- **IMAGES:** Use provided @img-xxx references exactly as is.
- **STYLE:** Cyber-security professional tone. Active voice. Concise.${redactionInstruction}`;
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating report:', error);
        throw new Error('Failed to generate report using Gemini AI.');
    }
}
