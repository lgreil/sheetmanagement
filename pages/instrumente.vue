<template>
    <section class="bg-[--color-surface] text-center py-16 px-6" v-auto-animate>
        <div class="max-w-3xl mx-auto">
            <UAlert
                icon="i-heroicons-exclamation-triangle"
                color="warning"
                title="Not being added soon!"
                variant="solid"
                class="mb-6"
            >
                Since we are currently focusing on other parts of the App this will not be implemented for quite a while.
            </UAlert>

            <h1 class="text-4xl font-bold text-[--color-text]">
                🎻 Instrument Inventory 🎻
            </h1>
            <p class="text-xl text-[--color-text] mt-4">
                <strong>Manage and track your orchestra's instruments with ease</strong>
            </p>
            <p class="text-lg text-[--color-muted-text] mt-2">
                Keep an organized record of all instruments, their conditions, and assignments. Ensure your orchestra is always ready for rehearsals and performances.
            </p>

            <div class="mt-6">
                <h3 class="text-2xl font-semibold text-[--color-text]">
                    🔹 Features:
                </h3>
                <ul
                    class="list-none mt-3 space-y-2 text-lg text-[--color-muted-text]"
                    v-auto-animate="{ duration: 100 }"
                >
                    <li>🎺 Track Instrument Conditions - Monitor the condition and maintenance status of each instrument.</li>
                    <li>🎷 Assign Instruments - Easily assign instruments to musicians and keep track of their usage.</li>
                    <li>🎸 Inventory Management - Maintain a comprehensive inventory of all instruments.</li>
                </ul>
            </div>

            <div class="mt-6">
                <h3 class="text-2xl font-semibold text-[--color-text]">
                    🔹 Our Commitment:
                </h3>
                <p class="text-lg text-[--color-muted-text] mt-2">
                    We are dedicated to providing a seamless instrument management experience for orchestras and ensembles. Our system is designed to help you focus on making music, not managing equipment.
                </p>
            </div>

            <div class="mt-6">
                <NuxtLink
                    to="/contact"
                    class="inline-block mt-4 px-6 py-3 text-lg font-semibold text-[--color-text] bg-[--color-primary] rounded-lg shadow-md hover:bg-[--color-accent] transition"
                >
                    Contact Us for More Information
                </NuxtLink>
            </div>
        </div>
    </section>
</template>

<script>
import { useAutoAnimate } from "@formkit/auto-animate/vue";

export default {
    setup() {
        const [parent] = useAutoAnimate();
        return { parent };
    },
};
</script>

<style>
/* Removed custom animations as auto-animate handles them */
</style>
