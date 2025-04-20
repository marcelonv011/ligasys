import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './EditarModal.css';

const EditarModal = ({ partido, onClose, onSave }) => {
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [categoria, setCategoria] = useState('');

  useEffect(() => {
    if (partido) {
      setDescripcion(partido.descripcion);
      setFecha(partido.fecha);
      setCategoria(partido.categoria);
    }
  }, [partido]);

  const guardarCambios = () => {
    if (!descripcion || !fecha || !categoria) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    onSave({ ...partido, descripcion, fecha, categoria });
    onClose();
  };

  return (
    <AnimatePresence>
      {partido && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-contenido"
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <h3>✏️ Editar Partido</h3>
            <div className="campo">
              <label>Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Categoría</label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="modal-acciones">
              <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
              <button className="btn-guardar" onClick={guardarCambios}>Guardar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditarModal;
