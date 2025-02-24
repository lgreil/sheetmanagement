<template>
  <div class="stueck-manager">
    <!-- The Table component receives the list of stueck items, the columns, and a flag to show actions -->
    <Table
      :items="stueckList"
      :columns="stueckColumns"
      :actions="true"
      @edit="handleEdit"
      @delete="handleDelete"
    />
    
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import Table from './Table.vue';

export default {
  name: 'StueckManager',
  components: { 
    Table
  },
  setup() {
    const stueckList = ref([]);
    const fetchStueckData = async () => {
    try {
      const { data, error } = await useFetch('http://localhost:3005/stuecke');

      console.log('API Response:', data.value); // Log data
      if (error.value) {
        console.error('Error fetching data:', error.value);
        return;
      }

      if (!data.value || data.value.length === 0) {
        console.warn('No stuecke data found');
      }

      stueckList.value = data.value || []; // Ensure it's always an array
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };



    // Define the columns that match the stueck properties
    const stueckColumns = [
      { key: 'name', label: 'Name' },
      { key: 'genre', label: 'Genre' },
      { key: 'jahr', label: 'Jahr' },
      { key: 'schwierigkeit', label: 'Schwierigkeit' },
      { key: 'isdigitalisiert', label: 'Digitalisiert' },
      { key: 'composer_name', label: 'Composer(s)' },
      { key: 'arranger_name', label: 'Arranger(s)' }
    ];

    // Handle edit action
    const handleEdit = (item) => {
      // For example, open a modal with the item details or navigate to an edit page
      console.log('Edit Stueck:', item);
    };

    // Handle delete action
    const handleDelete = (item) => {
      // Confirm deletion and then remove the item from the list (or call your API)
      console.log('Delete Stueck:', item);
      stueckList.value = stueckList.value.filter(st => st.id !== item.id);
    };

    // Handle the Add action
    const hanndleAdd = (item) => {
      // Add the new item to the list (or call your API)
      console.log('Add Stueck:', item);
      stueckList.value.push(item);
    };

    onMounted(() => {
      fetchStueckData();
    });

    return {
      stueckList,
      stueckColumns,
      handleEdit,
      handleDelete,
      hanndleAdd,
    };
  }
};
</script>

<style scoped>
.stueck-manager {
  padding: 20px;
}
</style>
