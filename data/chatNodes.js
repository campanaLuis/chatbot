const chatData = require("./chatData");
const NuevaPersonaActions = require("../NuevaPersonaActions");
const NuevoReporteActions = require("../NuevoReporteActions");

const buildChatNodes = () => {
  let chatNodes = [
    buildNode(
      chatData.menuPrincipal,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.codigoPostal,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaCodigoPostal,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.colonia,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaColonia,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.selfie,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaSelfie,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.redSocialFavorita,
          condition:
            NuevaPersonaActions.personaRegistradaPeroNoTieneNingunaRedSocial,
        },
        {
          regex: /^1\.?$/,
          to: chatData.editarPersona.menu,
          condition: NuevaPersonaActions.personaTieneDatosRequeridos,
        },
        {
          regex: /^2\.?$/,
          to: chatData.verRed,
          condition: NuevaPersonaActions.personaTieneDatosRequeridos,
        },
        {
          regex: /^3\.?$/,
          to: chatData.obtenerLigaReferido,
          condition: NuevaPersonaActions.personaTieneDatosRequeridos,
        },
        {
          regex: /^4\.?$/,
          to: chatData.cambiarGenealogia.telefonoOrigen,
          condition: NuevaPersonaActions.tienePermisoParaModificarGenealogia,
        },
        {
          regex: /^5\.?$/,
          to: chatData.registrarPersona.evento,
          condition:
            NuevaPersonaActions.tienePermisoParaRegistrarPersonasEnEvento,
        },
        {
          regex: /^6\.?$/,
          to: chatData.nuevoReporte.telefono,
          condition:
            NuevoReporteActions.tienePermisoParaRegistrarReportesDeApoyo,
        },
        {
          regex: /.*/,
          to: chatData.menuPrincipal,
          condition: NuevaPersonaActions.usuarioYaRegistrado,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.nombre,
        },
      ],
      NuevaPersonaActions.guardarHashReferer,
    ),
    //Cambiar genealogía
    buildNode(
      chatData.cambiarGenealogia.telefonoOrigen,
      [
        {
          regex: /.*/,
          to: chatData.cambiarGenealogia.telefonoDestino,
        },
      ],
      NuevaPersonaActions.guardarTelefonoOrigenCambioGenealogia,
    ),
    buildNode(
      chatData.cambiarGenealogia.telefonoDestino,
      [
        {
          regex: /.*/,
          to: chatData.cambiarGenealogia.confirmacion,
        },
      ],
      NuevaPersonaActions.guardarTelefonoDestinoCambioGenealogia,
    ),
    buildNode(
      chatData.cambiarGenealogia.confirmacion,
      [
        {
          regex: /.*/,
          to: chatData.menuPrincipal,
        },
      ],
      NuevaPersonaActions.confirmarCambioGenealogia,
    ),

    //Nueva persona

    buildNode(
      chatData.nuevaPersona.nombre,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.codigoPostal,
        },
      ],
      NuevaPersonaActions.crearUsuarioConNombre,
    ),

    buildNode(
      chatData.nuevaPersona.codigoPostal,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.colonia,
        },
      ],
      NuevaPersonaActions.guardarCodigoPostal,
    ),
    buildNode(
      chatData.nuevaPersona.colonia,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.selfie,
        },
      ],
      NuevaPersonaActions.guardarColonia,
    ),

    buildNode(
      chatData.nuevaPersona.selfie,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.redSocialFavorita,
        },
      ],
      NuevaPersonaActions.guardarSelfie,
    ),

    buildNode(
      chatData.nuevaPersona.redSocialFavorita,
      [
        {
          regex: /^1\.?$/,
          to: chatData.nuevaPersona.twitter,
        },
        {
          regex: /^2\.?$/,
          to: chatData.nuevaPersona.instagram,
        },
        {
          regex: /^3\.?$/,
          to: chatData.nuevaPersona.facebook,
        },
        {
          regex: /^4\.?$/,
          to: chatData.nuevaPersona.tiktok,
        },
      ],
      NuevaPersonaActions.guardarRedSocialFavorita,
    ),
    buildNode(
      chatData.nuevaPersona.instagram,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.confirmacion,
          condition: NuevaPersonaActions.personaRegistradaTieneSoloUnaRedSocial,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.facebook,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaFacebook,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.twitter,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaTwitter,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.tiktok,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaTikTok,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.temasDeInteres,
        },
      ],
      NuevaPersonaActions.guardarInstagram,
    ),
    buildNode(
      chatData.nuevaPersona.twitter,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.confirmacion,
          condition: NuevaPersonaActions.personaRegistradaTieneSoloUnaRedSocial,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.facebook,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaFacebook,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.instagram,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaInstagram,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.tiktok,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaTikTok,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.temasDeInteres,
        },
      ],
      NuevaPersonaActions.guardarTwitter,
    ),
    buildNode(
      chatData.nuevaPersona.tiktok,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.confirmacion,
          condition: NuevaPersonaActions.personaRegistradaTieneSoloUnaRedSocial,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.facebook,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaFacebook,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.twitter,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaTwitter,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.instagram,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaInstagram,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.temasDeInteres,
        },
      ],
      NuevaPersonaActions.guardarTikTok,
    ),

    buildNode(
      chatData.nuevaPersona.facebook,
      [
        {
          regex: /.*/,
          to: chatData.nuevaPersona.confirmacion,
          condition: NuevaPersonaActions.personaRegistradaTieneSoloUnaRedSocial,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.instagram,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaInstagram,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.twitter,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaTwitter,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.tiktok,
          condition: NuevaPersonaActions.personaRegistradaPeroFaltaTikTok,
        },
        {
          regex: /.*/,
          to: chatData.nuevaPersona.temasDeInteres,
        },
      ],
      NuevaPersonaActions.guardarFacebook,
    ),

    buildNode(chatData.nuevaPersona.confirmacion, [
      {
        regex: /.*/,
        to: chatData.nuevaPersona.instagram,
        condition: NuevaPersonaActions.personaRegistradaPeroFaltaInstagram,
      },
      {
        regex: /.*/,
        to: chatData.nuevaPersona.facebook,
        condition: NuevaPersonaActions.personaRegistradaPeroFaltaFacebook,
      },
      {
        regex: /.*/,
        to: chatData.nuevaPersona.twitter,
        condition: NuevaPersonaActions.personaRegistradaPeroFaltaTwitter,
      },
      {
        regex: /.*/,
        to: chatData.nuevaPersona.tiktok,
        condition: NuevaPersonaActions.personaRegistradaPeroFaltaTikTok,
      },
      {
        regex: /.*/,
        to: chatData.nuevaPersona.temasDeInteres,
      },
    ]),
    buildNode(
      chatData.nuevaPersona.temasDeInteres,
      [
        {
          regex: /.*/,
          to: chatData.menuPrincipal,
        },
      ],
      NuevaPersonaActions.guardarTemasDeInteres,
    ),
    //editar persona

    buildNode(chatData.editarPersona.menu, [
      {
        regex: /^1$/,
        to: chatData.editarPersona.nombre,
      },
      {
        regex: /^2$/,
        to: chatData.editarPersona.codigoPostal,
      },
      {
        regex: /^3$/,
        to: chatData.editarPersona.colonia,
      },
      {
        regex: /^4$/,
        to: chatData.editarPersona.selfie,
      },
      {
        regex: /^5$/,
        to: chatData.editarPersona.twitter,
      },
      {
        regex: /^6$/,
        to: chatData.editarPersona.instagram,
      },
      {
        regex: /^7$/,
        to: chatData.editarPersona.facebook,
      },
      {
        regex: /^8$/,
        to: chatData.editarPersona.tiktok,
      },
      {
        regex: /^9$/,
        to: chatData.editarPersona.temasDeInteres,
      },
    ]),

    buildNode(
      chatData.editarPersona.nombre,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.menu,
        },
      ],
      NuevaPersonaActions.guardarNombre,
    ),

    buildNode(
      chatData.editarPersona.codigoPostal,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.colonia,
        },
      ],
      NuevaPersonaActions.guardarCodigoPostal,
    ),

    buildNode(
      chatData.editarPersona.colonia,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.menu,
        },
      ],
      NuevaPersonaActions.guardarColonia,
    ),
    buildNode(
      chatData.editarPersona.selfie,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.menu,
        },
      ],
      NuevaPersonaActions.guardarSelfie,
    ),
    buildNode(
      chatData.editarPersona.twitter,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.menu,
        },
      ],
      NuevaPersonaActions.guardarTwitter,
    ),
    buildNode(
      chatData.editarPersona.instagram,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.menu,
        },
      ],
      NuevaPersonaActions.guardarInstagram,
    ),
    buildNode(
      chatData.editarPersona.facebook,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.menu,
        },
      ],
      NuevaPersonaActions.guardarFacebook,
    ),
    buildNode(
      chatData.editarPersona.tiktok,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.menu,
        },
      ],
      NuevaPersonaActions.guardarTikTok,
    ),
    buildNode(
      chatData.editarPersona.temasDeInteres,
      [
        {
          regex: /.*/,
          to: chatData.editarPersona.menu,
        },
      ],
      NuevaPersonaActions.guardarTemasDeInteres,
    ),
    //ver red
    buildNode(chatData.verRed, [
      {
        regex: /.*/,
        to: chatData.menuPrincipal,
      },
    ]),
    //obtener liga referido
    buildNode(chatData.obtenerLigaReferido, [
      {
        regex: /.*/,
        to: chatData.menuPrincipal,
      },
    ]),

    // Registrar nueva persona (opción 5)
    buildNode(
      chatData.registrarPersona.telefono,
      [
        {
          regex: /.*/,
          to: chatData.registrarPersona.otpVerificacion,
        },
      ],
      NuevaPersonaActions.guardarTelefonoNuevaPersona,
    ),
    buildNode(
      chatData.registrarPersona.otpVerificacion,
      [
        {
          regex: /.*/,
          to: chatData.registrarPersona.nombre,
        },
      ],
      NuevaPersonaActions.confirmarOtpNuevaPersona,
    ),
    buildNode(
      chatData.registrarPersona.evento,
      [
        {
          regex: /.*/,
          to: chatData.registrarPersona.telefono,
        },
      ],
      NuevaPersonaActions.guardarEventoNuevaPersona,
    ),
    buildNode(
      chatData.registrarPersona.nombre,
      [
        {
          regex: /.*/,
          to: chatData.registrarPersona.codigoPostal,
        },
      ],
      NuevaPersonaActions.guardarNombreNuevaPersona,
    ),
    buildNode(
      chatData.registrarPersona.codigoPostal,
      [
        {
          regex: /.*/,
          to: chatData.registrarPersona.colonia,
        },
      ],
      NuevaPersonaActions.guardarCPNuevaPersona,
    ),
    buildNode(
      chatData.registrarPersona.colonia,
      [
        {
          regex: /.*/,
          to: chatData.registrarPersona.redSocialFavorita,
        },
      ],
      NuevaPersonaActions.guardarColoniaNuevaPersona,
    ),
    buildNode(
      chatData.registrarPersona.redSocialFavorita,
      [
        {
          regex: /.*/,
          to: chatData.registrarPersona.usernameRedSocial,
        },
      ],
      NuevaPersonaActions.guardarRedSocialNuevaPersona,
    ),
    buildNode(
      chatData.registrarPersona.usernameRedSocial,
      [
        {
          regex: /.*/,
          to: chatData.registrarPersona.confirmacion,
        },
      ],
      NuevaPersonaActions.guardarUsernameRedSocialNuevaPersona,
    ),
    buildNode(
      chatData.registrarPersona.confirmacion,
      [
        {
          regex: /.*/,
          to: chatData.menuPrincipal,
        },
      ],
      NuevaPersonaActions.confirmarRegistroNuevaPersona,
    ),

    // Nuevo reporte de apoyo (opción 6)
    buildNode(
      chatData.nuevoReporte.telefono,
      [{ regex: /.*/, to: chatData.nuevoReporte.otpVerificacion }],
      NuevoReporteActions.guardarTelefonoNuevoReporte,
    ),
    buildNode(
      chatData.nuevoReporte.otpVerificacion,
      [{ regex: /.*/, to: chatData.nuevoReporte.nombre }],
      NuevoReporteActions.confirmarOtpNuevoReporte,
    ),
    buildNode(
      chatData.nuevoReporte.nombre,
      [{ regex: /.*/, to: chatData.nuevoReporte.descripcion }],
      NuevoReporteActions.guardarNombreNuevoReporte,
    ),
    buildNode(
      chatData.nuevoReporte.descripcion,
      [{ regex: /.*/, to: chatData.nuevoReporte.ubicacion }],
      NuevoReporteActions.guardarDescripcionNuevoReporte,
    ),
    buildNode(
      chatData.nuevoReporte.ubicacion,
      [{ regex: /.*/, to: chatData.nuevoReporte.foto }],
      NuevoReporteActions.guardarUbicacionNuevoReporte,
    ),
    buildNode(
      chatData.nuevoReporte.foto,
      [{ regex: /.*/, to: chatData.nuevoReporte.confirmacion }],
      NuevoReporteActions.guardarFotoNuevoReporte,
    ),
    buildNode(
      chatData.nuevoReporte.confirmacion,
      [{ regex: /.*/, to: chatData.menuPrincipal }],
      NuevoReporteActions.confirmarNuevoReporte,
    ),
  ];

  return chatNodes;
};

const chatNodes = buildChatNodes();

function getExitAndCancelTriggers(cancelTo) {
  return [
    {
      regex: /^(s|S)(a|A)(l|L)(i|I)(r|R)$/,
      to: { id: "menu-principal" },
    },
    {
      regex: /^(c|C)(a|A)(n|N)(c|C)(e|E)(l|L)(a|A)(r|R)$/i,
      to: cancelTo ?? { id: "menu-principal" },
    },
  ];
}

function getBasicNodeProps(node) {
  return { id: node.id, body: node.body };
}

function buildNodeTriggers(triggers) {
  return [...getExitAndCancelTriggers(), ...triggers];
}
function buildNode(node, triggers, action = null) {
  let obj = {
    ...getBasicNodeProps(node),
    triggers: buildNodeTriggers(triggers),
  };
  if (action) obj.action = action;
  return obj;
}

module.exports = chatNodes;
