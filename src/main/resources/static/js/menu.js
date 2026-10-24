document.addEventListener("DOMContentLoaded", function () {
    const dialog = document.getElementById("menuDialog");
    const closeButton = document.getElementById("menuDialogClose");
    const image = document.getElementById("menuDialogImage");
    const title = document.getElementById("menuDialogTitle");
    const description = document.getElementById("menuDialogDescription");
    const category = document.getElementById("menuDialogCategory");
    const price = document.getElementById("menuDialogPrice");
    const status = document.getElementById("menuDialogStatus");

    document.querySelectorAll(".menu-info-button").forEach(function (button) {
        button.addEventListener("click", function () {
            const isAvailable = button.dataset.available === "true";

            title.textContent = button.dataset.name || "";
            description.textContent = button.dataset.description || "";
            category.textContent = button.dataset.category || "";
            price.textContent = "$" + (button.dataset.price || "0.00");
            status.textContent = isAvailable ? "Disponible" : "No disponible";
            status.classList.toggle("is-unavailable", !isAvailable);
            image.src = button.dataset.image || "";
            image.alt = button.dataset.name || "";

            dialog.showModal();
        });
    });

    closeButton.addEventListener("click", function () {
        dialog.close();
    });

    dialog.addEventListener("click", function (event) {
        if (event.target === dialog) {
            dialog.close();
        }
    });
});
