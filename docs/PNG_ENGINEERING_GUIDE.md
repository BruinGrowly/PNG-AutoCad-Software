# PNG Civil Engineering Design Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Climate Considerations](#climate-considerations)
3. [Seismic Design](#seismic-design)
4. [Flood Risk Management](#flood-risk-management)
5. [Material Selection](#material-selection)
6. [Structural Design](#structural-design)
7. [Traditional Construction](#traditional-construction)
8. [Reference Standards](#reference-standards)

---

## Introduction

Papua New Guinea presents unique challenges for civil engineering due to its:
- Location on the Pacific Ring of Fire (high seismic activity)
- Tropical climate with high rainfall and humidity
- Diverse terrain from coastal lowlands to mountain highlands
- Remote communities with limited material access
- Rich traditional building knowledge

This guide provides PNG-specific engineering guidance integrated into the CAD software.

---

## Climate Considerations

### Climate Zones

PNG has four main climate zones:

#### Tropical Coastal
- **Provinces**: Central, NCD, Morobe, Madang
- **Temperature**: 23-32°C
- **Humidity**: 70-95%
- **Rainfall**: ~2500mm/year
- **Cyclone Risk**: Low

**Design Considerations**:
- Maximum ventilation for cooling
- Salt spray corrosion protection
- High roof pitch for rain runoff (min 25°)
- Extended overhangs (0.9-1.2m)

#### Tropical Highland
- **Provinces**: Eastern, Western, Southern Highlands, Enga, Simbu
- **Temperature**: 12-24°C
- **Humidity**: 60-90%
- **Rainfall**: ~2800mm/year

**Design Considerations**:
- May require some insulation
- Morning mist/fog consideration
- Moderate ventilation
- Good for concrete construction (cooler curing)

#### Tropical Monsoon
- **Provinces**: East Sepik, Sandaun, Gulf, Western, Oro
- **Temperature**: 22-33°C
- **Humidity**: 75-98%
- **Rainfall**: ~4000mm/year (heaviest)
- **Cyclone Risk**: Moderate

**Design Considerations**:
- Maximum moisture protection
- Steep roof pitch (min 30°)
- Elevated floors essential
- Extensive drainage systems
- Mold prevention critical

#### Tropical Island
- **Provinces**: ENB, WNB, New Ireland, Manus, Milne Bay, Bougainville
- **Temperature**: 24-31°C
- **Humidity**: 75-95%
- **Rainfall**: ~3000mm/year
- **Cyclone Risk**: HIGH

**Design Considerations**:
- Cyclone-resistant construction
- Marine-grade corrosion protection
- Strong roof tie-downs
- Storm surge consideration
- Salt-resistant materials

### Rainfall Design

#### Design Storm Intensities

| Return Period | Coastal (mm/hr) | Highland (mm/hr) | Monsoon (mm/hr) |
|---------------|-----------------|------------------|-----------------|
| 2 years | 80 | 70 | 100 |
| 10 years | 120 | 100 | 150 |
| 50 years | 160 | 140 | 200 |
| 100 years | 180 | 160 | 230 |

#### Drainage Design

Use the Rational Method:
```
Q = CIA/360

Where:
Q = Peak runoff (m³/s)
C = Runoff coefficient
I = Rainfall intensity (mm/hr)
A = Catchment area (hectares)
```

**Runoff Coefficients for PNG**:
| Surface | Coefficient |
|---------|-------------|
| Roofs | 0.9 |
| Concrete/asphalt | 0.85 |
| Compacted gravel | 0.6 |
| Grass/gardens | 0.25 |
| Forest | 0.15 |

### Wind Design

#### Design Wind Speeds

| Region | V₅₀ (m/s) | V₅₀₀ (m/s) |
|--------|-----------|------------|
| Non-cyclonic | 35 | 45 |
| Cyclonic (C1) | 45 | 55 |
| Cyclonic (C2) | 50 | 65 |

#### Cyclone Regions
- **Region C2 (High)**: East New Britain, New Ireland, Manus, North coast
- **Region C1 (Moderate)**: West New Britain, Bougainville, Milne Bay
- **Non-cyclonic**: Highlands, Southern coast

---

## Seismic Design

### Seismic Zones

PNG is divided into four seismic zones based on proximity to tectonic plate boundaries:

| Zone | Hazard Factor (Z) | Description | Provinces |
|------|-------------------|-------------|-----------|
| Zone 1 | 0.15 | Low | Western |
| Zone 2 | 0.25 | Moderate | Highlands |
| Zone 3 | 0.35 | High | Central, Gulf, Milne Bay, Oro |
| Zone 4 | 0.50 | Very High | North coast, Islands |

### Soil Classes

| Class | Description | Site Factor | Common in PNG |
|-------|-------------|-------------|---------------|
| A | Strong rock | 0.8 | Rare |
| B | Rock | 1.0 | Highlands |
| C | Shallow stiff soil | 1.25 | Common |
| D | Deep soft soil | 1.5 | Coastal, valleys |
| E | Very soft soil | 2.0 | Alluvial, swamp |

### Structural Systems

#### Recommended for Zone 4 (Very High Seismic)

1. **Timber Frame**
   - Traditional with modern connections
   - Good ductility
   - Height limit: 10m
   - Use proper tie-down straps

2. **Reinforced Concrete Shear Walls**
   - Preferred for larger buildings
   - Height limit: 60m
   - Requires ductile detailing

3. **Steel Frame**
   - Excellent ductility
   - Height limit: 100m
   - Corrosion protection essential

#### NOT Recommended in High Seismic Zones

- Unreinforced masonry
- Adobe/mud brick
- Stone masonry without reinforcement

### Foundation Design

#### Zone 4 Requirements

1. **Tie Beams**: Connect all footings with reinforced concrete tie beams
2. **Depth**: Minimum 600mm below ground
3. **Reinforcement**: Continuous reinforcement through all footings
4. **Liquefaction**: Assess and mitigate in coastal/alluvial soils

#### Liquefaction Risk

High risk areas:
- Coastal areas with sandy soils
- River valleys with alluvial deposits
- Reclaimed land

Mitigation:
- Deep foundations (piles)
- Ground improvement
- Avoid or reinforce loose sandy soils

### Seismic Detailing

#### Concrete Structures

```
Columns:
- Ties at 100mm spacing in plastic hinge zones
- 135° hooks on ties (not 90°)
- Lap splices away from joints
- Minimum 8 ties through joint region

Beams:
- Closed stirrups (135° hooks)
- Continuous top and bottom bars through joints
- Close stirrup spacing near supports

Shear Walls:
- Boundary elements at ends
- Minimum 0.25% horizontal reinforcement
- Minimum 0.25% vertical reinforcement
```

---

## Flood Risk Management

### Flood Zone Classification

| Zone | Return Period | Floor Height | Construction |
|------|---------------|--------------|--------------|
| Minimal | 500 years | +0.3m | Standard |
| Moderate | 100 years | +0.6m | Flood-resistant |
| High | 50 years | +1.0m | Elevated required |
| Very High | 10 years | +1.5m | Stilts/floating |

### Major River Systems

| River | Provinces | Flood Season | Risk |
|-------|-----------|--------------|------|
| Sepik | East Sepik, Sandaun | Dec-Apr | Very High |
| Fly | Western, Gulf | Dec-Apr | Very High |
| Markham | Morobe | Nov-Mar | High |
| Ramu | Madang, East Sepik | Dec-Apr | High |
| Purari | Gulf, SHP | Dec-Mar | Very High |

### Flood-Resistant Design

#### Elevated Construction

**Traditional Stilt House (Haus Win)**:
```
Height: 1.5-3.0m above ground
Posts: Treated hardwood or concrete
Floor: Timber or bamboo decking
Walls: Open or removable panels
Access: Ladder or stairs (removable)
```

**Modern Elevated Slab**:
```
Height: Based on 100-year flood + 0.3m freeboard
Structure: Reinforced concrete or steel
Fill: Compacted engineered fill
Drainage: Around building perimeter
```

#### Flood Vents

For enclosed spaces below flood level:
```
Area: 1 sq inch per sq foot of enclosed space
Location: Within 0.3m of ground
Protection: Corrosion-resistant mesh
```

#### Materials Below Flood Level

**Acceptable**:
- Concrete (minimum 25 MPa)
- Treated timber (H5 or H6)
- Masonry with waterproof render
- Stainless steel
- Pressure-treated plywood (marine grade)

**Not Acceptable**:
- Untreated timber
- Standard plasterboard
- Carpet or fabric
- Particle board
- Standard insulation

---

## Material Selection

### Timber Selection

#### Durability Classes

| Class | In-Ground Life | Above-Ground Life | PNG Species |
|-------|----------------|-------------------|-------------|
| 1 | >25 years | >40 years | Kwila |
| 2 | 15-25 years | 15-40 years | Taun, Rosewood |
| 3 | 5-15 years | 7-15 years | Calophyllum |
| 4 | <5 years | <7 years | Most softwoods |

#### Recommended Species

**Kwila (Intsia bijuga)**
- Best natural durability
- Excellent termite resistance
- Ideal for: Structural, marine, decking
- Cost: High but long-lasting

**Taun (Pometia spp.)**
- Good durability when treated
- Widely available
- Ideal for: General construction
- Cost: Moderate

**Treated Plantation Pine**
- CCA or ACQ treatment required
- Good for protected applications
- Ideal for: Framing, formwork
- Cost: Low

#### Treatment Requirements

| Application | Hazard Class | Treatment |
|-------------|--------------|-----------|
| Internal, dry | H1 | Optional |
| Internal, damp | H2 | Light |
| External, above ground | H3 | Moderate |
| External, ground contact | H4 | Heavy |
| Ground contact, critical | H5 | Very heavy |
| Marine | H6 | Marine grade |

### Concrete

#### Mix Design for PNG

| Application | Strength | Mix Ratio | Cement (kg/m³) |
|-------------|----------|-----------|----------------|
| Blinding | 15 MPa | 1:3:6 | 220 |
| Footings | 20 MPa | 1:2:4 | 280 |
| Slabs | 25 MPa | 1:1.5:3 | 340 |
| Columns/beams | 32 MPa | 1:1:2 | 420 |

#### Aggregate Requirements

- Maximum size: 20mm (general), 40mm (mass concrete)
- Silt content: <3% (wash if higher)
- Organic matter: None
- Alkali-reactive: Test required

**WARNING**: Coral aggregate is NOT suitable for reinforced concrete due to high chloride content.

#### Curing

PNG's climate requires careful curing:
- Minimum 7 days wet curing
- Cover with plastic or wet hessian
- Avoid curing during hottest part of day
- Use curing compound if water unavailable

### Steel

#### Reinforcement

| Grade | Yield Strength | Use |
|-------|----------------|-----|
| R250 | 250 MPa | Ties, fitments |
| N500 | 500 MPa | Main bars |

#### Corrosion Protection

**Concrete Cover Requirements**:
| Exposure | Cover (mm) |
|----------|-----------|
| Internal | 25 |
| External | 40 |
| In ground | 50 |
| Coastal (<1km) | 65 |
| Marine | 75 |

**Steel Sections**:
- Hot-dip galvanizing minimum 600 g/m²
- Consider stainless steel for marine
- Paint system for aggressive environments

### Roofing

#### Corrugated Iron Specifications

| Coating | Minimum for PNG | Best for |
|---------|-----------------|----------|
| Z275 | Not recommended | - |
| Z450 | Inland, highlands | Standard use |
| AZ150 | Coastal, corrosive | Coastal areas |
| AZ200 | Marine, cyclonic | High exposure |

#### Installation

- Minimum pitch: 15° (10° with sealed laps)
- Side lap: 1.5 corrugations
- End lap: 150mm (standard), 200mm (low pitch)
- Fasteners: Type 17 screws, EPDM washers
- Edge fastening: Extra screws in cyclonic regions

---

## Structural Design

### Load Combinations (PNG)

#### Ultimate Limit State

```
1.35G                           (Dead only)
1.2G + 1.5Q                     (Dead + Live)
1.2G + Wu + 0.4Q                (Dead + Wind + Live)
0.9G + Wu                       (Dead + Wind uplift)
G + Eu + 0.3Q                   (Dead + Earthquake + Live)
```

Where:
- G = Dead load
- Q = Live load
- Wu = Ultimate wind load
- Eu = Ultimate earthquake load

### Roof Design

#### Minimum Roof Pitch by Rainfall

| Annual Rainfall | Minimum Pitch |
|-----------------|---------------|
| <2000mm | 15° |
| 2000-3000mm | 20° |
| 3000-4000mm | 25° |
| >4000mm | 30° |

#### Rafter Sizing (Treated Pine, 600mm spacing)

| Span (m) | Rafter Size (mm) |
|----------|------------------|
| 2.5 | 90 x 45 |
| 3.5 | 140 x 45 |
| 4.5 | 190 x 45 |
| 5.5 | 190 x 70 |
| 6.5 | 240 x 70 |

### Foundation Design

#### Pad Footings

```
Size: A = P / qa

Where:
A = Footing area (m²)
P = Column load (kN)
qa = Allowable bearing pressure (kPa)
```

**Typical Bearing Capacities (PNG)**:
| Soil Type | Allowable Bearing (kPa) |
|-----------|-------------------------|
| Rock | 1000-3000 |
| Dense gravel | 300-600 |
| Stiff clay | 150-300 |
| Loose sand | 75-150 |
| Soft clay | 50-100 |
| Alluvial | 25-75 |

---

## Traditional Construction

### Haus Tambaran (Spirit House)

Traditional highlands construction with excellent seismic performance.

**Key Features**:
- Timber post and beam frame
- Lashed connections (flexible)
- Lightweight walls (woven bamboo/kunai)
- Steep thatched roof

**Modern Integration**:
- Concrete post footings
- Treated timber posts
- Steel cyclone ties at roof
- Corrugated iron over thatch

### Haus Win (Stilt House)

Coastal and flood-prone area traditional design.

**Key Features**:
- Elevated 1.5-3m on timber posts
- Open under-floor (storage, animals)
- Good ventilation
- Flood-resistant

**Modern Integration**:
- Concrete piles or treated posts
- Steel connectors
- Modern cladding options
- Sanitation improvements

### Traditional Materials

#### Kunai Grass (Imperata cylindrica)
- Excellent roofing material
- Natural insulation
- Fire risk - treat with borax
- 10-15 year life if maintained

#### Sago Palm (Metroxylon sagu)
- Fronds for roofing
- Trunk for flooring
- Very sustainable
- 15-20 year life

#### Bamboo
- Multiple species in PNG
- High tensile strength
- Treat with borax against insects
- 10-20 year life when treated

---

## Reference Standards

### Primary Standards

1. **PNG Building Board Standards**
   - National Building Code of Papua New Guinea
   - Minimum Building Standards

2. **Australian/New Zealand Standards**
   - AS/NZS 1170.0-4 Structural Design Actions
   - AS 3600 Concrete Structures
   - AS 4100 Steel Structures
   - AS 1720 Timber Structures

3. **International Standards**
   - ISO standards for materials testing
   - IBC (International Building Code) reference

### Key References

1. *Building in Papua New Guinea* - PNG Building Board
2. *Tropical Building Design* - CSIRO
3. *Earthquake-Resistant Construction* - UNDP/UNOPS
4. *Traditional Building in PNG* - Institute of PNG Studies

---

## Checklist: PNG Design Compliance

### Climate
- [ ] Ventilation adequate for climate zone
- [ ] Roof pitch meets rainfall requirements
- [ ] Overhangs appropriate for rain protection
- [ ] Corrosion protection for coastal locations
- [ ] Termite protection specified

### Seismic
- [ ] Seismic zone identified
- [ ] Soil class determined
- [ ] Structural system appropriate for zone
- [ ] Base shear calculated
- [ ] Ductile detailing specified
- [ ] Foundation ties provided

### Flood
- [ ] Flood zone determined
- [ ] Floor level above design flood
- [ ] Flood-resistant materials below flood level
- [ ] Drainage adequate
- [ ] Emergency access considered

### Materials
- [ ] Timber durability appropriate
- [ ] Treatment specified where required
- [ ] Concrete cover adequate
- [ ] Fasteners corrosion-resistant
- [ ] Local availability confirmed

---

*PNG Civil Engineering Design Guide v1.0*
*For use with PNG Civil CAD Software*
