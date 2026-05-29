export const osIcons = [
    'arch',
    'centos',
    'debian',
    'redhat',
    'ubuntu',
    'fedora',
    'rockylinux',
    'alpine',
    'macos',
    'windows',
];

const osIconAliases: Record<string, string[]> = {
    windows: ['windows', 'win32', 'win64'],
    macos: ['macos', 'mac os', 'darwin'],
    rockylinux: ['rockylinux', 'rocky linux'],
    redhat: ['redhat', 'red hat', 'rhel'],
    ubuntu: ['ubuntu'],
    debian: ['debian'],
    centos: ['centos'],
    alpine: ['alpine'],
    arch: ['arch'],
    fedora: ['fedora'],
};

export const getOsIconName = (os?: string | null) => {
    const normalized = os?.toLowerCase().replace(/[_-]+/g, ' ').trim();
    if (!normalized) return 'linux';

    const exactIcon = osIcons.find((icon) => normalized === icon);
    if (exactIcon) return exactIcon;

    return (
        osIcons.find((icon) => {
            const aliases = osIconAliases[icon] ?? [icon];
            return aliases.some((alias) => normalized.includes(alias));
        }) ?? 'linux'
    );
};
