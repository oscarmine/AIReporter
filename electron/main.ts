import { app, BrowserWindow, ipcMain, protocol, net } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { generateReport } from './gemini'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from project root (handles both dev and production)
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '../.env')
dotenv.config({ path: envPath })

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset', // Mac-like glassy header integration
    vibrancy: 'under-window', // Glass effect on macOS
    visualEffectState: 'active',
    backgroundColor: '#00000000', // Transparent bg for vibrancy
  })


  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// IPC Handlers
ipcMain.handle('generate-report', async (_event, findings: string, options: string | { apiKey?: string; temperature?: number; model?: string; language?: string }) => {
  let apiKey, temperature, model, language;
  if (typeof options === 'string') {
    apiKey = options;
  } else if (typeof options === 'object') {
    apiKey = options.apiKey;
    temperature = options.temperature;
    model = options.model;
    language = options.language;
  }
  return await generateReport(findings, apiKey, temperature, model, language);
});

import { dialog } from 'electron';
import fs from 'node:fs/promises';
import { exportToPDF } from './export';

ipcMain.handle('export-markdown', async (_event, content: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    defaultPath: 'report.md'
  });

  if (!canceled && filePath) {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  }
  return false;
});

ipcMain.handle('export-pdf', async (event, markdown: string, title?: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;

  const defaultName = title ? `${title.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'security-report.pdf';

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    defaultPath: defaultName
  });

  if (!canceled && filePath) {
    // Generate PDF from markdown content (not window screenshot)
    const pdfBuffer = await exportToPDF(markdown);
    await fs.writeFile(filePath, pdfBuffer);
    return true;
  }
  return false;
});

// Image storage - save to userData folder
const getImagesDir = () => {
  const dir = path.join(app.getPath('userData'), 'images');
  return dir;
};

// Ensure images directory exists
ipcMain.handle('init-images-dir', async () => {
  const dir = getImagesDir();
  try {
    await fs.mkdir(dir, { recursive: true });
    return dir;
  } catch (error) {
    console.error('Failed to create images directory:', error);
    return null;
  }
});

// Save image to disk and return file path
ipcMain.handle('save-image', async (_event, imageId: string, base64Data: string) => {
  const dir = getImagesDir();
  await fs.mkdir(dir, { recursive: true });

  // Extract the actual base64 data (remove data:image/xxx;base64, prefix)
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 image data');
  }

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const data = matches[2];
  const fileName = `${imageId}.${ext}`;
  const filePath = path.join(dir, fileName);

  await fs.writeFile(filePath, data, 'base64');
  return filePath;
});

// Load image from disk
ipcMain.handle('load-image', async (_event, filePath: string) => {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1);
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mimeType};base64,${data.toString('base64')}`;
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
});

// Delete image from disk
ipcMain.handle('delete-image', async (_event, filePath: string) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
});

// Get images directory path
ipcMain.handle('get-images-dir', () => {
  return getImagesDir();
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // Register 'media' protocol to handle local image loading
  protocol.handle('media', (request) => {
    const url = request.url.replace('media://', '');
    try {
      // Decode the URL to handle spaces and special characters
      const filePath = decodeURIComponent(url);
      console.log('Media request for:', filePath);
      return net.fetch('file://' + filePath);
    } catch (error) {
      console.error('Failed to handle media request:', error);
      return new Response('Not Found', { status: 404 });
    }
  });

  createWindow();
})
