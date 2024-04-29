// Function to check if user is already logged in
// Retrieve token saved in storage 
export function userAlreadyLoggedIn() {
    const token = localStorage.getItem('token');

    if (token) {
        fetch('/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to verify token');
            } else {
                if (window.location.pathname !== "/home") {
                    window.location.href = "/home"
                }
            }  
        })
    } else {
        if (window.location.pathname === "/home") {
            window.location.href = "/login"
        }
    }
}

// Alternatively, you can export the `token` variable directly from the function

export const token = localStorage.getItem('token');


// Execute the function when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    userAlreadyLoggedIn();
});
