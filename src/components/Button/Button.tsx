import { memo, type ComponentProps } from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

type ButtonProps = ComponentProps<'button'> & {
    variant?: 'primary' | 'simple' | 'red';
};

function Button({ className, variant = 'primary', ...props }: ButtonProps) {
    return (
        <button
            className={clsx(styles.root, styles[variant], className)}
            {...props}
        />
    );
}

export default memo(Button);
