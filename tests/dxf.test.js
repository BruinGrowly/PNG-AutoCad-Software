/**
 * DXF Export/Import Tests
 * Tests for AutoCAD DXF file format support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportToDXF,
  parseDXF,
  aciToColor,
} from '../src/core/dxf.js';

describe('DXF Export', () => {
  let mockProject;

  beforeEach(() => {
    mockProject = {
      id: 'test-project',
      name: 'Test Project',
      metadata: {
        description: 'Test description',
        units: 'mm',
      },
      layers: [
        { id: 'layer-0', name: '0', color: '#FFFFFF', visible: true, locked: false, lineType: 'continuous' },
        { id: 'layer-1', name: 'Walls', color: '#FF0000', visible: true, locked: false, lineType: 'continuous' },
      ],
      entities: [],
    };
  });

  describe('exportToDXF', () => {
    it('generates valid DXF structure', () => {
      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('0\nSECTION');
      expect(dxf).toContain('HEADER');
      expect(dxf).toContain('TABLES');
      expect(dxf).toContain('ENTITIES');
      expect(dxf).toContain('0\nEOF');
    });

    it('includes layer definitions', () => {
      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('LAYER');
      expect(dxf).toContain('Walls');
    });

    it('exports line entities', () => {
      mockProject.entities = [
        {
          type: 'line',
          layerId: 'layer-0',
          visible: true,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 100, y: 100 },
        },
      ];

      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('LINE');
    });

    it('exports circle entities', () => {
      mockProject.entities = [
        {
          type: 'circle',
          layerId: 'layer-0',
          visible: true,
          center: { x: 50, y: 50 },
          radius: 25,
        },
      ];

      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('CIRCLE');
    });

    it('exports arc entities', () => {
      mockProject.entities = [
        {
          type: 'arc',
          layerId: 'layer-0',
          visible: true,
          center: { x: 50, y: 50 },
          radius: 25,
          startAngle: 0,
          endAngle: Math.PI / 2,
        },
      ];

      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('ARC');
    });

    it('exports text entities', () => {
      mockProject.entities = [
        {
          type: 'text',
          layerId: 'layer-0',
          visible: true,
          position: { x: 100, y: 100 },
          content: 'Test Label',
          fontSize: 10,
        },
      ];

      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('TEXT');
      expect(dxf).toContain('Test Label');
    });

    it('exports polyline entities', () => {
      mockProject.entities = [
        {
          type: 'polyline',
          layerId: 'layer-0',
          visible: true,
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
          ],
          closed: false,
        },
      ];

      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('LWPOLYLINE');
    });

    it('exports rectangle as polyline', () => {
      mockProject.entities = [
        {
          type: 'rectangle',
          layerId: 'layer-0',
          visible: true,
          topLeft: { x: 0, y: 0 },
          width: 100,
          height: 50,
        },
      ];

      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('LWPOLYLINE');
    });

    it('exports dimension entities', () => {
      mockProject.entities = [
        {
          type: 'dimension',
          dimensionType: 'linear',
          layerId: 'layer-0',
          visible: true,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 100, y: 0 },
          dimLineStart: { x: 0, y: 10 },
          dimLineEnd: { x: 100, y: 10 },
          extLine1Start: { x: 0, y: 0 },
          extLine1End: { x: 0, y: 10 },
          extLine2Start: { x: 100, y: 0 },
          extLine2End: { x: 100, y: 10 },
          textPosition: { x: 50, y: 10 },
          displayText: '100.00',
          measuredValue: 100,
        },
      ];

      const dxf = exportToDXF(mockProject);

      // Dimensions are exported as lines and text
      expect(dxf).toContain('LINE');
      expect(dxf).toContain('TEXT');
    });

    it('skips invisible entities', () => {
      mockProject.entities = [
        {
          type: 'line',
          layerId: 'layer-0',
          visible: false,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 100, y: 100 },
        },
      ];

      const dxf = exportToDXF(mockProject);

      expect(dxf).not.toContain('\nLINE\n');
    });

    it('handles empty project', () => {
      mockProject.entities = [];
      mockProject.layers = [];

      const dxf = exportToDXF(mockProject);

      expect(dxf).toContain('0\nEOF');
    });
  });
});

describe('DXF Import', () => {
  describe('parseDXF', () => {
    it('parses minimal DXF file', () => {
      const dxfContent = `0
SECTION
2
ENTITIES
0
ENDSEC
0
EOF
`;
      const result = parseDXF(dxfContent);

      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
    });

    it('parses line entity', () => {
      const dxfContent = `0
SECTION
2
ENTITIES
0
LINE
8
0
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF
`;
      const result = parseDXF(dxfContent);

      expect(result.entities.length).toBe(1);
      expect(result.entities[0].type).toBe('line');
      expect(result.entities[0].startPoint).toEqual({ x: 0, y: 0 });
      expect(result.entities[0].endPoint).toEqual({ x: 100, y: 100 });
    });

    it('parses circle entity', () => {
      const dxfContent = `0
SECTION
2
ENTITIES
0
CIRCLE
8
0
10
50
20
50
40
25
0
ENDSEC
0
EOF
`;
      const result = parseDXF(dxfContent);

      expect(result.entities.length).toBe(1);
      expect(result.entities[0].type).toBe('circle');
      expect(result.entities[0].center).toEqual({ x: 50, y: 50 });
      expect(result.entities[0].radius).toBe(25);
    });

    it('parses arc entity', () => {
      const dxfContent = `0
SECTION
2
ENTITIES
0
ARC
8
0
10
50
20
50
40
25
50
0
51
90
0
ENDSEC
0
EOF
`;
      const result = parseDXF(dxfContent);

      expect(result.entities.length).toBe(1);
      expect(result.entities[0].type).toBe('arc');
      // Angles are converted to radians
      expect(result.entities[0].startAngle).toBeCloseTo(0);
      expect(result.entities[0].endAngle).toBeCloseTo(Math.PI / 2, 5);
    });

    it('parses text entity', () => {
      const dxfContent = `0
SECTION
2
ENTITIES
0
TEXT
8
0
10
100
20
200
40
10
1
Hello World
0
ENDSEC
0
EOF
`;
      const result = parseDXF(dxfContent);

      expect(result.entities.length).toBe(1);
      expect(result.entities[0].type).toBe('text');
      expect(result.entities[0].content).toBe('Hello World');
      expect(result.entities[0].position).toEqual({ x: 100, y: 200 });
    });

    it('handles empty DXF', () => {
      const dxfContent = `0
EOF
`;
      const result = parseDXF(dxfContent);

      expect(result.entities).toEqual([]);
    });

    it('preserves layer assignment', () => {
      const dxfContent = `0
SECTION
2
ENTITIES
0
LINE
8
Walls
10
0
20
0
11
100
21
0
0
ENDSEC
0
EOF
`;
      const result = parseDXF(dxfContent);

      expect(result.entities[0].layerId).toBe('Walls');
    });
  });
});

describe('Color Conversion', () => {
  describe('aciToColor', () => {
    it('converts standard AutoCAD colors', () => {
      expect(aciToColor(1)).toBe('#FF0000'); // Red
      expect(aciToColor(2)).toBe('#FFFF00'); // Yellow
      expect(aciToColor(3)).toBe('#00FF00'); // Green
      expect(aciToColor(4)).toBe('#00FFFF'); // Cyan
      expect(aciToColor(5)).toBe('#0000FF'); // Blue
      expect(aciToColor(6)).toBe('#FF00FF'); // Magenta
      expect(aciToColor(7)).toBe('#FFFFFF'); // White
    });

    it('returns black for unknown colors', () => {
      expect(aciToColor(999)).toBe('#000000');
    });
  });
});
