# PNG Civil CAD - Tutorials

Step-by-step guides for common engineering workflows.

---

## Tutorial 1: Design a Simple Floor Plan

**Time: 15 minutes | Difficulty: Beginner**

### What You'll Create
A simple 8m × 10m house floor plan with:
- Exterior walls
- Room divisions
- Doors (represented as gaps)
- Room labels

### Step-by-Step

#### 1. Start a New Project
1. Open PNG Civil CAD
2. Click **New Project**
3. Name: "Simple House"
4. Province: Select your location
5. Project Type: Building
6. Click **Create Project**

#### 2. Draw the Exterior Walls
1. Press **`R`** for Rectangle tool
2. Click at origin (0, 0)
3. Type `10000, 8000` and press Enter (10m × 8m in mm)
4. You now have the outline!

#### 3. Add Interior Walls
1. Press **`L`** for Line tool
2. Click on the left wall at 4m from bottom
3. Draw horizontal line to divide the house
4. Repeat to create rooms

#### 4. Add Room Labels
1. Press **`T`** for Text tool
2. Click in center of first room
3. Type "Living Room"
4. Press Enter
5. Repeat for other rooms: "Bedroom 1", "Kitchen", "Bathroom"

#### 5. Add Dimensions
1. Press **`D`** for Dimension tool
2. Click start of wall
3. Click end of wall
4. Move mouse and click to place dimension

#### 6. Save Your Work
Press **Ctrl+S**

---

## Tutorial 2: Get Complete Site Design Parameters

**Time: 5 minutes | Difficulty: Beginner**

### What You'll Learn
How to get all the engineering design parameters for any location in PNG.

### Why This Matters
Different parts of PNG have different:
- Earthquake risks (seismic zones)
- Wind speeds (cyclone zones)
- Rainfall amounts
- Flooding risks
- Corrosion risks (coastal vs highland)

### Step-by-Step

#### 1. Open the Building Parameters Panel
1. Click **PNG Analysis** in the menu bar
2. Click **🏗️ Building Parameters**
3. The panel opens on the right side

#### 2. Enter Your Location
1. **Province**: Click dropdown, select (e.g., "Madang")
2. **Building Class**: 
   - Select 2 for normal buildings
   - Select 3 for schools/churches
   - Select 4 for hospitals/essential facilities
3. **Soil Class**:
   - Ae = Rock (best)
   - Ce = Normal soil (typical)
   - Ee = Very soft soil (worst)
4. **Site Elevation**: Enter meters above sea level

#### 3. Read the Results

The panel shows all parameters:

**Seismic (Earthquake)**
- Z = 0.50 means severe seismic zone
- kp = design coefficient for calculations
- Near Fault = Yes means extra precautions needed

**Wind**
- Region C = cyclone designed required
- 52 m/s = very high wind speeds expected

**Climate**
- Zone tells you tropical type
- Rainfall helps size drainage

**Flood**
- Shows if flood checking is needed
- Gives minimum floor level guidance

**Corrosion**
- C5 = severe, need hot-dip galvanized steel
- C3 = moderate, normal protection OK

#### 4. Add to Your Drawing
1. Click **➕ Insert to Drawing**
2. Text with all parameters is added
3. Move it to your title block area

#### What These Numbers Mean for Design

| If You See | What It Means |
|------------|---------------|
| Z > 0.4 | Need structural engineer review |
| Region B or C | Need cyclone design to AS 4055 |
| C5 corrosion | All steel must be marine grade |
| Flood risk | Raise floor level, check drainage |

---

## Tutorial 3: Create a Professional Drawing for Submission

**Time: 20 minutes | Difficulty: Intermediate**

### What You'll Create
A complete drawing ready for PNG Building Board submission.

### Step-by-Step

#### 1. Prepare Your Drawing Content
- Complete your floor plan
- Add all dimensions
- Add room labels and notes
- Add door and window symbols

#### 2. Add Building Parameters
1. Open **PNG Analysis > 🏗️ Building Parameters**
2. Select correct province and building class
3. Click **➕ Insert to Drawing**
4. Position in corner of drawing

#### 3. Add Scale Information
Make sure scale is set correctly:
- 1:100 is typical for floor plans
- 1:50 for detailed views
- 1:200 for site plans

#### 4. Organize Layers
Before export, organize:
1. Hide construction/reference layers
2. Ensure all drawing layers are visible
3. Check that dimensions are on "Dimensions" layer

#### 5. Export to PDF
1. Click **File > 📄 Export PDF**
2. PDF downloads with:
   - Your drawing
   - Title block
   - Project name and date
   - Scale information

#### 6. Print for Submission
Open the PDF and print on A3 paper.

---

## Tutorial 4: Import and Modify a DXF File

**Time: 10 minutes | Difficulty: Intermediate**

### When You Need This
- Received a DXF file from another engineer
- Working with existing AutoCAD drawings
- Modifying surveyor-provided data

### Step-by-Step

#### 1. Import the DXF
1. Start a new project
2. Click **File > Open**
3. Select your `.dxf` file
4. Wait for import to complete

#### 2. Check What Imported
1. Look at the Layer Panel
2. DXF layers are preserved
3. Toggle visibility to explore layers

#### 3. Set Your Location
Even for imported files:
1. Open **PNG Analysis > 🏗️ Building Parameters**
2. Set the correct province
3. This ensures correct design parameters

#### 4. Make Modifications
Now you can:
- Add new elements
- Modify existing geometry
- Add PNG-specific annotations
- Add dimensions

#### 5. Export Back to DXF (Optional)
To share with AutoCAD users:
1. Click **File > Export DXF**
2. Your changes are preserved

---

## Tutorial 5: Using the Analysis Panels

**Time: 15 minutes | Difficulty: Intermediate**

### Opening the PNG Analysis Panel
Click **PNG Analysis > Analysis Panel**

### Climate Analysis
Shows for your province:
- Temperature range (°C)
- Humidity levels (%)
- Annual rainfall (mm)
- Maximum daily rainfall
- Cyclone risk level

**Design Impact:**
- High rainfall → Steep roof pitch required
- High humidity → Ventilation required
- Cyclone risk → Cyclone tie-downs required

### Seismic Analysis
Input your building details:
- Building height
- Number of storeys
- Structural system type
- Building weight estimate

Output provides:
- Design base shear (kN)
- Force at each level
- Foundation recommendations

### Flood Analysis
Based on your location:
- Flood zone classification
- Expected flood levels for different return periods
- Minimum floor height
- Material requirements

### Materials Database
Search for local materials:
- PNG timber species and their properties
- Concrete mix designs
- Steel specifications
- Availability by region

---

## Tutorial 6: Drainage Design Workflow

**Time: 30 minutes | Difficulty: Advanced**

### What You'll Design
A drainage system for a site, sized correctly for PNG rainfall.

### Step-by-Step

#### 1. Define the Catchment Area
1. Press **`P`** for Polyline
2. Draw the boundary of your drainage catchment
3. Close the polyline

#### 2. Get Climate Data
1. Open Building Parameters
2. Note the rainfall data for your province
3. This determines your design rainfall intensity

#### 3. Calculate Design Flow
The app calculates:
- Q = CIA/360 (Rational Method)
- C = runoff coefficient (from surface type)
- I = rainfall intensity (from climate data)
- A = catchment area (from your drawing)

#### 4. Size Drainage Structures
Based on the calculated flow:
- Channels are sized using Manning's equation
- Pipes use standard PNG sizes
- Freeboard is automatically included

#### 5. Add Cross-Sections
The workflow generates:
- Plan view of drainage route
- Cross-sections at key points
- Sizing details and dimensions

---

## Common Tips for All Tutorials

### Saving Your Work
- **Auto-save** happens every 60 seconds
- Press **Ctrl+S** for immediate save
- Projects are stored locally (works offline!)

### Undoing Mistakes  
- **Ctrl+Z** to undo
- **Ctrl+Y** to redo
- Unlimited undo history

### Zooming and Panning
- **Scroll wheel** to zoom
- **Middle mouse button drag** to pan
- **Ctrl+0** to fit all in view

### Getting Help
- **F1** or **Help menu** for documentation
- All values have sources cited in `docs/DATA_SOURCES.md`

---

*These tutorials use metric units (mm for drawing, m for dimensions). PNG Civil CAD is designed for the metric system used in PNG.*
