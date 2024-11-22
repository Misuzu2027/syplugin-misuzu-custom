<!-- <script lang="ts">
    // import { EnvConfig } from "@/config/EnvConfig";
    import { createEventDispatcher, onMount } from "svelte";
    import { SettingService } from "@/service/SettingService";

    const dispatch = createEventDispatcher();

    let width: string =
        SettingService.ins.SettingConfig.imageMiddleClickResizeWidth;

    // let rootElement: HTMLElement;

    onMount(async () => {});

    function cancelBtnClick() {
        dispatch("cancel", null);
    }

    function confirmBtnClick() {
        dispatch("confirm", {
            width: width,
        });
    }
</script>

<div class="b3-dialog__body">
    <div class="b3-dialog__content">
        <div class="ft__breakword">
            <input
                class="b3-text-field fn__block misuzu2027__copy misuzu2027__protyle-custom"
                type="text"
                bind:value={width}
            />
        </div>
    </div>
    <div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel" on:click={cancelBtnClick}
            >取消</button
        >
        <div class="fn__space"></div>
        <button class="b3-button b3-button--text" on:click={confirmBtnClick}
            >确定</button
        >
    </div>
</div>

<style>
    input {
        margin-top: -1px;
        margin-left: 30px;
        width: 100px;
        height: 25px;
        font-size: 85%;
        font-weight: bold;
        background-color: rgba(128, 128, 128, 0);
    }
    input:focus {
        background-color: var(--b3-theme-background);
    }
</style> -->
