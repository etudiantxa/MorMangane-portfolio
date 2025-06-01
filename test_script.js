// test_script.js

// --- Test Utilities ---
const testResultsContainer = document.getElementById('test-results');
let testCount = 0;
let passCount = 0;

function assertEquals(expected, actual, message) {
    testCount++;
    const result = document.createElement('div');
    result.classList.add('test-case');
    if (JSON.stringify(expected) === JSON.stringify(actual)) { // Use JSON.stringify for deep comparison of objects/arrays
        passCount++;
        result.style.color = 'green';
        result.textContent = `PASS: ${message}`;
    } else {
        result.style.color = 'red';
        result.textContent = `FAIL: ${message}. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`;
    }
    testResultsContainer.appendChild(result);
}

function logMessage(message, color = 'black') {
    const msgElement = document.createElement('p');
    msgElement.textContent = message;
    msgElement.style.color = color;
    testResultsContainer.appendChild(msgElement);
}

// --- Mocking Fetch ---
let mockFetchResponse;
let mockFetchError;

const originalFetch = window.fetch; // Store original fetch

function mockFetch(url) {
    return new Promise((resolve, reject) => {
        if (mockFetchError) {
            reject(mockFetchError);
            return;
        }
        if (mockFetchResponse) {
            resolve(mockFetchResponse);
            return;
        }
        // Default behavior if no mock is set for a specific test
        resolve({
            ok: false,
            status: 404,
            statusText: "Not Found (Default Mock)",
            json: () => Promise.resolve({ message: "Not Found (Default Mock)" })
        });
    });
}

// --- Test Setup and Teardown ---
function setupTest() {
    window.fetch = mockFetch; // Override global fetch with our mock
    mockFetchResponse = null;
    mockFetchError = null;
    // Clear the projects container before each test
    const projectsContainer = document.getElementById('github-projects-container');
    if (projectsContainer) {
        projectsContainer.innerHTML = '';
    } else {
        console.error("CRITICAL: github-projects-container not found in test.html for setup.");
    }
}

function teardownTest() {
    window.fetch = originalFetch; // Restore original fetch
}

// --- Test Cases ---

async function testSuccessfulFetchAndRender() {
    setupTest();
    logMessage("Test: Successful Fetch and Render", "blue");

    const mockRepos = [
        { name: "Repo1", html_url: "url1", description: "Desc1", language: "JS", stargazers_count: 10, forks_count: 5 },
        { name: "Repo2", html_url: "url2", description: "Desc2", language: "Python", stargazers_count: 20, forks_count: 15 }
    ];
    mockFetchResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRepos)
    };

    await fetchGitHubProjects('testuser');

    const projectsContainer = document.getElementById('github-projects-container');
    assertEquals(2, projectsContainer.children.length, "Should render 2 project cards.");

    const firstCard = projectsContainer.children[0];
    assertEquals("Repo1", firstCard.querySelector('h3 a').textContent, "First card title should be Repo1.");
    assertEquals("url1", firstCard.querySelector('h3 a').href.endsWith("url1"), "First card link should be url1."); // endsWith because href might be full path
    assertEquals("Desc1", firstCard.querySelector('p').textContent, "First card description should be Desc1.");
    assertEquals("Language: JS", firstCard.querySelectorAll('p')[1].textContent.trim(), "First card language should be JS."); // Using querySelectorAll and trim
    assertEquals("Stars: 10 | Forks: 5", firstCard.querySelectorAll('p')[2].textContent.trim(), "First card stats.");


    teardownTest();
}

async function testAPIErrornUserNotFound() {
    setupTest();
    logMessage("Test: API Error (User Not Found)", "blue");

    mockFetchResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "User not found" })
    };

    await fetchGitHubProjects('nonexistentuser');

    const projectsContainer = document.getElementById('github-projects-container');
    assertEquals(true, projectsContainer.innerHTML.includes("Error loading projects: GitHub API error: 404 Not Found"), "Should display API error message for 404.");

    teardownTest();
}

async function testNetworkError() {
    setupTest();
    logMessage("Test: Network Error", "blue");

    mockFetchError = new TypeError("Failed to fetch"); // Simulate network error

    await fetchGitHubProjects('anyuser');

    const projectsContainer = document.getElementById('github-projects-container');
    assertEquals(true, projectsContainer.innerHTML.includes("Error loading projects: Failed to fetch"), "Should display network error message.");

    teardownTest();
}

async function testNoProjectsFound() {
    setupTest();
    logMessage("Test: No Projects Found", "blue");

    mockFetchResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([]) // Empty array of repos
    };

    await fetchGitHubProjects('userwithnorepos');

    const projectsContainer = document.getElementById('github-projects-container');
    assertEquals("<p>No public repositories found for this user.</p>", projectsContainer.innerHTML, "Should display 'No public repositories found' message.");

    teardownTest();
}

async function testProjectCardStructure() {
    setupTest();
    logMessage("Test: Project Card Structure (Description and Language optional)", "blue");

    const mockRepos = [
        { name: "RepoMinimal", html_url: "url_min", description: null, language: null, stargazers_count: 1, forks_count: 0 },
        { name: "RepoFull", html_url: "url_full", description: "Full Desc", language: "Java", stargazers_count: 5, forks_count: 2 }
    ];
    mockFetchResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRepos)
    };

    await fetchGitHubProjects('testuser');

    const projectsContainer = document.getElementById('github-projects-container');
    assertEquals(2, projectsContainer.children.length, "Should render 2 project cards for structure test.");

    // Test minimal card (no description, no language)
    const minimalCard = projectsContainer.children[0];
    assertEquals("RepoMinimal", minimalCard.querySelector('h3 a').textContent, "Minimal card title.");
    // It should have an h3 (name) and one p (for stats). Description and Language <p> should not be there.
    assertEquals(2, minimalCard.children.length, "Minimal card should have 2 child elements (h3 for name, p for stats).");
    assertEquals("Stars: 1 | Forks: 0", minimalCard.querySelectorAll('p')[0].textContent.trim(), "Minimal card stats.");


    // Test full card (with description and language)
    const fullCard = projectsContainer.children[1];
    assertEquals("RepoFull", fullCard.querySelector('h3 a').textContent, "Full card title.");
    // h3 (name), p (desc), p (lang), p (stats)
    assertEquals(4, fullCard.children.length, "Full card should have 4 child elements.");
    assertEquals("Full Desc", fullCard.querySelectorAll('p')[0].textContent, "Full card description.");
    assertEquals("Language: Java", fullCard.querySelectorAll('p')[1].textContent.trim(), "Full card language.");
    assertEquals("Stars: 5 | Forks: 2", fullCard.querySelectorAll('p')[2].textContent.trim(), "Full card stats.");

    teardownTest();
}


// --- Run Tests ---
async function runAllTests() {
    logMessage("Starting tests...", "gray");

    await testSuccessfulFetchAndRender();
    await testAPIErrornUserNotFound();
    await testNetworkError();
    await testNoProjectsFound();
    await testProjectCardStructure();

    logMessage(`\nTests finished: ${passCount} of ${testCount} passed.`, (passCount === testCount ? 'green' : 'red'));

    // Clean up global mocks if any were left
    if (window.fetch !== originalFetch) {
        window.fetch = originalFetch;
    }
}

// Automatically run tests when the script loads
// Adding a small delay to ensure the DOM is fully ready, especially script.js
window.addEventListener('load', () => {
    // Ensure the projects container exists before running tests
    if (!document.getElementById('github-projects-container')) {
        console.error("CRITICAL: github-projects-container not found in test.html. Tests cannot run.");
        logMessage("CRITICAL: github-projects-container not found in test.html. Tests cannot run.", "red");
        return;
    }
    runAllTests();
});
