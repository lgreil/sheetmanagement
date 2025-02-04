const PopupMessage = {
    data() {
        return {
            message: '',
            type: 'success',
            visible: false
        };
    },
    methods: {
        showMessage(message, type = 'success') {
            this.message = message;
            this.type = type;
            this.visible = true;
            setTimeout(() => {
                this.visible = false;
            }, 3000);
        }
    },
    template: `
        <div v-if="visible" :class="['alert', 'alert-' + type]" role="alert" style="position: fixed; bottom: 10px; right: 10px;">
            {{ message }}
        </div>
    `
};

export default PopupMessage;
