type StorageUnit = 'kb' | 'mb' | 'gb' | 'tb' | 'pb';

const STORAGE_UNITS: Array<{ key: StorageUnit; label: string }> = [
    { key: 'kb', label: 'KB' },
    { key: 'mb', label: 'MB' },
    { key: 'gb', label: 'GB' },
    { key: 'tb', label: 'TB' },
    { key: 'pb', label: 'PB' },
];

const getUnitIndex = (unit: StorageUnit) => STORAGE_UNITS.findIndex((item) => item.key === unit);

const normalizeUnit = (value: number, base: StorageUnit) => {
    const baseIndex = getUnitIndex(base);
    if (baseIndex === -1) {
        throw new Error('Invalid unit');
    }

    let unitIndex = baseIndex;
    let multiple = 1;

    while (Math.abs(value) / multiple >= 1024 && unitIndex < STORAGE_UNITS.length - 1) {
        multiple *= 1024;
        unitIndex++;
    }

    return {
        value: value / multiple,
        unit: STORAGE_UNITS[unitIndex].label,
        multiple,
    };
};

const NetUnit = (value: number, base: StorageUnit) => {
    const normalized = normalizeUnit(value, base);

    return {
        value: normalized.value.toFixed(2),
        unit: normalized.unit,
        multiple: normalized.multiple,
    };
};

const MemoryUnit = (value: number, base: StorageUnit) => {
    const normalized = normalizeUnit(value, base);
    return normalized.value.toFixed(2) + normalized.unit;
};

const UnitConverter = (value: number, from: StorageUnit, to: StorageUnit) => {
    const fromIndex = getUnitIndex(from);
    const toIndex = getUnitIndex(to);
    if (fromIndex === -1 || toIndex === -1) {
        throw new Error('Invalid unit');
    }

    return value * Math.pow(1024, fromIndex - toIndex);
};

export { NetUnit, MemoryUnit, UnitConverter };
