<template>
  <section class="bg-[--bachkreisgelb-hell] dark:bg-gray-800 text-center py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-4xl font-bold text-[--smoky-black] dark:text-white">🎵 Welcome to Bachkreis-Sheetmanagement 🎵</h1>
      <p class="text-xl text-[--dark-color] dark:text-gray-300 mt-4">
        <strong>Your all-in-one sheet music management system</strong>
      </p>
      <p class="text-lg text-[--dark-color] dark:text-gray-400 mt-2">
        Effortlessly organize, search, and access your orchestra’s sheet music.  
        From classical masterpieces to modern arrangements, keep everything at your fingertips.
      </p>

      <div class="mt-6">
        <h3 class="text-2xl font-semibold text-[--dark-color] dark:text-gray-200">🔹 Features:</h3>
        <ul class="list-none mt-3 space-y-2 text-lg text-[--dark-color] dark:text-gray-400">
          <li>🎼 <strong>Find & Manage Pieces</strong></li>
          <li>🎻 <strong>Assign Parts with Ease</strong></li>
          <li>🎶 <strong>Streamline Rehearsals</strong></li>
        </ul>
      </div>

      <NuxtLink to="/stuecke" class="inline-block mt-6 px-6 py-3 text-lg font-semibold text-white bg-[--dark-color] dark:bg-gray-700 rounded-lg shadow-md hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-600 transition">
        Get Started
      </NuxtLink>
    </div>
  </section>
</template>
