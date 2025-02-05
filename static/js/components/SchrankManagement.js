import { defineComponent } from 'https://unpkg.com/vue@3.2.31/dist/vue.esm-browser.js';

const SchrankManagement = defineComponent({
    data() {
        return {
            schraenke: [],
            newSchrank: {
                name: ''
            }
        };
    },
    mounted() {
        this.fetchSchraenke();
    },
    methods: {
        fetchSchraenke() {
            fetch("/api/schrank")
                .then(response => response.json())
                .then(data => this.schraenke = data)
                .catch(error => console.error("Error:", error));
        },
        addSchrank() {
            fetch('/api/schrank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.newSchrank)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Failed to add Schrank');
                })
                .then(() => {
                    this.$refs.popupMessage.show('Schrank added successfully!');
                    this.fetchSchraenke();
                    this.newSchrank = { name: '' };
                })
                .catch(error => console.error('Error:', error));
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Manage Schrank</h2>
                <div>
                    <button class="btn btn-primary me-2" @click="addSchrank">Add New Schrank</button>
                    <button class="btn btn-secondary" @click="fetchSchraenke">Refresh</button>
                </div>
            </div>
            <table-management :items="schraenke" :columns="[
                { key: 'name', label: 'Name' },
                { key: 'actions', label: 'Actions' }
            ]" search-placeholder="Search for Schrank...">
                <template v-slot:actions="{ item }">
                    <button class="btn btn-warning">Edit</button>
                    <button class="btn btn-danger">Delete</button>
                </template>
            </table-management>
            <popup-message ref="popupMessage"></popup-message>
        </div>
    `
});

export default SchrankManagement;
