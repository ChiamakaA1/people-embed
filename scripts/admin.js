document.addEventListener('DOMContentLoaded', function() {
    const adminBtn = document.getElementById('admin-login-btn');
    const adminControls = document.getElementById('admin-controls-container');
    let adminMode = false;

    adminBtn.addEventListener('click', function() {
        if (!adminMode) {
            const password = prompt('Enter admin password:');
            if (password === 'admin123') { // Change this to your desired password
                document.body.classList.add('admin-mode-on');
                adminControls.style.display = 'block';
                adminBtn.textContent = 'Logout Admin';
                adminMode = true;
            } else {
                alert('Incorrect password');
            }
        } else {
            document.body.classList.remove('admin-mode-on');
            adminControls.style.display = 'none';
            adminBtn.textContent = 'Admin Login';
            adminMode = false;
        }
    });
});