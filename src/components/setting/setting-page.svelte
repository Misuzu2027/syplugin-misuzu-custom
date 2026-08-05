<script lang="ts">
    import { getSettingTabArray } from "@/models/setting-constant";
    import SettingLayout from "./setting-layout.svelte";
    import SettingItem from "./setting-item.svelte";
    import { TabProperty } from "@/models/setting-model";
    import SettingSwitch from "./inputs/setting-switch.svelte";
    import SettingSelect from "./inputs/setting-select.svelte";
    import SettingInput from "./inputs/setting-input.svelte";
    import SettingChips from "./inputs/setting-chips.svelte";
    import { SettingService } from "@/service/SettingService";

    let tabArray: TabProperty[] = getSettingTabArray();
    let activeTab = tabArray[0]?.key ?? "";
    SettingService.ins.init();

    $: layoutTabs = tabArray.map((tab) => ({
        key: tab.key,
        label: tab.name,
        icon: tab.iconKey,
    }));
</script>

<div class="mz-setting">
    <SettingLayout tabs={layoutTabs} bind:activeTab>
        {#each tabArray as tab (tab.key)}
            <div class="mz-setting__tab" class:fn__none={activeTab !== tab.key}>
                {#each tab.props as itemProperty (itemProperty.key)}
                    <SettingItem {itemProperty} column={itemProperty.type === "chips"}>
                        {#if itemProperty.type == "switch"}
                            <SettingSwitch {itemProperty} />
                        {:else if itemProperty.type == "chips"}
                            <SettingChips {itemProperty} />
                        {:else if itemProperty.type == "select"}
                            <SettingSelect {itemProperty} />
                        {:else if itemProperty.type == "number" || itemProperty.type == "text"}
                            <SettingInput {itemProperty} />
                        {:else}
                            不能载入设置项，请检查设置代码实现。 Key: {itemProperty.key}
                            <br />
                            can't load settings, check code please. Key:
                            {itemProperty.key}
                        {/if}
                    </SettingItem>
                {/each}
            </div>
        {/each}
    </SettingLayout>
</div>

<style lang="scss">
    .mz-setting {
        height: 100%;
    }

    .mz-setting__tab {
        display: flex;
        flex-direction: column;
    }
</style>
