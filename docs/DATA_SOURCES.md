# PNG Civil CAD - Data Sources

> [!IMPORTANT]
> This document lists the sources for all engineering values embedded in the software. Users should verify values against current standards for critical applications.

---

## Seismic Hazard Factors (Z Values)

| Province | Z Value | Category | Source |
|----------|---------|----------|--------|
| Western | 0.20 | Far-field | PNG Building Code (1982), Zone II |
| Gulf | 0.35 | Moderate | PNG Building Code (1982), Zone III |
| Central | 0.40 | High | PNG Building Code (1982), Zone IV |
| National Capital | 0.40 | High | PNG Building Code (1982), Zone IV |
| Milne Bay | 0.45 | Very High | Gibson & Sandiford (2013), near-fault |
| Northern (Oro) | 0.45 | Very High | Gibson & Sandiford (2013), near-fault |
| Morobe | 0.50 | Severe | USGS/Geoscience Australia (2018) |
| Madang | 0.50 | Severe | Gibson & Sandiford (2013), near-fault |
| East Sepik | 0.35 | Moderate | PNG Building Code (1982), Zone III |
| West Sepik (Sandaun) | 0.30 | Moderate | PNG Building Code (1982), Zone III |
| Eastern Highlands | 0.35 | Moderate | Ripper & Letz (1991) |
| Western Highlands | 0.30 | Moderate | Ripper & Letz (1991) |
| Simbu (Chimbu) | 0.35 | Moderate | Ripper & Letz (1991) |
| Southern Highlands | 0.25 | Low-Moderate | PNG Building Code (1982), Zone II |
| Hela | 0.25 | Low-Moderate | Inferred from Southern Highlands |
| Jiwaka | 0.30 | Moderate | Inferred from Western Highlands |
| Enga | 0.30 | Moderate | Ripper & Letz (1991) |
| New Ireland | 0.40 | High | Near subduction zone |
| East New Britain | 0.50 | Severe | Near Rabaul volcanic zone |
| West New Britain | 0.50 | Severe | Near subduction zone |
| Manus | 0.40 | High | Near transform fault |
| Bougainville | 0.50 | Severe | Near Solomon plate boundary |

### Primary Sources

1. **PNG Building Code (1982)** - Official national standard, uses 20-year return period (outdated)
2. **Gibson & Sandiford (2013)** - "Seismicity of Papua New Guinea", Australian Journal of Earth Sciences
3. **Ripper & Letz (1991)** - "Seismic Hazard Assessment of Papua New Guinea", Geological Survey of PNG
4. **USGS/Geoscience Australia (2018)** - Global Earthquake Model hazard data

### Notes

- The 1982 PNG Building Code uses a 20-year return period, which is outdated
- Modern practice uses 475-year (10% in 50 years) or 2475-year (2% in 50 years) return periods
- Values here are adjusted to approximate 475-year return period

---

## Rainfall Data (IDF Curves)

| Region | Max Daily (mm) | Annual (mm) | Source |
|--------|--------------|-------------|--------|
| Lowland Tropical | 350 | 3800 | PNG BOM Station Records |
| Highland Tropical | 220 | 2800 | PNG BOM Station Records |
| Monsoon Tropical | 400 | 4000 | PNG BOM Station Records |
| Coastal Wet | 380 | 4200 | PNG BOM Station Records |
| Rain Shadow | 180 | 1800 | PNG BOM Station Records |

### Rainfall Intensity Formula

```
I = I_base * RF * DF

Where:
- I_base = maxDaily / 24 * 60 (convert to mm/hr)
- RF = log(ARI)/log(10) * 0.4 + 0.6 (return period factor)
- DF = (60/(tc+10))^0.7 (duration factor)
```

### Primary Sources

1. **PNG Bureau of Meteorology** - Historical rainfall records (1960-2020)
2. **Australian Bureau of Meteorology** - Regional IFD curves for Torres Strait
3. **McAlpine et al. (1983)** - "Climate of Papua New Guinea", CSIRO/ANU

---

## Runoff Coefficients

| Surface Type | C Value | Source |
|--------------|---------|--------|
| Metal roof | 0.95 | PNG DWorks Manual (1985) |
| Thatch roof | 0.60 | PNG DWorks Manual (1985) |
| Concrete | 0.95 | Standard engineering practice |
| Asphalt | 0.90 | Standard engineering practice |
| Gravel | 0.60 | ReCAP (2019) |
| Grass (flat) | 0.25 | PNG DWorks Manual (1985) |
| Grass (moderate slope) | 0.35 | PNG DWorks Manual (1985) |
| Grass (steep) | 0.45 | PNG DWorks Manual (1985) |
| Kunai grassland | 0.40 | Estimated from field studies |
| Forest | 0.20 | Standard engineering practice |
| Bare soil | 0.70 | PNG DWorks Manual (1985) |
| Laterite | 0.75 | PNG DWorks Manual (1985) |

### Primary Sources

1. **PNG Department of Works Drainage Design Manual (1985)** - Official PNG guidance
2. **ReCAP Low Volume Roads Manual (2019)** - Updated values for gravel roads
3. **AR&R (2019)** - Australian Rainfall & Runoff (for comparison)

---

## Wind Regions

| Province | Wind Region | Basic Wind Speed (m/s) | Source |
|----------|-------------|----------------------|--------|
| New Ireland | C | 52 | AS/NZS 1170.2 (cyclonic) |
| East New Britain | C | 52 | AS/NZS 1170.2 (cyclonic) |
| West New Britain | C | 52 | AS/NZS 1170.2 (cyclonic) |
| Manus | C | 52 | AS/NZS 1170.2 (cyclonic) |
| Bougainville | C | 52 | AS/NZS 1170.2 (cyclonic) |
| Milne Bay | B | 45 | Transitional zone |
| Northern | B | 45 | Transitional zone |
| All Highlands | A | 37 | Non-cyclonic |
| Gulf | B | 45 | Transitional zone |
| Western | B | 45 | Transitional zone |

### Primary Sources

1. **AS/NZS 1170.2:2021** - Structural design actions - Wind actions
2. **PNG Building Code (1982)** - Wind zones (outdated)
3. **BoM Tropical Cyclone Database** - Historical cyclone tracks

---

## Timber Species Properties

| Species | Local Name | Density (kg/m³) | MoE (GPa) | Bending (MPa) | Source |
|---------|------------|-----------------|-----------|---------------|--------|
| Intsia bijuga | Kwila | 850 | 14.5 | 120 | PNG FRI (2005) |
| Pometia pinnata | Taun | 780 | 12.2 | 98 | PNG FRI (2005) |
| Calophyllum sp. | Calophyllum | 620 | 11.5 | 75 | PNG FRI (2005) |
| Pterocarpus indicus | Rosewood | 640 | 10.8 | 82 | PNG FRI (2005) |
| Vitex cofassus | Vitex | 560 | 9.2 | 65 | PNG FRI (2005) |

### Primary Sources

1. **PNG Forest Research Institute (2005)** - "Timber Species of Papua New Guinea"
2. **CSIRO (1980)** - "Properties of Tropical Timbers"

---

## Road Design Standards

| Road Class | Design Speed (km/h) | Width (m) | Shoulder (m) | Source |
|------------|---------------------|-----------|--------------|--------|
| Provincial Road | 60 | 6.0 | 1.5 | PNG DWorks (1998) |
| District Road | 40 | 5.5 | 1.0 | ReCAP (2019) |
| Access Road | 30 | 4.5 | 0.5 | ReCAP (2019) |
| Track | 20 | 3.5 | 0.0 | ReCAP (2019) |

### Gravel Pavement Thickness (mm)

| Traffic (vpd) | CBR 3 | CBR 5 | CBR 10 | CBR 15 | Source |
|---------------|-------|-------|--------|--------|--------|
| <15 | 175 | 150 | 125 | 100 | ReCAP (2019) |
| 15-50 | 200 | 175 | 150 | 125 | ReCAP (2019) |
| 50-150 | 250 | 200 | 175 | 150 | ReCAP (2019) |

### Primary Sources

1. **PNG Department of Works (1998)** - Road Design Manual
2. **ReCAP Low Volume Rural Road Design (2019)** - UK DFID funded research
3. **Austroads (2017)** - Guide to Pavement Technology

---

## Confidence Levels

| Data Category | Confidence | Notes |
|---------------|------------|-------|
| Seismic Z (Islands) | High | Well-studied subduction zones |
| Seismic Z (Highlands) | Medium | Less instrumentation |
| Rainfall (Lowlands) | High | Long-term gauge records |
| Rainfall (Remote) | Low | Interpolated, sparse data |
| Runoff Coefficients | Medium | Adapted from limited local studies |
| Timber Properties | High | Laboratory tested |
| Road Standards | High | Published guidelines |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-04 | Initial documentation |

---

## Contributing

To update data sources:
1. Verify with current PNG Building Board standards
2. Add reference with year and page number
3. Note confidence level
4. Update version history
