export type ConfBackupDeviceKind =
    | "desktop"
    | "mobile"
    | "browser-desktop"
    | "browser-mobile"
    | "docker";

export type ConfBackupSectionKey =
    | "keymap"
    | "appearance"
    | "editor"
    | "fileTree"
    | "tag"
    | "search"
    | "export"
    | "flashcard"
    | "graph"
    | "bazaar"
    | "snippet"
    | "uiLayout";

export type ConfBackupCompatLevel = "compatible" | "caution" | "incompatible" | "unknown";

export interface SettingBackupCompat {
    level: ConfBackupCompatLevel;
    reasonKey: string;
}

export interface SettingBackupMeta {
    id: string;
    name: string;
    note: string;
    createdAt: number;
    deviceName: string;
    deviceKind: ConfBackupDeviceKind;
    os: string;
    osPlatform: string;
    frontend: string;
    container: string;
    appVersion: string;
}

export interface SettingBackupListItem extends SettingBackupMeta {
    compat: SettingBackupCompat;
}

export interface SettingBackupRecord extends SettingBackupMeta {
    conf: Record<string, any>;
}

export interface SettingBackupIndex {
    version: number;
    items: SettingBackupMeta[];
}

export const CONF_BACKUP_SECTIONS: ConfBackupSectionKey[] = [
    "keymap",
    "appearance",
    "editor",
    "fileTree",
    "tag",
    "search",
    "export",
    "flashcard",
    "graph",
    "bazaar",
    "snippet",
    "uiLayout",
];

export const DEFAULT_RESTORE_SECTIONS: ConfBackupSectionKey[] = [
    "keymap",
    "appearance",
    "editor",
    "fileTree",
    "tag",
    "search",
    "export",
    "flashcard",
    "graph",
];
