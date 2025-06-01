function addRecommendation() {
  // Get the message of the new recommendation
  let recommendation = document.getElementById("new_recommendation");
  // If the user has left a recommendation, display a pop-up
  if (recommendation.value != null && recommendation.value.trim() != "") {
    console.log("New recommendation added");
    //Call showPopup here

    // Create a new 'recommendation' element and set it's value to the user's message
    var element = document.createElement("div");
    element.setAttribute("class","recommendation");
    element.innerHTML = "\<span\>&#8220;\</span\>" + recommendation.value + "\<span\>&#8221;\</span\>";
    // Add this element to the end of the list of recommendations
    document.getElementById("all_recommendations").appendChild(element); 
    
    // Reset the value of the textarea
    recommendation.value = "";
  }
  showPopup(true);
}

function showPopup(bool) {
  if (bool) {
    document.getElementById('popup').style.visibility = 'visible'
  } else {
    document.getElementById('popup').style.visibility = 'hidden'
  }
}

async function fetchGitHubProjects(username) {
  const projectsContainer = document.getElementById("github-projects-container");
  if (!projectsContainer) {
    console.error("GitHub projects container not found!");
    return;
  }
  projectsContainer.innerHTML = '<p>Loading projects...</p>'; // Show loading message

  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    const repos = await response.json();

    if (repos.length === 0) {
      projectsContainer.innerHTML = "<p>No public repositories found for this user.</p>";
      return;
    }

    projectsContainer.innerHTML = ""; // Clear loading message

    repos.forEach(repo => {
      const projectCard = document.createElement("div");
      projectCard.classList.add("project-card"); // Use existing .project-card styles

      // Repository Name and Link
      const nameElement = document.createElement("h3");
      const linkElement = document.createElement("a");
      linkElement.href = repo.html_url;
      linkElement.textContent = repo.name;
      linkElement.target = "_blank"; // Open in new tab
      nameElement.appendChild(linkElement);
      projectCard.appendChild(nameElement);

      // Repository Description
      if (repo.description) {
        const descriptionElement = document.createElement("p");
        descriptionElement.textContent = repo.description;
        projectCard.appendChild(descriptionElement);
      }

      // Repository Languages (Primary language if available)
      if (repo.language) {
        const languageElement = document.createElement("p");
        languageElement.innerHTML = `<strong>Language:</strong> ${repo.language}`;
        projectCard.appendChild(languageElement);
      }

      // Stars and Forks (Optional, but good indicators of activity)
      const statsElement = document.createElement("p");
      statsElement.innerHTML = `<strong>Stars:</strong> ${repo.stargazers_count} | <strong>Forks:</strong> ${repo.forks_count}`;
      projectCard.appendChild(statsElement);


      projectsContainer.appendChild(projectCard);
    });

  } catch (error) {
    console.error("Failed to fetch GitHub projects:", error);
    projectsContainer.innerHTML = `<p>Error loading projects: ${error.message}. Please check the console for more details.</p>`;
  }
}

// Call the function when the page loads
window.onload = function() {
  // You can keep existing onload logic if any, or add to it.
  // For now, it just calls fetchGitHubProjects.
  // Replace 'octocat' with your desired default GitHub username or make it dynamic
  fetchGitHubProjects('octocat');

  // If there was any previous onload logic, ensure it's preserved or integrated.
  // For example, if there was a function called initPage():
  // if (typeof initPage === 'function') {
  //  initPage();
  // }
};
