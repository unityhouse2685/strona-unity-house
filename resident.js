import { supabase } from "./supabase.js";

// Pobranie elementów z HTML
const form = document.querySelector(".new-ticket form");
const ticketsList = document.querySelector(".tickets-list");

// Wczytaj zgłoszenia po wejściu na stronę
loadTickets();

// Obsługa formularza zgłoszenia
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.querySelector("#title").value.trim();
    const desc = document.querySelector("#desc").value.trim();
    const category = document.querySelector("#category").value;
    const priority = document.querySelector("#priority").value;

    if (!title || !desc) {
        alert("Uzupełnij tytuł i opis.");
        return;
    }

    // Zapis do Supabase
    const { error } = await supabase
        .from("tickets")
        .insert({
            title,
            description: desc,
            category,
            priority,
            status: "new",
            attachment: null
        });

    if (error) {
        alert("Błąd zapisu: " + error.message);
        return;
    }

    form.reset();
    loadTickets();
});

// Pobieranie zgłoszeń z bazy
async function loadTickets() {
    const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Błąd pobierania:", error);
        return;
    }

    renderTickets(data);
}

// Renderowanie zgłoszeń
function renderTickets(tickets) {
    ticketsList.innerHTML = ""; // wyczyść listę

    if (tickets.length === 0) {
        ticketsList.innerHTML = "<p>Brak zgłoszeń.</p>";
        return;
    }

    tickets.forEach(t => {
        const card = document.createElement("div");
        card.className = "ticket-card";

        card.innerHTML = `
            <h3>${t.title}</h3>
            <p><strong>Kategoria:</strong> ${t.category}</p>
            <p><strong>Priorytet:</strong> ${t.priority}</p>
            <p><strong>Status:</strong> <span class="status-${t.status}">${mapStatus(t.status)}</span></p>
            <p><strong>Data:</strong> ${new Date(t.created_at).toLocaleString("pl-PL")}</p>
            <p><strong>Opis:</strong> ${t.description}</p>
            <p><strong>Załącznik:</strong> ${t.attachment || "Brak"}</p>
        `;

        ticketsList.appendChild(card);
    });
}

function mapStatus(s) {
    if (s === "new") return "Nowe";
    if (s === "progress") return "W trakcie";
    if (s === "closed") return "Zamknięte";
    return s;
}
