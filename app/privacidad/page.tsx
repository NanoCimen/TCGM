import LegalShell, { LegalSection, LegalDivider, LegalList } from "@/components/legal/LegalShell";

const SECTIONS = [
  { id: "responsable", label: "1. Responsable del tratamiento" },
  { id: "datos", label: "2. Datos que recopilamos" },
  { id: "finalidad", label: "3. Finalidad del tratamiento" },
  { id: "base", label: "4. Base legal" },
  { id: "conservacion", label: "5. Conservación de datos" },
  { id: "terceros", label: "6. Proveedores y terceros" },
  { id: "transferencias", label: "7. Transferencias internacionales" },
  { id: "derechos", label: "8. Tus derechos" },
  { id: "cookies", label: "9. Cookies y almacenamiento local" },
  { id: "cambios", label: "10. Cambios en esta política" },
  { id: "contacto", label: "11. Contacto" },
];

export const metadata = {
  title: "Privacidad | TCGRD",
  description: "Política de privacidad y tratamiento de datos personales de TCGRD.",
};

export default function PrivacidadPage() {
  return (
    <LegalShell
      title="Política de Privacidad"
      subtitle="Tu privacidad es importante para nosotros. Esta política explica qué datos recopilamos, cómo los usamos y cuáles son tus derechos."
      lastUpdated="Vigente desde el 10 de junio de 2026"
      sections={SECTIONS}
    >

      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de tus datos personales es <strong className="text-white">TCGRD</strong>,
          plataforma de mercado peer-to-peer de cartas coleccionables operando desde la República Dominicana.
        </p>
        <p>
          Para cualquier consulta relacionada con el tratamiento de tus datos, puedes contactarnos en{" "}
          <a href="mailto:soporte.tcgrd@gmail.com" className="text-brand hover:underline">soporte.tcgrd@gmail.com</a>.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="datos" title="2. Datos que recopilamos">
        <p>Recopilamos únicamente los datos necesarios para operar la plataforma:</p>

        <p className="text-white font-semibold text-sm mt-2">Datos que tú nos proporcionas</p>
        <LegalList items={[
          "Dirección de correo electrónico (para autenticación y comunicaciones).",
          "Nombre o nombre de usuario que eliges mostrar públicamente.",
          "Foto de perfil y banner (si decides subirlos — son opcionales).",
          "Información de los artículos que publicas: nombre, precio, condición, fotografías e idioma.",
          "Contenido de mensajes o reportes enviados a soporte.",
        ]} />

        <p className="text-white font-semibold text-sm mt-4">Datos recopilados automáticamente</p>
        <LegalList items={[
          "Registros de acceso: dirección IP, tipo de navegador, sistema operativo y fecha/hora.",
          "Datos de uso: páginas visitadas, búsquedas realizadas, listados vistos.",
          "Sesión: token de sesión cifrado almacenado en cookie segura (HttpOnly).",
        ]} />

        <p>
          No recopilamos información de pago de ningún tipo. Los pagos se realizan directamente
          entre usuarios fuera de la plataforma.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="finalidad" title="3. Finalidad del tratamiento">
        <p>Tus datos son utilizados exclusivamente para:</p>
        <LegalList items={[
          "Autenticarte de forma segura y mantener tu sesión activa.",
          "Mostrar tu perfil público (nombre de usuario y foto si los configuraste).",
          "Publicar y gestionar tus listados en el mercado.",
          "Enviarte notificaciones sobre tu wishlist cuando una carta que sigues esté disponible.",
          "Enviarte comunicaciones relacionadas con tu cuenta (cambios de contraseña, alertas de seguridad).",
          "Prevenir fraudes, abusos y cumplir con obligaciones legales.",
          "Mejorar la plataforma mediante análisis de uso anónimo y agregado.",
        ]} />
        <p>
          No utilizamos tus datos para publicidad de terceros, perfilado comercial ni los
          vendemos bajo ninguna circunstancia.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="base" title="4. Base legal del tratamiento">
        <p>El tratamiento de tus datos se fundamenta en:</p>
        <LegalList items={[
          "Ejecución de contrato: el tratamiento es necesario para prestarte el servicio que solicitaste al registrarte.",
          "Consentimiento: para el envío de notificaciones opcionales (wishlist, actualizaciones de la plataforma).",
          "Interés legítimo: para la seguridad de la plataforma, prevención de fraudes y análisis de uso anónimo.",
          "Cumplimiento legal: cuando la normativa dominicana nos obligue a conservar o revelar información.",
        ]} />
      </LegalSection>
      <LegalDivider />

      <LegalSection id="conservacion" title="5. Conservación de datos">
        <p>
          Conservamos tus datos personales mientras tu cuenta esté activa. Cuando solicites
          la eliminación de tu cuenta:
        </p>
        <LegalList items={[
          "Los datos de perfil (email, nombre, foto) serán eliminados en un plazo de 30 días.",
          "Los listados publicados pueden conservarse de forma anonimizada para mantener la integridad del historial de transacciones.",
          "Los registros de acceso se eliminan automáticamente a los 90 días.",
          "Podemos conservar datos adicionales si una obligación legal nos lo exige.",
        ]} />
      </LegalSection>
      <LegalDivider />

      <LegalSection id="terceros" title="6. Proveedores y subencargados">
        <p>
          TCGRD utiliza los siguientes proveedores de confianza para operar el servicio:
        </p>
        <LegalList items={[
          "Supabase Inc. — base de datos, autenticación y almacenamiento de archivos. Datos alojados en AWS (región us-east-1). Más información en supabase.com/privacy.",
          "Vercel Inc. — alojamiento web y red de distribución de contenido (CDN). Más información en vercel.com/legal/privacy-policy.",
          "The Pokémon Company International — imágenes de referencia de cartas a través de la API pública de Pokémon TCG.",
        ]} />
        <p>
          Todos nuestros proveedores clave están sujetos a acuerdos de procesamiento de
          datos compatibles con estándares internacionales de privacidad (GDPR/SOC 2).
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="transferencias" title="7. Transferencias internacionales de datos">
        <p>
          Al utilizar TCGRD, tus datos pueden ser procesados en servidores ubicados fuera
          de la República Dominicana (principalmente en Estados Unidos, donde operan nuestros
          proveedores Supabase y Vercel). Estas transferencias se realizan bajo garantías
          contractuales adecuadas y con proveedores que cumplen estándares internacionales
          de seguridad y privacidad.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="derechos" title="8. Tus derechos">
        <p>
          De conformidad con la Ley 172-13 sobre protección de datos personales de la
          República Dominicana y estándares internacionales, tienes derecho a:
        </p>
        <LegalList items={[
          "Acceso: solicitar una copia de los datos personales que tenemos sobre ti.",
          "Rectificación: corregir datos inexactos o incompletos desde la configuración de tu perfil.",
          "Eliminación: solicitar la eliminación de tu cuenta y datos asociados.",
          "Portabilidad: recibir tus datos en un formato estructurado y de uso común.",
          "Oposición: oponerte al tratamiento de tus datos para fines específicos.",
          "Revocación del consentimiento: retirar cualquier consentimiento que hayas otorgado en cualquier momento.",
        ]} />
        <p>
          Para ejercer cualquiera de estos derechos, escríbenos a{" "}
          <a href="mailto:soporte.tcgrd@gmail.com" className="text-brand hover:underline">soporte.tcgrd@gmail.com</a>{" "}
          con el asunto «Solicitud de privacidad». Responderemos en un plazo máximo de 30 días hábiles.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="cookies" title="9. Cookies y almacenamiento local">
        <p>TCGRD utiliza un número mínimo de cookies, todas necesarias para el funcionamiento del servicio:</p>
        <LegalList items={[
          "Cookie de sesión (HttpOnly, Secure): almacena tu token de autenticación. Se elimina al cerrar sesión.",
          "Preferencias locales: configuraciones de visualización guardadas en localStorage de tu navegador. No contienen datos personales.",
        ]} />
        <p>
          No utilizamos cookies de seguimiento, analítica de terceros ni publicidad comportamental.
          No es necesario un banner de cookies para estas cookies esenciales bajo la normativa aplicable.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="cambios" title="10. Cambios en esta política">
        <p>
          Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras
          prácticas o en la normativa aplicable. Cuando los cambios sean significativos, te
          notificaremos por correo electrónico o mediante un aviso destacado en la plataforma
          con al menos 15 días de antelación.
        </p>
        <p>
          La versión vigente siempre estará disponible en tcgrd.com/privacidad con la
          fecha de última actualización claramente indicada.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="contacto" title="11. Contacto">
        <p>
          Si tienes preguntas, inquietudes o solicitudes relacionadas con el tratamiento de
          tus datos personales:
        </p>
        <LegalList items={[
          "Correo electrónico: soporte.tcgrd@gmail.com",
          "Asunto sugerido: «Solicitud de privacidad»",
          "República Dominicana",
        ]} />
        <p>
          Si consideras que tus derechos no han sido atendidos adecuadamente, puedes
          presentar una reclamación ante el Instituto Dominicano de las Telecomunicaciones
          (INDOTEL) u otras autoridades competentes en materia de protección de datos.
        </p>
      </LegalSection>

    </LegalShell>
  );
}
