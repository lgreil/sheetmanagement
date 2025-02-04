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

// Populate a table with data
function populateTable(data, tableBodyId, populateRowFunction) {
    const tableBody = document.getElementById(tableBodyId);
    tableBody.innerHTML = ''; // Clear the table
    data.forEach(item => {
        const row = populateRowFunction(item);
        tableBody.innerHTML += row;
    });
}

// Populate a row in the Stueck table
function populateStueckRow(stueck) {
    return `
        <tr>
            <td>${stueck.stid}</td>
            <td>${stueck.name}</td>
            <td>${stueck.schwierigkeit}</td>
            <td>${stueck.genre}</td>
            <td>${stueck.isdigitalisiert ? 'Yes' : 'No'}</td>
            <td>${stueck.jahr}</td>
            <td>${stueck.composer_id}</td>
            <td>${stueck.arranger_id}</td>
            <td>
                <button onclick="editStueck(${stueck.stid})">Edit</button>
                <button onclick="deleteStueck(${stueck.stid})">Delete</button>
            </td>
        </tr>
    `;
}

// Populate a row in the Person table
function populatePersonRow(person) {
    return `
        <tr>
            <td>${person.pid}</td>
            <td>${person.vorname}</td>
            <td>${person.name}</td>
            <td>
                <button onclick="editPerson(${person.pid})">Edit</button>
                <button onclick="deletePerson(${person.pid})">Delete</button>
            </td>
        </tr>
    `;
}

// Populate composer and arranger lists
function populatePersonLists(data) {
    const composerList = document.getElementById('composer-list');
    const arrangerList = document.getElementById('arranger-list');
    composerList.innerHTML = '';
    arrangerList.innerHTML = '';
    data.forEach(person => {
        const option = `<option value="${person.vorname} ${person.name}" data-id="${person.pid}"></option>`;
        composerList.innerHTML += option;
        arrangerList.innerHTML += option;
    });
}

// Open the modal to add a new Stueck
function openAddStueckModal() {
    const modal = document.getElementById('addStueckModal');
    modal.style.display = 'block'; // Show the modal
}

// Close the modal to add a new Stueck
function closeAddStueckModal() {
    const modal = document.getElementById('addStueckModal');
    modal.style.display = 'none'; // Hide the modal
}

// Post new Stueck
document.getElementById('addStueckForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const composerName = document.getElementById('composer_name').value;
    const arrangerName = document.getElementById('arranger_name').value;
    const composerId = document.querySelector(`#composer-list option[value="${composerName}"]`).dataset.id;
    const arrangerId = document.querySelector(`#arranger-list option[value="${arrangerName}"]`).dataset.id;

    const newStueck = {
        name: document.getElementById('name').value,
        genre: document.getElementById('genre').value,
        jahr: document.getElementById('jahr').value,
        schwierigkeit: document.getElementById('schwierigkeit').value,
        isdigitalisiert: document.getElementById('isdigitalisiert').checked,
        composer_id: composerId,
        arranger_id: arrangerId
    };

    fetch('/api/stueck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStueck)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to add Stück');
        })
        .then(() => {
            alert('Stück added successfully!');
            fetchStueck(); // Refresh the table
            closeAddStueckModal(); // Close the modal
        })
        .catch(error => console.error('Error:', error));
});

// Function to edit a Stueck
function editStueck(stid) {
    fetch(`/api/stueck/${stid}`)
        .then(response => response.json())
        .then(stueck => {
            const modal = createEditStueckModal(stueck);
            document.body.appendChild(modal);
            modal.style.display = 'block';

            document.getElementById('edit-stueck-form').addEventListener('submit', function (event) {
                event.preventDefault();
                const formData = new FormData(event.target);
                const composerName = formData.get('composer_name');
                const arrangerName = formData.get('arranger_name');
                const composerId = document.querySelector(`#composer-list option[value="${composerName}"]`).dataset.id;
                const arrangerId = document.querySelector(`#arranger-list option[value="${arrangerName}"]`).dataset.id;

                const updatedStueck = {
                    stid: stueck.stid,
                    name: formData.get('name'),
                    genre: formData.get('genre'),
                    jahr: parseInt(formData.get('jahr')),
                    schwierigkeit: formData.get('schwierigkeit'),
                    isdigitalisiert: formData.get('isdigitalisiert') === 'on',
                    composer_id: composerId,
                    arranger_id: arrangerId
                };

                fetch(`/api/stueck`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(updatedStueck)
                })
                    .then(response => response.json())
                    .then(data => {
                        fetchStueck();
                        document.body.removeChild(modal);
                    })
                    .catch(error => console.error("Error:", error));
            });
        })
        .catch(error => console.error("Error fetching Stueck details:", error));
}

// Create the modal for editing a Stueck
function createEditStueckModal(stueck) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Stueck</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-stueck-form">
                        <div class="mb-3">
                            <label for="edit-name" class="form-label">Name</label>
                            <input type="text" class="form-control" id="edit-name" name="name" value="${stueck.name}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-genre" class="form-label">Genre</label>
                            <input type="text" class="form-control" id="edit-genre" name="genre" value="${stueck.genre}">
                        </div>
                        <div class="mb-3">
                            <label for="edit-jahr" class="form-label">Jahr</label>
                            <input type="number" class="form-control" id="edit-jahr" name="jahr" value="${stueck.jahr}">
                        </div>
                        <div class="mb-3">
                            <label for="edit-schwierigkeit" class="form-label">Schwierigkeit</label>
                            <select class="form-control" id="edit-schwierigkeit" name="schwierigkeit">
                                <option value="Einfach" ${stueck.schwierigkeit === 'Einfach' ? 'selected' : ''}>Einfach</option>
                                <option value="Mittel" ${stueck.schwierigkeit === 'Mittel' ? 'selected' : ''}>Mittel</option>
                                <option value="Schwer" ${stueck.schwierigkeit === 'Schwer' ? 'selected' : ''}>Schwer</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit-isdigitalisiert" class="form-label">Digitalisiert</label>
                            <input type="checkbox" class="form-check-input" id="edit-isdigitalisiert" name="isdigitalisiert" ${stueck.isdigitalisiert ? 'checked' : ''}>
                        </div>
                        <div class="mb-3">
                            <label for="edit-composer_name" class="form-label">Composer</label>
                            <input type="text" class="form-control" id="edit-composer_name" name="composer_name" list="composer-list" value="${stueck.composer_name}">
                        </div>
                        <div class="mb-3">
                            <label for="edit-arranger_name" class="form-label">Arranger</label>
                            <input type="text" class="form-control" id="edit-arranger_name" name="arranger_name" list="arranger-list" value="${stueck.arranger_name}">
                        </div>
                        <button type="submit" class="btn btn-primary">Save changes</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    return modal;
}

// Function to delete a Stueck
function deleteStueck(stid) {
    fetch(`/api/stueck`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ stid })
    })
        .then(response => response.json())
        .then(data => {
            fetchStueck();
        })
        .catch(error => console.error("Error:", error));
}

document.addEventListener("DOMContentLoaded", function () {
    fetchStueck();
    fetchPerson();
    fetchPersonList();
});