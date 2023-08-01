
var popupContainer = document.getElementById("popupContainer");
var userManagement = document.getElementById("userManagement");

function openPopup() {
    popupContainer.style.display = "block";
}

function closePopup() {
    popupContainer.style.display = "none";
}

function toggleUserManagementPanel() {
    userManagement.classList.toggle("open");
}
//
//
//
////
/////
// Chart 1 data
const chartData1 = {
    labels: ["Meto Pema", "The Cub", "Agay Zheom", "AP Bokto", "Bardo"],
    data: [480, 420, 405, 390, 376],
};

const myChart1 = new Chart(document.querySelector(".my-chart1"), {
    type: "bar",
    data: {
        labels: chartData1.labels,
        datasets: [{
            label: "Movie Name",
            data: chartData1.data,
            backgroundColor: ["#5988e1"],
            borderWidth: 1,
        },],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Movie Names",
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Number of Ticket(s)",
                },
                beginAtZero: true,
            },
        },
        layout: {
            padding: 30,


        },
    },
});

// Chart 2 data
// <!-- Assuming the total tickets for Normal Room and VIP Room is 800 -->
const totalTickets = 800;
const chartData2 = {
    labels: ["Normal Room", "VIP Room"],
    data: [600, 200], // Adjust these values as needed
};
//
// Calculate percentages for each room type
const percentageNormalRoom = ((chartData2.data[0] / totalTickets) * 100).toFixed(2);
const percentageVipRoom = ((chartData2.data[1] / totalTickets) * 100).toFixed(2);
//
// Function to update Chart 2 based on the selected time period
function updateChart2() {
    const timePeriodDropdown =
        document.getElementById("timePeriodDropdown");
    const selectedTimePeriod = timePeriodDropdown.value;

    // Modify chartData2.data based on the selected time period
    // For example, you can have different revenue data for each time period
    let updatedChartData;
    switch (selectedTimePeriod) {
        // case "weekly":
        //     updatedChartData = [500, 300]; // Adjust the weekly revenue data
        //     break;
        case "monthly":
            updatedChartData = [600, 200]; // Adjust the monthly revenue data
            break;
        case "yearly":
            updatedChartData = [650, 150]; // Adjust the yearly revenue data
            break;
        default:
            updatedChartData = [700, 100];
    }

    // Update the chart data and re-render the chart
    myChart2.data.datasets[0].data = updatedChartData;
    myChart2.update();
}
//
// Update the legend to display the percentages
const legendCallbacks = {
    label: (context) => {
        const label = context.label;
        const index = context.dataIndex;
        const value = context.raw;
        const percentage = index === 0 ? percentageNormalRoom : percentageVipRoom;
        return `${label}: ${value} (${percentage}%)`;
    },
};
//

const myChart2 = new Chart(document.querySelector(".my-chart2"), {
    type: "doughnut", // Use "doughnut" for a donut chart
    data: {
        labels: chartData2.labels,
        datasets: [{
            data: chartData2.data,
            backgroundColor: ["#395589 ", "#8294b5"], // Set the colors for the donut segments
            borderWidth: 0,
            borderColor: "#059669", // Set borderWidth to 0 for the inner circle
        },],
    },
    options: {
        responsive: true,
        cutout: "65%", // Adjust this value to control the size of the inner circle
        plugins: {
            legend: {
                position: "right",
                display: true,
                labels: {
                    // Update the tooltip to show percentages
                    usePointStyle: true,
                    pointStyle: "circle",
                    boxWidth: 10,
                    callbacks: legendCallbacks,
                },
            },
            tooltip: {
                callbacks: {
                    // Update the tooltip to show percentages
                    label: (context) => {
                        const label = context.label;
                        const index = context.dataIndex;
                        const value = context.raw;
                        const percentage = index === 0 ? percentageNormalRoom : percentageVipRoom;
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
        layout: {
            padding: {
                top: 30, // Add desired top margin (adjust the value as needed)
                bottom: 30, // Add desired bottom margin (adjust the value as needed)
            },
        },
        maintainAspectRatio: false,

    },
});

// Chart 3 data
const chartData3 = {
    labels: ["Meto Pema", "The Cup", "Agay Zheom", "AP Bokto", "Bardo", "Fate Cheats", "Lengo", "Lengom", "Singlem", "Bakchha"],
    data: [490, 440, 410, 390, 370, 360, 320, 300, 290, 280],
};

const myChart3 = new Chart(document.querySelector(".my-chart3"), {
    type: "bar",
    data: {
        labels: chartData3.labels,
        datasets: [{
            label: "Number of Tickets Sold",
            data: chartData3.data,
            backgroundColor: "#5988e1",
            borderWidth: 1,
        }],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Movie Names",
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Number of Ticket(s)",
                },
                beginAtZero: true,
            },
        },
        layout: {
            padding: 30,
        },
    },
});





// Chart 5 data

const monthlyData = {
    labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ],
    datasets: [{
        label: "Romance",
        data: [20, 21, 23, 25, 26, 28, 26, 27, 28, 27, 29, 31, 35],
        borderColor: "#e61717",
        borderWidth: 2,
        fill: false,
    }, {
        label: "Drama",
        data: [14, 15, 14, 16, 19, 20, 25, 26, 25, 27, 28, 29, 31, 33],
        borderColor: "#1b17e6",
        borderWidth: 2,
        fill: false,
    }, {
        label: "Horror",
        data: [
            10, 11, 12, 13, 15, 14, 16, 14, 17, 18, 19, 22, 24, 25, 28, 27,
        ],
        borderColor: "#1be617",
        borderWidth: 2,
        fill: false,
    }, {
        label: "Comedy",
        data: [
            13, 14, 15, 16, 18, 19, 20, 22, 24, 25, 27, 28, 30, 31, 32, 35,
        ],
        borderColor: "#17e6da",
        borderWidth: 2,
        fill: false,
    },],
};

const yearlyData = {
    labels: [
        "2013",
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",

    ],
    datasets: [{
        label: "Romance",
        data: [90, 100, 80, 110, 95, 120, 100, 130, 110, 140, 120, 150],
        borderColor: "#e61717",
        borderWidth: 2,
        fill: false,
    }, {
        label: "Drama",
        data: [110, 120, 100, 130, 120, 140, 120, 150, 130, 160, 140, 170],
        borderColor: "#1b17e6",
        borderWidth: 2,
        fill: false,
    }, {
        label: "Horror",
        data: [100, 110, 90, 120, 110, 130, 110, 140, 120, 150, 130, 160],
        borderColor: "#1be617",
        borderWidth: 2,
        fill: false,
    }, {
        label: "Comedy",
        data: [70, 80, 60, 90, 80, 100, 90, 110, 100, 120, 110, 130],
        borderColor: "#17e6da",
        borderWidth: 2,
        fill: false,
    },],
};

let currentData = monthlyData; // Set the initial data to weekly

const legendContainer = document.querySelector(".legend-container");

const myChart5 = new Chart(document.querySelector(".my-chart5"), {
    type: "line",
    data: currentData, // Set the initial data
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Month",
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Revenue(NU)",
                },
                beginAtZero: true,
                ticks: {
                    callback: function (value, index, values) {
                        if (value === 0) {
                            return value;
                        } else {
                            return value + "M";
                        }
                    },
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            datalabels: {
                display: true,
                align: "top",
                anchor: "end",
                offset: 5,
                color: "#000",
                font: {
                    size: 14,
                    family: "'Rubik', sans-serif",
                    weight: "bold",
                    style: "italic",
                },
                formatter: (value, context) => {
                    const index = context.dataIndex;
                    return (
                        ["Romance", "Drama", "Horror", "Comedy"][index] + ": " + value
                    );
                },
            },
        },
        layout: {
            padding: {
                left: 30,
                right: 200,
                top: 50,
                bottom: 30,
            },
        },
    },
});

//
//
//



function updateChart5() {
    const genreDropdown = document.getElementById("lineDropdown");
    const selectedOption = genreDropdown.value;

    switch (selectedOption) {
        case "monthly":
            currentData = monthlyData;
            myChart5.options.scales.x.title.text = "Month"; // Set x-axis title for monthly data
            break;
        // case "yearly":
        //     currentData = yearlyData;
        //     myChart5.options.scales.x.title.text = "Year"; // Set x-axis title for yearly data
        //     break;
        default:
            currentData = yearlyData;
            myChart5.options.scales.x.title.text = "Year"; // Set x-axis title for weekly data
    }

    myChart5.data = currentData;
    myChart5.update();
}

//
//
//
//
// Dynamically generate the legend items
function generateLegend() {
    const labels = ["Romance", "Drama", "Horror", "Comedy"];
    const colors = ["#e61717", "#1b17e6", "#1be617", "#17e6da"];
    const legendLabels = labels.map((label, index) => {
        return `<div class="legend-label">
                            <span class="legend-color" style="background-color: ${colors[index]}"></span>
                            <span class="legend-text">${label}</span>
                        </div>`;
    });

    legendContainer.innerHTML = legendLabels.join("");
}

generateLegend();
