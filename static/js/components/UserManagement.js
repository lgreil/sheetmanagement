import { createApp } from 'https://unpkg.com/vue@3.2.31/dist/vue.esm-browser.js';

const UserManagement = {
    data() {
        return {
            users: [],
            newUser: {
                username: '',
                password: '',
                is_admin: false
            },
            showModal: false,
            userIdToReset: null,
            newPassword: ''
        };
    },
    mounted() {
        this.fetchUsers();
    },
    methods: {
        fetchUsers() {
            fetch('/api/admin/users')
                .then(response => response.json())
                .then(data => {
                    console.log('Fetched Users:', data);
                    this.users = data;
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.$refs.popup.showMessage('Error fetching users', 'danger');
                });
        },
        addUser() {
            this.$refs.userForm.openForm('Add New User', {}, this.saveUser);
        },
        saveUser(user) {
            fetch('/api/admin/users/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.users.push(data.user);
                        this.$refs.popup.showMessage('User added successfully!');
                    } else {
                        this.$refs.popup.showMessage('Failed to add user', 'danger');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.$refs.popup.showMessage('Error adding user', 'danger');
                });
        },
        deleteUser(userId) {
            fetch(`/api/admin/users/delete/${userId}`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.users = this.users.filter(user => user.uid !== userId);
                    this.$refs.popup.showMessage('User deleted successfully!');
                } else {
                    this.$refs.popup.showMessage('Failed to delete user', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.$refs.popup.showMessage('Error deleting user', 'danger');
            });
        },
        openResetPasswordModal(userId) {
            this.userIdToReset = userId;
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.userIdToReset = null;
            this.newPassword = '';
        },
        resetPassword() {
            fetch(`/api/admin/users/reset_password/${this.userIdToReset}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ new_password: this.newPassword })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.closeModal();
                    this.$refs.popup.showMessage('Password reset successfully!');
                } else {
                    this.$refs.popup.showMessage('Failed to reset password', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.$refs.popup.showMessage('Error resetting password', 'danger');
            });
        },
        updateRights(userId) {
            const user = this.users.find(user => user.uid === userId);
            fetch(`/api/admin/users/update_rights/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_admin: user.is_admin })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    this.$refs.popup.showMessage('Failed to update rights', 'danger');
                } else {
                    this.$refs.popup.showMessage('User rights updated successfully!');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.$refs.popup.showMessage('Error updating rights', 'danger');
            });
        }
    },
    template: `
        <div>
            <h2>User Management</h2>
            <button class="btn btn-primary mb-4" @click="addUser">Add New User</button>
            <table-management :items="users" :columns="[
                { key: 'username', label: 'Username' },
                { key: 'is_admin', label: 'Admin' }
            ]" search-placeholder="Search for users..." :actions="true">
                <template v-slot:actions="{ item }">
                    <button class="btn btn-danger" @click="deleteUser(item.uid)">Delete</button>
                    <button class="btn btn-warning" @click="openResetPasswordModal(item.uid)">Reset Password</button>
                    <form @submit.prevent="updateRights(item.uid)" style="display:inline;">
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" v-model="item.is_admin" :id="'is_admin_' + item.uid">
                            <label class="form-check-label" :for="'is_admin_' + item.uid">Admin</label>
                        </div>
                        <button type="submit" class="btn btn-info">Update Rights</button>
                    </form>
                </template>
            </table-management>

            <!-- Reset Password Modal -->
            <div v-if="showModal" class="modal" style="display: block;">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Reset Password</h5>
                            <button type="button" class="btn-close" @click="closeModal"></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="resetPassword">
                                <div class="mb-3">
                                    <label for="new_password" class="form-label">New Password</label>
                                    <input type="password" class="form-control" v-model="newPassword" required>
                                </div>
                                <button type="submit" class="btn btn-success">Reset Password</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <popup-message ref="popup"></popup-message>
            <user-form ref="userForm"></user-form>
        </div>
    `
};

export default UserManagement;

createApp(UserManagement).mount('#user-management-app');
