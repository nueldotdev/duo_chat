import { userAlreadyLoggedIn, token } from "./auth.js";
userAlreadyLoggedIn()


var userContacts = [];
var username = "";
var action = 0;
const socket = io();


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

retrieveUserInfo()

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


function cancelLogout() {
    var logoutModal = modalDiv.querySelector('.logout-modal');
    


    logoutModal.classList.remove('active');
    modalDiv.classList.remove('active');
}


function searchUsers() {
    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');

    if (searchInput.value === '') {
        searchResults.innerHTML = '';
        return;
    } else {
        searchResults.innerHTML = '';
        userContacts.forEach(contact => {
            if (contact.username.toLowerCase().includes(searchInput.value.toLowerCase())) {
                searchResults.innerHTML += `
                <li class="search-result">${contact.username}</li>
                `;
            } else {
                searchResults.innerHTML = '';
            }
        });
    }
}

// Declare elements
const logoutBtn = document.getElementById('logout-btn');
// const logoutCancel = document.getElementById('logout-cancel');
const logoutAction = document.getElementById('logout-action');
const modalDiv = document.querySelector('.modal');
// const logoutModal = document.getElementById('modal-logout');/
const chatTextarea = document.getElementById('chat-textarea');
const userSearch = document.querySelector('#user-search-form')
var searchModal = modalDiv.querySelector('.search-modal')


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
    const chatDiv = document.getElementById('chat-textarea');
    const message = chatDiv.innerText.replace(/<br>/g, '\n'); // Replace <br> tags with newline characters
    if (message.trim() !== '') {
        // Emit the message along with sender information to the server
        socket.emit('chatMessage', { message, sender: username });
        console.log(message);
        chatDiv.innerText = ''; // Clear the div content
        chatDiv.style.height = 'auto';
    }
});

// Add event listener for Enter key press
document.getElementById('chat-textarea').addEventListener('keydown', (event) => {
    // Check if Enter key is pressed (keyCode 13) and not Shift key
    if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault(); // Prevent default Enter key behavior (line break)
        const chatDiv = event.target;
        const message = chatDiv.innerText.replace(/<br>/g, '\n').trim(); // Replace <br> tags with newline characters and trim the text
        if (message !== '') {
            // Emit the message along with sender information to the server
            socket.emit('chatMessage', { message, sender: username });
            console.log(message);
            chatDiv.innerText = ''; // Clear the div content
            chatDiv.style.height = 'auto';
        }
    }
});


// Handle incoming messages from the server
socket.on('chatMessage', (data) => {
    // Extract message and sender information from the data
    const { message, sender } = data;
    const chatMainInner = document.getElementById('chat-area');

    // Create a new chat bubble container
    const bubbleContainer = document.createElement('div');
    bubbleContainer.classList.add('chat-bubble-contained');

    // add svg to message
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

// Add event listener
// Add event listener to the background of the modal
modalDiv.addEventListener('click', function(event) {
if (event.target == modalDiv) {
    modalDiv.classList.remove('active');
    var modalKids = modalDiv.querySelectorAll('.active');

    modalKids.forEach(element => {
        element.classList.remove('active');
    });
}
});

logoutAction.addEventListener('click', () => {
    var logoutModal = modalDiv.querySelector('.logout-modal');
    


    logoutModal.classList.add('active');
    modalDiv.classList.add('active');

    // Add event listeners after modal content is appended
    document.getElementById('cancel-logout').addEventListener('click', cancelLogout);
    document.getElementById('logout-btn').addEventListener('click', logout);
})

const focusPage = document.querySelector('.screen2');
const chatPage = document.querySelector('.main-section.chat-page');
const chatTop = document.querySelector('.chat-screen-top');
const emptySection = document.querySelector('.empty-section');
const contacts = document.querySelectorAll('.contact');
const newChatBtn = document.getElementById('new-chat-btn');


if (action == 0) {
    chatPage.classList.add('off');
    chatTop.classList.add('off');
}

contacts.forEach(element => {
    element.addEventListener('click', () => {
        chatPage.classList.remove('off');
        chatTop.classList.remove('off');
        emptySection.classList.add('off');
        
        contacts.forEach(one => {
            one.classList.remove('active')
        })
        element.classList.add('active')
    })
});


newChatBtn.addEventListener('click', () => {
    searchModal.classList.add('active')
    modalDiv.classList.add('active')

    // document.getElementById('search-users-input').addEventListener('keyup', searchUsers);
})

// User search form
userSearch.addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchInput = document.getElementById('search-users-input').value;
    const searchResult = searchModal.querySelector('.modal-body');
    searchResult.innerHTML = ``;

    try {
        fetch(`/search?username=${searchInput}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token // Assuming you have the token stored somewhere accessible
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to search for users');
            }
            return response.json();
        })
        .then(data => {
            // Handle the search results here (e.g., display them on the UI)
            // console.log('Search results:', data);
            data.forEach(user => {
                var image;
                if (user.profile_img) {
                    image = user.profile_img
                } else {
                    image = '/images/user-icon.png'
                }


                // Create user contained 
                var newUser = document.createElement('div');
                newUser.classList.add('contact');
                newUser.classList.add('chats');

                // Create user image container
                var imgCont = document.createElement('div');
                imgCont.classList.add('contact-img');
                imgCont.classList.add('img-cont');
                var img = document.createElement('img');
                img.src = image;
                imgCont.appendChild(img);

                // Create user info container
                var userInfo = document.createElement('div');
                userInfo.classList.add('contact-info');
                var userName = document.createElement('div');
                userName.classList.add('contact-name');
                var name = document.createElement('h3');
                name.innerText = user.username;
                userName.appendChild(name);
                userInfo.appendChild(userName);

                // Create user options container
                var userOptions = document.createElement('div');
                userOptions.classList.add('contact-options');
                var searchBtn = document.createElement('button');
                searchBtn.classList.add('page-icon-btn');
                searchBtn.classList.add('contact-search-btn');
                searchBtn.addEventListener('click', addContact(searchBtn));
                searchBtn.innerHTML = `<span class="material-symbols-rounded">
                                            add
                                        </span>`
                userOptions.appendChild(searchBtn);


                newUser.appendChild(imgCont);
                newUser.appendChild(userInfo);
                newUser.appendChild(userOptions);

                searchResult.appendChild(newUser);
            });
        })
        .catch(error => {
            console.error('Error searching for users:', error);
            // Handle the error (e.g., display an error message on the UI)
        });        
    } catch (error) {
        console.log(error);
    }
})