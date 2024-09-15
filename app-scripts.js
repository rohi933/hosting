document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    const submitDetailsButton = document.getElementById('submit-details');
    const viewDashboardButton = document.getElementById('view-dashboard');
    const logoutButton = document.getElementById('logout');

    if (role === 'DCIT' || role === 'ITO') {
        submitDetailsButton.style.display = 'inline-block';
    }

    submitDetailsButton.addEventListener('click', () => {
        window.location.href = 'submit-details.html';
    });

    viewDashboardButton.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('role');
        localStorage.removeItem('hierarchy');
        window.location.href = 'index.html';
    });
});
