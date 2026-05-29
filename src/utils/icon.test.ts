import { describe, expect, it } from 'vitest';

import { getOsIconName } from './icon';

describe('getOsIconName', () => {
    it('matches exact icon names', () => {
        expect(getOsIconName('ubuntu')).toBe('ubuntu');
        expect(getOsIconName('windows')).toBe('windows');
    });

    it('matches common OS aliases and formatted names', () => {
        expect(getOsIconName('Ubuntu 22.04 LTS')).toBe('ubuntu');
        expect(getOsIconName('rocky-linux 9')).toBe('rockylinux');
        expect(getOsIconName('Red_Hat Enterprise Linux')).toBe('redhat');
        expect(getOsIconName('RHEL 9')).toBe('redhat');
        expect(getOsIconName('darwin')).toBe('macos');
        expect(getOsIconName('win64')).toBe('windows');
    });

    it('falls back to linux for empty or unknown values', () => {
        expect(getOsIconName()).toBe('linux');
        expect(getOsIconName(null)).toBe('linux');
        expect(getOsIconName('unknown')).toBe('linux');
    });
});
