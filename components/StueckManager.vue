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
    // Initial dummy data for Stueck items; in real scenario, you might fetch this from an API
    const stueckList = ref([
      {
        id: 1,
        name: 'Stueck One',
        genre: 'Classical',
        jahr: 1990,
        schwierigkeit: 'Medium',
        isdigitalisiert: true,
        composer_name: ['Composer A', 'Composer B'],
        arranger_name: ['Arranger X']
      },
      {
        id: 2,
        name: 'Stueck Two',
        genre: 'Jazz',
        jahr: 2005,
        schwierigkeit: 'High',
        isdigitalisiert: false,
        composer_name: ['Composer C'],
        arranger_name: ['Arranger Y', 'Arranger Z']
      },{
    id: 4,
    name: 'Stueck One',
    genre: 'Classical',
    jahr: 1990,
    schwierigkeit: 'Medium',
    isdigitalisiert: true,
    composer_name: ['Composer A', 'Composer B'],
    arranger_name: ['Arranger X'],
  },
  {
    id: 5,
    name: 'Stueck Two',
    genre: 'Jazz',
    jahr: 2005,
    schwierigkeit: 'High',
    isdigitalisiert: false,
    composer_name: ['Composer C'],
    arranger_name: ['Arranger Y', 'Arranger Z'],
  },
  {
    id: 3,
    name: 'Stueck Three',
    genre: 'Pop',
    jahr: 2010,
    schwierigkeit: 'Low',
    isdigitalisiert: true,
    composer_name: ['Composer D'],
    arranger_name: ['Arranger W'],
  }
  // Add more stueck objects as needed
]);

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

    // If you need to fetch data on mount:
    onMounted(() => {
      // fetchStueckData(); // Implement data fetching logic here if needed
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
