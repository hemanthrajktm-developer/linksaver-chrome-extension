// LinkSaver Dashboard JavaScript
class LinkSaverDashboard {
  constructor() {
    this.links = [];
    this.folders = [];
    this.filteredLinks = [];
    this.currentFilter = 'all';
    this.selectedLinks = new Set();
    this.searchQuery = '';
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderFolders();
    this.renderTags();
    this.renderLinks();
    this.updateStats();
  }
  
  async loadData() {
    try {
      const result = await chrome.storage.local.get(['links', 'folders']);
      this.links = result.links || [];
      this.folders = result.folders || [];
      this.filteredLinks = [...this.links];
    } catch (error) {
      console.log('Storage not available, using empty data');
    }
  }
  
  async saveData() {
    try {
      await chrome.storage.local.set({ 
        links: this.links, 
        folders: this.folders 
      });
    } catch (error) {
      console.log('Could not save to storage');
    }
  }
  
  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.filterLinks();
      });
    }
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveFilter(e.target.dataset.filter);
      });
    });
    
    // Buttons
    const addLinkBtn = document.getElementById('addLinkBtn');
    if (addLinkBtn) {
      addLinkBtn.addEventListener('click', () => this.showAddLinkModal());
    }
    
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportLinks());
    }
    
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importLinks());
    }
    
    const addFolderBtn = document.getElementById('addFolderBtn');
    if (addFolderBtn) {
      addFolderBtn.addEventListener('click', () => this.showAddFolderModal());
    }
    
    // Modal
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) this.hideModal();
      });
    }
    
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });
    
    const saveBtn = document.getElementById('saveNewLink');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveNewLink());
    }
    
    const saveFolderBtn = document.getElementById('saveNewFolder');
    if (saveFolderBtn) {
      saveFolderBtn.addEventListener('click', () => this.saveNewFolder());
    }
  }
  
  renderFolders() {
    const folderList = document.getElementById('folderList');
    if (!folderList) return;
    
    folderList.innerHTML = this.folders.map(folder => `
      <li class="folder-item ${this.currentFolder === folder.id ? 'active' : ''}" data-folder-id="${folder.id}">
        <div class="folder-info">
          <div class="folder-color" style="background: ${folder.color};"></div>
          <span class="folder-name">${folder.name}</span>
        </div>
        <div class="folder-actions">
          <button class="folder-action" data-action="delete" title="Delete">🗑️</button>
        </div>
      </li>
    `).join('');
    
    // Add folder click handlers
    folderList.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.folder-actions')) {
          this.setActiveFolder(item.dataset.folderId);
        }
      });
    });
  }
  
  renderTags() {
    const tagCloud = document.getElementById('tagCloud');
    if (!tagCloud) return;
    
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
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = tagEl.dataset.tag;
        }
        this.filterLinks();
      });
    });
  }
  
  renderLinks() {
    const container = document.getElementById('linksGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;
    
    if (this.filteredLinks.length === 0) {
      container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    
    container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
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
    
    // Add action button listeners
    container.querySelectorAll('.link-action').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const linkId = btn.closest('.link-card').dataset.linkId;
        const link = this.links.find(l => l.id === linkId);
        
        if (!link) return;
        
        switch (action) {
          case 'favorite':
            await this.toggleFavorite(link);
            break;
          case 'pin':
            await this.togglePin(link);
            break;
          case 'delete':
            await this.deleteLink(linkId);
            break;
        }
      });
    });
    
    this.updateMoveButton();
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
    let moveBtn = document.getElementById('moveBtn');
    
    if (!moveBtn && this.selectedLinks.size > 0) {
      // Create move button
      const filterBar = document.querySelector('.filter-bar');
      if (filterBar) {
        moveBtn = document.createElement('button');
        moveBtn.id = 'moveBtn';
        moveBtn.className = 'btn btn-secondary';
        moveBtn.innerHTML = '📁 Move to Folder';
        filterBar.appendChild(moveBtn);
        
        moveBtn.addEventListener('click', () => this.showMoveDropdown());
      }
    }
    
    if (moveBtn) {
      if (this.selectedLinks.size > 0) {
        moveBtn.style.display = 'inline-block';
        moveBtn.textContent = `📁 Move ${this.selectedLinks.size} link${this.selectedLinks.size > 1 ? 's' : ''}`;
      } else {
        moveBtn.style.display = 'none';
      }
    }
  }
  
  showMoveDropdown() {
    let dropdown = document.getElementById('folderDropdown');
    
    if (!dropdown) {
      const moveBtn = document.getElementById('moveBtn');
      dropdown = document.createElement('div');
      dropdown.id = 'folderDropdown';
      dropdown.style.cssText = `
        position: fixed;
        background: #1a1a1a;
        border: 1px solid #bae637;
        border-radius: 8px;
        padding: 8px;
        z-index: 1000;
        min-width: 200px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        top: ${moveBtn.getBoundingClientRect().bottom + 5}px;
        right: ${window.innerWidth - moveBtn.getBoundingClientRect().right}px;
      `;
      
      dropdown.innerHTML = `
        <div style="color: #bae637; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Move to Folder</div>
        <button class="dropdown-item" data-folder-id="" style="display: block; width: 100%; padding: 8px 12px; background: none; border: none; color: white; text-align: left; cursor: pointer; border-radius: 4px; margin-bottom: 2px;">📂 No Folder</button>
        ${this.folders.map(folder => `
          <button class="dropdown-item" data-folder-id="${folder.id}" style="display: block; width: 100%; padding: 8px 12px; background: none; border: none; color: white; text-align: left; cursor: pointer; border-radius: 4px; margin-bottom: 2px;">
            <span style="display: inline-block; width: 12px; height: 12px; background: ${folder.color}; border-radius: 50%; margin-right: 8px;"></span>
            ${folder.name}
          </button>
        `).join('')}
      `;
      
      document.body.appendChild(dropdown);
      
      // Add click handlers
      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          this.moveSelectedToFolder(item.dataset.folderId);
          dropdown.remove();
        });
        
        item.addEventListener('mouseenter', () => {
          item.style.background = '#333';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.background = 'none';
        });
      });
      
      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', (e) => {
          if (!dropdown.contains(e.target) && e.target !== moveBtn) {
            dropdown.remove();
          }
        }, { once: true });
      }, 100);
    }
  }
  
  async moveSelectedToFolder(folderId) {
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
    await this.saveData();
    this.renderLinks();
  }
  
  filterLinks() {
    let filtered = [...this.links];
    
    if (this.searchQuery) {
      filtered = filtered.filter(link => 
        link.title.toLowerCase().includes(this.searchQuery) ||
        link.domain.toLowerCase().includes(this.searchQuery) ||
        (link.note && link.note.toLowerCase().includes(this.searchQuery)) ||
        (link.tags && link.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)))
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
      case 'folder':
        if (this.currentFolder) {
          filtered = filtered.filter(link => link.folderId === this.currentFolder);
        }
        break;
    }
    
    this.filteredLinks = filtered;
    this.renderLinks();
  }
  
  setActiveFolder(folderId) {
    this.currentFolder = folderId;
    this.currentFilter = 'folder';
    
    // Update nav states
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Update folder states
    document.querySelectorAll('.folder-item').forEach(item => {
      item.classList.toggle('active', item.dataset.folderId === folderId);
    });
    
    // Update content title
    const folder = this.folders.find(f => f.id === folderId);
    const titleEl = document.getElementById('contentTitle');
    if (titleEl) {
      titleEl.textContent = folder ? folder.name : 'Folder';
    }
    
    this.filterLinks();
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
    
    const titleEl = document.getElementById('contentTitle');
    if (titleEl) {
      titleEl.textContent = titles[filter] || filter;
    }
    
    this.filterLinks();
  }
  
  updateStats() {
    const totalEl = document.getElementById('totalLinks');
    const todayEl = document.getElementById('savedToday');
    
    if (totalEl) totalEl.textContent = this.links.length;
    if (todayEl) {
      todayEl.textContent = this.links.filter(link => 
        new Date(link.savedAt).toDateString() === new Date().toDateString()
      ).length;
    }
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
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('addLinkModal');
    const folderModal = document.getElementById('addFolderModal');
    
    if (overlay) overlay.style.display = 'flex';
    if (modal) modal.style.display = 'block';
    if (folderModal) folderModal.style.display = 'none';
    
    // Populate folder dropdown
    const folderSelect = document.getElementById('newLinkFolder');
    if (folderSelect) {
      folderSelect.innerHTML = '<option value="">No Folder</option>' + 
        this.folders.map(folder => `
          <option value="${folder.id}">${folder.name}</option>
        `).join('');
    }
    
    const urlInput = document.getElementById('newLinkUrl');
    if (urlInput) urlInput.focus();
  }
  
  showAddFolderModal() {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('addFolderModal');
    const linkModal = document.getElementById('addLinkModal');
    
    if (overlay) overlay.style.display = 'flex';
    if (modal) modal.style.display = 'block';
    if (linkModal) linkModal.style.display = 'none';
    
    const nameInput = document.getElementById('newFolderName');
    if (nameInput) nameInput.focus();
  }
  
  hideModal() {
    const overlay = document.getElementById('modalOverlay');
    const linkModal = document.getElementById('addLinkModal');
    const folderModal = document.getElementById('addFolderModal');
    
    if (overlay) overlay.style.display = 'none';
    if (linkModal) linkModal.style.display = 'none';
    if (folderModal) folderModal.style.display = 'none';
    
    // Clear forms
    const inputs = ['newLinkUrl', 'newLinkTitle', 'newLinkNote', 'newLinkTags', 'newFolderName', 'newFolderDesc'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
  
  async saveNewLink() {
    const url = document.getElementById('newLinkUrl')?.value.trim();
    const title = document.getElementById('newLinkTitle')?.value.trim();
    const note = document.getElementById('newLinkNote')?.value.trim();
    const tagsInput = document.getElementById('newLinkTags')?.value.trim();
    const folderId = document.getElementById('newLinkFolder')?.value;
    
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
    
    if (folderId) {
      newLink.folderId = folderId;
    }
    
    this.links.unshift(newLink);
    await this.saveData();
    this.hideModal();
    this.filterLinks();
    this.renderTags();
    this.updateStats();
  }
  
  async saveNewFolder() {
    const name = document.getElementById('newFolderName')?.value.trim();
    const description = document.getElementById('newFolderDesc')?.value.trim();
    const selectedColor = document.querySelector('.color-option.selected');
    const color = selectedColor ? selectedColor.dataset.color : '#2563eb';
    
    if (!name) {
      alert('Folder name is required');
      return;
    }
    
    const newFolder = {
      id: Date.now().toString(),
      name,
      description,
      color,
      createdAt: new Date().toISOString()
    };
    
    this.folders.push(newFolder);
    await this.saveData();
    this.hideModal();
    this.renderFolders();
  }
  
  exportLinks() {
    const data = {
      links: this.links,
      folders: this.folders,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `linksaver-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  importLinks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          if (data.links && Array.isArray(data.links)) {
            // Merge with existing data
            const existingUrls = new Set(this.links.map(link => link.url));
            const newLinks = data.links.filter(link => !existingUrls.has(link.url));
            
            this.links.push(...newLinks);
            
            if (data.folders && Array.isArray(data.folders)) {
              const existingFolderNames = new Set(this.folders.map(f => f.name));
              const newFolders = data.folders.filter(folder => !existingFolderNames.has(folder.name));
              this.folders.push(...newFolders);
            }
            
            await this.saveData();
            this.filterLinks();
            this.renderFolders();
            this.renderTags();
            this.updateStats();
            
            alert(`Imported ${newLinks.length} new links successfully!`);
          } else {
            alert('Invalid file format');
          }
        } catch (error) {
          alert('Error reading file: ' + error.message);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }
  async toggleFavorite(link) {
    link.favorite = !link.favorite;
    await this.saveData();
    this.renderLinks();
  }
  
  async togglePin(link) {
    link.pinned = !link.pinned;
    await this.saveData();
    this.renderLinks();
  }
  
  async deleteLink(linkId) {
    if (confirm('Are you sure you want to delete this link?')) {
      const index = this.links.findIndex(l => l.id === linkId);
      if (index > -1) {
        this.links.splice(index, 1);
        await this.saveData();
        this.filterLinks();
        this.renderTags();
        this.updateStats();
      }
    }
  }
  
  async addMoreTestData() {
    const newLinks = [
      {
        id: Date.now().toString(),
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
        id: (Date.now() + 1).toString(),
        title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers',
        url: 'https://stackoverflow.com',
        domain: 'stackoverflow.com',
        favicon: 'https://stackoverflow.com/favicon.ico',
        note: 'Best place for programming questions and answers',
        tags: ['development', 'help', 'programming'],
        savedAt: new Date().toISOString(),
        visitCount: 12,
        pinned: true
      },
      {
        id: (Date.now() + 2).toString(),
        title: 'YouTube - Broadcast Yourself',
        url: 'https://youtube.com',
        domain: 'youtube.com',
        favicon: 'https://youtube.com/favicon.ico',
        note: 'Video platform for learning and entertainment',
        tags: ['video', 'learning', 'entertainment'],
        savedAt: new Date().toISOString(),
        visitCount: 8
      }
    ];
    
    const newFolders = [
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
    
    this.links.push(...newLinks);
    this.folders.push(...newFolders);
    await this.saveData();
    this.filterLinks();
    this.renderFolders();
    this.renderTags();
    this.updateStats();
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LinkSaverDashboard();
});