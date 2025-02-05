import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import StueckManagement from './components/StueckManagement.js';
import UserManagement from './components/UserManagement.js';
import Login from './components/Login.js';
import UserForm from './components/UserForm.js';
import TableManagement from './components/TableManagement.js';
import SuggestionsInput from './components/SuggestionsInput.js';
import PopupMessage from './components/PopupMessage.js';
import GeneralModal from './components/GeneralModal.js';
import PersonManagement from './components/PersonManagement.js';

const app = createApp({
    components: {
        StueckManagement,
        PersonManagement,
        UserManagement,
        Login,
        UserForm,
        TableManagement,
        SuggestionsInput,
        PopupMessage,
        GeneralModal
    }
});

app.mount('#app');
