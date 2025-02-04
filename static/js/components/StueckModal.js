const StueckModal = {
    props: ['stueck', 'title', 'composers', 'arrangers', 'stuecke'],
    methods: {
        submit() {
            this.$emit('submit');
        },
        close() {
            this.$emit('close');
        },
        selectSuggestion(suggestion, field) {
            if (field === 'composer_name') {
                this.stueck.composer_name = suggestion;
            } else if (field === 'arranger_name') {
                this.stueck.arranger_name = suggestion;
            } else if (field === 'genre') {
                this.stueck.genre = suggestion;
            }
        }
    },
    template: `
        <general-modal 
            :title="title" 
            submit-text="Save" 
            @submit="submit" 
            @close="close">
            <form @submit.prevent="submit">
                <div class="mb-3">
                    <label for="name" class="form-label">Name</label>
                    <input type="text" class="form-control" id="name" v-model="stueck.name" required>
                </div>
                <div class="mb-3">
                    <label for="genre" class="form-label">Genre</label>
                    <suggestions-input 
                        v-model="stueck.genre" 
                        :items="stuecke" 
                        field="genre" 
                        placeholder="Genre"
                        @select-suggestion="selectSuggestion">
                    </suggestions-input>
                </div>
                <div class="mb-3">
                    <label for="jahr" class="form-label">Jahr</label>
                    <input type="number" class="form-control" id="jahr" v-model="stueck.jahr">
                </div>
                <div class="mb-3">
                    <label for="schwierigkeit" class="form-label">Schwierigkeit</label>
                    <input type="text" class="form-control" id="schwierigkeit" v-model="stueck.schwierigkeit">
                </div>
                <div class="mb-3">
                    <label for="isdigitalisiert" class="form-label">Digitalisiert</label>
                    <input type="checkbox" id="isdigitalisiert" v-model="stueck.isdigitalisiert">
                </div>
                <div class="mb-3">
                    <label for="composer_name" class="form-label">Composer</label>
                    <suggestions-input 
                        v-model="stueck.composer_name" 
                        :items="composers" 
                        field="composer_name" 
                        placeholder="Composer"
                        @select-suggestion="selectSuggestion">
                    </suggestions-input>
                </div>
                <div class="mb-3">
                    <label for="arranger_name" class="form-label">Arranger</label>
                    <suggestions-input 
                        v-model="stueck.arranger_name" 
                        :items="arrangers" 
                        field="arranger_name" 
                        placeholder="Arranger"
                        @select-suggestion="selectSuggestion">
                    </suggestions-input>
                </div>
            </form>
        </general-modal>
    `
};

export default StueckModal;
