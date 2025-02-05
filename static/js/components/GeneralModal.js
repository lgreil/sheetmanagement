import { defineComponent } from 'https://unpkg.com/vue@3.2.31/dist/vue.esm-browser.js';

const GeneralModal = defineComponent({
    props: ['title', 'submitText'],
    methods: {
        submit() {
            this.$emit('submit');
        },
        close() {
            this.$emit('close');
        }
    },
    template: `
        <div class="modal fade show" tabindex="-1" style="display: block;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ title }}</h5>
                        <button type="button" class="btn-close" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <slot></slot>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
                        <button type="button" class="btn btn-primary" @click="submit">{{ submitText }}</button>
                    </div>
                </div>
            </div>
        </div>
    `
});

export default GeneralModal;
