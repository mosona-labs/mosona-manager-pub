const NetUnit = (value: number, base: 'kb' | 'mb' | 'gb') => {
    let v: number, u: string;
    let m: number = 1;
    switch (base) {
        case 'kb':
            if (value < 1024) {
                v = value;
                u = 'KB';
            } else if (value < 1024 * 1024) {
                v = value / 1024;
                u = 'MB';
                m = 1024;
            } else {
                v = value / (1024 * 1024);
                u = 'GB';
                m = 1024 * 1024;
            }
            break;
        case 'mb':
            if (value < 1024) {
                v = value;
                u = 'MB';
            } else if (value < 1024 * 1024) {
                v = value / 1024;
                u = 'GB';
                m = 1024;
            } else {
                v = value / (1024 * 1024);
                u = 'TB';
                m = 1024 * 1024;
            }
            break;
        case 'gb':
            if (value < 1024) {
                v = value;
                u = 'GB';
            } else {
                v = value / 1024;
                u = 'TB';
                m = 1024;
            }
            break;
    }
    return {
        value: v.toFixed(2),
        unit: u,
        multiple: m,
    };
};

const MemoryUnit = (value: number, base: 'kb' | 'mb' | 'gb') => {
    let v: string;
    switch (base) {
        case 'kb':
            if (value < 1024) {
                v = value.toFixed(2) + 'KB';
            } else if (value < 1024 * 1024) {
                v = (value / 1024).toFixed(2) + 'MB';
            } else {
                v = (value / (1024 * 1024)).toFixed(2) + 'GB';
            }
            break;
        case 'mb':
            if (value < 1024) {
                v = value.toFixed(2) + 'MB';
            } else if (value < 1024 * 1024) {
                v = (value / 1024).toFixed(2) + 'GB';
            } else {
                v = (value / (1024 * 1024)).toFixed(2) + 'TB';
            }
            break;
        case 'gb':
            if (value < 1024) {
                v = value.toFixed(2) + 'GB';
            } else {
                v = (value / 1024).toFixed(2) + 'TB';
            }
            break;
    }
    return v;
};

const UnitConverter = (
    value: number,
    from: 'kb' | 'mb' | 'gb' | 'tb',
    to: 'kb' | 'mb' | 'gb' | 'tb'
) => {
    let kbValue: number;
    switch (from) {
        case 'kb':
            kbValue = value;
            break;
        case 'mb':
            kbValue = value * 1024;
            break;
        case 'gb':
            kbValue = value * 1024 * 1024;
            break;
        case 'tb':
            kbValue = value * 1024 * 1024 * 1024;
            break;
        default:
            throw new Error('Invalid from unit');
    }
    switch (to) {
        case 'kb':
            return kbValue;
        case 'mb':
            return kbValue / 1024;
        case 'gb':
            return kbValue / (1024 * 1024);
        case 'tb':
            return kbValue / (1024 * 1024 * 1024);
        default:
            throw new Error('Invalid to unit');
    }
};

export { NetUnit, MemoryUnit, UnitConverter };
