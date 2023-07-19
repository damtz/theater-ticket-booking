document.getElementById("more-button").addEventListener("click", function() {
    var moreContent = document.querySelector(".more-content");
    if (moreContent.style.display === "none") {
      moreContent.style.display = "block";
      document.getElementById("more-button").textContent = "Show Less";
    } else {
      moreContent.style.display = "none";
      document.getElementById("more-button").textContent = "Show More";
    }
  });
  