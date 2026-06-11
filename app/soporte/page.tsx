"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronDown, Mail, Users, Search, ShoppingBag, Shield, CreditCard, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const CATEGORIES = [
  { icon: ShoppingBag, label: "Compra y venta", id: "compraventa" },
  { icon: Search, label: "Búsqueda de cartas", id: "busqueda" },
  { icon: CreditCard, label: "Precios y pagos", id: "pagos" },
  { icon: Shield, label: "Seguridad", id: "seguridad" },
  { icon: Users, label: "Cuenta y perfil", id: "cuenta" },
  { icon: HelpCircle, label: "Otros", id: "otros" },
];

type FAQ = { q: string; a: string; category: string };

const FAQS: FAQ[] = [
  // compraventa
  {
    category: "compraventa",
    q: "¿Cómo publico una carta para vender?",
    a: "Desde el dashboard, haz clic en \"Publicar carta\". Completa el formulario con el nombre de la carta, condición, precio en DOP, fotos y detalles como idioma y variante. Tu listado aparecerá en el mercado inmediatamente después de publicarlo.",
  },
  {
    category: "compraventa",
    q: "¿Cómo contacto a un vendedor?",
    a: "En la página de detalle de cada carta hay un botón de contacto. Al hacer clic se abre el chat con el vendedor directamente en la plataforma. Coordinen el método de pago y entrega entre ustedes.",
  },
  {
    category: "compraventa",
    q: "¿Qué hago si recibí una carta que no coincide con el listado?",
    a: "Contacta al vendedor primero para resolver el problema directamente. Si no llegan a un acuerdo, puedes reportar el caso a soporte.tcgrd@gmail.com con fotos y detalles de la transacción. TCGRD revisará el caso y podrá suspender al vendedor si se comprueba mal comportamiento.",
  },
  {
    category: "compraventa",
    q: "¿TCGRD garantiza las transacciones?",
    a: "TCGRD es un mercado peer-to-peer: conectamos compradores y vendedores, pero no somos parte de las transacciones. Te recomendamos verificar el perfil y valoraciones del vendedor, ver fotos detalladas, y preferir transacciones en persona cuando sea posible.",
  },
  // busqueda
  {
    category: "busqueda",
    q: "¿Cómo funciona la wishlist?",
    a: "En la sección Wishlist, busca cualquier carta de la base de datos oficial de Pokémon TCG y agrégala a tu lista. Cuando alguien publique esa carta en el mercado de TCGRD, recibirás una notificación automáticamente.",
  },
  {
    category: "busqueda",
    q: "¿Por qué no aparece la carta que busco en el mercado?",
    a: "Si una carta no aparece en el mercado es porque ningún usuario la ha publicado aún. Agrégala a tu wishlist para recibir una notificación en cuanto esté disponible.",
  },
  {
    category: "busqueda",
    q: "¿Cómo funcionan los precios de referencia?",
    a: "Los precios de referencia de mercado (\"Ref. mercado\") provienen de TCGPlayer, una plataforma internacional de precios. Son orientativos — el precio real lo fija cada vendedor libremente en DOP.",
  },
  // pagos
  {
    category: "pagos",
    q: "¿Qué métodos de pago se aceptan?",
    a: "TCGRD no procesa pagos. Los métodos de pago los coordinan comprador y vendedor directamente. Los más comunes en la comunidad son efectivo, transferencia bancaria dominicana y pagos móviles.",
  },
  {
    category: "pagos",
    q: "¿Por qué los precios se muestran en DOP y USD?",
    a: "Los precios de los listados se publican en pesos dominicanos (DOP). Los precios de referencia internacionales se muestran en USD como comparación. La tasa de cambio usada es aproximada y puede variar.",
  },
  {
    category: "pagos",
    q: "¿Cobra TCGRD comisión por las ventas?",
    a: "Actualmente TCGRD es gratuito para compradores y vendedores. Si en el futuro introducimos tarifas, te notificaremos con antelación y actualizaremos los Términos de Servicio.",
  },
  // seguridad
  {
    category: "seguridad",
    q: "¿Cómo evito estafas?",
    a: "Revisa siempre el perfil del vendedor y sus valoraciones. Pide fotos adicionales si tienes dudas. Para cartas de valor alto, prefiere encuentros en persona en lugares públicos o usa servicios de verificación. Desconfía de ofertas extremadamente por debajo del precio de mercado.",
  },
  {
    category: "seguridad",
    q: "¿Cómo reporto una carta falsa o a un usuario malicioso?",
    a: "Usa el botón \"Reportar\" en el listado o el perfil del usuario. También puedes escribirnos directamente a soporte.tcgrd@gmail.com con capturas de pantalla y detalles. Investigamos todos los reportes y actuamos con rapidez.",
  },
  // cuenta
  {
    category: "cuenta",
    q: "¿Cómo cambio mi foto de perfil o banner?",
    a: "Ve a tu perfil y haz clic en el ícono de edición sobre la foto o el banner. Selecciona una imagen desde tu dispositivo. Los archivos deben ser JPG o PNG y no superar 5 MB.",
  },
  {
    category: "cuenta",
    q: "¿Cómo elimino mi cuenta?",
    a: "Escríbenos a soporte.tcgrd@gmail.com con el asunto «Eliminar cuenta» desde el correo registrado. Eliminaremos tu cuenta y datos personales en un plazo de 30 días.",
  },
  {
    category: "cuenta",
    q: "Olvidé mi contraseña, ¿qué hago?",
    a: "En la pantalla de inicio de sesión, haz clic en \"¿Olvidaste tu contraseña?\" e ingresa tu correo. Te enviaremos un enlace para restablecerla. Revisa también tu carpeta de spam.",
  },
];

function FAQItem({ item }: { item: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/[0.06] rounded-2xl bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-sm font-semibold text-gray-300 leading-relaxed">{item.q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.26, ease }}
          className="flex-shrink-0 mt-0.5"
        >
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ans"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <p className="border-t border-white/[0.05] px-5 py-4 text-sm text-gray-500 leading-7">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SoportePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? FAQS.filter((f) => f.category === activeCategory)
    : FAQS;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-[#080808]/80 backdrop-blur-2xl border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Mercado
          </Link>
          <Link href="/">
            <Image src="/solo-logo.png" alt="TCGRD" width={28} height={28} className="h-7 w-7" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          <span className="inline-block text-[10px] font-bold tracking-[0.22em] uppercase text-brand mb-5">
            Centro de ayuda
          </span>
          <h1 className="text-5xl font-black tracking-tight text-white mb-4 leading-none">
            ¿En qué podemos<br />ayudarte?
          </h1>
          <p className="text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
            Encuentra respuestas rápidas sobre compraventa de cartas, tu cuenta, precios y
            mucho más.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-24">
        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.1 }}
          className="flex flex-wrap gap-2.5 mb-10"
        >
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              activeCategory === null
                ? "bg-brand text-black border-brand"
                : "border-white/[0.08] bg-white/[0.03] text-gray-500 hover:text-white hover:border-white/[0.15]"
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(active ? null : c.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? "bg-brand text-black border-brand"
                    : "border-white/[0.08] bg-white/[0.03] text-gray-500 hover:text-white hover:border-white/[0.15]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
              </button>
            );
          })}
        </motion.div>

        {/* FAQ list */}
        <div className="space-y-2.5 mb-20">
          <AnimatePresence mode="wait">
            {filtered.map((f, i) => (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease, delay: i * 0.04 }}
              >
                <FAQItem item={f} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="text-center text-gray-600 text-sm py-12">
              No hay preguntas en esta categoría aún.
            </p>
          )}
        </div>

        {/* Contact section */}
        <div className="border-t border-white/[0.06] pt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              ¿No encontraste lo que buscabas?
            </h2>
            <p className="text-sm text-gray-500">
              Nuestro equipo responde en menos de 24 horas en días hábiles.
            </p>
          </div>

          <div className="max-w-sm mx-auto">
            <a
              href="mailto:soporte.tcgrd@gmail.com"
              className="group flex items-start gap-4 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04] transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-0.5">Correo electrónico</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  soporte.tcgrd@gmail.com<br />
                  Respuesta en menos de 24 h
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-700">
            © 2026 TCGRD · República Dominicana
          </p>
          <div className="flex gap-5 text-xs text-gray-700">
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/soporte" className="hover:text-white transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
