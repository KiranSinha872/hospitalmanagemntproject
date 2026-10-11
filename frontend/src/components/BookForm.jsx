import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toPayload, validateBookForm } from "../utils/bookForm.js";

/**
 * Controlled book form shared by creation and editing.
 *
 * @param {{
 *   initialValues?: object,
 *   onSubmit: (payload: object) => Promise<void>,
 *   isEdit?: boolean,
 *   cancelUrl?: string
 * }} props
 */
const BookForm = ({ initialValues = {}, onSubmit, isEdit = false, cancelUrl = "/books" }) => {
    const [values, setValues] = useState(() => ({
        title: initialValues.title ?? "",
        author: initialValues.author ?? "",
        ISBN: initialValues.ISBN ?? initialValues.isbn ?? "",
        category: initialValues.category ?? "",
        totalCopies: initialValues.totalCopies ?? (isEdit ? "" : "1"),
        availableCopies: initialValues.availableCopies ?? "",
        publisher: initialValues.publisher ?? "",
        publicationYear: initialValues.publicationYear ?? "",
        description: initialValues.description ?? "",
    }));

    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [saving, setSaving] = useState(false);

    const inputRefs = useRef({});

    const focusFirstError = (errs) => {
        const order = [
            "title",
            "author",
            "ISBN",
            "category",
            "totalCopies",
            "publicationYear",
            "publisher",
            "description",
        ];
        for (const field of order) {
            if (errs[field] && inputRefs.current[field]) {
                inputRefs.current[field].focus();
                break;
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;

        const { valid, errors: validationErrors } = validateBookForm(values);
        if (!valid) {
            setErrors(validationErrors);
            setFormError(null);
            focusFirstError(validationErrors);
            return;
        }

        setErrors({});
        setFormError(null);
        setSaving(true);

        try {
            const payload = toPayload(values);
            await onSubmit(payload);
        } catch (err) {
            if (err.status === 409) {
                const fieldErrors = { ISBN: "A book with this ISBN already exists." };
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
                focusFirstError(fieldErrors);
            } else if (err.status === 400) {
                const serverFields = err?.serverData?.error?.fields;
                if (serverFields && typeof serverFields === "object") {
                    setErrors(serverFields);
                    focusFirstError(serverFields);
                } else {
                    setFormError(err.message || "Please check the details you entered.");
                }
            } else if (err.status === 403) {
                setFormError("You do not have permission to do this.");
            } else if (err.status === 404) {
                setFormError("This book no longer exists.");
            } else if (err.status === 0) {
                setFormError("Cannot reach the server. Check your connection and try again.");
            } else if (err.status >= 500) {
                setFormError("Something went wrong on our side. Please try again.");
            } else if (err.status === 401) {
                return;
            } else {
                setFormError(err.message || "An unexpected error occurred. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="book-form" onSubmit={handleSubmit} noValidate>
            {formError && (
                <div className="book-form__alert" role="alert">
                    {formError}
                </div>
            )}

            <div className="book-form__field">
                <label htmlFor="book-form-title" className="book-form__label">
                    Title <span className="book-form__required" aria-hidden="true">*</span>
                </label>
                <input
                    ref={(el) => (inputRefs.current.title = el)}
                    id="book-form-title"
                    name="title"
                    type="text"
                    className={`book-form__input ${errors.title ? "book-form__input--invalid" : ""}`}
                    value={values.title}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? "book-form-title-error" : undefined}
                    disabled={saving}
                    required
                />
                {errors.title && (
                    <p id="book-form-title-error" className="book-form__field-error" role="alert">
                        {errors.title}
                    </p>
                )}
            </div>

            <div className="book-form__field">
                <label htmlFor="book-form-author" className="book-form__label">
                    Author <span className="book-form__required" aria-hidden="true">*</span>
                </label>
                <input
                    ref={(el) => (inputRefs.current.author = el)}
                    id="book-form-author"
                    name="author"
                    type="text"
                    className={`book-form__input ${errors.author ? "book-form__input--invalid" : ""}`}
                    value={values.author}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.author)}
                    aria-describedby={errors.author ? "book-form-author-error" : undefined}
                    disabled={saving}
                    required
                />
                {errors.author && (
                    <p id="book-form-author-error" className="book-form__field-error" role="alert">
                        {errors.author}
                    </p>
                )}
            </div>

            <div className="book-form__field">
                <label htmlFor="book-form-isbn" className="book-form__label">
                    ISBN <span className="book-form__required" aria-hidden="true">*</span>
                </label>
                <input
                    ref={(el) => (inputRefs.current.ISBN = el)}
                    id="book-form-isbn"
                    name="ISBN"
                    type="text"
                    className={`book-form__input ${errors.ISBN ? "book-form__input--invalid" : ""}`}
                    value={values.ISBN}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.ISBN)}
                    aria-describedby={errors.ISBN ? "book-form-isbn-error" : undefined}
                    disabled={saving}
                    placeholder="e.g. 978-0-13-235088-4 or 048665088X"
                    required
                />
                {errors.ISBN && (
                    <p id="book-form-isbn-error" className="book-form__field-error" role="alert">
                        {errors.ISBN}
                    </p>
                )}
            </div>

            <div className="book-form__field">
                <label htmlFor="book-form-category" className="book-form__label">
                    Category <span className="book-form__required" aria-hidden="true">*</span>
                </label>
                <input
                    ref={(el) => (inputRefs.current.category = el)}
                    id="book-form-category"
                    name="category"
                    type="text"
                    className={`book-form__input ${errors.category ? "book-form__input--invalid" : ""}`}
                    value={values.category}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.category)}
                    aria-describedby={errors.category ? "book-form-category-error" : undefined}
                    disabled={saving}
                    placeholder="e.g. Computer Science, Literature, Fiction"
                    required
                />
                {errors.category && (
                    <p id="book-form-category-error" className="book-form__field-error" role="alert">
                        {errors.category}
                    </p>
                )}
            </div>

            <div className="book-form__row">
                <div className="book-form__field">
                    <label htmlFor="book-form-total-copies" className="book-form__label">
                        Total copies <span className="book-form__required" aria-hidden="true">*</span>
                    </label>
                    <input
                        ref={(el) => (inputRefs.current.totalCopies = el)}
                        id="book-form-total-copies"
                        name="totalCopies"
                        type="number"
                        min="0"
                        step="1"
                        className={`book-form__input ${errors.totalCopies ? "book-form__input--invalid" : ""}`}
                        value={values.totalCopies}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.totalCopies)}
                        aria-describedby={errors.totalCopies ? "book-form-total-copies-error" : undefined}
                        disabled={saving}
                        required
                    />
                    {errors.totalCopies && (
                        <p id="book-form-total-copies-error" className="book-form__field-error" role="alert">
                            {errors.totalCopies}
                        </p>
                    )}
                </div>

                {isEdit && values.availableCopies !== "" && (
                    <div className="book-form__field">
                        <label htmlFor="book-form-available-copies" className="book-form__label">
                            Available copies
                        </label>
                        <input
                            id="book-form-available-copies"
                            type="text"
                            className="book-form__input"
                            value={values.availableCopies}
                            readOnly
                            disabled
                        />
                        <span className="book-form__hint">
                            Server-managed based on active loans.
                        </span>
                    </div>
                )}
            </div>

            <div className="book-form__row">
                <div className="book-form__field">
                    <label htmlFor="book-form-publisher" className="book-form__label">
                        Publisher
                    </label>
                    <input
                        ref={(el) => (inputRefs.current.publisher = el)}
                        id="book-form-publisher"
                        name="publisher"
                        type="text"
                        className={`book-form__input ${errors.publisher ? "book-form__input--invalid" : ""}`}
                        value={values.publisher}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.publisher)}
                        aria-describedby={errors.publisher ? "book-form-publisher-error" : undefined}
                        disabled={saving}
                    />
                    {errors.publisher && (
                        <p id="book-form-publisher-error" className="book-form__field-error" role="alert">
                            {errors.publisher}
                        </p>
                    )}
                </div>

                <div className="book-form__field">
                    <label htmlFor="book-form-year" className="book-form__label">
                        Publication year
                    </label>
                    <input
                        ref={(el) => (inputRefs.current.publicationYear = el)}
                        id="book-form-year"
                        name="publicationYear"
                        type="number"
                        min="1000"
                        max="2100"
                        className={`book-form__input ${errors.publicationYear ? "book-form__input--invalid" : ""}`}
                        value={values.publicationYear}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.publicationYear)}
                        aria-describedby={errors.publicationYear ? "book-form-year-error" : undefined}
                        disabled={saving}
                    />
                    {errors.publicationYear && (
                        <p id="book-form-year-error" className="book-form__field-error" role="alert">
                            {errors.publicationYear}
                        </p>
                    )}
                </div>
            </div>

            <div className="book-form__field">
                <label htmlFor="book-form-description" className="book-form__label">
                    Description
                </label>
                <textarea
                    ref={(el) => (inputRefs.current.description = el)}
                    id="book-form-description"
                    name="description"
                    rows="4"
                    className={`book-form__textarea ${errors.description ? "book-form__textarea--invalid" : ""}`}
                    value={values.description}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? "book-form-description-error" : undefined}
                    disabled={saving}
                />
                {errors.description && (
                    <p id="book-form-description-error" className="book-form__field-error" role="alert">
                        {errors.description}
                    </p>
                )}
            </div>

            <div className="book-form__actions">
                <button
                    type="submit"
                    className="catalog-btn catalog-btn--primary"
                    disabled={saving}
                >
                    {saving ? "Saving..." : isEdit ? "Save changes" : "Add book"}
                </button>
                <Link to={cancelUrl} className="catalog-btn catalog-btn--secondary">
                    Cancel
                </Link>
            </div>
        </form>
    );
};

export default BookForm;
