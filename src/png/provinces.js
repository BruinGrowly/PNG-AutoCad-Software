/**
 * PNG Province Utilities
 * Provides province normalization and lookup helpers for all PNG modules
 */

// ============================================
// Province Names (Authoritative List)
// ============================================

export const PNG_PROVINCES = [
    'Central',
    'East New Britain',
    'East Sepik',
    'Eastern Highlands',
    'Enga',
    'Gulf',
    'Hela',
    'Jiwaka',
    'Madang',
    'Manus',
    'Milne Bay',
    'Morobe',
    'National Capital District',
    'New Ireland',
    'Oro',
    'Sandaun',
    'Simbu',
    'Southern Highlands',
    'West New Britain',
    'Western',
    'Western Highlands',
    'Autonomous Region of Bougainville',
];

// Create normalized lookup map
const NORMALIZED_PROVINCE_MAP = new Map();
for (const province of PNG_PROVINCES) {
    // Map normalized name to canonical name
    NORMALIZED_PROVINCE_MAP.set(normalizeString(province), province);

    // Add common aliases
    if (province === 'National Capital District') {
        NORMALIZED_PROVINCE_MAP.set('ncd', province);
        NORMALIZED_PROVINCE_MAP.set('port moresby', province);
    }
    if (province === 'Autonomous Region of Bougainville') {
        NORMALIZED_PROVINCE_MAP.set('bougainville', province);
        NORMALIZED_PROVINCE_MAP.set('arob', province);
    }
    if (province === 'East Sepik') {
        NORMALIZED_PROVINCE_MAP.set('wewak', province);
    }
    if (province === 'Morobe') {
        NORMALIZED_PROVINCE_MAP.set('lae', province);
    }
}

// ============================================
// Normalization Functions
// ============================================

/**
 * Normalize a string for comparison (lowercase, trimmed, collapsed whitespace)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Normalize a province name to its canonical form
 * @param {string} province - Province name (any case)
 * @returns {string|null} Canonical province name or null if not found
 */
export function normalizeProvinceName(province) {
    const normalized = normalizeString(province);
    return NORMALIZED_PROVINCE_MAP.get(normalized) || null;
}

/**
 * Check if a province name is valid
 * @param {string} province - Province name to check
 * @returns {boolean} True if valid province
 */
export function isValidProvince(province) {
    return normalizeProvinceName(province) !== null;
}

/**
 * Get province or throw error with helpful message
 * @param {string} province - Province name
 * @returns {string} Canonical province name
 * @throws {Error} If province not found
 */
export function getProvinceOrThrow(province) {
    const canonical = normalizeProvinceName(province);
    if (!canonical) {
        // Find similar provinces for error message
        const suggestions = findSimilarProvinces(province);
        const suggestionText = suggestions.length > 0
            ? ` Did you mean: ${suggestions.join(', ')}?`
            : '';
        throw new Error(`Unknown province: "${province}".${suggestionText}`);
    }
    return canonical;
}

/**
 * Find provinces similar to the input (for suggestions)
 * @param {string} input - User input
 * @returns {Array<string>} Similar province names
 */
export function findSimilarProvinces(input) {
    const normalized = normalizeString(input);
    if (!normalized) return [];

    const matches = [];

    for (const province of PNG_PROVINCES) {
        const provinceLower = province.toLowerCase();

        // Partial match
        if (provinceLower.includes(normalized) || normalized.includes(provinceLower.split(' ')[0])) {
            matches.push(province);
        }
        // Word match
        else {
            const words = provinceLower.split(' ');
            const inputWords = normalized.split(' ');
            if (words.some(w => inputWords.includes(w))) {
                matches.push(province);
            }
        }
    }

    return matches.slice(0, 3); // Return top 3 suggestions
}

/**
 * Lookup helper that normalizes province before looking up in a map
 * @param {Object} dataMap - Object with province keys
 * @param {string} province - Province name (any case)
 * @returns {*} The value from the map or undefined
 */
export function lookupByProvince(dataMap, province) {
    const canonical = normalizeProvinceName(province);
    if (!canonical) return undefined;
    return dataMap[canonical];
}
