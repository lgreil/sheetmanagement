import { defineComponent } from 'https://unpkg.com/vue@3.2.31/dist/vue.esm-browser.js';

const SuggestionsInput = defineComponent({
    props: ['value', 'items', 'field', 'placeholder'],
    data() {
        return {
            suggestions: []
        };
    },
    methods: {
        selectSuggestion(suggestion) {
            this.$emit('update:value', suggestion);
            this.$emit('select-suggestion', suggestion, this.field);
            this.suggestions = [];
        },
        suggest(input) {
            if (input.length > 1) {
                let valuesToFilter = [];
                if (this.field === 'composer_name' || this.field === 'arranger_name') {
                    valuesToFilter = this.items.map(person => person.name);
                } else if (this.field === 'genre') {
                    valuesToFilter = this.items.map(stueck => stueck.genre);
                } else if (this.field === 'search') {
                    valuesToFilter = this.items.flatMap(stueck => Object.values(stueck));
                }
                this.suggestions = [...new Set(valuesToFilter.filter(value =>
                    String(value).toLowerCase().includes(input.toLowerCase())
                ))];
            } else {
                this.suggestions = [];
            }
        }
    },
    template: `
        <div class="suggestions-input">
            <input type="text" :value="value" @input="suggest($event.target.value); $emit('update:value', $event.target.value)" :placeholder="placeholder">
            <ul v-if="suggestions.length" class="suggestions-list">
                <li v-for="suggestion in suggestions" @click="selectSuggestion(suggestion)">{{ suggestion }}</li>
            </ul>
        </div>
    `
});

export default SuggestionsInput;
