import { Link } from "react-router-dom";
import AvailabilityBadge from "./AvailabilityBadge.jsx";
import { normalizeBook } from "../utils/books.js";

const BookCard = ({ book: rawBook }) => {
    const book = normalizeBook(rawBook);
    const bookId = book.id || book._id;

    return (
        <article className="book-card" aria-labelledby={`book-title-${bookId}`}>
            <div className="book-card__meta">
                <span className="book-card__category">{book.category}</span>
                <AvailabilityBadge availability={book.availability} />
            </div>
            <h2 id={`book-title-${bookId}`} className="book-card__title">
                <Link to={`/books/${encodeURIComponent(bookId)}`} className="book-card__title-link">
                    {book.title}
                </Link>
            </h2>
            <p className="book-card__author">By {book.author}</p>
            {book.ISBN ? <p className="book-card__isbn">ISBN: {book.ISBN}</p> : null}
            <div className="book-card__actions">
                <Link
                    to={`/books/${encodeURIComponent(bookId)}`}
                    className="catalog-btn catalog-btn--detail"
                    aria-label={`View details for ${book.title}`}
                >
                    View details
                </Link>
            </div>
        </article>
    );
};

export default BookCard;
