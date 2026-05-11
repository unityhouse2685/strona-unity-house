import { supabase } from "./supabase.js";

/* ==========================
   ŁADOWANIE ZGŁOSZEŃ
========================== */

async function loadTickets() {
    const table = document.getElementById("tickets-table-body");
    table.innerHTML = "<tr><td colspan='6'>Ładowanie...</td></tr>";

    const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Błąd pobierania:", error);
        table.innerHTML = "<tr><td colspan='6'>Błąd pobierania danych</td></tr>";
        return;
    }

    if (!data || data.length === 0) {
        table.innerHTML = "<tr><td colspan='6'>Brak zgłoszeń</td></tr>";
        return;
    }

    table.innerHTML = "";

    data.forEach(ticket => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${ticket.id}</td>
            <td>${ticket.category || "-"}</td>
            <td>${ticket.priority || "-"}</td>
            <td>
                <select data-id="${ticket.id}" class="status-select">
                    <option value="Nowe" ${ticket.status === "Nowe" ? "selected" : ""}>Nowe</option>
                    <option value="W trakcie" ${ticket.status === "W trakcie" ? "selected" : ""}>W trakcie</option>
                    <option value="Zakończone" ${ticket.status === "Zakończone" ? "selected" : ""}>Zakończone</option>
                </select>
            </td>
            <td>${new Date(ticket.created_at).toLocaleString()}</td>
            <td>
                <button class="details-btn" data-id="${ticket.id}">Szczegóły</button>
            </td>
        `;

        table.appendChild(row);
    });

    attachStatusListeners();
    attachDetailsListeners();
}

/* ==========================
   ZMIANA STATUSU
========================== */

function attachStatusListeners() {
    document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", async (e) => {
            const id = e.target.dataset.id;
            const newStatus = e.target.value;

            const { error } = await supabase
                .from("tickets")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) {
                alert("Błąd zmiany statusu");
                console.error(error);
            }
        });
    });
}

/* ==========================
   SZCZEGÓŁY ZGŁOSZENIA
========================== */

function attachDetailsListeners() {
    document.querySelectorAll(".details-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            const { data, error } = await supabase
                .from("tickets")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                alert("Błąd pobierania szczegółów");
                return;
            }

            alert(
                `Kategoria: ${data.category}\n` +
                `Priorytet: ${data.priority}\n` +
                `Status: ${data.status}\n\n` +
                `Opis:\n${data.description}`
            );
        });
    });
}

/* ==========================
   START
========================== */

document.addEventListener("DOMContentLoaded", loadTickets);
