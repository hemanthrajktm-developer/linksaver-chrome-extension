// LinkSaver Dashboard JavaScript
class LinkSaverDashboard {
  constructor() {
    this.links = [
      {
        id: '1',
        title: 'GitHub - The world\'s leading software development platform',
        url: 'https://github.com',
        domain: 'github.com',
        favicon: 'https://github.com/favicon.ico',
        note: 'Great for code repositories and collaboration',
        tags: ['development', 'code', 'git'],
        savedAt: new Date().toISOString(),
        visitCount: 5,
        favorite: true
      },
      {
        id: '2',
        title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers',
        url: 'https://stackoverflow.com',
        domain: 'stackoverflow.com',
        favicon: 'https://stackoverflow.com/favicon.ico',
        note: 'Best place for programming questions and answers',
        tags: ['development', 'help', 'programming'],
        savedAt: new Date(Date.now() - 86400000).toISOString(),
        visitCount: 12,
        pinned: true
      },
      {
        id: '3',
        title: 'YouTube - Broadcast Yourself',
        url: 'https://youtube.com',
        domain: 'youtube.com',
        favicon: 'https://youtube.com/favicon.ico',
        note: 'Video platform for learning and entertainment',
        tags: ['video', 'learning', 'entertainment'],
        savedAt: new Date(Date.now() - 172800000).toISOString(),
        visitCount: 8
      }
    ];
    
    this.folders = [
      {
        id: 'folder1',
        name: 'Development',
        description: 'Programming resources',
        color: '#2563eb',
        createdAt: new Date().toISOString()
      },
      {
        id: 'folder2',
        name: 'Learning',
        description: 'Educational content',
        color: '#059669',
        createdAt: new Date().toISOString()
      }
    ];
    
    this.filteredLinks = [...this.links];
    this.currentFilter = 'all';
    this.selectedLinks = new Set();
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.renderFolders();
    this.renderTags();
    this.renderLinks();
    this.updateStats();
  }
  
  setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterLinks();
    });
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveFilter(e.target.dataset.filter);
      });
    });
    
    // Add Link
    document.getElementById('addLinkBtn').addEventListener('click', () => this.showAddLinkModal());
    document.getElementById('addTestData').addEventListener('click', () => this.addMoreTestData());
    
    // Modal
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.hideModal();
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });
    document.getElementById('saveNewLink').addEventListener('click', () => this.saveNewLink());
  }
  
  renderTags() {
    const tagCloud = document.getElementById('tagCloud');
    const allTags = {};
    
    this.links.forEach(link => {
      if (link.tags) {
        link.tags.forEach(tag => {
          allTags[tag] = (allTags[tag] || 0) + 1;
        });
      }
    });
    
    const sortedTags = Object.entries(allTags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    tagCloud.innerHTML = sortedTags.map(([tag, count]) => `
      <span class="tag" data-tag="${tag}">
        #${tag} (${count})
      </span>
    `).join('');
    
    // Add click handlers for tags
    tagCloud.querySelectorAll('.tag').forEach(tagEl => {
      tagEl.addEventListener('click', () => {
        this.searchQuery = tagEl.dataset.tag;
        document.getElementById('searchInput').value = tagEl.dataset.tag;
        this.filterLinks();
      });
    });
  }
  
  renderFolders() {
    const folderList = document.getElementById('folderList');
    folderList.innerHTML = this.folders.map(folder => `
      <li class="folder-item" data-folder-id="${folder.id}">
        <div class="folder-info">
          <div class="folder-color" style="background: ${folder.color};"></div>
          <span>${folder.name}</span>
        </div>
      </li>
    `).join('');
  }
  
  renderLinks() {
    const container = document.getElementById('linksGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (this.filteredLinks.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = this.filteredLinks.map(link => `
      <div class="link-card glass-card ${this.selectedLinks.has(link.id) ? 'selected' : ''}" data-link-id="${link.id}">
        <input type="checkbox" class="link-checkbox" ${this.selectedLinks.has(link.id) ? 'checked' : ''}>
        
        <div class="link-card-header">
          <img src="${link.favicon || '../icons/icon16.png'}" alt="" class="link-favicon">
          <span class="link-domain" style="background-color: #007AFF20; color: #007AFF;">
            ${link.domain}
          </span>
          <div class="link-actions">
            <button class="link-action" data-action="favorite" title="Toggle Favorite">
              ${link.favorite ? '⭐' : '☆'}
            </button>
            <button class="link-action" data-action="pin" title="Toggle Pin">
              ${link.pinned ? '📌' : '📍'}
            </button>
            <button class="link-action" data-action="delete" title="Delete">🗑️</button>
          </div>
        </div>
        
        <h3 class="link-title">${link.title}</h3>
        
        ${link.note ? `<p class="link-note">${link.note}</p>` : ''}
        
        ${link.tags && link.tags.length > 0 ? `
          <div class="link-tags">
            ${link.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
        
        <div class="link-meta">
          <span>Saved ${this.getTimeAgo(link.savedAt)}</span>
          <span>${link.visitCount || 0} visits</span>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.link-card').forEach(card => {
      const linkId = card.dataset.linkId;
      
      card.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') {
          this.toggleSelection(linkId, e.target.checked);
        } else if (!e.target.closest('.link-actions')) {
          const link = this.links.find(l => l.id === linkId);
          if (link) window.open(link.url, '_blank');
        }
      });
    });
    
    this.updateMoveButton();
  }
  
  filterLinks() {
    let filtered = [...this.links];
    
    if (this.searchQuery) {
      filtered = filtered.filter(link => 
        link.title.toLowerCase().includes(this.searchQuery) ||
        link.domain.toLowerCase().includes(this.searchQuery) ||
        (link.note && link.note.toLowerCase().includes(this.searchQuery))
      );
    }
    
    switch (this.currentFilter) {
      case 'favorites':
        filtered = filtered.filter(link => link.favorite);
        break;
      case 'pinned':
        filtered = filtered.filter(link => link.pinned);
        break;
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(link => new Date(link.savedAt) > weekAgo);
        break;
    }
    
    this.filteredLinks = filtered;
    this.renderLinks();
  }
  
  setActiveFilter(filter) {
    this.currentFilter = filter;
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.filter === filter);
    });
    
    const titles = {
      all: 'All Links',
      favorites: 'Favorite Links',
      pinned: 'Pinned Links',
      recent: 'Recent Links'
    };
    
    document.getElementById('contentTitle').textContent = titles[filter] || filter;
    this.filterLinks();
  }
  
  updateStats() {
    document.getElementById('totalLinks').textContent = this.links.length;
    document.getElementById('savedToday').textContent = this.links.filter(link => 
      new Date(link.savedAt).toDateString() === new Date().toDateString()
    ).length;
  }
  
  getTimeAgo(dateString) {
    const now = new Date();
    const saved = new Date(dateString);
    const diffMs = now - saved;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return saved.toLocaleDateString();
  }
  
  showAddLinkModal() {
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('addLinkModal').style.display = 'block';
    document.getElementById('newLinkUrl').focus();
  }
  
  hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('addLinkModal').style.display = 'none';
    
    // Clear form
    document.getElementById('newLinkUrl').value = '';
    document.getElementById('newLinkTitle').value = '';
    document.getElementById('newLinkNote').value = '';
    document.getElementById('newLinkTags').value = '';
  }
  
  saveNewLink() {
    const url = document.getElementById('newLinkUrl').value.trim();
    const title = document.getElementById('newLinkTitle').value.trim();
    const note = document.getElementById('newLinkNote').value.trim();
    const tagsInput = document.getElementById('newLinkTags').value.trim();
    
    if (!url || !title) {
      alert('URL and title are required');
      return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    const domain = new URL(url).hostname;
    
    const newLink = {
      id: Date.now().toString(),
      title,
      url,
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}`,
      note,
      tags,
      savedAt: new Date().toISOString(),
      visitCount: 0
    };
    
    this.links.unshift(newLink);
    this.hideModal();
    this.filterLinks();
    this.updateStats();
  }
  
  toggleSelection(linkId, selected) {
    if (selected) {
      this.selectedLinks.add(linkId);
    } else {
      this.selectedLinks.delete(linkId);
    }
    
    const card = document.querySelector(`[data-link-id="${linkId}"]`);
    if (card) {
      card.classList.toggle('selected', selected);
    }
    
    this.updateMoveButton();
  }
  
  updateMoveButton() {
    const moveBtn = document.getElementById('moveBtn');
    if (!moveBtn) {
      // Create move button if it doesn't exist
      const filterBar = document.querySelector('.filter-bar');
      if (filterBar) {
        const moveButton = document.createElement('button');
        moveButton.id = 'moveBtn';
        moveButton.className = 'btn btn-secondary';
        moveButton.style.display = 'none';
        moveButton.innerHTML = '📁 Move to Folder';
        filterBar.appendChild(moveButton);
        
        moveButton.addEventListener('click', () => this.showMoveDropdown());
      }
    }
    
    const btn = document.getElementById('moveBtn');
    if (btn) {
      if (this.selectedLinks.size > 0) {
        btn.style.display = 'inline-block';
        btn.textContent = `📁 Move ${this.selectedLinks.size} link${this.selectedLinks.size > 1 ? 's' : ''}`;
      } else {
        btn.style.display = 'none';
      }
    }
  }
  
  showMoveDropdown() {
    const dropdown = document.getElementById('folderDropdown');
    if (!dropdown) {
      // Create dropdown if it doesn't exist
      const moveBtn = document.getElementById('moveBtn');
      const dropdownDiv = document.createElement('div');
      dropdownDiv.id = 'folderDropdown';
      dropdownDiv.className = 'dropdown-menu';
      dropdownDiv.style.cssText = `
        position: absolute;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 8px;
        margin-top: 4px;
        z-index: 1000;
        display: none;
      `;
      
      dropdownDiv.innerHTML = `
        <button class="dropdown-item" data-folder-id="" style="display: block; width: 100%; padding: 8px; background: none; border: none; color: white; text-align: left; cursor: pointer; border-radius: 4px;">No Folder</button>
        ${this.folders.map(folder => `
          <button class="dropdown-item" data-folder-id="${folder.id}" style="display: block; width: 100%; padding: 8px; background: none; border: none; color: white; text-align: left; cursor: pointer; border-radius: 4px;">
            <span style="display: inline-block; width: 12px; height: 12px; background: ${folder.color}; border-radius: 50%; margin-right: 8px;"></span>
            ${folder.name}
          </button>
        `).join('')}
      `;
      
      moveBtn.parentNode.appendChild(dropdownDiv);
      
      // Add click handlers
      dropdownDiv.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          this.moveSelectedToFolder(item.dataset.folderId);
          dropdownDiv.style.display = 'none';
        });
        
        item.addEventListener('mouseenter', () => {
          item.style.background = '#333';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.background = 'none';
        });
      });
    }
    
    const dropdownEl = document.getElementById('folderDropdown');
    dropdownEl.style.display = dropdownEl.style.display === 'block' ? 'none' : 'block';
  }
  
  moveSelectedToFolder(folderId) {
    this.selectedLinks.forEach(linkId => {
      const link = this.links.find(l => l.id === linkId);
      if (link) {
        if (folderId) {
          link.folderId = folderId;
        } else {
          delete link.folderId;
        }
      }
    });
    
    this.selectedLinks.clear();
    this.renderLinks();
    this.updateMoveButton();
  }
    const newLinks = [
      {
        id: Date.now().toString(),
        title: 'Medium - Where good ideas find you',
        url: 'https://medium.com',
        domain: 'medium.com',
        favicon: 'https://medium.com/favicon.ico',
        note: 'Platform for reading and writing articles',
        tags: ['reading', 'articles', 'blog'],
        savedAt: new Date().toISOString(),
        visitCount: 3
      },
      {
        id: (Date.now() + 1).toString(),
        title: 'LinkedIn - Professional Network',
        url: 'https://linkedin.com',
        domain: 'linkedin.com',
        favicon: 'https://linkedin.com/favicon.ico',
        note: 'Professional networking platform',
        tags: ['career', 'networking', 'professional'],
        savedAt: new Date().toISOString(),
        visitCount: 7
      }
    ];
    
    this.links.push(...newLinks);
    this.filterLinks();
    this.renderTags();
    this.updateStats();
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LinkSaverDashboard();
});