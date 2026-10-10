"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { editorialEase, useEditorialMotion } from "./motion";

/** Native modal supplies focus containment, inert background and focus restoration. */
export function CatalogDialog({ title, onDismiss, children, wide = false }: {
  title: string; onDismiss: () => void; children: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { reduced } = useEditorialMotion();
  // The editorial system bottoms-anchors panels under 760px — the sheet
  // affordance (handle + vertical drag-to-dismiss) only exists there.
  const isMobile = useMediaQuery("(max-width: 760px)");
  const dragControls = useDragControls();
  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.y > 120 || info.velocity.y > 500) onDismiss();
  }

  return <dialog ref={ref} className="catalog-dialog" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onDismiss(); }}>
    <motion.div className="catalog-dialog-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }} onClick={onDismiss} aria-hidden="true" />
    <motion.section className={`catalog-dialog-panel ${wide ? "catalog-dialog-wide" : ""}`}
      initial={{ opacity: 0, y: reduced ? 0 : 60, scale: reduced ? 1 : 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduced ? 0 : 30 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: editorialEase }}
      drag={isMobile ? "y" : false}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.15 }}
      onDragEnd={handleDragEnd}>
      {isMobile && (
        <div className="sheet-handle" aria-hidden="true"
          onPointerDown={(event) => dragControls.start(event)} />
      )}
      <h2 id={titleId} className="sr-only">{title}</h2>
      <button type="button" className="catalog-close" onClick={onDismiss} aria-label="Cerrar ventana" autoFocus><X size={20} /></button>
      {children}
    </motion.section>
  </dialog>;
}
