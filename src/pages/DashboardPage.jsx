import React, { useState, useEffect } from "react";
import { db, auth } from "../services/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import "./DashboardPage.css";

function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [monthFilter, setMonthFilter] = useState("Todos");
  const [yearFilter, setYearFilter] = useState("2025");
  const [verSoloNoPagados, setVerSoloNoPagados] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayments, setShowPayments] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const años = ["2025", "2026", "2027", "2028", "2029", "2030"];

  useEffect(() => {
    fetchPlayers();
  }, [location]);

  useEffect(() => {
    const onFocus = () => fetchPlayers();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "players"));
      const playersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      playersList.sort((a, b) => a.name.localeCompare(b.name));
      setPlayers(playersList);
    } catch (error) {
      console.error("Error al cargar jugadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm("¿Seguro que quieres eliminar este jugador?")) {
      await deleteDoc(doc(db, "players", playerId));
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const togglePayments = (id) => {
    setShowPayments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredPlayers = players
    .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => categoryFilter === "Todos" || p.category === categoryFilter)
    .filter((p) => {
      if (monthFilter === "Todos") return true;
      const estado = p.payments?.[`${monthFilter}_${yearFilter}`]?.status;
      if (verSoloNoPagados) {
        return estado !== "paid";
      }
      return true;
    });

  const exportToExcel = () => {
    if (filteredPlayers.length === 0) {
      alert("No hay jugadores para exportar.");
      return;
    }

    const data = filteredPlayers.map((p) => {
      const payment = p.payments?.[`${monthFilter}_${yearFilter}`];
      return {
        Nombre: p.name,
        DNI: p.dni || "",
        Teléfono: p.phone || "",
        "Tel. Padre/Madre": p.parentPhone || "",
        Categoría: p.category || "",
        Mes: monthFilter,
        Año: yearFilter,
        Estado: payment?.status === "paid" ? "Pagado" : "No Pagado",
        Importe: payment?.amount || 0,
        "Método de Pago": payment?.method || "",
      };
    });

    const total = data.reduce((sum, p) => sum + (p.Importe || 0), 0);
    data.push({
      Nombre: "",
      DNI: "",
      Teléfono: "",
      "Tel. Padre/Madre": "",
      Categoría: "",
      Mes: "TOTAL",
      Año: "",
      Estado: "",
      Importe: total,
      "Método de Pago": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");
    XLSX.writeFile(workbook, `Pagos_${monthFilter}_${yearFilter}.xlsx`);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="title-section">
          <h1>📋 Gestión de Jugadores</h1>
          <p>Visualiza y gestiona las cuotas mensuales</p>
        </div>
        <div className="btn-group">
          <button className="btn-agregar btn-uniforme" onClick={() => navigate("/nuevo")}>
            ➕ Nuevo Jugador
          </button>
          <button className="btn-gastos btn-uniforme" onClick={() => navigate("/gastos")}>
            💸 Ver Gastos
          </button>
          <button className="btn-calendario btn-uniforme" onClick={() => navigate("/calendario")}>
            🏀 Ver Calendario
          </button>
          <button className="btn-logout btn-uniforme" onClick={handleLogout}>
            🔒 Cerrar sesión
          </button>
        </div>
      </header>

      <section className="dashboard-filtros">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="Todos">📂 Todas las categorías</option>
          <option value="Escuelita">Escuelita</option>
          <option value="U13 Masculino">U13 Masculino</option>
          <option value="U13 Femenino">U13 Femenino</option>
          <option value="U15">U15</option>
          <option value="U17">U17</option>
          <option value="Primera Masculino">Primera Masculino</option>
          <option value="Primera Femenino">Primera Femenino</option>
        </select>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option value="Todos">🗓️ Todos los meses</option>
          {meses.map((mes) => (
            <option key={mes} value={mes}>{mes}</option>
          ))}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          {años.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {monthFilter !== "Todos" && (
          <>
            <button className="btn-excel" onClick={exportToExcel}>
              📤 Exportar Excel
            </button>
            <button
              className="btn-ver-no-pagados"
              onClick={() => setVerSoloNoPagados((prev) => !prev)}
            >
              {verSoloNoPagados ? "👥 Ver Todos" : "🚫 Ver No Pagadores"}
            </button>
          </>
        )}
      </section>

      <button className="btn-recargar" onClick={fetchPlayers}>
        🔄 Recargar Lista
      </button>

      <section className="dashboard-lista">
        {verSoloNoPagados && monthFilter !== "Todos" && (
          <div className="alerta-no-pagadores">
            <p>🚫 Mostrando solo jugadores que <strong>NO pagaron</strong> la cuota de <strong>{monthFilter}</strong> {yearFilter}.</p>
          </div>
        )}

        {loading ? (
          <p className="loading">Cargando jugadores...</p>
        ) : filteredPlayers.length === 0 ? (
          <div className="no-results">
            <p>No se encontraron jugadores.</p>
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <div key={player.id} className="player-card">
              <div className="card-header">
                <h3>{player.name}</h3>
                <span className="category">{player.category}</span>
              </div>
              <p><strong>DNI:</strong> {player.dni}</p>
              <p><strong>📱 Teléfono:</strong> {player.phone}</p>
              <p><strong>👨‍👩‍👧 Tel. Padre/Madre:</strong> {player.parentPhone}</p>

              <button className="btn-toggle-pagos" onClick={() => togglePayments(player.id)}>
                {showPayments[player.id] ? "⬆️ Ocultar pagos" : "⬇️ Ver pagos"}
              </button>

              {showPayments[player.id] && (
                <div className="payments-grid">
                  <h4 className="payments-title">Cuotas {yearFilter}</h4>
                  {meses.map((mes) => {
                    const pago = player.payments?.[`${mes}_${yearFilter}`];
                    const estado = pago?.status === "paid" ? "pagado" : "no-pagado";
                    return (
                      <div key={`${mes}_${yearFilter}`} className={`payment-tag ${estado}`}>
                        <span className="mes">{mes}</span>
                        <span className="estado">
                          {pago?.status === "paid" ? "✅ Pagado" : "❌ No Pagado"}
                        </span>
                        {pago?.status === "paid" && (
                          <span className="detalles">${pago.amount} ({pago.method})</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

<div className="actions-inline">
  <button className="btn-icon editar" onClick={() => navigate(`/editar/${player.id}`)} title="Editar">
    ✏️
  </button>
  <button className="btn-icon eliminar" onClick={() => handleDeletePlayer(player.id)} title="Eliminar">
    🗑️
  </button>
</div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Dashboard;
