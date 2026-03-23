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
  // Ajustar estos horarios si cambia el horario institucional real.
  { nombre: "3-4", inicio: "09:40", fin: "11:09" },
  { nombre: "5-6", inicio: "11:10", fin: "12:39" },
  { nombre: "almuerzo", inicio: "12:40", fin: "14:09" },
  { nombre: "7-8", inicio: "14:10", fin: "15:39" },
  { nombre: "9-10", inicio: "15:40", fin: "17:09" }
];

const MINUTOS_PRESENTE = 5;

const rolEl = document.getElementById("rol");
const nombreEl = document.getElementById("nombre");
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
const roleToggleEls = Array.from(document.querySelectorAll(".role-toggle"));

let todayRecords = [];

let isSubmitting = false;
let isLoadingList = false;
let clockTimerId = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function getMinutosDelDia(fecha = new Date()) {
  return fecha.getHours() * 60 + fecha.getMinutes();
}

function parseHora(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
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
      estado: minutosActuales <= inicio + MINUTOS_PRESENTE - 1 ? "presente" : "atrasado"
    };
  }

  return null;
}

function actualizarDeteccionVisual() {
  const deteccion = detectarMarcaje();

  if (!deteccion) {
    bloqueDetectadoEl.textContent = "Sin bloque válido";
    estadoDetectadoEl.textContent = "No registrable";
    return;
  }

  bloqueDetectadoEl.textContent = deteccion.bloque;
  estadoDetectadoEl.textContent = deteccion.estado;
}

function poblarNombres() {
  const rolSeleccionado = rolEl.value;
  nombreEl.innerHTML = '<option value="">Selecciona una persona</option>';

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

async function registrarAsistencia() {
  const rol = rolEl.value;
  const nombre = nombreEl.value;
  const observacion = observacionEl.value.trim();
  const fecha = getFechaLocal();
  const deteccion = detectarMarcaje();

  if (!rol || !nombre) {
    mensajeEl.textContent = "Completa rol y nombre.";
    return;
  }

  if (!deteccion) {
    actualizarDeteccionVisual();
    mensajeEl.textContent = "No se puede registrar: la hora actual no corresponde a ningún bloque válido.";
    return;
  }

  const { bloque, estado } = deteccion;
  actualizarDeteccionVisual();
  mensajeEl.textContent = `Registrando... Bloque detectado: ${bloque}. Estado detectado: ${estado}.`;

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

  if (existente && existente.length > 0) {
    mensajeEl.textContent = `Esa persona ya fue registrada hoy en el bloque ${bloque}. Estado detectado: ${estado}.`;
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

  mensajeEl.textContent = `Asistencia registrada correctamente. Bloque detectado: ${bloque}. Estado detectado: ${estado}.`;
  observacionEl.value = "";
  await cargarRegistrosHoy();
}

      if (role) {
        searchQuery = searchQuery.eq("rol", role);
      }

      const { data: candidateRecords, error: searchError, count: candidateCount } = await searchQuery;

      if (searchError) {
        console.error("Error real buscando entrada abierta para registrar salida", {
          selectedPerson: name,
          selectedRole: role || null,
          fecha,
          filters: searchFilters,
          error: searchError,
          fullError: searchError
        });
        throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
      }

      const matchingRecords = (candidateRecords || []).filter((record) => record.nombre === name && (!role || record.rol === role));
      logExitContext("resultado búsqueda registro abierto", {
        filters: searchFilters,
        rowsMatched: candidateCount ?? matchingRecords.length,
        candidateRecords,
        matchingRows: matchingRecords.length
      });
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
    logExitContext("validando registro objetivo", { filters: targetFilters });

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
        selectedPerson: name,
        selectedRole: role || null,
        fecha,
        filters: targetFilters,
        error: targetRecordError,
        fullError: targetRecordError
      });
      throw new Error("Supabase no pudo guardar la salida. Revisa la conexión e intenta nuevamente.");
    }

    if (!recordToUpdate) {
      setMessage("error", "No se encontró el registro pendiente de hoy para guardar la salida.");
      return;
    }

    if (!recordId && (recordToUpdate.nombre !== name || recordToUpdate.rol !== role)) {
      console.error("Registro abierto no coincide con la selección actual", {
        selectedPerson: name,
        selectedRole: role || null,
        recordToUpdate
      });
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
      hora_entrada: recordToUpdate.hora_entrada,
      hora_salida_actual: recordToUpdate.hora_salida ?? null
    };
    logExitContext("actualizando registro abierto", {
      horaSalida,
      filters: updateFilters,
      rowsMatched: 1
    });

    let updateQuery = supabase
      .from("marcaje_personal")
      .update({ hora_salida: horaSalida })
      .eq("id", recordToUpdate.id)
      .eq("nombre", targetRecordName)
      .eq("fecha", fecha)
      .select("id, nombre, rol, fecha, hora_entrada, hora_salida");

    if (role) {
      updateQuery = updateQuery.eq("rol", role);
    }

    const { data: updatedRecords, error: updateError } = await updateQuery;
    const updatedRecord = Array.isArray(updatedRecords) ? updatedRecords[0] : updatedRecords;

    if (updateError || !updatedRecord) {
      console.error("Error real guardando salida en Supabase", {
        selectedPerson: name,
        selectedRole: role || null,
        targetRecordId: recordToUpdate.id,
        fecha,
        horaSalida,
        filters: updateFilters,
        rowsMatched: Array.isArray(updatedRecords) ? updatedRecords.length : updatedRecords ? 1 : 0,
        error: updateError,
        fullError: updateError,
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

actualizarDeteccionVisual();
setInterval(actualizarDeteccionVisual, 30000);
cargarRegistrosHoy();
