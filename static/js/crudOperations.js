document.getElementById('addStueckForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    handlePersonIds(
        formData.get('composer_name'),
        formData.get('arranger_name'),
        (composerIds, arrangerIds) => saveStueck(formData, composerIds, arrangerIds, 'POST', 'Stück added successfully!')
    );
});

function saveStueck(formData, composerIds, arrangerIds, method, successMessage) {
    const stueck = {
        name: formData.get('name'),
        genre: formData.get('genre'),
        jahr: formData.get('jahr'),
        schwierigkeit: formData.get('schwierigkeit'),
        isdigitalisiert: formData.get('isdigitalisiert') === 'on',
        composer_ids: composerIds,
        arranger_ids: arrangerIds
    };

    fetch('/api/stueck', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stueck)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json().then(err => { throw new Error(err.message); });
        })
        .then(() => {
            alert(successMessage);
            fetchStueck(); // Refresh the table
            if (method === 'POST') {
                document.getElementById('addStueckForm').reset(); // Reset the form for new entries
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        });
}

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
                handlePersonIds(
                    formData.get('composer_name'),
                    formData.get('arranger_name'),
                    (composerIds, arrangerIds) => saveStueck(formData, composerIds, arrangerIds, 'PUT', 'Stück updated successfully!')
                );
            });
        })
        .catch(error => console.error("Error fetching Stueck details:", error));
}

function deleteStueck(stid) {
    fetch(`/api/stueck`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stid })
    })
        .then(response => response.json())
        .then(() => fetchStueck())
        .catch(error => console.error("Error:", error));
}

document.getElementById('add-person-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPerson = {
        vorname: document.getElementById('add-person-vorname').value,
        name: document.getElementById('add-person-name').value
    };
    savePerson(newPerson, 'POST', 'Person added!', () => {
        document.getElementById('add-person-form').reset(); // Reset the form for new entries
    });
});

function savePerson(person, method, successMessage, closeModalCallback) {
    fetch('/api/person', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(person)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json().then(err => { throw new Error(err.message); });
        })
        .then(() => {
            alert(successMessage);
            fetchPerson(); // Refresh the table
            closeModalCallback(); // Close the modal or reset the form
        })
        .catch(error => console.error('Error:', error));
}

function editPerson(pid) {
    fetch(`/api/person/${pid}`)
        .then(response => response.json())
        .then(person => {
            const modal = createEditPersonModal(person);
            document.body.appendChild(modal);
            modal.style.display = 'block';

            document.getElementById('edit-person-form').addEventListener('submit', function (event) {
                event.preventDefault();
                const formData = new FormData(event.target);
                const updatedPerson = {
                    pid: person.pid,
                    vorname: formData.get('vorname'),
                    name: formData.get('name')
                };
                savePerson(updatedPerson, 'PUT', 'Person updated successfully!', () => document.body.removeChild(modal));
            });
        })
        .catch(error => console.error("Error fetching Person details:", error));
}

function deletePerson(pid) {
    fetch(`/api/person`, {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: pid })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Cannot delete person, they are still used in another table.") {
                alert(data.message);
            } else {
                fetchPerson();
            }
        })
        .catch(error => console.error("Error:", error));
}

function handlePersonIds(composerName, arrangerName, callback) {
    const composerNames = composerName ? composerName.split(',').map(name => name.trim()) : [];
    const arrangerNames = arrangerName ? arrangerName.split(',').map(name => name.trim()) : [];

    const fetchPersonId = (name) => {
        const [vorname, nachname] = name.split(' ');
        return fetch('/api/person', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vorname, name: nachname })
        })
            .then(response => response.json())
            .then(data => data.pid)
            .catch(error => console.error('Error:', error));
    };

    const composerPromises = composerNames.map(name => fetchPersonId(name));
    const arrangerPromises = arrangerNames.map(name => fetchPersonId(name));

    Promise.all(composerPromises)
        .then(composerIds => {
            Promise.all(arrangerPromises)
                .then(arrangerIds => {
                    callback(composerIds, arrangerIds);
                });
        });
}

function importMultipleStuecke(jsonData) {
    const stueckePromises = jsonData.map(stueck => {
        return new Promise((resolve, reject) => {
            handlePersonIds(stueck.composer_name, stueck.arranger_name, (composerIds, arrangerIds) => {
                const newStueck = {
                    name: stueck.name,
                    genre: stueck.genre,
                    jahr: stueck.jahr,
                    schwierigkeit: stueck.schwierigkeit,
                    isdigitalisiert: stueck.isdigitalisiert,
                    composer_ids: composerIds,
                    arranger_ids: arrangerIds
                };
                resolve(newStueck);
            });
        });
    });

    Promise.all(stueckePromises)
        .then(stuecke => {
            fetch('/api/stueck', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stuecke)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    return response.json().then(err => { throw new Error(err.message); });
                })
                .then(() => {
                    alert('Stücke added successfully!');
                    fetchStueck(); // Refresh the table
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert(`Error adding Stücke: ${error.message}`);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Error processing Stücke: ${error.message}`);
        });
}