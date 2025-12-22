import { BrowserWindow } from 'electron';
import { marked } from 'marked';

// Generate print-ready HTML from markdown with premium dark theme
function generatePrintHTML(markdown: string): string {
    const htmlContent = marked(markdown);

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
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.7;
            color: #e0e0e0;
            background: #0d0d0d;
            padding: 60px 70px;
            min-height: 100vh;
        }
        
        h1 {
            font-size: 28pt;
            font-weight: 700;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
            color: #ffffff;
            letter-spacing: -0.5px;
        }
        
        h2 {
            font-size: 18pt;
            font-weight: 600;
            margin-top: 35px;
            margin-bottom: 18px;
            color: #ffffff;
            padding-bottom: 8px;
            border-bottom: 1px solid #2a2a2a;
        }
        
        h3 {
            font-size: 14pt;
            font-weight: 600;
            margin-top: 28px;
            margin-bottom: 12px;
            color: #f0f0f0;
        }
        
        h4 {
            font-size: 12pt;
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
            font-size: 10pt;
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
            font-size: 9pt;
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
            font-size: 9pt;
            background: rgba(74, 222, 128, 0.1);
            color: #4ade80;
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: 400;
        }
        
        pre {
            background: linear-gradient(135deg, #111111 0%, #1a1a1a 100%);
            color: #e0e0e0;
            padding: 20px;
            border-radius: 10px;
            overflow-x: auto;
            margin: 20px 0;
            font-size: 9.5pt;
            line-height: 1.6;
            border: 1px solid #2a2a2a;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
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
            border-left: 4px solid #4ade80;
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
                padding: 50px 60px;
            }
            
            pre {
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
            
            table, pre, img {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
}

export async function exportToPDF(markdown: string): Promise<Buffer> {
    // Create hidden window for PDF generation
    const printWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // Allow loading local resources (file:// images) in data: URI
        }
    });

    try {
        const html = generatePrintHTML(markdown);

        // Load HTML content
        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

        // Wait a bit for styles to apply
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate PDF
        const pdfData = await printWindow.webContents.printToPDF({
            printBackground: true,
            landscape: false,
            pageSize: 'A4',
            margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            }
        });

        return pdfData;
    } finally {
        printWindow.close();
    }
}
