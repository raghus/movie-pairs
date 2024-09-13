const API_KEY = '52e6713439a87ea5ad9e0d4fa32a387e'; // Use your actual API key here
const BASE_URL = 'https://api.themoviedb.org/3';

const searchBtn = document.getElementById('searchBtn');
const resultsDiv = document.getElementById('results');

searchBtn.addEventListener('click', searchMovies);

async function searchMovies() {
    const actor1 = document.getElementById('actor1').value;
    const actor2 = document.getElementById('actor2').value;

    if (!actor1 || !actor2) {
        alert('Please enter both actor names');
        return;
    }

    resultsDiv.style.display = 'none'; // Hide results while searching
    resultsDiv.innerHTML = 'Searching...';

    try {
        const actor1Id = await getActorId(actor1);
        const actor2Id = await getActorId(actor2);

        if (!actor1Id || !actor2Id) {
            resultsDiv.innerHTML = 'One or both actors not found';
            resultsDiv.style.display = 'block'; // Show results
            return;
        }

        const commonMovies = await findCommonMovies(actor1Id, actor2Id);
        displayResults(commonMovies);
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = 'An error occurred while searching';
        resultsDiv.style.display = 'block'; // Show results
    }
}

async function getActorId(name) {
    try {
        const response = await fetch(`${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(name)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.results[0]?.id;
    } catch (error) {
        console.error('Error in getActorId:', error);
        throw error;
    }
}

async function findCommonMovies(actor1Id, actor2Id) {
    try {
        const [movies1, movies2] = await Promise.all([
            getActorMovies(actor1Id),
            getActorMovies(actor2Id)
        ]);

        if (!Array.isArray(movies1) || !Array.isArray(movies2)) {
            console.error('Invalid movie data received');
            return [];
        }

        return movies1.filter(movie => movies2.some(m => m.id === movie.id));
    } catch (error) {
        console.error('Error in findCommonMovies:', error);
        return [];
    }
}

async function getActorMovies(actorId) {
    try {
        const response = await fetch(`${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.cast || [];
    } catch (error) {
        console.error(`Error fetching movies for actor ${actorId}:`, error);
        return [];
    }
}

function displayResults(movies) {
    resultsDiv.style.display = 'block'; // Show results

    if (movies.length === 0) {
        resultsDiv.innerHTML = 'No common movies found';
        return;
    }

    // Sort movies by release date (most recent first)
    const sortedMovies = movies.sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
        const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
        return dateB - dateA;
    });

    const movieList = sortedMovies.map(movie => {
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        return `<li>${movie.title} (${year})</li>`;
    }).join('');

    const movieCount = movies.length;
    const movieCountText = movieCount === 1 ? '1 common movie' : `${movieCount} common movies`;

    resultsDiv.innerHTML = `
        <h2>Common Movies (Most Recent First)</h2>
        <p>${movieCountText} found:</p>
        <ul>${movieList}</ul>
    `;
}