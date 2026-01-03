/**
 * Result Utility - Standardized Error Handling
 * 
 * Provides consistent Success/Failure return pattern across the codebase
 * Following the LJPW principle of Justice (consistency, balance)
 */

// ============================================
// Result Types
// ============================================

/**
 * Create a success result
 * @template T
 * @param {T} data - The successful result data
 * @param {string} [message] - Optional success message
 * @returns {{ success: true, data: T, message?: string }}
 */
export function success(data, message) {
    return {
        success: true,
        data,
        ...(message && { message }),
    };
}

/**
 * Create a failure result
 * @param {string} code - Error code (e.g., 'ERR_UNKNOWN_PROVINCE')
 * @param {string} message - Human-readable error message
 * @param {Object} [details] - Additional error details
 * @returns {{ success: false, error: { code: string, message: string, details?: Object }}}
 */
export function failure(code, message, details) {
    return {
        success: false,
        error: {
            code,
            message,
            ...(details && { details }),
        },
    };
}

/**
 * Check if a result is successful
 * @param {Object} result - Result object
 * @returns {boolean}
 */
export function isSuccess(result) {
    return result && result.success === true;
}

/**
 * Check if a result is a failure
 * @param {Object} result - Result object
 * @returns {boolean}
 */
export function isFailure(result) {
    return result && result.success === false;
}

/**
 * Unwrap a result or throw if failure
 * @template T
 * @param {{ success: boolean, data?: T, error?: Object }} result
 * @returns {T}
 * @throws {Error} If result is a failure
 */
export function unwrap(result) {
    if (isSuccess(result)) {
        return result.data;
    }
    throw new Error(result.error?.message || 'Unknown error');
}

/**
 * Unwrap a result or return default value
 * @template T
 * @param {{ success: boolean, data?: T }} result
 * @param {T} defaultValue
 * @returns {T}
 */
export function unwrapOr(result, defaultValue) {
    return isSuccess(result) ? result.data : defaultValue;
}

/**
 * Map over a successful result
 * @template T, U
 * @param {{ success: boolean, data?: T }} result
 * @param {function(T): U} fn
 * @returns {{ success: boolean, data?: U, error?: Object }}
 */
export function map(result, fn) {
    if (isSuccess(result)) {
        return success(fn(result.data));
    }
    return result;
}

/**
 * Chain results (flatMap)
 * @template T, U
 * @param {{ success: boolean, data?: T }} result
 * @param {function(T): { success: boolean, data?: U }} fn
 * @returns {{ success: boolean, data?: U, error?: Object }}
 */
export function chain(result, fn) {
    if (isSuccess(result)) {
        return fn(result.data);
    }
    return result;
}

// ============================================
// Error Codes
// ============================================

export const ErrorCodes = {
    // General
    UNKNOWN_ERROR: 'ERR_UNKNOWN',
    INVALID_INPUT: 'ERR_INVALID_INPUT',
    NOT_FOUND: 'ERR_NOT_FOUND',

    // Province
    UNKNOWN_PROVINCE: 'ERR_UNKNOWN_PROVINCE',

    // Terrain
    UNKNOWN_REGION: 'ERR_UNKNOWN_REGION',
    INVALID_RETURN_PERIOD: 'ERR_INVALID_RETURN_PERIOD',

    // Structural
    UNKNOWN_MATERIAL_GRADE: 'ERR_UNKNOWN_MATERIAL_GRADE',
    UNKNOWN_SOIL_TYPE: 'ERR_UNKNOWN_SOIL_TYPE',

    // Design
    INVALID_DIMENSIONS: 'ERR_INVALID_DIMENSIONS',
    CAPACITY_EXCEEDED: 'ERR_CAPACITY_EXCEEDED',

    // File
    INVALID_FILE: 'ERR_INVALID_FILE',
    PARSE_ERROR: 'ERR_PARSE_ERROR',

    // Entity
    ENTITY_NOT_FOUND: 'ERR_ENTITY_NOT_FOUND',
    INVALID_ENTITY_TYPE: 'ERR_INVALID_ENTITY_TYPE',
};

// ============================================
// Helper for converting legacy functions
// ============================================

/**
 * Wrap a function that may throw to return a Result instead
 * @template T
 * @param {function(): T} fn
 * @param {string} [errorCode] - Error code to use if function throws
 * @returns {{ success: boolean, data?: T, error?: Object }}
 */
export function tryCatch(fn, errorCode = ErrorCodes.UNKNOWN_ERROR) {
    try {
        const result = fn();
        return success(result);
    } catch (err) {
        return failure(errorCode, err.message, { originalError: err });
    }
}

/**
 * Wrap an async function that may throw to return a Result instead
 * @template T
 * @param {function(): Promise<T>} fn
 * @param {string} [errorCode] - Error code to use if function throws
 * @returns {Promise<{ success: boolean, data?: T, error?: Object }>}
 */
export async function tryCatchAsync(fn, errorCode = ErrorCodes.UNKNOWN_ERROR) {
    try {
        const result = await fn();
        return success(result);
    } catch (err) {
        return failure(errorCode, err.message, { originalError: err });
    }
}
