document.addEventListener('DOMContentLoaded', () => {
    const detailsForm = document.getElementById('details-form');
    const submittedDetails = document.getElementById('submitted-details');
    const submittedPan = document.getElementById('submitted-pan');
    const submittedTypeOfApplication = document.getElementById('submitted-type-of-application');
    const submittedDateOfApplication = document.getElementById('submitted-date-of-application');
//    const submittedUsername = document.getElementById('submitted-username'); // Added back
    const backToHomeButton = document.getElementById('back-to-home');

    detailsForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const pan = document.getElementById('pan').value;
        const typeOfApplication = document.getElementById('type-of-application').value;
        const dateOfApplication = document.getElementById('date-of-application').value;
        const username = localStorage.getItem('username'); // Use username from local storage

        try {
            await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pan, typeOfApplication, dateOfApplication, username })
            });

            // Display the submitted details including the username
            submittedPan.textContent = pan;
            submittedTypeOfApplication.textContent = typeOfApplication;
            submittedDateOfApplication.textContent = dateOfApplication;
//            submittedUsername.textContent = username; // Added back
            submittedDetails.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
        }
    });

    backToHomeButton.addEventListener('click', () => {
        window.location.href = 'app.html'; // Update to your home page or any other page
    });
});
