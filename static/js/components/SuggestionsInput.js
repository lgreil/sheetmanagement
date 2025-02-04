const SuggestionsInput = {
    props: ['value', 'items', 'field', 'placeholder'],
    data() {
        return {
            // Initialize an empty array for suggestions
            suggestions: []
        };
    },
    methods: {
        // Method to handle the selection of a suggestion
        selectSuggestion(suggestion) {
            // Emit the selected suggestion to the parent component
            this.$emit('update:value', suggestion);
            this.$emit('select-suggestion', suggestion, this.field);
            // Clear the suggestions list
            this.suggestions = [];
        },
        // Method to generate suggestions based on the input
        suggest(input) {
            // Check if the input length is greater than 1
            if (input.length > 1) {
                let valuesToFilter = [];
                // Determine the values to filter based on the field
                if (this.field === 'composer_name' || this.field === 'arranger_name') {
                    valuesToFilter = this.items.map(person => person.name);
                } else if (this.field === 'genre') {
                    valuesToFilter = this.items.map(stueck => stueck.genre);
                } else if (this.field === 'search') {
                    valuesToFilter = this.items.flatMap(stueck => Object.values(stueck));
                }
                // Filter and deduplicate the suggestions
                this.suggestions = [...new Set(valuesToFilter.filter(value =>
                    String(value).toLowerCase().includes(input.toLowerCase())
                ))];
            } else {
                // Clear the suggestions if input length is less than or equal to 1
                this.suggestions = [];
            }
        }
    },
    // Define the template for the component
    template: `
        <div class="suggestions-input">
            <!-- Input field for user to type in -->
            <input type="text" :value="value" @input="suggest($event.target.value); $emit('update:value', $event.target.value)" :placeholder="placeholder">
            <!-- Suggestions list -->
            <ul v-if="suggestions.length" class="suggestions-list">
                <li v-for="suggestion in suggestions" @click="selectSuggestion(suggestion)">{{ suggestion }}</li>
            </ul>
        </div>
    `
};

export default SuggestionsInput;
