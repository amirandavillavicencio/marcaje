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

function formatStatusLabel(status, isOutsideBlock = false) {
  if (isOutsideBlock) {
    return "Presente (fuera de bloque)";
  }

  return status === "atrasado" ? "Atrasado" : "Presente";
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
  const statusLabel = formatStatusLabel(
    detectedAttendance.status,
    detectedAttendance.isOutsideBlock
  );

  fechaActualEl.textContent = formatFecha(now);
  horaActualEl.textContent = formatHora(now);
  bloqueActualEl.textContent = detectedAttendance.blockLabel;
  estadoPrevistoEl.textContent = statusLabel;

  if (detectedAttendance.isOutsideBlock) {
    estadoActualEl.textContent = "Bloque detectado: fuera de bloque. Estado esperado: presente.";
    return;
  }

  estadoActualEl.textContent = `Bloque detectado: ${detectedAttendance.blockName}. Estado esperado: ${statusLabel.toLowerCase()}.`;
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

      const statusValue = record.estado_entrada || record.estado;
      const entryTime = record.hora_entrada || record.hora;
      const exitTime = record.hora_salida ? formatStoredTime(record.hora_salida) : "Sin salida";

      return `
        <article class="registro">
          <div class="registro-top">
            <strong>${escapeHtml(record.nombre)}</strong>
            <span class="registro-hora">Entrada: ${escapeHtml(formatStoredTime(entryTime))}</span>
          </div>
          <div class="registro-meta">
            <span>${escapeHtml(record.rol)}</span>
            <span>${escapeHtml(record.bloque)}</span>
            <span class="badge ${statusValue === "presente" ? "badge-ok" : "badge-warn"}">${escapeHtml(statusValue || "sin estado")}</span>
          </div>
          <div class="registro-meta registro-meta-secondary">
            <span>Hora entrada: ${escapeHtml(formatStoredTime(entryTime))}</span>
            <span>Hora salida: ${escapeHtml(exitTime)}</span>
            <span>Estado entrada: ${escapeHtml(statusValue || "sin estado")}</span>
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
      .select("id, nombre, rol, bloque, estado, hora, observacion, hora_entrada, hora_salida, estado_entrada")
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
  const detectedAttendance = getDetectedAttendance(now);

  if (!role) {
    setMessage("error", "Faltan datos para registrar la entrada: selecciona un rol.");
    rolEl.focus();
    return;
  }

  if (nombreEl.disabled) {
    setMessage("error", "Faltan datos para registrar la entrada: no hay nombres disponibles para el rol seleccionado.");
    return;
  }

  if (!name) {
    setMessage("error", "Faltan datos para registrar la entrada: selecciona una persona.");
    nombreEl.focus();
    return;
  }

  const blockName = detectedAttendance.blockName;
  const status = detectedAttendance.status;

  isSubmitting = true;
  btnRegistrar.disabled = true;
  btnRegistrar.textContent = "Registrando...";
  setMessage(
    "info",
    `Procesando registro de entrada para ${name}. Bloque detectado: ${blockName}. Estado esperado: ${formatStatusLabel(status, detectedAttendance.isOutsideBlock)}.`
  );

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
      throw new Error("Supabase no permitió validar si la entrada ya existía. Intenta nuevamente.");
    }

    if (existingRecord && existingRecord.length > 0) {
      setMessage(
        "error",
        `Entrada duplicada detectada: ${name} ya tiene un registro hoy en el bloque ${blockName}. No se realizó un segundo registro.`
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
        observacion: observation,
        hora,
        hora_entrada: hora,
        estado_entrada: status,
        registrado_por: "recepcion"
      }
    ]);

    if (insertError) {
      throw new Error("Supabase no pudo guardar la entrada. Revisa la conexión e intenta nuevamente.");
    }

    setMessage(
      "success",
      detectedAttendance.isOutsideBlock
        ? `Entrada registrada con éxito para ${name}. Bloque detectado: fuera de bloque. Estado asignado: presente. Hora: ${horaVisible}.`
        : `Entrada registrada con éxito para ${name}. Bloque detectado: ${blockName}. Estado detectado: ${status}. Hora: ${horaVisible}.`
    );
    observacionEl.value = "";
    await loadTodayRecords();
  } catch (error) {
    console.error(error);
    setMessage("error", error.message || "Supabase devolvió un error al registrar la entrada. Intenta nuevamente.");
  } finally {
    isSubmitting = false;
    btnRegistrar.disabled = false;
    btnRegistrar.textContent = "Registrar marcaje";
    updateClockPanel();
  }
}

async function registerExit() {
  if (isSubmitting) {
    return;
  }

  const role = rolEl.value;
  const name = nombreEl.value;
  const now = new Date();
  const fecha = getFechaLocal(now);
  const horaSalida = now.toISOString();
  const horaVisible = formatHora(now);

  if (!role) {
    setMessage("error", "Faltan datos para registrar la salida: selecciona un rol.");
    rolEl.focus();
    return;
  }

  if (nombreEl.disabled) {
    setMessage("error", "Faltan datos para registrar la salida: no hay nombres disponibles para el rol seleccionado.");
    return;
  }

  if (!name) {
    setMessage("error", "Faltan datos para registrar la salida: selecciona una persona.");
    nombreEl.focus();
    return;
  }

  isSubmitting = true;
  btnRegistrarSalida.disabled = true;
  btnRegistrarSalida.textContent = "Registrando salida...";
  setMessage("info", `Buscando una entrada abierta para ${name}.`);

  try {
    const { data: openRecordData, error: searchError } = await supabase
      .from("marcaje_personal")
      .select("id, hora_entrada, hora_salida")
      .eq("nombre", name)
      .eq("rol", role)
      .eq("fecha", fecha)
      .not("hora_entrada", "is", null)
      .is("hora_salida", null)
      .order("hora", { ascending: false })
      .limit(1);

    if (searchError) {
      throw new Error("Supabase no permitió validar si existe una entrada abierta para cerrar. Intenta nuevamente.");
    }

    if (!openRecordData || openRecordData.length === 0) {
      const { data: existingRecord, error: existingRecordError } = await supabase
        .from("marcaje_personal")
        .select("id, hora_entrada, hora_salida")
        .eq("nombre", name)
        .eq("rol", role)
        .eq("fecha", fecha)
        .not("hora_entrada", "is", null)
        .order("hora", { ascending: false })
        .limit(1);

      if (existingRecordError) {
        throw new Error("Supabase no permitió validar si existe una entrada abierta para cerrar. Intenta nuevamente.");
      }

      if (existingRecord && existingRecord.length > 0 && existingRecord[0].hora_salida) {
        setMessage("error", "La salida de este registro ya fue registrada.");
        return;
      }

      setMessage("error", "No hay una entrada registrada para cerrar");
      return;
    }

    const openRecord = openRecordData[0];

    const { error: updateError } = await supabase
      .from("marcaje_personal")
      .update({ hora_salida: horaSalida })
      .eq("id", openRecord.id);

    if (updateError) {
      throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
    }

    setMessage("success", `Salida registrada con éxito para ${name}. Hora: ${horaVisible}.`);
    await loadTodayRecords();
  } catch (error) {
    console.error(error);
    setMessage("error", error.message || "Supabase devolvió un error al registrar la salida. Intenta nuevamente.");
  } finally {
    isSubmitting = false;
    btnRegistrarSalida.disabled = false;
    btnRegistrarSalida.textContent = "Registrar salida";
    updateClockPanel();
  }
}

function startClock() {
  updateClockPanel();
  clockTimerId = window.setInterval(updateClockPanel, 1000);
}

rolEl.addEventListener("change", populateNames);
btnRegistrar.addEventListener("click", registerAttendance);
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
