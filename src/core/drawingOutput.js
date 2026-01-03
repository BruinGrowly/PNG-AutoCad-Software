/**
 * PNG Drawing Output Module
 * Title blocks, scale bars, and approval-ready output
 * 
 * Designed for PNG Building Board submission requirements
 */

import { generateId } from '../core/engine.js';

// ============================================
// Title Block Templates
// ============================================

/**
 * Standard PNG Building Board title block
 * Conforms to PNG Building Board submission requirements
 */
export function createPNGTitleBlock(params, options = {}) {
    const {
        projectTitle = 'UNTITLED PROJECT',
        projectNumber = '',
        clientName = '',
        location = '',
        province = '',
        llg = '', // Local Level Government
        ward = '',

        // Drawing info
        drawingTitle = 'DRAWING',
        drawingNumber = 'A-001',
        revision = '0',
        scale = '1:100',

        // Dates
        drawnDate = new Date().toLocaleDateString('en-AU'),
        checkedDate = '',
        approvedDate = '',

        // Personnel
        drawnBy = '',
        checkedBy = '',
        approvedBy = '',

        // Design parameters (optional)
        designParameters = null,
    } = params;

    const {
        origin = { x: 0, y: 0 },
        width = 180,
        height = 60,
        layerId = 'layer-0',
    } = options;

    const entities = [];
    const x = origin.x;
    const y = origin.y;

    // Main border
    entities.push({
        id: generateId(),
        type: 'rectangle',
        topLeft: { x, y },
        width,
        height,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 0.7 },
    });

    // Horizontal dividers
    const dividers = [20, 35, 45];
    for (const dy of dividers) {
        entities.push({
            id: generateId(),
            type: 'line',
            startPoint: { x, y: y + dy },
            endPoint: { x: x + width, y: y + dy },
            layerId,
            visible: true,
            locked: false,
            style: { strokeColor: '#000000', strokeWidth: 0.35 },
        });
    }

    // Vertical divider for logo area
    entities.push({
        id: generateId(),
        type: 'line',
        startPoint: { x: x + 40, y },
        endPoint: { x: x + 40, y: y + 20 },
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 0.35 },
    });

    // Text entries
    const textEntries = [
        // Company/logo area
        { text: 'PNG CIVIL CAD', x: x + 20, y: y + 12, size: 4, bold: true },
        { text: 'Civil Engineering Design', x: x + 20, y: y + 6, size: 2 },

        // Project info row
        { text: 'PROJECT:', x: x + 42, y: y + 16, size: 1.5 },
        { text: projectTitle, x: x + 60, y: y + 16, size: 2.5, bold: true },
        { text: `No: ${projectNumber}`, x: x + 160, y: y + 16, size: 1.5 },

        { text: 'CLIENT:', x: x + 42, y: y + 10, size: 1.5 },
        { text: clientName, x: x + 60, y: y + 10, size: 2 },

        { text: 'LOCATION:', x: x + 42, y: y + 5, size: 1.5 },
        { text: `${location}, ${province}`, x: x + 60, y: y + 5, size: 2 },

        // Drawing info row
        { text: 'DRAWING TITLE:', x: x + 2, y: y + 31, size: 1.5 },
        { text: drawingTitle, x: x + 2, y: y + 26, size: 3, bold: true },

        { text: `DWG No: ${drawingNumber}`, x: x + 130, y: y + 31, size: 1.8 },
        { text: `REV: ${revision}`, x: x + 165, y: y + 31, size: 1.8 },
        { text: `SCALE: ${scale}`, x: x + 130, y: y + 26, size: 1.8 },

        // Approval row
        { text: 'DRAWN:', x: x + 2, y: y + 41, size: 1.2 },
        { text: drawnBy, x: x + 20, y: y + 41, size: 1.5 },
        { text: drawnDate, x: x + 50, y: y + 41, size: 1.5 },

        { text: 'CHECKED:', x: x + 70, y: y + 41, size: 1.2 },
        { text: checkedBy, x: x + 90, y: y + 41, size: 1.5 },
        { text: checkedDate, x: x + 120, y: y + 41, size: 1.5 },

        { text: 'APPROVED:', x: x + 140, y: y + 41, size: 1.2 },
        { text: approvedBy, x: x + 160, y: y + 41, size: 1.5 },
    ];

    // Add design parameters if provided
    if (designParameters) {
        textEntries.push(
            { text: 'DESIGN PARAMETERS', x: x + 2, y: y + 55, size: 1.5, bold: true },
            { text: `Seismic Z: ${designParameters.seismic?.Z || 'N/A'}`, x: x + 2, y: y + 51, size: 1.2 },
            { text: `Wind Region: ${designParameters.wind?.region || 'N/A'}`, x: x + 40, y: y + 51, size: 1.2 },
            { text: `Soil Class: ${designParameters.location?.soilClass || 'N/A'}`, x: x + 80, y: y + 51, size: 1.2 },
        );
    }

    // Create text entities
    for (const entry of textEntries) {
        if (entry.text) {
            entities.push({
                id: generateId(),
                type: 'text',
                position: { x: entry.x, y: entry.y },
                content: entry.text,
                fontSize: entry.size,
                layerId,
                visible: true,
                locked: false,
                style: {
                    strokeColor: '#000000',
                    fontWeight: entry.bold ? 'bold' : 'normal',
                },
            });
        }
    }

    return {
        entities,
        bounds: { x, y, width, height },
    };
}

// ============================================
// Scale Bar
// ============================================

/**
 * Create a graphic scale bar
 */
export function createScaleBar(params, options = {}) {
    const {
        scale = 100, // 1:100
        length = 100, // Real-world length to show (m)
        origin = { x: 0, y: 0 },
    } = params;

    const {
        layerId = 'layer-0',
        divisions = 5,
    } = options;

    const entities = [];
    const x = origin.x;
    const y = origin.y;

    // Drawing length = real length / scale factor
    const drawingLength = length;
    const divisionLength = drawingLength / divisions;
    const barHeight = 3;

    // Bar outline
    entities.push({
        id: generateId(),
        type: 'rectangle',
        topLeft: { x, y },
        width: drawingLength,
        height: barHeight,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 0.5 },
    });

    // Alternating fills (simulated with filled rectangles)
    for (let i = 0; i < divisions; i++) {
        if (i % 2 === 0) {
            entities.push({
                id: generateId(),
                type: 'rectangle',
                topLeft: { x: x + i * divisionLength, y },
                width: divisionLength,
                height: barHeight,
                layerId,
                visible: true,
                locked: false,
                style: { strokeColor: '#000000', strokeWidth: 0.5, fillColor: '#000000' },
            });
        }
    }

    // Division ticks and labels
    for (let i = 0; i <= divisions; i++) {
        const tickX = x + i * divisionLength;
        const realValue = (i * length) / divisions;

        // Tick
        entities.push({
            id: generateId(),
            type: 'line',
            startPoint: { x: tickX, y: y - 1 },
            endPoint: { x: tickX, y: y + barHeight + 1 },
            layerId,
            visible: true,
            locked: false,
            style: { strokeColor: '#000000', strokeWidth: 0.35 },
        });

        // Label
        entities.push({
            id: generateId(),
            type: 'text',
            position: { x: tickX, y: y - 3 },
            content: `${realValue}`,
            fontSize: 2,
            layerId,
            visible: true,
            locked: false,
            style: { strokeColor: '#000000' },
        });
    }

    // Scale text
    entities.push({
        id: generateId(),
        type: 'text',
        position: { x: x + drawingLength / 2, y: y + barHeight + 3 },
        content: `SCALE 1:${scale}  (metres)`,
        fontSize: 2.5,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000' },
    });

    return { entities };
}

// ============================================
// North Arrow
// ============================================

/**
 * Create a north arrow symbol
 */
export function createNorthArrow(params = {}, options = {}) {
    const {
        origin = { x: 0, y: 0 },
        size = 15,
        rotation = 0, // True north rotation in radians
    } = params;

    const {
        layerId = 'layer-0',
    } = options;

    const entities = [];
    const x = origin.x;
    const y = origin.y;

    // Arrow points (relative to origin, before rotation)
    const arrowPoints = [
        { x: 0, y: size },           // Top (north)
        { x: size * 0.3, y: 0 },     // Right
        { x: 0, y: size * 0.3 },     // Center bottom
        { x: -size * 0.3, y: 0 },    // Left
    ];

    // Rotate and translate points
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const transformedPoints = arrowPoints.map(p => ({
        x: x + p.x * cos - p.y * sin,
        y: y + p.x * sin + p.y * cos,
    }));

    // Arrow body
    entities.push({
        id: generateId(),
        type: 'polyline',
        points: transformedPoints,
        closed: true,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 0.7 },
    });

    // Fill right half
    entities.push({
        id: generateId(),
        type: 'polyline',
        points: [
            transformedPoints[0],
            transformedPoints[1],
            transformedPoints[2],
        ],
        closed: true,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 0.35, fillColor: '#000000' },
    });

    // "N" label
    const labelDistance = size * 1.3;
    entities.push({
        id: generateId(),
        type: 'text',
        position: {
            x: x - labelDistance * sin,
            y: y + labelDistance * cos,
        },
        content: 'N',
        fontSize: 4,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', fontWeight: 'bold' },
    });

    return { entities };
}

// ============================================
// Drawing Sheet Templates
// ============================================

/**
 * Create a complete drawing sheet with border, title block, and annotations
 */
export function createDrawingSheet(params, options = {}) {
    const {
        paperSize = 'A3',
        orientation = 'landscape',
        titleBlockParams = {},
        scale = 100,
        showScaleBar = true,
        showNorthArrow = true,
    } = params;

    const {
        layerId = 'layer-0',
    } = options;

    // Paper sizes in mm
    const paperSizes = {
        'A4': { width: 297, height: 210 },
        'A3': { width: 420, height: 297 },
        'A2': { width: 594, height: 420 },
        'A1': { width: 841, height: 594 },
        'A0': { width: 1189, height: 841 },
    };

    const paper = paperSizes[paperSize] || paperSizes['A3'];
    const width = orientation === 'landscape' ? paper.width : paper.height;
    const height = orientation === 'landscape' ? paper.height : paper.width;

    const entities = [];

    // Sheet border (10mm margin)
    const margin = 10;
    entities.push({
        id: generateId(),
        type: 'rectangle',
        topLeft: { x: margin, y: margin },
        width: width - 2 * margin,
        height: height - 2 * margin,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 0.7 },
    });

    // Title block (bottom right)
    const titleBlock = createPNGTitleBlock(titleBlockParams, {
        origin: { x: width - 190, y: margin + 5 },
        layerId,
    });
    entities.push(...titleBlock.entities);

    // Scale bar (bottom left)
    if (showScaleBar) {
        const scaleBar = createScaleBar({
            scale,
            length: 50,
            origin: { x: margin + 10, y: margin + 10 },
        }, { layerId });
        entities.push(...scaleBar.entities);
    }

    // North arrow (top left)
    if (showNorthArrow) {
        const northArrow = createNorthArrow({
            origin: { x: margin + 30, y: height - margin - 30 },
            size: 15,
        }, { layerId });
        entities.push(...northArrow.entities);
    }

    return {
        entities,
        drawingArea: {
            x: margin + 10,
            y: margin + 70,
            width: width - 2 * margin - 20,
            height: height - 2 * margin - 80,
        },
        paperSize: { width, height },
    };
}

// ============================================
// PNG Approval Checklist
// ============================================

/**
 * Generate checklist for PNG Building Board submission
 */
export function generateApprovalChecklist(projectType = 'building') {
    const commonItems = [
        { item: 'Site plan showing boundaries and setbacks', required: true },
        { item: 'Floor plans with dimensions', required: true },
        { item: 'Elevations (all sides)', required: true },
        { item: 'Section drawings', required: true },
        { item: 'Title block with design parameters', required: true },
        { item: 'Engineer\'s signature and registration', required: true },
        { item: 'Owner consent form', required: true },
        { item: 'Land title or lease documentation', required: true },
    ];

    const buildingSpecific = [
        { item: 'Structural calculations', required: true },
        { item: 'Foundation design details', required: true },
        { item: 'Seismic design verification (Z value shown)', required: true },
        { item: 'Wind design verification', required: true },
    ];

    const civilSpecific = [
        { item: 'Drainage calculations', required: true },
        { item: 'Road alignment and profiles', required: true },
        { item: 'Earthworks quantities', required: true },
        { item: 'Structural details for culverts/bridges', required: true },
    ];

    if (projectType === 'building') {
        return [...commonItems, ...buildingSpecific];
    } else if (projectType === 'civil') {
        return [...commonItems, ...civilSpecific];
    }

    return commonItems;
}

// ============================================
// Exports
// ============================================

export const PAPER_SIZES = {
    'A4': { width: 297, height: 210 },
    'A3': { width: 420, height: 297 },
    'A2': { width: 594, height: 420 },
    'A1': { width: 841, height: 594 },
    'A0': { width: 1189, height: 841 },
};
