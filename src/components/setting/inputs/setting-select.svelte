<script lang="ts" setup>
    import { ItemProperty } from "@/models/setting-model";
    import { SettingService } from "@/service/SettingService";

    export let itemProperty: ItemProperty;
    let value = SettingService.ins.SettingConfig[itemProperty.key];

    function selectChange() {
        SettingService.ins.updateSettingCofnigValue(itemProperty.key, value);
    }
</script>

<select
    class="b3-select fn__flex-center fn__size200"
    bind:value
    on:change={selectChange}
>
    {#each itemProperty.options as option}
        <option value={option.value}>{option.name}</option>
    {/each}
</select>
