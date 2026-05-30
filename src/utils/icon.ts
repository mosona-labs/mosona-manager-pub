export const osIcons = [
    'opensuse-leap',
    'almalinux',
    'rockylinux',
    'freebsd',
    'arch',
    'centos',
    'debian',
    'redhat',
    'ubuntu',
    'fedora',
    'alpine',
    'windows',
    'macos',
];

const osIconAliases: Record<string, string[]> = {
    windows: ['windows', 'win32', 'win64'],
    macos: ['macos', 'mac os', 'darwin'],
    almalinux: ['almalinux', 'alma linux'],
    freebsd: ['freebsd'],
    'opensuse-leap': ['opensuse leap', 'open suse leap'],
    rockylinux: ['rockylinux', 'rocky linux', 'rocky'],
    redhat: ['redhat', 'red hat', 'rhel'],
    ubuntu: ['ubuntu'],
    debian: ['debian'],
    centos: ['centos'],
    alpine: ['alpine'],
    arch: ['arch'],
    fedora: ['fedora'],
};

const normalizeOsName = (os: string) =>
    os.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

export const getOsIconName = (os?: string | null) => {
    const normalized = os ? normalizeOsName(os) : '';
    if (!normalized) return 'linux';

    const exactIcon = osIcons.find((icon) => normalized === normalizeOsName(icon));
    if (exactIcon) return exactIcon;

    return (
        osIcons.find((icon) => {
            const aliases = osIconAliases[icon] ?? [icon];
            return aliases.some((alias) => normalized.includes(alias));
        }) ?? 'linux'
    );
};
