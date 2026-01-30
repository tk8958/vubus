const db = firebase.database();

/* ================= STOP ================= */

function addStop() {
    const name = sname.value.trim();
    const lat = parseFloat(slat.value);
    const lng = parseFloat(slng.value);

    if (!name || isNaN(lat) || isNaN(lng)) {
        alert("Invalid Stop Data");
        return;
    }

    db.ref("stops/" + name).set({ lat, lng });
}

db.ref("stops").on("value", snap => {
    stopList.innerHTML = "<b>Stops</b>";
    snap.forEach(s => {
        stopList.innerHTML += `
          <div class="row">
            <span>${s.key} (${s.val().lat}, ${s.val().lng})</span>
            <button onclick="deleteStop('${s.key}')">Delete</button>
          </div>`;
    });
});

function deleteStop(name) {
    if (confirm("Delete Stop?"))
        db.ref("stops/" + name).remove();
}

/* ================= BUS ================= */

function addBus() {
    const num = bnum.value.trim();
    const route = rname.value.trim();
    const stops = bstops.value.split(",").map(s => s.trim());

    if (!num || !route || stops.length === 0) {
        alert("Invalid Bus Data");
        return;
    }

    db.ref("buses/" + num).set({ routeName: route, stops });
}

db.ref("buses").on("value", snap => {
    busList.innerHTML = "<b>Buses</b>";
    snap.forEach(b => {
        busList.innerHTML += `
          <div class="row">
            <span>${b.key} - ${b.val().routeName}</span>
            <button onclick="deleteBus('${b.key}')">Delete</button>
          </div>`;
    });
});

function deleteBus(bus) {
    if (confirm("Delete Bus?"))
        db.ref("buses/" + bus).remove();
}

/* ================= DRIVER ================= */

function addDriver() {
    const id = did.value.trim();
    const name = dname.value.trim();
    const bus = dbus.value.trim();

    if (!id || !name || !bus) {
        alert("Invalid Driver Data");
        return;
    }

    db.ref("drivers/" + id).set({
        name,
        busNumber: bus,
        latitude: 0,
        longitude: 0,
        status: "OFFLINE",
        lastUpdated: Date.now()
    });
}

db.ref("drivers").on("value", snap => {
    driverList.innerHTML = "<b>Drivers</b>";
    snap.forEach(d => {
        driverList.innerHTML += `
          <div class="row">
            <span>${d.key} - ${d.val().name} (${d.val().status})</span>
            <button onclick="deleteDriver('${d.key}')">Delete</button>
          </div>`;
    });
});

function deleteDriver(id) {
    if (confirm("Delete Driver?"))
        db.ref("drivers/" + id).remove();
}

/* ================= LOGOUT ================= */

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.replace("admin-login.html");
    });
}



function toggleBox(id, btn) {
  const box = document.getElementById(id);
  if (!box) return;

  if (box.style.display === "none") {
    box.style.display = "block";
    btn.innerText = "Hide";
  } else {
    box.style.display = "none";
    btn.innerText = "Show";
  }
}


