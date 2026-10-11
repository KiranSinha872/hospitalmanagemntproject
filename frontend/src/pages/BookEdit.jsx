import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookForm from "../components/BookForm.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { getBookById, updateBook } from "../services/bookService.js";
import { bookToFormValues } from "../utils/bookForm.js";

const BookEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const abortControllerRef = useRef(null);

    const handleRetry = () => {
        setReloadKey((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const loadBook = async () => {
            if (!id || id.trim() === "") {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setLoading(true);
            setFetchError(null);
            setNotFound(false);

            try {
                const data = await getBookById(id, { signal: controller.signal });
                if (!isMounted) return;
                setBook(data);
                setLoading(false);
            } catch (err) {
                if (!isMounted || controller.signal.aborted) return;
                const isMissing =
                    err.status === 404 ||
                    err.status === 400 ||
                    /not found|invalid/i.test(err.message || "") ||
                    /invalid.*id/i.test(err?.serverData?.error?.message || "");

                if (isMissing) {
                    setNotFound(true);
                } else {
                    setFetchError(err);
                }
                setLoading(false);
            }
        };

        loadBook();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [id, reloadKey]);

    const handleUpdate = async (payload) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        await updateBook(id, payload, { signal: controller.signal });
        navigate(`/books/${encodeURIComponent(id)}`, { state: { notice: "Changes saved" } });
    };

    return (
        <section className="catalog-page" aria-labelledby="edit-book-heading">
            <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
                <Link to={`/books/${encodeURIComponent(id || "")}`} className="catalog-link">
                    &larr; Back to book details
                </Link>
            </nav>

            {loading ? (
                <>
                    <h1 id="edit-book-heading" className="catalog-page__title">
                        Edit Book
                    </h1>
                    <StatusMessage type="loading" message="Loading book details…" />
                </>
            ) : notFound ? (
                <div className="catalog-not-found" role="alert">
                    <h1 id="edit-book-heading" className="catalog-page__title">
                        Book not found
                    </h1>
                    <p className="catalog-not-found__text">
                        The requested book could not be found or the identifier is invalid.
                    </p>
                    <div className="catalog-actions">
                        <Link to="/books" className="catalog-btn catalog-btn--back">
                            Back to catalog
                        </Link>
                    </div>
                </div>
            ) : fetchError ? (
                <div className="catalog-error-container">
                    <h1 id="edit-book-heading" className="catalog-page__title">
                        Unable to load book
                    </h1>
                    <StatusMessage
                        type="error"
                        message={fetchError.message || "Failed to retrieve book details. Please check your connection."}
                        onRetry={handleRetry}
                    />
                </div>
            ) : book ? (
                <>
                    <header className="catalog-page__header">
                        <h1 id="edit-book-heading" className="catalog-page__title">
                            Edit Book
                        </h1>
                        <p className="catalog-page__intro">
                            Update details for <em>{book.title}</em>.
                        </p>
                    </header>

                    <BookForm
                        initialValues={bookToFormValues(book)}
                        onSubmit={handleUpdate}
                        isEdit={true}
                        cancelUrl={`/books/${encodeURIComponent(id)}`}
                    />
                </>
            ) : null}
        </section>
    );
};

export default BookEdit;
