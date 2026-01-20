import { marked } from 'marked';

export interface PDFExportOptions {
    seamless: boolean;
    accentColor: string;
}

export function generatePDFHtml(markdown: string, options: PDFExportOptions): string {
    // Configure marked with custom renderer
    const renderer = new marked.Renderer();

    // Helper to escape HTML to prevent rendering code as actual HTML
    const escapeHtml = (text: string) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    renderer.code = (token: any, language?: string) => {
        // Handle marked v17+ object signature safely
        const rawCode = (typeof token === 'object' && token.text) ? token.text : token;
        const langStr = (typeof token === 'object' && token.lang) ? token.lang : language;

        // Escape the code content!
        const code = escapeHtml(rawCode || '');

        // Default to 'text' if no language specified
        const lang = langStr || 'text';
        const label = lang.toUpperCase();

        // Compact HTML - no extra whitespace that becomes visible in PDF
        return `<div class="code-block-wrapper"><div class="code-header"><span class="code-label">${label}</span></div><pre><code class="language-${lang}">${code}</code></pre></div>`;
    };

    marked.setOptions({ renderer });

    const htmlContent = marked(markdown);

    // Default to green if no accent color provided
    const accentColor = options.accentColor || '#4ade80';

    // Calculate derived colors for the theme
    // We treat the accent color as the primary brand color

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Security Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html {
            background: #0d0d0d;
            /* height: 100%; - Removed to allow natural height for seamless PDF */
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.6;
            color: #e0e0e0;
            background: #0d0d0d;
            padding: 20px 60px;
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
        }
        
        h1 {
            font-size: 22pt;
            font-weight: 700;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
            color: #ffffff;
            letter-spacing: -0.5px;
        }
        
        h2 {
            font-size: 15pt;
            font-weight: 600;
            margin-top: 35px;
            margin-bottom: 18px;
            color: #ffffff;
            padding-bottom: 8px;
            border-bottom: 1px solid #2a2a2a;
        }
        
        h3 {
            font-size: 12pt;
            font-weight: 600;
            margin-top: 28px;
            margin-bottom: 12px;
            color: #f0f0f0;
        }
        
        h4 {
            font-size: 10.5pt;
            font-weight: 600;
            margin-top: 18px;
            margin-bottom: 10px;
            color: #d0d0d0;
        }
        
        p {
            margin-bottom: 12px;
            color: #c0c0c0;
        }
        
        ul, ol {
            margin-left: 28px;
            margin-bottom: 18px;
        }
        
        li {
            margin-bottom: 6px;
            color: #b8b8b8;
        }
        
        a {
            color: #60a5fa;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 8.5pt;
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
        }
        
        th, td {
            border: 1px solid #333;
            padding: 12px 15px;
            text-align: left;
        }
        
        th {
            background: #1a1a1a;
            font-weight: 600;
            color: #ffffff;
            text-transform: uppercase;
            font-size: 8pt;
            letter-spacing: 0.5px;
        }
        
        tr:nth-child(even) {
            background: #111111;
        }
        
        tr:nth-child(odd) {
            background: #0d0d0d;
        }
        
        code {
            font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 8pt;
            background: ${accentColor}1A; /* 10% opacity */
            color: ${accentColor};
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: 400;
        }
        
        .code-block-wrapper {
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #2a2a2a;
            background: #111111;
        }

        .code-header {
            background: #1a1a1a;
            border-bottom: 1px solid #2a2a2a;
            padding: 8px 16px;
            display: flex;
            align-items: center;
        }

        .code-label {
            font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 7.5pt;
            font-weight: 600;
            color: ${accentColor};
            letter-spacing: 0.5px;
            background: ${accentColor}15;
            padding: 2px 8px;
            border-radius: 4px;
        }
        
        pre {
            background: #111111;
            color: #e0e0e0;
            padding: 12px 16px;
            overflow-x: auto;
            margin: 0;
            font-size: 8.5pt;
            line-height: 1.5;
            border: none;
            border-radius: 0;
            box-shadow: none;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        pre code {
            background: transparent;
            padding: 0;
            color: #d4d4d4;
            border: none;
            font-size: inherit;
        }
        
        img {
            max-width: 100%;
            max-height: 500px;
            object-fit: contain;
            display: block;
            margin: 20px 0;
            border-radius: 6px;
        }

        blockquote {
            border-left: 4px solid ${accentColor};
            padding-left: 20px;
            margin: 20px 0;
            color: #a0a0a0;
            background: #111111;
            padding: 15px 20px;
            border-radius: 0 8px 8px 0;
        }
        
        hr {
            border: none;
            border-top: 1px solid #2a2a2a;
            margin: 35px 0;
        }
        
        strong {
            font-weight: 600;
            color: #ffffff;
        }
        
        em {
            color: #d0d0d0;
        }
        
        /* Severity colors */
        .critical { color: #ef4444; }
        .high { color: #f97316; }
        .medium { color: #eab308; }
        .low { color: #22c55e; }
        .info { color: #3b82f6; }
        
        @media print {
            html, body {
                background: #0d0d0d !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            body {
                padding: 20px 60px;
            }
            
            pre {
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            

            

        }
    </style>
</head>
<body class="seamless">
    ${htmlContent}
</body>
</html>`;
}
