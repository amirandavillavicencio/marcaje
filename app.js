import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://mqyoetrswxefgobfmldf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GGE5Mo0YGiIEkDYBsAkH9w_D9yvGQdr";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const personas = [
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

const rolEl = document.getElementById("rol");
const nombreEl = document.getElementById("nombre");
const bloqueEl = document.getElementById("bloque");
const estadoEl = document.getElementById("estado");
const observacionEl = document.getElementById("observacion");
const btnRegistrar = document.getElementById("btnRegistrar");
const btnActualizar = document.getElementById("btnActualizar");
const mensajeEl = document.getElementById("mensaje");
const listaRegistrosEl = document.getElementById("listaRegistros");

function getFechaLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function poblarNombres() {
  const rolSeleccionado = rolEl.value;
  nombreEl.innerHTML = '<option value="">Selecciona una persona</option>';

  if (!rolSeleccionado) return;

  const filtradas = personas.filter((p) => p.rol === rolSeleccionado);

  filtradas.forEach((persona) => {
    const option = document.createElement("option");
    option.value = persona.nombre;
    option.textContent = persona.nombre;
    nombreEl.appendChild(option);
  });
}

async function registrarAsistencia() {
  const rol = rolEl.value;
  const nombre = nombreEl.value;
  const bloque = bloqueEl.value;
  const estado = estadoEl.value;
  const observacion = observacionEl.value.trim();
  const fecha = getFechaLocal();

  if (!rol || !nombre || !bloque) {
    mensajeEl.textContent = "Completa rol, nombre y bloque.";
    return;
  }

  mensajeEl.textContent = "Registrando...";

  const { data: existente, error: errorBusqueda } = await supabase
    .from("marcaje_personal")
    .select("id")
    .eq("nombre", nombre)
    .eq("rol", rol)
    .eq("fecha", fecha)
    .eq("bloque", bloque)
    .limit(1);

  if (errorBusqueda) {
    console.error(errorBusqueda);
    mensajeEl.textContent = "Error al validar registro existente.";
    return;
  }

  if (existente && existente.length > 0) {
    mensajeEl.textContent = "Esa persona ya fue registrada hoy en ese bloque.";
    return;
  }

  const { error } = await supabase
    .from("marcaje_personal")
    .insert([
      {
        nombre,
        rol,
        fecha,
        bloque,
        estado,
        observacion,
        registrado_por: "recepcion"
      }
    ]);

  if (error) {
    console.error(error);
    mensajeEl.textContent = "Error al registrar asistencia.";
    return;
  }

  mensajeEl.textContent = "Asistencia registrada correctamente.";
  observacionEl.value = "";
  await cargarRegistrosHoy();
}

async function cargarRegistrosHoy() {
  listaRegistrosEl.innerHTML = "Cargando registros...";
  const fecha = getFechaLocal();

  const { data, error } = await supabase
    .from("marcaje_personal")
    .select("nombre, rol, bloque, estado, hora, observacion")
    .eq("fecha", fecha)
    .order("hora", { ascending: false });

  if (error) {
    console.error(error);
    listaRegistrosEl.innerHTML = "No se pudieron cargar los registros.";
    return;
  }

  if (!data || data.length === 0) {
    listaRegistrosEl.innerHTML = "No hay registros hoy.";
    return;
  }

  listaRegistrosEl.innerHTML = data
    .map((registro) => {
      const hora = new Date(registro.hora).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      return `
        <div class="registro">
          <strong>${registro.nombre}</strong><br>
          Rol: ${registro.rol} · Bloque: ${registro.bloque} · Estado: ${registro.estado} · Hora: ${hora}
          ${registro.observacion ? `<br>Obs: ${registro.observacion}` : ""}
        </div>
      `;
    })
    .join("");
}

rolEl.addEventListener("change", poblarNombres);
btnRegistrar.addEventListener("click", registrarAsistencia);
btnActualizar.addEventListener("click", cargarRegistrosHoy);

cargarRegistrosHoy();
