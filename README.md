# ✦ InterviewPilot

<div align="center">
  <img src="public/logo.png" width="84" height="84" alt="InterviewPilot Logo" />
  <h3>Practice the interview you’re actually going to face.</h3>
  <p>AI-powered mock interview SaaS tailored to your exact resume, target role, and job description with adaptive follow-ups and rubric-based evaluations.</p>

  <p>
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Three.js%20%2F%20OGL-WebGL-black?style=flat-square&logo=three.js&logoColor=white" alt="WebGL" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  </p>
</div>

---

## ⚡ Overview

**InterviewPilot** is a next-generation AI mock interview platform designed to replace generic, cookie-cutter interview prep with realistic, hyper-personalized practice loops. Candidates paste their target job description and attach their resume to get an instant hiring bar calibration, role-specific adaptive questions, real-time voice recording telemetry, and multidimensional STAR rubric scoring.

---

## ✨ Key Features

- **⚡ Instant AI Calibration Cockpit:** Paste target JD and attach resume to deconstruct required competencies, seniority benchmarks, and formulate tailored interview loops.
- **💬 Animated AI Chat Input:** Frosted glass chat input with a razor-thin 1px 360° rotating conic border beam, file attachment chips, and `⌘K` quick prompt drawers.
- **🎙️ Studio-Grade AI Voice Input:** Real-time voice recording cockpit with center-weighted harmonic soundwave visualizers, live `mm:ss` counter, and dynamic pacing telemetry (WPM).
- **🔮 3D Glowing Plasma Sphere Letter Loader:** Atmospheric WebGL/CSS plasma sphere with luminous organic wave typography and progressive multi-stage AI reasoning stream.
- **🌌 Immersive Dark Gradient AI Cockpit:** Atmospheric background with skewed cyan light streaks, radial vignette, and subtle dot grid matrix.
- **📊 4-Dimension STAR Rubric Scoring:** Comprehensive evaluation across Structure (STAR), Technical Depth, Quantitative Evidence, and Communication Delivery.
- **🎛️ Bespoke Custom Dropdowns:** Zero native browser `<select>` elements—all selectors use floating glassmorphic popovers with checkmark indicators and subtitle descriptions.
- **🌓 Dual Theme Architecture:** High-contrast obsidian dark mode and crisp modern light mode with seamless theme toggling.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/) |
| **Styling & Design** | [TailwindCSS 3.4](https://tailwindcss.com/), Vanilla CSS Tokens, Linear/Vercel High-Contrast Design System |
| **Motion & Graphics** | [Framer Motion](https://www.framer.com/motion/), [GSAP](https://greensock.com/gsap/), [Three.js](https://threejs.org/), [OGL](https://github.com/oframe/ogl) |
| **Icons & Media** | [Lucide React](https://lucide.dev/), Canvas Confetti |
| **Routing & State** | [React Router 7](https://reactrouter.com/), React Context API, LocalStorage persistence |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Charantej111/InterviewPilot.git
   cd InterviewPilot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```text
InterviewPilot/
├── public/
│   └── logo.png                   # Official 4-pointed spark ribbon logo & favicon
├── src/
│   ├── assets/                    # Bundled brand assets
│   ├── components/
│   │   ├── dashboard/             # Dashboard telemetry & skill widgets
│   │   ├── feedback/              # Metric breakdown & scoring meters
│   │   ├── interview/             # Live interview simulation cockpit & voice recorder
│   │   ├── landing/               # Hero, feature grid, STAR framework & pricing
│   │   ├── layout/                # Navbar capsule, AppShell sidebar, theme toggle, footer
│   │   ├── reactbits/             # 3D WebGL ColorBends, GradientWaves & 3D Folders
│   │   ├── report/                # Candidate dossier, action plan & radar charts
│   │   ├── setup/                 # Calibration steps & resume dropzone
│   │   └── ui/                    # AnimatedAIChat, CustomDropdown, LetterLoader, Logo, etc.
│   ├── context/                   # Interview, User, and Theme providers
│   ├── data/                      # Structured interview data & rubrics
│   ├── lib/                       # Utilities & storage abstractions
│   ├── pages/                     # App routing views (Landing, Dashboard, Setup, Room, Report, etc.)
│   ├── services/                  # AI calibration, evaluation & transcription engines
│   └── types/                     # TypeScript interfaces and domain types
├── index.html                     # HTML entry point with Caveat & Plus Jakarta Sans fonts
├── tailwind.config.js             # Design tokens, color ramps & keyframe animations
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite bundler configuration
```

---

## 🗺️ Backend Roadmap

- [ ] **AI Calibration Engine:** Ingest full resume PDFs and live scrape job descriptions to generate role-specific competency graphs.
- [ ] **Adaptive Follow-up Generator:** Dynamic LLM probes based on candidate's live spoken answer depth.
- [ ] **Whisper Audio Stream:** High-fidelity speech-to-text pipeline with filler word tracking (`um`, `like`, `you know`).
- [ ] **AI Video / Multi-modal Simulation:** Real-time facial sentiment & eye-contact feedback.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/Charantej111">Charan Tej</a>
</div>
