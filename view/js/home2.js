/** @format */

// Define the image URLs in a list
const imageUrls = [
  "images/movie/1.jpg",
  "images/movie/2.jpg",
  "images/movie/3.jpg",
  "images/movie/4.jpg",
  "images/movie/5.jpg",
  "images/movie/6.jpg",
  "images/movie/7.jpg",
  "images/movie/8.jpg",
];

// Function to generate the HTML code for displaying the images
function generateImageHtml(imageUrls) {
  const imageContainer = document.getElementById("image-container");
  const imageContainer1 = document.getElementById("image-container1");
  let html = "";
  let html1 = "";
  for (let i = 0; i < imageUrls.length; i++) {
    if (i <= 3) {
      html += `<div class="col-md-3">
        <img src="${imageUrls[i]}" alt="Image ${i + 1}" class="p-3" />
     </div>`;
    } else if (i > 3 && i <= 7) {
      html += `<div class="col-md-3">
        <img src="${imageUrls[i]}" alt="Image ${i + 1}" class="p-3" />
     </div>`;
    }
  }
  imageContainer.innerHTML = html;
  imageContainer1.innerHTML = html1;
}

// Call the function to generate the initial set of images
generateImageHtml(imageUrls);

// Event listener for the "LOAD MORE" button
const loadMoreButton = document.getElementById("more-button");
loadMoreButton.addEventListener("click", function () {
  // Add more images to the list (you can fetch them from a server or modify the array)
  const moreImageUrls = [
    "images/movie/9.jpg",
    "images/movie/10.jpg",
    "images/movie/11.jpg",
    "images/movie/12.jpg",
  ];

  // Add the new images to the existing list
  imageUrls.push(...moreImageUrls);

  // Generate the HTML code for displaying all images
  generateImageHtml(imageUrls);
});
