// Function to calculate midpoint of GeoJSON polygon
export  const calculateMidpoint = (feature) => {
if (!feature || !feature.geometry || feature.geometry.type !== 'Polygon') {
    return null;
}

const coordinates = feature.geometry.coordinates[0]; // First ring of polygon
let sumLat = 0;
let sumLng = 0;
let count = 0;

for (const coord of coordinates) {
    sumLng += coord[0];
    sumLat += coord[1];
    count++;
}

return count > 0 ? [sumLng / count, sumLat / count] : null;
};