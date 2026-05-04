const axios = require("axios");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

let state = {};

const performAction = (cb, user, userInput) => {
  if (
    userInput.Body.toString().toLowerCase() === "salir" ||
    userInput.Body.toString().toLowerCase() === "cancelar"
  )
    return true;
  return cb(user, userInput);
};

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
    console.error("Error al obtener persona:", error);
    return null;
  }
}


class NuevoReporteActions {
  static tieneReporteRegistradoExitosamente(user) {
    const flag = state[user]?.reporteRegistradoExitosamente ?? false;
    if (flag)
      state[user] = { ...state[user], reporteRegistradoExitosamente: false };
    return flag;
  }

  static async tienePermisoParaRegistrarReportesDeApoyo(user) {
    const persona = await obtenerPersona(user);
    return (
      persona?.[0]?.tiene_permiso_para_registrar_reportes_de_apoyo ?? false
    );
  }

  static async getMensajeTelefonoNuevoReporte(user, userInput) {
    if (state[user]?.registroNuevoReporte?.errorTelefono) {
      const error = state[user].registroNuevoReporte.errorTelefono;
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          errorTelefono: null,
        },
      };
      return (
        error +
        " Por favor, ingresa nuevamente el número de teléfono (10 dígitos)."
      );
    }
    return "Por favor, ingresa el número de teléfono (10 dígitos) de la persona.";
  }

  static async getMensajeNombreNuevoReporte(user, userInput) {
    return "Por favor, ingresa el nombre de la persona.";
  }

  static async getMensajeDescripcionNuevoReporte(user, userInput) {
    if (state[user]?.registroNuevoReporte?.errorDescripcion) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          errorDescripcion: false,
        },
      };
      return "No se recibió ninguna descripción. Por favor escribe una descripción del apoyo o envía una nota de voz.";
    }
    return "Por favor escribe una descripción del apoyo o envía una nota de voz.";
  }

  static async getMensajeUbicacionNuevoReporte(user, userInput) {
    if (state[user]?.registroNuevoReporte?.errorUbicacion) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          errorUbicacion: false,
        },
      };
      return "No se detectó una ubicación. Por favor, usa la opción de ubicación de WhatsApp para compartir la localización del apoyo.";
    }
    return "Por favor, comparte la ubicación del apoyo usando la opción de ubicación de WhatsApp.";
  }

  static async getMensajeFotoNuevoReporte(user, userInput) {
    if (state[user]?.registroNuevoReporte?.errorFoto) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          errorFoto: false,
        },
      };
      return "No se detectó una imagen. Por favor, envía una foto del apoyo.";
    }
    return "Por favor, envía una foto del apoyo.";
  }

  static async getMensajeConfirmacionNuevoReporte(user, userInput) {
    const datos = state[user]?.registroNuevoReporte;
    const descripcion = datos?.apoyodescripcionvoz_url
      ? "(nota de voz adjunta)"
      : datos?.apoyodescripcion ?? "";
    return `Por favor confirma los siguientes datos del reporte:
Teléfono: ${datos?.telefono}
Nombre: ${datos?.nombre}
Descripción: ${descripcion}

¿Los datos son correctos? Escribe *si* para confirmar o *cancelar* para salir.`;
  }

  static async #guardarTelefonoNuevoReporte(user, userInput) {
    const telefono = String(userInput.Body || "").trim();
    state[user] = { ...state[user], registroNuevoReporte: {} };

    if (!/^\d{10}$/.test(telefono)) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          errorTelefono: "El número de teléfono debe tener 10 dígitos.",
        },
      };
      return false;
    }

    state[user] = {
      ...state[user],
      registroNuevoReporte: { ...state[user].registroNuevoReporte, telefono },
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
        registroNuevoReporte: {
          errorTelefono:
            "No se pudo enviar el código de verificación. Verifica el número e intenta de nuevo.",
        },
      };
      return false;
    }
    return true;
  }

  static async guardarTelefonoNuevoReporte(user, userInput) {
    return performAction(
      NuevoReporteActions.#guardarTelefonoNuevoReporte,
      user,
      userInput,
    );
  }

  static async getMensajeOtpNuevoReporte(user, userInput) {
    if (state[user]?.registroNuevoReporte?.otpIncorrecto) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          otpIncorrecto: false,
        },
      };
      return "La clave es incorrecta, intenta nuevamente.\n\nIngresa el código de 6 dígitos que se envió por SMS al número proporcionado.";
    }
    return "Se envió un código de 6 dígitos por SMS al número proporcionado. Ingresa el código para continuar.";
  }

  static async #confirmarOtpNuevoReporte(user, userInput) {
    const telefono = state[user]?.registroNuevoReporte?.telefono;
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
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          otpIncorrecto: true,
        },
      };
      return false;
    } catch (error) {
      console.error("Error al verificar OTP:", error);
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          otpIncorrecto: true,
        },
      };
      return false;
    }
  }

  static async confirmarOtpNuevoReporte(user, userInput) {
    return performAction(
      NuevoReporteActions.#confirmarOtpNuevoReporte,
      user,
      userInput,
    );
  }

  static async #guardarNombreNuevoReporte(user, userInput) {
    if (!userInput.Body || !userInput.Body.trim()) return false;
    state[user] = {
      ...state[user],
      registroNuevoReporte: {
        ...state[user].registroNuevoReporte,
        nombre: userInput.Body.trim(),
      },
    };
    return true;
  }

  static async guardarNombreNuevoReporte(user, userInput) {
    return performAction(
      NuevoReporteActions.#guardarNombreNuevoReporte,
      user,
      userInput,
    );
  }

  static async #guardarDescripcionNuevoReporte(user, userInput) {
    const hasMedia = Number(userInput.NumMedia || 0) > 0;
    const contentType = userInput.MediaContentType0 || "";
    const bodyText = (userInput.Body || "").trim();

    if (hasMedia && contentType.startsWith("audio/")) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          apoyodescripcionvoz_url: userInput.MediaUrl0,
        },
      };
      return true;
    }

    if (bodyText) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          apoyodescripcion: bodyText,
        },
      };
      return true;
    }

    state[user] = {
      ...state[user],
      registroNuevoReporte: {
        ...state[user].registroNuevoReporte,
        errorDescripcion: true,
      },
    };
    return false;
  }

  static async guardarDescripcionNuevoReporte(user, userInput) {
    return performAction(
      NuevoReporteActions.#guardarDescripcionNuevoReporte,
      user,
      userInput,
    );
  }

  static async #guardarUbicacionNuevoReporte(user, userInput) {
    const lat = userInput.Latitude;
    const lng = userInput.Longitude;
    if (!lat || !lng) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          errorUbicacion: true,
        },
      };
      return false;
    }
    state[user] = {
      ...state[user],
      registroNuevoReporte: {
        ...state[user].registroNuevoReporte,
        latitud: lat,
        longitud: lng,
      },
    };
    return true;
  }

  static async guardarUbicacionNuevoReporte(user, userInput) {
    return performAction(
      NuevoReporteActions.#guardarUbicacionNuevoReporte,
      user,
      userInput,
    );
  }

  static async #guardarFotoNuevoReporte(user, userInput) {
    const contentType = userInput.MediaContentType0 || "";
    if (!userInput.MediaUrl0 || !contentType.startsWith("image/")) {
      state[user] = {
        ...state[user],
        registroNuevoReporte: {
          ...state[user].registroNuevoReporte,
          errorFoto: true,
        },
      };
      return false;
    }
    state[user] = {
      ...state[user],
      registroNuevoReporte: {
        ...state[user].registroNuevoReporte,
        foto_url: userInput.MediaUrl0,
      },
    };
    return true;
  }

  static async guardarFotoNuevoReporte(user, userInput) {
    return performAction(
      NuevoReporteActions.#guardarFotoNuevoReporte,
      user,
      userInput,
    );
  }

  static async #confirmarNuevoReporte(user, userInput) {
    if (
      userInput.Body.toLowerCase() !== "si" &&
      userInput.Body.toLowerCase() !== "sí"
    ) {
      return false;
    }
    const datos = state[user]?.registroNuevoReporte;
    const phone = user.slice(-10);

    try {
      await axios.post(
        process.env.API_URL + "/chatbot/reporte",
        {
          telefono: datos.telefono,
          nombre: datos.nombre,
          apoyodescripcion: datos.apoyodescripcion,
          apoyodescripcionvoz_url: datos.apoyodescripcionvoz_url,
          ubicacion_latitud: datos.latitud,
          ubicacion_longitud: datos.longitud,
          foto_url: datos.foto_url,
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
        registroNuevoReporte: null,
        reporteRegistradoExitosamente: true,
      };
      return true;
    } catch (error) {
      console.error("Error al registrar reporte:", error);
      return false;
    }
  }

  static async confirmarNuevoReporte(user, userInput) {
    return performAction(
      NuevoReporteActions.#confirmarNuevoReporte,
      user,
      userInput,
    );
  }
}

module.exports = NuevoReporteActions;
