import { defineComponent } from 'https://unpkg.com/vue@3.2.31/dist/vue.esm-browser.js';

const UserForm = defineComponent({
    data() {
        return {
            title: '',
            user: {
                username: '',
                password: '',
                is_admin: false
            },
            callback: null
        };
    },
    methods: {
        openForm(title, user, callback) {
            this.title = title;
            this.user = { ...user };
            this.callback = callback;
            this.$refs.modal.show();
        },
        submitForm() {
            this.callback(this.user);
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
                    <label for="username" class="form-label">Username</label>
                    <input type="text" class="form-control" v-model="user.username" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" v-model="user.password" required>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="user.is_admin" id="is_admin">
                    <label class="form-check-label" for="is_admin">Admin</label>
                </div>
            </template>
            <template #footer>
                <button class="btn btn-secondary" @click="$refs.modal.hide()">Cancel</button>
                <button class="btn btn-primary" @click="submitForm">Save</button>
            </template>
        </modal>
    `
});

export default UserForm;
