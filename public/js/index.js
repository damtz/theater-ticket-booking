

document.addEventListener("DOMContentLoaded", function () {
  // Get the "LOAD MORE" button
  const loadMoreButton = document.getElementById("more-button");

  // Get the hidden content element
  const moreContent = document.querySelector(".more-content");

  // Add click event listener to the "LOAD MORE" button
  loadMoreButton.addEventListener("click", function () {
    // Toggle the visibility of the hidden content
    if (moreContent.style.display === "none") {
      moreContent.style.display = "block";
    } else {
      moreContent.style.display = "none";
    }
  });
});
