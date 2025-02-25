<template>
    <section class="bg-[--bachkreisgelb-hell] dark:bg-gray-800 text-center py-16 px-6">
        <div class="max-w-3xl mx-auto">
            <UAlert color="red" title="Not being added soon!" variant="solid"
                description="Since we are currently focusing on other parts of the App this will not be implemented for quite a while." />


            <h1 class="text-4xl font-bold text-[--smoky-black] dark:text-white">🎻 Instrument Inventory 🎻</h1>
            <p class="text-xl text-[--dark-color] dark:text-gray-300 mt-4">
                <strong>Manage and track your orchestra's instruments with ease</strong>
            </p>
            <p class="text-lg text-[--dark-color] dark:text-gray-400 mt-2">
                Keep an organized record of all instruments, their conditions, and assignments. Ensure your orchestra is
                always ready for rehearsals and performances.
            </p>

            <div class="mt-6">
                <h3 class="text-2xl font-semibold text-[--dark-color] dark:text-gray-200">🔹 Features:</h3>
                <ul class="list-none mt-3 space-y-2 text-lg text-[--dark-color] dark:text-gray-400">
                    <li>🎺 <strong>Track Instrument Conditions</strong> - Monitor the condition and maintenance status
                        of each instrument.</li>
                    <li>🎷 <strong>Assign Instruments</strong> - Easily assign instruments to musicians and keep track
                        of their usage.</li>
                    <li>🎸 <strong>Inventory Management</strong> - Maintain a comprehensive inventory of all
                        instruments.</li>
                </ul>
            </div>

            <div class="mt-6">
                <h3 class="text-2xl font-semibold text-[--dark-color] dark:text-gray-200">🔹 Our Commitment:</h3>
                <p class="text-lg text-[--dark-color] dark:text-gray-400 mt-2">
                    We are dedicated to providing a seamless instrument management experience for orchestras and
                    ensembles. Our system is designed to help you focus on making music, not managing equipment.
                </p>
            </div>

            <div class="mt-6">
                <NuxtLink to="/contact"
                    class="inline-block mt-4 px-6 py-3 text-lg font-semibold text-white bg-[--dark-color] dark:bg-gray-700 rounded-lg shadow-md hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-600 transition">
                    Contact Us for More Information
                </NuxtLink>
            </div>
        </div>
    </section>
</template>