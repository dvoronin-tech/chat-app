import {
    createContext,
    memo,
    useCallback,
    useContext,
    useEffect,
    useId,
    useState,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Dialog.module.scss';

type DialogContextValue = {
    titleId: string;
    descriptionId: string;
    setHasDescription: (value: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
    const context = useContext(DialogContext);

    if (!context) {
        throw new Error('Dialog parts must be used inside <Dialog>');
    }

    return context;
}

export type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    closeOnOutsideClick?: boolean;
    closeOnEscape?: boolean;
};

function DialogRoot({
    open,
    onOpenChange,
    children,
    className,
    contentClassName,
    closeOnOutsideClick = true,
    closeOnEscape = true,
}: DialogProps) {
    const [hasDescription, setHasDescription] = useState(false);
    const titleId = useId();
    const descriptionId = useId();

    const requestClose = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    const handleOverlayMouseDown = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (!closeOnOutsideClick) return;
            if (event.target !== event.currentTarget) return;
            requestClose();
        },
        [closeOnOutsideClick, requestClose],
    );

    useEffect(() => {
        if (!open || !closeOnEscape) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') requestClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, closeOnEscape, requestClose]);

    if (!open) return null;

    return createPortal(
        <DialogContext.Provider
            value={{
                titleId,
                descriptionId,
                setHasDescription,
            }}
        >
            <div
                className={clsx(styles.overlay, className)}
                onMouseDown={handleOverlayMouseDown}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={hasDescription ? descriptionId : undefined}
                    className={clsx(styles.content, contentClassName)}
                >
                    {children}
                </div>
            </div>
        </DialogContext.Provider>,
        document.body,
    );
}

type DialogTitleProps = {
    children: ReactNode;
    className?: string;
};

function DialogTitle({ children, className }: DialogTitleProps) {
    const { titleId } = useDialogContext();

    return (
        <h2 id={titleId} className={clsx(styles.title, className)}>
            {children}
        </h2>
    );
}

type DialogDescriptionProps = {
    children: ReactNode;
    className?: string;
};

function DialogDescription({ children, className }: DialogDescriptionProps) {
    const { descriptionId, setHasDescription } = useDialogContext();

    useEffect(() => {
        setHasDescription(true);
        return () => setHasDescription(false);
    }, [setHasDescription]);

    return (
        <p id={descriptionId} className={clsx(styles.description, className)}>
            {children}
        </p>
    );
}

type DialogActionsProps = {
    children: ReactNode;
    className?: string;
};

function DialogActions({ children, className }: DialogActionsProps) {
    return <div className={clsx(styles.actions, className)}>{children}</div>;
}

type DialogComponent = typeof DialogRoot & {
    Title: typeof DialogTitle;
    Description: typeof DialogDescription;
    Actions: typeof DialogActions;
};

const Dialog = memo(DialogRoot) as unknown as DialogComponent;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Actions = DialogActions;

export default Dialog;
