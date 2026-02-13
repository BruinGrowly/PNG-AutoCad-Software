/**
 * DXF Export Module
 * Export CAD entities to DXF format
 */

// ============================================
// DXF File Structure
// ============================================

/**
 * Export project to DXF format
 */
export function exportToDXF(project) {
  const sections = [];

  // HEADER section
  sections.push(generateHeaderSection(project));

  // TABLES section
  sections.push(generateTablesSection(project));

  // BLOCKS section
  sections.push(generateBlocksSection(project));

  // ENTITIES section
  sections.push(generateEntitiesSection(project));

  // EOF
  sections.push('0\nEOF\n');

  return sections.join('');
}

// ============================================
// DXF Sections
// ============================================

function generateHeaderSection(project) {
  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSBASE
10
0.0
20
0.0
30
0.0
9
$EXTMIN
10
-10000.0
20
-10000.0
30
0.0
9
$EXTMAX
10
10000.0
20
10000.0
30
0.0
9
$LIMMIN
10
0.0
20
0.0
9
$LIMMAX
10
10000.0
20
10000.0
9
$LUNITS
70
2
9
$LUPREC
70
4
9
$AUNITS
70
0
9
$AUPREC
70
2
0
ENDSEC
`;
}

function generateTablesSection(project) {
  let tables = `0
SECTION
2
TABLES
`;

  // LTYPE table
  tables += `0
TABLE
2
LTYPE
70
${4}
`;
  tables += generateLineType('CONTINUOUS', 'Solid line');
  tables += generateLineType('DASHED', 'Dashed line', [5, -3]);
  tables += generateLineType('DOTTED', 'Dotted line', [0.5, -2]);
  tables += generateLineType('DASHDOT', 'Dash dot line', [5, -2, 0.5, -2]);
  tables += `0
ENDTAB
`;

  // LAYER table
  tables += `0
TABLE
2
LAYER
70
${project.layers.length}
`;
  for (const layer of project.layers) {
    tables += generateLayer(layer);
  }
  tables += `0
ENDTAB
`;

  // STYLE table (text styles)
  tables += `0
TABLE
2
STYLE
70
1
0
STYLE
2
STANDARD
70
0
40
0.0
41
1.0
50
0.0
71
0
42
2.5
3
txt
4

0
ENDTAB
`;

  tables += `0
ENDSEC
`;

  return tables;
}

function generateLineType(name, description, pattern = null) {
  let lt = `0
LTYPE
2
${name}
70
0
3
${description}
72
65
`;

  if (pattern) {
    const length = pattern.reduce((sum, val) => sum + Math.abs(val), 0);
    lt += `73
${pattern.length}
40
${length}
`;
    for (const dash of pattern) {
      lt += `49
${dash}
`;
    }
  } else {
    lt += `73
0
40
0.0
`;
  }

  return lt;
}

function generateLayer(layer) {
  const color = colorToACI(layer.color);
  const lineType = layer.lineType === 'continuous' ? 'CONTINUOUS' : layer.lineType.toUpperCase();

  return `0
LAYER
2
${layer.name}
70
${layer.locked ? 4 : 0}
62
${layer.visible ? color : -color}
6
${lineType}
`;
}

function generateBlocksSection(project) {
  let blocks = `0
SECTION
2
BLOCKS
`;

  // Model space block
  blocks += `0
BLOCK
8
0
2
*MODEL_SPACE
70
0
10
0.0
20
0.0
30
0.0
3
*MODEL_SPACE
0
ENDBLK
8
0
`;

  // Paper space block
  blocks += `0
BLOCK
8
0
2
*PAPER_SPACE
70
0
10
0.0
20
0.0
30
0.0
3
*PAPER_SPACE
0
ENDBLK
8
0
`;

  // Custom blocks
  if (project.blocks) {
    for (const block of project.blocks) {
      blocks += generateBlock(block);
    }
  }

  blocks += `0
ENDSEC
`;

  return blocks;
}

function generateBlock(block) {
  let b = `0
BLOCK
8
0
2
${block.name}
70
0
10
${block.basePoint.x}
20
${block.basePoint.y}
30
0.0
3
${block.name}
`;

  // Add block entities
  for (const entity of block.entities) {
    b += entityToDXF(entity);
  }

  b += `0
ENDBLK
8
0
`;

  return b;
}

function generateEntitiesSection(project) {
  let entities = `0
SECTION
2
ENTITIES
`;

  for (const entity of project.entities) {
    if (entity.visible) {
      entities += entityToDXF(entity, project.layers);
    }
  }

  entities += `0
ENDSEC
`;

  return entities;
}

// ============================================
// Entity Conversion
// ============================================

function entityToDXF(entity, layers = []) {
  const layer = layers.find(l => l.id === entity.layerId);
  const layerName = layer ? layer.name : '0';
  const color = colorToACI(entity.style?.strokeColor || '#000000');

  switch (entity.type) {
    case 'line':
      return lineToDXF(entity, layerName, color);
    case 'polyline':
      return polylineToDXF(entity, layerName, color);
    case 'circle':
      return circleToDXF(entity, layerName, color);
    case 'arc':
      return arcToDXF(entity, layerName, color);
    case 'rectangle':
      return rectangleToDXF(entity, layerName, color);
    case 'text':
      return textToDXF(entity, layerName, color);
    case 'dimension':
      return dimensionToDXF(entity, layerName, color);
    case 'hatch':
      return hatchToDXF(entity, layerName, color);
    case 'block':
      return blockInsertToDXF(entity, layerName);
    default:
      return '';
  }
}

function lineToDXF(entity, layerName, color) {
  return `0
LINE
8
${layerName}
62
${color}
10
${entity.startPoint.x}
20
${entity.startPoint.y}
30
0.0
11
${entity.endPoint.x}
21
${entity.endPoint.y}
31
0.0
`;
}

function polylineToDXF(entity, layerName, color) {
  let dxf = `0
LWPOLYLINE
8
${layerName}
62
${color}
90
${entity.points.length}
70
${entity.closed ? 1 : 0}
`;

  for (const point of entity.points) {
    dxf += `10
${point.x}
20
${point.y}
`;
  }

  return dxf;
}

function circleToDXF(entity, layerName, color) {
  return `0
CIRCLE
8
${layerName}
62
${color}
10
${entity.center.x}
20
${entity.center.y}
30
0.0
40
${entity.radius}
`;
}

function arcToDXF(entity, layerName, color) {
  // Convert radians to degrees
  const startAngle = (entity.startAngle * 180) / Math.PI;
  const endAngle = (entity.endAngle * 180) / Math.PI;

  return `0
ARC
8
${layerName}
62
${color}
10
${entity.center.x}
20
${entity.center.y}
30
0.0
40
${entity.radius}
50
${startAngle}
51
${endAngle}
`;
}

function rectangleToDXF(entity, layerName, color) {
  // Convert rectangle to polyline
  const points = [
    entity.topLeft,
    { x: entity.topLeft.x + entity.width, y: entity.topLeft.y },
    { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height },
    { x: entity.topLeft.x, y: entity.topLeft.y + entity.height },
  ];

  let dxf = `0
LWPOLYLINE
8
${layerName}
62
${color}
90
4
70
1
`;

  for (const point of points) {
    dxf += `10
${point.x}
20
${point.y}
`;
  }

  return dxf;
}

function textToDXF(entity, layerName, color) {
  const rotation = ((entity.rotation || 0) * 180) / Math.PI;

  return `0
TEXT
8
${layerName}
62
${color}
10
${entity.position.x}
20
${entity.position.y}
30
0.0
40
${entity.fontSize || 2.5}
1
${entity.content}
50
${rotation}
7
STANDARD
`;
}

function dimensionToDXF(entity, layerName, color) {
  // Export as native DXF DIMENSION entity for full compatibility

  // Determine dimension type
  // 0 = Linear, 1 = Aligned, 2 = Angular, 3 = Diameter, 4 = Radius
  let dimType = 0;
  if (entity.dimensionType === 'aligned') dimType = 1;
  else if (entity.dimensionType === 'angular') dimType = 2;
  else if (entity.dimensionType === 'diameter') dimType = 3;
  else if (entity.dimensionType === 'radius') dimType = 4;

  // Get dimension points
  const defPoint1 = entity.point1 || entity.startPoint || { x: 0, y: 0 };
  const defPoint2 = entity.point2 || entity.endPoint || { x: 0, y: 0 };
  const dimLinePoint = entity.dimLinePosition || entity.textPosition || {
    x: (defPoint1.x + defPoint2.x) / 2,
    y: (defPoint1.y + defPoint2.y) / 2 + 10,
  };
  const textPoint = entity.textPosition || dimLinePoint;
  const textRotation = ((entity.textRotation || 0) * 180) / Math.PI;
  const dimensionText = entity.displayText || entity.text || '<>';

  let dxf = `0
DIMENSION
8
${layerName}
62
${color}
2
*D0
`;

  // Definition point (dimension line location determining point)
  dxf += `10
${dimLinePoint.x}
20
${dimLinePoint.y}
30
0.0
`;

  // Text middle point
  dxf += `11
${textPoint.x}
21
${textPoint.y}
31
0.0
`;

  // Dimension type
  dxf += `70
${dimType}
`;

  // Dimension text (use '<>' for computed value)
  dxf += `1
${dimensionText}
`;

  // Text rotation
  if (textRotation !== 0) {
    dxf += `53
${textRotation}
`;
  }

  // First definition point (extension line 1 origin)
  dxf += `13
${defPoint1.x}
23
${defPoint1.y}
33
0.0
`;

  // Second definition point (extension line 2 origin)
  dxf += `14
${defPoint2.x}
24
${defPoint2.y}
34
0.0
`;

  // Dimension style name
  dxf += `3
STANDARD
`;

  // For angular dimensions, add vertex point
  if (dimType === 2 && entity.vertex) {
    dxf += `15
${entity.vertex.x}
25
${entity.vertex.y}
35
0.0
`;
  }

  // For radius/diameter, add center point
  if ((dimType === 3 || dimType === 4) && entity.center) {
    dxf += `15
${entity.center.x}
25
${entity.center.y}
35
0.0
`;
  }

  return dxf;
}

function hatchToDXF(entity, layerName, color) {
  if (!Array.isArray(entity.boundary) || entity.boundary.length < 2) {
    // Keep export resilient when legacy hatch entities only store boundaryId.
    return '';
  }

  // Export hatch boundary as polyline
  let dxf = `0
LWPOLYLINE
8
${layerName}
62
${color}
90
${entity.boundary.length}
70
1
`;

  for (const point of entity.boundary) {
    dxf += `10
${point.x}
20
${point.y}
`;
  }

  return dxf;
}

function blockInsertToDXF(entity, layerName) {
  const rotation = ((entity.rotation || 0) * 180) / Math.PI;

  return `0
INSERT
8
${layerName}
2
${entity.blockName}
10
${entity.position.x}
20
${entity.position.y}
30
0.0
41
${entity.scale || 1}
42
${entity.scale || 1}
43
${entity.scale || 1}
50
${rotation}
`;
}

// ============================================
// Color Conversion
// ============================================

/**
 * Convert hex color to AutoCAD Color Index (ACI)
 */
function colorToACI(hexColor) {
  if (!hexColor || hexColor === 'none') return 7; // White

  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Simple mapping to standard ACI colors
  if (r > 200 && g < 100 && b < 100) return 1; // Red
  if (r > 200 && g > 200 && b < 100) return 2; // Yellow
  if (r < 100 && g > 200 && b < 100) return 3; // Green
  if (r < 100 && g > 200 && b > 200) return 4; // Cyan
  if (r < 100 && g < 100 && b > 200) return 5; // Blue
  if (r > 200 && g < 100 && b > 200) return 6; // Magenta
  if (r > 200 && g > 200 && b > 200) return 7; // White
  if (r < 100 && g < 100 && b < 100) return 0; // Black (by block)
  if (r > 100 && g > 100 && b > 100) return 8; // Gray

  return 7; // Default to white
}

/**
 * Convert ACI to hex color
 */
export function aciToColor(aci) {
  const aciColors = {
    0: '#000000', // By block
    1: '#FF0000', // Red
    2: '#FFFF00', // Yellow
    3: '#00FF00', // Green
    4: '#00FFFF', // Cyan
    5: '#0000FF', // Blue
    6: '#FF00FF', // Magenta
    7: '#FFFFFF', // White
    8: '#808080', // Gray
    9: '#C0C0C0', // Light gray
  };

  return aciColors[aci] || '#000000';
}

// ============================================
// DXF Import (basic)
// ============================================

/**
 * Parse DXF file content (basic implementation)
 */
export function parseDXF(dxfContent) {
  const lines = dxfContent.split('\n').map(l => l.trim());
  const entities = [];
  let i = 0;

  // Find ENTITIES section
  while (i < lines.length && lines[i] !== 'ENTITIES') {
    i++;
  }
  i++; // Skip ENTITIES

  // Parse entities
  while (i < lines.length && lines[i] !== 'ENDSEC') {
    if (lines[i] === '0') {
      const entityType = lines[i + 1];
      const entity = parseEntity(lines, i, entityType);
      if (entity) {
        entities.push(entity);
      }
    }
    i++;
  }

  return { entities };
}

function parseEntity(lines, startIndex, entityType) {
  const data = {};
  let i = startIndex + 2;
  const vertices = [];
  let currentVertex = null;

  // Read group codes until next entity
  while (i < lines.length && lines[i] !== '0') {
    const code = parseInt(lines[i]);
    const value = lines[i + 1];

    switch (code) {
      case 8: data.layer = value; break;
      case 10:
        // For LWPOLYLINE, code 10 starts a new vertex
        if (entityType === 'LWPOLYLINE') {
          if (currentVertex) vertices.push(currentVertex);
          currentVertex = { x: parseFloat(value), y: 0, bulge: 0 };
        } else {
          data.x1 = parseFloat(value);
        }
        break;
      case 20:
        if (entityType === 'LWPOLYLINE' && currentVertex) {
          currentVertex.y = parseFloat(value);
        } else {
          data.y1 = parseFloat(value);
        }
        break;
      case 11: data.x2 = parseFloat(value); break;
      case 21: data.y2 = parseFloat(value); break;
      case 40: data.radius = parseFloat(value); break;
      case 41: data.scaleX = parseFloat(value); break;
      case 42:
        if (entityType === 'LWPOLYLINE' && currentVertex) {
          currentVertex.bulge = parseFloat(value); // Arc bulge factor
        } else {
          data.scaleY = parseFloat(value);
        }
        break;
      case 43: data.scaleZ = parseFloat(value); break;
      case 50: data.startAngle = parseFloat(value); break;
      case 51: data.endAngle = parseFloat(value); break;
      case 1: data.text = value; break;
      case 2: data.blockName = value; break; // Block name for INSERT
      case 62: data.color = parseInt(value); break;
      case 70: data.flags = parseInt(value); break;
      case 90: data.numVertices = parseInt(value); break;
    }

    i += 2;
  }

  // Finalize LWPOLYLINE vertices
  if (entityType === 'LWPOLYLINE' && currentVertex) {
    vertices.push(currentVertex);
  }

  // Convert to internal format
  switch (entityType) {
    case 'LINE':
      return {
        type: 'line',
        startPoint: { x: data.x1 || 0, y: data.y1 || 0 },
        endPoint: { x: data.x2 || 0, y: data.y2 || 0 },
        layerId: data.layer || 'layer-0',
        visible: true,
        locked: false,
        style: { strokeColor: aciToColor(data.color || 7), strokeWidth: 1 },
      };

    case 'LWPOLYLINE':
    case 'POLYLINE':
      return {
        type: 'polyline',
        points: vertices.map(v => ({ x: v.x, y: v.y })),
        closed: (data.flags & 1) === 1, // Flag 1 = closed
        layerId: data.layer || 'layer-0',
        visible: true,
        locked: false,
        style: { strokeColor: aciToColor(data.color || 7), strokeWidth: 1 },
      };

    case 'CIRCLE':
      return {
        type: 'circle',
        center: { x: data.x1 || 0, y: data.y1 || 0 },
        radius: data.radius || 1,
        layerId: data.layer || 'layer-0',
        visible: true,
        locked: false,
        style: { strokeColor: aciToColor(data.color || 7), strokeWidth: 1 },
      };

    case 'ARC':
      return {
        type: 'arc',
        center: { x: data.x1 || 0, y: data.y1 || 0 },
        radius: data.radius || 1,
        startAngle: ((data.startAngle || 0) * Math.PI) / 180,
        endAngle: ((data.endAngle || 360) * Math.PI) / 180,
        layerId: data.layer || 'layer-0',
        visible: true,
        locked: false,
        style: { strokeColor: aciToColor(data.color || 7), strokeWidth: 1 },
      };

    case 'TEXT':
    case 'MTEXT':
      return {
        type: 'text',
        position: { x: data.x1 || 0, y: data.y1 || 0 },
        content: data.text || '',
        fontSize: data.radius || 2.5,
        layerId: data.layer || 'layer-0',
        visible: true,
        locked: false,
        style: { strokeColor: aciToColor(data.color || 7) },
      };

    case 'INSERT':
      return {
        type: 'block',
        blockName: data.blockName || 'Unknown',
        position: { x: data.x1 || 0, y: data.y1 || 0 },
        scale: data.scaleX || 1,
        scaleY: data.scaleY || data.scaleX || 1,
        rotation: ((data.startAngle || 0) * Math.PI) / 180,
        layerId: data.layer || 'layer-0',
        visible: true,
        locked: false,
      };

    case 'ELLIPSE':
      // Ellipse defined by center, major axis endpoint, ratio of minor to major
      return {
        type: 'ellipse',
        center: { x: data.x1 || 0, y: data.y1 || 0 },
        majorAxisEnd: { x: data.x2 || 1, y: data.y2 || 0 },
        ratio: data.radius || 0.5, // Code 40 is ratio for ellipse
        startAngle: data.startAngle || 0,
        endAngle: data.endAngle || Math.PI * 2,
        layerId: data.layer || 'layer-0',
        visible: true,
        locked: false,
        style: { strokeColor: aciToColor(data.color || 7), strokeWidth: 1 },
      };

    case 'SPLINE':
      // Splines are complex - import as polyline for now (control points)
      return {
        type: 'polyline',
        points: vertices.map(v => ({ x: v.x, y: v.y })),
        closed: (data.flags & 1) === 1,
        layerId: data.layer || 'layer-0',
        visible: true,
        locked: false,
        style: { strokeColor: aciToColor(data.color || 7), strokeWidth: 1 },
        isSpline: true, // Mark for future spline rendering
      };

    default:
      return null;
  }
}

// ============================================
// File Download Helper
// ============================================

/**
 * Download DXF file
 */
export function downloadDXF(project, filename = 'drawing.dxf') {
  const dxfContent = exportToDXF(project);
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
