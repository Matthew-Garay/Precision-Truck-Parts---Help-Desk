import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getToken, setToken, apiFetch } from "../Config/api";
import PrintHistorialView from "../Components/PrintHistorialView";
import { LoadingPrint, ErrorPrint } from "../Components/PrintShared";
import { waitForImages } from "../Config/printUtils";

interface Acceso {
  fecha_entrada: string;
  fecha_salida:  string | null;
}

interface Empleado {
  id_empleado:         number;
  num_empleado:        string | null;
  nombre:              string;
  ap_paterno:          string;
  ap_materno:          string | null;
  email:               string;
  nombre_rol:          string | null;
  nombre_departamento: string | null;
  nombre_sucursal:     string | null;
  estatus:             string;
}

interface HistorialData {
  empleado: Empleado;
  accesos:  Acceso[];
  desde:    string | null;
  hasta:    string | null;
}

export default function PrintHistorialPage() {
  const { id }             = useParams<{ id: string }>();
  const [searchParams]     = useSearchParams();
  const [data,  setData]   = useState<HistorialData | null>(null);
  const [error, setError]  = useState("");
  const [ready, setReady]  = useState(false);

  useEffect(() => {
    if (!id) return;
    const tokenParam = searchParams.get("token");
    if (tokenParam) setToken(tokenParam);
    const token = tokenParam ?? getToken();
    if (!token) {
      setError("Sesión no válida. Cierra esta pestaña, inicia sesión y vuelve a exportar.");
      return;
    }

    const desde = searchParams.get("desde") ?? "";
    const hasta  = searchParams.get("hasta")  ?? "";

    // Carga empleado + accesos en paralelo
    Promise.all([
      fetch(`/api/auth/empleados/${id}`, {
        headers: { Authorization: `Bearer ${token}`, "x-requested-with": "XMLHttpRequest" },
      }),
      fetch(`/api/auth/accesos/${id}`, {
        headers: { Authorization: `Bearer ${token}`, "x-requested-with": "XMLHttpRequest" },
      }),
    ])
      .then(async ([re, ra]) => {
        if (re.status === 401 || ra.status === 401)
          throw new Error("Sesión expirada. Inicia sesión de nuevo.");
        if (!re.ok) throw new Error(`Error ${re.status} al cargar empleado`);
        if (!ra.ok) throw new Error(`Error ${ra.status} al cargar accesos`);
        const empleado: Empleado = await re.json();
        const raw = await ra.json();
        let accesos: Acceso[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

        // Aplicar filtro de fechas si vienen en los params
        if (desde) {
          const d = new Date(desde); d.setHours(0, 0, 0, 0);
          accesos = accesos.filter(a => new Date(a.fecha_entrada) >= d);
        }
        if (hasta) {
          const h = new Date(hasta); h.setHours(23, 59, 59, 999);
          accesos = accesos.filter(a => new Date(a.fecha_entrada) <= h);
        }

        setData({ empleado, accesos, desde: desde || null, hasta: hasta || null });
      })
      .catch(e => setError(e.message));
  }, [id, searchParams]);

  useEffect(() => {
    if (!data) return;
    waitForImages().then(() => setReady(true));
  }, [data]);

  if (error) return <ErrorPrint message={error} />;
  if (!data)  return <LoadingPrint />;

  const nombre = `${data.empleado.nombre} ${data.empleado.ap_paterno}`.trim();

  return (
    <>
      <div className="pr-toolbar">
        <span className="pr-toolbar-title">Historial de accesos — {nombre}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pr-btn pr-btn--outline" onClick={() => window.close()}>Cerrar</button>
          <button
            className="pr-btn pr-btn--primary"
            disabled={!ready}
            onClick={() => window.print()}
          >
            {ready ? "🖨  Imprimir / Guardar PDF" : "Cargando…"}
          </button>
        </div>
      </div>
      <PrintHistorialView data={data} />
    </>
  );
}
