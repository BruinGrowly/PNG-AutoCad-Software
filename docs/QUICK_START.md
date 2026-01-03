# PNG Civil CAD - Quick Start Guide

> **Welcome!** This guide will have you designing in minutes. No prior CAD experience needed.

---

## 🚀 5-Minute Quick Start

### Step 1: Open the App
- Double-click **PNG Civil CAD** on your desktop, or
- Open your browser and go to the app URL

### Step 2: Create a New Project
When the app opens, you'll see the **Project Dialog**:

```
┌──────────────────────────────────────┐
│  📁 New Project                      │
├──────────────────────────────────────┤
│  Project Name: [My First Project   ] │
│  Province:     [Morobe           ▼]  │
│  Project Type: [Building         ▼]  │
│                                      │
│           [ Create Project ]         │
└──────────────────────────────────────┘
```

1. Enter a **Project Name** (e.g., "Community Hall")
2. Select your **Province** (e.g., "Morobe")
3. Select **Project Type** (e.g., "Building")
4. Click **Create Project**

### Step 3: Draw Something!
Now you're in the main drawing area:

1. Press **`L`** on your keyboard (for Line tool)
2. **Click** anywhere on the canvas to start
3. **Click** again to finish the line
4. Press **`Esc`** to stop drawing

**Congratulations!** You just drew your first line! 🎉

---

## 📐 The Essential Tools

### The Toolbar (Left Side)
```
┌────┐
│ ➡️ │ Select - click objects to select them
├────┤
│ ── │ Line - draw straight lines
├────┤
│ ⊥  │ Polyline - draw connected lines
├────┤
│ ○  │ Circle - draw circles
├────┤
│ □  │ Rectangle - draw rectangles
├────┤
│ A  │ Text - add text
├────┤
│ ←→ │ Dimension - add measurements
└────┘
```

### Keyboard Shortcuts (The Fast Way!)
| Key | What It Does |
|-----|--------------|
| `L` | Line tool |
| `R` | Rectangle tool |
| `C` | Circle tool |
| `T` | Text tool |
| `Esc` | Cancel/Select mode |
| `Ctrl+Z` | Undo mistake |
| `Ctrl+S` | Save your work |

---

## 🏗️ Getting Building Parameters (The PNG Magic!)

This is what makes PNG Civil CAD special - it knows PNG!

### How to Get Design Parameters for Your Location

1. Click **PNG Analysis** in the menu bar
2. Click **🏗️ Building Parameters**

```
┌─ Building Parameters ─────────────┐
│                                   │
│  Province: [Central          ▼]  │
│  Building Class: [2 - Normal ▼]  │
│  Soil Class: [Ce - Shallow   ▼]  │
│                                   │
├───────────────────────────────────┤
│  🌍 SEISMIC     [High]           │
│  Z = 0.40                        │
│  kp = 0.500                      │
│                                   │
│  💨 WIND        [Region A]       │
│  Speed: 37 m/s                   │
│  Cyclonic: No                    │
│                                   │
│  🌧️ CLIMATE     [Tropical]       │
│  Rainfall: 2500 mm/year          │
│                                   │
│  🔧 CORROSION   [C4]             │
│  Hot-dip galvanized required     │
│                                   │
├───────────────────────────────────┤
│  [📋 Copy Text] [➕ Insert to Drawing]
└───────────────────────────────────┘
```

3. Select your **Province** (e.g., "Madang")
4. Select **Building Class**:
   - Class 1 = Storage shed, carport
   - Class 2 = Normal house, office
   - Class 3 = School, health center
   - Class 4 = Hospital, fire station

5. Click **"Insert to Drawing"** to add the parameters to your drawing

**Now your drawing has all the right design values for that location!**

---

## 📄 Exporting to PDF (For Submission)

When you're ready to print or submit to Building Board:

1. Click **File** in the menu bar
2. Click **📄 Export PDF**
3. File will download as `your-project-name.pdf`

**The PDF includes:**
- Your drawing
- Title block with project info
- Scale and date
- Ready for PNG Building Board submission!

---

## 💾 Saving Your Work

### Auto-Save
The app **automatically saves** every 60 seconds. You won't lose your work!

### Manual Save
Press **`Ctrl+S`** anytime to save immediately.

### Finding Saved Projects
Next time you open the app, click **Open Project** to see your recent projects.

---

## 🗂️ Using Layers (Organize Your Drawing)

Layers are like transparent sheets stacked on top of each other.

### The Layer Panel (Left Side)
```
┌── LAYERS ──────────────────┐
│  ✓ 👁️ 🔓  Layer 0 (active) │
│  ✓ 👁️ 🔓  Structural       │
│  ✓ 👁️ 🔓  Drainage         │
│  ✓ 👁️ 🔓  Electrical       │
│  [+ Add Layer]             │
└────────────────────────────┘
```

| Icon | What It Does |
|------|--------------|
| 👁️ | Click to hide/show layer |
| 🔓 | Click to lock/unlock layer |
| Click name | Make it the active layer (new drawings go here) |

### Why Use Layers?
- **Hide distractions** - Working on plumbing? Hide electrical!
- **Organize** - Keep structural separate from finishes
- **Print selectively** - Export only certain layers

---

## 🔍 Navigation (Moving Around the Drawing)

### Zoom In/Out
- **Mouse scroll wheel** - Roll up to zoom in, down to zoom out
- **Ctrl+0** - Fit entire drawing in view

### Pan (Move the View)
- **Hold middle mouse button** and drag
- Or press **`H`** for pan tool, then drag

---

## ❓ Common Questions

### "I drew something but I can't see it!"
1. Try pressing **Ctrl+0** to zoom to fit all
2. Check the layer panel - is that layer hidden? (👁️ crossed out)

### "I made a mistake!"
Press **Ctrl+Z** to undo. You can undo many times!

### "How do I delete something?"
1. Press **`Esc`** to go to select mode
2. Click the object you want to delete
3. Press **Delete** key

### "How do I select multiple objects?"
Hold **Shift** and click each object, or drag a box around them.

### "The app says 'Offline Mode'"
Don't worry! The app works fully offline. Your work is saved locally.

---

## 📞 Need More Help?

- **Full Manual**: Look in `docs/USER_MANUAL.md`
- **Building Standards**: Help → PNG Building Standards
- **Keyboard Shortcuts**: Help → Keyboard Shortcuts

---

## 🎯 Next Steps

Now that you know the basics, try:

1. **Draw a simple floor plan**
   - Use rectangles for rooms
   - Use lines for walls
   - Add text for room names

2. **Get site-specific parameters**
   - Open Building Parameters panel
   - Select your actual project location
   - Insert parameters to drawing

3. **Export your drawing**
   - File → Export PDF
   - Ready for printing!

---

*Happy designing!* 🏗️ *Remember: This tool was built for PNG by people who understand PNG engineering challenges.*
