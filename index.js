/*
    This code is the intellectual property of the owner.
    Unauthorized editing, removal, updating, adding, duplicating, selling, or reusing of this code is strictly prohibited.
*/

document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyAAM6hjI1C6BTdOzVuehvAsgViHU_ZeKx0",
        authDomain: "lhta-dcc46.firebaseapp.com",
        projectId: "lhta-dcc46",
        storageBucket: "lhta-dcc46.appspot.com",
        messagingSenderId: "263188180300",
        appId: "1:263188180300:web:b5f27fb7ab12078c2cf3e9"
    };

     // Initialize Firebase
     firebase.initializeApp(firebaseConfig);
     const auth = firebase.auth();
     const database = firebase.database();
 
     // Elements
     const loginButton = document.getElementById('loginButton');
     const saveButton = document.getElementById('saveButton');
     const savesCanvasBody = document.getElementById('saves_canvas_body');
    
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', googleSignIn);
    }

    function googleSignIn() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            const user = result.user;
            updateUIOnLogin(user);
        }).catch((error) => {
            console.error("Error signing in: ", error);
        });
    }

    function signOut() {
        auth.signOut().then(() => {
            updateUIOnLogout();
        }).catch((error) => {
            console.error("Error signing out: ", error);
        });
    }

    function updateUIOnLogin(user) {
        const usernameBar = document.getElementById('usernameBar');
        const usernameDrop = document.getElementById('usernameDrop');
        const userPicElement = document.querySelector('.avatar.avatar-sm');
        usernameBar.textContent = user.displayName;
        usernameDrop.textContent = user.displayName;
        userPicElement.src = user.photoURL;
        loginButton.textContent = 'Logout';
        loginButton.onclick = signOut;
        document.querySelector('.dropdown-item[data-bs-toggle="offcanvas"]').style.display = 'block';
        loadSavedLinks(user);
    }

    function updateUIOnLogout() {
        const usernameBar = document.getElementById('usernameBar');
        const usernameDrop = document.getElementById('usernameDrop');
        const userPicElement = document.querySelector('.avatar.avatar-sm');
        usernameBar.textContent = 'Annonymous';
        usernameDrop.textContent = 'Annonymous';
        userPicElement.src = 'https://em-content.zobj.net/source/microsoft-teams/363/person_1f9d1.png';
        loginButton.textContent = 'Login';
        loginButton.onclick = googleSignIn;
        document.querySelector('.dropdown-item[data-bs-toggle="offcanvas"]').style.display = 'none';
        savesCanvasBody.innerHTML = '<p>Please log in to see your saves.</p>';
    }

    function loadSavedLinks(user) {
        const userSavesRef = database.ref(`saves/${user.uid}`);
        userSavesRef.on('value', snapshot => {
            savesCanvasBody.innerHTML = '';
            const saves = snapshot.val();
            if (saves) {
                Object.keys(saves).forEach(saveId => {
                    const save = saves[saveId];
                    savesCanvasBody.innerHTML += `<div>${save.name}</div>`;
                });
            } else {
                savesCanvasBody.innerHTML = '<p>No saved links yet.</p>';
            }
        });
    }

    saveButton.addEventListener('click', () => {
        const user = auth.currentUser;
        if (!user) {
            alert("You need to be logged in to save links.");
            return;
        }

        const linkDetails = getCurrentLinkDetails();

        const userSavesRef = database.ref(`saves/${user.uid}`);
        userSavesRef.push(linkDetails).then(() => {
            alert("Link saved successfully!");
            updateLinkSavesCount(linkDetails.id, +1);
        }).catch(error => {
            console.error("Error saving link:", error);
        });
    });

    function getCurrentLinkDetails() {
        return {
            id: "linkId",
            name: "linkName",
            details: "linkDetails"
        };
    }

    function updateLinkSavesCount(linkId, delta) {
        const linkRef = database.ref(`links/${linkId}/saves`);
        linkRef.transaction(currentSaves => (currentSaves || 0) + delta);
    }

    const searchInput = document.getElementById('search');
    const filterElements = {
        source: document.querySelectorAll('input[name="filter-version"]'),
        body: document.querySelectorAll('input[name="filter-body"]'),
        race: document.querySelectorAll('input[name="filter-race"]'),
        sexuality: document.querySelectorAll('input[name="sexuality-filter"]'),
    };

    function filterlinks() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedSources = Array.from(filterElements.source).filter(el => el.checked).map(el => el.value);
        const selectedBody = Array.from(filterElements.body).filter(el => el.checked).map(el => el.value);
        const selectedRace = Array.from(filterElements.race).filter(el => el.checked).map(el => el.value);
        const selectedSexuality = Array.from(filterElements.sexuality).filter(el => el.checked).map(el => el.value);

        const filteredlinks = links
            .map((link, originalIndex) => ({ link, originalIndex }))
            .filter(({ link }) => {
                const tagsAsString = link.details.tags.join(' ').toLowerCase();
                const matchesSearch =
                    link.name.toLowerCase().includes(searchTerm) ||
                    link.link.toLowerCase().includes(searchTerm) ||
                    tagsAsString.includes(searchTerm);

                const matchesSource = !selectedSources.length || selectedSources.includes(link.details.source);
                const matchesBody = !selectedBody.length || selectedBody.includes(link.details.body);
                const matchesRace = !selectedRace.length || selectedRace.includes(link.details.race);
                const matchesSexuality = !selectedSexuality.length || selectedSexuality.includes(link.details.sexuality);

                return matchesSearch && matchesSource && matchesBody && matchesRace && matchesSexuality;
            })
            .map(({ link, originalIndex }) => ({
                ...link,
                originalIndex
            }));

        displayResults(filteredlinks);
    }

    function displayResults(filteredlinks) {
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = '';

        if (filteredlinks.length === 0) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            return;
        }

        filteredlinks.forEach(({ originalIndex, ...link }) => {
            const linkPrefix = link.details.source === 'reddit' ? 'u/' : '@';
            const linkElement = document.createElement('div');
            linkElement.classList.add('col-lg-4', 'col-sm-6');

            linkElement.innerHTML = `
                <div class="card shadow-4-hover">
                    <div class="card-body pb-5">
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                <img alt="Profile Picture" class="avatar rounded-1" src="${link.pfp}">
                            </div>
                            <div class="flex-1">
                                <a href="#" class="d-block font-semibold text-sm text-heading text-primary-hover">${link.name}</a>
                                <div class="text-xs text-muted line-clamp-1">${linkPrefix}${link.link}</div>
                            </div>
                            <div class="text-end">
                                <button type="button" class="btn btn-sm btn-neutral rounded-pill view-button" data-index="${originalIndex}">
                                    <i class="bi bi-folder2-open me-1"></i>
                                    <span>View</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            resultsContainer.appendChild(linkElement);
        });

        document.querySelectorAll('.view-button').forEach(button => {
            button.addEventListener('click', function () {
                const index = this.getAttribute('data-index');
                openCanvas(links[index]);
            });
        });
    }

    function openCanvas(link) {
        const linkPrefix = link.details.source === 'reddit' ? 'u/' : '@';
        const urlPrefix = link.details.source === 'reddit' ? 'https://www.reddit.com/user/' : 'https://x.com/';
        const fullUrl = urlPrefix + link.link;

        document.getElementById('link_canvas_label').textContent = `Profile of ${link.name}`;
        document.querySelector('.offcanvas-body').innerHTML = `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row g-0">
                        <div class="col">
                            <div class="d-flex align-items-center">
                                <div class="me-3">
                                    <img alt="Profile Picture" class="avatar rounded-1" src="${link.pfp}">
                                </div>
                                <div class="flex-1">
                                    <a href="#" class="d-block font-semibold text-sm text-heading text-primary-hover">${link.name}</a>
                                    <div class="text-xs text-muted line-clamp-1">${linkPrefix}${link.link}</div>
                                </div>
                                <div class="text-end">
                                    <a href="${fullUrl}" target="_blank" class="btn btn-sm btn-neutral rounded-pill">
                                        <i class="bi bi-caret-right me-1"></i>
                                        <span>Open</span>
                                    </a>
                                </div>
                            </div>
                            <hr class="my-7">
                            <div class="row justify-content-between align-items-center">
                                <div class="col-4">
                                    <span class="d-block h6 text-heading mb-0" id="link-rating">5.0</span>
                                    <span class="d-block text-sm text-muted">Rating</span>
                                </div>
                                <div class="col-4">
                                    <span class="d-block h6 text-heading mb-0" id="link-saves">0</span>
                                    <span class="d-block text-sm text-muted">Saves</span>
                                </div>
                                <div class="col-4">
                                    <span class="d-block h6 text-heading mb-0" id="link-opens">0</span>
                                    <span class="d-block text-sm text-muted">Opens</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-4">
                            <span class="d-block h6 text-heading mb-0">${link.details.sexuality}</span>
                            <span class="d-block text-sm text-muted">Sexuality</span>
                        </div>
                        <div class="col-4">
                            <span class="d-block h6 text-heading mb-0">${link.details.body}</span>
                            <span class="d-block text-sm text-muted">Body</span>
                        </div>
                        <div class="col-4">
                            <span class="d-block h6 text-heading mb-0">${link.details.race}</span>
                            <span class="d-block text-sm text-muted">Race</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card mb-3">
                <div class="card-body">
                    <span class="d-block h6 text-heading mb-0">Kinks</span>
                    <span class="d-block text-sm text-muted">${link.details.kinks.length > 0 ? link.details.kinks.join(', ') : 'N/A'}</span>
                    <hr class="my-3">
                    <span class="d-block h6 text-heading mb-0">Tags</span>
                    <span class="d-block text-sm text-muted">${link.details.tags.join(', ')}</span>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="d-block h6 text-heading mb-0">Give ${link.name} a rating</span>
                            <span class="d-block text-sm text-muted">0 Votes | Your Vote <b>5</b></span>
                        </div>
                        <button class="btn btn-sm btn-neutral ms-auto">Information</button>
                    </div>
                    <hr class="my-3">
                    <div class="rating mt-3">
                        ${[5, 4, 3, 2, 1].map(i => `
                            <input type="radio" id="star${i}" name="rate" value="${i}" />
                            <label title="${['Excellent!', 'Great!', 'Good', 'Okay', 'Bad'][5 - i]}" for="star${i}">
                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                                </svg>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const linkCanvas = new bootstrap.Offcanvas(document.getElementById('link_canvas'));
        linkCanvas.show();

        const savesElement = document.getElementById('link-saves');
        const linkRef = database.ref(`links/${link.id}/saves`);
        linkRef.on('value', snapshot => {
            const saves = snapshot.val() || 0;
            savesElement.textContent = saves;
        });

        const opensRef = database.ref(`links/${link.id}/opens`);
        opensRef.transaction(currentOpens => (currentOpens || 0) + 1);
    }

    const initialLinks = links.map((link, originalIndex) => ({
        ...link,
        originalIndex
    }));

    displayResults(initialLinks);

    searchInput.addEventListener('input', filterlinks);
    filterElements.source.forEach(el => el.addEventListener('change', filterlinks));
    filterElements.body.forEach(el => el.addEventListener('change', filterlinks));
    filterElements.race.forEach(el => el.addEventListener('change', filterlinks));
    filterElements.sexuality.forEach(el => el.addEventListener('change', filterlinks));
});