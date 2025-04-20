import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlayerForm from "./components/PlayerForm";
import { auth } from "./services/firebase";
import { useEffect, useState } from "react";
import ProtectedRoute from "./utils/ProtectedRoute";
import GastosClub from './components/GastosClub';
import CalendarioPartidos from "./components/CalendarioPartidos";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center mt-10">Cargando...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nuevo"
          element={
            <ProtectedRoute user={user}>
              <PlayerForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/editar/:id"
          element={
            <ProtectedRoute user={user}>
              <PlayerForm />
            </ProtectedRoute>
          }
        />
        <Route path="/gastos" element={
            <ProtectedRoute user={user}>
              <GastosClub />
            </ProtectedRoute>
          } 
        />
        <Route path="/calendario" element={
            <ProtectedRoute user={user}>
              <CalendarioPartidos />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
