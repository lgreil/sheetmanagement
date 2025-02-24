<template>
  <div class="stueck-manager">
    <!-- The Table component receives the list of stueck items, the columns, and a flag to show actions -->
    <Table
      :items="stueckList"
      :columns="stueckColumns"
      :actions="true"
      @edit="handleEdit"
      @delete="handleDelete"
      @add="openAddModal"
    />
    <AddEntry v-if="showAddModal" :visible="showAddModal" @close="closeAddModal" @save="handleAdd" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import Table from './Table.vue';
import AddEntry from './AddEntry.vue';

export default {
  name: 'StueckManager',
  components: { 
    Table,
    AddEntry
  },
  setup() {
    const stueckList = ref([]);
    const showAddModal = ref(false);

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

    const stueckColumns = [
      { key: 'name', label: 'Name' },
      { key: 'genre', label: 'Genre' },
      { key: 'jahr', label: 'Jahr' },
      { key: 'schwierigkeit', label: 'Schwierigkeit' },
      { key: 'isdigitalisiert', label: 'Digitalisiert' },
      { key: 'composer_name', label: 'Composer(s)' },
      { key: 'arranger_name', label: 'Arranger(s)' }
    ];

    const handleEdit = (item) => {
      console.log('Edit Stueck:', item);
    };

    const handleDelete = (item) => {
      console.log('Delete Stueck:', item);
      stueckList.value = stueckList.value.filter(st => st.id !== item.id);
    };

    const handleAdd = async (newItem) => {
      try {
        const response = await fetch('http://localhost:3005/stuecke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newItem),
        });
        const addedItem = await response.json();
        stueckList.value.push(addedItem);
        closeAddModal();
      } catch (error) {
        console.error('Error adding stueck:', error);
      }
    };

    const openAddModal = () => {
      showAddModal.value = true;
    };

    const closeAddModal = () => {
      showAddModal.value = false;
    };

    onMounted(() => {
      fetchStueckData();
    });

    return {
      stueckList,
      stueckColumns,
      handleEdit,
      handleDelete,
      handleAdd,
      showAddModal,
      openAddModal,
      closeAddModal,
    };
  }
};
</script>

<style scoped>
.stueck-manager {
  padding: 20px;
}
</style>
