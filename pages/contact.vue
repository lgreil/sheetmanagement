<template>
    <section class="bg-[--color-surface] text-center py-16 px-6">
        <div class="container mx-auto max-w-4xl">
            <h2 class="text-3xl font-bold text-[--color-text] mb-6">
                Join Our Community
            </h2>

            <p class="text-lg text-[--color-text] mb-8">
                Be part of our growing community dedicated to innovation and collaboration
            </p>

            <div
                class="bg-[--color-surface] p-6 rounded-lg shadow-lg border border-[--color-border]"
            >
                <h3
                    class="text-2xl font-semibold text-[--color-text] flex items-center justify-center"
                >
                    <span class="text-[--color-accent] mr-2">✦</span>
                    Get Involved
                </h3>
                <p class="text-lg text-[--color-muted-text] mt-3">
                    We welcome feedback and contributions from the community. If you have ideas, suggestions, or would like to contribute to the project, please get in touch with us.
                </p>
                <NuxtLink
                    to="/contact"
                    class="inline-block mt-4 px-6 py-3 text-lg font-semibold text-[--color-text] bg-[--color-primary] rounded-lg shadow-md hover:bg-[--color-accent] transition"
                >
                    Contact Us
                </NuxtLink>
            </div>
        </div>
    </section>
</template>
