const parseCookies = () => {
    const cookies = document.cookie.split(";");
    const result = {};

    for (const cookie of cookies) {
        if (!cookie.includes("=")) {
            continue;
        }

        const [key, value] = cookie.split("=");
        result[key.trim()] = value.trim();
    }

    return result;
};

const validateInput = function (json) {
    if (json.name == null || json.name == "") {
        alert("Item name cannot be empty");
        return false;
    }
    if (json.price == null || json.price == 0 || isNaN(json.price)) {
        alert("Price must be a positive decimal number");
        return false;
    }
    if (json.quantity == null || json.quantity == 0 || isNaN(json.quantity)) {
        alert("Quantity must be a positive number");
        return false;
    }

    return true;
};

const submit = async function (event) {
    // stop form submission from trying to load
    // a new .html page for displaying results...
    // this was the original browser behavior and still
    // remains to this day
    event.preventDefault();

    const nameInput = document.querySelector("#itemName"),
        quantityInput = document.querySelector("#itemQuantity"),
        priceInput = document.querySelector("#itemPrice"),
        descriptionInput = document.querySelector("#itemDescription"),
        json = {
            name: nameInput.value,
            quantity: Number(quantityInput.value),
            price: Number(priceInput.value),
            description: descriptionInput.value,
        },
        body = JSON.stringify(json);

    // Validating input
    if (!validateInput(json)) {
        return;
    }

    // Adding the item to the list
    const response = await fetch("/data", {
        method: "POST",
        body: body,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parseCookies().accessToken}`,
        },
    });

    // Revalidating data
    await revalidate();

    // Clearing the form
    nameInput.value = "";
    priceInput.value = "";
    quantityInput.value = "";
    descriptionInput.value = "";
};

window.onload = async function () {
    const button = document.querySelector("#newItemSubmit");
    button.onclick = submit;

    await revalidate();
};

const revalidate = async () => {
    // Building the table layout
    let tr = document.createElement("tr");
    const headers = ["Item", "Description", "Price", "Quantity", "Total"];
    headers.forEach((headerText) => {
        const th = document.createElement("th");
        th.textContent = headerText;
        tr.appendChild(th);
    });
    document.querySelector("#list").innerHTML = tr.outerHTML;

    // Loading icon
    let loading = document.createElement("div");
    loading.innerHTML = "loading...";

    // Displaying loading icon while revalidating
    document.querySelector("#list").appendChild(loading);
    const accessToken = parseCookies().accessToken;
    const response = await fetch("/data", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    document.querySelector("#list").removeChild(loading);

    // Displaying new data
    let total = 0;
    for (const item of data) {
        // Each row
        tr = document.createElement("tr");
        tr.classList.add("record");
        tr.id = `record-${item.index}`;

        let td = document.createElement("td");
        // Item Name
        td.innerHTML = item.name;
        td.contentEditable = true;
        td.onblur = editableListener;
        td.classList.add("name");
        tr.appendChild(td);
        // Item Description
        td = document.createElement("td");
        td.innerHTML = item.description || "";
        td.contentEditable = true;
        td.onblur = editableListener;
        td.classList.add("description");
        tr.appendChild(td);
        // Item Price
        td = document.createElement("td");
        td.innerHTML = item.price;
        td.contentEditable = true;
        td.onblur = editableListener;
        td.classList.add("price");
        tr.appendChild(td);
        // Item Quantity
        td = document.createElement("td");
        td.innerHTML = item.quantity;
        td.contentEditable = true;
        td.onblur = editableListener;
        td.classList.add("quantity");
        tr.appendChild(td);
        // Item Total, derived value
        td = document.createElement("td");
        td.innerHTML = item.total;
        td.contentEditable = true;
        td.onblur = editableListener;
        td.classList.add("total");
        tr.appendChild(td);

        // Delete button
        td = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("recordButton", "block", "round");
        td.innerHTML = deleteButton.outerHTML;
        td.onclick = () => onDelete(item.index);
        tr.appendChild(td);

        document.querySelector("#list").appendChild(tr);

        total += item.total;
    }

    // Displaying grand total
    document.querySelector("#total").innerHTML = total;
};

const onDelete = async function (i) {
    const confirmation = confirm("Are you sure you want to delete this item?");

    if (!confirmation) {
        return;
    }

    const body = JSON.stringify({
        index: i,
    });
    const response = await fetch("/data", {
        method: "DELETE",
        body,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parseCookies().accessToken}`,
        },
    });

    await revalidate();
};

const editableListener = async function (event) {
    const row = this.parentNode;

    let body = {
        index: Number(row.id.split("-")[1]),
    };
    for (const child of row.children) {
        const content = child.innerText;

        if (Number(content)) {
            body[child.classList[0]] = Number(content);
        } else if (content !== "Delete") {
            body[child.classList[0]] = content;
        }
    }

    // Validating input
    if (!validateInput(body)) {
        return;
    }

    await fetch("/data", {
        method: "PUT",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parseCookies().accessToken}`,
        },
    });

    await revalidate();
};
