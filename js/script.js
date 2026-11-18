// SIMTELE-WEB | JavaScript externo
// Los datos y umbrales son simulados para fines académicos.

const STORAGE_KEY = "simteleWebDatos";

// Arreglos: uno de objetos para mantenimiento y otro para sensores.
let maintenanceRecords = JSON.parse(localStorage.getItem(STORAGE_KEY + "_maintenance")) || [];
let sensorRecords = JSON.parse(localStorage.getItem(STORAGE_KEY + "_sensors")) || [];
let lastDistance = null;
let lastWindAverage = null;

// Función auxiliar: muestra mensajes claros al usuario.
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = "form-message " + type;
}

// Función auxiliar: conserva los registros en el navegador (mejora opcional).
function saveRecords() {
  localStorage.setItem(STORAGE_KEY + "_maintenance", JSON.stringify(maintenanceRecords));
  localStorage.setItem(STORAGE_KEY + "_sensors", JSON.stringify(sensorRecords));
}

// MÓDULO 1: DETENCIÓN DE EMERGENCIA
function calculateReactionDistance(speed, reactionTime) {
  return (speed / 3.6) * reactionTime;
}

document.getElementById("emergencyForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Evita que el formulario recargue la página.

  const speed = parseFloat(document.getElementById("speed").value);
  const reactionTime = parseFloat(document.getElementById("reactionTime").value);

  if (!Number.isFinite(speed) || !Number.isFinite(reactionTime)) {
    showMessage("emergencyMessage", "Error: introduce valores numéricos en ambos campos.", "error");
    return;
  }
  if (speed <= 0 || speed > 120 || reactionTime <= 0 || reactionTime > 30) {
    showMessage("emergencyMessage", "Revisa los rangos: velocidad 0–120 km/h y reacción 0–30 s (sin incluir cero).", "error");
    return;
  }

  const distance = calculateReactionDistance(speed, reactionTime);
  lastDistance = distance;
  document.getElementById("distanceResult").innerHTML = `${distance.toFixed(2)} <small>metros</small>`;
  document.getElementById("distanceExplanation").textContent =
    `A ${speed} km/h, durante ${reactionTime} segundos de reacción, se recorrerían ${distance.toFixed(2)} metros.`;
  document.getElementById("statDistance").textContent = `${distance.toFixed(2)} m`;

  // if / else: clasificación ficticia solicitada para la práctica.
  let level;
  if (distance <= 30) {
    level = "Nivel bajo (simulación didáctica).";
  } else if (distance <= 60) {
    level = "Precaución (simulación didáctica).";
  } else {
    level = "Alerta didáctica: distancia superior a 60 m.";
  }
  document.getElementById("distanceExplanation").textContent += " " + level;
  showMessage("emergencyMessage", "Cálculo realizado correctamente.", "success");
});

// MÓDULO 2: MANTENIMIENTO
function renderMaintenanceTable() {
  const tbody = document.getElementById("maintenanceTable");
  tbody.innerHTML = "";

  if (maintenanceRecords.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Todavía no hay componentes registrados.</td></tr>';
  } else {
    maintenanceRecords.forEach(function (record, index) {
      const row = document.createElement("tr");
      const statusClass = record.status === "Normal" ? "normal" : record.status === "Revisión" ? "revision" : "urgent";
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHTML(record.component)}</td>
        <td>${record.hours.toLocaleString("es-BO")} h</td>
        <td><span class="status ${statusClass}">${record.status}</span></td>
        <td><button class="delete-btn" data-index="${index}" type="button">Eliminar</button></td>`;
      tbody.appendChild(row);
    });
  }

  document.getElementById("maintenanceCount").textContent =
    `${maintenanceRecords.length} ${maintenanceRecords.length === 1 ? "registro" : "registros"}`;
  document.getElementById("statMaintenance").textContent = maintenanceRecords.length;
  saveRecords();
}

// Evita insertar etiquetas HTML escritas en el campo de componente.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character];
  });
}

document.getElementById("maintenanceForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const component = document.getElementById("component").value.trim();
  const hours = parseFloat(document.getElementById("usageHours").value);
  const status = document.getElementById("maintenanceStatus").value;

  if (component === "" || !Number.isFinite(hours) || hours < 0 || hours > 100000 || status === "") {
    showMessage("maintenanceMessage", "Completa todos los campos con datos válidos. Las horas deben estar entre 0 y 100000.", "error");
    return;
  }

  // push agrega un nuevo objeto al arreglo.
  maintenanceRecords.push({ component: component, hours: hours, status: status });
  renderMaintenanceTable();
  this.reset();
  showMessage("maintenanceMessage", "Componente agregado a la tabla.", "success");
});

// Un solo evento en la tabla detecta el botón Eliminar.
document.getElementById("maintenanceTable").addEventListener("click", function (event) {
  if (event.target.classList.contains("delete-btn")) {
    const index = Number(event.target.dataset.index);
    // filter crea un arreglo nuevo sin el registro seleccionado.
    maintenanceRecords = maintenanceRecords.filter(function (_record, i) {
      return i !== index;
    });
    renderMaintenanceTable();
    showMessage("maintenanceMessage", "Registro eliminado correctamente.", "success");
  }
});

// MÓDULO 3: VIENTO Y OSCILACIÓN
function analyzeWindMeasurements(values) {
  let sum = 0;
  let maximum = values[0];

  // for recorre las cinco mediciones y calcula suma y máximo.
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (values[i] > maximum) maximum = values[i];
  }

  // forEach recorre el arreglo para mostrar cada valor en consola como práctica.
  values.forEach(function (value, index) {
    console.log(`Medición ${index + 1}: ${value} km/h`);
  });

  return { average: sum / values.length, maximum: maximum };
}

document.getElementById("windForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const values = [];
  for (let i = 1; i <= 5; i++) {
    const value = parseFloat(document.getElementById("wind" + i).value);
    if (!Number.isFinite(value) || value < 0 || value > 300) {
      showMessage("windMessage", "Ingresa las cinco mediciones. Cada valor debe estar entre 0 y 300 km/h.", "error");
      return;
    }
    values.push(value);
  }

  const result = analyzeWindMeasurements(values);
  lastWindAverage = result.average;
  document.getElementById("windAverage").textContent = result.average.toFixed(2);
  document.getElementById("windMaximum").textContent = result.maximum.toFixed(2);
  document.getElementById("statWind").textContent = `${result.average.toFixed(2)} km/h`;

  // Clasificación descriptiva ficticia.
  let classification;
  if (result.average < 30) {
    classification = "Intensidad baja (simulación).";
  } else if (result.average <= 50) {
    classification = "Intensidad moderada (simulación).";
  } else {
    classification = "Intensidad alta (simulación).";
  }
  document.getElementById("windClassification").textContent = classification;
  showMessage("windMessage", "Las cinco mediciones fueron analizadas correctamente.", "success");
});

// MÓDULO 4: SENSORES
function renderSensorTable() {
  const tbody = document.getElementById("sensorTable");
  tbody.innerHTML = "";

  if (sensorRecords.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Todavía no hay sensores registrados.</td></tr>';
  } else {
    sensorRecords.forEach(function (sensor, index) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${escapeHTML(sensor.code)}</strong></td>
        <td>${escapeHTML(sensor.type)}</td>
        <td>${sensor.reading}</td>
        <td><button class="delete-btn" data-index="${index}" type="button">Eliminar</button></td>`;
      tbody.appendChild(row);
    });
  }

  document.getElementById("sensorCount").textContent =
    `${sensorRecords.length} ${sensorRecords.length === 1 ? "sensor" : "sensores"}`;
  document.getElementById("statSensors").textContent = sensorRecords.length;
  saveRecords();
}

document.getElementById("sensorForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const code = document.getElementById("sensorCode").value.trim().toUpperCase();
  const type = document.getElementById("sensorType").value;
  const readingText = document.getElementById("sensorReading").value;
  const reading = Number(readingText);

  // Expresión regular real: SEN- seguido exactamente de tres dígitos.
  const sensorPattern = /^SEN-\d{3}$/;

  if (!sensorPattern.test(code)) {
    showMessage("sensorMessage", "Código inválido. Utiliza el formato SEN-001 (tres números después del guion).", "error");
    return;
  }
  if (type === "" || readingText.trim() === "" || !Number.isFinite(reading)) {
    showMessage("sensorMessage", "Selecciona el tipo e introduce una lectura numérica válida.", "error");
    return;
  }

  // test() comprueba si el código cumple el patrón.
  sensorRecords.push({ code: code, type: type, reading: reading });
  renderSensorTable();
  this.reset();
  showMessage("sensorMessage", "Sensor validado y registrado correctamente.", "success");
});

document.getElementById("sensorTable").addEventListener("click", function (event) {
  if (event.target.classList.contains("delete-btn")) {
    const index = Number(event.target.dataset.index);
    sensorRecords = sensorRecords.filter(function (_sensor, i) {
      return i !== index;
    });
    renderSensorTable();
  }
});

// MENÚ RESPONSIVE: abre y cierra la navegación en pantallas pequeñas.
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", function () {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

mainNav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

// Al abrir la página, dibuja los datos guardados en localStorage.
renderMaintenanceTable();
renderSensorTable();
