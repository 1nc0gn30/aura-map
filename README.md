<!-- xonettn -->
<div align="center">

# 📍 Aura Map

Explore the world through AI-generated historical and cultural insights. Reveal the hidden stories of any coordinate on Earth with Aura Map.


![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)

![Deploy](https://img.shields.io/badge/Deployed-Netlify-00C7B7?logo=netlify&logoColor=white)

</div>

---

## 📋 Overview
Explore the world through AI-generated historical and cultural insights. Reveal the hidden stories of any coordinate on Earth with Aura Map.

## 📦 Tech Stack
- React
- Vite
- Express
- Netlify (deployed)

## 🗂️ Project Structure
```
aura-map/
  - netlify
  - public
  - src
  (27 files total)
```

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js (v18+)
- npm or yarn

### 📦 Installation
```bash
git clone https://github.com/1nc0gn30/aura-map.git
cd aura-map
npm install
```

### 💻 Development
```bash
npm run dev
```

### 🔨 Build
```bash
npm run build
```

### ⚙️ Available Scripts
  npm run dev - vite --port=3000 --host=0.0.0.0
  npm run build - vite build
  npm run preview - vite preview
  npm run clean - rm -rf dist
  npm run lint - tsc --noEmit

## 📂 Original README
<details>
<summary>Click to expand original README</summary>

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Aura Map

Aura Map now uses a Netlify Function (`/.netlify/functions/gemini-echo`) to call Gemini so the deploy-time `GEMINI_API_KEY` stays server-side.

## 💻 Local Development

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Create `.env` from `.env.example` and set `GEMINI_API_KEY`
3. Run with Netlify Functions enabled: `npx netlify dev`

## 🚀 Netlify Deployment

1. Add `GEMINI_API_KEY` in Netlify Site Settings -> Environment Variables
2. Deploy normally (build command: `npm run build`, publish directory: `dist`)
# aura-map

</details>

## 📝 TODO / Roadmap
- [ ] Add unit tests
- [ ] Add LICENSE file
- [ ] Add Dockerfile for containerized deployment
- [ ] Consider adding Tailwind CSS
- [ ] Add CI/CD pipeline
- [ ] Add contribution guidelines (CONTRIBUTING.md)
- [ ] Improve error handling and edge cases
- [ ] Add environment variable documentation
- [ ] Update dependencies to latest versions
- [ ] Add code comments and inline documentation

## 🚀 Deployment
This project is deployed on Netlify. See netlify.toml for configuration.

## 👤 Author
**Neal Frazier** - [@AshAmplifies](https://github.com/1nc0gn30)

## 🔗 Links
- GitHub: https://github.com/1nc0gn30/aura-map

---
*This README was enhanced as part of the neals-projects-2026 batch update.*

---

<div align="center">

**[xonettn]** · Built by [Neal Frazier](https://github.com/1nc0gn30) · [@AshAmplifies](https://twitter.com/AshAmplifies)

</div>
