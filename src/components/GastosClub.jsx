import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  getDocs,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "./GastosClub.css";

function getMesActual() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

const GastosClub = () => {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [fecha, setFecha] = useState("");
  const [gastos, setGastos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(getMesActual());
  const [editandoId, setEditandoId] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");

  const guardarGasto = async () => {
    const nuevosErrores = {};

    if (!tipo) nuevosErrores.tipo = true;
    if (!monto) nuevosErrores.monto = true;
    if (!fecha) nuevosErrores.fecha = true;

    const montoFloat = parseFloat(monto);
    if (isNaN(montoFloat) || montoFloat <= 0) nuevosErrores.monto = true;

    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaSeleccionada > hoy) nuevosErrores.fecha = true;

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      alert("Hay errores en el formulario. Por favor revisa los campos.");
      return;
    }

    const mes = fecha.slice(0, 7);
    const gastoData = {
      tipo,
      descripcion,
      monto: montoFloat,
      metodo,
      fecha: Timestamp.fromDate(fechaSeleccionada),
    };

    try {
      if (editandoId) {
        const ref = doc(db, `gastosClub/${mes}/gastos/${editandoId}`);
        await updateDoc(ref, gastoData);
        setEditandoId(null);
      } else {
        await addDoc(collection(db, `gastosClub/${mes}/gastos`), gastoData);
      }

      limpiarFormulario();
      cargarGastos(mes);
      setMesSeleccionado(mes);
    } catch (error) {
      alert("Hubo un error al guardar el gasto.");
      console.error(error);
    }
  };

  const cargarGastos = async (mes) => {
    const ref = collection(db, `gastosClub/${mes}/gastos`);
    const q = query(ref);
    const snap = await getDocs(q);
    const datos = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().fecha.toDate(),
    }));
    setGastos(datos);
  };

  const handleRecargar = async () => {
    await cargarGastos(mesSeleccionado);
    setMensaje("Gastos actualizados ✅");
    setTimeout(() => setMensaje(""), 2000);
  };

  const eliminarGasto = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    await deleteDoc(doc(db, `gastosClub/${mesSeleccionado}/gastos/${id}`));
    cargarGastos(mesSeleccionado);
  };

  const editarGasto = (gasto) => {
    setTipo(gasto.tipo);
    setDescripcion(gasto.descripcion);
    setMonto(gasto.monto);
    setMetodo(gasto.metodo);
    setFecha(gasto.fecha.toISOString().slice(0, 10));
    setEditandoId(gasto.id);
    setErrores({});
  };

  const limpiarFormulario = () => {
    setTipo("");
    setDescripcion("");
    setMonto("");
    setMetodo("efectivo");
    setFecha("");
    setEditandoId(null);
    setErrores({});
  };

  const exportarExcel = () => {
    const data = gastos.map((g) => ({
      Tipo: g.tipo,
      Descripción: g.descripcion,
      Monto: g.monto,
      Método: g.metodo,
      Fecha: g.fecha.toLocaleDateString(),
    }));

    data.push({});
    data.push({
      Tipo: "",
      Descripción: "",
      Monto: totalGastos,
      Método: "",
      Fecha: "TOTAL DEL MES",
    });

    const hoja = XLSX.utils.json_to_sheet(data);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Gastos");

    XLSX.writeFile(libro, `Gastos_${mesSeleccionado}.xlsx`);
  };

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  const gastosPorMetodo = gastos.reduce((acc, gasto) => {
    acc[gasto.metodo] = acc[gasto.metodo] || [];
    acc[gasto.metodo].push(gasto);
    return acc;
  }, {});

  const subtotalPorMetodo = (metodo) => {
    return (gastosPorMetodo[metodo] || []).reduce((acc, g) => acc + g.monto, 0);
  };

  useEffect(() => {
    cargarGastos(mesSeleccionado);
  }, [mesSeleccionado]);

  return (
    <div className="gastos-container">
      <button className="btn volver" onClick={() => navigate("/dashboard")}>
        ← Volver a Cuotas
      </button>

      <h2 className="titulo">💸 Registro de Gastos del Club</h2>

      <div className="formulario">
        <div className="campos">
          <div className={`campo ${errores.tipo ? "error" : ""}`}>
            <label>Tipo de gasto</label>
            <input type="text" value={tipo} onChange={(e) => setTipo(e.target.value)} />
          </div>
          <div className="campo descripcion-campo">
            <label>Descripción</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className={`campo ${errores.monto ? "error" : ""}`}>
            <label>Monto</label>
            <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div className="campo">
            <label>Método de pago</label>
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div className={`campo ${errores.fecha ? "error" : ""}`}>
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>

        <div className="botones">
          <button onClick={guardarGasto} className="btn guardar">
            {editandoId ? "Actualizar" : "Guardar"} Gasto
          </button>
          {editandoId && (
            <button onClick={limpiarFormulario} className="btn cancelar">
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="gastos-listado">
        <div className="filtros">
          <h3>📅 Gastos del mes</h3>
          <div className="acciones">
            <input
              type="month"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
            />
            <button onClick={handleRecargar} className="btn recargar">
              🔄 Recargar
            </button>
            <button onClick={exportarExcel} className="btn exportar">
              Exportar Excel
            </button>
          </div>
        </div>

        {mensaje && <p className="mensaje-ok">{mensaje}</p>}

        {gastos.length === 0 ? (
          <p>No hay gastos registrados para este mes.</p>
        ) : (
          ["efectivo", "transferencia"].map((metodo) => (
            <div key={metodo} className={`metodo-${metodo}`}>
              <h4 className="metodo-titulo">
                {metodo === "efectivo" ? "💵 Efectivo" : "🏦 Transferencia"}
              </h4>
              <ul className="lista">
                {(gastosPorMetodo[metodo] || []).map((gasto) => (
                  <li key={gasto.id} className="gasto-item">
                    <div className="detalle">
                      <strong>{gasto.tipo}</strong>
                      <div className="descripcion">{gasto.descripcion}</div>
                      <div className="info">
                        💰 ${gasto.monto} - 📅 {gasto.fecha.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="acciones">
                      <button className="btn-link" onClick={() => editarGasto(gasto)}>✏️ Editar</button>
                      <button className="btn-link eliminar" onClick={() => eliminarGasto(gasto.id)}>🗑️ Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="subtotal">
                Subtotal {metodo}: ${subtotalPorMetodo(metodo).toFixed(2)}
              </div>
            </div>
          ))
        )}

        <div className="total">
          Total del mes: ${totalGastos.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default GastosClub;
