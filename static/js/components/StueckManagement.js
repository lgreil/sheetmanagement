// stueck-management.js
const StueckManagement = {
    data() {
        return {
            stuecke: [],
            newStueck: {
                name: '',
                genre: '',
                jahr: '',
                schwierigkeit: '',
                isdigitalisiert: false,
                composer_name: '',
                arranger_name: ''
            },
            editStueck: null,
            composers: [],
            arrangers: [],
            showAddModal: false,
            showEditModal: false,
            suggestions: [],
            searchSuggestions: [],
            searchQuery: ''
        };
    },
    mounted() {
        this.fetchStuecke();
        this.fetchPersonList();
    },
    methods: {
        fetchStuecke() {
            fetch("/api/stueck")
                .then(response => response.json())
                .then(data => {
                    console.log('Fetched Stuecke:', data); // Debugging log
                    this.stuecke = data.map(stueck => ({
                        ...stueck,
                        composer_names: stueck.composers.join('\n'),
                        arranger_names: stueck.arrangers.join('\n')
                    }));
                })
                .catch(error => {
                    console.error("Error fetching stuecke:", error);
                    this.$refs.popup.showMessage('Error fetching stuecke', 'danger');
                });
        },
        fetchPersonList() {
            fetch("/api/person")
                .then(response => response.json())
                .then(data => {
                    console.log('Fetched Persons:', data); // Debugging log
                    this.composers = data;
                    this.arrangers = data;
                })
                .catch(error => {
                    console.error("Error fetching person list:", error);
                    this.$refs.popup.showMessage('Error fetching person list', 'danger');
                });
        },
        addStueck() {
            this.showAddModal = true;
        },
        saveStueck() {
            const composerId = this.composers.find(person => person.name.toLowerCase() === this.newStueck.composer_name.toLowerCase())?.pid;
            const arrangerId = this.arrangers.find(person => person.name.toLowerCase() === this.newStueck.arranger_name.toLowerCase())?.pid;

            const newStueck = {
                ...this.newStueck,
                composer_id: composerId,
                arranger_id: arrangerId
            };

            fetch('/api/stueck', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStueck)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Failed to add Stück');
                })
                .then(() => {
                    this.$refs.popup.showMessage('Stück added successfully!');
                    this.fetchStuecke();
                    this.showAddModal = false;
                    this.newStueck = {
                        name: '',
                        genre: '',
                        jahr: '',
                        schwierigkeit: '',
                        isdigitalisiert: false,
                        composer_name: '',
                        arranger_name: ''
                    };
                })
                .catch(error => {
                    console.error('Error adding stueck:', error);
                    this.$refs.popup.showMessage('Error adding stueck', 'danger');
                });
        },
        editStueck(stueck) {
            console.log('Editing Stück:', stueck); // Debugging log
            if (stueck) {
                this.editStueck = { ...stueck };
                this.showEditModal = true;
                console.log('Edit modal opened:', this.editStueck); // Debugging log
            } else {
                console.error('editStueck: stueck is null or undefined');
                this.$refs.popup.showMessage('Error editing stueck', 'danger');
            }
        },
        updateStueck() {
            console.log('Updating Stück:', this.editStueck); // Debugging log
            const composerId = this.composers.find(person => person.name.toLowerCase() === this.editStueck.composer_name.toLowerCase())?.pid;
            const arrangerId = this.arrangers.find(person => person.name.toLowerCase() === this.editStueck.arranger_name.toLowerCase())?.pid;

            const updatedStueck = {
                ...this.editStueck,
                composer_id: composerId,
                arranger_id: arrangerId
            };

            fetch(`/api/stueck/${this.editStueck.stid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedStueck)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Failed to update Stück');
                })
                .then(() => {
                    this.$refs.popup.showMessage('Stück updated successfully!');
                    this.fetchStuecke();
                    this.showEditModal = false;
                    this.editStueck = null;
                })
                .catch(error => {
                    console.error('Error updating stueck:', error);
                    this.$refs.popup.showMessage('Error updating stueck', 'danger');
                });
        },
        deleteStueck(stueckId) {
            fetch(`/api/stueck/${stueckId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (response.ok) {
                        this.$refs.popup.showMessage('Stueck deleted successfully!');
                        this.fetchStuecke();
                    } else {
                        throw new Error('Failed to delete Stück');
                    }
                })
                .catch(error => {
                    console.error('Error deleting stueck:', error);
                    this.$refs.popup.showMessage('Error deleting stueck', 'danger');
                });
        },
        suggest(input, field) {
            if (input.length > 1) {
                if (field === 'composer_name' || field === 'arranger_name') {
                    this.suggestions = this.composers.filter(person =>
                        person.name.toLowerCase().includes(input.toLowerCase())
                    ).map(person => person.name);
                } else if (field === 'genre') {
                    const genres = this.stuecke.map(stueck => stueck.genre);
                    this.suggestions = [...new Set(genres.filter(genre =>
                        genre.toLowerCase().includes(input.toLowerCase())
                    ))];
                } else if (field === 'search') {
                    const allValues = this.stuecke.flatMap(stueck => Object.values(stueck));
                    this.searchSuggestions = [...new Set(allValues.filter(value =>
                        String(value).toLowerCase().includes(input.toLowerCase())
                    ))];
                }
            } else {
                this.suggestions = [];
                this.searchSuggestions = [];
            }
        },
        selectSuggestion(suggestion, field) {
            if (field === 'composer_name') {
                this.newStueck.composer_name = suggestion;
            } else if (field === 'arranger_name') {
                this.newStueck.arranger_name = suggestion;
            } else if (field === 'genre') {
                this.newStueck.genre = suggestion;
            }
            this.suggestions = [];
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Manage Stueck</h2>
                <div>
                    <button class="btn btn-primary me-2" @click="addStueck">Add New Stueck</button>
                    <button class="btn btn-secondary" @click="fetchStuecke">Refresh</button>
                </div>
            </div>
            <suggestions-input 
                v-model="searchQuery" 
                :items="stuecke" 
                field="search" 
                placeholder="Search for Stueck...">
            </suggestions-input>
            <table-management 
                :items="stuecke" 
                :columns="[
                    { key: 'name', label: 'Name' },
                    { key: 'schwierigkeit', label: 'Schwierigkeit' },
                    { key: 'genre', label: 'Genre' },
                    { key: 'isdigitalisiert', label: 'Digitalisiert' },
                    { key: 'jahr', label: 'Jahr' },
                    { key: 'composer_names', label: 'Composers' },
                    { key: 'arranger_names', label: 'Arrangers' }
                ]" 
                :search-placeholder="searchQuery" 
                :actions="true"
                @edit="editStueck"
                @delete="deleteStueck">
                <template v-slot:schwierigkeit="{ item }">
                    <div class="schwierigkeit-bar" :class="{
                        'easy': item.schwierigkeit === 'Einfach',
                        'medium': item.schwierigkeit === 'Mittel',
                        'hard': item.schwierigkeit === 'Schwer'
                    }">
                        <div class="fill"></div>
                    </div>
                </template>
                <template v-slot:isdigitalisiert="{ item }">
                    <div class="digitalisiert-indicator" :class="{'digital': item.isdigitalisiert}">
                        <i :class="item.isdigitalisiert === true ? 'fa fa-check-circle' : item.isdigitalisiert === false ? 'fa fa-times-circle' : 'fa fa-question-circle'"></i>
                        {{ item.isdigitalisiert === true ? 'Yes' : item.isdigitalisiert === false ? 'No' : '? Unknown' }}
                    </div>
                </template>
                <template v-slot:actions="{ item }">
                    <div class="btn-group">
                        <button class="btn btn-warning" @click="editStueck(item)">Edit</button>
                        <button class="btn btn-danger" @click="deleteStueck(item.stid)">Delete</button>
                    </div>
                </template>
            </table-management>
            <stueck-modal 
                v-if="showAddModal" 
                @close="showAddModal = false" 
                @submit="saveStueck" 
                :stueck="newStueck" 
                :composers="composers" 
                :arrangers="arrangers" 
                :stuecke="stuecke" 
                title="Add New Stueck">
            </stueck-modal>
            <stueck-modal 
                v-if="showEditModal" 
                @close="showEditModal = false" 
                @submit="updateStueck" 
                :stueck="editStueck" 
                :composers="composers" 
                :arrangers="arrangers" 
                :stuecke="stuecke" 
                title="Edit Stueck">
            </stueck-modal>
            <popup-message ref="popup"></popup-message>
        </div>
    `
};

export default StueckManagement;
