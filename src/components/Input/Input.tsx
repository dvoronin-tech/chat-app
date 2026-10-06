import { memo, type ComponentProps } from 'react';
import clsx from 'clsx';
import styles from './Input.module.scss';

type InputProps = ComponentProps<'input'>;

function Input({ className, ...props }: InputProps) {
    return (
        <input
            className={clsx(styles.root, className)}
            {...props}
        />
    );
}

export default memo(Input);
