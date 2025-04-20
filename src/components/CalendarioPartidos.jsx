import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Importa useNavigate
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarioPartidos.css';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FaBasketballBall, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import EditarModal from './EditarModal';
import { AnimatePresence, motion } from 'framer-motion';

const CalendarioPartidos = () => {
  const navigate = useNavigate();  // Usa el hook useNavigate para la navegación
  const [partidos, setPartidos] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [categoria, setCategoria] = useState('');
  const [editando, setEditando] = useState(null);
  const [dropdownsAbiertos, setDropdownsAbiertos] = useState({});

  useEffect(() => {
    obtenerPartidos();
  }, []);

  const obtenerPartidos = async () => {
    const querySnapshot = await getDocs(collection(db, 'partidos'));
    const partidosData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPartidos(partidosData);
  };

  const guardarPartido = async (e) => {
    e.preventDefault();
    if (!descripcion || !fecha || !categoria) {
      alert("Completa todos los campos.");
      return;
    }

    await addDoc(collection(db, 'partidos'), { descripcion, fecha, categoria });
    setDescripcion('');
    setFecha('');
    setCategoria('');
    obtenerPartidos();
  };

  const actualizarPartido = async (actualizado) => {
    await updateDoc(doc(db, 'partidos', actualizado.id), actualizado);
    obtenerPartidos();
  };

  const eliminarPartido = async (id) => {
    if (window.confirm("¿Eliminar este partido?")) {
      await deleteDoc(doc(db, 'partidos', id));
      obtenerPartidos();
    }
  };

  const obtenerPartidosDelDia = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return partidos.filter(p => p.fecha === fechaStr);
  };

  const toggleDropdown = (fecha) => {
    setDropdownsAbiertos(prev => ({ ...prev, [fecha]: !prev[fecha] }));
  };

  const getEtiquetaColor = (categoria) => {
    return categoria.toLowerCase().includes("femenino") ? 'femenino' : '';
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const delDia = obtenerPartidosDelDia(date);
    const fechaKey = date.toISOString().split('T')[0];

    return (
      <div>
        {delDia.length > 2 ? (
          <div>
            <motion.button
              className="btn-ver-mas"
              onClick={() => toggleDropdown(fechaKey)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
            >
              {dropdownsAbiertos[fechaKey] ? 'Ocultar' : 'Ver todos'} ({delDia.length})
              {dropdownsAbiertos[fechaKey] ? <FaChevronUp className="icono-chevron" /> : <FaChevronDown className="icono-chevron" />}
            </motion.button>
            <AnimatePresence>
              {dropdownsAbiertos[fechaKey] && delDia.map((p, i) => (
                <motion.div
                  key={i}
                  className="partido-card"
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="partido-icono"><FaBasketballBall /></div>
                  <div className="partido-info">
                    <span className="descripcion">{p.descripcion}</span>
                    <span className={`etiqueta ${getEtiquetaColor(p.categoria)}`}>{p.categoria}</span>
                  </div>
                  <div className="acciones">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditando(p)} className="btn-editar">✏️</motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => eliminarPartido(p.id)} className="btn-eliminar">🗑️</motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          delDia.map((p, i) => (
            <motion.div
              key={i}
              className="partido-card"
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="partido-icono"><FaBasketballBall /></div>
              <div className="partido-info">
                <span className="descripcion">{p.descripcion}</span>
                <span className={`etiqueta ${getEtiquetaColor(p.categoria)}`}>{p.categoria}</span>
              </div>
              <div className="acciones">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditando(p)} className="btn-editar">✏️</motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => eliminarPartido(p.id)} className="btn-eliminar">🗑️</motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month' && obtenerPartidosDelDia(date).length > 0) {
      return 'has-partidos';
    }
    return null;
  };

  return (
    <div className="calendario-container">
    <button className="btn volver" onClick={() => navigate("/dashboard")}>
        ← Volver a Cuotas
    </button>
      <h2>📅 Calendario de Partidos</h2>

      {/* Mostrar el calendario solo en pantallas grandes */}
      <div className="calendario-visible-pc">
        <Calendar
          tileContent={tileContent}
          tileClassName={tileClassName}
          locale="es-ES"
        />
      </div>

      <div className="calendario-visible-movil">
        <h3>Próximos Partidos</h3>
        {partidos
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .map((partido, index) => (
      <div key={index} className="partido-lista">
        <span className="descripcion"><strong>Descripción:</strong> {partido.descripcion}</span>
        <span className={`etiqueta ${getEtiquetaColor(partido.categoria)}`}><strong>Categoría:</strong> {partido.categoria}</span>
        <span className="fecha"><strong>Fecha:</strong> {new Date(partido.fecha).toLocaleDateString()}</span>
        <div className="acciones-movil">
          <button className="btn-editar" onClick={() => setEditando(partido)}>✏️</button>
          <button className="btn-eliminar" onClick={() => eliminarPartido(partido.id)}>🗑️</button>
        </div>
        </div>
        ))}
        </div>

      <EditarModal partido={editando} onClose={() => setEditando(null)} onSave={actualizarPartido} />

      <div className="formulario-partido">
        <h3>➕ Agregar Partido</h3>
        <form onSubmit={guardarPartido}>
          <div className="campo">
            <label>Descripción</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="campo">
            <label>Categoría</label>
            <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </div>
          <div className="campo">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <motion.button type="submit" className="btn-guardar" whileTap={{ scale: 0.95 }}>
            Guardar Partido
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default CalendarioPartidos;
