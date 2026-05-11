/* ============================================================
   STABILNA INICJALIZACJA — NIE BLOKUJE LOGOWANIA
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    try { initRegisterPage(); } catch (e) { console.warn("Register init error:", e); }
    try { initLoginPage(); } catch (e) { console.warn("Login init error:", e); }
    try { initResidentPanel(); } catch (e) { console.warn("Resident init error:", e); }
    try { initAdminPanel(); } catch (e) { console.warn("Admin init error:", e); }
});

/* ============================================================
   KONFIGURACJA
============================================================ */

const UH_COMMUNITIES = [
    "Unity House Gostyń",
    "Unity House Leszno",
    "Unity House Poznań",
    "Unity House Wrocław"
];

const ADMIN_LOGIN = "unity.housegostyn@gmail.com";
const ADMIN_PASSWORD = "!Terminal2685";

const LS_USERS = "uh_users";
const LS_CURRENT_USER = "uh_current_user";
const LS_TICKETS = "uh_tickets";
const LS_ANNOUNCEMENTS = "uh_announcements";
const LS_REGULATIONS = "uh_regulations";

const TICKET_CATEGORIES = [
    "Elektryka",
    "Woda / Kanalizacja",
    "Czystość i porządek",
    "Uszkodzenia budynku",
    "Inne"
];

const TICKET_PRIORITIES = ["Niski", "Normalny", "Wysoki"];
const TICKET_STATUSES = ["Nowe", "W trakcie", "Zamknięte"];

/* ============================================================
   LOCALSTORAGE — POMOCNICZE
============================================================ */

function getUsers() { return JSON.parse(localStorage.getItem(LS_USERS)) || []; }
function saveUsers(users) { localStorage.setItem(LS_USERS, JSON.stringify(users)); }

function setCurrentUser(user) { localStorage.setItem(LS_CURRENT_USER, JSON.stringify(user)); }
function getCurrentUser() { return JSON.parse(localStorage.getItem(LS_CURRENT_USER)); }
function clearCurrentUser() { localStorage.removeItem(LS_CURRENT_USER); }

function getTickets() { return JSON.parse(localStorage.getItem(LS_TICKETS)) || []; }
function saveTickets(tickets) { localStorage.setItem(LS_TICKETS, JSON.stringify(tickets)); }

function getAnnouncements() { return JSON.parse(localStorage.getItem(LS_ANNOUNCEMENTS)) || []; }
function saveAnnouncements(list) { localStorage.setItem(LS_ANNOUNCEMENTS, JSON.stringify(list)); }

function getRegulations() { return JSON.parse(localStorage.getItem(LS_REGULATIONS)) || []; }
function saveRegulations(list) { localStorage.setItem(LS_REGULATIONS, JSON.stringify(list)); }

/* ============================================================
   REJESTRACJA
============================================================ */

function initRegisterPage() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    UH_COMMUNITIES.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        wspolnota.appendChild(opt);
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const users = getUsers();

        users.push({
            id: Date.now(),
            fullname: fullname.value.trim(),
            address: address.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            wspolnota: wspolnota.value,
            password: password.value.trim(),
            approved: false,
            role: "resident"
        });

        saveUsers(users);

        alert("Konto utworzone. Oczekuje na zatwierdzenie przez administratora.");
        window.location.href = "login.html";
    });
}

/* ============================================================
   LOGOWANIE — POPRAWIONE
============================================================ */

function initLoginPage() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        // ADMIN
        if (email === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
            setCurrentUser({ role: "admin", email });
            window.location.href = "admin.html";
            return;
        }

        // MIESZKANIEC
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            alert("Nieprawidłowy e‑mail lub hasło.");
            return;
        }

        if (!user.approved) {
            alert("Twoje konto oczekuje na zatwierdzenie przez administratora.");
            return;
        }

        setCurrentUser(user);
        window.location.href = "resident.html";
    });
}

/* ============================================================
   PANEL MIESZKAŃCA
============================================================ */

function initResidentPanel() {
    const panel = document.getElementById("residentPanel");
    if (!panel) return;

    const user = getCurrentUser();
    if (!user || user.role !== "resident") {
        window.location.href = "login.html";
        return;
    }

    residentInfo.textContent = `${user.fullname} – ${user.wspolnota}`;

    initResidentTickets(user);
    initResidentAnnouncements(user);
    initResidentRegulations(user);
}

/* ============================================================
   ZGŁOSZENIA — MIESZKANIEC
============================================================ */

function initResidentTickets(user) {
    const section = document.getElementById("ticketsSection");
    if (!section) return;

    section.innerHTML = `
        <form id="ticketForm">
            <h3>Nowe zgłoszenie</h3>

            <label>Tytuł</label>
            <input type="text" id="ticketTitle" required>

            <label>Opis</label>
            <textarea id="ticketDesc" required></textarea>

            <label>Kategoria</label>
            <select id="ticketCategory"></select>

            <label>Priorytet</label>
            <select id="ticketPriority"></select>

            <label>Załączniki</label>
            <input type="file" id="ticketFiles" multiple>

            <button type="submit">Wyślij zgłoszenie</button>

            <hr>

            <h3>Twoje zgłoszenia</h3>
            <div id="residentTicketsList"></div>
        </form>
    `;

    TICKET_CATEGORIES.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        ticketCategory.appendChild(opt);
    });

    TICKET_PRIORITIES.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        ticketPriority.appendChild(opt);
    });

    ticketForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const attachments = [];
        for (let f of ticketFiles.files) {
            attachments.push({ name: f.name, type: f.type, size: f.size });
        }

        const tickets = getTickets();
        tickets.push({
            id: Date.now(),
            userId: user.id,
            wspolnota: user.wspolnota,
            title: ticketTitle.value.trim(),
            desc: ticketDesc.value.trim(),
            category: ticketCategory.value,
            priority: ticketPriority.value,
            attachments,
            status: "Nowe",
            createdAt: new Date().toISOString()
        });

        saveTickets(tickets);
        ticketForm.reset();
        renderResidentTicketsList(user);
    });

    renderResidentTicketsList(user);
}

function renderResidentTicketsList(user) {
    const box = document.getElementById("residentTicketsList");
    const tickets = getTickets()
        .filter(t => t.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    box.innerHTML = "";

    tickets.forEach(t => {
        const date = new Date(t.createdAt).toLocaleString("pl-PL");

        box.innerHTML += `
            <div class="ticket-item">
                <strong>${t.title}</strong> (${t.category}, priorytet: ${t.priority})<br>
                <small>${date}</small><br>
                Status: <strong>${t.status}</strong><br>
                <div>${t.desc}</div>
                <div>Załączniki: ${
                    t.attachments.length
                        ? "<ul>" + t.attachments.map(a => `<li>${a.name}</li>`).join("") + "</ul>"
                        : "<em>Brak</em>"
                }</div>
                <hr>
            </div>
        `;
    });
}

/* ============================================================
   PANEL ADMINA
============================================================ */

function initAdminPanel() {
    const panel = document.getElementById("adminPanel");
    if (!panel) return;

    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
        window.location.href = "login.html";
        return;
    }

    renderPendingUsers();
    renderAdminTickets();
    renderAdminDashboard();
    initAdminAnnouncements();
    initAdminRegulations();
}

/* ============================================================
   ZATWIERDZANIE UŻYTKOWNIKÓW
============================================================ */

function renderPendingUsers() {
    const box = pendingUsers;
    const users = getUsers().filter(u => !u.approved);

    box.innerHTML = "";

    if (users.length === 0) {
        box.textContent = "Brak oczekujących rejestracji.";
        return;
    }

    users.forEach(u => {
        box.innerHTML += `
            <div>
                <strong>${u.fullname}</strong><br>
                ${u.email} | ${u.phone}<br>
                ${u.address} | ${u.wspolnota}<br>
                <button data-id="${u.id}" data-action="approve">Zatwierdź</button>
                <button data-id="${u.id}" data-action="reject">Odrzuć</button>
                <hr>
            </div>
        `;
    });

    box.onclick = (e) => {
        if (e.target.tagName !== "BUTTON") return;

        const id = Number(e.target.dataset.id);
        const action = e.target.dataset.action;

        let users = getUsers();

        if (action === "approve") {
            users.find(u => u.id === id).approved = true;
        } else {
            users = users.filter(u => u.id !== id);
        }

        saveUsers(users);
        renderPendingUsers();
    };
}

/* ============================================================
   ZGŁOSZENIA — ADMIN
============================================================ */

function renderAdminTickets() {
    const box = adminTickets;
    const tickets = getTickets().sort((a, b) => {
        if (a.wspolnota < b.wspolnota) return -1;
        if (a.wspolnota > b.wspolnota) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const users = getUsers();

    box.innerHTML = "";

    tickets.forEach(t => {
        const user = users.find(u => u.id === t.userId);
        const date = new Date(t.createdAt).toLocaleString("pl-PL");

        box.innerHTML += `
            <div class="admin-ticket">
                <strong>${t.title}</strong> (${t.category}, priorytet: ${t.priority})<br>
                <small>${date} | ${t.wspolnota}</small><br>
                Autor: ${user.fullname} (${user.email})<br>

                Status:
                <select data-id="${t.id}" class="ticket-status">
                    ${TICKET_STATUSES.map(s => `<option value="${s}" ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}
                </select>

                <div>${t.desc}</div>

                <div>Załączniki: ${
                    t.attachments.length
                        ? "<ul>" + t.attachments.map(a => `<li>${a.name}</li>`).join("") + "</ul>"
                        : "<em>Brak</em>"
                }</div>

                <hr>
            </div>
        `;
    });

    box.onchange = (e) => {
        if (!e.target.classList.contains("ticket-status")) return;

        const id = Number(e.target.dataset.id);
        const newStatus = e.target.value;

        const tickets = getTickets();
        tickets.find(t => t.id === id).status = newStatus;

        saveTickets(tickets);
        renderAdminDashboard();
    };
}

/* ============================================================
   DASHBOARD
============================================================ */

function renderAdminDashboard() {
    const box = adminDashboard;
    const tickets = getTickets();

    box.innerHTML = `
        <strong>Nowe:</strong> ${tickets.filter(t => t.status === "Nowe").length} |
        <strong>W trakcie:</strong> ${tickets.filter(t => t.status === "W trakcie").length} |
        <strong>Zamknięte:</strong> ${tickets.filter(t => t.status === "Zamknięte").length}
    `;
}

/* ============================================================
   OGŁOSZENIA — ADMIN
============================================================ */

function initAdminAnnouncements() {
    const form = document.getElementById("announcementForm");
    if (!form) return;

    annTargetMode.addEventListener("change", () => {
        annUsersSelect.style.display = annTargetMode.value === "selected" ? "block" : "none";
        if (annTargetMode.value === "selected") renderAnnouncementUserList();
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = annTitle.value.trim();
        const content = annContent.value.trim();
        const mode = annTargetMode.value;

        let targetUsers = [];
        if (mode === "selected") {
            document.querySelectorAll(".ann-user-checkbox:checked")
                .forEach(cb => targetUsers.push(Number(cb.value)));
        }

        const announcements = getAnnouncements();
        announcements.push({
            id: Date.now(),
            title,
            content,
            mode,
            targetUsers,
            createdAt: new Date().toISOString()
        });

        saveAnnouncements(announcements);
        form.reset();
        annUsersSelect.style.display = "none";

        renderAdminAnnouncementsList();
    });

    renderAdminAnnouncementsList();
}

function renderAnnouncementUserList() {
    const box = annUsersSelect;
    const users = getUsers().filter(u => u.approved);

    box.innerHTML = "";

    users.forEach(u => {
        box.innerHTML += `
            <label>
                <input type="checkbox" class="ann-user-checkbox" value="${u.id}">
                ${u.fullname} (${u.email})
            </label><br>
        `;
    });
}

function renderAdminAnnouncementsList() {
    const box = adminAnnouncementsList;
    const announcements = getAnnouncements().sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    box.innerHTML = "";

    announcements.forEach(a => {
        const date = new Date(a.createdAt).toLocaleString("pl-PL");

        box.innerHTML += `
            <div class="admin-announcement">
                <strong>${a.title}</strong><br>
                <small>${date}</small><br>
                <div>${a.content}</div>
                <em>Tryb: ${a.mode === "all" ? "wszyscy mieszkańcy" : "wybrani mieszkańcy"}</em><br>
                <button data-id="${a.id}" class="ann-delete-btn">Usuń</button>
                <hr>
            </div>
        `;
    });

    box.onclick = (e) => {
        if (!e.target.classList.contains("ann-delete-btn")) return;

        const id = Number(e.target.dataset.id);
        let list = getAnnouncements();
        list = list.filter(a => a.id !== id);
        saveAnnouncements(list);

        renderAdminAnnouncementsList();
    };
}

/* ============================================================
   OGŁOSZENIA — MIESZKANIEC
============================================================ */

function initResidentAnnouncements(user) {
    const box = announcementsSection;

    const announcements = getAnnouncements().filter(a => {
        if (a.mode === "all") return true;
        return a.targetUsers.includes(user.id);
    });

    announcements.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    box.innerHTML = "";

    announcements.forEach(a => {
        const date = new Date(a.createdAt).toLocaleString("pl-PL");

        box.innerHTML += `
            <div class="resident-announcement">
                <strong>${a.title}</strong><br>
                <small>${date}</small><br>
                <div>${a.content}</div>
                <hr>
            </div>
        `;
    });
}

/* ============================================================
   REGULAMINY — ADMIN
============================================================ */

function initAdminRegulations() {
    const form = document.getElementById("regulationForm");
    if (!form) return;

    regCommunity.innerHTML = "";
    UH_COMMUNITIES.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w;
        opt.textContent = w;
        regCommunity.appendChild(opt);
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = regTitle.value.trim();
        const wspolnota = regCommunity.value;
        const file = regFile.files[0];

        if (!title || !file || !wspolnota) {
            alert("Uzupełnij wszystkie pola.");
            return;
        }

        const regulations = getRegulations();

        regulations.push({
            id: Date.now(),
            title,
            wspolnota,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            createdAt: new Date().toISOString()
        });

        saveRegulations(regulations);

        form.reset();
        renderAdminRegulationsList();
    });

    renderAdminRegulationsList();
}

function renderAdminRegulationsList() {
    const box = adminRegulationsList;
    const regulations = getRegulations().sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    box.innerHTML = "";

    regulations.forEach(r => {
        const date = new Date(r.createdAt).toLocaleString("pl-PL");

        box.innerHTML += `
            <div class="admin-regulation">
                <strong>${r.title}</strong><br>
                <small>${date}</small><br>
                <em>${r.wspolnota}</em><br>
                <div>Plik: ${r.fileName} (${Math.round(r.fileSize / 1024)} KB)</div>
                <button data-id="${r.id}" class="reg-delete-btn">Usuń</button>
                <hr>
            </div>
        `;
    });

    box.onclick = (e) => {
        if (!e.target.classList.contains("reg-delete-btn")) return;

        const id = Number(e.target.dataset.id);
        let list = getRegulations();
        list = list.filter(r => r.id !== id);
        saveRegulations(list);

        renderAdminRegulationsList();
    };
}

/* ============================================================
   REGULAMINY — MIESZKANIEC
============================================================ */

function initResidentRegulations(user) {
    const box = regulationsSection;
    const regulations = getRegulations().filter(r => r.wspolnota === user.wspolnota);

    box.innerHTML = "";

    regulations.forEach(r => {
        const date = new Date(r.createdAt).toLocaleString("pl-PL");

        box.innerHTML += `
            <div class="resident-regulation">
                <strong>${r.title}</strong><br>
                <small>${date}</small><br>
                <em>${r.wspolnota}</em><br>
                <div>Plik: ${r.fileName} (${Math.round(r.fileSize / 1024)} KB)</div>
                <hr>
            </div>
        `;
    });
}

