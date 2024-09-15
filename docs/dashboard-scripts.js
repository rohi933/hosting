document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username'); // Retrieve username from local storage
    const role = localStorage.getItem('role'); // Retrieve role from local storage
    const detailsTableBody = document.querySelector('#details-table tbody');
    const detailsTableHead = document.querySelector('#details-table thead tr');
    const disposedApplButton = document.getElementById('disposed-appl');
    const calendarContainer = document.getElementById('calendar-container');
    const calendarInput = document.getElementById('calendar-input');
    const saveDateButton = document.getElementById('save-date');
    const cancelDateButton = document.getElementById('cancel-date');
    let selectedRowId = null;
    let selectedField = null;

    // Function to simplify hierarchy names
    const simplifyHierarchyName = (name) => {
        if (name.startsWith('CCIT')) return 'CCIT';
        if (name.startsWith('ADDCIT')) return 'ADDCIT';
        if (name.startsWith('CIT')) return 'CIT';
        if (name.startsWith('ITO') || name.startsWith('DCIT')) return 'ITO/DCIT';
        return name; // Default case if no match is found
    };

    // Function to calculate days since the application
    const calculateDaysSince = (dateString) => {
        const today = new Date();
        const applicationDate = new Date(dateString);
        const differenceInTime = today - applicationDate;
        const differenceInDays = Math.floor(differenceInTime / (1000 * 60 * 60 * 24));
        return differenceInDays;
    };

    // Show or hide the DISPOSED APPL button based on user role
    if (role && !['ITO', 'DCIT'].includes(role)) {
        disposedApplButton.style.display = 'inline-block'; // Show the button if role is not ITO or DCIT
    } else {
        disposedApplButton.style.display = 'none'; // Hide the button if role is ITO or DCIT
    }

    disposedApplButton.addEventListener('click', () => {
                window.location.href = 'disposed_appl.html'; // Redirect to the new page
            });

    try {
        // Fetch data from the server using the username query parameter
        const response = await fetch(`/data?username=${username}`);
        const data = await response.json();

        // Determine unique hierarchy levels
        const uniqueHierarchies = new Set();
        data.forEach(record => {
            record.additional_users.forEach(user => uniqueHierarchies.add(user));
        });

        // Create table headers dynamically for hierarchy levels and add the new fixed column
        detailsTableHead.innerHTML = `
            <th>PAN</th>
            <th>TypeOfApplication</th>
            <th>DateOfApplication</th>
            <th>PENDENCY SINCE(DAYS)</th>
        `;
        [...uniqueHierarchies].forEach(user => {
            const th = document.createElement('th');
            th.textContent = simplifyHierarchyName(user); // Simplify the hierarchy name
            detailsTableHead.appendChild(th);
        });
        if (role && ['ITO', 'DCIT'].includes(role)) {
            const actionTh = document.createElement('th');
            actionTh.textContent = 'Action';
            detailsTableHead.appendChild(actionTh); // Add the Action column for ITO and DCIT
        }

        // Clear existing rows in the table body
        detailsTableBody.innerHTML = '';

        // Populate the table with data records
        data.forEach((record, index) => {
            const tr = document.createElement('tr');
            const additionalUsers = new Set(record.additional_users);

            // Add data cells for PAN, TypeOfApplication, DateOfApplication
            tr.innerHTML = `
                <td>${record.PAN}</td>
                <td>${record.TypeOfApplication}</td>
                <td>${record.DateOfApplication}</td>
                <td>${calculateDaysSince(record.DateOfApplication)}</td>
            `;

            // Add cells for each dynamically created hierarchy level
            [...uniqueHierarchies].forEach(user => {
                const td = document.createElement('td');
                td.textContent = additionalUsers.has(user) ? user : '';
                tr.appendChild(td);
            });

            // Add action buttons for ITO and DCIT
            if (role && ['ITO', 'DCIT'].includes(role)) {
                const actionTd = document.createElement('td');
                actionTd.className = 'action-buttons';
                actionTd.innerHTML = `
                    <button class="query-date-btn" data-row-id="${index}" data-field="DateOfQuery">DateOfQuery Raised</button>
                    <button class="disposal-date-btn" data-row-id="${index}" data-field="DateOfDisposal">DateOfDisposal</button>
                `;
                tr.appendChild(actionTd);
            }

            detailsTableBody.appendChild(tr);
        });

        // Event listeners for the calendar input and buttons
        document.querySelectorAll('.query-date-btn, .disposal-date-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                selectedRowId = event.target.dataset.rowId;
                selectedField = event.target.dataset.field;
                calendarContainer.style.display = 'block';
                calendarInput.focus();
            });
        });

        saveDateButton.addEventListener('click', async () => {
            const selectedDate = calendarInput.value;
            if (!selectedDate) return; // No date selected

            // Update the corresponding row in the CSV
            const response = await fetch('/update-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rowId: selectedRowId,
                    field: selectedField,
                    date: selectedDate
                })
            });
            if (response.ok) {
                alert('Date saved successfully');
            } else {
                alert('Error saving date');
            }
            calendarContainer.style.display = 'none';
        });

        cancelDateButton.addEventListener('click', () => {
            calendarContainer.style.display = 'none';
        });

    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById('back-to-home').addEventListener('click', () => {
    window.location.href = 'app.html'; // Adjust to your home page URL

});
