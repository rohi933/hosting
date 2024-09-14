document.addEventListener('DOMContentLoaded', () => {
    const detailsForm = document.getElementById('details-form');
    const submittedDetails = document.getElementById('submitted-details');
    const submittedName = document.getElementById('submitted-name');
    const submittedEmail = document.getElementById('submitted-email');
    const submittedUsername = document.getElementById('submitted-username'); // Add this line to target the username element
    const backToHomeButton = document.getElementById('back-to-home');

    detailsForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const username = localStorage.getItem('username'); // Use username from local storage

        try {
            await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, username })
            });

            // Display the submitted details including the username
            submittedName.textContent = name;
            submittedEmail.textContent = email;
            submittedUsername.textContent = username; // Add this line to display the username
            submittedDetails.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
        }
    });

    backToHomeButton.addEventListener('click', () => {
        window.location.href = 'app.html';
    });
});
