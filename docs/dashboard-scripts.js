document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username'); // Use correct key for username
    const detailsTableBody = document.querySelector('#details-table tbody');
    const detailsTableHead = document.querySelector('#details-table thead tr');

    // Mapping function to convert raw hierarchy values to display names
    const mapHierarchyName = (rawName) => {
        if (rawName.includes('CCIT')) return 'CCIT';
        if (rawName.includes('CIT')) return 'CIT';
        if (rawName.includes('ADDCIT')) return 'ADDCIT';
        if (rawName.includes('ITO') || rawName.includes('DCIT')) return 'ITO/DCIT';
        return rawName; // Default case if no match is found
    };

    try {
        // Fetch data from the server using the username query parameter
        const response = await fetch(`/data?username=${username}`);
        const data = await response.json();

        // Determine unique hierarchy levels
        const uniqueHierarchies = new Set();
        data.forEach(record => {
            record.additional_users.forEach(user => uniqueHierarchies.add(user));
        });

        // Create table headers dynamically for hierarchy levels with custom names
        uniqueHierarchies.forEach(user => {
            const th = document.createElement('th');
            th.textContent = mapHierarchyName(user);
            detailsTableHead.appendChild(th);
        });

        // Clear existing rows in the table body
        detailsTableBody.innerHTML = '';

        // Populate the table with data records
        data.forEach(record => {
            const tr = document.createElement('tr');
            const additionalUsers = new Set(record.additional_users);

            tr.innerHTML = `
                <td>${record.PAN}</td>
                <td>${record.TypeOfApplication}</td>
                <td>${record.DateOfApplication}</td>
            `;

            // Add cells for each hierarchy level with custom names
            uniqueHierarchies.forEach(user => {
                const td = document.createElement('td');
                td.textContent = additionalUsers.has(user) ? mapHierarchyName(user) : '';
                tr.appendChild(td);
            });

            detailsTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById('back-to-home').addEventListener('click', () => {
    window.location.href = 'app.html'; // Adjust to your home page URL
});
