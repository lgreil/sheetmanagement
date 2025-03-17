<template>
    <section class="bg-[--bachkreisgelb-hell] dark:bg-gray-800 text-center py-16 px-6">
        <div class="max-w-3xl mx-auto">
            <h1 class="text-4xl font-bold text-[--smoky-black] dark:text-white">About Bachkreis-Sheetmanagement</h1>
            <p class="text-xl text-[--dark-color] dark:text-gray-300 mt-4">
                <strong>Passionate about simplifying sheet music management</strong>
            </p>
            <p class="text-lg text-[--dark-color] dark:text-gray-400 mt-2">
                Bachkreis-Sheetmanagement is a hobby project created to help orchestras and ensembles effortlessly
                organize, search, and access sheet music. Built with Nuxt.js, it aims to streamline your music
                management experience.
            </p>

            <div class="mt-6">
                <h3 class="text-2xl font-semibold text-[--dark-color] dark:text-gray-200">🔹 Key Features:</h3>
                <ul class="list-none mt-3 space-y-2 text-lg text-[--dark-color] dark:text-gray-400">
                    <li>🎼 <strong>Find & Manage Pieces</strong> - Easily search and organize your sheet music
                        collection.</li>
                    <li>🎻 <strong>Assign Parts with Ease</strong> - Quickly assign parts to musicians.</li>
                    <li>🎶 <strong>Streamline Rehearsals</strong> - Efficiently plan and manage rehearsals.</li>
                </ul>
            </div>

            <div class="mt-6">
                <h3 class="text-2xl font-semibold text-[--dark-color] dark:text-gray-200">🔹 Our Vision:</h3>
                <p class="text-lg text-[--dark-color] dark:text-gray-400 mt-2">
                    We envision a world where managing sheet music is a breeze, allowing musicians to focus on what they
                    do best - creating beautiful music. Bachkreis-Sheetmanagement is constantly evolving, with new
                    features and improvements being developed to better serve the music community.
                </p>
            </div>

            <div class="mt-6">
                <h3 class="text-2xl font-semibold text-[--dark-color] dark:text-gray-200">🔹 Get Involved:</h3>
                <p class="text-lg text-[--dark-color] dark:text-gray-400 mt-2">
                    We welcome feedback and contributions from the community. If you have ideas, suggestions, or would
                    like to contribute to the project, please get in touch with us.
                </p>
                <NuxtLink to="/contact"
                    class="inline-block mt-4 px-6 py-3 text-lg font-semibold text-white bg-[--dark-color] dark:bg-gray-700 rounded-lg shadow-md hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-600 transition">
                    Contact Us
                </NuxtLink>
            </div>
        </div>
    </section>
</template>
