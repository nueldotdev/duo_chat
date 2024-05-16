const token = localStorage.getItem('token');

var activeUser;
var username = "";
var action = 0;
var activeChatRoom;
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
            updateUserScreen(data.user)
            getUserRequests(data.user._id);
            updateUserContacts()
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


function updateUserScreen(user) {
    document.getElementById('username').innerHTML = `<p>${user.username}</p>`
        // userContacts = data.user.contacts;
        username = user.username;
        activeUser = user;
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


async function updateUserContacts() {
    const contactList = document.getElementById('contact-list');
    contactList.innerHTML = ``;

    for (const contact of activeUser.contacts) {
        const chatContact = await getSenderDetails(contact);
        
        var image;
        if (chatContact.profileImage) {
            image = chatContact.profileImage
        } else {
            image = '/images/user-icon.png'
        }
        var contactBox = document.createElement('div');
        contactBox.classList.add('contact');
        contactBox.setAttribute("data-id", chatContact._id);
        contactBox.setAttribute('onclick', "chatAction(this)")
        contactBox.innerHTML = `
            <div class="contact-img img-cont">
                <img src="${image}" alt="user">
            </div>
            <div class="contact-info">
                <div class="contact-name">
                    <h3>${chatContact.username}</h3>
                </div>
            </div>
            <div class="contact-options">
                <button class="page-icon-btn">
                    <span class="material-symbols-rounded">
                        more_vert
                    </span>
                </button>
            </div>`

        contactList.appendChild(contactBox);
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
        socket.emit('chatMessage', { room: activeChatRoom, sender: username, message });
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

const chatAction = (element) => {
    const contacts = document.querySelectorAll('.contact');

    chatPage.classList.remove('off');
    chatTop.classList.remove('off');
    emptySection.classList.add('off');

    contacts.forEach(one => {
        one.classList.remove('active')
    })

    element.classList.add('active');
    const reciepientId = element.dataset.id;
    const senderId = activeUser._id;

    socket.emit('open-chat', {reciepientId, senderId});
}


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
                if (user.profileImage) {
                    image = user.profileImage
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
                userOptions.innerHTML = `<button class="page-icon-btn contact-search-btn" data-id="${user._id}" onclick="addContact(this)">
                                            <span class="material-symbols-rounded">
                                                add
                                            </span>
                                        </button>`
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




function addContact(button) {
    const receiverID = button.dataset.id;

    // Now you can use the userId variable to perform further actions
    sendRequest(activeUser._id, receiverID);


    button.style.animation = "fill 1s";
    var child = button.querySelector('span');
    // child.style.transform = `rotate(180deg)`;
    child.innerText = "check";
    child.style.animation = `iconChange 1s`;
    button.addEventListener('animationend', () => {
        button.style.backgroundColor = "var(--brand-color)";
    })
}

// Function to remove a request element from the DOM
function removeRequestElement(requestId) {
    const requestElement = document.getElementById(`request-${requestId}`);
    if (requestElement) {
        requestElement.remove();
    }
}

// Function to send a request
async function sendRequest(senderId, recipientId) {
    try {
        const response = await fetch('/send-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ senderId, recipientId })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(data.message);
            // Handle success
        } else {
            console.error(data.error);
            // Handle error
        }
    } catch (error) {
        console.error('Error sending request:', error);
        // Handle error
    }
}

// Function to accept a request
async function acceptRequest(requestId) {
    try {
        const response = await fetch('/accept-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requestId })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(data.message);
            // Remove the request element from the DOM
            removeRequestElement(requestId);
            // Refresh requests after rejecting
            getUserRequests();
            retrieveUserInfo();
        } else {
            console.error(data.error);
        }
    } catch (error) {
        console.error('Error accepting request:', error);
    }
}

// Function to reject a request
async function rejectRequest(requestId) {
    try {
        const response = await fetch('/reject-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requestId })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(data.message);
            // Remove the request element from the DOM
            removeRequestElement(requestId);
            // Refresh requests after rejecting
            getUserRequests();
        } else {
            console.error(data.error);
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
    }
}



// Function to fetch user requests
async function getUserRequests(userId) {
    try {
        console.log('User ID:', activeUser._id);
        const response = await fetch(`/user-requests/${userId}`);
        const data = await response.json();

        if (response.ok) {
            const requests = data.requests;
            // Display requests on the page and provide options to accept or reject
            displayRequests(requests);
        } else {
            console.error('Failed to fetch requests:', data.error);
        }
    } catch (error) {
        console.error('Error fetching requests:', error);
    }
}
// Function to fetch user details by user ID
async function getSenderDetails(userId) {
    try {
        const response = await fetch(`/users/${userId}`); // Assuming there's an endpoint to fetch user details by ID
        const data = await response.json();

        if (response.ok) {
            return data.user; // Return user details
        } else {
            console.error('Failed to fetch user details:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
}

// Function to display requests on the page
async function displayRequests(requests) {
    const requestsContainer = document.getElementById('requests-container');

    // Clear previous requests
    // requestsContainer.innerHTML = '';
    const requestsReceived = document.getElementById('rq-received-container');
    // const requestSent = document.getElementById('rq-sent-container');

    // Iterate through requests
    for (const request of requests) {
        // Fetch sender details for each request
        const sender = await getSenderDetails(request.sender);

        // Check if sender details were fetched successfully
        if (sender.username != activeUser.username) {
            const requestElement = document.createElement('div');

            if (request.status == "pending") {
                const inputScript = inputReq(sender, request);
                requestElement.appendChild(inputScript);
                requestsReceived.appendChild(requestElement);
            }
        } 
        // else {
        //     const requestElement = document.createElement('div');
        //     const inputScript = inputReq(sender, request);
        //     requestElement.appendChild(inputScript);
        //     requestSent.appendChild(requestElement);            
        // }
    }
}


function inputReq(user, request) {
    var image;
    if (user.profileImage) {
        image = user.profileImage
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
    var status = document.createElement('p');
    status.innerText = request.status;
    name.innerText = user.username;
    userName.appendChild(name);
    userName.appendChild(status);
    userInfo.appendChild(userName);

    // Create user options container
    var userOptions = document.createElement('div');
    userOptions.classList.add('contact-options');
    userOptions.innerHTML = `<button class="page-icon-btn contact-search-btn" onclick="acceptRequest('${request._id}')">
                                <span class="material-symbols-rounded">check</span></button>
                            <button class="page-icon-btn contact-search-btn" onclick="rejectRequest('${request._id}')"><span class="material-symbols-rounded">close</span></button>`
    newUser.appendChild(imgCont);
    newUser.appendChild(userInfo);
    newUser.appendChild(userOptions);

    return newUser;
}


async function createChatBubble(message) {
    const chatMainInner = document.getElementById('chat-area');

    // Create a new chat bubble container
    const bubbleContainer = document.createElement('div');
    bubbleContainer.classList.add('chat-bubble-contained');

    // add svg to message
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M20.3592 15.0357C20.4061 15.0243 20.4531 15.0124 20.5 15L21.5 6.5L10.2748 1L10.5353 6.92666C10.3266 15.6189 3.74902 19.9899 2 20.7395C11.1023 22.3944 18.0324 17.6364 20.3597 15.0506L20.3592 15.0357Z');
    path.setAttribute('fill', '#BE1731');
    const pathTwo = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    pathTwo.setAttribute('d', 'M20.3592 15.0357L20.2636 14.6443L19.9456 14.722L19.9565 15.0491L20.3592 15.0357ZM20.5 15L20.6025 15.3897L20.8681 15.3198L20.9002 15.0471L20.5 15ZM21.5 6.5L21.9002 6.54708L21.9335 6.26371L21.6773 6.13817L21.5 6.5ZM10.2748 1L10.4521 0.638172L9.84247 0.339472L9.87228 1.01769L10.2748 1ZM10.5353 6.92666L10.9381 6.93633L10.9384 6.92264L10.9378 6.90897L10.5353 6.92666ZM2 20.7395L1.84128 20.3691L0.610884 20.8964L1.92792 21.1359L2 20.7395ZM20.3597 15.0506L20.6592 15.3201L20.7678 15.1994L20.7624 15.0371L20.3597 15.0506ZM20.4548 15.4271C20.5041 15.4151 20.5533 15.4026 20.6025 15.3897L20.3975 14.6103C20.3528 14.6221 20.3082 14.6334 20.2636 14.6443L20.4548 15.4271ZM20.9002 15.0471L21.9002 6.54708L21.0998 6.45292L20.0998 14.9529L20.9002 15.0471ZM21.6773 6.13817L10.4521 0.638172L10.0975 1.36183L21.3227 6.86183L21.6773 6.13817ZM9.87228 1.01769L10.1328 6.94435L10.9378 6.90897L10.6774 0.982308L9.87228 1.01769ZM10.1325 6.91699C10.0307 11.156 8.37788 14.3371 6.53539 16.554C4.68577 18.7795 2.6554 20.0202 1.84128 20.3691L2.15872 21.1098C3.09362 20.7091 5.22655 19.3896 7.15514 17.0691C9.09087 14.74 10.8312 11.3895 10.9381 6.93633L10.1325 6.91699ZM1.92792 21.1359C11.2035 22.8224 18.2656 17.9796 20.6592 15.3201L20.0602 14.781C17.7992 17.2933 11.0011 21.9665 2.07208 20.343L1.92792 21.1359ZM20.7624 15.0371L20.7619 15.0223L19.9565 15.0491L19.957 15.064L20.7624 15.0371Z')
    pathTwo.setAttribute('fill', '#BE1731');
    svg.appendChild(path);
    svg.appendChild(pathTwo);

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
}

/*
*   Socket IO code goes in here
*/
socket.on('open-chat', (data) => {
    const {room, reciepient} = data;
    activeChatRoom = room.id;
    socket.join(activeChatRoom);
})


// Handle incoming messages from the server
socket.on('chatMessage', (data) => {
    // Extract message and sender information from the data
    const { message, sender } = data;
});

