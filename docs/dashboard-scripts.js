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
    let selectedPAN = null;
    let selectedField = null;

    // Role-based column headers mapping
    const roleColumns = {
        'CCIT': ['CCIT', 'CIT', 'ADDCIT', 'ITO/DCIT'],
        'CIT': ['CIT', 'ADDCIT', 'ITO/DCIT'],
        'ADDCIT': ['ADDCIT', 'ITO/DCIT'],
        'ITO': ['ITO/DCIT'],
        'DCIT': ['ITO/DCIT']
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

        // Determine the columns based on the role
        const columns = roleColumns[role] || [];

        // Create table headers dynamically based on role
        detailsTableHead.innerHTML = `
            <th>PAN</th>
            <th>TypeOfApplication</th>
            <th>DateOfApplication</th>
            <th>PENDENCY SINCE(DAYS)</th>
        `;
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col; // Use the role-based column name
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
        // Populate the table with data records
        data.forEach(record => {
            console.log('Processing record:', record); // Log the entire record

            const tr = document.createElement('tr');
            const additionalUsers = Array.from(record.additional_users); // Convert Set to Array

            // Add data cells for PAN, TypeOfApplication, DateOfApplication
            tr.innerHTML = `
                <td>${record.PAN}</td>
                <td>${record.TypeOfApplication}</td>
                <td>${record.DateOfApplication}</td>
                <td>${calculateDaysSince(record.DateOfApplication)}</td>
            `;

            // Add cells for each fixed hierarchy level based on the additional users array
            columns.forEach((col, index) => {
                const td = document.createElement('td');
                // Assign additional users to columns based on their index
                td.textContent = additionalUsers[index] || ''; // Use empty string if no user available
                console.log(`Column "${col}" assigned user: ${td.textContent}`);
                tr.appendChild(td);
            });

            // Add action buttons for ITO and DCIT
            if (role && ['ITO', 'DCIT'].includes(role)) {
                const actionTd = document.createElement('td');
                actionTd.className = 'action-buttons';
                actionTd.innerHTML = `
                    <button class="query-date-btn" data-pan="${record.PAN}" data-field="DateOfQuery">DateOfQuery Raised</button>
                    <button class="disposal-date-btn" data-pan="${record.PAN}" data-field="DateOfDisposal">DateOfDisposal</button>
                `;
                console.log('Action buttons HTML:', actionTd.innerHTML); // Log action buttons HTML
                tr.appendChild(actionTd);
            }

            // Append the row to the table body
            detailsTableBody.appendChild(tr);
            console.log('Row added to table body'); // Log when a row is added
        });

        // Event listeners for the calendar input and buttons
        document.querySelectorAll('.query-date-btn, .disposal-date-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                selectedPAN = event.target.dataset.pan;
                selectedField = event.target.dataset.field;
                calendarContainer.style.display = 'block';
                calendarInput.focus();
            });
        });

        saveDateButton.addEventListener('click', async () => {
            const selectedDate = calendarInput.value;
            if (!selectedDate) return; // No date selected

            // Update the corresponding record in the CSV using PAN
            const response = await fetch('/update-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    PAN: selectedPAN,
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
