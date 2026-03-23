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
const btnRegistrarEntrada = document.getElementById("btnRegistrarEntrada");
const btnRegistrarSalida = document.getElementById("btnRegistrarSalida");
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
    return "presente";
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = getMinutesFromTime(block.inicio);

  return currentMinutes <= startMinutes + 5 ? "presente" : "atrasado";
}

function getDetectedAttendance(date = new Date()) {
  const detectedBlock = detectBlock(date);

  if (!detectedBlock) {
    return {
      blockName: "Fuera de bloque",
      blockLabel: "Fuera de bloque",
      status: "presente",
      isOutsideBlock: true
    };
  }

  return {
    blockName: detectedBlock.nombre,
    blockLabel: `${detectedBlock.nombre} (${detectedBlock.inicio} a ${detectedBlock.fin})`,
    status: detectStatus(detectedBlock, date),
    isOutsideBlock: false
  };
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
  const detectedAttendance = getDetectedAttendance(now);

  fechaActualEl.textContent = formatFecha(now);
  horaActualEl.textContent = formatHora(now);
  bloqueActualEl.textContent = detectedAttendance.blockLabel;
  estadoPrevistoEl.textContent = detectedAttendance.status;

  if (detectedAttendance.isOutsideBlock) {
    estadoActualEl.textContent = "Si registras ahora, se guardará como presente fuera de bloque.";
    return;
  }

  estadoActualEl.textContent = `Si registras ahora, el estado será ${detectedAttendance.status}.`;
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
      const horaEntrada = record.hora_entrada || record.hora;
      const estadoEntrada = record.estado_entrada || record.estado || "Sin estado";
      const horaSalida = record.hora_salida ? formatStoredTime(record.hora_salida) : "Sin salida";

      return `
        <article class="registro">
          <div class="registro-top">
            <strong>${escapeHtml(record.nombre)}</strong>
            <span class="registro-hora">Entrada: ${escapeHtml(formatStoredTime(horaEntrada))}</span>
          </div>
          <div class="registro-meta">
            <span>${escapeHtml(record.rol)}</span>
            <span>${escapeHtml(record.bloque)}</span>
            <span>Salida: ${escapeHtml(horaSalida)}</span>
            <span class="badge ${estadoEntrada === "presente" ? "badge-ok" : "badge-warn"}">${escapeHtml(estadoEntrada)}</span>
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
      .select("id, nombre, rol, bloque, hora, hora_entrada, hora_salida, estado, estado_entrada, observacion")
      .eq("fecha", fecha)
      .order("hora_entrada", { ascending: false });

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

function setSubmittingState(isActive, button, loadingText, defaultText) {
  isSubmitting = isActive;
  btnRegistrarEntrada.disabled = isActive;
  btnRegistrarSalida.disabled = isActive;
  if (button) {
    button.textContent = isActive ? loadingText : defaultText;
  }
}

function validateSelection() {
  const role = rolEl.value;
  const name = nombreEl.value;

  if (!role) {
    setMessage("error", "Selecciona un rol antes de registrar el marcaje.");
    rolEl.focus();
    return null;
  }

  if (nombreEl.disabled) {
    setMessage("error", "No hay nombres disponibles para el rol seleccionado.");
    return null;
  }

  if (!name) {
    setMessage("error", "Selecciona una persona antes de registrar el marcaje.");
    nombreEl.focus();
    return null;
  }

  return { role, name };
}

async function registerAttendance() {
  if (isSubmitting) {
    return;
  }

  const selection = validateSelection();
  if (!selection) {
    return;
  }

  const { role, name } = selection;
  const observation = observacionEl.value.trim();
  const now = new Date();
  const fecha = getFechaLocal(now);
  const hora = now.toISOString();
  const horaVisible = formatHora(now);
  const detectedAttendance = getDetectedAttendance(now);
  const blockName = detectedAttendance.blockName;
  const status = detectedAttendance.status;

  setSubmittingState(true, btnRegistrarEntrada, "Registrando entrada...", "Registrar entrada");
  setMessage("info", `Validando registro para ${name} en el bloque ${blockName}...`);

  try {
    const { data: existingRecord, error: searchError } = await supabase
      .from("marcaje_personal")
      .select("id")
      .eq("nombre", name)
      .eq("rol", role)
      .eq("fecha", fecha)
      .eq("bloque", blockName)
      .limit(1);

    if (searchError) {
      throw new Error("No fue posible validar si ya existe un marcaje previo.");
    }

    if (existingRecord && existingRecord.length > 0) {
      setMessage(
        "error",
        `Ya existe un marcaje para ${name} como ${role} hoy en el bloque ${blockName}. No se registró un duplicado.`
      );
      return;
    }

    const { error: insertError } = await supabase.from("marcaje_personal").insert([
      {
        nombre: name,
        rol: role,
        fecha,
        bloque: blockName,
        estado: status,
        estado_entrada: status,
        observacion: observation,
        hora,
        hora_entrada: hora,
        registrado_por: "recepcion"
      }
    ]);

    if (insertError) {
      throw new Error("Supabase no pudo guardar el marcaje. Revisa la conexión e intenta nuevamente.");
    }

    setMessage(
      "success",
      detectedAttendance.isOutsideBlock
        ? `Entrada registrada correctamente para ${name} fuera de bloque. Estado asignado: presente. Hora: ${horaVisible}.`
        : status === "atrasado"
          ? `Entrada registrada correctamente para ${name}. Bloque detectado: ${blockName}. Estado detectado: atrasado. Hora: ${horaVisible}.`
          : `Entrada registrada correctamente para ${name}. Bloque detectado: ${blockName}. Estado detectado: presente. Hora: ${horaVisible}.`
    );
    observacionEl.value = "";
    await loadTodayRecords();
  } catch (error) {
    console.error(error);
    setMessage("error", error.message || "Ocurrió un problema inesperado al registrar el marcaje.");
  } finally {
    setSubmittingState(false, btnRegistrarEntrada, "Registrando entrada...", "Registrar entrada");
    updateClockPanel();
  }
}

async function registerExit() {
  if (isSubmitting) {
    return;
  }

  const selection = validateSelection();
  if (!selection) {
    return;
  }

  const { role, name } = selection;
  const now = new Date();
  const fecha = getFechaLocal(now);
  const horaSalida = now.toISOString();
  const horaVisible = formatHora(now);

  setSubmittingState(true, btnRegistrarSalida, "Registrando salida...", "Registrar salida");
  setMessage("info", `Buscando entrada abierta para ${name}...`);

  try {
    const { data: existingRecords, error: searchError } = await supabase
      .from("marcaje_personal")
      .select("id, hora_entrada, hora_salida")
      .eq("nombre", name)
      .eq("rol", role)
      .eq("fecha", fecha)
      .order("hora_entrada", { ascending: false });

    if (searchError) {
      throw new Error("No fue posible buscar la entrada registrada para cerrar.");
    }

    const openRecord = (existingRecords || []).find((record) => record.hora_entrada && !record.hora_salida);
    const closedRecord = (existingRecords || []).find((record) => record.hora_entrada && record.hora_salida);

    if (!openRecord) {
      setMessage("error", closedRecord ? "La salida ya fue registrada" : "No hay una entrada registrada para cerrar");
      return;
    }

    const { error: updateError } = await supabase
      .from("marcaje_personal")
      .update({ hora_salida: horaSalida })
      .eq("id", openRecord.id)
      .is("hora_salida", null);

    if (updateError) {
      throw new Error("Supabase no pudo registrar la salida. Revisa la conexión e intenta nuevamente.");
    }

    setMessage("success", `Salida registrada correctamente para ${name}. Hora: ${horaVisible}.`);
    await loadTodayRecords();
  } catch (error) {
    console.error(error);
    setMessage("error", error.message || "Ocurrió un problema inesperado al registrar la salida.");
  } finally {
    setSubmittingState(false, btnRegistrarSalida, "Registrando salida...", "Registrar salida");
    updateClockPanel();
  }
}

function startClock() {
  updateClockPanel();
  clockTimerId = window.setInterval(updateClockPanel, 1000);
}

rolEl.addEventListener("change", populateNames);
btnRegistrarEntrada.addEventListener("click", registerAttendance);
btnRegistrarSalida.addEventListener("click", registerExit);
btnActualizar.addEventListener("click", loadTodayRecords);

populateNames();
startClock();
loadTodayRecords();

window.addEventListener("beforeunload", () => {
  if (clockTimerId) {
    window.clearInterval(clockTimerId);
  }
});
