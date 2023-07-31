const search = document.querySelector('.input-group input'),
    table_rows = document.querySelectorAll('tbody tr'),
    table_headings = document.querySelectorAll('thead th');

// 1. Searching for specific data of HTML table
search.addEventListener('input', searchTable);

function searchTable() {
    table_rows.forEach((row, i) => {
        let table_data = row.textContent.toLowerCase(),
            search_data = search.value.toLowerCase();

        row.classList.toggle('hide', table_data.indexOf(search_data) < 0);
        row.style.setProperty('--delay', i / 25 + 's');
    })

    document.querySelectorAll('tbody tr:not(.hide)').forEach((visible_row, i) => {
        visible_row.style.backgroundColor = (i % 2 == 0) ? 'transparent' : '#0000000b';
    });
}

// 2. Sorting | Ordering data of HTML table

table_headings.forEach((head, i) => {
    let sort_asc = true;
    head.onclick = () => {
        table_headings.forEach(head => head.classList.remove('active'));
        head.classList.add('active');

        document.querySelectorAll('td').forEach(td => td.classList.remove('active'));
        table_rows.forEach(row => {
            row.querySelectorAll('td')[i].classList.add('active');
        })

        head.classList.toggle('asc', sort_asc);
        sort_asc = head.classList.contains('asc') ? false : true;

        sortTable(i, sort_asc);
    }
})


function sortTable(column, sort_asc) {
    [...table_rows].sort((a, b) => {
        let first_row = a.querySelectorAll('td')[column].textContent.toLowerCase(),
            second_row = b.querySelectorAll('td')[column].textContent.toLowerCase();

        return sort_asc ? (first_row < second_row ? 1 : -1) : (first_row < second_row ? -1 : 1);
    })
        .map(sorted_row => document.querySelector('tbody').appendChild(sorted_row));
}

// 3. Converting HTML table to PDF

const pdf_btn = document.querySelector('#toPDF');
const customers_table = document.querySelector('#customers_table');

const toPDF = function (customers_table) {
    const html_code = `
    <link rel="stylesheet" href="style.css">
    <main class="table" >${customers_table.innerHTML}</main>
    `;

    const new_window = window.open();
    new_window.document.write(html_code);

    setTimeout(() => {
        new_window.print();
        new_window.close();
    }, 400);
}

pdf_btn.onclick = () => {
    toPDF(customers_table);
}

// 4. Converting HTML table to JSON

const json_btn = document.querySelector('#toJSON');

const toJSON = function (table) {
    let table_data = [],
        t_head = [],

        t_headings = table.querySelectorAll('th'),
        t_rows = table.querySelectorAll('tbody tr');

    for (let t_heading of t_headings) {
        let actual_head = t_heading.textContent.trim().split(' ');

        t_head.push(actual_head.splice(0, actual_head.length - 1).join(' ').toLowerCase());
    }

    t_rows.forEach(row => {
        const row_object = {},
            t_cells = row.querySelectorAll('td');

        t_cells.forEach((t_cell, cell_index) => {
            const img = t_cell.querySelector('img');
            if (img) {
                row_object['customer image'] = decodeURIComponent(img.src);
            }
            row_object[t_head[cell_index]] = t_cell.textContent.trim();
        })
        table_data.push(row_object);
    })

    return JSON.stringify(table_data, null, 4);
}

var editIcons = document.querySelectorAll(".edit-icon");
var popupContainer = document.getElementById("popupContainer");
var editForm = document.getElementById("editForm");

editIcons.forEach(function (editIcon, index) {
    editIcon.addEventListener("click", function () {
        openPopup(index);
    });
});

function openPopup(index) {
    // Get the table row values based on the index
    var tableRow = document.querySelectorAll("tbody tr")[index];
    var movieName = tableRow.cells[1].textContent;
    var userName = tableRow.cells[2].textContent;
    var bookingDate = tableRow.cells[3].textContent;
    var location = tableRow.cells[4].textContent;
    var hallName = tableRow.cells[5].textContent;
    var seatNumber = tableRow.cells[6].textContent;
    var amount = tableRow.cells[7].textContent;

    // Set the form field values
    editForm.elements.movieName.value = movieName;
    editForm.elements.userName.value = userName;
    editForm.elements.bookingDate.value = bookingDate;
    editForm.elements.location.value = location;
    editForm.elements.hallName.value = hallName;
    editForm.elements.seatNumber.value = seatNumber;
    editForm.elements.amount.value = amount;

    // Show the popup
    popupContainer.style.display = "flex";
}

function closePopup() {
    // Reset the form
    editForm.reset();

    // Hide the popup
    popupContainer.style.display = "none";
}







