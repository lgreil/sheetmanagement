function sortTable(tableBodyId, columnIndex) {
    columnIndex = columnIndex + 1; // Account for the hidden ID column
    const tableBody = document.getElementById(tableBodyId);
    const rows = Array.from(tableBody.getElementsByTagName('tr'));
    const header = tableBody.parentElement.querySelectorAll('th')[columnIndex];
    const isAscending = header.classList.contains('sorted-asc');

    // Remove sorting classes from all headers
    tableBody.parentElement.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Add the appropriate sorting class to the current header
    header.classList.add(isAscending ? 'sorted-desc' : 'sorted-asc');

    // Sort rows
    rows.sort((a, b) => {
        const cellA = a.getElementsByTagName('td')[columnIndex].innerText.toLowerCase();
        const cellB = b.getElementsByTagName('td')[columnIndex].innerText.toLowerCase();

        if (cellA < cellB) {
            return isAscending ? 1 : -1;
        }
        if (cellA > cellB) {
            return isAscending ? -1 : 1;
        }
        return 0;
    });

    // Append sorted rows to the table body
    rows.forEach(row => tableBody.appendChild(row));
}