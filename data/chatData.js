const NuevaPersonaActions = require("../NuevaPersonaActions");
const NuevoReporteActions = require("../NuevoReporteActions");

const chatData = {
  menuPrincipal: {
    id: "menu-principal",
    body: NuevaPersonaActions.getMensajeMenuPrincipal,
  },
  cambiarGenealogia: {
    telefonoOrigen: {
      id: "cambiar-genealogia-telefono-origen",
      body: NuevaPersonaActions.getMensajeGenealogiaTelefonoOrigen,
    },
    telefonoDestino: {
      id: "cambiar-genealogia-telefono-destino",
      body: NuevaPersonaActions.getMensajeGenealogiaTelefonoDestino,
    },
    confirmacion: {
      id: "cambiar-genealogia-confirmacion",
      body: NuevaPersonaActions.getMensajeConfirmacionCambioGenealogia,
    },
  },
  nuevaPersona: {
    nombre: {
      id: "nueva-persona-nombre",
      body: NuevaPersonaActions.getMensajeNombre,
    },
    codigoPostal: {
      id: "nueva-persona-codigo-postal",
      body: NuevaPersonaActions.getMensajeCodigoPostal,
    },
    colonia: {
      id: "nueva-persona-colonia",
      body: NuevaPersonaActions.getMensajeColonias,
    },
    selfie: {
      id: "nueva-persona-selfie",
      body: "Por favor, envía una selfie. Solicitamos esto para verificar que seas una persona real, y no un bot.",
    },
    confirmacion: {
      id: "nueva-persona-confirmacion",
      body: NuevaPersonaActions.getMensajeConfirmacionRegistro,
    },
    redSocialFavorita: {
      id: "nueva-persona-red-social-favorita",
      body: `¿Cuál es tu red social que más usas? Por favor responde con el número correspondiente:
1. Twitter
2. Instagram
3. Facebook
4. TikTok
`,
    },
    twitter: {
      id: "nueva-persona-twitter",
      body: NuevaPersonaActions.getMensajePedirTwitter,
    },
    instagram: {
      id: "nueva-persona-instagram",
      body: NuevaPersonaActions.getMensajePedirInstagram,
    },
    facebook: {
      id: "nueva-persona-facebook",
      body: NuevaPersonaActions.getMensajePedirFacebook,
    },
    tiktok: {
      id: "nueva-persona-tiktok",
      body: NuevaPersonaActions.getMensajePedirTikTok,
    },
    temasDeInteres: {
      id: "nueva-persona-temas-de-interes",
      body: "Por favor, menciona tus temas de interés (opcional). Si no deseas compartirlos, escribe 'saltar'.",
    },
  },
  editarPersona: {
    menu: {
      id: "editar-persona-menu",
      body: NuevaPersonaActions.getMensajeEditarPersonaMenu,
    },
    nombre: {
      id: "editar-persona-nombre",
      body: "Escribe el nuevo nombre",
    },
    codigoPostal: {
      id: "editar-persona-codigo-postal",
      body: "Escribe el nuevo código postal",
    },
    colonia: {
      id: "editar-persona-colonia",
      body: NuevaPersonaActions.getMensajeColonias,
    },
    selfie: {
      id: "editar-persona-selfie",
      body: "Por favor, envía una nueva selfie.",
    },
    twitter: {
      id: "editar-persona-twitter",
      body: "Por favor, comparte tu nuevo usuario de Twitter.",
    },
    instagram: {
      id: "editar-persona-instagram",
      body: "Por favor, comparte tu nuevo usuario de Instagram.",
    },
    facebook: {
      id: "editar-persona-facebook",
      body: "Por favor, comparte tu nuevo usuario de Facebook.",
    },
    tiktok: {
      id: "editar-persona-tiktok",
      body: "Por favor, comparte tu nuevo usuario de TikTok.",
    },
    temasDeInteres: {
      id: "editar-persona-temas-de-interes",
      body: "Por favor, menciona tus nuevos temas de interés.",
    },
  },
  registrarPersona: {
    telefono: {
      id: "registrar-persona-telefono",
      body: NuevaPersonaActions.getMensajeTelefonoNuevaPersona,
    },
    otpVerificacion: {
      id: "registrar-persona-otp-verificacion",
      body: NuevaPersonaActions.getMensajeOtpNuevaPersona,
    },
    evento: {
      id: "registrar-persona-evento",
      body: NuevaPersonaActions.getMensajeEventoNuevaPersona,
    },
    nombre: {
      id: "registrar-persona-nombre",
      body: NuevaPersonaActions.getMensajeNombreNuevaPersona,
    },
    codigoPostal: {
      id: "registrar-persona-codigo-postal",
      body: NuevaPersonaActions.getMensajeCPNuevaPersona,
    },
    colonia: {
      id: "registrar-persona-colonia",
      body: NuevaPersonaActions.getMensajeColoniasNuevaPersona,
    },
    redSocialFavorita: {
      id: "registrar-persona-red-social-favorita",
      body: `¿Cuál es la red social que más usa la persona? Por favor responde con el número correspondiente:
1. Twitter
2. Instagram
3. Facebook
4. TikTok
`,
    },
    usernameRedSocial: {
      id: "registrar-persona-username-red-social",
      body: NuevaPersonaActions.getMensajeUsernameRedSocialNuevaPersona,
    },
    confirmacion: {
      id: "registrar-persona-confirmacion",
      body: NuevaPersonaActions.getMensajeConfirmacionNuevaPersona,
    },
  },
  nuevoReporte: {
    telefono: {
      id: "nuevo-reporte-telefono",
      body: NuevoReporteActions.getMensajeTelefonoNuevoReporte,
    },
    otpVerificacion: {
      id: "nuevo-reporte-otp-verificacion",
      body: NuevoReporteActions.getMensajeOtpNuevoReporte,
    },
    nombre: {
      id: "nuevo-reporte-nombre",
      body: NuevoReporteActions.getMensajeNombreNuevoReporte,
    },
    descripcion: {
      id: "nuevo-reporte-descripcion",
      body: NuevoReporteActions.getMensajeDescripcionNuevoReporte,
    },
    ubicacion: {
      id: "nuevo-reporte-ubicacion",
      body: NuevoReporteActions.getMensajeUbicacionNuevoReporte,
    },
    foto: {
      id: "nuevo-reporte-foto",
      body: NuevoReporteActions.getMensajeFotoNuevoReporte,
    },
    confirmacion: {
      id: "nuevo-reporte-confirmacion",
      body: NuevoReporteActions.getMensajeConfirmacionNuevoReporte,
    },
  },
  verRed: {
    id: "ver-red",
    body: NuevaPersonaActions.getMensajeVerRed,
  },
  obtenerLigaReferido: {
    id: "obtener-liga-referido",
    body: NuevaPersonaActions.getMensajeLigaReferido,
  },
};

module.exports = chatData;
