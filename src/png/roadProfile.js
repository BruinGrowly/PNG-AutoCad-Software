/**
 * Road Profile Module
 * Vertical profile and earthworks calculations
 */

// ============================================
// Vertical Profile
// ============================================

/**
 * Calculate vertical profile from stations
 * @param {Array} stations - Station data with ground levels
 * @param {Object} standards - Road standards
 * @returns {Object} Profile data
 */
export function calculateVerticalProfile(stations, standards) {
    const profile = {
        stations: [],
        maxGrade: 0,
        totalRise: 0,
        totalFall: 0,
    };

    for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        let designLevel = station.groundLevel;
        let grade = 0;

        if (i > 0) {
            const prev = stations[i - 1];
            const dChainage = station.chainage - prev.chainage;
            const dElevation = station.groundLevel - prev.groundLevel;
            grade = (dElevation / dChainage) * 100;

            // Limit grade to maximum allowed
            if (Math.abs(grade) > standards.maxGrade) {
                const limitedGrade = Math.sign(grade) * standards.maxGrade;
                designLevel = profile.stations[i - 1].designLevel + (limitedGrade / 100) * dChainage;
                grade = limitedGrade;
            }

            profile.maxGrade = Math.max(profile.maxGrade, Math.abs(grade));
            if (dElevation > 0) profile.totalRise += dElevation;
            else profile.totalFall += Math.abs(dElevation);
        }

        profile.stations.push({
            chainage: station.chainage,
            point: station.point,
            groundLevel: station.groundLevel,
            designLevel,
            grade,
            cutFill: designLevel - station.groundLevel,
        });
    }

    return profile;
}

// ============================================
// Earthworks
// ============================================

/**
 * Calculate earthworks volumes
 * @param {Object} profile - Vertical profile data
 * @param {Object} standards - Road standards
 * @param {number} batterSlope - Batter slope ratio
 * @returns {Object} Earthworks data
 */
export function calculateEarthworks(profile, standards, batterSlope) {
    const stationEarthworks = [];
    let totalCut = 0;
    let totalFill = 0;

    const totalWidth = standards.carriagewayWidth + 2 * standards.shoulderWidth;

    for (let i = 0; i < profile.stations.length; i++) {
        const station = profile.stations[i];
        const cutFillHeight = station.cutFill;

        let cutArea = 0;
        let fillArea = 0;

        if (cutFillHeight < 0) {
            const cutHeight = Math.abs(cutFillHeight);
            const topWidth = totalWidth + 2 * batterSlope * cutHeight;
            cutArea = (totalWidth + topWidth) / 2 * cutHeight;
        } else if (cutFillHeight > 0) {
            const fillHeight = cutFillHeight;
            const bottomWidth = totalWidth + 2 * batterSlope * fillHeight;
            fillArea = (totalWidth + bottomWidth) / 2 * fillHeight;
        }

        let cutVolume = 0;
        let fillVolume = 0;

        if (i > 0) {
            const prevStation = stationEarthworks[i - 1];
            const distance = station.chainage - profile.stations[i - 1].chainage;

            cutVolume = (cutArea + prevStation.cutArea) / 2 * distance;
            fillVolume = (fillArea + prevStation.fillArea) / 2 * distance;

            totalCut += cutVolume;
            totalFill += fillVolume;
        }

        stationEarthworks.push({
            chainage: station.chainage,
            groundLevel: station.groundLevel,
            designLevel: station.designLevel,
            cutFillHeight,
            cutArea,
            fillArea,
            cutVolume,
            fillVolume,
            cumulativeCut: totalCut,
            cumulativeFill: totalFill,
        });
    }

    return {
        stations: stationEarthworks,
        totalCut,
        totalFill,
        netVolume: totalFill - totalCut,
        balancePoint: findBalancePoint(stationEarthworks),
    };
}

/**
 * Find mass haul balance point
 */
function findBalancePoint(stationEarthworks) {
    for (let i = 1; i < stationEarthworks.length; i++) {
        const prev = stationEarthworks[i - 1];
        const curr = stationEarthworks[i];

        if ((prev.cumulativeFill - prev.cumulativeCut) * (curr.cumulativeFill - curr.cumulativeCut) < 0) {
            return curr.chainage;
        }
    }
    return null;
}

/**
 * Generate mass haul diagram data
 */
export function generateMassHaulDiagram(earthworks) {
    return earthworks.stations.map(s => ({
        chainage: s.chainage,
        cumulativeMass: s.cumulativeFill - s.cumulativeCut,
    }));
}
