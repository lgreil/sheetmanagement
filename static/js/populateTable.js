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
    const schwierigkeitClass = stueck.schwierigkeit === 'Einfach' ? 'easy' :
                               stueck.schwierigkeit === 'Mittel' ? 'medium' : 'hard';

    return `
        <tr>
            <td style="display:none;">${stueck.stid}</td>
            <td>${stueck.name}</td>
            <td>
                <div class="schwierigkeit-bar ${schwierigkeitClass}">
                    <div class="fill"></div>
                </div>
            </td>
            <td>${stueck.genre}</td>
            <td class="digitalisiert-checkbox">
                <input type="checkbox" ${stueck.isdigitalisiert ? 'checked' : ''} disabled>
            </td>
            <td>${stueck.jahr}</td>
            <td>${stueck.composer_name || ''}</td>
            <td>${stueck.arranger_name || ''}</td>
            <td class="text-center">
                <button class="btn-edit" onclick="editStueck(${stueck.stid})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteStueck(${stueck.stid})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `;
}

// Populate a row in the Person table
function populatePersonRow(person) {
    return `
        <tr>
            <td style="display:none;">${person.pid}</td>
            <td>${person.vorname}</td>
            <td>${person.name}</td>
            <td>${person.appearances}</td>
            <td class="text-center">
                <button class="btn-edit" onclick="editPerson(${person.pid})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deletePerson(${person.pid})">
                    <i class="fas fa-trash-alt"></i>
                </button>
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
