<script lang="ts">
    import { EnvConfig } from "@/config/EnvConfig";
    import { getSettingTabArray } from "@/models/setting-constant";
    import SettingLayout from "./setting-layout.svelte";
    import SettingItem from "./setting-item.svelte";
    import { TabProperty } from "@/models/setting-model";
    import SettingSwitch from "./inputs/setting-switch.svelte";
    import SettingSelect from "./inputs/setting-select.svelte";
    import SettingInput from "./inputs/setting-input.svelte";
    import { SettingService } from "@/service/SettingService";
    import ConfBackupPage from "./conf-backup-page.svelte";

    const isMobile = EnvConfig.ins.isMobile;
    let tabArray: TabProperty[] = getSettingTabArray();
    let activeTab = tabArray[0]?.key ?? "";
    SettingService.ins.init();

    $: layoutTabs = tabArray.map((tab) => ({
        key: tab.key,
        label: tab.name,
        icon: tab.iconKey,
    }));
</script>

<div class="mz-setting" class:mz-setting--mobile={isMobile}>
    <SettingLayout tabs={layoutTabs} bind:activeTab>
        {#each tabArray as tab (tab.key)}
            <div class="mz-setting__tab" class:fn__none={activeTab !== tab.key}>
                {#if tab.page === "conf-backup"}
                    <ConfBackupPage />
                {:else}
                    {#each tab.props as itemProperty (itemProperty.key)}
                        <SettingItem {itemProperty}>
                            {#if itemProperty.type == "switch"}
                                <SettingSwitch {itemProperty} />
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
                {/if}
            </div>
        {/each}
    </SettingLayout>
</div>

<style lang="scss">
    .mz-setting {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mz-setting__tab {
        display: flex;
        flex-direction: column;
    }

    .mz-setting--mobile :global(.mz-setting-item) {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }

    .mz-setting--mobile :global(.mz-setting-item__control) {
        width: 100%;
        flex-shrink: 1;
    }

    .mz-setting--mobile :global(.b3-select),
    .mz-setting--mobile :global(.b3-text-field),
    .mz-setting--mobile :global(.fn__size200),
    .mz-setting--mobile :global(.mz-setting__multi) {
        width: 100%;
        max-width: none;
    }
</style>
