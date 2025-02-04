document.addEventListener("DOMContentLoaded", function () {
    fetchStueck();
    fetchPerson();
    fetchPersonList();
});

// Include the search.js file
const scriptSearch = document.createElement('script');
scriptSearch.src = '/static/js/search.js';
document.head.appendChild(scriptSearch);

// Include the importCSV.js file
const scriptImportCSV = document.createElement('script');
scriptImportCSV.src = '/static/js/importCSV.js';
document.head.appendChild(scriptImportCSV);

// Include the importTSV.js file
const scriptImportTSV = document.createElement('script');
scriptImportTSV.src = '/static/js/importTSV.js';
document.head.appendChild(scriptImportTSV);

// Include the importFile.js file
const scriptImportFile = document.createElement('script');
scriptImportFile.src = '/static/js/importFile.js';
document.head.appendChild(scriptImportFile);