import { defineComponent } from 'https://unpkg.com/vue@3.2.31/dist/vue.esm-browser.js';
import TableManagement from './TableManagement.js';
import PopupMessage from './PopupMessage.js';
import PersonForm from './PersonForm.js';
import SuggestionsInput from './SuggestionsInput.js'; // Import SuggestionsInput
const PersonManagement = defineComponent({
    components: {
        TableManagement,
        PersonForm,
        PopupMessage
    },
    data() {
        return {
            persons: [],
            newPerson: {
                vorname: '',
                name: ''
            }
        };
    },
    mounted() {
        this.fetchPersons();
    },
    methods: {
        fetchPersons() {
            fetch("/api/person")
                .then(response => response.json())
                .then(data => {
                    console.log('Fetched Persons:', data); // Debugging log
                    this.persons = data.map(person => ({
                        ...person,
                        appearances: person.appearances
                    }));
                })
                .catch(error => {
                    console.error("Error:", error);
                    this.$refs.popup.showMessage('Error fetching persons', 'danger');
                });
        },
        addPerson() {
            this.$refs.personForm.openForm('Add New Person', {}, this.savePerson);
        },
        savePerson(person) {
            fetch('/api/person', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(person)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Failed to add Person');
                })
                .then(() => {
                    this.$refs.popup.showMessage('Person added successfully!');
                    this.fetchPersons();
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.$refs.popup.showMessage('Error adding person', 'danger');
                });
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Manage Person</h2>
                <div>
                    <button class="btn btn-primary me-2" @click="addPerson">Add New Person</button>
                    <button class="btn btn-secondary" @click="fetchPersons">Refresh</button>
                </div>
            </div>
            <table-management :items="persons" :columns="[
                { key: 'vorname', label: 'Vorname' },
                { key: 'name', label: 'Name' },
                { key: 'appearances', label: 'Appearances' }
            ]" search-placeholder="Search for Person..." :actions="true">
                <template v-slot:actions="{ item }">
                    <button class="btn btn-warning">Edit</button>
                    <button class="btn btn-danger">Delete</button>
                </template>
            </table-management>
            <popup-message ref="popup"></popup-message>
            <person-form ref="personForm"></person-form>
        </div>
    `
});

export default PersonManagement;
