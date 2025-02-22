<template>
  <tr class="bg-white border-b hover:bg-gray-50 transition duration-300 ease-in-out">
    <!-- Loop through columns -->
    <td
      v-for="column in columns"
      :key="column.key"
      class="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
    >
      <!-- Custom rendering based on column key -->
      <template v-if="column.key === 'schwierigkeit'">
        <!-- Difficulty represented as a colored bar -->
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            :class="['h-2 rounded-full', difficultyBarClass(item[column.key])]"
            :style="{ width: difficultyBarWidth(item[column.key]) }"
          ></div>
        </div>
      </template>

      <template v-else-if="column.key === 'isdigitalisiert'">
        <!-- Digitalized status represented as an icon -->
        <div class="flex justify-center items-center">
          <!-- If digitalized, show a check icon -->
          <svg
            v-if="item[column.key]"
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <!-- If not digitalized, show an X icon -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </template>

      <template v-else>
        <!-- Default rendering for other columns -->
        {{ Array.isArray(item[column.key]) ? item[column.key].join(', ') : item[column.key] }}
      </template>
    </td>

    <!-- Actions Column -->
    <td
      v-if="actions"
      class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
    >
      <button
        @click="editItem(item)"
        class="text-blue-600 hover:text-blue-800 mr-4"
      >
        Edit
      </button>
      <button
        @click="deleteItem(item)"
        class="text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    </td>
  </tr>
</template>

<script>
export default {
  name: 'TableEntry',
  props: {
    item: {
      type: Object,
      required: true,
    },
    columns: {
      type: Array,
      required: true,
    },
    actions: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    editItem(item) {
      this.$emit('edit', item);
    },
    deleteItem(item) {
      this.$emit('delete', item);
    },
    // Method to determine the width of the difficulty bar
    difficultyBarWidth(difficulty) {
      switch (difficulty.toLowerCase()) {
        case 'low':
          return '25%';
        case 'medium':
          return '50%';
        case 'high':
          return '75%';
        case 'very high':
          return '100%';
        default:
          return '0%';
      }
    },
    // Method to determine the color of the difficulty bar
    difficultyBarClass(difficulty) {
      switch (difficulty.toLowerCase()) {
        case 'low':
          return 'bg-green-500';
        case 'medium':
          return 'bg-yellow-500';
        case 'high':
          return 'bg-orange-500';
        case 'very high':
          return 'bg-red-500';
        default:
          return 'bg-gray-500';
      }
    },
  },
};
</script>
