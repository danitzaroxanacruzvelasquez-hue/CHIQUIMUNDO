"use strict";

/* =========================================================
   DATOS DE LOS JUEGOS
========================================================= */

const vocales = ["a", "e", "i", "o", "u"];

const elementos = [
  { nombre: "auto", emoji: "🚗", tipo: "objeto" },
  { nombre: "casa", emoji: "🏠", tipo: "objeto" },
  { nombre: "televisión", emoji: "📺", tipo: "objeto" },
  { nombre: "celular", emoji: "📱", tipo: "objeto" },
  { nombre: "silla", emoji: "🪑", tipo: "objeto" },
  { nombre: "mochila", emoji: "🎒", tipo: "objeto" },

  { nombre: "gato", emoji: "🐱", tipo: "animal" },
  { nombre: "vaca", emoji: "🐮", tipo: "animal" },
  { nombre: "elefante", emoji: "🐘", tipo: "animal" },
  { nombre: "tigre", emoji: "🐯", tipo: "animal" },
  { nombre: "perro", emoji: "🐶", tipo: "animal" },
  { nombre: "león", emoji: "🦁", tipo: "animal" },
  { nombre: "conejo", emoji: "🐰", tipo: "animal" }
];

/*
  Algunos sistemas no tienen un emoji exclusivo para "mesa".
  Para diferenciarla de la silla se crea una representación
  visual especial mediante texto y emoji.
*/
const representacionEspecial = {
  mesa: "🍽️",
  silla: "🪑"
};

/* =========================================================
   ELEMENTOS DEL DOM
========================================================= */

const pantallas = {
  inicio: document.getElementById("pantallaInicio"),
  juego: document.getElementById("pantallaJuego"),
  resultado: document.getElementById("pantallaResultado")
};

const estrellasTotales = document.getElementById("estrellasTotales");
const botonSonido = document.getElementById("botonSonido");
const botonLogo = document.getElementById("botonLogo");
const botonVolver = document.getElementById("botonVolver");

const tituloJuego = document.getElementById("tituloJuego");
const preguntaActual = document.getElementById("preguntaActual");
const totalPreguntas = document.getElementById("totalPreguntas");
const puntajeActual = document.getElementById("puntajeActual");
const rellenoProgreso = document.getElementById("rellenoProgreso");
const barraProgreso = document.querySelector(".barra-progreso");

const distintivoTipo = document.getElementById("distintivoTipo");
const instruccionJuego = document.getElementById("instruccionJuego");
const ayudaJuego = document.getElementById("ayudaJuego");
const botonEscuchar = document.getElementById("botonEscuchar");
const textoEscuchar = document.getElementById("textoEscuchar");
const opcionesJuego = document.getElementById("opcionesJuego");
const mensajeRespuesta = document.getElementById("mensajeRespuesta");

const medallaResultado = document.getElementById("medallaResultado");
const tituloResultado = document.getElementById("tituloResultado");
const mensajeResultado = document.getElementById("mensajeResultado");
const resultadoAciertos = document.getElementById("resultadoAciertos");
const resultadoPorcentaje = document.getElementById("resultadoPorcentaje");
const resultadoEstrellas = document.getElementById("resultadoEstrellas");
const botonRepetir = document.getElementById("botonRepetir");
const botonInicioResultado = document.getElementById("botonInicioResultado");
const confeti = document.getElementById("confeti");

/* =========================================================
   ESTADO
========================================================= */

let tipoJuegoActual = "";
let preguntas = [];
let indicePregunta = 0;
let aciertos = 0;
let estrellasPartida = 0;
let bloqueado = false;
let sonidoActivo = true;
let textoPreguntaActual = "";
let temporizadorSiguiente = null;

let estrellasGuardadas = Number(
  localStorage.getItem("estrellasJuegoInfantil") || 0
);

actualizarEstrellasTotales();

/* =========================================================
   EVENTOS
========================================================= */

document.querySelectorAll("[data-juego]").forEach((boton) => {
  boton.addEventListener("click", () => {
    iniciarJuego(boton.dataset.juego);
  });
});

botonVolver.addEventListener("click", volverAlInicio);
botonLogo.addEventListener("click", volverAlInicio);
botonInicioResultado.addEventListener("click", volverAlInicio);

botonRepetir.addEventListener("click", () => {
  iniciarJuego(tipoJuegoActual);
});

botonEscuchar.addEventListener("click", () => {
  hablar(textoPreguntaActual);
});

botonSonido.addEventListener("click", () => {
  sonidoActivo = !sonidoActivo;
  botonSonido.textContent = sonidoActivo ? "🔊" : "🔇";
  botonSonido.setAttribute(
    "aria-label",
    sonidoActivo ? "Desactivar sonido" : "Activar sonido"
  );

  if (!sonidoActivo && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  } else {
    hablar("Sonido activado");
  }
});

window.addEventListener("beforeunload", () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

/* =========================================================
   NAVEGACIÓN
========================================================= */

function mostrarPantalla(nombre) {
  Object.values(pantallas).forEach((pantalla) => {
    pantalla.classList.remove("activa");
  });

  pantallas[nombre].classList.add("activa");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function volverAlInicio() {
  clearTimeout(temporizadorSiguiente);

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  bloqueado = false;
  mostrarPantalla("inicio");
}

/* =========================================================
   INICIO DE JUEGOS
========================================================= */

function iniciarJuego(tipo) {
  clearTimeout(temporizadorSiguiente);

  tipoJuegoActual = tipo;
  indicePregunta = 0;
  aciertos = 0;
  estrellasPartida = 0;
  bloqueado = false;

  if (tipo === "vocales") {
    preguntas = crearPreguntasVocales(10);
    tituloJuego.textContent = "Las vocales";
  } else if (tipo === "imagenes") {
    preguntas = crearPreguntasImagenes(10);
    tituloJuego.textContent = "Objetos y animales";
  } else {
    preguntas = crearEvaluacion(12);
    tituloJuego.textContent = "Gran aventura";
  }

  totalPreguntas.textContent = preguntas.length;
  puntajeActual.textContent = "0";

  mostrarPantalla("juego");
  mostrarPregunta();
}

/* =========================================================
   CREACIÓN DE PREGUNTAS
========================================================= */

function crearPreguntasVocales(cantidad) {
  const lista = [];

  for (let i = 0; i < cantidad; i++) {
    const respuesta = vocales[i % vocales.length];

    lista.push({
      clase: "vocal",
      respuesta,
      opciones: mezclar([...vocales]),
      textoVoz: `Escucha con atención. ¿Qué vocal es? ${respuesta}. ${respuesta}.`,
      instruccion: "¿Qué vocal escuchas?",
      ayuda: "Toca el botón de sonido y elige la vocal correcta."
    });
  }

  return mezclar(lista);
}

function crearPreguntasImagenes(cantidad) {
  const listaMezclada = mezclar([...elementos]);
  const lista = [];

  for (let i = 0; i < cantidad; i++) {
    const respuesta = listaMezclada[i % listaMezclada.length];
    const distractores = mezclar(
      elementos.filter((elemento) => elemento.nombre !== respuesta.nombre)
    ).slice(0, 5);

    lista.push({
      clase: "imagen",
      respuesta: respuesta.nombre,
      opciones: mezclar([respuesta, ...distractores]),
      textoVoz: `Busca y toca ${articuloPara(respuesta)} ${respuesta.nombre}.`,
      instruccion: `¿Dónde está ${articuloPara(respuesta)} ${respuesta.nombre}?`,
      ayuda: "Observa las imágenes y toca la respuesta correcta.",
      categoria: respuesta.tipo
    });
  }

  return lista;
}

function crearEvaluacion(cantidad) {
  const cantidadVocales = Math.floor(cantidad / 2);
  const cantidadImagenes = cantidad - cantidadVocales;

  const lista = [
    ...crearPreguntasVocales(cantidadVocales),
    ...crearPreguntasImagenes(cantidadImagenes)
  ];

  return mezclar(lista);
}

function articuloPara(elemento) {
  const femeninas = [
    "mesa",
    "casa",
    "televisión",
    "silla",
    "mochila",
    "vaca"
  ];

  return femeninas.includes(elemento.nombre) ? "la" : "el";
}

/* =========================================================
   MOSTRAR PREGUNTAS
========================================================= */

function mostrarPregunta() {
  bloqueado = false;
  mensajeRespuesta.textContent = "";
  mensajeRespuesta.className = "mensaje-respuesta";

  const pregunta = preguntas[indicePregunta];
  const numero = indicePregunta + 1;
  const progreso = (indicePregunta / preguntas.length) * 100;

  preguntaActual.textContent = numero;
  puntajeActual.textContent = aciertos;
  rellenoProgreso.style.width = `${progreso}%`;
  barraProgreso.setAttribute("aria-valuenow", Math.round(progreso));

  instruccionJuego.textContent = pregunta.instruccion;
  ayudaJuego.textContent = pregunta.ayuda;
  textoPreguntaActual = pregunta.textoVoz;

  opcionesJuego.innerHTML = "";

  if (pregunta.clase === "vocal") {
    configurarPreguntaVocal(pregunta);
  } else {
    configurarPreguntaImagen(pregunta);
  }

  setTimeout(() => hablar(textoPreguntaActual), 350);
}

function configurarPreguntaVocal(pregunta) {
  distintivoTipo.textContent =
    tipoJuegoActual === "evaluacion"
      ? "Desafío de vocales"
      : "Escucha con atención";

  botonEscuchar.classList.remove("oculto");
  textoEscuchar.textContent = "Escuchar otra vez";

  opcionesJuego.className = "opciones-juego";

  pregunta.opciones.forEach((vocal) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "opcion opcion-vocal";
    boton.textContent = vocal.toUpperCase();
    boton.setAttribute("aria-label", `Vocal ${vocal}`);
    boton.dataset.valor = vocal;

    boton.addEventListener("click", () => {
      comprobarRespuesta(vocal, pregunta.respuesta, boton);
    });

    opcionesJuego.appendChild(boton);
  });
}

function configurarPreguntaImagen(pregunta) {
  distintivoTipo.textContent =
    pregunta.categoria === "animal"
      ? "Aventura de animales"
      : "Aventura de objetos";

  botonEscuchar.classList.remove("oculto");
  textoEscuchar.textContent = "Escuchar la pregunta";

  opcionesJuego.className = "opciones-juego imagenes";

  pregunta.opciones.forEach((elemento) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "opcion opcion-imagen";
    boton.dataset.valor = elemento.nombre;
    boton.setAttribute("aria-label", elemento.nombre);

    const emoji = representacionEspecial[elemento.nombre] || elemento.emoji;

    boton.innerHTML = `
      <span class="emoji" aria-hidden="true">${emoji}</span>
      <span class="nombre">${elemento.nombre}</span>
    `;

    boton.addEventListener("click", () => {
      comprobarRespuesta(elemento.nombre, pregunta.respuesta, boton);
    });

    opcionesJuego.appendChild(boton);
  });
}

/* =========================================================
   RESPUESTAS
========================================================= */

function comprobarRespuesta(valorElegido, respuestaCorrecta, botonElegido) {
  if (bloqueado) return;

  bloqueado = true;

  const botones = opcionesJuego.querySelectorAll(".opcion");
  botones.forEach((boton) => {
    boton.disabled = true;
  });

  const esCorrecta = valorElegido === respuestaCorrecta;

  if (esCorrecta) {
    aciertos++;
    estrellasPartida += 3;
    botonElegido.classList.add("correcta");

    mensajeRespuesta.textContent = elegirMensaje([
      "¡Muy bien! ⭐",
      "¡Excelente respuesta! 🎉",
      "¡Lo hiciste genial! 🌟",
      "¡Correcto, pequeño explorador! 🚀"
    ]);

    mensajeRespuesta.classList.add("bien");
    puntajeActual.textContent = aciertos;

    reproducirTonoAcierto();
    hablar(`¡Muy bien! La respuesta es ${respuestaCorrecta}.`);
  } else {
    botonElegido.classList.add("incorrecta");

    const botonCorrecto = [...botones].find(
      (boton) => boton.dataset.valor === respuestaCorrecta
    );

    if (botonCorrecto) {
      botonCorrecto.classList.add("correcta");
    }

    mensajeRespuesta.textContent =
      `Casi. La respuesta era ${respuestaCorrecta}. ¡Sigue intentando!`;

    mensajeRespuesta.classList.add("mal");

    reproducirTonoSuave();
    hablar(
      `Casi. La respuesta correcta es ${respuestaCorrecta}. Sigue intentando.`
    );
  }

  temporizadorSiguiente = setTimeout(() => {
    indicePregunta++;

    if (indicePregunta < preguntas.length) {
      mostrarPregunta();
    } else {
      finalizarJuego();
    }
  }, 2300);
}

/* =========================================================
   RESULTADOS
========================================================= */

function finalizarJuego() {
  const porcentaje = Math.round((aciertos / preguntas.length) * 100);

  estrellasGuardadas += estrellasPartida;
  localStorage.setItem(
    "estrellasJuegoInfantil",
    String(estrellasGuardadas)
  );

  actualizarEstrellasTotales();

  resultadoAciertos.textContent = `${aciertos}/${preguntas.length}`;
  resultadoPorcentaje.textContent = `${porcentaje}%`;
  resultadoEstrellas.textContent = estrellasPartida;

  if (porcentaje >= 90) {
    medallaResultado.textContent = "🏆";
    tituloResultado.textContent = "¡Eres una superestrella!";
    mensajeResultado.textContent =
      "Reconociste casi todo. Has realizado un trabajo maravilloso.";
  } else if (porcentaje >= 70) {
    medallaResultado.textContent = "🥇";
    tituloResultado.textContent = "¡Excelente trabajo!";
    mensajeResultado.textContent =
      "Aprendiste muchísimo. Practica un poco más para conseguir el trofeo.";
  } else if (porcentaje >= 50) {
    medallaResultado.textContent = "🌟";
    tituloResultado.textContent = "¡Vas por muy buen camino!";
    mensajeResultado.textContent =
      "Cada intento te ayuda a aprender. Juega otra vez y mejora tu resultado.";
  } else {
    medallaResultado.textContent = "💪";
    tituloResultado.textContent = "¡Buen esfuerzo!";
    mensajeResultado.textContent =
      "Aprender lleva tiempo. Escucha con atención y vuelve a intentarlo.";
  }

  crearConfeti(porcentaje >= 50);
  mostrarPantalla("resultado");

  rellenoProgreso.style.width = "100%";
  barraProgreso.setAttribute("aria-valuenow", "100");

  setTimeout(() => {
    hablar(
      `${tituloResultado.textContent} Obtuviste ${aciertos} respuestas correctas.`
    );
  }, 450);
}

function actualizarEstrellasTotales() {
  estrellasTotales.textContent = estrellasGuardadas;
}

/* =========================================================
   VOZ
========================================================= */

function hablar(texto) {
  if (!sonidoActivo || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = "es-ES";
  mensaje.rate = 0.78;
  mensaje.pitch = 1.15;
  mensaje.volume = 1;

  const voces = window.speechSynthesis.getVoices();
  const vozEspanol = voces.find((voz) =>
    voz.lang.toLowerCase().startsWith("es")
  );

  if (vozEspanol) {
    mensaje.voice = vozEspanol;
  }

  mensaje.onstart = () => {
    botonEscuchar.classList.add("reproduciendo");
  };

  mensaje.onend = () => {
    botonEscuchar.classList.remove("reproduciendo");
  };

  mensaje.onerror = () => {
    botonEscuchar.classList.remove("reproduciendo");
  };

  window.speechSynthesis.speak(mensaje);
}

/*
  Algunos navegadores cargan las voces después de abrir la página.
  Esta asignación ayuda a que estén disponibles al primer clic.
*/
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

/* =========================================================
   EFECTOS DE AUDIO
========================================================= */

function reproducirTonoAcierto() {
  if (!sonidoActivo) return;

  try {
    const AudioContexto =
      window.AudioContext || window.webkitAudioContext;

    const contexto = new AudioContexto();
    const notas = [523.25, 659.25, 783.99];

    notas.forEach((frecuencia, indice) => {
      const oscilador = contexto.createOscillator();
      const ganancia = contexto.createGain();
      const inicio = contexto.currentTime + indice * 0.12;

      oscilador.type = "sine";
      oscilador.frequency.value = frecuencia;

      ganancia.gain.setValueAtTime(0.001, inicio);
      ganancia.gain.exponentialRampToValueAtTime(0.18, inicio + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.001, inicio + 0.28);

      oscilador.connect(ganancia);
      ganancia.connect(contexto.destination);

      oscilador.start(inicio);
      oscilador.stop(inicio + 0.3);
    });

    setTimeout(() => contexto.close(), 900);
  } catch (error) {
    console.info("El navegador no permitió reproducir el tono.");
  }
}

function reproducirTonoSuave() {
  if (!sonidoActivo) return;

  try {
    const AudioContexto =
      window.AudioContext || window.webkitAudioContext;

    const contexto = new AudioContexto();
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(330, contexto.currentTime);
    oscilador.frequency.exponentialRampToValueAtTime(
      260,
      contexto.currentTime + 0.25
    );

    ganancia.gain.setValueAtTime(0.12, contexto.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(
      0.001,
      contexto.currentTime + 0.35
    );

    oscilador.connect(ganancia);
    ganancia.connect(contexto.destination);

    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.36);

    setTimeout(() => contexto.close(), 600);
  } catch (error) {
    console.info("El navegador no permitió reproducir el tono.");
  }
}

/* =========================================================
   CONFETI Y UTILIDADES
========================================================= */

function crearConfeti(mostrar) {
  confeti.innerHTML = "";

  if (!mostrar) return;

  const figuras = ["⭐", "●", "◆", "▲", "🎉"];
  const colores = ["#ff5b67", "#ffd54a", "#3ddc97", "#536dfe", "#ff70a6"];

  for (let i = 0; i < 35; i++) {
    const pieza = document.createElement("span");

    pieza.textContent = figuras[Math.floor(Math.random() * figuras.length)];
    pieza.style.left = `${Math.random() * 100}%`;
    pieza.style.color = colores[Math.floor(Math.random() * colores.length)];
    pieza.style.fontSize = `${12 + Math.random() * 15}px`;
    pieza.style.setProperty("--duracion", `${3.5 + Math.random() * 3}s`);
    pieza.style.setProperty("--retraso", `${Math.random() * -5}s`);

    confeti.appendChild(pieza);
  }
}

function mezclar(lista) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const indiceAleatorio = Math.floor(Math.random() * (i + 1));

    [copia[i], copia[indiceAleatorio]] = [
      copia[indiceAleatorio],
      copia[i]
    ];
  }

  return copia;
}

function elegirMensaje(mensajes) {
  return mensajes[Math.floor(Math.random() * mensajes.length)];
}
