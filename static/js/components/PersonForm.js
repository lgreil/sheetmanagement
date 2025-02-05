import { defineComponent } from 'https://unpkg.com/vue@3.2.31/dist/vue.esm-browser.js';

const PersonForm = defineComponent({
    data() {
        return {
            title: '',
            person: {
                vorname: '',
                name: ''
            },
            callback: null
        };
    },
    methods: {
        openForm(title, person, callback) {
            this.title = title;
            this.person = { ...person };
            this.callback = callback;
            this.$refs.modal.show();
        },
        submitForm() {
            this.callback(this.person);
            this.$refs.modal.hide();
        }
    },
    template: `
        <modal ref="modal">
            <template #header>
                <h5>{{ title }}</h5>
            </template>
            <template #body>
                <div class="mb-3">
                    <label for="vorname" class="form-label">Vorname</label>
                    <input type="text" class="form-control" v-model="person.vorname" required>
                </div>
                <div class="mb-3">
                    <label for="name" class="form-label">Name</label>
                    <input type="text" class="form-control" v-model="person.name" required>
                </div>
            </template>
            <template #footer>
                <button class="btn btn-secondary" @click="$refs.modal.hide()">Cancel</button>
                <button class="btn btn-primary" @click="submitForm">Save</button>
            </template>
        </modal>
    `
});

export default PersonForm;
