const toRadians = (deg) => deg * (Math.PI / 180);

function calculateAngle(p1, p2, p3) {
  const v1 = {
    x: p2.lat - p1.lat,
    y: p2.lng - p1.lng
  };

  const v2 = {
    x: p3.lat - p1.lat,
    y: p3.lng - p1.lng
  };

  const dot = v1.x * v2.x + v1.y * v2.y;

  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

  const angle = Math.acos(dot / (mag1 * mag2));
  return angle * (180 / Math.PI);
}
function generateMapLink(origin, destination, waypoints = []) {
    const base = "https://www.google.com/maps/dir/?api=1";
  
    if (!waypoints.length) {
      return `${base}&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
    }
  
    const wp = waypoints.map(p => `${p.lat},${p.lng}`).join("|");
  
    return `${base}&origin=${origin.lat},${origin.lng}` +
           `&destination=${destination.lat},${destination.lng}` +
           `&waypoints=${wp}`;
  }
  
module.exports = { calculateAngle, generateMapLink };