const busImg = new Image();
busImg.src = "images/bus2.png";   // correct path


// ================= SAFE TEXT =================
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}

// ================= CANVAS =================
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(height = 600) {
  canvas.width = canvas.clientWidth;
  canvas.height = height;
}

// ================= DISTANCE =================
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ================= DRAW ROUTE =================
function drawRoute(stops, stopLocations) {

  const SCALE = 35;
  const MIN_GAP = 40;
  const MAX_GAP = 120;

  let gaps = [0];
  let totalHeight = 120;

  for (let i = 0; i < stops.length - 1; i++) {
    const A = stopLocations[stops[i]];
    const B = stopLocations[stops[i + 1]];

    let km = getDistanceKm(A.lat, A.lng, B.lat, B.lng);
    let gap = Math.log(km + 1) * SCALE;
    gap = Math.min(Math.max(gap, MIN_GAP), MAX_GAP);

    gaps.push(gap);
    totalHeight += gap;
  }

  resizeCanvas(totalHeight + 100);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const x = canvas.width / 2;
  let y = 60;

  ctx.strokeStyle = "#ff4500";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);

  const stopY = [];

  stops.forEach((_, i) => {
    stopY.push(y);
    if (i > 0) ctx.lineTo(x, y);
    y += gaps[i + 1] || 0;
  });

  ctx.stroke();

  // 🔵 SMALL BLUE DOTS
  stops.forEach((stop, i) => {
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(x, stopY[i], 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "13px Arial";
    ctx.fillText(stop, x + 14, stopY[i] + 4);
  });

  return { stopY, x };
}

// ================= SEARCH BUS =================
document.getElementById("searchBtn").onclick = async () => {

  const busNumber = busNumberInput.value.trim();
  if (!busNumber) return alert("Enter bus number");

  const busSnap = await db.ref("buses/" + busNumber).get();
  if (!busSnap.exists()) return alert("Bus not found");

  const stops = busSnap.val().stops;
  const stopLocations = {};

  for (let s of stops) {
    const snap = await db.ref("stops/" + s).get();
    if (snap.exists()) stopLocations[s] = snap.val();
  }

  let routeInfo = drawRoute(stops, stopLocations);

  db.ref("drivers").on("value", snap => {

    // ✅ FIX: CLEAR + REDRAW EVERY TIME
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    routeInfo = drawRoute(stops, stopLocations);

    snap.forEach(driverSnap => {
      const d = driverSnap.val();
      if (d.busNumber !== busNumber) return;

      let seg = 0, min = Infinity;

      for (let i = 0; i < stops.length - 1; i++) {
        const A = stopLocations[stops[i]];
        const B = stopLocations[stops[i + 1]];

        const midLat = (A.lat + B.lat) / 2;
        const midLng = (A.lng + B.lng) / 2;

        const dist = getDistanceKm(d.latitude, d.longitude, midLat, midLng);
        if (dist < min) {
          min = dist;
          seg = i;
        }
      }

      const from = stopLocations[stops[seg]];
      const to = stopLocations[stops[seg + 1]];

      const total = getDistanceKm(from.lat, from.lng, to.lat, to.lng);
      const covered = getDistanceKm(from.lat, from.lng, d.latitude, d.longitude);
      const ratio = Math.min(Math.max(covered / total, 0), 1);

      const y =
        routeInfo.stopY[seg] +
        (routeInfo.stopY[seg + 1] - routeInfo.stopY[seg]) * ratio;

      // 🚌 DRAW BUS IMAGE
const size = 15;
ctx.drawImage(
  busImg,
  routeInfo.x - size / 2,
  y - size / 2,
  size,
  size
);



      setText("driverName", d.name);
      setText("time", new Date(d.lastUpdated).toLocaleTimeString());
    });
  });
};

