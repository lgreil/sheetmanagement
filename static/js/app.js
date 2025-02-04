Vue.component('stueck-management', {
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
            composers: [],
            arrangers: [],
            searchQuery: '',
            showModal: false,
            modalContent: ''
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
                .then(data => this.stuecke = data)
                .catch(error => console.error("Error:", error));
        },
        fetchPersonList() {
            fetch("/api/person")
                .then(response => response.json())
                .then(data => {
                    this.composers = data;
                    this.arrangers = data;
                })
                .catch(error => console.error("Error:", error));
        },
        addStueck() {
            const composerId = this.composers.find(person => person.name === this.newStueck.composer_name)?.pid;
            const arrangerId = this.arrangers.find(person => person.name === this.newStueck.arranger_name)?.pid;

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
                    alert('Stück added successfully!');
                    this.fetchStuecke();
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
                .catch(error => console.error('Error:', error));
        },
        editStueck(stid) {
            fetch(`/api/stueck/${stid}`)
                .then(response => response.json())
                .then(stueck => {
                    this.showModal = true;
                    this.modalContent = this.createEditStueckModal(stueck);
                })
                .catch(error => console.error("Error fetching Stueck details:", error));
        },
        deleteStueck(stid) {
            fetch(`/api/stueck`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stid })
            })
                .then(response => response.json())
                .then(() => this.fetchStuecke())
                .catch(error => console.error("Error:", error));
        },
        handleJsonImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const jsonData = JSON.parse(e.target.result);
                this.importMultipleStuecke(jsonData);
            };
            reader.readAsText(file);
        },
        importMultipleStuecke(jsonData) {
            const stueckePromises = jsonData.map(stueck => {
                return new Promise((resolve, reject) => {
                    handlePersonIds(stueck.composer_name, stueck.arranger_name, (composerIds, arrangerIds) => {
                        const newStueck = {
                            name: stueck.name,
                            genre: stueck.genre,
                            jahr: stueck.jahr,
                            schwierigkeit: stueck.schwierigkeit,
                            isdigitalisiert: stueck.isdigitalisiert,
                            composer_ids: composerIds,
                            arranger_ids: arrangerIds
                        };
                        resolve(newStueck);
                    });
                });
            });

            Promise.all(stueckePromises)
                .then(stuecke => {
                    fetch('/api/stueck', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(stuecke)
                    })
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            }
                            return response.json().then(err => { throw new Error(err.message); });
                        })
                        .then(() => {
                            alert('Stücke added successfully!');
                            this.fetchStuecke(); // Refresh the table
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert(`Error adding Stücke: ${error.message}`);
                        });
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert(`Error processing Stücke: ${error.message}`);
                });
        },
        handleTsvImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const rows = text.split('\n').map(row => row.split('\t'));

                rows.forEach(row => {
                    const [name, genre, jahr, schwierigkeit, isdigitalisiert, composer_name, arranger_name] = row;
                    handlePersonIds(composer_name, arranger_name, (composerId, arrangerId) => {
                        this.addNewStueckFromTSV(name, genre, jahr, schwierigkeit, isdigitalisiert, composerId, arrangerId);
                    });
                });
            };
            reader.readAsText(file);
        },
        addNewStueckFromTSV(name, genre, jahr, schwierigkeit, isdigitalisiert, composerId, arrangerId) {
            const newStueck = {
                name: name,
                genre: genre,
                jahr: parseInt(jahr),
                schwierigkeit: schwierigkeit,
                isdigitalisiert: isdigitalisiert.toLowerCase() === 'true',
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
                    return response.json().then(err => { throw new Error(err.message); });
                })
                .then(() => {
                    console.log('Stück added successfully!');
                    this.fetchStuecke(); // Refresh the table
                })
                .catch(error => console.error('Error:', error));
        },
        searchTable() {
            const filter = this.searchQuery.toLowerCase();
            return this.stuecke.filter(stueck => {
                return Object.values(stueck).some(value =>
                    String(value).toLowerCase().includes(filter)
                );
            });
        },
        populateStueckRow(stueck) {
            const schwierigkeitClass = stueck.schwierigkeit === 'Einfach' ? 'easy' :
                stueck.schwierigkeit === 'Mittel' ? 'medium' : 'hard';

            return `
                <tr>
                    <td style="display:none;">${stueck.stid}</td>
                    <td>${stueck.name}</td>
                    <td>
                        <div class="schwierigkeit-bar ${schwierigkeitClass}">
                            <div class="fill"></div>
                        </div>
                    </td>
                    <td>${stueck.genre}</td>
                    <td class="digitalisiert-checkbox">
                        <input type="checkbox" ${stueck.isdigitalisiert ? 'checked' : ''} disabled>
                    </td>
                    <td>${stueck.jahr}</td>
                    <td>${stueck.composer_name || ''}</td>
                    <td>${stueck.arranger_name || ''}</td>
                    <td class="text-center">
                        <button class="btn-edit" @click="editStueck(${stueck.stid})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" @click="deleteStueck(${stueck.stid})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        },
        createEditStueckModal(stueck) {
            return `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Stueck</h5>
                            <button type="button" class="btn-close" @click="closeModal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-stueck-form">
                                <div class="mb-3">
                                    <label for="edit-name" class="form-label">Name</label>
                                    <input type="text" class="form-control" id="edit-name" name="name" value="${stueck.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-genre" class="form-label">Genre</label>
                                    <input type="text" class="form-control" id="edit-genre" name="genre" value="${stueck.genre}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-jahr" class="form-label">Jahr</label>
                                    <input type="number" class="form-control" id="edit-jahr" name="jahr" value="${stueck.jahr}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-schwierigkeit" class="form-label">Schwierigkeit</label>
                                    <select class="form-control" id="edit-schwierigkeit" name="schwierigkeit">
                                        <option value="Einfach" ${stueck.schwierigkeit === 'Einfach' ? 'selected' : ''}>Einfach</option>
                                        <option value="Mittel" ${stueck.schwierigkeit === 'Mittel' ? 'selected' : ''}>Mittel</option>
                                        <option value="Schwer" ${stueck.schwierigkeit === 'Schwer' ? 'selected' : ''}>Schwer</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-isdigitalisiert" class="form-label">Digitalisiert</label>
                                    <input type="checkbox" class="form-check-input" id="edit-isdigitalisiert" name="isdigitalisiert" ${stueck.isdigitalisiert ? 'checked' : ''}>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-composer_name" class="form-label">Composer</label>
                                    <input type="text" class="form-control" id="edit-composer_name" name="composer_name" list="composer-list" value="${stueck.composer_name || ''}">
                                    <button type="button" class="btn btn-link" @click="openAddPersonModal">Add New Composer</button>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-arranger_name" class="form-label">Arranger</label>
                                    <input type="text" class="form-control" id="edit-arranger_name" name="arranger_name" list="arranger-list" value="${stueck.arranger_name || ''}">
                                    <button type="button" class="btn btn-link" @click="openAddPersonModal">Add New Arranger</button>
                                </div>
                                <button type="submit" class="btn btn-primary">Save changes</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        },
        closeModal() {
            this.showModal = false;
            this.modalContent = '';
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Manage Stueck</h2>
                <div>
                    <button class="btn btn-primary me-2" @click="addStueck">Add New Stueck</button>
                    <button class="btn btn-secondary" @click="fetchStuecke">Refresh</button>
                    <button class="btn btn-info" @click="document.getElementById('jsonInput').click()">Import JSON</button>
                    <input type="file" id="jsonInput" accept=".json" @change="handleJsonImport" style="display: none;">
                    <button class="btn btn-info" @click="document.getElementById('tsvInput').click()">Import TSV</button>
                    <input type="file" id="tsvInput" accept=".tsv" @change="handleTsvImport" style="display: none;">
                </div>
            </div>
            <input type="text" class="form-control mb-3" v-model="searchQuery" placeholder="Search for Stueck..">
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Schwierigkeit</th>
                        <th>Genre</th>
                        <th>Digitalisiert</th>
                        <th>Jahr</th>
                        <th>Composer</th>
                        <th>Arranger</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="stueck in searchTable()" :key="stueck.stid" v-html="populateStueckRow(stueck)"></tr>
                </tbody>
            </table>
            <div v-if="showModal" class="modal" style="display: block;">
                <div v-html="modalContent"></div>
            </div>
        </div>
    `
});

Vue.component('person-management', {
    data() {
        return {
            persons: [],
            newPerson: {
                vorname: '',
                name: ''
            },
            searchQuery: '',
            showModal: false,
            modalContent: ''
        };
    },
    mounted() {
        this.fetchPersons();
    },
    methods: {
        fetchPersons() {
            fetch("/api/person")
                .then(response => response.json())
                .then(data => this.persons = data)
                .catch(error => console.error("Error:", error));
        },
        addPerson() {
            fetch('/api/person', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.newPerson)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Failed to add Person');
                })
                .then(() => {
                    alert('Person added successfully!');
                    this.fetchPersons();
                    this.newPerson = { vorname: '', name: '' };
                })
                .catch(error => console.error('Error:', error));
        },
        editPerson(pid) {
            fetch(`/api/person/${pid}`)
                .then(response => response.json())
                .then(person => {
                    this.showModal = true;
                    this.modalContent = this.createEditPersonModal(person);
                })
                .catch(error => console.error("Error fetching Person details:", error));
        },
        deletePerson(pid) {
            fetch(`/api/person`, {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid: pid })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message === "Cannot delete person, they are still used in another table.") {
                        alert(data.message);
                    } else {
                        this.fetchPersons();
                    }
                })
                .catch(error => console.error("Error:", error));
        },
        searchTable() {
            const filter = this.searchQuery.toLowerCase();
            return this.persons.filter(person => {
                return Object.values(person).some(value =>
                    String(value).toLowerCase().includes(filter)
                );
            });
        },
        populatePersonRow(person) {
            return `
                <tr>
                    <td style="display:none;">${person.pid}</td>
                    <td>${person.vorname}</td>
                    <td>${person.name}</td>
                    <td>${person.appearances}</td>
                    <td class="text-center">
                        <button class="btn-edit" @click="editPerson(${person.pid})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" @click="deletePerson(${person.pid})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        },
        createEditPersonModal(person) {
            return `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Person</h5>
                            <button type="button" class="btn-close" @click="closeModal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-person-form">
                                <div class="mb-3">
                                    <label for="edit-person-vorname" class="form-label">Vorname</label>
                                    <input type="text" class="form-control" id="edit-person-vorname" name="vorname" value="${person.vorname}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-person-name" class="form-label">Name</label>
                                    <input type="text" class="form-control" id="edit-person-name" name="name" value="${person.name}" required>
                                </div>
                                <button type="submit" class="btn btn-primary">Save changes</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        },
        closeModal() {
            this.showModal = false;
            this.modalContent = '';
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
            <input type="text" class="form-control mb-3" v-model="searchQuery" placeholder="Search for Person..">
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Vorname</th>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="person in searchTable()" :key="person.pid" v-html="populatePersonRow(person)"></tr>
                </tbody>
            </table>
            <div v-if="showModal" class="modal" style="display: block;">
                <div v-html="modalContent"></div>
            </div>
        </div>
    `
});

Vue.component('schrank-management', {
    data() {
        return {
            schraenke: [],
            newSchrank: {
                name: ''
            },
            searchQuery: ''
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
                    alert('Schrank added successfully!');
                    this.fetchSchraenke();
                    this.newSchrank = { name: '' };
                })
                .catch(error => console.error('Error:', error));
        },
        searchTable() {
            const filter = this.searchQuery.toLowerCase();
            return this.schraenke.filter(schrank => {
                return Object.values(schrank).some(value =>
                    String(value).toLowerCase().includes(filter)
                );
            });
        },
        populateSchrankRow(schrank) {
            return `
                <tr>
                    <td>${schrank.name}</td>
                    <td class="text-center">
                        <button class="btn-edit" @click="editSchrank(${schrank.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" @click="deleteSchrank(${schrank.id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
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
            <input type="text" class="form-control mb-3" v-model="searchQuery" placeholder="Search for Schrank..">
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="schrank in searchTable()" :key="schrank.id" v-html="populateSchrankRow(schrank)"></tr>
                </tbody>
            </table>
        </div>
    `
});

Vue.config.productionTip = false;

new Vue({
    el: '#app'
});
