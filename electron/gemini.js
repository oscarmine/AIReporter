var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { GoogleGenerativeAI } from '@google/generative-ai';
// Redaction level instructions
var REDACTION_INSTRUCTIONS = {
    none: '',
    low: "\n\n**REDACTION (Low):** Mask personal usernames and API keys/tokens (e.g., show as `user_***`, `sk-***abc`). Keep IP addresses, domains, and endpoints fully visible for reproducibility.",
    medium: "\n\n**REDACTION (Medium):** Redact internal/private IP addresses (10.x, 192.168.x), personal usernames, email addresses, and API keys/secrets. KEEP the target domain, public endpoints, and asset URLs fully visible - the company needs to identify where the vulnerability is.",
    high: "\n\n**REDACTION (High - MANDATORY):** You MUST fully anonymize this report for public disclosure. Apply ALL of the following replacements without exception:\n- ALL domain names \u2192 `target.example.com` or `api.example.com`\n- ALL IP addresses \u2192 `[REDACTED-IP]`\n- ALL usernames/emails \u2192 `[USER]` or `user@example.com`\n- ALL User-Agent strings \u2192 `[REDACTED-UA]`\n- ALL OS/browser versions \u2192 `[REDACTED-OS]`\n- ALL API keys/tokens/secrets \u2192 `[REDACTED-KEY]`\n- ALL company/product names \u2192 `[COMPANY]` or `[PRODUCT]`\n- ALL internal paths \u2192 `/redacted/path/`\nDo NOT leave any real identifying information. This report must be safe for public blog posts or Twitter."
};
// Get API key from IPC (stored in renderer's localStorage, passed via IPC)
export function generateReport(findings_1, apiKeyFromSettings_1) {
    return __awaiter(this, arguments, void 0, function (findings, apiKeyFromSettings, temperature, modelName, language, mode, redaction) {
        var apiKey, genAI, model, redactionInstruction, prompt, result, response, error_1;
        if (temperature === void 0) { temperature = 0.1; }
        if (modelName === void 0) { modelName = 'gemini-2.5-flash'; }
        if (language === void 0) { language = 'English'; }
        if (mode === void 0) { mode = 'standard'; }
        if (redaction === void 0) { redaction = 'none'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiKey = apiKeyFromSettings || process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        throw new Error('API_KEY_NOT_SET');
                    }
                    genAI = new GoogleGenerativeAI(apiKey);
                    model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            temperature: temperature,
                        }
                    });
                    redactionInstruction = REDACTION_INSTRUCTIONS[redaction] || '';
                    prompt = '';
                    if (mode === 'hackerone') {
                        prompt = "You are a top-tier Bug Bounty Hunter on HackerOne. Your goal is to write a clear, reproducible, and high-impact vulnerability report.\nYou must structure the output using STRICT DELIMITERS so it can be parsed by software.\n\n## Input Findings:\n".concat(findings, "\n\n## Output Requirements:\nGenerate the report content in Markdown in the ").concat(language, " language. Use the following structure EXACTLY. Do not add any text outside the delimiters.\n\n<<<ASSET>>>\n[Identify the specific asset/URL/Endpoint from findings]\n<<<END_ASSET>>>\n\n<<<WEAKNESS>>>\n[Select the most accurate CWE/Weakness type]\n<<<END_WEAKNESS>>>\n\n<<<SEVERITY>>>\n[Severity Level] - CVSS: [Estimate CVSS Vector if enough info]\n<<<END_SEVERITY>>>\n\n<<<TITLE>>>\n[Clear and concise title including vulnerability type. DO NOT include the domain name or asset name here.]\n<<<END_TITLE>>>\n\n<<<DESCRIPTION>>>\n## Summary:\n[A 2-3 sentence overview of the vulnerability]\n\n## Steps To Reproduce:\n[Detailed steps to reproduce]\n1. [Step 1]\n2. [Step 2]\n\n### Proof of Concept (PoC):\n```http\n[Request/Response]\n```\n\n[If screenshots exist, place them here directly using the @img-xxx format without any markdown formatting, bullets, or headers. Just put the raw @img-xxx reference on its own line.]\n<<<END_DESCRIPTION>>>\n\n<<<IMPACT>>>\n[What security impact can an attacker achieve? detailed explanation]\n<<<END_IMPACT>>>\n\n---\n\n**CRITICAL RULES FOR HACKERONE MODE:**\n- **LANGUAGE:** The entire report MUST be in ").concat(language, ".\n- **DELIMITERS:** You MUST use the <<<SECTION>>> and <<<END_SECTION>>> tags exactly as shown.\n- **IMAGE REFERENCES:** Use @img-xxx references from the input if available.\n- **NO FLUFF:** Be technical and precise.").concat(redactionInstruction, "\n");
                    }
                    else {
                        // Standard Mode (Default) - Optimized for clarity, brevity, and high-impact detail
                        prompt = "You are an elite security researcher. Your goal is to transform raw findings into a professional, high-impact vulnerability report.\n        \n## Input Findings:\n".concat(findings, "\n\n## Output Requirements:\nGenerate a professional security report in Markdown (").concat(language, ").\nFocus on **clarity**, **reproducibility**, and **impact**. No fluff.\n\n---\n\n# [Vulnerability Name]\n\n**Severity:** [Critical/High/Medium/Low] | **CVSS:** [Estimate X.X]\n\n**Asset:** `[Affected URL/Endpoint/Component]`\n\n**Weakness:** [CWE Name]\n\n## Summary\n[Concise 2-3 sentence overview of the vulnerability and its root cause.]\n\n## Steps To Reproduce\n[Clear, numbered steps to reproduce the issue. Be precise.]\n1. [Step 1]\n2. [Step 2]\n...\n\n## Proof of Concept\n[Provide specific payloads, HTTP requests, or code snippets. Use code blocks.]\n\nFor HTTP Requests, use the language 'request':\n```request\nGET /api/v1/user HTTP/1.1\nHost: target.com\n...\n```\n\nFor HTTP Responses, use the language 'response':\n```response\nHTTP/1.1 200 OK\nContent-Type: application/json\n...\n```\n\n[If screenshots exist in input as @img-xxx, place them here on their own line. Example: @img-123]\n\n## Impact\n[Explain the specific security impact. What can an attacker achieve? e.g., \"Attacker can read arbitrary user data,\" \"Remote Code Execution via...\"]\n\n## Recommendation\n[Specific, actionable steps to fix the vulnerability.]\n1. [Step 1]\n2. [Step 2]\n\n---\n\n**CRITICAL RULES:**\n- **LANGUAGE:** Write in ").concat(language, ".\n- **ACCURACY:** extensive detail based ONLY on provided findings. No hallucinations.\n- **IMAGES:** Use provided @img-xxx references exactly as is.\n- **STYLE:** Cyber-security professional tone. Active voice. Concise.").concat(redactionInstruction);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, model.generateContent(prompt)];
                case 2:
                    result = _a.sent();
                    return [4 /*yield*/, result.response];
                case 3:
                    response = _a.sent();
                    return [2 /*return*/, response.text()];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error generating report:', error_1);
                    throw new Error('Failed to generate report using Gemini AI.');
                case 5: return [2 /*return*/];
            }
        });
    });
}
