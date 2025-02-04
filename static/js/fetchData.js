// Fetch and populate Stueck table
function fetchStueck() {
    fetch("/api/stueck")
        .then(response => response.json())
        .then(data => populateTable(data, 'stueck-table-body', populateStueckRow))
        .catch(error => console.error("Error:", error));
}

// Fetch and populate Person table
function fetchPerson() {
    fetch("/api/person")
        .then(response => response.json())
        .then(data => populateTable(data, 'person-table-body', populatePersonRow))
        .catch(error => console.error("Error:", error));
}

// Fetch and populate composer and arranger lists
function fetchPersonList() {
    fetch("/api/person")
        .then(response => response.json())
        .then(data => populatePersonLists(data))
        .catch(error => console.error("Error:", error));
}