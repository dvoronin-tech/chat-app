import { memo, type ComponentProps } from 'react';
import clsx from 'clsx';
import styles from './Input.module.scss';

type InputProps = ComponentProps<'input'> & {
    as?: 'input';
};

type TextAreaProps = ComponentProps<'textarea'> & {
    as: 'textarea';
};

type FieldProps = InputProps | TextAreaProps;

function Input(props: FieldProps) {
    if (props.as === 'textarea') {
        const { className, as: _, ...rest } = props;

        return (
            <textarea
                className={clsx(styles.root, styles.textarea, className)}
                {...rest}
            />
        );
    }

    const { className, as: _, ...rest } = props;

    return (
        <input
            className={clsx(styles.root, className)}
            {...rest}
        />
    );
}

export default memo(Input);
