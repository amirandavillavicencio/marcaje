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

const BLOQUES = [
  { nombre: "3-4", inicio: "09:40", fin: "11:09" },
  { nombre: "5-6", inicio: "11:10", fin: "12:39" },
  { nombre: "almuerzo", inicio: "12:40", fin: "14:09" },
  { nombre: "7-8", inicio: "14:10", fin: "15:39" },
  { nombre: "9-10", inicio: "15:40", fin: "17:09" }
];

const MINUTOS_PRESENTE = 5;

const rolEl = document.getElementById("rol");
const bloqueDetectadoEl = document.getElementById("bloqueDetectado");
const estadoDetectadoEl = document.getElementById("estadoDetectado");
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
const btnAccionPrincipal = document.getElementById("btnAccionPrincipal");
const estadoUsuarioTextoEl = document.getElementById("estadoUsuarioTexto");
const estadoUsuarioDetalleEl = document.getElementById("estadoUsuarioDetalle");
const estadoUsuarioPanelEl = document.getElementById("estadoUsuarioPanel");

let todayRecords = [];
let isSubmitting = false;
let isLoadingList = false;
let clockTimerId = null;

const nombreEl = ensureNameSelect();
const roleToggleEls = ensureRoleToggles();

function ensureRoleToggles() {
  const roleSelector = document.createElement("div");
  roleSelector.className = "role-selector";
  roleSelector.innerHTML = `
    <span class="status-label">Rol</span>
    <div class="role-toggle-group" aria-label="Selecciona un rol">
      <button type="button" class="role-toggle" data-role-value="administrador">Administrador</button>
      <button type="button" class="role-toggle" data-role-value="tutor">Tutor</button>
    </div>
  `;

  rolEl.insertAdjacentElement("beforebegin", roleSelector);
  return Array.from(roleSelector.querySelectorAll(".role-toggle"));
}

function ensureNameSelect() {
  let select = document.getElementById("nombre");
  if (select) {
    return select;
  }

  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.setAttribute("for", "nombre");
  label.textContent = "Nombre";

  select = document.createElement("select");
  select.id = "nombre";
  select.disabled = true;
  select.innerHTML = '<option value="">Primero selecciona un rol</option>';

  field.append(label, select);

  const anchor = observacionEl.closest(".field");
  anchor?.insertAdjacentElement("beforebegin", field);

  return select;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function getFechaLocal(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

function parseHora(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function getMinutosDelDia(fecha = new Date()) {
  return fecha.getHours() * 60 + fecha.getMinutes();
}

function detectarMarcaje(fecha = new Date()) {
  const minutosActuales = getMinutosDelDia(fecha);

  for (const bloque of BLOQUES) {
    const inicio = parseHora(bloque.inicio);
    const fin = parseHora(bloque.fin);

    if (minutosActuales < inicio || minutosActuales > fin) {
      continue;
    }

    return {
      bloque: bloque.nombre,
      estado: minutosActuales <= inicio + MINUTOS_PRESENTE - 1 ? "presente" : "atrasado",
      fueraDeBloque: false
    };
  }

  return {
    bloque: "Fuera de bloque",
    estado: "presente",
    fueraDeBloque: true
  };
}

function formatStatusLabel(status, fueraDeBloque = false) {
  if (fueraDeBloque) {
    return "Presente (fuera de bloque)";
  }

  return status === "atrasado" ? "Atrasado" : "Presente";
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

function poblarNombres() {
  const rolSeleccionado = rolEl.value;
  const personasDisponibles = PERSONAS
    .filter((persona) => persona.rol === rolSeleccionado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  if (!rolSeleccionado) {
    nombreEl.disabled = true;
    resetNameOptions("Primero selecciona un rol");
    setMessage("info", "Selecciona un rol para habilitar la lista de nombres.");
    return;
  }

  if (personasDisponibles.length === 0) {
    nombreEl.disabled = true;
    resetNameOptions("No hay personas disponibles para este rol");
    setMessage("error", `No hay nombres configurados para el rol ${rolSeleccionado}.`);
    return;
  }

  nombreEl.disabled = false;
  resetNameOptions("Selecciona una persona");

  personasDisponibles.forEach((persona) => {
    const option = document.createElement("option");
    option.value = persona.nombre;
    option.textContent = persona.nombre;
    nombreEl.appendChild(option);
  });

  setMessage("info", "Selecciona una persona y luego registra la entrada o la salida desde este formulario.");
}

function syncRoleToggleState() {
  roleToggleEls.forEach((button) => {
    const isActive = button.dataset.roleValue === rolEl.value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function hasStoredTime(value) {
  return typeof value === "string" && value.trim() !== "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatStoredDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(11, 19) || String(value);
  }

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function getExitAction(record) {
  if (record.hora_entrada && !hasStoredTime(record.hora_salida)) {
    return `
      <button
        class="registro-salida-btn secondary-action"
        data-action="registrar-salida"
        data-record-id="${record.id}"
        data-record-name="${escapeHtml(record.nombre)}"
      >
        Registrar salida
      </button>
    `;
  }

  if (hasStoredTime(record.hora_salida)) {
    return '<span class="registro-salida-status">Salida registrada</span>';
  }

  return "";
}

function inferUserStatus(records, role, name) {
  if (!role || !name) {
    return {
      code: "unselected",
      text: "Selecciona una persona",
      detail: "El botón principal se ajustará automáticamente.",
      buttonLabel: "Selecciona una persona",
      buttonMode: "disabled"
    };
  }

  const matchingRecords = records.filter((record) => record.nombre === name && record.rol === role);

  if (matchingRecords.length === 0) {
    return {
      code: "none",
      text: "No tiene registro hoy",
      detail: "Puedes registrar la entrada desde el botón principal.",
      buttonLabel: "Registrar entrada",
      buttonMode: "entry"
    };
  }

  const openRecord = matchingRecords.find((record) => record.hora_entrada && !hasStoredTime(record.hora_salida));
  if (openRecord) {
    return {
      code: "pending",
      text: "Entrada registrada — pendiente salida",
      detail: `Entrada detectada en ${openRecord.bloque || "sin bloque"}.`,
      buttonLabel: "Registrar salida",
      buttonMode: "exit"
    };
  }

  return {
    code: "complete",
    text: "Jornada completada",
    detail: "La entrada y la salida de hoy ya están registradas.",
    buttonLabel: "Jornada completada",
    buttonMode: "completed"
  };
}

function updatePrimaryAction() {
  const status = inferUserStatus(todayRecords, rolEl.value, nombreEl.value);
  estadoUsuarioTextoEl.textContent = status.text;
  estadoUsuarioDetalleEl.textContent = status.detail;
  estadoUsuarioPanelEl.dataset.status = status.code;
  btnAccionPrincipal.textContent = status.buttonLabel;
  btnAccionPrincipal.dataset.mode = status.buttonMode;
  btnAccionPrincipal.disabled = isSubmitting || status.buttonMode === "disabled" || status.buttonMode === "completed";
}

function actualizarDeteccionVisual() {
  const deteccion = detectarMarcaje();
  bloqueDetectadoEl.textContent = deteccion.bloque;
  estadoDetectadoEl.textContent = formatStatusLabel(deteccion.estado, deteccion.fueraDeBloque);
  estadoPrevistoEl.textContent = formatStatusLabel(deteccion.estado, deteccion.fueraDeBloque);
}

function updateClockPanel() {
  const now = new Date();
  const deteccion = detectarMarcaje(now);

  fechaActualEl.textContent = formatFecha(now);
  horaActualEl.textContent = formatHora(now);
  bloqueActualEl.textContent = deteccion.bloque;
  estadoActualEl.textContent = deteccion.fueraDeBloque
    ? "Fuera de bloque: el sistema registrará presente."
    : `Estado detectado para este bloque: ${formatStatusLabel(deteccion.estado)}.`;

  actualizarDeteccionVisual();
}

function renderRecords(records) {
  if (!records || records.length === 0) {
    listaRegistrosEl.innerHTML = '<div class="empty-state">Todavía no hay registros para hoy.</div>';
    return;
  }

  listaRegistrosEl.innerHTML = records
    .map((record) => {
      const entrada = formatStoredDateTime(record.hora_entrada || record.hora);
      const salida = formatStoredDateTime(record.hora_salida);
      const estadoEntrada = formatStatusLabel(record.estado_entrada || record.estado, record.bloque === "Fuera de bloque");

      return `
        <article class="registro-item">
          <div class="registro-item-header">
            <div>
              <strong>${escapeHtml(record.nombre)}</strong>
              <small>${escapeHtml(record.rol || "sin rol")}</small>
            </div>
            <span class="registro-badge">${escapeHtml(record.bloque || "Sin bloque")}</span>
          </div>
          <div class="registro-item-body">
            <p><span class="record-label">Estado</span>${escapeHtml(estadoEntrada)}</p>
            <p><span class="record-label">Entrada</span>${escapeHtml(entrada)}</p>
            <p><span class="record-label">Salida</span>${escapeHtml(salida)}</p>
            <p><span class="record-label">Observación</span>${escapeHtml(record.observacion || "-")}</p>
          </div>
          <div class="registro-item-actions">
            ${getExitAction(record)}
          </div>
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
      .order("hora_entrada", { ascending: false })
      .order("hora", { ascending: false });

    if (error) {
      throw error;
    }

    todayRecords = data || [];
    renderRecords(todayRecords);
    updatePrimaryAction();
  } catch (error) {
    console.error(error);
    listaRegistrosEl.innerHTML = '<div class="empty-state error-state">No se pudieron cargar los registros del día. Intenta nuevamente.</div>';
    setMessage("error", "No se pudieron cargar los registros de hoy.");
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
  const deteccion = detectarMarcaje(now);

  if (!role) {
    setMessage("error", "Faltan datos para registrar la entrada: selecciona un rol.");
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

  isSubmitting = true;
  btnRegistrar.disabled = true;
  btnRegistrarSalida.disabled = true;
  btnAccionPrincipal.disabled = true;
  btnRegistrar.textContent = "Registrando...";
  setMessage(
    "info",
    `Procesando registro de entrada para ${name}. Bloque detectado: ${deteccion.bloque}. Estado esperado: ${formatStatusLabel(deteccion.estado, deteccion.fueraDeBloque)}.`
  );

  try {
    const { data: existingRecord, error: searchError } = await supabase
      .from("marcaje_personal")
      .select("id")
      .eq("nombre", name)
      .eq("rol", role)
      .eq("fecha", fecha)
      .eq("bloque", deteccion.bloque)
      .limit(1);

    if (searchError) {
      throw new Error("Supabase no permitió validar si la entrada ya existía. Intenta nuevamente.");
    }

    if (existingRecord && existingRecord.length > 0) {
      setMessage("error", `Entrada duplicada detectada: ${name} ya tiene un registro hoy en el bloque ${deteccion.bloque}.`);
      return;
    }

    const { error: insertError } = await supabase.from("marcaje_personal").insert([
      {
        nombre: name,
        rol: role,
        fecha,
        bloque: deteccion.bloque,
        estado: deteccion.estado,
        observacion: observation,
        hora,
        hora_entrada: hora,
        estado_entrada: deteccion.estado,
        registrado_por: "recepcion"
      }
    ]);

    if (insertError) {
      throw new Error("Supabase no pudo guardar la entrada. Revisa la conexión e intenta nuevamente.");
    }

    observacionEl.value = "";
    setMessage(
      "success",
      deteccion.fueraDeBloque
        ? `Entrada registrada con éxito para ${name}. Bloque detectado: fuera de bloque. Estado asignado: presente. Hora: ${horaVisible}.`
        : `Entrada registrada con éxito para ${name}. Bloque detectado: ${deteccion.bloque}. Estado detectado: ${deteccion.estado}. Hora: ${horaVisible}.`
    );
    await loadTodayRecords();
  } catch (error) {
    console.error(error);
    setMessage("error", error.message || "Supabase devolvió un error al registrar la entrada. Intenta nuevamente.");
  } finally {
    isSubmitting = false;
    btnRegistrar.disabled = false;
    btnRegistrarSalida.disabled = false;
    btnRegistrar.textContent = "Registrar marcaje";
    updateClockPanel();
    updatePrimaryAction();
  }
}

async function registerExit(recordId = null, recordName = null) {
  if (isSubmitting) {
    return;
  }

  const role = rolEl.value;
  const selectedName = nombreEl.value;
  const name = recordName || selectedName;
  const fecha = getFechaLocal();
  const now = new Date();
  const horaSalida = now.toISOString();
  const horaVisible = formatHora(now);

  if (!name) {
    setMessage("error", "Selecciona una persona para registrar la salida.");
    return;
  }

  isSubmitting = true;
  btnRegistrar.disabled = true;
  btnRegistrarSalida.disabled = true;
  btnAccionPrincipal.disabled = true;
  btnRegistrarSalida.textContent = "Registrando salida...";
  setMessage("info", `Procesando salida para ${name}.`);

  try {
    let recordToUpdate = null;

    if (recordId) {
      const { data, error } = await supabase
        .from("marcaje_personal")
        .select("id, nombre, rol, bloque, fecha, hora_entrada, hora_salida")
        .eq("id", recordId)
        .eq("fecha", fecha)
        .maybeSingle();

      if (error) {
        throw new Error("Supabase no pudo validar el registro de salida. Intenta nuevamente.");
      }

      recordToUpdate = data;
    } else {
      let query = supabase
        .from("marcaje_personal")
        .select("id, nombre, rol, bloque, fecha, hora_entrada, hora_salida")
        .eq("nombre", name)
        .eq("fecha", fecha)
        .order("hora_entrada", { ascending: false });

      if (role) {
        query = query.eq("rol", role);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error("Supabase no pudo buscar la entrada abierta para registrar la salida. Intenta nuevamente.");
      }

      recordToUpdate = (data || []).find((record) => record.hora_entrada && !hasStoredTime(record.hora_salida)) || null;
    }

    if (!recordToUpdate) {
      setMessage("error", `No existe una entrada abierta hoy para ${name}. Primero registra la entrada.`);
      return;
    }

    if (!recordToUpdate.hora_entrada) {
      setMessage("error", `No existe una entrada abierta hoy para ${name}. Primero registra la entrada.`);
      return;
    }

    if (hasStoredTime(recordToUpdate.hora_salida)) {
      setMessage("error", `La salida de hoy para ${name} ya estaba registrada en el bloque ${recordToUpdate.bloque || "sin bloque"}.`);
      return;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("marcaje_personal")
      .update({ hora_salida: horaSalida })
      .eq("id", recordToUpdate.id)
      .select("id, hora_salida");

    if (updateError || !updatedRows || updatedRows.length === 0) {
      throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
    }

    setMessage("success", `Salida registrada con éxito para ${name}. Hora: ${horaVisible}.`);
    await loadTodayRecords();
  } catch (error) {
    console.error(error);
    setMessage("error", error.message || "Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
  } finally {
    isSubmitting = false;
    btnRegistrar.disabled = false;
    btnRegistrarSalida.disabled = false;
    btnRegistrarSalida.textContent = "Registrar salida";
    updateClockPanel();
    updatePrimaryAction();
  }
}

function startClock() {
  if (clockTimerId) {
    window.clearInterval(clockTimerId);
  }

  updateClockPanel();
  clockTimerId = window.setInterval(updateClockPanel, 1000);
}

rolEl.addEventListener("change", () => {
  syncRoleToggleState();
  poblarNombres();
  updatePrimaryAction();
});

nombreEl.addEventListener("change", updatePrimaryAction);

roleToggleEls.forEach((button) => {
  button.addEventListener("click", () => {
    rolEl.value = button.dataset.roleValue || "";
    rolEl.dispatchEvent(new Event("change", { bubbles: true }));
    nombreEl.focus();
  });
});

btnRegistrar.addEventListener("click", registerAttendance);
btnRegistrarSalida.addEventListener("click", () => registerExit());
btnActualizar.addEventListener("click", loadTodayRecords);
btnAccionPrincipal.addEventListener("click", () => {
  const mode = btnAccionPrincipal.dataset.mode;

  if (mode === "entry") {
    registerAttendance();
    return;
  }

  if (mode === "exit") {
    registerExit();
  }
});

listaRegistrosEl.addEventListener("click", (event) => {
  const actionButton = event.target.closest('[data-action="registrar-salida"]');

  if (!actionButton) {
    return;
  }

  const recordId = actionButton.dataset.recordId?.trim();
  const recordName = actionButton.dataset.recordName || "";

  if (!recordId) {
    setMessage("error", "No se pudo identificar el registro para guardar la salida.");
    return;
  }

  registerExit(recordId, recordName);
});

syncRoleToggleState();
poblarNombres();
updatePrimaryAction();
startClock();
loadTodayRecords();
