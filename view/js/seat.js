// Get all seat elements
const seats = document.querySelectorAll(".seat");

// Add event listener to each seat
seats.forEach((seat, index) => {
  const popNumber = seat.querySelector(".pop-number");

  seat.addEventListener("mouseover", () => {
    // Calculate seat number
    const seatNumber = index + 1;

    // Update pop-number content
    popNumber.textContent = seatNumber;

    // Display pop-number
    popNumber.style.display = "block";
  });

  seat.addEventListener("mouseout", () => {
    // Hide pop-number when mouse leaves the seat
    popNumber.style.display = "none";
  });
});
