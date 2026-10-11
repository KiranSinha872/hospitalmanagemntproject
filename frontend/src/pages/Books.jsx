import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BookCard from "../components/BookCard.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getBooks } from "../services/bookService.js";

const Books = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isAdmin = user?.role === "Admin";

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const handleRetry = () => {
        setReloadKey((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchBooks = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getBooks({ signal: controller.signal });
                if (!isMounted) return;
                const items = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
                setBooks(items);
                setLoading(false);
            } catch (err) {
                if (!isMounted || controller.signal.aborted) return;
                setError(err);
                setLoading(false);
            }
        };

        fetchBooks();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [reloadKey, location.key]);

    return (
        <section className="catalog-page" aria-labelledby="catalog-heading">
            {location.state?.notice && (
                <div className="catalog-notice" role="status" aria-live="polite">
                    {location.state.notice}
                </div>
            )}

            <header className="catalog-page__header">
                <div className="catalog-page__header-row">
                    <div>
                        <h1 id="catalog-heading" className="catalog-page__title">Book Catalog</h1>
                        <p className="catalog-page__intro">Browse the collection and check live shelf availability.</p>
                    </div>
                    {isAdmin && (
                        <div className="catalog-page__header-actions">
                            <Link to="/admin/books/new" className="catalog-btn catalog-btn--primary">
                                Add book
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {loading ? (
                <StatusMessage type="loading" message="Loading catalog…" />
            ) : error ? (
                <StatusMessage
                    type="error"
                    message={error.message || "Unable to load books. Please check your connection and try again."}
                    onRetry={handleRetry}
                />
            ) : books.length === 0 ? (
                <StatusMessage type="empty" message="No books in the catalog yet." />
            ) : (
                <div className="catalog-grid" role="list" aria-label="Books list">
                    {books.map((book) => {
                        const key = book._id || book.id || `${book.title}-${book.ISBN}`;
                        return (
                            <div key={key} role="listitem">
                                <BookCard book={book} />
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default Books;
