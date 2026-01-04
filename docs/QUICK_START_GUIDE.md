# PNG Civil CAD - Quick Start Guide

**Version 2.0** | **For PNG Civil Engineers**

---

## What is PNG Civil CAD?

PNG Civil CAD is a **free, web-based CAD application** designed specifically for civil engineers working in Papua New Guinea. It includes:

- ✅ **Full 2D CAD tools** - Lines, circles, polylines, rectangles, arcs, polygons
- ✅ **Modify tools** - Trim, extend, offset, mirror, rotate, scale, array
- ✅ **Annotations** - Text, dimensions, hatching
- ✅ **PNG-specific data** - All 22 provinces with seismic zones, climate, flood data
- ✅ **Structural calculations** - Beam, column, footing sizing for PNG conditions
- ✅ **Cost estimation** - Material costs in Kina
- ✅ **Construction sequences** - Step-by-step builder guidance
- ✅ **DXF import/export** - Works with AutoCAD files

---

## How to Download and Install

### Step 1: Install Required Software

Before you start, you need two things installed on your computer:

#### A) Install Node.js
1. Go to: https://nodejs.org/
2. Click the big green button that says **"LTS"** (Long Term Support)
3. Download and run the installer
4. Click "Next" through all the steps, accepting defaults
5. Restart your computer after installation

#### B) Install Git
1. Go to: https://git-scm.com/downloads
2. Click **"Windows"** (or your operating system)
3. Download and run the installer
4. Click "Next" through all steps, accepting defaults

---

### Step 2: Download PNG Civil CAD

The project is hosted on GitHub. Here's how to get it:

1. **Open Command Prompt**
   - Press `Windows Key + R`
   - Type `cmd` and press Enter

2. **Navigate to where you want to save the project**
   ```
   cd Desktop
   ```
   (This puts it on your Desktop - you can choose another folder)

3. **Clone the repository** (this downloads the project)
   ```
   git clone https://github.com/BruinGrowly/PNG-AutoCad-Software.git
   ```

4. **Go into the project folder**
   ```
   cd PNG-AutoCad-Software
   ```

5. **Install dependencies** (this downloads the required packages)
   ```
   npm install
   ```
   ⏳ This may take a few minutes - wait until it finishes.

---

### Step 3: Run the App

1. **Start the app:**
   ```
   npm run dev
   ```

2. You should see something like:
   ```
   VITE v5.x.x  ready in 500ms
   
   ➜  Local:   http://localhost:5173/
   ```

3. **Open your web browser** (Chrome, Firefox, or Edge)

4. **Go to this address:**
   ```
   http://localhost:5173
   ```

5. **The app is now running!** 🎉

> **To stop the app:** Press `Ctrl + C` in the Command Prompt window

---

### Step 4: Running Again Later

Next time you want to use the app:

1. Open Command Prompt
2. Navigate to the folder:
   ```
   cd Desktop\PNG-AutoCad-Software
   ```
3. Start the app:
   ```
   npm run dev
   ```
4. Open http://localhost:5173 in your browser

---

## How to Use

### Creating a New Project

1. When the app opens, you'll see the **Project Dialog**
2. Enter a project name
3. Select your **province** (this loads local data for seismic, climate, etc.)
4. Click **Create Project**

### Drawing Tools

| Tool | Shortcut | How to Use |
|------|----------|------------|
| **Line** | L | Click start, click end |
| **Circle** | C | Click center, click radius |
| **Rectangle** | R | Click corner, click opposite corner |
| **Polyline** | P | Click points, double-click to finish |
| **Arc** | A | Click 3 points |
| **Polygon** | - | Click points, double-click to close |
| **Text** | T | Click placement, type text |

### Modify Tools

| Tool | How to Use |
|------|------------|
| **Trim** | Click cutting edge, then click part to remove |
| **Extend** | Click boundary, then click line to extend |
| **Offset** | Select objects → click base → enter distance |
| **Mirror** | Select objects → click mirror line |
| **Rotate** | Select objects → click center → enter angle |
| **Scale** | Select objects → click center → enter factor |
| **Array** | Select objects → enter rows/columns/spacing |

### Keyboard Shortcuts

Press **?** to see all keyboard shortcuts, including:

- **E** - Toggle Project Explorer (see all objects)
- **G** - Toggle grid
- **S** - Toggle snap
- **Escape** - Cancel / Deselect
- **Delete** - Delete selected

### PNG-Specific Features

- **Building Parameters Panel** - Enter your province to see:
  - Seismic zone and factors
  - Climate data (rainfall, temperature)
  - Flood risk assessment
  - Material recommendations

- **Structural Calculations** - Size beams, columns, and footings based on PNG conditions

- **Cost Estimation** - Get material quantities with PNG prices

---

## Sending Feedback & Bug Reports

Your feedback helps us improve the software!

### How to Report an Issue

1. Click the **📣 button** in the bottom-right status bar
2. Choose report type:
   - 🐛 **Bug Report** - Something isn't working
   - 💬 **Feedback** - General comments
   - 💡 **Feature Request** - Ideas for improvement
   - ❓ **Question** - Need help
3. Fill in the title and description
4. **For bugs:** Optionally check "Include error logs" (helps us fix it!)
5. Check both consent boxes
6. Click **"Open Email to Send"**
7. Your email app will open with the report ready - just click Send!

### What Gets Sent?

- Only what you choose to include
- We do NOT store any data on servers
- Data goes directly via YOUR email client
- You can review the email before sending

### Direct Contact

If the button doesn't work, email us directly: **bruinnecessities@gmail.com**

---

## Troubleshooting

### "npm is not recognized"
→ Node.js is not installed. Go back to Step 1A.

### "git is not recognized"
→ Git is not installed. Go back to Step 1B.

### "npm install" shows errors
→ Try running Command Prompt as Administrator (right-click → Run as administrator)

### App won't load in browser
→ Make sure you're going to `http://localhost:5173` (not https)

### Need more help?
→ Send us a message using the 📣 button or email bruinnecessities@gmail.com

---

## Important Notes

> ⚠️ **Disclaimer:** This software provides calculations as a GUIDE ONLY. All designs must be verified and certified by a licensed Professional Engineer before construction.

- Always save your work regularly (Ctrl+S)
- Export important drawings to DXF for backup
- The app works offline once loaded

---

## Quick Reference

| Command | What it does |
|---------|--------------|
| `git clone URL` | Downloads the project |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts the app |
| `Ctrl + C` | Stops the app |

---

**Happy designing!** 🇵🇬

**GitHub Repository:** https://github.com/BruinGrowly/PNG-AutoCad-Software
**Support Email:** bruinnecessities@gmail.com
