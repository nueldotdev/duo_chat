import { userAlreadyLoggedIn } from "./auth.js";

document.addEventListener('DOMContentLoaded', function () {

    const registerForm = document.getElementById('register-form');
    // console.log(registerForm)
    userAlreadyLoggedIn()

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(registerForm);
        // const id = formData.get('id');

        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const password2 = formData.get('confirmPassword');

        if (password !== password2) {
            alert('Passwords do not match');
        } else {
            console.log({ username, email, password, password2 })
            try {
                console.log(JSON.stringify({ username, email, password }))
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });
    
                if (response.ok) {
                    // Registration successful
                    alert('Registration successful');
                    window.location.href = '/login';
                } else {
                    // Registration failed
                    const errorMessage = await response.text();
                    alert(`Registration failed: ${errorMessage}`);
                }
            } catch (error) {
                console.error('Registration failed:', error);
                alert('Registration failed. Please try again.');
            }
        }
    })
});