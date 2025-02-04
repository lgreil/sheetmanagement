const TableManagement = {
    name: 'table-management', // Added name option
    props: ['items', 'columns', 'searchPlaceholder', 'actions'],
    data() {
        return {
            searchQuery: '',
            sortKey: '',
            sortAsc: true,
            searchSuggestions: []
        };
    },
    computed: {
        filteredItems() {
            console.log('Original Items:', this.items); // Debugging log
            let items = JSON.parse(JSON.stringify(this.items)).filter(item => {
                return Object.values(item).some(value =>
                    String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            });
            if (this.sortKey) {
                items.sort((a, b) => {
                    let result = (a[this.sortKey] < b[this.sortKey]) ? -1 : (a[this.sortKey] > b[this.sortKey]) ? 1 : 0;
                    return this.sortAsc ? result : -result;
                });
            }
            console.log('Filtered Items:', items); // Debugging log
            return items;
        }
    },
    methods: {
        sortTable(key) {
            this.sortAsc = (this.sortKey === key) ? !this.sortAsc : true;
            this.sortKey = key;
        },
        suggest(input) {
            if (input.length > 1) {
                const allValues = this.items.flatMap(item => Object.values(item));
                this.searchSuggestions = [...new Set(allValues.filter(value =>
                    String(value).toLowerCase().includes(input.toLowerCase())
                ))];
            } else {
                this.searchSuggestions = [];
            }
        },
        selectSuggestion(suggestion) {
            this.searchQuery = suggestion;
            this.searchSuggestions = [];
        }
    },
    mounted() {
        console.log('Columns:', this.columns); // Debugging log
        console.log('Items:', this.items); // Debugging log
        this.columns.forEach(column => {
            console.log('Column:', column); // Detailed column log
        });
        this.items.forEach(item => {
            console.log('Item:', item); // Detailed item log
        });
    },
    template: `
        <div class="table-management-container">
            <suggestions-input 
                v-model="searchQuery" 
                :items="items" 
                field="search" 
                :placeholder="searchPlaceholder" 
                @input="suggest"
                @select="selectSuggestion">
            </suggestions-input>
            <table class="table table-bordered table-hover table-striped">
                <thead class="table-dark">
                    <tr>
                        <th v-for="column in columns" @click="sortTable(column.key)" :key="column.key" class="sortable-column">
                            {{ column.label }}
                            <span v-if="sortKey === column.key">
                                <i :class="sortAsc ? 'fa fa-arrow-up' : 'fa fa-arrow-down'"></i>
                            </span>
                        </th>
                        <th v-if="actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in filteredItems" :key="item.id || item.uid || item.stid">
                        <td v-for="column in columns" :key="column.key" :class="{'pre-wrap': Array.isArray(item[column.key]) && item[column.key].length > 1}">
                            <slot :name="column.key" :item="item">
                                <span v-if="Array.isArray(item[column.key])">
                                    <div v-for="value in item[column.key]" :key="value">{{ value }}</div>
                                </span>
                                <span v-else>
                                    {{ item[column.key] }}
                                </span>
                            </slot>
                        </td>
                        <td v-if="actions">
                            <div class="btn-group">
                                <button class="btn btn-warning" @click="$emit('edit', item)">Edit</button>
                                <button class="btn btn-danger" @click="$emit('delete', item.id || item.uid || item.stid)">Delete</button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="filteredItems.length === 0">
                        <td :colspan="columns.length + (actions ? 1 : 0)" class="text-center">No data available</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
};

export default TableManagement;
