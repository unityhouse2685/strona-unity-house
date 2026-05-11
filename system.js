/* ============================================================
   KONFIGURACJA SUPABASE
============================================================ */

const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* ============================================================
   LOGOWANIE
============================================================ */

async function login(email, password) {
    // ADMIN
    const { data: admin } = await supabase
        .from("admins")
        .select("*")
        .eq("login", email)
        .eq("password", password)
        .single();

    if (admin) {
        localStorage.setItem("adminLogged", "true");
        return { ok: true, role: "admin", user: admin };
    }

    // MIESZKANIEC
    const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("login", email)
        .eq("password", password)
        .single();

    if (user) {
        localStorage.setItem("userLogin", user.login);
        localStorage.setItem("userId", user.id);
        return { ok: true, role: "resident", user };
    }

    return { ok: false, error: "Nieprawidłowe dane logowania." };
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
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

    ticketForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const attachments = [];
        for (let f of ticketFiles.files) {
            attachments.push({ name: f.name, type: f.type, size: f.size });
        }

        await supabase.from("tickets").insert({
            user_id: user.login,
            wspolnota: user.wspolnota,
            title: ticketTitle.value.trim(),
            desc: ticketDesc.value.trim(),
            category: ticketCategory.value,
            priority: ticketPriority.value,
            attachments: JSON.stringify(attachments),
            status: "Nowe",
            created_at: new Date().toISOString()
        });

        ticketForm.reset();
        renderResidentTicketsList(user);
    });

    renderResidentTicketsList(user);
}

async function renderResidentTicketsList(user) {
    const box = document.getElementById("residentTicketsList");

    const { data: tickets } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user.login)
        .order("created_at", { ascending: false });

    box.innerHTML = "";

    tickets.forEach(t => {
        const date = new Date(t.created_at).toLocaleString("pl-PL");

        box.innerHTML += `
            <div class="ticket-item">
                <strong>${t.title}</strong> (${t.category}, priorytet: ${t.priority})<br>
                <small>${date}</small><br>
                Status: <strong>${t.status}</strong><br>
                <div>${t.desc}</div>
                <div>Załączniki: ${
                    t.attachments
                        ? "<ul>" + JSON.parse(t.attachments).map(a => `<li>${a.name}</li>`).join("") + "</ul>"
                        : "<em>Brak</em>"
                }</div>
                <hr>
            </div>
        `;
    });
}


/* ============================================================
   ZGŁOSZENIA — ADMINISTRATOR
============================================================ */

async function initAdminTickets() {
    const box = document.getElementById("adminTicketsList");
    if (!box) return;

    const { data: tickets } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

    box.innerHTML = "";

    tickets.forEach(t => {
        const date = new Date(t.created_at).toLocaleString("pl-PL");

        box.innerHTML += `
            <div class="ticket-item">
                <strong>${t.title}</strong> (${t.category}, priorytet: ${t.priority})<br>
                <small>${date}</small><br>
                Użytkownik: <strong>${t.user_id}</strong><br>
                Status: <strong>${t.status}</strong><br>
                <div>${t.desc}</div>
                <div>Załączniki: ${
                    t.attachments
                        ? "<ul>" + JSON.parse(t.attachments).map(a => `<li>${a.name}</li>`).join("") + "</ul>"
                        : "<em>Brak</em>"
                }</div>
                <hr>
            </div>
        `;
    });
}
