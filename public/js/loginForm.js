import { userAlreadyLoggedIn } from "./auth.js";

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    // console.log(loginForm)
    userAlreadyLoggedIn()


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                // Extract token from response
                const { token } = await response.json();

                // Save token in localStorage
                localStorage.setItem('token', token);

                // Redirect to home page
                window.location.href = '/home';
            } else {
                // Login failed
                const errorMessage = await response.text();
                alert(`Login failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please try again.');
        }
    });
});
