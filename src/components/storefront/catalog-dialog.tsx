"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { editorialEase, useEditorialMotion } from "./motion";

/** Native modal supplies focus containment, inert background and focus restoration. */
export function CatalogDialog({ title, onDismiss, children, wide = false }: {
  title: string; onDismiss: () => void; children: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { reduced } = useEditorialMotion();
  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  return <dialog ref={ref} className="catalog-dialog" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onDismiss(); }}>
    <motion.div className="catalog-dialog-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }} onClick={onDismiss} aria-hidden="true" />
    <motion.section className={`catalog-dialog-panel ${wide ? "catalog-dialog-wide" : ""}`}
      initial={{ opacity: 0, y: reduced ? 0 : 60, scale: reduced ? 1 : 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduced ? 0 : 30 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: editorialEase }}>
      <h2 id={titleId} className="sr-only">{title}</h2>
      <button type="button" className="catalog-close" onClick={onDismiss} aria-label="Cerrar ventana" autoFocus><X size={20} /></button>
      {children}
    </motion.section>
  </dialog>;
}
