const axios = require("axios");
const { getColoniasByCP } = require("./sepomexIndex");
const NuevoReporteActions = require("./NuevoReporteActions");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
let state = {};

const performAction = (cb, user, userInput, status = null) => {
  if (
    userInput.Body.toString().toLowerCase() === "salir" ||
    userInput.Body.toString().toLowerCase() === "cancelar"
  )
    return true;
  if (status) return cb(user, userInput, status);
  else return cb(user, userInput);
};

function extractRef(text) {
  const match = text.match(/\[ref=([A-Za-z0-9_-]+)\]/);
  return match ? match[1] : null;
}

async function validarTelefonos(user, telefonoOrigen, telefonoDestino) {
  const phone = user.slice(-10);
  try {
    const result = await axios.get(
      process.env.API_URL +
        "/chatbot/validar-telefonos-genealogia?origen=" +
        telefonoOrigen +
        "&destino=" +
        telefonoDestino +
        "&usuario=" +
        phone,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.API_SECRET,
          "X-From": phone,
        },
      },
    );
    return {
      status: result.status,
      mensaje: result.data.mensaje || "Validación exitosa",
    };
  } catch (error) {
    return {
      status: error.response?.status || null,
      mensaje: error.response?.data?.mensaje || "Error desconocido",
    };
  }
}
async function modificarGenealogia(user, telefonoOrigen, telefonoDestino) {
  const phone = user.slice(-10);
  try {
    const result = await axios.post(
      process.env.API_URL + "/chatbot/genealogia",
      {
        telefonoOrigen: telefonoOrigen,
        telefonoDestino: telefonoDestino,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.API_SECRET,
          "X-From": phone,
        },
      },
    );
    return result.data;
  } catch (error) {
    console.error("Error al modificar genealogia:", error);
    return null;
  }
}

async function modificarPersona(user, field, value) {
  const phone = user.slice(-10);
  try {
    const result = await axios.put(
      process.env.API_URL + "/chatbot/persona/" + phone,
      {
        [field]: value,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.API_SECRET,
          "X-From": phone,
        },
      },
    );
    return result.data;
  } catch (error) {
    console.error("Error al modificar persona:", error);
    return null;
  }
}

async function obtenerPersona(user) {
  const phone = user.slice(-10);
  try {
    const data = await axios.get(
      process.env.API_URL + "/chatbot/persona/" + phone,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.API_SECRET,
          "X-From": phone,
        },
      },
    );
    return data.data;
  } catch (error) {
    console.error("Error al obtener persona por teléfono:", error);
    return null;
  }
}

async function obtenerPersonaPorHash(user, hash) {
  const phone = user.slice(-10);
  try {
    const data = await axios.get(
      process.env.API_URL + "/chatbot/persona/hash/" + hash,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.API_SECRET,
          "X-From": phone,
        },
      },
    );
    return data.data;
  } catch (error) {
    console.error("Error al obtener persona por teléfono:", error);
    return null;
  }
}

async function obtenerInfoDeRed(user) {
  const phone = user.slice(-10);
  try {
    const data = await axios.get(
      process.env.API_URL + "/chatbot/mi-red/" + phone,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.API_SECRET,
          "X-From": phone,
        },
      },
    );
    return data.data;
  } catch (error) {
    console.error("Error al obtener persona por teléfono:", error);
    return null;
  }
}

async function obtenerEventos(user) {
  const phone = user.slice(-10);
  try {
    const data = await axios.get(process.env.API_URL + "/chatbot/eventos", {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": process.env.API_SECRET,
        "X-From": phone,
      },
    });
    return data.data;
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return [];
  }
}

class NuevaPersonaActions {
  static async tienePermisoParaModificarGenealogia(user) {
    const persona = await obtenerPersona(user);
    return persona?.[0]?.tiene_permiso_para_modificar_genealogia ?? false;
  }
  static async tienePermisoParaRegistrarPersonasEnEvento(user) {
    const persona = await obtenerPersona(user);
    return (
      persona?.[0]?.tiene_permiso_para_registrar_personas_en_evento ?? false
    );
  }
  static async usuarioYaRegistrado(user) {
    const persona = await obtenerPersona(user);
    return persona.length > 0;
  }

  static async personaRegistradaPeroFaltaCodigoPostal(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return persona && !persona.codigopostal;
  }

  static async personaRegistradaPeroFaltaColonia(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return persona && !persona.colonia;
  }

  static async personaRegistradaPeroFaltaSelfie(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return persona && !persona.selfie_url;
  }
  static async personaRegistradaPeroNoTieneNingunaRedSocial(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return (
      persona &&
      !persona.twitter_handle &&
      !persona.facebook_handle &&
      !persona.instagram_handle &&
      !persona.tiktok_handle
    );
  }
  static async personaRegistradaTieneSoloUnaRedSocial(user) {
    const persona = (await obtenerPersona(user))?.[0];
    const redesSociales = [
      persona?.twitter_handle,
      persona?.facebook_handle,
      persona?.instagram_handle,
      persona?.tiktok_handle,
    ];
    //si se salta una, tambien contarla para que no se vuelva a ir al confirm
    if (state?.[user]) {
      if (state[user]?.twitterSkipped) {
        return false;
      }
      if (state[user]?.facebookSkipped) {
        return false;
      }
      if (state[user]?.instagramSkipped) {
        return false;
      }
      if (state[user]?.tiktokSkipped) {
        return false;
      }
    }

    const cantidadRedes = redesSociales.filter((red) => red).length;
    return persona && cantidadRedes === 1;
  }
  static async personaRegistradaTieneAlgunaRedSocial(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return (
      persona &&
      (persona.twitter_handle ||
        persona.facebook_handle ||
        persona.instagram_handle ||
        persona.tiktok_handle)
    );
  }
  static async personaRegistradaPeroFaltaFacebook(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return persona && !persona.facebook_handle && !state[user]?.facebookSkipped;
  }
  static async personaRegistradaPeroFaltaInstagram(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return (
      persona && !persona.instagram_handle && !state[user]?.instagramSkipped
    );
  }
  static async personaRegistradaPeroFaltaTikTok(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return persona && !persona.tiktok_handle && !state[user]?.tiktokSkipped;
  }
  static async personaRegistradaPeroFaltaTwitter(user) {
    const persona = (await obtenerPersona(user))?.[0];
    return persona && !persona.twitter_handle && !state[user]?.twitterSkipped;
  }

  static async personaTieneDatosRequeridos(user) {
    const persona = (await obtenerPersona(user))?.[0];
    const personaTieneAlgunaRedSocial =
      await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user);
    return (
      persona &&
      persona.nombre &&
      persona.codigopostal &&
      persona.colonia &&
      persona.selfie_url &&
      personaTieneAlgunaRedSocial
    );
  }
  static async personaTieneDatosIncompletos(user) {
    const persona = (await obtenerPersona(user))?.[0];
    const personaTieneAlgunaRedSocial =
      await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user);
    return (
      persona &&
      (!persona.nombre ||
        !persona.codigopostal ||
        !persona.colonia ||
        !persona.selfie_url ||
        !personaTieneAlgunaRedSocial)
    );
  }

  static async getMensajeConfirmacionCambioGenealogia(user, userInput) {
    const personaOrigen = (
      await obtenerPersona(state[user].telefono_origen)
    )?.[0];
    const personaDestino = (
      await obtenerPersona(state[user].telefono_destino)
    )?.[0];

    let mensaje = `Esto es lo que vamos a cambiar en la genealogía: 
    La persona con teléfono ${state[user].telefono_origen} (${personaOrigen?.nombre || "Nombre no disponible"}) pasará a ser referido directo de la persona con teléfono ${state[user].telefono_destino} (${personaDestino?.nombre || "Nombre no disponible"}), todos los descendientes de la persona con telefono ${state[user].telefono_origen} se moverán, respetando la jerarquía que originalmente tenían.
    Para confirmar escribe si, para cancelar escribe cancelar.
`;
    return mensaje;
  }

  static async getMensajeGenealogiaTelefonoOrigen(user, userInput) {
    if (state[user]?.error_telefono_origen) {
      const mensaje =
        state[user].error_telefono_origen +
        ` Por favor, envía un número de teléfono válido.`;
      state[user] = { ...state[user], error_telefono_origen: null };
      return mensaje;
    }
    return `Por favor, envía el número de teléfono de la persona que quieres mover.`;
  }

  static async getMensajeGenealogiaTelefonoDestino(user, userInput) {
    if (state[user]?.error_telefono_destino) {
      const mensaje =
        state[user].error_telefono_destino +
        ` Por favor, envía un número de teléfono válido.`;
      state[user] = { ...state[user], error_telefono_destino: null };
      return mensaje;
    }
    return `Ahora, envía el número de teléfono de la persona destino. Esta es la persona será el nuevo padre del num de telefono anterior y todos sus descendientes.`;
  }
  static async getMensajePedirInstagram(user, userInput) {
    let mensaje = `Por favor, comparte tu usuario de Instagram `;
    if (await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user)) {
      mensaje += `(opcional). Si no tienes Instagram o no deseas compartirlo, escribe 'saltar'.`;
    }
    return mensaje;
  }
  static async getMensajePedirTwitter(user, userInput) {
    let mensaje = `Por favor, comparte tu usuario de Twitter `;
    if (await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user)) {
      mensaje += `(opcional). Si no tienes Twitter o no deseas compartirlo, escribe 'saltar'.`;
    }
    return mensaje;
  }
  static async getMensajePedirFacebook(user, userInput) {
    let mensaje = `Por favor, comparte tu usuario de Facebook `;
    if (await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user)) {
      mensaje += `(opcional). Si no tienes Facebook o no deseas compartirlo, escribe 'saltar'.`;
    }
    return mensaje;
  }
  static async getMensajePedirTikTok(user, userInput) {
    let mensaje = `Por favor, comparte tu usuario de TikTok `;
    if (await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user)) {
      mensaje += `(opcional). Si no tienes TikTok o no deseas compartirlo, escribe 'saltar'.`;
    }
    return mensaje;
  }

  static async getMensajeVerRed(user, userInput) {
    const persona = (await obtenerPersona(user))?.[0];
    const infoDeRed = (await obtenerInfoDeRed(user))?.[0];
    let message = "*Aqui está la información de tu red*:\n";
    message += `Referidos directos: ${infoDeRed?.direct_descendants}\n`;
    message += `Referidos totales: ${infoDeRed?.all_descendants}\n`;
    message += `¡Puedes ver tu red completa aquí! https://redafinidad.seguimientoamigos.com/red/${persona.hash_code}\n\n`;
    return message;
  }

  static async getMensajeLigaReferido(user, userInput) {
    const persona = (await obtenerPersona(user))?.[0];
    const texto = `${persona.nombre} me invita a la red de afinidad ciudadana , quiero unirme. [ref=${persona.hash_code}]`;
    const encodedText = encodeURIComponent(texto);
    return `${persona.nombre} te está invitando a la red de afinidad ciudadana . Haz click en el siguiente enlace para unirte:
https://wa.me/14128662315?text=${encodedText}
`;
  }

  static async getMensajeMenuPrincipal(user, userInput) {
    let message = "";
    if (state[user]?.temasDeInteresLlenados) {
      message += `Tu perfil está completo. ¿Qué te gustaría hacer ahora?
`;
      state[user] = { ...state[user], temasDeInteresLlenados: false };
    }
    if (state[user]?.genealogia_modificada) {
      message += `La genealogía ha sido modificada exitosamente. ¿Qué te gustaría hacer ahora?
`;
      state[user] = { ...state[user], genealogia_modificada: false };
    }
    if (state[user]?.personaRegistradaExitosamente) {
      message += `La persona fue registrada exitosamente. ¿Qué te gustaría hacer ahora?
`;
      state[user] = { ...state[user], personaRegistradaExitosamente: false };
    }
    if (NuevoReporteActions.tieneReporteRegistradoExitosamente(user)) {
      message += `El reporte fue registrado exitosamente. ¿Qué te gustaría hacer ahora?
`;
    }
    const personaRegistrada =
      await NuevaPersonaActions.usuarioYaRegistrado(user);
    const personaTieneDatosRequeridos =
      await NuevaPersonaActions.personaTieneDatosRequeridos(user);
    if (personaRegistrada && personaTieneDatosRequeridos) {
      message += `
      Bienvenido de vuelta a la Red de Afinidad Ciudadana, elige una opción:
        1. Editar mi perfil
        2. Ver mi red
        3. Obtener mi liga para invitar referidos
      `;
      if (await NuevaPersonaActions.tienePermisoParaModificarGenealogia(user)) {
        message += `  4. Modificar genealogía de registros
        `;
      }
      if (
        await NuevaPersonaActions.tienePermisoParaRegistrarPersonasEnEvento(
          user,
        )
      ) {
        message += `5. Registrar nueva persona
        `;
      }
      if (
        await NuevoReporteActions.tienePermisoParaRegistrarReportesDeApoyo(user)
      ) {
        message += `6. Registrar reporte de apoyo
        `;
      }
    } else if (state[user]?.referer_hash) {
      message += `
      Bienvenido, escribe cualquier mensaje para continuar con tu registro. Faltan algunos datos para completar tu perfil:`;
      if (
        await NuevaPersonaActions.personaRegistradaPeroFaltaCodigoPostal(user)
      ) {
        message += `
        - Código postal
        `;
      }
      if (await NuevaPersonaActions.personaRegistradaPeroFaltaColonia(user)) {
        message += `
        - Colonia
        `;
      }
      if (await NuevaPersonaActions.personaRegistradaPeroFaltaSelfie(user)) {
        message += `
        - Selfie
        `;
      }
      if (
        await NuevaPersonaActions.personaRegistradaPeroNoTieneNingunaRedSocial(
          user,
        )
      ) {
        message += `
        - Red social favorita
        `;
      }
    } else {
      message += `
      Necesitas un código de referido para unirte a la red. Por favor, comparte el enlace de referido que recibiste para continuar con tu registro.
`;
    }
    return message;
  }

  static async #guardarTelefonoOrigenCambioGenealogia(user, userInput) {
    const persona = (await obtenerPersona(userInput.Body))?.[0];
    console.log("aqui esta l apersona");
    console.log(persona);
    if (!persona) {
      state[user] = {
        ...state[user],
        error_telefono_origen:
          "No existe un usuario con ese teléfono, verifica.",
      };
      return false;
    }
    state[user] = { ...state[user], telefono_origen: userInput.Body };
    //checar si el telefono existe
    return true;
  }

  static async guardarTelefonoOrigenCambioGenealogia(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarTelefonoOrigenCambioGenealogia,
      user,
      userInput,
    );
  }

  static async #guardarTelefonoDestinoCambioGenealogia(user, userInput) {
    const persona = (await obtenerPersona(userInput.Body))?.[0];
    if (!persona) {
      state[user] = {
        ...state[user],
        error_telefono_destino:
          "No existe un usuario con ese teléfono, verifica.",
      };
      return false;
    }
    const validacion = await validarTelefonos(
      user,
      state[user].telefono_origen,
      userInput.Body,
    );
    if (validacion?.status !== 200) {
      state[user] = {
        ...state[user],
        error_telefono_destino:
          validacion?.mensaje || "Error desconocido al validar los teléfonos.",
      };
      return false;
    }
    state[user] = { ...state[user], telefono_destino: userInput.Body };
    return true;
  }

  static async guardarTelefonoDestinoCambioGenealogia(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarTelefonoDestinoCambioGenealogia,
      user,
      userInput,
    );
  }

  static async #confirmarCambioGenealogia(user, userInput) {
    if (
      userInput.Body.toString().toLowerCase() !== "si" &&
      userInput.Body.toString().toLowerCase() !== "sí"
    ) {
      return false;
    }
    try {
      await modificarGenealogia(
        user,
        state[user].telefono_origen,
        state[user].telefono_destino,
      );
      state[user] = { ...state[user], genealogia_modificada: true };
    } catch (error) {
      console.error("Error al modificar genealogia:", error);
      return false;
    }
    return true;
  }

  static async confirmarCambioGenealogia(user, userInput) {
    return performAction(
      NuevaPersonaActions.#confirmarCambioGenealogia,
      user,
      userInput,
    );
  }

  static async #guardarHashReferer(user, userInput) {
    const ref = extractRef(userInput.Body);
    const yaRegistrado = await NuevaPersonaActions.usuarioYaRegistrado(user);
    const registroIncompleto =
      await NuevaPersonaActions.personaTieneDatosIncompletos(user);
    state[user] = { ...state[user], referer_hash: ref };
    console.log("Referencia extraída:", ref);
    if (!yaRegistrado && !registroIncompleto && !ref) {
      return false;
    }

    return true;
  }

  static async guardarHashReferer(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarHashReferer,
      user,
      userInput,
    );
  }

  static async getMensajeEditarPersonaMenu(user, userInput) {
    const persona = (await obtenerPersona(user))?.[0];
    let message = `¿Qué dato deseas modificar?
1. Nombre (actual: ${persona?.nombre || "no proporcionado"})
2. Código Postal (actual: ${persona?.codigopostal || "no proporcionado"})
3. Colonia (actual: ${persona?.colonia || "no proporcionado"})
4. Selfie
5. Twitter (actual: ${persona?.twitter_handle || "no proporcionado"})
6. Instagram (actual: ${persona?.instagram_handle || "no proporcionado"})
7. Facebook (actual: ${persona?.facebook_handle || "no proporcionado"})
8. TikTok (actual: ${persona?.tiktok_handle || "no proporcionado"})
9. Temas de interés (actual: ${persona?.intereses_text ? persona?.intereses_text : ""})

Escribe cancelar o salir para regresar al menú principal.
`;
    return message;
  }
  //crear usuario con nombre
  static async getMensajeNombre(user, userInput) {
    const persona = (
      await obtenerPersonaPorHash(user, state[user]?.referer_hash)
    )?.[0];
    console.log(state[user]?.referer_hash);
    console.log(persona);
    if (!state[user]?.referer_hash) {
      return `Bienvenido al Chatbot de Red de Afinidad Ciudadana ! ¿Cual es tu nombre completo?.................................................`;
    }
    let mensaje = `Bienvenido al Chatbot de Red de Afinidad Ciudadana ! Te invita ${persona?.nombre} ¿Cual es tu nombre completo?.................................................`;
    return mensaje;
  }

  static async #crearUsuarioConNombre(user, userInput) {
    const phone = user.slice(-10);
    try {
      const result = await axios.post(
        process.env.API_URL + "/chatbot/persona",
        {
          nombre: userInput.Body,
          telefono: phone,
          referer_hash: state[user]?.referer_hash || null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": process.env.API_SECRET,
            "X-From": phone,
          },
        },
      );
    } catch (error) {
      console.error("Error al crear usuario:", error);
    }
    return true;
  }

  static async crearUsuarioConNombre(user, userInput) {
    return performAction(
      NuevaPersonaActions.#crearUsuarioConNombre,
      user,
      userInput,
    );
  }

  //editar nombre
  static async #guardarNombre(user, userInput) {
    await modificarPersona(user, "nombre", userInput.Body);
    console.log("Guardando nombre de persona: ", userInput.Body);
    return true;
  }

  static async guardarNombre(user, userInput) {
    return performAction(NuevaPersonaActions.#guardarNombre, user, userInput);
  }

  //codigo postal
  static async getMensajeCodigoPostal(user, userInput) {
    if (state[user]?.codigoPostalValido === false) {
      return `El código postal que proporcionaste no es válido. Por favor, ingresa un código postal válido.`;
    }
    return `Por favor, ingresa tu código postal.`;
  }

  static async #guardarCodigoPostal(user, userInput) {
    const cp = String(userInput.Body || "").trim();

    if (!/^\d{5}$/.test(cp)) {
      state[user] = { ...state[user], codigoPostalValido: false };
      return false;
    }

    const colonias = await getColoniasByCP(cp);

    if (!colonias || colonias.length === 0) {
      state[user] = {
        ...state[user],
        codigoPostalValido: false,
        colonia: cp,
      };
      return false;
    }

    await modificarPersona(user, "codigopostal", cp);
    await modificarPersona(user, "colonia", null);

    console.log("Guardando codigo postal en la persona: ", cp);
    return true;
  }

  static async guardarCodigoPostal(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarCodigoPostal,
      user,
      userInput,
    );
  }

  //colonia
  static async getMensajeColonias(user, userInput) {
    const persona = (await obtenerPersona(user))?.[0];
    const codigoPostal = String(
      persona?.codigopostal || state?.[user]?.colonia || "",
    ).trim();
    delete state?.[user]?.colonia;

    const posiblesColonias = await getColoniasByCP(codigoPostal);

    if (!posiblesColonias.length) {
      return `No encontré colonias para el CP ${codigoPostal}. ¿Puedes verificarlo?`;
    }

    let mensaje = `Por favor, selecciona tu colonia respondiendo con el número correspondiente:\n`;
    let objetoColonias = {};

    posiblesColonias.forEach((colonia, index) => {
      mensaje += `${index + 1}. ${colonia.d_asenta}\n`;
      objetoColonias[index + 1] = colonia.d_asenta;
    });

    state[user] = { ...state[user], posiblesColonias: objetoColonias };
    return mensaje;
  }

  static async #guardarColonia(user, userInput) {
    const selectedColonia = state[user].posiblesColonias[userInput.Body.trim()];
    if (!selectedColonia) {
      return false;
    }
    await modificarPersona(user, "colonia", selectedColonia);
    console.log("Guardando datos de colonia en la persona: ", userInput.Body);
    return true;
  }

  static async guardarColonia(user, userInput) {
    return performAction(NuevaPersonaActions.#guardarColonia, user, userInput);
  }

  //selfie

  static async #guardarSelfie(user, userInput) {
    const contentType = userInput.MediaContentType0 || "";
    if (!userInput.MediaUrl0 && !contentType.startsWith("image/")) {
      return false;
    }
    await modificarPersona(user, "selfie_url", userInput.MediaUrl0);
    console.log(
      "Guardando datos de selfie en la persona: ",
      userInput.MediaUrl0,
    );
    return true;
  }

  static async guardarSelfie(user, userInput) {
    return performAction(NuevaPersonaActions.#guardarSelfie, user, userInput);
  }

  //confirmacion registro y pedir twitter
  static async getMensajeConfirmacionRegistro(user, userInput) {
    const persona = (await obtenerPersona(user))?.[0];

    const mensaje = `${persona.nombre} me invita a la red de afinidad ciudadana, quiero unirme. [ref=${persona.hash_code}]`;
    const encodedMessage = encodeURIComponent(mensaje);

    const inviteText = `${persona.nombre} te está invitando a la red de afinidad ciudadana. Haz click en el siguiente enlace para unirte:
https://wa.me/14128662315?text=${encodedMessage}`;

    const followupText = `Te registramos exitosamente.

Ahora puedes compartir tu liga de referido de WhatsApp enviada arriba para invitar a más personas.

Solo faltan unas preguntas más para completar tu perfil. Escribe lo que sea para continuar.
`;

    return [inviteText, followupText];
  }

  static async #guardarRedSocialFavorita(user, userInput) {
    if (!userInput.Body) {
      return false;
    }
    return true;
  }

  static async guardarRedSocialFavorita(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarRedSocialFavorita,
      user,
      userInput,
    );
  }

  static async #guardarTwitter(user, userInput) {
    const yaTieneRedRegistrada =
      await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user);

    if (userInput.Body.toLowerCase() === "saltar" && yaTieneRedRegistrada) {
      state[user] = { ...state[user], twitterSkipped: true };
      return true;
    }
    if (!userInput.Body) {
      return false;
    }
    await modificarPersona(user, "twitter_handle", userInput.Body);
    console.log("Guardando datos de twitter en la persona: ", userInput.Body);
    return true;
  }

  static async guardarTwitter(user, userInput) {
    return performAction(NuevaPersonaActions.#guardarTwitter, user, userInput);
  }

  //instagram
  static async #guardarInstagram(user, userInput) {
    const yaTieneRedRegistrada =
      await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user);
    if (userInput.Body.toLowerCase() === "saltar" && yaTieneRedRegistrada) {
      state[user] = { ...state[user], instagramSkipped: true };
      return true;
    }
    if (!userInput.Body) {
      return false;
    }
    await modificarPersona(user, "instagram_handle", userInput.Body);
    console.log("Guardando datos de instagram en la persona: ", userInput.Body);
    return true;
  }
  static async guardarInstagram(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarInstagram,
      user,
      userInput,
    );
  }

  //facebook
  static async #guardarFacebook(user, userInput) {
    const yaTieneRedRegistrada =
      await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user);
    if (userInput.Body.toLowerCase() === "saltar" && yaTieneRedRegistrada) {
      state[user] = { ...state[user], facebookSkipped: true };
      return true;
    }
    if (!userInput.Body) {
      return false;
    }
    await modificarPersona(user, "facebook_handle", userInput.Body);
    console.log("Guardando datos de facebook en la persona: ", userInput.Body);
    return true;
  }
  static async guardarFacebook(user, userInput) {
    return performAction(NuevaPersonaActions.#guardarFacebook, user, userInput);
  }

  //tiktok
  static async #guardarTikTok(user, userInput) {
    const yaTieneRedRegistrada =
      await NuevaPersonaActions.personaRegistradaTieneAlgunaRedSocial(user);
    if (userInput.Body.toLowerCase() === "saltar" && yaTieneRedRegistrada) {
      state[user] = { ...state[user], tiktokSkipped: true };
      return true;
    }
    if (!userInput.Body) {
      return false;
    }
    await modificarPersona(user, "tiktok_handle", userInput.Body);
    console.log("Guardando datos de tiktok en la persona: ", userInput.Body);
    return true;
  }
  static async guardarTikTok(user, userInput) {
    return performAction(NuevaPersonaActions.#guardarTikTok, user, userInput);
  }

  //temas de interes
  static async #guardarTemasDeInteres(user, userInput) {
    const body = (userInput.Body || "").trim();
    if (body.toLowerCase() === "saltar") return true;

    const numMedia = Number(userInput.NumMedia || 0);
    const hasMedia = numMedia > 0;

    if (hasMedia) {
      const isAudio = String(userInput.MediaContentType0 || "").startsWith(
        "audio/",
      );
      if (!isAudio) return false;

      await modificarPersona(
        user,
        "intereses_voice_note_url",
        userInput.MediaUrl0,
      );
      state[user] = { ...state[user], temasDeInteresLlenados: true };
      console.log(
        "Guardando datos de temas de interes en la persona: ",
        userInput.MediaUrl0,
      );
      return true;
    }

    if (!body) return false;

    await modificarPersona(user, "intereses_text", body);
    state[user] = { ...state[user], temasDeInteresLlenados: true };
    console.log("Guardando datos de temas de interes en la persona: ", body);
    return true;
  }

  static async guardarTemasDeInteres(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarTemasDeInteres,
      user,
      userInput,
    );
  }

  // ── Registrar nueva persona (opción 5) ──────────────────────────────────

  static async getMensajeTelefonoNuevaPersona(user, userInput) {
    if (state[user]?.registroNuevaPersona?.errorTelefono) {
      const error = state[user].registroNuevaPersona.errorTelefono;
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          errorTelefono: null,
        },
      };
      return (
        error +
        " Por favor, ingresa nuevamente el número de teléfono (10 dígitos)."
      );
    }
    return "Por favor, ingresa el número de teléfono (10 dígitos) de la persona a registrar.";
  }

  static async getMensajeNombreNuevaPersona(user, userInput) {
    return "Por favor, ingresa el nombre completo de la persona.";
  }

  static async getMensajeCPNuevaPersona(user, userInput) {
    if (state[user]?.registroNuevaPersona?.cpValido === false) {
      return "El código postal que proporcionaste no es válido. Por favor, ingresa un código postal válido.";
    }
    return "Por favor, ingresa el código postal de la persona.";
  }

  static async getMensajeColoniasNuevaPersona(user, userInput) {
    const cp = state[user]?.registroNuevaPersona?.codigopostal;
    const posiblesColonias = await getColoniasByCP(cp);

    if (!posiblesColonias || !posiblesColonias.length) {
      return `No encontré colonias para el CP ${cp}. ¿Puedes verificarlo?`;
    }

    let mensaje =
      "Por favor, selecciona la colonia respondiendo con el número correspondiente:\n";
    let objetoColonias = {};

    posiblesColonias.forEach((colonia, index) => {
      mensaje += `${index + 1}. ${colonia.d_asenta}\n`;
      objetoColonias[index + 1] = colonia.d_asenta;
    });

    state[user] = {
      ...state[user],
      registroNuevaPersona: {
        ...state[user].registroNuevaPersona,
        posiblesColonias: objetoColonias,
      },
    };
    return mensaje;
  }

  static async getMensajeUsernameRedSocialNuevaPersona(user, userInput) {
    const red = state[user]?.registroNuevaPersona?.redSocialPreferida;
    const nombres = {
      twitter: "Twitter",
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
    };
    return `Por favor, ingresa el usuario de ${nombres[red] || "red social"} de la persona.`;
  }

  static async getMensajeConfirmacionNuevaPersona(user, userInput) {
    const datos = state[user]?.registroNuevaPersona;
    const nombres = {
      twitter: "Twitter",
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
    };
    return `Por favor confirma los siguientes datos:
Teléfono: ${datos?.telefono}
Nombre: ${datos?.nombre}
Evento: ${datos?.eventoNombre || "Sin evento"}
Código postal: ${datos?.codigopostal}
Colonia: ${datos?.colonia}
Red social preferida: ${nombres[datos?.redSocialPreferida] || datos?.redSocialPreferida}
Usuario: ${datos?.usernameRedSocial}

¿Los datos son correctos? Escribe *si* para confirmar o *cancelar* para salir.`;
  }

  static async #guardarTelefonoNuevaPersona(user, userInput) {
    const telefono = String(userInput.Body || "").trim();
    // Reset state for a fresh registration attempt, preserving evento selected before telefono
    const eventoAnterior =
      state[user]?.registroNuevaPersona?.eventoid !== undefined
        ? {
            eventoid: state[user].registroNuevaPersona.eventoid,
            eventoNombre: state[user].registroNuevaPersona.eventoNombre,
          }
        : {};
    state[user] = { ...state[user], registroNuevaPersona: eventoAnterior };

    if (!/^\d{10}$/.test(telefono)) {
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          errorTelefono: "El número de teléfono debe tener 10 dígitos.",
        },
      };
      return false;
    }

    const personaExistente = (await obtenerPersona(telefono))?.[0];
    if (personaExistente) {
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          errorTelefono:
            "Ya existe una persona registrada con ese número de teléfono.",
        },
      };
      return false;
    }

    state[user] = {
      ...state[user],
      registroNuevaPersona: { ...state[user].registroNuevaPersona, telefono },
    };

    try {
      await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: `+52${telefono}`, channel: "sms" });
      console.log("Código OTP enviado a:", telefono);
    } catch (err) {
      console.error("Error al enviar OTP:", err);
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          errorTelefono:
            "No se pudo enviar el código de verificación. Verifica el número e intenta de nuevo.",
        },
      };
      return false;
    }
    return true;
  }

  static async guardarTelefonoNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarTelefonoNuevaPersona,
      user,
      userInput,
    );
  }

  static async getMensajeOtpNuevaPersona(user, userInput) {
    if (state[user]?.registroNuevaPersona?.otpIncorrecto) {
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          otpIncorrecto: false,
        },
      };
      return "La clave es incorrecta, intenta nuevamente.\n\nIngresa el código de 6 dígitos que se envió por SMS al número proporcionado.";
    }
    return "Se envió un código de 6 dígitos por SMS al número proporcionado. Ingresa el código para continuar.";
  }

  static async #confirmarOtpNuevaPersona(user, userInput) {
    const telefono = state[user]?.registroNuevaPersona?.telefono;
    try {
      const result = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: `+52${telefono}`,
          code: userInput.Body.trim(),
        });
      if (result.status === "approved") {
        console.log("OTP verificado para:", telefono);
        return true;
      }
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          otpIncorrecto: true,
        },
      };
      return false;
    } catch (error) {
      console.error("Error al verificar OTP:", error);
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          otpIncorrecto: true,
        },
      };
      return false;
    }
  }

  static async confirmarOtpNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#confirmarOtpNuevaPersona,
      user,
      userInput,
    );
  }

  static async getMensajeEventoNuevaPersona(user, userInput) {
    if (state[user]?.registroNuevaPersona?.eventoInvalido) {
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          eventoInvalido: false,
        },
      };
      return (
        "Opción no válida. Por favor selecciona un número de la lista o escribe *saltar*.\n\n" +
        state[user].registroNuevaPersona.mensajeEventos
      );
    }
    const eventos = await obtenerEventos(user);
    let mensaje =
      "Escribe *saltar* si no deseas asociar a la persona con ningún evento.\n\n";
    const opcionesEventos = {};
    if (eventos && eventos.length > 0) {
      mensaje +=
        "¿A qué evento pertenece la persona? Selecciona el número correspondiente:\n";
      eventos.forEach((evento, index) => {
        mensaje += `${index + 1}. ${evento.nombre}\n`;
        opcionesEventos[index + 1] = { id: evento.id, nombre: evento.nombre };
      });
    } else {
      mensaje += "No hay eventos disponibles en este momento.";
    }
    state[user] = {
      ...state[user],
      registroNuevaPersona: {
        ...state[user].registroNuevaPersona,
        opcionesEventos,
        mensajeEventos: mensaje,
      },
    };
    return mensaje;
  }

  static async #guardarEventoNuevaPersona(user, userInput) {
    const input = (userInput.Body || "").trim();
    if (input.toLowerCase() === "saltar") {
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          eventoid: null,
          eventoNombre: null,
        },
      };
      return true;
    }
    const opcion = state[user]?.registroNuevaPersona?.opcionesEventos?.[input];
    if (!opcion) {
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          eventoInvalido: true,
        },
      };
      return false;
    }
    state[user] = {
      ...state[user],
      registroNuevaPersona: {
        ...state[user].registroNuevaPersona,
        eventoid: opcion.id,
        eventoNombre: opcion.nombre,
      },
    };
    return true;
  }

  static async guardarEventoNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarEventoNuevaPersona,
      user,
      userInput,
    );
  }

  static async #guardarNombreNuevaPersona(user, userInput) {
    if (!userInput.Body || !userInput.Body.trim()) return false;
    state[user] = {
      ...state[user],
      registroNuevaPersona: {
        ...state[user].registroNuevaPersona,
        nombre: userInput.Body.trim(),
      },
    };
    return true;
  }

  static async guardarNombreNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarNombreNuevaPersona,
      user,
      userInput,
    );
  }

  static async #guardarCPNuevaPersona(user, userInput) {
    const cp = String(userInput.Body || "").trim();
    if (!/^\d{5}$/.test(cp)) {
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          cpValido: false,
        },
      };
      return false;
    }
    const colonias = await getColoniasByCP(cp);
    if (!colonias || colonias.length === 0) {
      state[user] = {
        ...state[user],
        registroNuevaPersona: {
          ...state[user].registroNuevaPersona,
          cpValido: false,
        },
      };
      return false;
    }
    state[user] = {
      ...state[user],
      registroNuevaPersona: {
        ...state[user].registroNuevaPersona,
        codigopostal: cp,
        cpValido: true,
      },
    };
    return true;
  }

  static async guardarCPNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarCPNuevaPersona,
      user,
      userInput,
    );
  }

  static async #guardarColoniaNuevaPersona(user, userInput) {
    const selectedColonia =
      state[user]?.registroNuevaPersona?.posiblesColonias?.[
        userInput.Body.trim()
      ];
    if (!selectedColonia) return false;
    state[user] = {
      ...state[user],
      registroNuevaPersona: {
        ...state[user].registroNuevaPersona,
        colonia: selectedColonia,
      },
    };
    return true;
  }

  static async guardarColoniaNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarColoniaNuevaPersona,
      user,
      userInput,
    );
  }

  static async #guardarRedSocialNuevaPersona(user, userInput) {
    const opciones = {
      1: "twitter",
      2: "instagram",
      3: "facebook",
      4: "tiktok",
    };
    const red = opciones[userInput.Body.trim()];
    if (!red) return false;
    state[user] = {
      ...state[user],
      registroNuevaPersona: {
        ...state[user].registroNuevaPersona,
        redSocialPreferida: red,
      },
    };
    return true;
  }

  static async guardarRedSocialNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarRedSocialNuevaPersona,
      user,
      userInput,
    );
  }

  static async #guardarUsernameRedSocialNuevaPersona(user, userInput) {
    if (!userInput.Body || !userInput.Body.trim()) return false;
    state[user] = {
      ...state[user],
      registroNuevaPersona: {
        ...state[user].registroNuevaPersona,
        usernameRedSocial: userInput.Body.trim(),
      },
    };
    return true;
  }

  static async guardarUsernameRedSocialNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#guardarUsernameRedSocialNuevaPersona,
      user,
      userInput,
    );
  }

  static async #confirmarRegistroNuevaPersona(user, userInput) {
    if (
      userInput.Body.toLowerCase() !== "si" &&
      userInput.Body.toLowerCase() !== "sí"
    ) {
      return false;
    }
    const datos = state[user]?.registroNuevaPersona;
    const phone = user.slice(-10);
    const registrandoPersona = (await obtenerPersona(user))?.[0];

    try {
      await axios.post(
        process.env.API_URL + "/chatbot/persona",
        {
          nombre: datos.nombre,
          telefono: datos.telefono,
          referer_hash: registrandoPersona?.hash_code || null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": process.env.API_SECRET,
            "X-From": phone,
          },
        },
      );

      await axios.put(
        process.env.API_URL + "/chatbot/persona/" + datos.telefono,
        {
          codigopostal: datos.codigopostal,
          colonia: datos.colonia,
          eventoid: datos.eventoid,
          [`${datos.redSocialPreferida}_handle`]: datos.usernameRedSocial,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": process.env.API_SECRET,
            "X-From": phone,
          },
        },
      );

      state[user] = {
        ...state[user],
        registroNuevaPersona: null,
        personaRegistradaExitosamente: true,
      };
      return true;
    } catch (error) {
      console.error("Error al registrar nueva persona:", error);
      return false;
    }
  }

  static async confirmarRegistroNuevaPersona(user, userInput) {
    return performAction(
      NuevaPersonaActions.#confirmarRegistroNuevaPersona,
      user,
      userInput,
    );
  }
}

module.exports = NuevaPersonaActions;
