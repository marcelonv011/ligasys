import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import "./PlayerForm.css";

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const años = ["2025", "2026", "2027", "2028", "2029", "2030"];

function PlayerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [player, setPlayer] = useState({
    name: "",
    dni: "",
    phone: "",
    parentPhone: "",
    category: "",
    payments: {},
  });

  const [selectedAño, setSelectedAño] = useState("2025");
  const [selectedMes, setSelectedMes] = useState("Enero");

  useEffect(() => {
    if (isEditMode) {
      const fetchPlayer = async () => {
        const playerRef = doc(db, "players", id);
        const playerSnap = await getDoc(playerRef);
        if (playerSnap.exists()) {
          setPlayer(playerSnap.data());
        }
      };
      fetchPlayer();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlayer((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (field, value) => {
    const key = `${selectedMes}_${selectedAño}`;
    if (field === "status" && value === "unpaid") {
      setPlayer((prev) => ({
        ...prev,
        payments: {
          ...prev.payments,
          [key]: {
            status: value,
            amount: "",
            method: "",
          },
        },
      }));
    } else {
      setPlayer((prev) => ({
        ...prev,
        payments: {
          ...prev.payments,
          [key]: {
            ...prev.payments?.[key],
            [field]: field === "amount" ? parseFloat(value) || "" : value,
          },
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!player.name || !player.category) {
      alert("Nombre y categoría son obligatorios");
      return;
    }

    const key = `${selectedMes}_${selectedAño}`;
    const pago = player.payments?.[key] || {};

    if (pago.status === "paid" && (!pago.amount || pago.amount <= 0)) {
      alert("Debes ingresar un importe válido si el estado es 'Pagado'");
      return;
    }
    if (pago.status === "paid" && !pago.method) {
      alert("Debes seleccionar un método de pago si el estado es 'Pagado'");
      return;
    }

    try {
      if (isEditMode) {
        await updateDoc(doc(db, "players", id), player);
      } else {
        await addDoc(collection(db, "players"), player);
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Error guardando jugador:", error);
    }
  };

  const key = `${selectedMes}_${selectedAño}`;
  const pago = player.payments?.[key] || {};

  return (
    <div className="form-container">
      <h2>{isEditMode ? "Editar Jugador" : "Agregar Jugador"}</h2>

      <form onSubmit={handleSubmit} className="form">
        {/* Sección Datos Personales */}
        <fieldset className="form-section">
          <legend>🧍 Datos del Jugador</legend>

          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            name="name"
            placeholder="Ej. Juan Pérez"
            value={player.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="dni">DNI</label>
          <input
            id="dni"
            name="dni"
            placeholder="Ej. 12345678"
            value={player.dni}
            onChange={handleChange}
          />

          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            name="phone"
            placeholder="Ej. 3512345678"
            value={player.phone}
            onChange={handleChange}
          />

          <label htmlFor="parentPhone">Tel. Padre/Madre</label>
          <input
            id="parentPhone"
            name="parentPhone"
            placeholder="Ej. 3512345678"
            value={player.parentPhone}
            onChange={handleChange}
          />

          <label htmlFor="category">Categoría</label>
          <select
            id="category"
            name="category"
            value={player.category}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar categoría</option>
            <option value="Escuelita">Escuelita</option>
            <option value="U13 Masculino">U13 Masculino</option>
            <option value="U13 Femenino">U13 Femenino</option>
            <option value="U15">U15</option>
            <option value="U17">U17</option>
            <option value="Primera Masculino">Primera Masculino</option>
            <option value="Primera Femenino">Primera Femenino</option>
          </select>
        </fieldset>

        {/* Sección Pago Mensual */}
        <fieldset className="form-section">
          <legend>💸 Pago Mensual</legend>

          <div className="row">
            <select
              value={selectedAño}
              onChange={(e) => setSelectedAño(e.target.value)}
            >
              {años.map((año) => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
            >
              {meses.map((mes) => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
          </div>

          <div className="payment-card">
            <label>Estado</label>
            <select
              value={pago.status || "unpaid"}
              onChange={(e) => handlePaymentChange("status", e.target.value)}
            >
              <option value="unpaid">No Pagado</option>
              <option value="paid">Pagado</option>
            </select>

            <label>Importe</label>
            <input
              type="number"
              placeholder="Importe"
              value={pago.amount || ""}
              onChange={(e) => handlePaymentChange("amount", e.target.value)}
            />

            <label>Método</label>
            <select
              value={pago.method || ""}
              onChange={(e) => handlePaymentChange("method", e.target.value)}
            >
              <option value="">Seleccionar método</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
        </fieldset>

        {/* Botones */}
        <div className="button-row">
          <button type="submit" className="btn-guardar">
            💾 Guardar
          </button>
          <button
            type="button"
            className="btn-salir"
            onClick={() => navigate("/dashboard")}
          >
            ❌ Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlayerForm;
