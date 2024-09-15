document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            // Check if response is OK
            if (response.ok) {
                // Try to parse JSON response
                const data = await response.json();

                // Check if data contains username and hierarchy
                if (data && data.username && data.hierarchy) {
                    localStorage.setItem('loggedIn', 'true');
                    localStorage.setItem('username', data.username); // Store actual username
                    localStorage.setItem('hierarchy', JSON.stringify(data.hierarchy));
                    localStorage.setItem('role', data.role);
                    window.location.href = 'app.html'; // Redirect to the main application page
                } else {
                    alert('Invalid server response');
                }
            } else {
                // Read and display the error message if response is not OK
                const errorText = await response.text();
                alert(`Login failed: ${errorText}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login');
        }
    });
});
