import LegalShell, { LegalSection, LegalDivider, LegalList } from "@/components/legal/LegalShell";

const SECTIONS = [
  { id: "aceptacion", label: "1. Aceptación de los términos" },
  { id: "descripcion", label: "2. Descripción del servicio" },
  { id: "registro", label: "3. Registro y cuenta" },
  { id: "vendedores", label: "4. Obligaciones del vendedor" },
  { id: "compradores", label: "5. Obligaciones del comprador" },
  { id: "conducta", label: "6. Conducta prohibida" },
  { id: "tarifas", label: "7. Tarifas y pagos" },
  { id: "responsabilidad", label: "8. Limitación de responsabilidad" },
  { id: "propiedad", label: "9. Propiedad intelectual" },
  { id: "suspension", label: "10. Suspensión y cancelación" },
  { id: "modificaciones", label: "11. Modificaciones" },
  { id: "ley", label: "12. Ley aplicable" },
  { id: "contacto", label: "13. Contacto" },
];

export const metadata = {
  title: "Términos de Servicio | TCGRD",
  description: "Términos y condiciones de uso de TCGRD, el mercado P2P de cartas TCG en República Dominicana.",
};

export default function TerminosPage() {
  return (
    <LegalShell
      title="Términos de Servicio"
      subtitle="TCGRD es únicamente una plataforma de publicación: conectamos coleccionistas que quieren vender o conseguir cartas TCG. No gestionamos, retenemos ni procesamos dinero — todos los pagos ocurren directamente entre los usuarios."
      lastUpdated="Vigente desde el 10 de junio de 2026"
      sections={SECTIONS}
    >

      <LegalSection id="aceptacion" title="1. Aceptación de los términos">
        <p>
          Al acceder a TCGRD, crear una cuenta o realizar cualquier transacción a través de
          nuestra plataforma, usted acepta en su totalidad los presentes Términos de Servicio
          («Términos»). Si no está de acuerdo con alguna de estas condiciones, debe abstenerse
          de utilizar la plataforma.
        </p>
        <p>
          TCGRD se reserva el derecho de actualizar estos Términos en cualquier momento. El
          uso continuado de la plataforma tras la publicación de cambios constituye la
          aceptación de los nuevos términos. Las modificaciones relevantes serán notificadas
          con al menos 10 días de anticipación.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="descripcion" title="2. Descripción del servicio">
        <p>
          TCGRD es un mercado intermediario peer-to-peer (<em>P2P</em>) que facilita el
          encuentro entre coleccionistas y jugadores de cartas TCG para la compraventa de
          artículos de colección físicos. TCGRD <strong className="text-white">no es parte de ninguna
          transacción</strong> y no compra, vende ni posee los artículos listados.
        </p>
        <p>
          Actuamos exclusivamente como plataforma tecnológica. Toda transacción es un
          contrato directo y privado entre el comprador y el vendedor. TCGRD no presta
          servicios financieros ni actúa como intermediario de pagos regulado.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="registro" title="3. Registro y cuenta">
        <p>Para utilizar la plataforma debe:</p>
        <LegalList items={[
          "Ser mayor de 18 años o contar con autorización de un representante legal.",
          "Proporcionar información veraz, actualizada y completa durante el registro.",
          "Mantener la confidencialidad de sus credenciales de acceso.",
          "Notificarnos de inmediato ante cualquier uso no autorizado de su cuenta.",
        ]} />
        <p>
          Cada usuario puede tener únicamente una cuenta activa. TCGRD podrá verificar la
          identidad del usuario cuando lo considere necesario, en cumplimiento de la
          normativa vigente en la República Dominicana.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="vendedores" title="4. Obligaciones del vendedor">
        <p>
          Al publicar un artículo en TCGRD, el vendedor garantiza y declara que:
        </p>
        <LegalList items={[
          "Es el propietario legítimo del artículo o cuenta con autorización expresa para venderlo.",
          "El artículo es auténtico, genuino y no es una réplica, falsificación ni reproducción no autorizada.",
          "La descripción, condición, fotografías y precio del listado son precisos y no inducen a error.",
          "El artículo será entregado en el estado descrito y en el plazo acordado con el comprador.",
          "Asumirá cualquier reclamación derivada de una descripción inexacta o de un artículo no auténtico.",
        ]} />
        <p>
          El vendedor es responsable de acordar con el comprador el método de pago y entrega,
          la condición definitiva del artículo, y cualquier reclamación postventa.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="compradores" title="5. Obligaciones del comprador">
        <p>Al iniciar una compra, el comprador acepta:</p>
        <LegalList items={[
          "Leer detenidamente la descripción completa del listado antes de realizar una oferta o compra.",
          "Contactar al vendedor para resolver cualquier duda antes de comprometerse con la transacción.",
          "Respetar los precios y condiciones acordadas con el vendedor.",
          "Completar el pago en la forma y el plazo pactados con el vendedor.",
          "Asumir los riesgos inherentes a las transacciones P2P entre particulares.",
        ]} />
      </LegalSection>
      <LegalDivider />

      <LegalSection id="conducta" title="6. Conducta prohibida">
        <p>Está estrictamente prohibido en TCGRD:</p>
        <LegalList items={[
          "Listar, vender o intentar vender cartas falsificadas, alteradas o no auténticas de ninguna manera.",
          "Publicar artículos que no sean de su propiedad o cuya venta no esté autorizada.",
          "Acosar, amenazar o actuar de manera abusiva hacia otros usuarios.",
          "Manipular listados, precios o valoraciones para engañar a otros usuarios.",
          "Utilizar la plataforma para actividades ilegales según la legislación dominicana.",
          "Crear cuentas múltiples para evadir sanciones o restricciones.",
          "Realizar raspado de datos (scraping) o uso automatizado de la plataforma sin autorización.",
          "Publicar contenido obsceno, difamatorio o que infrinja derechos de terceros.",
        ]} />
        <p>
          El incumplimiento de estas normas puede resultar en la suspensión inmediata y
          permanente de la cuenta, la eliminación de listados y, cuando corresponda, el
          reporte a las autoridades competentes.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="tarifas" title="7. Tarifas y pagos">
        <p>
          En su etapa actual, TCGRD ofrece el uso de la plataforma de forma gratuita para
          vendedores y compradores. TCGRD se reserva el derecho de introducir tarifas de
          servicio o comisiones en el futuro, con un preaviso razonable a los usuarios.
        </p>
        <p>
          Todos los precios en la plataforma se expresan en pesos dominicanos (DOP). Los
          precios de referencia pueden mostrarse también en dólares estadounidenses (USD)
          como orientación. TCGRD no garantiza la exactitud de ninguna conversión de divisas.
        </p>
        <p>
          TCGRD <strong className="text-white">no interviene, procesa, retiene ni almacena
          ningún pago</strong>. Todo el dinero se transfiere directamente entre comprador y
          vendedor mediante los métodos que acuerden entre sí (efectivo, transferencia bancaria,
          pagos móviles, etc.). TCGRD no es responsable de ningún pago realizado ni de
          disputas económicas derivadas de transacciones entre usuarios.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="responsabilidad" title="8. Limitación de responsabilidad">
        <p>
          TCGRD provee la plataforma «tal cual» y «según disponibilidad», sin garantías
          explícitas ni implícitas de ningún tipo, incluyendo garantías de comerciabilidad,
          idoneidad para un propósito particular o ausencia de interrupciones.
        </p>
        <p>En ningún caso TCGRD será responsable por:</p>
        <LegalList items={[
          "Disputas, fraudes o incumplimientos entre compradores y vendedores.",
          "La autenticidad, condición o valor de los artículos listados.",
          "Pérdidas o daños derivados de transacciones realizadas a través de la plataforma.",
          "Interrupciones temporales del servicio por causas técnicas o de mantenimiento.",
          "Accesos no autorizados a cuentas por negligencia del usuario en la custodia de sus credenciales.",
        ]} />
        <p>
          La responsabilidad total de TCGRD frente a cualquier usuario, en cualquier
          circunstancia, no excederá de RD$5,000 (cinco mil pesos dominicanos).
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="propiedad" title="9. Propiedad intelectual">
        <p>
          El nombre TCGRD, su logotipo, diseño, código fuente y materiales originales de la
          plataforma son propiedad exclusiva de sus titulares y están protegidos por la
          legislación dominicana de propiedad intelectual.
        </p>
        <p>
          Las imágenes de cartas mostradas en la plataforma pertenecen a sus respectivos
          titulares (The Pokémon Company, Wizards of the Coast, etc.). TCGRD las utiliza
          únicamente con fines de referencia e identificación dentro del contexto del
          mercado de coleccionismo.
        </p>
        <p>
          Al subir imágenes de sus artículos, el usuario concede a TCGRD una licencia
          no exclusiva, libre de regalías, para mostrar dichas imágenes en la plataforma.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="suspension" title="10. Suspensión y cancelación">
        <p>
          TCGRD podrá suspender o cancelar su cuenta, a su sola discreción, si detecta
          violaciones a estos Términos, actividades fraudulentas o conductas perjudiciales
          para la comunidad o la plataforma.
        </p>
        <p>
          El usuario podrá cancelar su cuenta en cualquier momento desde la configuración de
          su perfil o solicitándolo a soporte.tcgrd@gmail.com. La cancelación no afecta obligaciones
          pendientes con otros usuarios derivadas de transacciones previas.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="modificaciones" title="11. Modificaciones del servicio">
        <p>
          TCGRD podrá modificar, suspender o descontinuar cualquier aspecto de la plataforma
          en cualquier momento. Haremos esfuerzos razonables para notificar cambios
          significativos con antelación suficiente, pero no garantizamos disponibilidad
          continua del servicio.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="ley" title="12. Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen exclusivamente por las leyes de la República Dominicana,
          sin perjuicio de sus normas de conflicto de leyes. Cualquier controversia derivada
          del uso de TCGRD será sometida a la jurisdicción de los tribunales competentes del
          Distrito Nacional, Santo Domingo, República Dominicana.
        </p>
        <p>
          Antes de iniciar cualquier acción legal, las partes deberán intentar resolver la
          disputa de buena fe mediante comunicación directa con TCGRD a través de los canales
          de soporte disponibles.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection id="contacto" title="13. Contacto">
        <p>Para consultas sobre estos Términos de Servicio:</p>
        <LegalList items={[
          "Correo electrónico: soporte.tcgrd@gmail.com",
          "Soporte en línea: tcgrd.com/soporte",
          "República Dominicana",
        ]} />
      </LegalSection>

    </LegalShell>
  );
}
