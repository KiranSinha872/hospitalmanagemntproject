import { useEffect, useRef, useState } from "react";

/**
 * Confirmation dialog for deletion using native <dialog>.
 *
 * @param {{
 *   isOpen: boolean,
 *   bookTitle: string,
 *   onConfirm: () => Promise<void>,
 *   onCancel: () => void
 * }} props
 */
const ConfirmDialog = ({ isOpen, bookTitle, onConfirm, onCancel }) => {
    const dialogRef = useRef(null);
    const cancelBtnRef = useRef(null);
    const returnFocusRef = useRef(null);

    const [deleting, setDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            returnFocusRef.current = document.activeElement;
            setErrorMessage(null);
            setDeleting(false);

            if (!dialog.open) {
                try {
                    dialog.showModal();
                } catch {
                    // Fallback if showModal is not supported in environment
                    dialog.setAttribute("open", "true");
                }
            }
            // Cancel is focused first
            requestAnimationFrame(() => {
                cancelBtnRef.current?.focus();
            });
        } else {
            if (dialog.open) {
                try {
                    dialog.close();
                } catch {
                    dialog.removeAttribute("open");
                }
            }
            // Return focus to the trigger element
            if (returnFocusRef.current && typeof returnFocusRef.current.focus === "function") {
                returnFocusRef.current.focus();
            }
        }
    }, [isOpen]);

    const handleDialogCancel = (e) => {
        if (deleting) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        onCancel();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            if (deleting) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            onCancel();
        }
    };

    const handleConfirm = async () => {
        if (deleting) return;
        setDeleting(true);
        setErrorMessage(null);

        try {
            await onConfirm();
        } catch (err) {
            if (err.status === 409) {
                setErrorMessage("This book has active loans and cannot be deleted. Return all copies first.");
            } else if (err.status === 403) {
                setErrorMessage("You do not have permission to do this.");
            } else if (err.status === 404) {
                setErrorMessage("This book no longer exists.");
            } else if (err.status === 0) {
                setErrorMessage("Cannot reach the server. Check your connection and try again.");
            } else if (err.status >= 500) {
                setErrorMessage("Something went wrong on our side. Please try again.");
            } else {
                setErrorMessage(err.message || "Failed to delete book.");
            }
            setDeleting(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <dialog
            ref={dialogRef}
            className="catalog-dialog"
            onCancel={handleDialogCancel}
            onKeyDown={handleKeyDown}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
        >
            <div className="catalog-dialog__content">
                <h2 id="confirm-dialog-title" className="catalog-dialog__title">
                    Confirm book deletion
                </h2>
                <p id="confirm-dialog-desc" className="catalog-dialog__body">
                    Are you sure you want to delete <strong>“{bookTitle || "this book"}”</strong>? This action cannot be undone.
                </p>

                {errorMessage && (
                    <div className="catalog-dialog__alert" role="alert">
                        {errorMessage}
                    </div>
                )}

                <div className="catalog-dialog__actions">
                    <button
                        ref={cancelBtnRef}
                        type="button"
                        className="catalog-btn catalog-btn--secondary"
                        onClick={onCancel}
                        disabled={deleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="catalog-btn catalog-btn--danger"
                        onClick={handleConfirm}
                        disabled={deleting}
                    >
                        {deleting ? "Deleting..." : "Delete book"}
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default ConfirmDialog;
