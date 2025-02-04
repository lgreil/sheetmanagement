const Login = {
    data() {
        return {
            username: '',
            password: '',
            error: false
        };
    },
    methods: {
        login() {
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: this.username,
                    password: this.password
                })
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    this.error = true;
                    setTimeout(() => {
                        this.error = false;
                    }, 3000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.error = true;
                setTimeout(() => {
                    this.error = false;
                }, 3000);
            });
        }
    },
    template: `
        <div class="login-container">
            <div class="login-box">
                <h2>Login</h2>
                <form @submit.prevent="login">
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" class="form-control" id="username" v-model="username" required>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control" id="password" v-model="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
            </div>
            <div v-if="error" class="popup-feedback">
                Invalid username or password
            </div>
        </div>
    `
};

export default Login;
