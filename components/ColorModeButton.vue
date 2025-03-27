<template>
    <div class="theme-toggle-container">
        <UButton
            @click="toggleColorMode"
            variant="soft"
            :color="colorMode.value === 'light' ? 'indigo' : 'amber'"
            size="sm"
            class="theme-toggle-btn"
        >
            <div class="flex items-center justify-center">
                <span class="theme-icon">
                    <transition name="morph" mode="out-in">
                        <Icon
                            :key="colorMode.value"
                            :name="
                                colorMode.value === 'light'
                                    ? 'i-heroicons-moon'
                                    : 'i-heroicons-sun'
                            "
                            class="text-lg"
                        />
                    </transition>
                </span>
            </div>
        </UButton>
    </div>
</template>
<script setup>
const colorMode = useColorMode();

function toggleColorMode() {
    colorMode.preference = colorMode.value === "light" ? "dark" : "light";
}
</script>
<style scoped>
.theme-toggle-container {
    position: relative;
}
.theme-toggle-btn {
    transition: all 0.3s ease;
    border-radius: 50%;
    padding: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    min-width: auto;
    aspect-ratio: 1/1;
}
.theme-toggle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.morph-enter-active,
.morph-leave-active {
    transition: all 0.5s ease;
    position: absolute;
}
.morph-enter-from {
    opacity: 0;
    transform: rotate(-180deg) scale(0.5);
}
.morph-leave-to {
    opacity: 0;
    transform: rotate(180deg) scale(0.5);
}
.theme-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 1.5rem;
    height: 1.5rem;
}
</style>
