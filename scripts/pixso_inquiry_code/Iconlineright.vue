<template>
    <div class="component-30_7443">
        <div id="30_7443" class="Pixso-symbol-30_7443 pixso-position-relative">
            <div id="30_7444" class="Pixso-group-30_7444">
                <div id="30_7445" class="Pixso-rectangle-30_7445"></div>
                <slot name="slot_30_7446">
                    <div id="30_7446" class="Pixso-vector-30_7446"></div>
                </slot>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup></script>
<style>
.Pixso-symbol-30_7443 {
    width: 16px;
    height: 16px;
}

.Pixso-group-30_7444,
.Pixso-rectangle-30_7445 {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0%;
    right: 0%;
    top: 0%;
    bottom: 0%;
}

.Pixso-rectangle-30_7445 {
    background-color: rgba(0, 0, 0, 1);
    opacity: 0;
}

.Pixso-vector-30_7446 {
    width: 46.49%;
    height: 74.02%;
    background-image: url("http://localhost:3667/assets/1787031086134/Vector_30_7446.svg");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    position: absolute;
    left: 29.49%;
    right: 24.02%;
    top: 12.99%;
    bottom: 12.99%;
}
</style>
