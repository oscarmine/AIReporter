# 🛡️ AIReporter

**The Ultimate AI-Powered Vulnerability Report Generator**

[![Electron](https://img.shields.io/badge/Electron-Build-blue?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%20AI-orange?logo=google)](https://deepmind.google/technologies/gemini/)

AIReporter is a **local-first desktop application** designed for security researchers, pentesters, and bug bounty hunters. It transforms your raw vulnerability findings and scribbles into professional, comprehensive security reports using the power of Google's Gemini AI.

**Repository:** [github.com/oscarmine/AIReporter](https://github.com/oscarmine/AIReporter)

---

## ✨ Key Features

- **🤖 AI-Powered Generation:** Instantly turn brief notes into detailed reports with Impact, Remediation, and CVSS analysis.
- **🌍 Multi-Language Support:** Generate reports in **22+ languages** including English, Spanish, Uzbek, Persian (Farsi), and more.
- **📸 Smart Image Management:**
  - Drag & drop screenshots directly into the app.
  - Reference images in your text using simple tags like `@img-abc`.
  - Images are automatically embedded in exported reports.
- **⚙️ Customizable AI:**
  - Choose your preferred model (Gemini 2.5 Flash, Pro, or Custom).
  - Adjust "Temperature" for creativity vs. precision.
  - Strict anti-hallucination prompts ensure factual accuracy.
- **📄 Export Options:**
  - **PDF:** Professional, print-ready reports with embedded images.
  - **Markdown:** Clean markdown for editing or integration with other tools.
- **🔒 Privacy First:** Your API keys and data are stored locally in the application.

---
<img width="1375" height="804" alt="Screenshot 2026-01-17 at 01 42 18" src="https://github.com/user-attachments/assets/e2fc916e-9bc7-43ca-8dae-34b578fd3b71" />

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Google Gemini API Key** (Get one for free at [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/oscarmine/AIReporter.git
   cd AIReporter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in Development Mode:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```
   The executable will be in the `release` folder (Mac/Windows/Linux).

---

## 📖 Usage Guide

1.  **Configure:** Open Settings ⚙️ and enter your Gemini API Key.
2.  **Create Project:** Start a new project for your audit.
3.  **Add Findings:**
    - Type raw notes in the "Findings" tab.
    - Drag & drop screenshots into the gallery.
    - Click `📷 Add Screenshot` to copy the `@img-ID` tag.
4.  **Select Language:** Choose your desired output language from the dropdown (e.g., Uzbek, Persian).
5.  **Generate:** Click `✨ Generate Report`. The AI will draft a structured report.
6.  **Export:** Review the output and click `Export PDF` or `Export MD`.

---

## 🛠️ Tech Stack

- **Framework:** Electron + Vite + React
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **AI Integration:** Google Generative AI SDK
- **PDF Generation:** Puppeteer (via Electron)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ by [oscarmine](https://github.com/oscarmine)


