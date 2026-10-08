import clsx from 'clsx';
import styles from './Avatar.module.scss';

const PALETTE = [
    '#5b6cff',
    '#2a9d97',
    '#d4844a',
    '#c45b8a',
    '#3e9d62',
    '#b58a3c',
    '#7a68e0',
    '#3d88d6',
];

function colorFor(seed: string) {
    let hash = 0;

    for (const char of seed) {
        hash = Math.imul(hash, 31) + (char.codePointAt(0) ?? 0);
    }

    return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initial(name: string) {
    const letter = Array.from(name.trim())[0];
    return letter ? letter.toLocaleUpperCase('ru') : '?';
}

type AvatarProps = {
    name: string;
    rounded?: 'circle' | 'squircle';
};

export default function Avatar({ name, rounded = 'circle' }: AvatarProps) {
    return (
        <span
            className={clsx(styles.root, styles[rounded])}
            style={{ backgroundColor: colorFor(name) }}
            aria-hidden="true"
        >
            {initial(name)}
        </span>
    );
}
