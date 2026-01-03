/**
 * PDF Export Module
 * Exports CAD drawings to PDF format for PNG Building Board submissions
 */

// Paper sizes in mm
const PAPER_SIZES = {
    'A4': { width: 210, height: 297 },
    'A3': { width: 297, height: 420 },
    'A2': { width: 420, height: 594 },
    'A1': { width: 594, height: 841 },
    'A0': { width: 841, height: 1189 },
};

/**
 * Export drawing to PDF
 * Uses browser canvas and downloads as PDF-compatible image
 * 
 * @param {Object} params - Export parameters
 * @param {Array} params.entities - CAD entities to export
 * @param {Object} params.viewport - Viewport bounds { minX, minY, maxX, maxY }
 * @param {string} params.paperSize - Paper size (A0-A4)
 * @param {string} params.orientation - 'portrait' or 'landscape'
 * @param {Object} params.titleBlock - Title block data
 * @param {string} params.filename - Output filename
 * @returns {Object} Result with success status
 */
export async function exportToPDF(params) {
    const {
        entities = [],
        viewport,
        paperSize = 'A3',
        orientation = 'landscape',
        titleBlock = {},
        filename = 'drawing.pdf',
        scale = 100,
    } = params;

    // Get paper dimensions
    const paper = PAPER_SIZES[paperSize] || PAPER_SIZES['A3'];
    const width = orientation === 'landscape' ? paper.height : paper.width;
    const height = orientation === 'landscape' ? paper.width : paper.height;

    // Create canvas
    const dpi = 150; // 150 DPI for good quality
    const pxWidth = Math.round(width * dpi / 25.4);
    const pxHeight = Math.round(height * dpi / 25.4);

    const canvas = document.createElement('canvas');
    canvas.width = pxWidth;
    canvas.height = pxHeight;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, pxWidth, pxHeight);

    // Calculate scale and offset
    const margin = 10 * dpi / 25.4; // 10mm margin
    const drawingWidth = pxWidth - 2 * margin;
    const drawingHeight = pxHeight - 2 * margin - 60 * dpi / 25.4; // Leave space for title block

    const viewportWidth = viewport ? viewport.maxX - viewport.minX : 1000;
    const viewportHeight = viewport ? viewport.maxY - viewport.minY : 1000;

    const scaleX = drawingWidth / viewportWidth;
    const scaleY = drawingHeight / viewportHeight;
    const drawScale = Math.min(scaleX, scaleY);

    const offsetX = margin + (drawingWidth - viewportWidth * drawScale) / 2;
    const offsetY = margin + (drawingHeight - viewportHeight * drawScale) / 2;

    // Transform function
    const transform = (x, y) => ({
        x: offsetX + (x - (viewport?.minX || 0)) * drawScale,
        y: pxHeight - margin - 60 * dpi / 25.4 - (y - (viewport?.minY || 0)) * drawScale,
    });

    // Render entities
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const entity of entities) {
        if (!entity.visible) continue;

        ctx.strokeStyle = entity.style?.strokeColor || '#000000';
        ctx.fillStyle = entity.style?.fillColor || 'transparent';
        ctx.lineWidth = (entity.style?.strokeWidth || 1) * drawScale * 0.5;

        switch (entity.type) {
            case 'line':
                renderLine(ctx, entity, transform);
                break;
            case 'polyline':
                renderPolyline(ctx, entity, transform);
                break;
            case 'circle':
                renderCircle(ctx, entity, transform, drawScale);
                break;
            case 'arc':
                renderArc(ctx, entity, transform, drawScale);
                break;
            case 'rectangle':
                renderRectangle(ctx, entity, transform);
                break;
            case 'text':
                renderText(ctx, entity, transform, drawScale, dpi);
                break;
        }
    }

    // Draw title block
    drawTitleBlock(ctx, titleBlock, pxWidth, pxHeight, margin, dpi);

    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, margin, pxWidth - 2 * margin, pxHeight - 2 * margin);

    // Convert to PDF using canvas-to-image-to-PDF approach
    return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
            try {
                // Try to use jsPDF if available
                if (typeof window.jspdf !== 'undefined') {
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF({
                        orientation: orientation,
                        unit: 'mm',
                        format: [width, height],
                    });
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
                    pdf.save(filename);
                    resolve({ success: true, method: 'jspdf' });
                } else {
                    // Fallback: download as high-res image
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename.replace('.pdf', '.png');
                    a.click();
                    URL.revokeObjectURL(url);
                    resolve({
                        success: true,
                        method: 'image',
                        note: 'Exported as PNG. Install jsPDF for true PDF export.',
                    });
                }
            } catch (error) {
                resolve({ success: false, error: error.message });
            }
        }, 'image/png');
    });
}

// ============================================
// Entity Renderers
// ============================================

function renderLine(ctx, entity, transform) {
    const start = transform(entity.startPoint.x, entity.startPoint.y);
    const end = transform(entity.endPoint.x, entity.endPoint.y);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

function renderPolyline(ctx, entity, transform) {
    if (!entity.points || entity.points.length < 2) return;

    ctx.beginPath();
    const first = transform(entity.points[0].x, entity.points[0].y);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < entity.points.length; i++) {
        const pt = transform(entity.points[i].x, entity.points[i].y);
        ctx.lineTo(pt.x, pt.y);
    }

    if (entity.closed) ctx.closePath();
    if (entity.style?.fillColor) ctx.fill();
    ctx.stroke();
}

function renderCircle(ctx, entity, transform, scale) {
    const center = transform(entity.center.x, entity.center.y);
    const radius = entity.radius * scale;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    if (entity.style?.fillColor) ctx.fill();
    ctx.stroke();
}

function renderArc(ctx, entity, transform, scale) {
    const center = transform(entity.center.x, entity.center.y);
    const radius = entity.radius * scale;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, -entity.endAngle, -entity.startAngle);
    ctx.stroke();
}

function renderRectangle(ctx, entity, transform) {
    const tl = transform(entity.topLeft.x, entity.topLeft.y);
    const br = transform(entity.topLeft.x + entity.width, entity.topLeft.y - entity.height);

    ctx.beginPath();
    ctx.rect(Math.min(tl.x, br.x), Math.min(tl.y, br.y), Math.abs(br.x - tl.x), Math.abs(br.y - tl.y));
    if (entity.style?.fillColor) ctx.fill();
    ctx.stroke();
}

function renderText(ctx, entity, transform, scale, dpi) {
    const pos = transform(entity.position.x, entity.position.y);
    const fontSize = (entity.fontSize || 12) * scale * 0.4;

    ctx.font = `${entity.style?.fontWeight || 'normal'} ${fontSize}px Arial`;
    ctx.fillStyle = entity.style?.strokeColor || '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    if (entity.rotation) {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(-entity.rotation);
        ctx.fillText(entity.content, 0, 0);
        ctx.restore();
    } else {
        ctx.fillText(entity.content, pos.x, pos.y);
    }
}

// ============================================
// Title Block
// ============================================

function drawTitleBlock(ctx, titleBlock, pxWidth, pxHeight, margin, dpi) {
    const blockHeight = 50 * dpi / 25.4;
    const blockY = pxHeight - margin - blockHeight;
    const blockWidth = pxWidth - 2 * margin;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(margin, blockY, blockWidth, blockHeight);

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, blockY, blockWidth, blockHeight);

    // Divider lines
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, blockY + 15 * dpi / 25.4);
    ctx.lineTo(margin + blockWidth, blockY + 15 * dpi / 25.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(margin + blockWidth * 0.6, blockY);
    ctx.lineTo(margin + blockWidth * 0.6, blockY + blockHeight);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${14 * dpi / 72}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const textX = margin + 10 * dpi / 25.4;
    const textY = blockY + 5 * dpi / 25.4;

    // Project title
    ctx.font = `bold ${16 * dpi / 72}px Arial`;
    ctx.fillText(titleBlock.projectTitle || 'UNTITLED PROJECT', textX, textY);

    // Drawing title
    ctx.font = `bold ${12 * dpi / 72}px Arial`;
    ctx.fillText(titleBlock.drawingTitle || 'DRAWING', textX, blockY + 20 * dpi / 25.4);

    // Right side - parameters
    const rightX = margin + blockWidth * 0.62;
    ctx.font = `${10 * dpi / 72}px Arial`;

    const params = [
        `Scale: ${titleBlock.scale || '1:100'}`,
        `Drawing No: ${titleBlock.drawingNumber || 'A-001'}`,
        `Date: ${titleBlock.date || new Date().toLocaleDateString()}`,
    ];

    params.forEach((text, i) => {
        ctx.fillText(text, rightX, blockY + (5 + i * 12) * dpi / 25.4);
    });

    // PNG Civil CAD branding
    ctx.font = `bold ${8 * dpi / 72}px Arial`;
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.fillText('PNG Civil CAD', margin + blockWidth - 5 * dpi / 25.4, blockY + blockHeight - 5 * dpi / 25.4);
}

/**
 * Generate print preview
 */
export function generatePrintPreview(params) {
    // Returns a data URL for preview
    return exportToPDF({ ...params, preview: true });
}

/**
 * Get available paper sizes
 */
export function getPaperSizes() {
    return Object.entries(PAPER_SIZES).map(([name, dims]) => ({
        name,
        width: dims.width,
        height: dims.height,
        label: `${name} (${dims.width}×${dims.height}mm)`,
    }));
}

export { PAPER_SIZES };
