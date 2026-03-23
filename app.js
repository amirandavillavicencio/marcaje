import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://mqyoetrswxefgobfmldf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GGE5Mo0YGiIEkDYBsAkH9w_D9yvGQdr";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PERSONAS = [
  { nombre: "Daniela María Román Schuffenegger", rol: "administrador" },
  { nombre: "Sofía Valentina Núñez Barrera", rol: "administrador" },
  { nombre: "Sebastián Ignacio Osorio León", rol: "administrador" },
  { nombre: "Javier Nicolás Zúñiga González", rol: "administrador" },
  { nombre: "Daniel Jonatán Salamanca Lillo", rol: "administrador" },
  { nombre: "Fernanda Macarena Riveros Solís", rol: "administrador" },
  { nombre: "Catalina Ruiz", rol: "administrador" },
  { nombre: "Antonia Soledad Farías Baeza", rol: "administrador" },
  { nombre: "Macarena Inostroza", rol: "administrador" },
  { nombre: "Melissa Foweraker", rol: "administrador" },
  { nombre: "Nicolás Alejandro Cid Parra", rol: "administrador" },
  { nombre: "Camila Antonia Canales Parraguez", rol: "administrador" },
  { nombre: "Aracely Andrea Rivas Urrutia", rol: "administrador" },
  { nombre: "Catalina Stephania León Cruz", rol: "administrador" },
  { nombre: "María Francisca Cruz Jara", rol: "tutor" },
  { nombre: "Kevin Jaramillo", rol: "tutor" },
  { nombre: "Catalina Flores", rol: "tutor" },
  { nombre: "Octavio Gutiérrez Parada", rol: "tutor" },
  { nombre: "Agustín Salazar", rol: "tutor" },
  { nombre: "Iovanni Andress Fuentes Paiva", rol: "tutor" },
  { nombre: "Cristóbal Darío Molina Cárdenas", rol: "tutor" }
];

const BLOCKS = [
  { nombre: "3-4", inicio: "09:40", fin: "10:50" },
  { nombre: "5-6", inicio: "11:05", fin: "12:15" },
  { nombre: "7-8", inicio: "12:30", fin: "13:40" },
  { nombre: "Bloque de almuerzo", inicio: "13:40", fin: "14:40" },
  { nombre: "9-10", inicio: "14:40", fin: "15:50" },
  { nombre: "11-12", inicio: "16:05", fin: "17:15" }
];

const rolEl = document.getElementById("rol");
const nombreEl = document.getElementById("nombre");
const observacionEl = document.getElementById("observacion");
const btnRegistrar = document.getElementById("btnRegistrar");
const btnActualizar = document.getElementById("btnActualizar");
const mensajeEl = document.getElementById("mensaje");
const listaRegistrosEl = document.getElementById("listaRegistros");
const bloqueActualEl = document.getElementById("bloqueActual");
const estadoActualEl = document.getElementById("estadoActual");
const fechaActualEl = document.getElementById("fechaActual");
const horaActualEl = document.getElementById("horaActual");
const estadoPrevistoEl = document.getElementById("estadoPrevisto");

let isSubmitting = false;
let isLoadingList = false;
let clockTimerId = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function getFechaLocal(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getHoraLocal(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatFecha(date = new Date()) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatHora(date = new Date()) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function getMinutesFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function detectBlock(date = new Date()) {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  return (
    BLOCKS.find((block) => {
      const startMinutes = getMinutesFromTime(block.inicio);
      const endMinutes = getMinutesFromTime(block.fin);
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }) || null
  );
}

function detectStatus(block, date = new Date()) {
  if (!block) {
    return null;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = getMinutesFromTime(block.inicio);

  return currentMinutes <= startMinutes + 5 ? "presente" : "atrasado";
}

function setMessage(type, text) {
  mensajeEl.className = `mensaje ${type}`;
  mensajeEl.textContent = text;
}

function resetNameOptions(placeholder) {
  nombreEl.innerHTML = "";
  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholder;
  nombreEl.appendChild(option);
  nombreEl.value = "";
}

function populateNames() {
  const selectedRole = rolEl.value;
  const availablePeople = PERSONAS
    .filter((person) => person.rol === selectedRole)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  if (!selectedRole) {
    nombreEl.disabled = true;
    resetNameOptions("Primero selecciona un rol");
    setMessage("info", "Selecciona un rol para habilitar la lista de nombres.");
    return;
  }

  if (availablePeople.length === 0) {
    nombreEl.disabled = true;
    resetNameOptions("No hay personas disponibles para este rol");
    setMessage("error", `No hay nombres configurados para el rol ${selectedRole}.`);
    return;
  }

  nombreEl.disabled = false;
  resetNameOptions("Selecciona una persona");

  availablePeople.forEach((person) => {
    const option = document.createElement("option");
    option.value = person.nombre;
    option.textContent = person.nombre;
    nombreEl.appendChild(option);
  });

  setMessage("info", "Selecciona una persona y luego registra el marcaje.");
}

function updateClockPanel() {
  const now = new Date();
  const block = detectBlock(now);
  const status = detectStatus(block, now);

  fechaActualEl.textContent = formatFecha(now);
  horaActualEl.textContent = formatHora(now);
  bloqueActualEl.textContent = block ? `${block.nombre} (${block.inicio} a ${block.fin})` : "Fuera de bloque";
  estadoPrevistoEl.textContent = status || "No disponible";

  if (!block) {
    estadoActualEl.textContent = "Solo se registran marcajes dentro de los bloques oficiales.";
    return;
  }

  estadoActualEl.textContent = `Si registras ahora, el estado será ${status}.`;
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatStoredTime(value) {
  if (!value) {
    return "Sin hora";
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(parsedDate);
  }

  return String(value).slice(0, 8);
}

function renderRecords(records) {
  if (!records || records.length === 0) {
    listaRegistrosEl.innerHTML = '<div class="empty-state">Todavía no hay registros para hoy.</div>';
    return;
  }

  listaRegistrosEl.innerHTML = records
    .map((record) => {
      const observation = record.observacion
        ? `<p class="registro-observacion">${escapeHtml(record.observacion)}</p>`
        : "";

      return `
        <article class="registro">
          <div class="registro-top">
            <strong>${escapeHtml(record.nombre)}</strong>
            <span class="registro-hora">${escapeHtml(formatStoredTime(record.hora))}</span>
          </div>
          <div class="registro-meta">
            <span>${escapeHtml(record.rol)}</span>
            <span>${escapeHtml(record.bloque)}</span>
            <span class="badge ${record.estado === "presente" ? "badge-ok" : "badge-warn"}">${escapeHtml(record.estado)}</span>
          </div>
          ${observation}
        </article>
      `;
    })
    .join("");
}

async function loadTodayRecords() {
  if (isLoadingList) {
    return;
  }

  isLoadingList = true;
  btnActualizar.disabled = true;
  listaRegistrosEl.innerHTML = '<div class="empty-state">Cargando registros de hoy...</div>';

  try {
    const fecha = getFechaLocal();
    const { data, error } = await supabase
      .from("marcaje_personal")
      .select("nombre, rol, bloque, estado, hora, observacion")
      .eq("fecha", fecha)
      .order("hora", { ascending: false });

    if (error) {
      throw error;
    }

    renderRecords(data || []);
  } catch (error) {
    console.error(error);
    listaRegistrosEl.innerHTML = '<div class="empty-state error-state">No se pudieron cargar los registros del día. Intenta nuevamente.</div>';
  } finally {
    isLoadingList = false;
    btnActualizar.disabled = false;
  }
}

async function registerAttendance() {
  if (isSubmitting) {
    return;
  }

  const role = rolEl.value;
  const name = nombreEl.value;
  const observation = observacionEl.value.trim();
  const now = new Date();
  const fecha = getFechaLocal(now);
  const hora = now.toISOString();
  const horaVisible = formatHora(now);
  const block = detectBlock(now);

  if (!role) {
    setMessage("error", "Selecciona un rol antes de registrar el marcaje.");
    rolEl.focus();
    return;
  }

  if (nombreEl.disabled) {
    setMessage("error", "No hay nombres disponibles para el rol seleccionado.");
    return;
  }

  if (!name) {
    setMessage("error", "Selecciona una persona antes de registrar el marcaje.");
    nombreEl.focus();
    return;
  }

  if (!block) {
    setMessage("error", "No es posible registrar fuera de los bloques oficiales. Intenta nuevamente dentro de un bloque válido.");
    return;
  }

  const status = detectStatus(block, now);

  isSubmitting = true;
  btnRegistrar.disabled = true;
  btnRegistrar.textContent = "Registrando...";
  setMessage("info", `Validando registro para ${name} en el bloque ${block.nombre}...`);

  try {
    const { data: existingRecord, error: searchError } = await supabase
      .from("marcaje_personal")
      .select("id")
      .eq("nombre", name)
      .eq("rol", role)
      .eq("fecha", fecha)
      .eq("bloque", block.nombre)
      .limit(1);

    if (searchError) {
      throw new Error("No fue posible validar si ya existe un marcaje previo.");
    }

    if (existingRecord && existingRecord.length > 0) {
      setMessage(
        "error",
        `Ya existe un marcaje para ${name} como ${role} hoy en el bloque ${block.nombre}. No se registró un duplicado.`
      );
      return;
    }

    const { error: insertError } = await supabase.from("marcaje_personal").insert([
      {
        nombre: name,
        rol: role,
        fecha,
        bloque: block.nombre,
        estado: status,
        observacion: observation,
        hora,
        registrado_por: "recepcion"
      }
    ]);

    if (insertError) {
      throw new Error("Supabase no pudo guardar el marcaje. Revisa la conexión e intenta nuevamente.");
    }

    setMessage(
      "success",
      `Marcaje registrado correctamente para ${name}. Bloque detectado: ${block.nombre}. Estado: ${status}. Hora: ${horaVisible}.`
    );
    observacionEl.value = "";
    await loadTodayRecords();
  } catch (error) {
    console.error(error);
    setMessage("error", error.message || "Ocurrió un problema inesperado al registrar el marcaje.");
  } finally {
    isSubmitting = false;
    btnRegistrar.disabled = false;
    btnRegistrar.textContent = "Registrar marcaje";
    updateClockPanel();
  }
}

function startClock() {
  updateClockPanel();
  clockTimerId = window.setInterval(updateClockPanel, 1000);
}

rolEl.addEventListener("change", populateNames);
btnRegistrar.addEventListener("click", registerAttendance);
btnActualizar.addEventListener("click", loadTodayRecords);

populateNames();
startClock();
loadTodayRecords();

window.addEventListener("beforeunload", () => {
  if (clockTimerId) {
    window.clearInterval(clockTimerId);
  }
});
