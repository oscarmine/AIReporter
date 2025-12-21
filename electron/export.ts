import { BrowserWindow } from 'electron';
import { marked } from 'marked';

// Generate print-ready HTML from markdown
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
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
            padding: 40px 50px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1 {
            font-size: 24pt;
            font-weight: 700;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #1a1a1a;
        }
        
        h2 {
            font-size: 16pt;
            font-weight: 600;
            margin-top: 30px;
            margin-bottom: 15px;
            color: #2d2d2d;
        }
        
        h3 {
            font-size: 13pt;
            font-weight: 600;
            margin-top: 25px;
            margin-bottom: 10px;
            color: #333;
        }
        
        h4 {
            font-size: 11pt;
            font-weight: 600;
            margin-top: 15px;
            margin-bottom: 8px;
        }
        
        p {
            margin-bottom: 10px;
        }
        
        ul, ol {
            margin-left: 25px;
            margin-bottom: 15px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        
        th {
            background: #f5f5f5;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background: #fafafa;
        }
        
        code {
            font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
            font-size: 9pt;
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
        }
        
        pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 15px 0;
            font-size: 9pt;
            line-height: 1.5;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        
        img {
            max-width: 100%;
            max-height: 500px;
            object-fit: contain;
            display: block;
            margin: 15px 0;
            border-radius: 4px;
        }

        blockquote {
            border-left: 4px solid #e0e0e0;
            padding-left: 15px;
            margin: 15px 0;
            color: #666;
        }
        
        hr {
            border: none;
            border-top: 1px solid #e0e0e0;
            margin: 25px 0;
        }
        
        strong {
            font-weight: 600;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            pre {
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
            
            table, pre {
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
                top: 0.5,
                bottom: 0.5,
                left: 0.5,
                right: 0.5
            }
        });

        return pdfData;
    } finally {
        printWindow.close();
    }
}
