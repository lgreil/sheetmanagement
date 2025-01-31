// Create a modal
function createModal(modalId, title, bodyContent, onClose) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" onclick="${onClose}('${modalId}')"></button>
                </div>
                <div class="modal-body">
                    ${bodyContent}
                </div>
            </div>
        </div>
    `;
    modal.id = modalId;
    document.body.appendChild(modal);
    return modal;
}

// Create the modal for editing a Stueck
function createEditStueckModal(stueck) {
    const bodyContent = `
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
                <input type="text" class="form-control" id="edit-composer_name" name="composer_name" list="composer-list" value="${stueck.composer_name || ''}">
                <button type="button" class="btn btn-link" onclick="openAddPersonModal()">Add New Composer</button>
            </div>
            <div class="mb-3">
                <label for="edit-arranger_name" class="form-label">Arranger</label>
                <input type="text" class="form-control" id="edit-arranger_name" name="arranger_name" list="arranger-list" value="${stueck.arranger_name || ''}">
                <button type="button" class="btn btn-link" onclick="openAddPersonModal()">Add New Arranger</button>
            </div>
            <button type="submit" class="btn btn-primary">Save changes</button>
        </form>
    `;
    return createModal(`edit-stueck-modal-${stueck.stid}`, 'Edit Stueck', bodyContent, 'closeEditStueckModal');
}

// Close the modal for editing a Stueck
function closeEditStueckModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
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

// Show auto-disappearing popup feedback
function showPopupFeedback(message) {
    const popup = document.createElement('div');
    popup.classList.add('popup-feedback');
    popup.innerText = message;
    document.body.appendChild(popup);
    setTimeout(() => {
        document.body.removeChild(popup);
    }, 3000);
}

// Add CSS for popup feedback
const style = document.createElement('style');
style.innerHTML = `
    .popup-feedback {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #28a745;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
    }
`;
document.head.appendChild(style);

// Create the modal for adding a new person
function createAddPersonModal() {
    const bodyContent = `
        <form id="add-person-form" onsubmit="event.preventDefault(); addPerson();">
            <div class="mb-3">
                <label for="add-person-vorname" class="form-label">Vorname</label>
                <input type="text" class="form-control" id="add-person-vorname" name="vorname" required>
            </div>
            <div class="mb-3">
                <label for="add-person-name" class="form-label">Name</label>
                <input type="text" class="form-control" id="add-person-name" name="name" required>
            </div>
            <button type="submit" class="btn btn-primary">Add Person</button>
        </form>
    `;
    return createModal('add-person-modal', 'Add New Person', bodyContent, 'closeAddPersonModal');
}

// Close the modal for adding a new person
function closeAddPersonModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Open the modal for adding a new person
function openAddPersonModal() {
    const modal = document.getElementById('add-person-modal');
    if (!modal) {
        createAddPersonModal();
    }
    document.getElementById('add-person-modal').style.display = 'block';
}

// Function to add a new person
function addPerson() {
    const newPerson = {
        vorname: document.getElementById('add-person-vorname').value,
        name: document.getElementById('add-person-name').value
    };
    savePerson(newPerson, 'POST', 'Person added!', () => {
        document.getElementById('add-person-form').reset(); // Reset the form for new entries
        closeAddPersonModal('add-person-modal'); // Close the modal
    });
}

// Create the modal for editing a person
function createEditPersonModal(person) {
    const bodyContent = `
        <form id="edit-person-form">
            <div class="mb-3">
                <label for="edit-person-vorname" class="form-label">Vorname</label>
                <input type="text" class="form-control" id="edit-person-vorname" name="vorname" value="${person.vorname}" required>
            </div>
            <div class="mb-3">
                <label for="edit-person-name" class="form-label">Name</label>
                <input type="text" class="form-control" id="edit-person-name" name="name" value="${person.name}" required>
            </div>
            <button type="submit" class="btn btn-primary">Save changes</button>
        </form>
    `;
    return createModal(`edit-person-modal-${person.pid}`, 'Edit Person', bodyContent, 'closeEditPersonModal');
}

// Close the modal for editing a person
function closeEditPersonModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Open the modal for editing a person
function openEditPersonModal(person) {
    const modal = document.getElementById(`edit-person-modal-${person.pid}`);
    if (!modal) {
        createEditPersonModal(person);
    }
    document.getElementById(`edit-person-modal-${person.pid}`).style.display = 'block';
}
