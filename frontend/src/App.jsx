import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
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
                                <Home />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    {/* Wrap in ProtectedRoute once issue #5 is merged. */}
                    <Route path="/books" element={<Books />} />
                    <Route path="/books/:id" element={<BookDetail />} />
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
