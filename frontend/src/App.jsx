import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Books from "./pages/Books.jsx";
import BookDetail from "./pages/BookDetail.jsx";
import "./styles/auth.css";
import "./styles/catalog.css";

const App = () => {
    return (
        <AuthProvider>
            <Navbar />

            <main>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Navigate to="/books" replace />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/books"
                        element={
                            <ProtectedRoute>
                                <Books />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/books/:id"
                        element={
                            <ProtectedRoute>
                                <BookDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="*"
                        element={
                            <div style={{ maxWidth: 960, margin: "3rem auto", padding: "0 1rem" }}>
                                <h1>Page not found</h1>
                                <a href="/">Return home</a>
                            </div>
                        }
                    />
                </Routes>
            </main>
        </AuthProvider>
    );
};

export default App;
