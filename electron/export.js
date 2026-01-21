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
import { BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
// Export pre-rendered HTML to PDF
export function exportToPDF(htmlContent) {
    return __awaiter(this, void 0, void 0, function () {
        var finalHtml, tempFile, printWindow, height, safeHeight, heightInInches, widthInInches, pdfData, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    finalHtml = htmlContent.replace(/media:\/\//g, 'file://');
                    tempFile = path.join(os.tmpdir(), "report-".concat(Date.now(), ".html"));
                    return [4 /*yield*/, fs.writeFile(tempFile, finalHtml, 'utf8')];
                case 1:
                    _a.sent();
                    printWindow = new BrowserWindow({
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
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 9, 14]);
                    // Load HTML content via temporary file to handle large payloads
                    return [4 /*yield*/, printWindow.loadFile(tempFile)];
                case 3:
                    // Load HTML content via temporary file to handle large payloads
                    _a.sent();
                    // Wait a bit for images and fonts to load
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                case 4:
                    // Wait a bit for images and fonts to load
                    _a.sent();
                    // Wait for fonts to be ready to ensure correct height calculation
                    return [4 /*yield*/, printWindow.webContents.executeJavaScript('document.fonts.ready')];
                case 5:
                    // Wait for fonts to be ready to ensure correct height calculation
                    _a.sent();
                    // Small safety delay for image decoding/layout stability
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 6:
                    // Small safety delay for image decoding/layout stability
                    _a.sent();
                    return [4 /*yield*/, printWindow.webContents.executeJavaScript("\n            Math.max(\n                document.body.scrollHeight,\n                document.documentElement.scrollHeight,\n                document.body.offsetHeight,\n                document.documentElement.offsetHeight\n            )\n        ")];
                case 7:
                    height = _a.sent();
                    safeHeight = Math.ceil(height * 1.10 + 100);
                    heightInInches = safeHeight / 96;
                    widthInInches = 8.27;
                    return [4 /*yield*/, printWindow.webContents.printToPDF({
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
                        })];
                case 8:
                    pdfData = _a.sent();
                    return [2 /*return*/, pdfData];
                case 9:
                    printWindow.close();
                    _a.label = 10;
                case 10:
                    _a.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, fs.unlink(tempFile)];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 12:
                    e_1 = _a.sent();
                    return [3 /*break*/, 13];
                case 13: return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
