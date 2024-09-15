document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        // For simplicity, we assume login is always successful
        localStorage.setItem('loggedIn', 'true');
        window.location.href = 'app.html'; // Redirect to the main application page
    });

    // Redirect to app.html if already logged in
    if (localStorage.getItem('loggedIn') === 'true') {
        window.location.href = 'app.html';
    }
});
