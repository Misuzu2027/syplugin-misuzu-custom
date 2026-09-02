import { EnvConfig } from "@/config/EnvConfig";
import {
    CONF_BACKUP_SECTIONS,
    ConfBackupDeviceKind,
    ConfBackupSectionKey,
    DEFAULT_RESTORE_SECTIONS,
    SettingBackupCompat,
    SettingBackupIndex,
    SettingBackupListItem,
    SettingBackupMeta,
    SettingBackupRecord,
} from "@/models/conf-backup-model";
import Instance from "@/utils/Instance";
import { getSystemConf, postApi, readDir, reloadUI } from "@/utils/api";
import { formatLocalDateTime } from "@/utils/datetime-util";
import { compareSemVer, parseSemVer } from "@/utils/semver-util";
import { isValidStr } from "@/utils/string-util";
import { getFrontend } from "siyuan";

const BACKUP_DIR = "conf-backups";
const INDEX_FILE = `${BACKUP_DIR}/index.json`;
const INDEX_VERSION = 1;

const OS_LABEL: Record<string, string> = {
    windows: "Windows",
    darwin: "macOS",
    linux: "Linux",
    android: "Android",
    ios: "iOS",
    harmony: "HarmonyOS",
};

export class ConfBackupService {

    public static get ins(): ConfBackupService {
        return Instance.get(ConfBackupService);
    }

    public async list(): Promise<SettingBackupListItem[]> {
        const scanned = await this.scanBackupFiles();
        const items = scanned.length > 0 ? scanned : (await this.loadIndex()).items;
        const currentVersion = this.currentAppVersion();
        return this.sortMeta(items).map((item) => ({
            ...item,
            compat: this.evaluateCompat(item.appVersion, currentVersion),
        }));
    }

    public currentAppVersion(): string {
        return window.siyuan?.config?.system?.kernelVersion || "";
    }

    public evaluateCompat(backupVersion: string, currentVersion: string = this.currentAppVersion()): SettingBackupCompat {
        const backup = parseSemVer(backupVersion);
        const current = parseSemVer(currentVersion);
        if (!backup || !current) {
            return { level: "unknown", reasonKey: "SettingBackupCompatUnknownVersion" };
        }
        if (backup.major !== current.major) {
            return { level: "incompatible", reasonKey: "SettingBackupCompatMajorMismatch" };
        }
        const cmp = compareSemVer(backup, current);
        if (cmp > 0) {
            if (backup.minor !== current.minor) {
                return { level: "incompatible", reasonKey: "SettingBackupCompatNewer" };
            }
            return { level: "caution", reasonKey: "SettingBackupCompatNewerPatch" };
        }
        if (current.minor - backup.minor >= 2) {
            return { level: "caution", reasonKey: "SettingBackupCompatOlder" };
        }
        return { level: "compatible", reasonKey: "SettingBackupCompatOk" };
    }

    public compatLabel(level: SettingBackupCompat["level"]): string {
        const map = {
            compatible: this.text("SettingBackupCompatOkLabel", "兼容"),
            caution: this.text("SettingBackupCompatCautionLabel", "需注意"),
            incompatible: this.text("SettingBackupCompatBadLabel", "不兼容"),
            unknown: this.text("SettingBackupCompatUnknownLabel", "版本未知"),
        };
        return map[level];
    }

    public compatReason(compat: SettingBackupCompat): string {
        const map: Record<string, string> = {
            SettingBackupCompatOk: this.text("SettingBackupCompatOk", "与当前思源版本兼容"),
            SettingBackupCompatUnknownVersion: this.text(
                "SettingBackupCompatUnknownVersion",
                "备份或当前版本号无法识别，还原前请自行确认。",
            ),
            SettingBackupCompatMajorMismatch: this.text(
                "SettingBackupCompatMajorMismatch",
                "备份与当前思源主版本不同，设置结构可能对不上。",
            ),
            SettingBackupCompatNewer: this.text(
                "SettingBackupCompatNewer",
                "这份备份来自更新的思源，当前版本可能无法正确识别其中的设置。",
            ),
            SettingBackupCompatNewerPatch: this.text(
                "SettingBackupCompatNewerPatch",
                "这份备份来自稍新的修订版，一般可用，仍建议先确认。",
            ),
            SettingBackupCompatOlder: this.text(
                "SettingBackupCompatOlder",
                "这份备份来自较旧的思源，部分新设置会保留当前值。",
            ),
        };
        return map[compat.reasonKey] || "";
    }

    public async getRecord(id: string): Promise<SettingBackupRecord | null> {
        const loaded = await this.loadJson(`${BACKUP_DIR}/${id}.json`);
        if (!this.isRecord(loaded)) {
            return null;
        }
        return loaded;
    }

    public async create(name: string, note: string): Promise<SettingBackupRecord> {
        const trimmedName = name.trim();
        if (!trimmedName) {
            throw new Error(this.text("SettingBackupNameRequired", "请填写备份名称"));
        }

        const conf = await this.collectSanitizedConf();
        const device = this.collectDeviceInfo();
        const createdAt = Date.now();
        const record: SettingBackupRecord = {
            id: this.createId(createdAt),
            name: trimmedName,
            note: note.trim(),
            createdAt,
            ...device,
            conf,
        };

        await this.saveJson(`${BACKUP_DIR}/${record.id}.json`, record);
        const index = await this.loadIndex();
        index.items = index.items.filter((item) => item.id !== record.id);
        index.items.unshift(this.toMeta(record));
        await this.saveIndex(index);
        return record;
    }

    public async updateMeta(id: string, name: string, note: string): Promise<SettingBackupMeta> {
        const record = await this.getRecord(id);
        if (!record) {
            throw new Error(this.text("SettingBackupNotFound", "找不到这份备份"));
        }
        const trimmedName = name.trim();
        if (!trimmedName) {
            throw new Error(this.text("SettingBackupNameRequired", "请填写备份名称"));
        }
        record.name = trimmedName;
        record.note = note.trim();
        await this.saveJson(`${BACKUP_DIR}/${id}.json`, record);

        const index = await this.loadIndex();
        const nextMeta = this.toMeta(record);
        const pos = index.items.findIndex((item) => item.id === id);
        if (pos >= 0) {
            index.items[pos] = nextMeta;
        } else {
            index.items.unshift(nextMeta);
        }
        await this.saveIndex(index);
        return nextMeta;
    }

    public async remove(id: string): Promise<void> {
        const plugin = EnvConfig.ins.plugin;
        if (plugin) {
            await plugin.removeData(`${BACKUP_DIR}/${id}.json`);
        }
        const index = await this.loadIndex();
        index.items = index.items.filter((item) => item.id !== id);
        await this.saveIndex(index);
    }

    public async restore(
        id: string,
        sections: ConfBackupSectionKey[] = DEFAULT_RESTORE_SECTIONS,
    ): Promise<void> {
        const record = await this.getRecord(id);
        if (!record?.conf) {
            throw new Error(this.text("SettingBackupNotFound", "找不到这份备份"));
        }

        const selected = sections.filter((key) => CONF_BACKUP_SECTIONS.includes(key));
        if (selected.length === 0) {
            throw new Error(this.text("SettingBackupSelectSection", "请至少选择一项要还原的设置"));
        }

        const errors: string[] = [];
        for (const key of selected) {
            const payload = record.conf[key];
            if (payload == null) {
                continue;
            }
            const result = await this.applySection(key, payload);
            if (!result.ok) {
                errors.push(`${this.sectionLabel(key)}: ${result.msg || "failed"}`);
            }
        }
        if (errors.length > 0) {
            throw new Error(errors.join("\n"));
        }
    }

    public async reloadInterface(): Promise<void> {
        await reloadUI();
    }

    public defaultBackupName(createdAt: number = Date.now()): string {
        const device = this.collectDeviceInfo();
        return `${this.deviceKindLabel(device.deviceKind)} ${formatLocalDateTime(createdAt)}`;
    }

    public deviceKindLabel(kind: ConfBackupDeviceKind | string): string {
        const map: Record<string, string> = {
            desktop: this.text("SettingBackupDeviceDesktop", "电脑端"),
            mobile: this.text("SettingBackupDeviceMobile", "手机端"),
            "browser-desktop": this.text("SettingBackupDeviceBrowserDesktop", "浏览器电脑端"),
            "browser-mobile": this.text("SettingBackupDeviceBrowserMobile", "浏览器手机端"),
            docker: this.text("SettingBackupDeviceDocker", "Docker"),
        };
        return map[kind] || kind || this.text("SettingBackupDeviceUnknown", "未知设备");
    }

    public deviceModelText(meta: Pick<SettingBackupMeta, "deviceKind" | "os" | "osPlatform">): string {
        const parts = [this.deviceKindLabel(meta.deviceKind)];
        const osLabel = OS_LABEL[meta.os] || meta.os;
        if (isValidStr(osLabel)) {
            parts.push(osLabel);
        }
        if (isValidStr(meta.osPlatform) && meta.osPlatform !== osLabel && meta.osPlatform !== meta.os) {
            parts.push(meta.osPlatform);
        }
        return parts.join(" · ");
    }

    public sectionLabel(key: ConfBackupSectionKey): string {
        const map: Record<ConfBackupSectionKey, string> = {
            keymap: this.text("SettingBackupSectionKeymap", "快捷键"),
            appearance: this.text("SettingBackupSectionAppearance", "外观"),
            editor: this.text("SettingBackupSectionEditor", "编辑器"),
            fileTree: this.text("SettingBackupSectionFileTree", "文档树"),
            search: this.text("SettingBackupSectionSearch", "搜索"),
            export: this.text("SettingBackupSectionExport", "导出"),
            flashcard: this.text("SettingBackupSectionFlashcard", "闪卡"),
            bazaar: this.text("SettingBackupSectionBazaar", "集市"),
            snippet: this.text("SettingBackupSectionSnippet", "代码片段开关"),
            uiLayout: this.text("SettingBackupSectionLayout", "界面布局"),
        };
        return map[key];
    }

    public collectDeviceInfo(): Pick<
        SettingBackupMeta,
        "deviceName" | "deviceKind" | "os" | "osPlatform" | "frontend" | "container" | "appVersion"
    > {
        const system = window.siyuan?.config?.system ?? {};
        const frontend = getFrontend();
        return {
            deviceName: this.resolveDeviceName(system),
            deviceKind: this.resolveDeviceKind(frontend, system.container),
            os: system.os || "",
            osPlatform: system.osPlatform || "",
            frontend,
            container: system.container || "",
            appVersion: system.kernelVersion || "",
        };
    }

    private resolveDeviceName(system: any): string {
        if (isValidStr(system?.name)) {
            return system.name;
        }
        if (isValidStr(system?.osPlatform)) {
            return system.osPlatform;
        }
        return this.text("SettingBackupDeviceUnknown", "未知设备");
    }

    private resolveDeviceKind(frontend: string, container: string): ConfBackupDeviceKind {
        if (container === "android" || container === "ios" || container === "harmony") {
            return "mobile";
        }
        if (container === "docker") {
            return "docker";
        }
        if (frontend === "mobile") {
            return "mobile";
        }
        if (frontend === "browser-mobile") {
            return "browser-mobile";
        }
        if (frontend === "browser-desktop") {
            return "browser-desktop";
        }
        return "desktop";
    }

    private async collectSanitizedConf(): Promise<Record<string, any>> {
        let conf = await getSystemConf();
        if (!conf || typeof conf !== "object") {
            conf = window.siyuan?.config;
        }
        if (!conf || typeof conf !== "object") {
            throw new Error(this.text("SettingBackupReadFailed", "读取当前设置失败"));
        }
        return this.sanitizeConf(conf);
    }

    private sanitizeConf(conf: any): Record<string, any> {
        const cloned = JSON.parse(JSON.stringify(conf));
        const result: Record<string, any> = {};

        for (const key of CONF_BACKUP_SECTIONS) {
            if (cloned[key] != null) {
                result[key] = cloned[key];
            }
        }
        if (cloned.lang) {
            result.lang = cloned.lang;
        }

        if (result.appearance) {
            result.appearance.darkThemes = undefined;
            result.appearance.lightThemes = undefined;
            result.appearance.icons = undefined;
            delete result.appearance.darkThemes;
            delete result.appearance.lightThemes;
            delete result.appearance.icons;
        }

        if (result.export) {
            result.export.pandocBin = "";
        }

        return result;
    }

    private async applySection(
        key: ConfBackupSectionKey,
        payload: any,
    ): Promise<{ ok: boolean; msg: string }> {
        const current = window.siyuan?.config ?? {};
        switch (key) {
            case "keymap":
                return this.postOk("/api/setting/setKeymap", {
                    data: this.overlayBackupOnCurrent(current.keymap, payload),
                });
            case "appearance":
                return this.postOk("/api/setting/setAppearance", {
                    ...this.overlayBackupOnCurrent(current.appearance, payload),
                    darkThemes: current.appearance?.darkThemes ?? payload.darkThemes,
                    lightThemes: current.appearance?.lightThemes ?? payload.lightThemes,
                    icons: current.appearance?.icons ?? payload.icons,
                });
            case "editor":
                return this.postOk("/api/setting/setEditor", this.overlayBackupOnCurrent(current.editor, payload));
            case "fileTree":
                return this.postOk("/api/setting/setFiletree", this.overlayBackupOnCurrent(current.fileTree, payload));
            case "search":
                return this.postOk("/api/setting/setSearch", this.overlayBackupOnCurrent(current.search, payload));
            case "export": {
                const merged = this.overlayBackupOnCurrent(current.export, payload);
                if (current.export?.pandocBin) {
                    merged.pandocBin = current.export.pandocBin;
                }
                return this.postOk("/api/setting/setExport", merged);
            }
            case "flashcard":
                return this.postOk("/api/setting/setFlashcard", this.overlayBackupOnCurrent(current.flashcard, payload));
            case "bazaar":
                return this.postOk("/api/setting/setBazaar", this.overlayBackupOnCurrent(current.bazaar, payload));
            case "snippet":
                return this.postOk("/api/setting/setSnippet", this.overlayBackupOnCurrent(current.snippet, payload));
            case "uiLayout":
                return this.postOk("/api/system/setUILayout", { layout: payload });
            default:
                return { ok: true, msg: "" };
        }
    }

    private overlayBackupOnCurrent(current: any, backup: any): any {
        if (backup == null) {
            return current;
        }
        if (
            current == null ||
            typeof current !== "object" ||
            typeof backup !== "object" ||
            Array.isArray(current) ||
            Array.isArray(backup)
        ) {
            return backup;
        }
        const result: Record<string, any> = { ...current };
        for (const key of Object.keys(backup)) {
            result[key] = this.overlayBackupOnCurrent(current[key], backup[key]);
        }
        return result;
    }

    private async postOk(url: string, data: any): Promise<{ ok: boolean; msg: string }> {
        const response = await postApi(url, data);
        return {
            ok: response?.code === 0,
            msg: response?.msg || "",
        };
    }

    private async loadIndex(): Promise<SettingBackupIndex> {
        const loaded = await this.loadJson(INDEX_FILE);
        if (loaded && Array.isArray(loaded.items)) {
            return {
                version: typeof loaded.version === "number" ? loaded.version : INDEX_VERSION,
                items: loaded.items.filter((item: any) => item && isValidStr(item.id)),
            };
        }
        return { version: INDEX_VERSION, items: [] };
    }

    private async saveIndex(index: SettingBackupIndex): Promise<void> {
        await this.saveJson(INDEX_FILE, {
            version: INDEX_VERSION,
            items: index.items.map((item) => this.toMeta(item)),
        });
    }

    private async scanBackupFiles(): Promise<SettingBackupMeta[]> {
        const plugin = EnvConfig.ins.plugin;
        if (!plugin) {
            return [];
        }
        const entries = await readDir(`/data/storage/petal/${plugin.name}/${BACKUP_DIR}`);
        if (!Array.isArray(entries)) {
            return [];
        }
        const items: SettingBackupMeta[] = [];
        for (const entry of entries) {
            if (!entry || entry.isDir || entry.name === "index.json" || !entry.name.endsWith(".json")) {
                continue;
            }
            const loaded = await this.loadJson(`${BACKUP_DIR}/${entry.name}`);
            if (this.isMeta(loaded)) {
                items.push(this.toMeta(loaded));
            }
        }
        return items;
    }

    private async loadJson(storageName: string): Promise<any> {
        const plugin = EnvConfig.ins.plugin;
        if (!plugin) {
            return null;
        }
        const loaded = await plugin.loadData(storageName);
        if (loaded == null || loaded === "" || loaded === undefined) {
            return null;
        }
        if (typeof loaded === "object" && typeof loaded.code === "number" && loaded.code !== 0) {
            return null;
        }
        if (typeof loaded === "string") {
            try {
                return JSON.parse(loaded);
            } catch {
                return null;
            }
        }
        return loaded;
    }

    private async saveJson(storageName: string, data: any): Promise<void> {
        const plugin = EnvConfig.ins.plugin;
        if (!plugin) {
            throw new Error(this.text("SettingBackupPluginMissing", "插件未初始化"));
        }
        await plugin.saveData(storageName, data);
    }

    private toMeta(record: SettingBackupMeta): SettingBackupMeta {
        return {
            id: record.id,
            name: record.name,
            note: record.note || "",
            createdAt: record.createdAt,
            deviceName: record.deviceName || "",
            deviceKind: record.deviceKind,
            os: record.os || "",
            osPlatform: record.osPlatform || "",
            frontend: record.frontend || "",
            container: record.container || "",
            appVersion: record.appVersion || "",
        };
    }

    private isMeta(value: any): value is SettingBackupMeta {
        return value && typeof value === "object" && isValidStr(value.id) && typeof value.createdAt === "number";
    }

    private isRecord(value: any): value is SettingBackupRecord {
        return !!(
            value &&
            typeof value === "object" &&
            isValidStr(value.id) &&
            typeof value.createdAt === "number" &&
            typeof value.conf === "object"
        );
    }

    private sortMeta(items: SettingBackupMeta[]): SettingBackupMeta[] {
        return [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    private createId(createdAt: number): string {
        const stamp = formatLocalDateTime(createdAt).replace(/[-: ]/g, "");
        const rand = Math.random().toString(16).slice(2, 6);
        return `${stamp}-${rand}`;
    }

    private text(key: string, fallback: string): string {
        const value = EnvConfig.ins.i18n?.[key];
        return typeof value === "string" && value ? value : fallback;
    }
}
