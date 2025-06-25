const searchBox = document.getElementById('searchBox');
const contentDiv = document.getElementById('content');
const suggestionsList = document.getElementById('suggestions');

// Search on Enter key press
searchBox.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    const query = searchBox.value.trim();
    if (query) {
      clearSuggestions();
      searchWikipedia(query);
    }
  }
});

// Autocomplete suggestions on input
searchBox.addEventListener('input', () => {
  const val = searchBox.value.trim();
  if (!val) {
    clearSuggestions();
    return;
  }

  fetch(
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      val
    )}&limit=5&namespace=0&format=json&origin=*`
  )
    .then(res => res.json())
    .then(data => {
      const suggestions = data[1];
      if (suggestions.length === 0) {
        clearSuggestions();
        return;
      }

      suggestionsList.innerHTML = suggestions
        .map(item => `<li>${item}</li>`)
        .join('');

      suggestionsList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
          searchBox.value = li.textContent;
          clearSuggestions();
          searchWikipedia(li.textContent);
        });
      });
    })
    .catch(() => {
      clearSuggestions();
    });
});

function clearSuggestions() {
  suggestionsList.innerHTML = '';
}

function showLoading() {
  contentDiv.innerHTML = `<p class="loading">Searching Wikipedia...</p>`;
}

function searchWikipedia(query) {
  showLoading();

  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&format=json&origin=*`;

  fetch(searchUrl)
    .then(res => res.json())
    .then(data => {
      const results = data.query.search;
      if (results.length === 0) {
        contentDiv.innerHTML = `<p>No results found for <b>${query}</b>.</p>`;
        return;
      }

      const pageIds = results.map(r => r.pageid).join('|');
      const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=pageimages&format=json&pithumbsize=150&origin=*`;

      fetch(imagesUrl)
        .then(res => res.json())
        .then(imgData => {
          renderResults(results, imgData.query.pages);
        })
        .catch(() => {
          renderResults(results, {});
        });
    })
    .catch(() => {
      contentDiv.innerHTML =
        '<p>Something went wrong. Please check your internet connection and try again.</p>';
    });
}

function renderResults(results, images) {
  contentDiv.innerHTML = `
    <div class="results-wrapper">
      ${results
        .map(result => {
          const page = images[result.pageid];
          const thumb =
            page && page.thumbnail
              ? page.thumbnail.source
              : 'https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png';

          return `
            <div class="result">
              <img src="${thumb}" alt="${result.title}" class="thumb" />
              <div class="result-text">
                <h2>${result.title}</h2>
                <p>${result.snippet}...</p>
                <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(
                  result.title
                )}" target="_blank" rel="noopener">Read full article</a>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

// On page load
window.onload = () => {
  contentDiv.innerHTML = `<p>Start searching for something above!</p>`;
};
