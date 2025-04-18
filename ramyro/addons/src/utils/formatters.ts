// RamyroAddOns/src/utils/formatters.ts
export const formatPN = (val: string): string => {
    if (!val) return '';
    return val.split('^').filter(s => !!s).join(' ');
};

export const formatDICOMDate = (date: string): string => {
    if (!date) return '';
    const yyyy = date.substring(0, 4);
    const mm = date.substring(4, 6);
    const dd = date.substring(6, 8);
    return `${yyyy}-${mm}-${dd}`;
};

export const formatDICOMTime = (time: string): string => {
    if (!time) return '';
    const hh = time.substring(0, 2);
    const mm = time.substring(2, 4);
    const ss = time.substring(4, 6);
    return `${hh}:${mm}:${ss}`;
};

export const formatBirthDate = (birthDate: string): string => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(
        parseInt(birthDate.substring(0, 4)),
        parseInt(birthDate.substring(4, 6)) - 1,
        parseInt(birthDate.substring(6, 8))
    );
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age.toString();
};

export const formatNumberPrecision = (val: number, precision = 0): string => {
    if (typeof val !== 'number') return '';
    return val.toFixed(precision);
};