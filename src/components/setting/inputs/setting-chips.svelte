<script lang="ts">
    import { ItemProperty } from "@/models/setting-model";
    import { SettingService } from "@/service/SettingService";

    export let itemProperty: ItemProperty;

    let selected: string[] = Array.isArray(SettingService.ins.SettingConfig[itemProperty.key])
        ? [...SettingService.ins.SettingConfig[itemProperty.key]]
        : [];

    function isChecked(value: string): boolean {
        return selected.includes(value);
    }

    function onToggle(value: string) {
        selected = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];
        SettingService.ins.updateSettingCofnigValue(itemProperty.key, selected);
    }
</script>

<div class="mz-setting__multi">
    {#each itemProperty.options as option (option.value)}
        <label class="mz-setting__chip">
            <input
                type="checkbox"
                checked={isChecked(option.value)}
                on:change={() => onToggle(option.value)}
            />
            <span>{option.name}</span>
        </label>
    {/each}
</div>

<style lang="scss">
    .mz-setting__multi {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .mz-setting__chip {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        padding: 3px 10px;
        border: 1px solid var(--b3-border-color);
        border-radius: var(--b3-border-radius);
        cursor: pointer;
        user-select: none;
    }

    .mz-setting__chip input {
        margin: 0;
        cursor: pointer;
    }
</style>
