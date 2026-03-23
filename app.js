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
const btnAccionPrincipal = document.getElementById("btnAccionPrincipal");
const estadoUsuarioTextoEl = document.getElementById("estadoUsuarioTexto");
const estadoUsuarioDetalleEl = document.getElementById("estadoUsuarioDetalle");
const estadoUsuarioPanelEl = document.getElementById("estadoUsuarioPanel");
const roleToggleEls = Array.from(document.querySelectorAll(".role-toggle"));

let todayRecords = [];

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

  setMessage("info", "Selecciona una persona y luego registra la entrada o la salida desde este formulario.");
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

function hasStoredTime(value) {
  return typeof value === "string" ? value.trim() !== "" : Boolean(value);
}

function formatStoredTime(value) {
  if (!hasStoredTime(value)) {
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
  btnAccionPrincipal.disabled = status.buttonMode === "disabled" || status.buttonMode === "completed" || isSubmitting;
  btnAccionPrincipal.dataset.mode = status.buttonMode;
}

function syncRoleToggleState() {
  roleToggleEls.forEach((button) => {
    const isActive = button.dataset.roleValue === rolEl.value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
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
      const hasExitTime = hasStoredTime(record.hora_salida);
      const exitTime = hasExitTime ? formatStoredTime(record.hora_salida) : "Sin salida";
      const exitAction = getExitAction(record);
      const progressLabel = hasStoredTime(record.hora_salida)
        ? "Completo"
        : record.hora_entrada
          ? "Pendiente salida"
          : "Entrada";
      const progressClass = hasStoredTime(record.hora_salida)
        ? "badge-complete"
        : record.hora_entrada
          ? "badge-warn"
          : "badge-ok";

      return `
        <article class="registro">
          <div class="record-main">
            <div>
              <h3 class="record-name">${escapeHtml(record.nombre)}</h3>
              <p class="record-subline">Bloque: ${escapeHtml(record.bloque || "Sin bloque")}</p>
            </div>
            <span class="record-role">${escapeHtml(record.rol)}</span>
          </div>
          <div class="record-grid">
            <div class="record-cell">
              <span class="record-label">Hora</span>
              <strong>${escapeHtml(formatStoredTime(entryTime))}</strong>
              <p class="record-subline">Salida: ${escapeHtml(exitTime)}</p>
            </div>
            <div class="record-cell">
              <span class="record-label">Estado</span>
              <span class="badge ${progressClass}">${escapeHtml(progressLabel)}</span>
              <p class="record-subline">Marcaje: ${escapeHtml(statusValue || "sin estado")}</p>
            </div>
          </div>
          <div class="registro-actions">
            ${exitAction}
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
  } finally {
    isLoadingList = false;
    btnActualizar.disabled = false;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function refreshRecordsAfterUpdate() {
  await loadTodayRecords();
  updatePrimaryAction();
  await wait(300);
  await loadTodayRecords();
  updatePrimaryAction();
}

function applyExitUpdateToCurrentState(recordId, horaSalida) {
  const normalizedRecordId = String(recordId);
  let didUpdate = false;

  todayRecords = todayRecords.map((record) => {
    if (String(record.id) !== normalizedRecordId) {
      return record;
    }

    didUpdate = true;
    return {
      ...record,
      hora_salida: horaSalida
    };
  });

  if (didUpdate) {
    renderRecords(todayRecords);
    updatePrimaryAction();
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
  btnAccionPrincipal.disabled = true;
  btnRegistrar.textContent = "Registrando...";
  btnAccionPrincipal.textContent = "Registrando entrada...";
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
    await refreshRecordsAfterUpdate();
  } catch (error) {
    console.error(error);
    setMessage("error", error.message || "Supabase devolvió un error al registrar la entrada. Intenta nuevamente.");
  } finally {
    isSubmitting = false;
    btnRegistrar.disabled = false;
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
  const name = recordName || nombreEl.value;
  const now = new Date();
  const fecha = getFechaLocal(now);
  const horaSalida = getHoraLocal(now);
  const horaVisible = formatHora(now);
  const targetButton = recordId
    ? listaRegistrosEl.querySelector(`[data-action="registrar-salida"][data-record-id="${recordId}"]`)
    : btnRegistrarSalida;

  if (!recordId) {
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
  }

  isSubmitting = true;
  btnRegistrarSalida.disabled = true;
  btnAccionPrincipal.disabled = true;

  if (targetButton) {
    targetButton.disabled = true;
    targetButton.textContent = "Registrando salida...";
  }

  if (!recordId) {
    btnRegistrarSalida.textContent = "Registrando salida...";
    btnAccionPrincipal.textContent = "Registrando salida...";
    setMessage("info", `Buscando la entrada abierta de hoy para ${name} y completando su salida.`);
  } else {
    setMessage("info", `Registrando la salida del registro de ${name}.`);
  }

  let previousRecordsSnapshot = null;

  try {
    let targetRecordId = recordId;
    let targetRecordName = name;

    if (!targetRecordId) {
      const searchFilters = {
        nombre: name,
        rol: role || null,
        fecha,
        hora_entrada_requerida: true,
        hora_salida_pendiente: [null, ""]
      };
      console.debug("Registrar salida: buscando registro abierto", {
        selectedName: name,
        selectedRole: role,
        fecha,
        filters: searchFilters
      });

      let searchQuery = supabase
        .from("marcaje_personal")
        .select("id, nombre, rol, bloque, fecha, hora, hora_entrada, hora_salida")
        .eq("nombre", name)
        .eq("fecha", fecha)
        .not("hora_entrada", "is", null)
        .order("hora_entrada", { ascending: false })
        .order("hora", { ascending: false });

      if (role) {
        searchQuery = searchQuery.eq("rol", role);
      }

      const { data: candidateRecords, error: searchError } = await searchQuery;

      if (searchError) {
        console.error("Error real buscando entrada abierta para registrar salida", {
          selectedName: name,
          selectedRole: role,
          fecha,
          filters: searchFilters,
          searchError
        });
        throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
      }

      const matchingRecords = (candidateRecords || []).filter((record) => record.nombre === name && (!role || record.rol === role));
      const openRecord = matchingRecords.find((record) => !hasStoredTime(record.hora_salida));

      if (!openRecord) {
        const latestRecord = matchingRecords[0];

        if (latestRecord && hasStoredTime(latestRecord.hora_salida)) {
          setMessage("error", `La salida de hoy para ${name} ya estaba registrada en el bloque ${latestRecord.bloque || "sin bloque"}.`);
          return;
        }

        setMessage("error", `No existe una entrada abierta hoy para ${name}. Primero registra la entrada y luego intenta nuevamente.`);
        return;
      }

      targetRecordId = openRecord.id;
      targetRecordName = openRecord.nombre || targetRecordName;
    }

    const targetFilters = {
      id: targetRecordId,
      nombre: targetRecordName || name,
      rol: role || null,
      fecha
    };
    console.debug("Registrar salida: validando registro objetivo", {
      selectedName: name,
      selectedRole: role,
      fecha,
      filters: targetFilters
    });

    let targetRecordQuery = supabase
      .from("marcaje_personal")
      .select("id, nombre, rol, bloque, fecha, hora, hora_entrada, hora_salida")
      .eq("id", targetRecordId)
      .eq("nombre", targetRecordName || name)
      .eq("fecha", fecha);

    if (role) {
      targetRecordQuery = targetRecordQuery.eq("rol", role);
    }

    const { data: recordToUpdate, error: targetRecordError } = await targetRecordQuery.maybeSingle();

    if (targetRecordError) {
      console.error("Error real validando registro a cerrar", {
        selectedName: name,
        selectedRole: role,
        fecha,
        filters: targetFilters,
        targetRecordError
      });
      throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
    }

    if (!recordToUpdate) {
      setMessage("error", "No se encontró el registro pendiente de hoy para guardar la salida.");
      return;
    }

    if (!recordId && (recordToUpdate.nombre !== name || recordToUpdate.rol !== role)) {
      console.error("Registro abierto no coincide con la selección actual", { selectedName: name, selectedRole: role, recordToUpdate });
      throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
    }

    if (!recordToUpdate.hora_entrada) {
      setMessage("error", `No existe una entrada abierta hoy para ${targetRecordName}. Primero registra la entrada y luego intenta nuevamente.`);
      return;
    }

    if (hasStoredTime(recordToUpdate.hora_salida)) {
      setMessage("error", `La salida de hoy para ${targetRecordName} ya estaba registrada en el bloque ${recordToUpdate.bloque || "sin bloque"}.`);
      return;
    }

    const updateFilters = {
      id: recordToUpdate.id,
      nombre: targetRecordName,
      rol: role || null,
      fecha,
      hora_salida_pendiente: [null, ""]
    };
    console.debug("Registrar salida: actualizando registro abierto", {
      selectedName: name,
      selectedRole: role,
      fecha,
      horaSalida,
      filters: updateFilters
    });

    let updateQuery = supabase
      .from("marcaje_personal")
      .update({ hora_salida: horaSalida })
      .eq("id", recordToUpdate.id)
      .eq("nombre", targetRecordName)
      .eq("fecha", fecha)
      .or("hora_salida.is.null,hora_salida.eq.")
      .select("id, nombre, fecha, hora_salida");

    if (role) {
      updateQuery = updateQuery.eq("rol", role);
    }

    const { data: updatedRecords, error: updateError } = await updateQuery;
    const updatedRecord = Array.isArray(updatedRecords) ? updatedRecords[0] : updatedRecords;

    if (updateError || !updatedRecord) {
      console.error("Error real guardando salida en Supabase", {
        selectedName: name,
        selectedRole: role,
        targetRecordId: recordToUpdate.id,
        fecha,
        horaSalida,
        filters: updateFilters,
        updateError,
        updatedRecords
      });
      throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
    }

    const savedExitTime = updatedRecord.hora_salida || horaSalida;
    previousRecordsSnapshot = todayRecords.map((record) => ({ ...record }));
    applyExitUpdateToCurrentState(recordToUpdate.id, savedExitTime);
    await refreshRecordsAfterUpdate();

    const confirmedRecord = todayRecords.find((record) => String(record.id) === String(recordToUpdate.id));
    const hasConfirmedExit = hasStoredTime(confirmedRecord?.hora_salida);

    if (!hasConfirmedExit) {
      console.error("La recarga no reflejó la salida guardada", { targetRecordId: recordToUpdate.id, confirmedRecord, todayRecords });
      throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
    }

    setMessage("success", `Salida registrada con éxito para ${targetRecordName}. Se actualizó el registro seleccionado del día. Hora: ${horaVisible}.`);
  } catch (error) {
    if (previousRecordsSnapshot) {
      todayRecords = previousRecordsSnapshot;
      renderRecords(todayRecords);
      updatePrimaryAction();
    }

    console.error(error);
    setMessage(
      "error",
      error.message === "Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente."
        ? error.message
        : "Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente."
    );
  } finally {
    isSubmitting = false;
    btnRegistrarSalida.disabled = false;

    if (targetButton) {
      targetButton.disabled = false;
      targetButton.textContent = "Registrar salida";
    }

    btnRegistrarSalida.textContent = "Registrar salida";
    updateClockPanel();
    updatePrimaryAction();
  }
}

function startClock() {
  updateClockPanel();
  clockTimerId = window.setInterval(updateClockPanel, 1000);
}

rolEl.addEventListener("change", () => {
  syncRoleToggleState();
  populateNames();
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
btnRegistrarSalida.addEventListener("click", registerExit);
btnActualizar.addEventListener("click", loadTodayRecords);
btnAccionPrincipal.addEventListener("click", () => {
  const mode = btnAccionPrincipal.dataset.mode;

  if (mode === "entry") {
    btnRegistrar.click();
    return;
  }

  if (mode === "exit") {
    btnRegistrarSalida.click();
  }
});
listaRegistrosEl.addEventListener("click", (event) => {
  const actionButton = event.target.closest('[data-action="registrar-salida"]');

  if (!actionButton) {
    return;
  }

  const recordId = actionButton.dataset.recordId?.trim();
  const recordName = actionButton.dataset.recordName || "la persona seleccionada";

  if (!recordId) {
    setMessage("error", "No se pudo identificar el registro para guardar la salida.");
    return;
  }

  registerExit(recordId, recordName);
});

syncRoleToggleState();
populateNames();
updatePrimaryAction();
startClock();
loadTodayRecords();

window.addEventListener("beforeunload", () => {
  if (clockTimerId) {
    window.clearInterval(clockTimerId);
  }
});
