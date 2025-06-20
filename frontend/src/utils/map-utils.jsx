// Function to calculate midpoint of GeoJSON polygon or multipolygon
export const calculateMidpoint = (feature) => {
    if (!feature || !feature.geometry) {
        return null;
    }

    const geometry = feature.geometry;
    let allCoordinates = [];

    if (geometry.type === 'Polygon') {
        allCoordinates = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(polygon => {
            allCoordinates.push(...polygon[0]);
        });
    } else {
        return null;
    }

    if (allCoordinates.length === 0) {
        return null;
    }

    let sumLat = 0;
    let sumLng = 0;

    for (const coord of allCoordinates) {
        sumLng += coord[0];
        sumLat += coord[1];
    }

    const count = allCoordinates.length;
    return count > 0 ? [sumLng / count, sumLat / count] : null;
};