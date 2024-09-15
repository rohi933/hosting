document.addEventListener('DOMContentLoaded', async () => {
    const detailsTableBody = document.querySelector('#disposed-table tbody');
    const username = localStorage.getItem('username'); // Retrieve username from local storage

    // Function to calculate days since the application
    const calculateDaysSince = (dateString) => {
        const today = new Date();
        const applicationDate = new Date(dateString);
        const differenceInTime = today - applicationDate;
        const differenceInDays = Math.floor(differenceInTime / (1000 * 60 * 60 * 24));
        return differenceInDays;
    };

    // Fetch disposed applications
    try {
        const response = await fetch(`/disposed-applications?username=${username}`);
        const data = await response.json();

        // Populate the table with disposed application records
        data.forEach(record => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${record.PAN}</td>
                <td>${record.TypeOfApplication}</td>
                <td>${record.DateOfApplication}</td>
                <td>${record.DateOfDisposal}</td>
                <td>${calculateDaysSince(record.DateOfApplication)}</td>
            `;

            detailsTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
    }

    document.getElementById('back-to-home').addEventListener('click', () => {
        window.location.href = 'app.html'; // Adjust to your home page URL
    });
});
