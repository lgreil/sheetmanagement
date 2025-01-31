function importTSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split('\t'));

        rows.forEach(row => {
            const [name, genre, jahr, schwierigkeit, isdigitalisiert, composer_name, arranger_name] = row;
            handlePersonIds(composer_name, arranger_name, (composerId, arrangerId) => {
                addNewStueckFromTSV(name, genre, jahr, schwierigkeit, isdigitalisiert, composerId, arrangerId);
            });
        });
    };
    reader.readAsText(file);
}

function addNewStueckFromTSV(name, genre, jahr, schwierigkeit, isdigitalisiert, composerId, arrangerId) {
    const newStueck = {
        name: name,
        genre: genre,
        jahr: parseInt(jahr),
        schwierigkeit: schwierigkeit,
        isdigitalisiert: isdigitalisiert.toLowerCase() === 'true',
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
        return response.json().then(err => { throw new Error(err.message); });
    })
    .then(() => {
        console.log('Stück added successfully!');
        fetchStueck(); // Refresh the table
    })
    .catch(error => console.error('Error:', error));
}
