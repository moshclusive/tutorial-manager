document.addEventListener('DOMContentLoaded', function () {
    const addVideoBtn = document.getElementById('add-video-btn');
    const addVideoModal = document.getElementById('add-video-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const saveVideoBtn = document.getElementById('save-video-btn');
    const editVideoModal = document.getElementById('edit-video-modal');
    const editCloseModalBtn = document.querySelector('.edit-close-button');
    const updateVideoBtn = document.getElementById('update-video-btn');
    const videoGrid = document.getElementById('video-grid');
    const searchInput = document.getElementById('search');
    const categoryList = document.getElementById('folder-list');
    const homeBtn = document.getElementById('home-btn');
    const categoryBtn = document.getElementById('category-btn');
    const otherSourcesBtn = document.getElementById('other-sources-btn');

    // Settings Elements
    const settingsBtn = document.querySelector('.settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const settingsCloseModalBtn = document.querySelector('.settings-close-button');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const importJsonCsvBtn = document.getElementById('import-json-csv-btn');
    const importFileInput = document.getElementById('import-file-input');
    const suggestionContainer = document.getElementById('suggestion-container');
    const folderNameInput = document.getElementById('folder-name');

    let editIndex = null;
    let videos = JSON.parse(localStorage.getItem('videos')) || [];
    let currentFolder = 'YouTube';
    let categories = [];

    // Load videos from storage on load
    loadVideos();

    // Home Button - Show only YouTube videos
    homeBtn.addEventListener('click', function () {
        currentFolder = 'YouTube';
        loadVideos();
        highlightSelected(homeBtn);
    });

    // Highlight Home Button by Default on Load
    highlightSelected(homeBtn);

    // Toggle category list visibility
    categoryBtn.addEventListener('click', function () {
        const isExpanded = categoryList.style.display === 'block';
        categoryList.style.display = isExpanded ? 'none' : 'block';
        highlightSelected(categoryBtn);
    });

    // Other Sources Button - Show only videos from other sources
    otherSourcesBtn.addEventListener('click', function () {
        currentFolder = 'Other Sources';
        loadVideos();
        highlightSelected(otherSourcesBtn);
    });

    // Open the Add Video Modal
    addVideoBtn.addEventListener('click', function () {
        addVideoModal.style.display = 'flex';
    });

    // Close the Add Video Modal
    closeModalBtn.addEventListener('click', function () {
        addVideoModal.style.display = 'none';
    });

    // Close the Edit Video Modal
    editCloseModalBtn.addEventListener('click', function () {
        editVideoModal.style.display = 'none';
    });

    // Event listener for category input to show suggestions
    folderNameInput.addEventListener('input', function () {
        const inputText = this.value.toLowerCase();
        if (inputText) {
            const filteredCategories = categories.filter(category =>
                category.toLowerCase().includes(inputText)
            );
            showSuggestions(filteredCategories);
        } else {
            suggestionContainer.style.display = 'none';
        }
    });

    function showSuggestions(suggestions) {
        suggestionContainer.innerHTML = ''; // Clear previous suggestions
        if (suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = suggestion;
                suggestionItem.addEventListener('click', function () {
                    folderNameInput.value = suggestion;
                    suggestionContainer.style.display = 'none';
                });
                suggestionContainer.appendChild(suggestionItem);
            });
            suggestionContainer.style.display = 'block';
        } else {
            suggestionContainer.style.display = 'none';
        }
    }

    // Save Video
    saveVideoBtn.addEventListener('click', async function () {
        await handleSaveVideo();
    });

    // Save Video on Enter Key Press
    document.getElementById('video-url').addEventListener('keypress', async function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            await handleSaveVideo();
        }
    });

    async function handleSaveVideo() {
        const videoUrl = document.getElementById('video-url').value.trim();
        let videoTitle = document.getElementById('video-title').value;
        const categoryName = folderNameInput.value.trim();

        if (videoUrl) {
            if (!videoTitle) {
                videoTitle = await fetchVideoTitle(videoUrl);
                document.getElementById('video-title').value = videoTitle;
            }

            if (!isVideoDuplicate(videoUrl)) {
                saveVideo(videoUrl, videoTitle, categoryName);
                addVideoModal.style.display = 'none';
                document.getElementById('video-url').value = '';
                document.getElementById('video-title').value = '';
                folderNameInput.value = '';
                suggestionContainer.style.display = 'none';
            } else {
                alert('This video already exists!');
            }
        } else {
            alert('Please enter a video URL.');
        }
    }

    function isVideoDuplicate(url) {
        return videos.some(video => video.url === url);
    }

    updateVideoBtn.addEventListener('click', function () {
        const videoUrl = document.getElementById('edit-video-url').value;
        const videoTitle = document.getElementById('edit-video-title').value;
        const categoryName = document.getElementById('edit-folder-name').value;
        if (editIndex !== null) {
            updateVideo(editIndex, videoUrl, videoTitle, categoryName);
            editVideoModal.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', function () {
        const searchText = searchInput.value.toLowerCase();
        const filteredVideos = videos.filter(video => video.title.toLowerCase().includes(searchText));
        displayVideos(filteredVideos);
    });

    function saveVideo(url, title, category) {
        videos.unshift({ url, title, folder: category }); // Add new video to the start
        localStorage.setItem('videos', JSON.stringify(videos)); // Save to local storage
        displayVideos(videos);
        updateCategoryList();
    }

    function updateVideo(index, url, title, category) {
        videos[index].url = url;
        videos[index].title = title;
        videos[index].folder = category;
        localStorage.setItem('videos', JSON.stringify(videos)); // Save to local storage
        displayVideos(videos);
        updateCategoryList();
    }

    function loadVideos() {
        videos = JSON.parse(localStorage.getItem('videos')) || [];
        categories = [...new Set(videos.map(video => video.folder).filter(Boolean))];
        displayFilteredVideos();
        updateCategoryList();
    }

    function displayFilteredVideos() {
        let filteredVideos = [];
        if (currentFolder === 'YouTube') {
            filteredVideos = videos.filter(video => video.url.includes('youtube.com') || video.url.includes('youtu.be'));
            displayVideos(filteredVideos);
        } else if (currentFolder === 'Other Sources') {
            filteredVideos = videos.filter(video => !(video.url.includes('youtube.com') || video.url.includes('youtu.be')));
            displayVideosAsList(filteredVideos);
        } else if (currentFolder) {
            filteredVideos = videos.filter(video => video.folder === currentFolder);
            displayVideos(filteredVideos);
        } else {
            displayVideos(videos);
        }
    }

    function displayVideos(videos) {
        videoGrid.innerHTML = '';
        videoGrid.className = 'grid';

        videos.forEach((video, index) => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';

            getThumbnail(video.url).then(thumbnail => {
                const displayContent = thumbnail
                    ? `<img src="${thumbnail}" alt="Video Thumbnail" class="thumbnail-image" style="width: 100%; height: auto;">`
                    : `<div class="video-placeholder" style="background-color: #e0e0e0; width: 320px; height: 180px; display: flex; align-items: center; justify-content: center; color: #333;">${truncateTitle(video.title)} - ${video.folder || 'No Category'}</div>`;
                
                videoItem.innerHTML = `
                    <div class="video-thumbnail" data-url="${video.url}">
                        ${displayContent}
                    </div>
                    <div class="video-title">${truncateTitle(video.title)}</div>
                    <div class="video-actions">
                        <button class="edit-btn" data-index="${index}">Edit</button>
                        <button class="remove-btn" data-index="${index}">Remove</button>
                        <button class="visit-link-btn" data-url="${video.url}">Visit Link</button> <!-- New Visit Link Button -->
                    </div>`;
                videoGrid.appendChild(videoItem);

                // Attach event listeners for click, edit, remove, and visit link
                videoItem.querySelector('.video-thumbnail').addEventListener('click', function () {
                    playVideoResponsive(video.url);
                    moveVideoToFirst(index); // Move clicked video to first
                });

                videoItem.querySelector('.edit-btn').addEventListener('click', function () {
                    editIndex = index;
                    document.getElementById('edit-video-url').value = video.url;
                    document.getElementById('edit-video-title').value = video.title;
                    document.getElementById('edit-folder-name').value = video.folder || '';
                    editVideoModal.style.display = 'flex';
                });

                videoItem.querySelector('.remove-btn').addEventListener('click', function () {
                    removeVideo(index); // Remove video on click
                });

                videoItem.querySelector('.visit-link-btn').addEventListener('click', function () {
                    visitLink(video.url); // Visit link on click
                });
            });
        });
    }

    function displayVideosAsList(videos) {
        videoGrid.innerHTML = '';
        videoGrid.className = 'video-list';

        videos.forEach((video, index) => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-list-item';
            videoItem.innerHTML = `
                <div class="video-title">
                    <a href="#" data-url="${video.url}">${truncateTitle(video.title)}</a>
                </div>
                <div class="video-actions">
                    <button class="edit-btn" data-index="${index}">Edit</button>
                    <button class="remove-btn" data-index="${index}">Remove</button>
                    <button class="visit-link-btn" data-url="${video.url}">Visit Link</button> <!-- New Visit Link Button -->
                </div>`;
            videoGrid.appendChild(videoItem);

            videoItem.querySelector('.video-title a').addEventListener('click', function (e) {
                e.preventDefault();
                playVideoResponsive(this.dataset.url);
                moveVideoToFirst(index); // Move clicked video to first
            });

            videoItem.querySelector('.edit-btn').addEventListener('click', function () {
                editIndex = index;
                document.getElementById('edit-video-url').value = video.url;
                document.getElementById('edit-video-title').value = video.title;
                document.getElementById('edit-folder-name').value = video.folder || '';
                editVideoModal.style.display = 'flex';
            });

            videoItem.querySelector('.remove-btn').addEventListener('click', function () {
                removeVideo(index);
            });

            videoItem.querySelector('.visit-link-btn').addEventListener('click', function () {
                visitLink(video.url); // Visit link on click
            });
        });
    }

    function moveVideoToFirst(index) {
        const [video] = videos.splice(index, 1); // Remove video from current position
        videos.unshift(video); // Add video to the start
        localStorage.setItem('videos', JSON.stringify(videos)); // Save to local storage
        loadVideos(); // Reload videos to reflect changes
    }

    function visitLink(url) {
        window.open(url, '_blank'); // Opens the link in a new tab
    }

    function updateCategoryList() {
        const uniqueCategories = [...new Set(videos.map(video => video.folder).filter(category => category && category !== 'Other Sources'))];
        categoryList.innerHTML = '';

        uniqueCategories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item sidebar-item';
            categoryItem.innerHTML = `<span>${category}</span><i class="fas fa-trash-alt delete-category-icon" style="margin-left: 10px; cursor: pointer;"></i>`;
            categoryItem.querySelector('.delete-category-icon').addEventListener('click', function (e) {
                e.stopPropagation();
                deleteCategory(category);
            });
            categoryItem.addEventListener('click', function () {
                currentFolder = category;
                loadVideos();
                highlightSelected(categoryItem);
            });
            categoryList.appendChild(categoryItem);
        });
    }

    function deleteCategory(category) {
        videos = videos.filter(video => video.folder !== category);
        localStorage.setItem('videos', JSON.stringify(videos)); // Save to local storage
        loadVideos();
        alert(`Category "${category}" and its videos have been deleted.`);
    }

    function highlightSelected(element) {
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('selected'));
        element.classList.add('selected');
    }

    function playVideoResponsive(url) {
        let embedUrl = '';
        if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube.com/shorts')) {
            const videoID = extractVideoID(url) || extractShortsID(url);
            embedUrl = `https://www.youtube.com/embed/${videoID}?autoplay=1`;
        } else if (url.includes('facebook.com')) {
            embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
        } else if (url.includes('vimeo.com')) {
            const videoID = extractVimeoID(url);
            embedUrl = `https://player.vimeo.com/video/${videoID}`;
        } else if (url.includes('instagram.com')) {
            const instagramID = extractInstagramID(url);
            embedUrl = `https://www.instagram.com/p/${instagramID}/embed`;
        } else if (url.includes('tiktok.com')) {
            const tiktokID = extractTikTokID(url);
            embedUrl = `https://www.tiktok.com/embed/${tiktokID}`;
        } else if (url.includes('pinterest.com')) {
            const pinterestID = url.split('/').pop();
            embedUrl = `https://assets.pinterest.com/ext/embed.html?id=${pinterestID}`;
        } else {
            embedUrl = url;
        }

        const videoWindow = window.open('', '_blank');
        videoWindow.document.write(`
            <style>
                body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                .video-container { display: flex; justify-content: center; align-items: center; height: 100%; }
                iframe { width: ${isFullScreenPlatform(url) ? '100%' : '337px'}; height: ${isFullScreenPlatform(url) ? '100%' : '603px'}; max-width: 90vw; max-height: 90vh; border: none; }
            </style>
            <div class="video-container">
                <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
        `);
    }

    function isFullScreenPlatform(url) {
        return url.includes('youtube') || url.includes('vimeo.com') || url.includes('facebook.com');
    }

    async function fetchVideoTitle(url) {
        try {
            const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            return data.title || 'Untitled Video';
        } catch (error) {
            console.error('Error fetching video title:', error);
            return 'Untitled Video';
        }
    }

    async function getThumbnail(url) {
        if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube.com/shorts')) {
            const videoID = extractVideoID(url) || extractShortsID(url);
            return `https://img.youtube.com/vi/${videoID}/0.jpg`;
        } else if (url.includes('vimeo.com')) {
            const videoID = extractVimeoID(url);
            return `https://vumbnail.com/${videoID}.jpg`;
        } else if (url.includes('instagram.com')) {
            const instagramID = extractInstagramID(url);
            return `https://www.instagram.com/reel/${instagramID}/embed`;
        } else if (url.includes('tiktok.com')) {
            return 'https://via.placeholder.com/320x180?text=TikTok+Thumbnail';
        } else if (url.includes('facebook.com')) {
            return 'https://via.placeholder.com/320x180?text=Facebook+Thumbnail';
        } else {
            return 'https://via.placeholder.com/320x180?text=No+Thumbnail';
        }
    }

    function truncateTitle(title) {
        return title.length > 100 ? title.substring(0, 97) + '...' : title;
    }

    function removeVideo(index) {
        videos.splice(index, 1); // Remove the video from the list
        localStorage.setItem('videos', JSON.stringify(videos)); // Save to local storage
        displayVideos(videos);
        updateCategoryList();
    }

    function extractVideoID(url) { 
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function extractShortsID(url) {
        const regExp = /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    function extractVimeoID(url) {
        const regExp = /vimeo.com\/(\d+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    function extractInstagramID(url) {
        const regExp = /instagram.com\/reel\/([^\/?#&]+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    function extractTikTokID(url) {
        const regExp = /tiktok.com\/(@[A-Za-z0-9._]+)\/video\/([0-9]+)/;
        const match = url.match(regExp);
        return match ? match[2] : null;
    }

    function mergeVideos(existingVideos, newVideos) {
        const urls = new Set(existingVideos.map(video => video.url));
        newVideos.forEach(video => {
            if (!urls.has(video.url)) {
                existingVideos.push(video);
            }
        });
        return existingVideos;
    }

    // Import/Export handlers
    function importVideosFromJson(jsonContent) {
        try {
            const newVideos = JSON.parse(jsonContent);
            const existingVideos = JSON.parse(localStorage.getItem('videos')) || [];
            const mergedVideos = mergeVideos(existingVideos, newVideos);
            localStorage.setItem('videos', JSON.stringify(mergedVideos)); // Save to local storage
            loadVideos();
            alert('Videos imported successfully!');
        } catch (error) {
            alert('Error importing JSON file!');
        }
    }

    function importVideosFromCsv(csvContent) {
        try {
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',');
            const newVideos = lines.slice(1).map(line => {
                const values = line.split(',');
                return { url: values[0], title: values[1], folder: values[2] || '' };
            });
            const existingVideos = JSON.parse(localStorage.getItem('videos')) || [];
            const mergedVideos = mergeVideos(existingVideos, newVideos);
            localStorage.setItem('videos', JSON.stringify(mergedVideos)); // Save to local storage
            loadVideos();
            alert('Videos imported successfully!');
        } catch (error) {
            alert('Error importing CSV file!');
        }
    }

    function convertToCSV(videos) {
        const headers = ['URL', 'Title', 'Folder'];
        const rows = videos.map(video => [video.url, video.title, video.folder || ''].join(','));
        return [headers.join(','), ...rows].join('\n');
    }

    // Export to JSON
    exportJsonBtn.addEventListener('click', function () {
        const jsonData = JSON.stringify(videos || []);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'videos.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Export to CSV
    exportCsvBtn.addEventListener('click', function () {
        const csvData = convertToCSV(videos || []);
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'videos.csv';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Import JSON/CSV
    importJsonCsvBtn.addEventListener('click', function () {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const content = e.target.result;
                if (file.type === 'application/json') {
                    importVideosFromJson(content);
                } else if (file.type === 'text/csv') {
                    importVideosFromCsv(content);
                }
            };
            reader.readAsText(file);
        }
    });

    // Open Settings Modal
    settingsBtn.addEventListener('click', function () {
        settingsModal.style.display = 'flex';
    });

    // Close Settings Modal
    settingsCloseModalBtn.addEventListener('click', function () {
        settingsModal.style.display = 'none';
    });
});
