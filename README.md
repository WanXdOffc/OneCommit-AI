# 🧠 OneCommit AI

OneCommit AI adalah platform berbasis web untuk **memonitor aktivitas commit peserta hackathon secara realtime**, dilengkapi dengan **analisis AI**, **integrasi GitHub**, **Discord Bot**, dan **MongoDB** — semuanya berjalan dalam **satu project JavaScript**.

---

## 🎯 Tujuan Project

- Membantu panitia hackathon memantau commit peserta secara realtime
- Menilai kualitas commit menggunakan Artificial Intelligence
- Menyediakan dashboard visual (grafik & leaderboard)
- Mengintegrasikan GitHub, Discord, dan Web UI dalam satu sistem

---

## 🧱 Bahasa, Library & Framework

### Bahasa
- **JavaScript**

### Framework & Library
- **Next.js** (Web UI, API Routes, Server)
- **Tailwind CSS** (Styling)
- **discord.js** (Discord Bot)
- **MongoDB & Mongoose** (Database)
- **GitHub Webhook / Octokit** (Monitoring commit)
- **AI API** (OpenAI / Groq / Gemini / OpenRouter)
- **Recharts** (Visualisasi data)

---

## 👨‍💻 Pembuat

**I Ketut Dharmawan**  
GitHub: [WanXdOffc](https://github.com/WanXdOffc)

---

## 🚀 Cara Menjalankan Project

### 1️⃣ Clone Repository
```bash
git clone https://github.com/WanXdOffc/OneCommit-AI.git
cd OneCommit-AI
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Setup Environment Variable
Buat file .env dan isi seperti ini : 
```bash
# MongoDB
MONGODB_URI=

# GitHub
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret_key

# Discord Bot
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_server_id

# AI Service (Choose one)
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Or Groq
# GROQ_API_KEY=your_groq_api_key

# Or Gemini
# GEMINI_API_KEY=your_gemini_api_key

# Or OpenRouter
# OPENROUTER_API_KEY=your_openrouter_api_key

# AI Provider (openai | groq | gemini | openrouter)
AI_PROVIDER=openrouter

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this

# Next.js
NEXT_PUBLIC_APP_URL=

# Admin Setup
ADMIN_EMAIL=admin@onecommit.ai
ADMIN_PASSWORD=admin123

# Environment
NODE_ENV=development
```

### 4️⃣ Jalankan Development Server
```bash
npm run dev
```

## =====GOOD LUCK=====
