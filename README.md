# Project: Collini Industrial Suite

Ein modulares, industrielles Dashboard für die Produktionsüberwachung und Schichtverwaltung, optimiert für den Einsatz in Galvanikbetrieben (z.B. Collini KS-24).

## ✨ Neue Funktionen & Updates
- **Dynamic Viewport Auto-Scaling (Fit-to-Screen)**: Automatisches Képernyő-Skálázás für kleinere Monitore & Laptops mit Ein/Aus-Schalter (`AUTO-FIT ON/OFF`).
- **Interaktiver Kalenderwoche (KW) Selector**: Direktes Umschalten zwischen allen 52 Kalenderwochen mit Datumskanal-Vorschau (`03.08. - 09.08.`), Zentaural-Scroll und Jahr-Wechsler.
- **WT-Ablauf Dezimal-Ziele & Präzision**: Unterstützung für Fließkomma WT-Ziele (z.B. `3,25`, `0,5`) mit exakter `round2` Summen- und Effizienzberechnung.
- **Fehlende Eingabe Warnsystem (`⚠️ EINGABE FEHLT`)**: Gezielte Überprüfung verfangener Stunden für Stunden mit festgelegtem Ziel (`Ziel > 0`).

## Hauptfunktionen
- **Collini Industrial Suite**: Eine modulare Plattform für Produktionslinien.
- **Vollbild-Modus (Immersive Experience)**: Automatisierte Aufforderung zum Vollbildmodus für ein optimales Benutzererlebnis.
- **Globales Ladesystem**: Visuelles Feedback bei allen Datenbankoperationen durch ein professionelles Overlay.
- **Multi-Line Support**: Vorbereitet für mehrere Produktionslinien (KS-24, KS-01, etc.).
- **Schichtstärke-Rechner**: Präzise Zeitberechnung für verschiedene Produkte.
- **Digitales Logbuch**: Echtzeit-Protokollierung von Ereignissen und Reparaturen.
- **Info-Wall**: Zentrale Informationsanzeige für Mitarbeiter und Management.
- **Admin-Bereich**: Konfiguration von Produkten, Personal und Systemparametern.

## 🚀 Live Access
- **URL:** [collini-industrial-suite.vercel.app](https://collini-industrial-suite.vercel.app)
- **GitHub:** `haxesen/collini-schichtstarke-rechner`

## 🛠 Tech Stack
- **Frontend:** React (Vite)
- **Architecture:** Modular Domain-Driven Design (MDDD)
- **State Management:** React Context API (Centralized Global State)
- **Icons:** Lucide React (Industrial iconography)
- **Styling:** Custom CSS3 (Industrial Dark Theme, Glassmorphism, Outfit & IBM Plex Typography)
- **Backend/Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **PWA:** Manifest support for home screen installation.

## ✨ Implemented Modules

### 1. Central Hub (Dashboard)
- Entry point for all industrial modules.
- Modern card-based navigation with status indicators.
- Quick access to active announcements and administrative tools.

### 2. Calculation Engine (Schichtstärke Rechner)
- **Logic:** `((CurrentTime * TargetThickness) / CurrentThickness) - CurrentTime`
- **Dynamic Updates:** Results update in real-time as inputs change.
- **Unit Toggle:** Output in Minutes (min), Seconds (sek), or Hours:Minutes (h:m).
- **PDF Export:** Generate professional calculation reports.

### 3. Logbook (Logbuch)
- Comprehensive incident and maintenance tracking.
- Real-time status updates (Open, In Progress, Done).
- Advanced filtering by department, priority, and status.
- Cloud-synced history for facility-wide transparency.

### 4. Info Wall (Hirdetőtábla)
- Real-time announcement board for facility staff.
- Rich-text editor for administrators.
- Automatic expiration and priority-based highlighting.
- Global Ticker integration for critical updates.

### 5. WT-Ablauf (Production Tracking)
- Real-time hourly tracking of production actuals vs decimal targets across 8h and 12h shifts.
- Interactive KW (Calendar Week) selection modal with date ranges.
- Hourly quality toggle (`i.O.` / `n.i.O.`) and missing entry alerts.

### 6. Admin Dashboard
- Centralized management of products, departments, and personnel.
- Secure access control.
- Dynamic configuration of module-specific settings.

## 📂 Project Structure
- `src/context/`: Global application state and translations.
- `src/modules/`: Isolated feature modules (Hub, Calculator, Logbook, WTAblauf, etc.).
- `src/components/`: Reusable UI components.
- `src/utils/`: Shared helper functions and localization.
- `src/assets/`: Branding and static resources.

## 🔮 Future Roadmap
- [ ] **Barcode/QR Scanning:** Use mobile camera to scan delivery notes.
- [ ] **Production Planning:** Visual scheduling for coating lines.
- [ ] **Wartungsplaner:** Automated maintenance scheduling and alerts.

---
*Documentation updated: 2026-08-03*
*Created by: Horvat Tamás*
