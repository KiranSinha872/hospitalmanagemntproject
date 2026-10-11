import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookForm from "../components/BookForm.jsx";
import { createBook } from "../services/bookService.js";

const BookNew = () => {
    const navigate = useNavigate();
    const abortControllerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleCreate = async (payload) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        await createBook(payload, { signal: controller.signal });
        navigate("/books", { state: { notice: "Book added" } });
    };

    return (
        <section className="catalog-page" aria-labelledby="new-book-heading">
            <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
                <Link to="/books" className="catalog-link">
                    &larr; Back to catalog
                </Link>
            </nav>

            <header className="catalog-page__header">
                <h1 id="new-book-heading" className="catalog-page__title">
                    Add New Book
                </h1>
                <p className="catalog-page__intro">
                    Enter the book metadata and inventory details to add it to the catalog.
                </p>
            </header>

            <BookForm
                onSubmit={handleCreate}
                isEdit={false}
                cancelUrl="/books"
            />
        </section>
    );
};

export default BookNew;
