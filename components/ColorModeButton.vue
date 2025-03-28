<template>
    <div class="theme-toggle-container">
        <span
            @click="toggleColorMode"
            class="theme-icon cursor-pointer"
            aria-label="Toggle color mode"
        >
            <transition name="morph" mode="out-in">
                <Icon
                    :key="colorMode.value"
                    :name="
                        colorMode.value === 'light'
                            ? 'i-heroicons-moon'
                            : 'i-heroicons-sun'
                    "
                    class="text-lg"
                    :class="
                        colorMode.value === 'light'
                            ? 'text-primary-500'
                            : 'text-accent-500'
                    "
                />
            </transition>
        </span>
    </div>
</template>

<script setup>
const colorMode = useColorMode();

function toggleColorMode() {
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", colorMode.preference);
    document.documentElement.classList.toggle(
        "light",
        colorMode.preference === "light",
    );
    document.documentElement.classList.toggle(
        "dark",
        colorMode.preference === "dark",
    );
}

// Set the initial theme class on mount
onMounted(() => {
    document.documentElement.setAttribute("data-theme", colorMode.preference);
    document.documentElement.classList.add(colorMode.preference);
});
</script>

<style scoped>
.theme-toggle-container {
    position: relative;
}

.morph-enter-active,
.morph-leave-active {
    transition:
        opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
    transition: transform 0.3s ease;
}

.theme-icon:hover {
    transform: translateY(-2px);
}
</style>
