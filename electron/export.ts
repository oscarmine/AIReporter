import { BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Export pre-rendered HTML to PDF
export async function exportToPDF(htmlContent: string): Promise<Buffer> {
    // Replace media:// protocol with file:// protocol for robust local loading
    // We decode the path because media:// URLs are fully URI-encoded, but we want clean file URLs
    const finalHtml = htmlContent.replace(/media:\/\//g, 'file://');

    const tempFile = path.join(os.tmpdir(), `report-${Date.now()}.html`);
    await fs.writeFile(tempFile, finalHtml, 'utf8');

    // Create hidden window for PDF generation
    // Set width to match A4 at 96 DPI (approx 794px) to ensure identical text wrapping
    const printWindow = new BrowserWindow({
        show: false,
        width: 794,
        height: 600,
        backgroundColor: '#0d0d0d',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // Allow loading local resources (file:// images)
        }
    });

    try {
        // Load HTML content via temporary file to handle large payloads
        await printWindow.loadFile(tempFile);

        // Wait a bit for images and fonts to load
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Wait for fonts to be ready to ensure correct height calculation
        await printWindow.webContents.executeJavaScript('document.fonts.ready');

        // Small safety delay for image decoding/layout stability
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use scrollHeight for TOTAL content height (not just viewport)
        // This is critical for single-page PDF generation
        const height = await printWindow.webContents.executeJavaScript(`
            Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight
            )
        `);

        // Convert pixels to inches (assuming 96 DPI)
        // Add 10% buffer + 100px to account for any layout shifts between screen/print engines
        const safeHeight = Math.ceil(height * 1.10 + 100);
        const heightInInches = safeHeight / 96;
        const widthInInches = 8.27; // A4 width

        const pdfData = await printWindow.webContents.printToPDF({
            printBackground: true,
            landscape: false,
            scale: 1,
            pageSize: {
                width: widthInInches,
                height: heightInInches
            },
            margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },
            preferCSSPageSize: false
        });

        return pdfData;
    } finally {
        printWindow.close();
        try {
            await fs.unlink(tempFile);
        } catch (e) {
            // Ignore unlink errors
        }
    }
}
