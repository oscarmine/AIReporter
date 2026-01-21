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
import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateReport } from './gemini';
import dotenv from 'dotenv';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from project root (handles both dev and production)
var envPath = app.isPackaged
    ? path.join(process.resourcesPath, '.env')
    : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export var VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export var MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export var RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;
var win;
function createWindow() {
    win = new BrowserWindow({
        title: 'AIReporter',
        icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: 'hiddenInset', // Mac-like glassy header integration
        vibrancy: 'under-window', // Glass effect on macOS
        visualEffectState: 'active',
        width: 1100,
        height: 600,
        minWidth: 1000,
        minHeight: 600,
    });
    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', function () {
        win === null || win === void 0 ? void 0 : win.webContents.send('main-process-message', (new Date).toLocaleString());
    });
    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    }
    else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
}
// IPC Handlers
ipcMain.handle('generate-report', function (_event, findings, options) { return __awaiter(void 0, void 0, void 0, function () {
    var apiKey, temperature, model, language, mode, redaction;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (typeof options === 'string') {
                    apiKey = options;
                }
                else if (typeof options === 'object') {
                    apiKey = options.apiKey;
                    temperature = options.temperature;
                    model = options.model;
                    language = options.language;
                    mode = options.mode;
                    redaction = options.redaction;
                }
                return [4 /*yield*/, generateReport(findings, apiKey, temperature, model, language, mode, redaction)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
import { dialog } from 'electron';
import fs from 'node:fs/promises';
import { exportToPDF } from './export';
ipcMain.handle('export-markdown', function (_event, content) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, canceled, filePath;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, dialog.showSaveDialog({
                    filters: [{ name: 'Markdown', extensions: ['md'] }],
                    defaultPath: 'report.md'
                })];
            case 1:
                _a = _b.sent(), canceled = _a.canceled, filePath = _a.filePath;
                if (!(!canceled && filePath)) return [3 /*break*/, 3];
                return [4 /*yield*/, fs.writeFile(filePath, content, 'utf-8')];
            case 2:
                _b.sent();
                return [2 /*return*/, true];
            case 3: return [2 /*return*/, false];
        }
    });
}); });
ipcMain.handle('export-pdf', function (event, htmlContent, title) { return __awaiter(void 0, void 0, void 0, function () {
    var win, defaultName, _a, canceled, filePath, pdfBuffer;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                win = BrowserWindow.fromWebContents(event.sender);
                if (!win)
                    return [2 /*return*/, false];
                defaultName = title ? "".concat(title.replace(/[^a-z0-9]/gi, '_'), ".pdf") : 'security-report.pdf';
                return [4 /*yield*/, dialog.showSaveDialog(win, {
                        filters: [{ name: 'PDF', extensions: ['pdf'] }],
                        defaultPath: defaultName
                    })];
            case 1:
                _a = _b.sent(), canceled = _a.canceled, filePath = _a.filePath;
                if (!(!canceled && filePath)) return [3 /*break*/, 4];
                return [4 /*yield*/, exportToPDF(htmlContent)];
            case 2:
                pdfBuffer = _b.sent();
                return [4 /*yield*/, fs.writeFile(filePath, pdfBuffer)];
            case 3:
                _b.sent();
                return [2 /*return*/, true];
            case 4: return [2 /*return*/, false];
        }
    });
}); });
// Image storage - save to userData folder
var getImagesDir = function () {
    var dir = path.join(app.getPath('userData'), 'images');
    return dir;
};
// Ensure images directory exists
ipcMain.handle('init-images-dir', function () { return __awaiter(void 0, void 0, void 0, function () {
    var dir, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                dir = getImagesDir();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs.mkdir(dir, { recursive: true })];
            case 2:
                _a.sent();
                return [2 /*return*/, dir];
            case 3:
                error_1 = _a.sent();
                console.error('Failed to create images directory:', error_1);
                return [2 /*return*/, null];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Save image to disk and return file path
ipcMain.handle('save-image', function (_event, imageId, base64Data) { return __awaiter(void 0, void 0, void 0, function () {
    var dir, matches, ext, data, fileName, filePath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                dir = getImagesDir();
                return [4 /*yield*/, fs.mkdir(dir, { recursive: true })];
            case 1:
                _a.sent();
                matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
                if (!matches) {
                    throw new Error('Invalid base64 image data');
                }
                ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                data = matches[2];
                fileName = "".concat(imageId, ".").concat(ext);
                filePath = path.join(dir, fileName);
                return [4 /*yield*/, fs.writeFile(filePath, data, 'base64')];
            case 2:
                _a.sent();
                return [2 /*return*/, filePath];
        }
    });
}); });
// Load image from disk
ipcMain.handle('load-image', function (_event, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var data, ext, mimeType, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs.readFile(filePath)];
            case 1:
                data = _a.sent();
                ext = path.extname(filePath).slice(1);
                mimeType = ext === 'jpg' ? 'image/jpeg' : "image/".concat(ext);
                return [2 /*return*/, "data:".concat(mimeType, ";base64,").concat(data.toString('base64'))];
            case 2:
                error_2 = _a.sent();
                console.error('Failed to load image:', error_2);
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete image from disk
ipcMain.handle('delete-image', function (_event, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs.unlink(filePath)];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
            case 2:
                error_3 = _a.sent();
                console.error('Failed to delete image:', error_3);
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Replace image file while keeping the same ID/path
ipcMain.handle('replace-image', function (_event, imageId, base64Data) { return __awaiter(void 0, void 0, void 0, function () {
    var dir, filePath, base64Content, buffer, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                dir = getImagesDir();
                filePath = path.join(dir, "".concat(imageId, ".png"));
                base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
                buffer = Buffer.from(base64Content, 'base64');
                // Overwrite the existing file
                return [4 /*yield*/, fs.writeFile(filePath, buffer)];
            case 1:
                // Overwrite the existing file
                _a.sent();
                return [2 /*return*/, filePath];
            case 2:
                error_4 = _a.sent();
                console.error('Failed to replace image:', error_4);
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get images directory path
ipcMain.handle('get-images-dir', function () {
    return getImagesDir();
});
// Save image to user-selected location
ipcMain.handle('save-image-as', function (_event, sourcePath, imageId) { return __awaiter(void 0, void 0, void 0, function () {
    var dialog, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!win)
                    return [2 /*return*/, false];
                return [4 /*yield*/, import('electron')];
            case 1:
                dialog = (_a.sent()).dialog;
                return [4 /*yield*/, dialog.showSaveDialog(win, {
                        defaultPath: "".concat(imageId, ".png"),
                        filters: [
                            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }
                        ]
                    })];
            case 2:
                result = _a.sent();
                if (result.canceled || !result.filePath)
                    return [2 /*return*/, false];
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, fs.copyFile(sourcePath, result.filePath)];
            case 4:
                _a.sent();
                return [2 /*return*/, true];
            case 5:
                error_5 = _a.sent();
                console.error('Failed to save image:', error_5);
                return [2 /*return*/, false];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
        win = null;
    }
});
app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
app.whenReady().then(function () {
    // Register 'media' protocol to handle local image loading
    protocol.handle('media', function (request) { return __awaiter(void 0, void 0, void 0, function () {
        var url, queryIndex, filePath, pathToFileURL, safeUrl, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = request.url.replace('media://', '');
                    queryIndex = url.indexOf('?');
                    if (queryIndex !== -1) {
                        url = url.substring(0, queryIndex);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    filePath = decodeURIComponent(url);
                    console.log('Media request for:', filePath);
                    return [4 /*yield*/, import('node:url')];
                case 2:
                    pathToFileURL = (_a.sent()).pathToFileURL;
                    safeUrl = pathToFileURL(filePath).toString();
                    return [2 /*return*/, net.fetch(safeUrl)];
                case 3:
                    error_6 = _a.sent();
                    console.error('Failed to handle media request:', error_6);
                    return [2 /*return*/, new Response('Not Found', { status: 404 })];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.setAboutPanelOptions({
        applicationName: 'AIReporter',
        applicationVersion: '2.0.1',
        copyright: 'Copyright © 2025 oscarmine',
        version: '2.0.1',
        credits: 'Built with Electron, React, and Gemini AI',
        authors: ['oscarmine'],
        website: 'https://github.com/oscarmine/AIReporter',
        iconPath: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    });
    app.setName('AIReporter');
    createWindow();
});
