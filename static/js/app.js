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
            arrangers: []
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
            <input type="text" class="form-control mb-3" placeholder="Search for Stueck..">
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
                    <tr v-for="stueck in stuecke" :key="stueck.stid">
                        <td>{{ stueck.name }}</td>
                        <td>{{ stueck.schwierigkeit }}</td>
                        <td>{{ stueck.genre }}</td>
                        <td>{{ stueck.isdigitalisiert ? 'Yes' : 'No' }}</td>
                        <td>{{ stueck.jahr }}</td>
                        <td>{{ stueck.composer_name }}</td>
                        <td>{{ stueck.arranger_name }}</td>
                        <td>
                            <button class="btn btn-warning">Edit</button>
                            <button class="btn btn-danger">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
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
            <input type="text" class="form-control mb-3" placeholder="Search for Person..">
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Vorname</th>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="person in persons" :key="person.pid">
                        <td>{{ person.vorname }}</td>
                        <td>{{ person.name }}</td>
                        <td>
                            <button class="btn btn-warning">Edit</button>
                            <button class="btn btn-danger">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
});

Vue.component('schrank-management', {
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
                    alert('Schrank added successfully!');
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
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="schrank in schraenke" :key="schrank.id">
                        <td>{{ schrank.name }}</td>
                        <td>
                            <button class="btn btn-warning">Edit</button>
                            <button class="btn btn-danger">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
});

Vue.config.productionTip = false;

new Vue({
    el: '#app'
});
