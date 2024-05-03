import { userAlreadyLoggedIn, token } from "./auth.js";
userAlreadyLoggedIn()


var userContacts = [];
var username = "";



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
            username = data.user.username
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
chatTextarea.addEventListener('input', function () {
    autoExpand(this);
})


function autoExpand(textarea) {
    // Reset textarea height to auto to properly calculate new height
    textarea.style.height = 'auto';
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


document.getElementById('send-btn').addEventListener('click', () => {
    const message = document.getElementById('chat-textarea').value;
    if (message.trim() !== '') {
        // Emit the message along with sender information to the server
        socket.emit('chatMessage', { message, sender: username });
        chatTextarea.value = ''; // Clear the textarea
        chatTextarea.style.height = '40px';
    }
});

const socket = io();
// Handle incoming messages from the server
socket.on('chatMessage', (data) => {
    // Extract message and sender information from the data
    const { message, sender } = data;
    const chatMainInner = document.getElementById('chat-area');

    // Create a new chat bubble container
    const bubbleContainer = document.createElement('div');
    bubbleContainer.classList.add('chat-bubble-contained');

    // add svg to message
    // <svg width="20" height="13" viewBox="0 0 20 13" fill="none" xmlns="http://www.w3.org/2000/svg">
{/* <path d="M0 0.576315C0 0.576315 9.1505 0.192844 19 0.576315C13.893 14 31 24.8497 31 24.8497V24.8497C20.5703 25.551 10.6838 20.1273 5.67111 10.9543L0 0.576315Z" fill="#BE1731"/>
</svg> */}
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0 0.576315C0 0.576315 9.1505 0.192844 19 0.576315C13.893 14 31 24.8497 31 24.8497V24.8497C20.5703 25.551 10.6838 20.1273 5.67111 10.9543L0 0.576315Z');
    path.setAttribute('fill', '#BE1731');
    svg.appendChild(path);

    // Create a new chat bubble
    const bubble = document.createElement('div');
    const bubbleText = document.createElement('p');
    bubble.classList.add('chat-bubble');
    bubbleText.textContent = message;
    bubble.appendChild(bubbleText);
    bubble.appendChild(svg);

    let lastChat = chatMainInner.lastElementChild;
    // Determine the direction of the message based on the sender
    if (sender === username) {
        bubbleContainer.classList.add('to-right'); // Sender's message aligns to the left
        if (lastChat && lastChat.classList.contains('to-right')) {
            lastChat.classList.add('same-sender');
        }
    } else {
        bubbleContainer.classList.add('to-left'); // Other user's message aligns to the right
        if (lastChat && lastChat.classList.contains('to-left')) {
            lastChat.classList.add('same-sender');
        }
    }

    // Append the bubble to the bubble container
    bubbleContainer.appendChild(bubble);

    // Append the bubble container to the chat main inner container
    chatMainInner.appendChild(bubbleContainer);
    chatMainInner.scrollTop = chatMainInner.scrollHeight;
});
