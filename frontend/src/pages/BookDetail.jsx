import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AvailabilityBadge from "../components/AvailabilityBadge.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { getBookById } from "../services/bookService.js";
import { normalizeBook } from "../utils/books.js";

const BookDetail = () => {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const handleRetry = () => {
        setReloadKey((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchBook = async () => {
            if (!id || id.trim() === "") {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setNotFound(false);

            try {
                const result = await getBookById(id, { signal: controller.signal });
                if (!isMounted) return;
                const normalized = normalizeBook(result);
                setBook(normalized);
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
                    setError(err);
                }
                setLoading(false);
            }
        };

        fetchBook();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [id, reloadKey]);

    return (
        <section className="catalog-page" aria-labelledby="detail-heading">
            <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
                <Link to="/books" className="catalog-link">
                    &larr; Back to catalog
                </Link>
            </nav>

            {loading ? (
                <>
                    <h1 id="detail-heading" className="catalog-page__title">Book Details</h1>
                    <StatusMessage type="loading" message="Loading book details…" />
                </>
            ) : notFound ? (
                <div className="catalog-not-found" role="alert">
                    <h1 id="detail-heading" className="catalog-page__title">Book not found</h1>
                    <p className="catalog-not-found__text">
                        The requested book could not be found or the identifier is invalid.
                    </p>
                    <div className="catalog-actions">
                        <Link to="/books" className="catalog-btn catalog-btn--back">
                            Back to catalog
                        </Link>
                    </div>
                </div>
            ) : error ? (
                <div className="catalog-error-container">
                    <h1 id="detail-heading" className="catalog-page__title">Unable to load book</h1>
                    <StatusMessage
                        type="error"
                        message={error.message || "Failed to retrieve book details. Please check your connection."}
                        onRetry={handleRetry}
                    />
                </div>
            ) : book ? (
                <article className="catalog-detail">
                    <header className="catalog-detail__header">
                        <span className="catalog-detail__category">{book.category}</span>
                        <h1 id="detail-heading" className="catalog-detail__title">{book.title}</h1>
                        <p className="catalog-detail__author">By {book.author}</p>
                    </header>

                    <section className="catalog-detail__inventory" aria-labelledby="inventory-heading">
                        <h2 id="inventory-heading" className="catalog-section-title">Inventory & Availability</h2>
                        <dl className="catalog-inventory-list">
                            <div className="catalog-inventory-row">
                                <dt>Status</dt>
                                <dd><AvailabilityBadge availability={book.availability} /></dd>
                            </div>
                            <div className="catalog-inventory-row">
                                <dt>Available copies</dt>
                                <dd className="catalog-inventory-number">{book.availableCopies}</dd>
                            </div>
                            <div className="catalog-inventory-row">
                                <dt>Total copies</dt>
                                <dd className="catalog-inventory-number">{book.totalCopies}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="catalog-detail__meta" aria-labelledby="meta-heading">
                        <h2 id="meta-heading" className="catalog-section-title">Book Information</h2>
                        <dl className="catalog-meta-list">
                            <div className="catalog-meta-row">
                                <dt>ISBN</dt>
                                <dd>{book.ISBN || "Not specified"}</dd>
                            </div>
                            <div className="catalog-meta-row">
                                <dt>Category</dt>
                                <dd>{book.category}</dd>
                            </div>
                            {book.publisher ? (
                                <div className="catalog-meta-row">
                                    <dt>Publisher</dt>
                                    <dd>{book.publisher}</dd>
                                </div>
                            ) : null}
                            {book.publicationYear ? (
                                <div className="catalog-meta-row">
                                    <dt>Publication year</dt>
                                    <dd>{book.publicationYear}</dd>
                                </div>
                            ) : null}
                        </dl>
                    </section>

                    <section className="catalog-detail__description" aria-labelledby="desc-heading">
                        <h2 id="desc-heading" className="catalog-section-title">Description</h2>
                        <p>{book.description || "No description provided for this book."}</p>
                    </section>

                    <footer className="catalog-detail__footer">
                        <Link to="/books" className="catalog-btn catalog-btn--back">
                            Back to catalog
                        </Link>
                    </footer>
                </article>
            ) : null}
        </section>
    );
};

export default BookDetail;
