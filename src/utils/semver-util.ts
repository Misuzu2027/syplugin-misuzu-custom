export interface SemVer {
    major: number;
    minor: number;
    patch: number;
}

export function parseSemVer(version: string): SemVer | null {
    if (!version) {
        return null;
    }
    const matched = String(version).trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!matched) {
        return null;
    }
    return {
        major: Number(matched[1]),
        minor: Number(matched[2]),
        patch: Number(matched[3]),
    };
}

export function compareSemVer(left: SemVer, right: SemVer): number {
    if (left.major !== right.major) {
        return left.major - right.major;
    }
    if (left.minor !== right.minor) {
        return left.minor - right.minor;
    }
    return left.patch - right.patch;
}
