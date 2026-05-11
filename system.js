/* ============================================================
   KONFIGURACJA SUPABASE
============================================================ */

const SUPABASE_URL = "https://ycuogutnwdybdeobowla.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdW9ndXRud2R5YmRlb2Jvd2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTE4NDAsImV4cCI6MjA5NDA2Nzg0MH0.ObkFIknc3Ce5KEmj435lI_8hi1T7E-lnxQuRSicZlPw";

window.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("system.js loaded");

/* ============================================================
   LOGOWANIE
============================================================ */

async function login(login, password) {
    try {
        // ADMIN
        const { data: admin, error: adminError } = await supabase
            .from("admins")
            .select("*")
            .eq("login", login)
            .eq("password", password)
            .single();

        if (adminError && adminError.code !== "PGRST116") {
            console.error(adminError);
            return { ok: false, error: "Błąd połączenia z bazą danych." };
        }

        if (admin) {
            localStorage.setItem("adminLogged", "true");
            localStorage.setItem("adminLogin", admin.login);
            return { ok: true, role: "admin", user: admin };
        }

        // MIESZKANIEC
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("login", login)
            .eq("password", password)
            .single();

        if (userError && userError.code !== "PGRST116") {
            console.error(userError);
            return { ok: false, error: "Błąd połączenia z bazą danych." };
        }

        if (user) {
            localStorage.setItem("userLogin", user.login);
            localStorage.setItem("userId", user.id);
            return { ok: true, role: "resident", user };
        }

        return { ok: false, error: "Nieprawidłowy login lub hasło." };
    } catch (err) {
        console.error(err);
        return { ok: false, error: "Wystąpił nieoczekiwany błąd." };
    }
}

/* ============================================================
   WYLOGOWANIE
============================================================ */

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

/* ============================================================
   ZGŁOSZENIA MIESZKAŃCA
============================================================ */

async function initResidentTickets(user) {
    const section = document.getElementById("ticketsSection");
    if (!section) return;

    section.innerHTML = `
        <h3>Twoje zgłoszenia</h3>
        <form id="ticketForm" class="ticket-form">
            <input type="text" id="ticketTitle" placeholder="Tytuł zgłoszenia" required>
            <textarea id="ticketDesc" placeholder="Opis zgłoszenia" required></textarea>
            <button class="btn gold">Wyślij zgłoszenie</button>
        </form>
        <div id="ticketList"></div>
    `;

    document.getElementById("ticketForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("ticketTitle").value.trim();
        const desc = document.getElementById("ticketDesc").value.trim();

        if (!title || !desc) return alert("Uzupełnij wszystkie pola.");

        const { error } = await supabase.from("tickets").insert({
            title,
            description: desc,
            user_id: user.id,
            status: "Nowe",
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error(error);
            alert("Nie udało się wysłać zgłoszenia.");
        } else {
            alert("Zgłoszenie wysłane!");
            loadResidentTickets(user);
        }
    });

    loadResidentTickets(user);
}

async function loadResidentTickets(user) {
    const list = document.getElementById("ticketList");
    if (!list) return;

    const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        list.innerHTML = "<p>Błąd ładowania zgłoszeń.</p>";
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = "<p>Brak zgłoszeń.</p>";
        return;
    }

    list.innerHTML = data.map(t => `
        <div class="ticket-item">
            <h4>${t.title}</h4>
            <p>${t.description}</p>
            <span class="status">${t.status}</span>
        </div>
    `).join("");
}

/* ============================================================
   PANEL ADMINA – LISTA ZGŁOSZEŃ
============================================================ */

async function loadAdminTickets() {
    const list = document.getElementById("adminTickets");
    if (!list) return;

    const { data, error } = await supabase
        .from("tickets")
        .select("*, users(login)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        list.innerHTML = "<p>Błąd ładowania zgłoszeń.</p>";
        return;
    }

    list.innerHTML = data.map(t => `
        <div class="ticket-item">
            <h4>${t.title}</h4>
            <p>${t.description}</p>
            <p><b>Użytkownik:</b> ${t.users?.login || "Nieznany"}</p>
            <span class="status">${t.status}</span>
        </div>
    `).join("");
}
