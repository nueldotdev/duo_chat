import { userAlreadyLoggedIn, token } from "./auth.js";
userAlreadyLoggedIn()


var userContacts = [];



async function retrieveUserInfo() {
    // Fetch user information from backend
    fetch('/user', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to retrieve user information');
        }
        return response.json();
    })
    .then(data => {
        // Display user information on the frontend
        document.getElementById('username').innerHTML = `
        <p>${data.user.username}</p>`
        console.log(data.user);
        userContacts = data.user.contacts
    })
    .catch(error => {
        console.error('Error:', error.message);
    });
}

function logout() {
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to logout user');
        } else {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    })
       
    // Delete the token from localStorage or cookies
    // localStorage.removeItem('token'); // Assuming token is stored in localStorage
    // Redirect the user to the login page or another appropriate page
}

retrieveUserInfo()


// Declare elements
const logoutBtn = document.getElementById('logout-btn');
const chatTextarea = document.getElementById('chat-textarea');
// Add event listener
logoutBtn.addEventListener('click', logout)
chatTextarea.addEventListener('input', function() {
    autoExpand(this);
})


function autoExpand(textarea) {
    // Reset textarea height to auto to properly calculate new height
    textarea.style.height = '40px';
    // Calculate the new height based on the scroll height of the textarea
    textarea.style.height = textarea.scrollHeight + 'px';
    
    // Limit the height to the maximum height if it exceeds it
    if (textarea.scrollHeight > parseInt(window.getComputedStyle(textarea).maxHeight)) {
      textarea.style.height = window.getComputedStyle(textarea).maxHeight;
      textarea.style.overflowY = 'auto'; // Enable vertical scrollbar
    } else {
      textarea.style.overflowY = 'hidden'; // Hide vertical scrollbar if not needed
    }
  }