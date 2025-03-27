<template>
    <section
        class="bg-[--bachkreisgelb-hell] dark:bg-gray-800 text-center py-16 px-6"
    >
        <div class="container mx-auto max-w-4xl">
            <h2
                class="text-3xl font-bold text-[--dark-color] dark:text-white mb-6"
            >
                Join Our Community
            </h2>

            <p class="text-lg text-[--dark-color] dark:text-gray-300 mb-8">
                Be part of our growing community dedicated to innovation and
                collaboration. We're building something special, and your
                perspective matters.
            </p>

            <div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3
                    class="text-2xl font-semibold text-[--dark-color] dark:text-gray-200 flex items-center justify-center"
                >
                    <span class="text-[--bachkreisgelb-dunkel] mr-2">✦</span>
                    Get Involved
                </h3>
                <p class="text-lg text-[--dark-color] dark:text-gray-400 mt-3">
                    We welcome feedback and contributions from the community. If
                    you have ideas, suggestions, or would like to contribute to
                    the project, please get in touch with us.
                </p>
                <NuxtLink
                    to="/contact"
                    class="inline-block mt-4 px-6 py-3 text-lg font-semibold text-white bg-[--dark-color] dark:bg-gray-700 rounded-lg shadow-md hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-600 transition"
                >
                    Contact Us
                </NuxtLink>
            </div>
        </div>
    </section>
</template>
