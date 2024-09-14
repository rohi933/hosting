document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username'); // Use correct key for username
    const detailsTableBody = document.querySelector('#details-table tbody');

    try {
        const response = await fetch(`/data?username=${username}`);
        const data = await response.json();

        // Populate the data table with additional users in the same row
        data.forEach(record => {
            const additionalUsers = record.additional_users.join(', '); // Convert array to comma-separated string
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.name}</td>
                <td>${record.email}</td>
                <td>${additionalUsers}</td>
            `;
            detailsTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById('back-to-home').addEventListener('click', () => {
    window.location.href = 'app.html';
});
