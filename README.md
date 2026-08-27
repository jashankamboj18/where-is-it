# WHERE IS IT — Finder AI 🧭

> **Never forget where you kept something again.**  
> A smart home & office possession tracker powered by a multilingual Siri-like Voice AI ("Hey Finder"), QR-code container management, everyday carry checklists, and cross-platform web & Android apps.

[![Download Android APK](https://img.shields.io/badge/Download-Android_APK-green?style=for-the-badge&logo=android)](https://github.com/jashankamboj18/where-is-it/releases/download/latest-apk/WhereIsIt-FinderAI.apk)
[![Live Web App](https://img.shields.io/badge/Live_App-Render-blue?style=for-the-badge&logo=render)](https://where-is-it.onrender.com)

---

## ✨ Features

- 🎙️ **Multilingual Siri-Like Voice Assistant ("Hey Finder")**:
  - Natural voice understanding in **English, Hindi (हिन्दी), Punjabi (ਪੰਜਾਬੀ), Spanish, French, and German**.
  - Query possessions with natural phrases like *"Mera phone kahan hai?"*, *"Main charger bedroom vich rakh ditta"*, or *"Where did I put my passport?"*.
  - Voice feedback and hands-free continuous assistant mode.

- 📦 **Possession & Inventory Management**:
  - Organize items by categories, condition, purchase price, serial number, and physical placement notes.
  - Interactive location hierarchy (Premises ➔ Rooms ➔ Zones ➔ Shelves/Drawers).
  - Movement timeline history tracking whenever an item is relocated.

- 📥 **QR-Code Container Tracking**:
  - Assign unique QR tokens to storage boxes and bins.
  - Printable QR sticker sheets for physical boxes.
  - Live camera scanner & token lookup to instantly see everything inside a container without opening it.

- ✅ **Everyday Carry (EDC) Checklist**:
  - Daily departure checklist for essentials (Keys, Wallet, Phone, Laptop Charger).
  - Progress calculation and 1-tap reset for morning routines.

- 🤝 **Lent & Borrowed Tracker**:
  - Track loans, borrower contact details, and return due dates.

- 🧳 **Trip Packing Manifests**:
  - Organize custom travel manifests and check off items as they are packed.

- ⏰ **Warranty & Expiry Alerts**:
  - Proactive reminders for appliance warranties, insurance renewals, and document expirations.

- 📱 **Mobile & PWA Ready**:
  - Fully responsive, native mobile bottom navigation dock, offline caching with service workers, and Capacitor Android app support.

---

## 🏗️ Tech Stack

- **Backend API**: ASP.NET Core 10 (C#), Entity Framework Core
- **Database**: Microsoft SQL Server / LocalDB
- **Frontend**: Vanilla JavaScript (Modular ES6 architecture), CSS3 Custom Properties (Dark/Light Modes)
- **Mobile**: Capacitor Android Wrapper & Progressive Web App (PWA)
- **Voice AI**: Web Speech API (SpeechRecognition + SpeechSynthesis) + Multilingual NLP Engine

---

## 🚀 Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- SQL Server or SQL Server LocalDB

### 1. Clone the repository
```bash
git clone https://github.com/jashankamboj18/where-is-it.git
cd where-is-it
```

### 2. Run the Application
```bash
dotnet run --project src/WhereIsIt.Api
```

Open your browser and navigate to:
```
http://localhost:5030
```

### 3. Run Automated Tests
```bash
dotnet test
```

---

## 📄 License
This project is licensed under the MIT License.
