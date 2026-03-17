export type ClassValue = string | false | null | undefined;

const clsx = (...values: ClassValue[]) => values.filter(Boolean).join(' ');

export default clsx;
