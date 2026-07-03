import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { apiFetch, getToken, setToken } from "../Config/api";
import PrintSolicitudView from "../Components/PrintSolicitudView";

interface DetalleItem {
  id_solicitud_insumo: number;
  id_insumo: number;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  num_serie?: string | null;
  cantidad: number;
  stock: number;
  descripcion?: string | null;
  aprobado?: number | null;
}

interface Solicitud {
  folio_solicitud: string;
  fecha: string;
  estatus: string;
  prioridad: string;
  nombre_empleado: string;
  nombre_departamento: string;
  detalle: DetalleItem[];
}

function waitForImages(): Promise<void> {
  return new Promise((resolve) => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
    const pending = imgs.filter((img) => !img.complete || img.naturalWidth === 0);
    if (pending.length === 0) { resolve(); return; }
    let remaining = pending.length;
    const done = () => { if (--remaining <= 0) resolve(); };
    pending.forEach((img) => {
      img.addEventListener("load",  done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
    setTimeout(resolve, 4000);
  });
}

export default function PrintSolicitudPage() {
  const { folio }               = useParams<{ folio: string }>();
  const [searchParams]          = useSearchParams();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [error, setError]       = useState<string>("");
  const printedRef               = useRef(false);

  useEffect(() => {
    document.body.classList.add("print-preview");
    return () => document.body.classList.remove("print-preview");
  }, []);

  useEffect(() => {
    if (!folio) return;
    const tokenParam = searchParams.get("token");
    if (tokenParam) setToken(tokenParam);
    const token = tokenParam ?? getToken();
    if (!token) {
      setError("Sesión no válida. Cierra esta pestaña, inicia sesión y vuelve a exportar el PDF.");
      return;
    }
    fetch(`/api/solicitudes/folio/${folio}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-requested-with": "XMLHttpRequest",
      },
    })
      .then((r) => {
        if (r.status === 401) throw new Error("Sesión expirada. Inicia sesión de nuevo y vuelve a exportar el PDF.");
        if (!r.ok) throw new Error(`Error ${r.status} al cargar la solicitud`);
        return r.json();
      })
      .then((data) => setSolicitud(data))
      .catch((e) => setError(e.message));
  }, [folio, searchParams]);

  useEffect(() => {
    if (!solicitud || printedRef.current) return;
    printedRef.current = true;
    const triggerPrint = async () => {
      await new Promise((r) => setTimeout(r, 300));
      await waitForImages();
      document.body.classList.remove("print-preview");
      await new Promise((r) => setTimeout(r, 100));
      window.print();
      document.body.classList.add("print-preview");
    };
    triggerPrint();
  }, [solicitud]);

  if (error) {
    return (
      <div style={{ fontFamily: "sans-serif", padding: 40, color: "#DC2626", display: "flex", flexDirection: "column", gap: 8 }}>
        <strong style={{ fontSize: 15 }}>No se pudo cargar el reporte</strong>
        <span style={{ fontSize: 13, color: "#6B7280" }}>{error}</span>
        <span style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
          Verifica que la sesión siga activa y vuelve a intentarlo.
        </span>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", padding: 48, display: "flex", alignItems: "center", gap: 14, color: "#6B7280", fontSize: 14 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8621A" strokeWidth="2.5" strokeLinecap="round"
          style={{ flexShrink: 0, animation: "pr-spin 0.9s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
        Preparando reporte para imprimir…
      </div>
    );
  }

  return <PrintSolicitudView solicitud={solicitud} />;
}
