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
      }
    ];
    this.folders = [
      {
        id: 'folder1',
        name: 'Development',
        description: 'Programming resources',
        color: '#2563eb',
        createdAt: new Date().toISOString()
      }
    ];
    this.filteredLinks = [...this.links];
    this.currentFilter = 'all';
    this.currentFolder = null;
    this.currentSort = 'newest';
    this.searchQuery = '';
    this.activeFilters = new Set();
    this.viewMode = 'grid';
    this.selectedLinks = new Set();
    this.isSelecting = false;
    
    this.init();
  }
  
  async init() {
    console.log('Initializing LinkSaver Dashboard...');
    this.setupEventListeners();
    this.renderSidebar();
    this.populateFolderDropdowns();
    this.renderLinks();
    this.updateStats();
  }
  
  async loadLinks() {
    const result = await chrome.storage.local.get(['links', 'folders']);
    this.links = result.links || [];
    this.folders = result.folders || [];
    this.filteredLinks = [...this.links];
    console.log('Loaded links:', this.links.length, 'folders:', this.folders.length);
  }
  
  async initializeTestData() {
    // Add test data if no links exist
    if (this.links.length === 0) {
      console.log('No links found, adding test data...');
      
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
          description: 'Programming and development resources',
          color: '#2563eb',
          createdAt: new Date().toISOString(),
          linkCount: 2
        },
        {
          id: 'folder2',
          name: 'Learning',
          description: 'Educational content and tutorials',
          color: '#059669',
          createdAt: new Date().toISOString(),
          linkCount: 1
        }
      ];
      
      // Assign some links to folders
      this.links[0].folderId = 'folder1';
      this.links[1].folderId = 'folder1';
      this.links[2].folderId = 'folder2';
      
      await this.saveLinks();
      this.filteredLinks = [...this.links];
      console.log('Test data added:', this.links.length, 'links,', this.folders.length, 'folders');
    }
  }
  
  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterAndRenderLinks();
    });
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveFilter(e.target.dataset.filter);
      });
    });
    
    // Sort
    document.getElementById('sortSelect').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.filterAndRenderLinks();
    });
    
    // View controls
    document.getElementById('gridView').addEventListener('click', () => this.setViewMode('grid'));
    document.getElementById('listView').addEventListener('click', () => this.setViewMode('list'));
    
    // Theme toggle
    // document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    
    // Modal controls
    document.getElementById('addLinkBtn').addEventListener('click', () => this.showAddLinkModal());
    document.getElementById('emptyAddBtn').addEventListener('click', () => this.showAddLinkModal());
    document.getElementById('addFolderBtn').addEventListener('click', () => this.showAddFolderModal());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.hideModal();
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });
    
    // Save new link/folder
    document.getElementById('saveNewLink').addEventListener('click', () => this.saveNewLink());
    document.getElementById('saveNewFolder').addEventListener('click', () => this.saveNewFolder());
    
    // Move to folder
    document.getElementById('moveBtn').addEventListener('click', () => this.toggleMoveDropdown());
    
    // Bulk selection
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.exitSelectionMode();
      }
    });
    
    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', () => this.exportLinks());
    document.getElementById('importBtn').addEventListener('click', () => this.importLinks());
    
    // Add test data button
    document.getElementById('addTestData').addEventListener('click', () => this.addTestDataManually());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }
  
  setActiveFilter(filter) {
    this.currentFilter = filter;
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.filter === filter);
    });
    
    // Update content title
    const titles = {
      all: 'All Links',
      favorites: 'Favorite Links',
      pinned: 'Pinned Links',
      recent: 'Recent Links'
    };
    
    document.getElementById('contentTitle').textContent = titles[filter] || filter;
    this.filterAndRenderLinks();
  }
  
  setViewMode(mode) {
    this.viewMode = mode;
    
    // Update button states
    document.getElementById('gridView').classList.toggle('active', mode === 'grid');
    document.getElementById('listView').classList.toggle('active', mode === 'list');
    
    // Update container class
    const container = document.getElementById('linksGrid');
    container.className = mode === 'grid' ? 'links-grid' : 'links-list';
    
    this.renderLinks();
  }
  
  filterAndRenderLinks() {
    let filtered = [...this.links];
    
    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(link => 
        link.title.toLowerCase().includes(this.searchQuery) ||
        link.domain.toLowerCase().includes(this.searchQuery) ||
        (link.note && link.note.toLowerCase().includes(this.searchQuery)) ||
        (link.tags && link.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)))
      );
    }
    
    // Apply category filter
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
    
    // Apply tag filters
    if (this.activeFilters.size > 0) {
      filtered = filtered.filter(link => 
        link.tags && link.tags.some(tag => this.activeFilters.has(tag))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.currentSort) {
        case 'newest':
          return new Date(b.savedAt) - new Date(a.savedAt);
        case 'oldest':
          return new Date(a.savedAt) - new Date(b.savedAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'domain':
          return a.domain.localeCompare(b.domain);
        case 'visits':
          return (b.visitCount || 0) - (a.visitCount || 0);
        default:
          return 0;
      }
    });
    
    this.filteredLinks = filtered;
    this.renderLinks();
    this.updateActiveFilters();
  }
  
  renderSidebar() {
    // Render folders
    this.renderFolders();
    
    // Render tag cloud
    const tags = this.getPopularTags();
    const tagCloud = document.getElementById('tagCloud');
    tagCloud.innerHTML = tags.map(tag => `
      <span class="tag ${this.activeFilters.has(tag.name) ? 'selected' : ''}" 
            data-tag="${tag.name}">
        #${tag.name} (${tag.count})
      </span>
    `).join('');
    
    // Add tag click handlers
    tagCloud.querySelectorAll('.tag').forEach(tagEl => {
      tagEl.addEventListener('click', () => this.toggleTagFilter(tagEl.dataset.tag));
    });
  }
  
  renderFolders() {
    const folderList = document.getElementById('folderList');
    if (!folderList) return;
    
    folderList.innerHTML = this.folders.map(folder => `
      <li class="folder-item ${this.currentFolder === folder.id ? 'active' : ''}" data-folder-id="${folder.id}">
        <div class="folder-info">
          <div class="folder-color" style="background: ${folder.color};"></div>
          <span>${folder.name}</span>
        </div>
        <div class="folder-actions">
          <button class="folder-action" data-action="edit" title="Edit">✏️</button>
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
    
    // Add folder action handlers
    folderList.querySelectorAll('.folder-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const folderId = btn.closest('.folder-item').dataset.folderId;
        
        if (action === 'delete') {
          this.deleteFolder(folderId);
        }
      });
    });
  }
  
  getCategories() {
    const domainCounts = {};
    this.links.forEach(link => {
      const category = this.getDomainCategory(link.domain);
      domainCounts[category.key] = (domainCounts[category.key] || 0) + 1;
    });
    
    const categories = [
      { key: 'code', name: 'Development', icon: '💻' },
      { key: 'video', name: 'Videos', icon: '📺' },
      { key: 'article', name: 'Articles', icon: '📄' },
      { key: 'social', name: 'Social', icon: '👥' },
      { key: 'tools', name: 'Tools', icon: '🛠️' },
      { key: 'other', name: 'Other', icon: '📂' }
    ];
    
    return categories.map(cat => ({
      ...cat,
      count: domainCounts[cat.key] || 0
    })).filter(cat => cat.count > 0);
  }
  
  getDomainCategory(domain) {
    const categories = {
      'github.com': { key: 'code', name: 'Development' },
      'stackoverflow.com': { key: 'code', name: 'Development' },
      'youtube.com': { key: 'video', name: 'Videos' },
      'medium.com': { key: 'article', name: 'Articles' },
      'twitter.com': { key: 'social', name: 'Social' },
      'linkedin.com': { key: 'social', name: 'Social' },
      'figma.com': { key: 'tools', name: 'Tools' },
      'notion.so': { key: 'tools', name: 'Tools' }
    };
    
    return categories[domain] || { key: 'other', name: 'Other' };
  }
  
  getPopularTags() {
    const tagCounts = {};
    this.links.forEach(link => {
      if (link.tags) {
        link.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
  
  toggleTagFilter(tagName) {
    if (this.activeFilters.has(tagName)) {
      this.activeFilters.delete(tagName);
    } else {
      this.activeFilters.add(tagName);
    }
    
    this.filterAndRenderLinks();
    this.renderSidebar();
  }
  
  renderLinks() {
    const container = document.getElementById('linksGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;
    
    console.log('Rendering links:', this.filteredLinks.length, 'filtered from', this.links.length, 'total');
    
    if (this.filteredLinks.length === 0) {
      container.style.display = 'none';
      if (loadingState) loadingState.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    
    container.style.display = 'grid';
    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = this.filteredLinks.map(link => this.renderLinkCard(link)).join('');
    
    // Add event listeners to cards
    container.querySelectorAll('.link-card').forEach(card => {
      const linkId = card.dataset.linkId;
      const link = this.links.find(l => l.id === linkId);
      
      if (!link) return;
      
      card.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') {
          this.toggleLinkSelection(linkId, e.target.checked);
        } else if (!e.target.closest('.link-actions')) {
          this.openLink(link);
        }
      });
      
      // Long press to enter selection mode
      let pressTimer;
      card.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
          if (!this.isSelecting) {
            this.enterSelectionMode();
            const checkbox = card.querySelector('.link-checkbox');
            if (checkbox) {
              checkbox.checked = true;
              this.toggleLinkSelection(linkId, true);
            }
          }
        }, 500);
      });
      
      card.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
      });
    });
    
    // Add action button listeners
    container.querySelectorAll('.link-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const linkId = btn.closest('.link-card').dataset.linkId;
        const link = this.links.find(l => l.id === linkId);
        
        if (!link) return;
        
        switch (action) {
          case 'favorite':
            this.toggleFavorite(link);
            break;
          case 'pin':
            this.togglePin(link);
            break;
          case 'edit':
            this.editLink(link);
            break;
          case 'delete':
            this.deleteLink(link);
            break;
        }
      });
    });
  }
  
  renderLinkCard(link) {
    const timeAgo = this.getTimeAgo(link.savedAt);
    const domainColor = this.getDomainColor(link.domain);
    const folder = link.folderId ? this.folders.find(f => f.id === link.folderId) : null;
    
    return `
      <div class="link-card glass-card ${this.selectedLinks.has(link.id) ? 'selected' : ''}" data-link-id="${link.id}">
        <input type="checkbox" class="link-checkbox" ${this.selectedLinks.has(link.id) ? 'checked' : ''}>
        
        <div class="link-card-header">
          <img src="${link.favicon || '../icons/icon16.png'}" alt="" class="link-favicon">
          <span class="link-domain" style="background-color: ${domainColor}20; color: ${domainColor};">
            ${link.domain}
          </span>
          ${folder ? `<span class="folder-badge" style="background: ${folder.color}20; color: ${folder.color}; font-size: 10px; padding: 2px 6px; border-radius: 8px;">${folder.name}</span>` : ''}
          <div class="link-actions">
            <button class="link-action" data-action="favorite" title="Toggle Favorite">
              ${link.favorite ? '⭐' : '☆'}
            </button>
            <button class="link-action" data-action="pin" title="Toggle Pin">
              ${link.pinned ? '📌' : '📍'}
            </button>
            <button class="link-action" data-action="edit" title="Edit Link">✏️</button>
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
          <span>Saved ${timeAgo}</span>
          <span>${link.visitCount || 0} visits</span>
        </div>
      </div>
    `;
  }
  
  getDomainColor(domain) {
    const colors = {
      'github.com': '#333333',
      'youtube.com': '#FF0000',
      'medium.com': '#00AB6C',
      'stackoverflow.com': '#F48024',
      'linkedin.com': '#0077B5',
      'twitter.com': '#1DA1F2',
      'reddit.com': '#FF4500'
    };
    
    return colors[domain] || '#007AFF';
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
  
  async openLink(link) {
    // Increment visit count
    link.visitCount = (link.visitCount || 0) + 1;
    await this.saveLinks();
    
    // Open link
    window.open(link.url, '_blank');
  }
  
  async toggleFavorite(link) {
    link.favorite = !link.favorite;
    await this.saveLinks();
    this.renderLinks();
  }
  
  async togglePin(link) {
    link.pinned = !link.pinned;
    await this.saveLinks();
    this.renderLinks();
  }
  
  async deleteLink(link) {
    if (confirm('Are you sure you want to delete this link?')) {
      const index = this.links.findIndex(l => l.id === link.id);
      if (index > -1) {
        this.links.splice(index, 1);
        await this.saveLinks();
        this.filterAndRenderLinks();
        this.renderSidebar();
        this.updateStats();
      }
    }
  }
  
  editLink(link) {
    // Populate edit modal with existing data
    document.getElementById('newLinkUrl').value = link.url;
    document.getElementById('newLinkTitle').value = link.title;
    document.getElementById('newLinkNote').value = link.note || '';
    document.getElementById('newLinkTags').value = link.tags ? link.tags.join(', ') : '';
    document.getElementById('newLinkFolder').value = link.folderId || '';
    
    // Store the link being edited
    this.editingLink = link;
    
    // Show modal
    this.showAddLinkModal();
    
    // Update button text
    document.getElementById('saveNewLink').textContent = 'Update Link';
  }
  
  updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    container.innerHTML = Array.from(this.activeFilters).map(filter => `
      <span class="filter-chip">
        #${filter}
        <span class="filter-chip-remove" data-filter="${filter}">×</span>
      </span>
    `).join('');
    
    // Add remove handlers
    container.querySelectorAll('.filter-chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleTagFilter(btn.dataset.filter);
      });
    });
  }
  
  updateStats() {
    const today = new Date().toDateString();
    const savedToday = this.links.filter(link => 
      new Date(link.savedAt).toDateString() === today
    ).length;
    
    document.getElementById('totalLinks').textContent = this.links.length;
    document.getElementById('savedToday').textContent = savedToday;
  }
  
  showAddLinkModal() {
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('addLinkModal').style.display = 'block';
    document.getElementById('addFolderModal').style.display = 'none';
    document.getElementById('newLinkUrl').focus();
    
    // Reset button text if not editing
    if (!this.editingLink) {
      document.getElementById('saveNewLink').textContent = 'Save Link';
    }
  }
  
  hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('addLinkModal').style.display = 'none';
    document.getElementById('addFolderModal').style.display = 'none';
    
    // Clear editing state
    this.editingLink = null;
    document.getElementById('saveNewLink').textContent = 'Save Link';
    
    // Clear forms
    document.getElementById('newLinkUrl').value = '';
    document.getElementById('newLinkTitle').value = '';
    document.getElementById('newLinkNote').value = '';
    document.getElementById('newLinkTags').value = '';
    document.getElementById('newLinkFolder').value = '';
    
    document.getElementById('newFolderName').value = '';
    document.getElementById('newFolderDesc').value = '';
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
    document.querySelector('.color-option').classList.add('selected');
  }
  
  async saveNewLink() {
    const url = document.getElementById('newLinkUrl').value.trim();
    const title = document.getElementById('newLinkTitle').value.trim();
    const note = document.getElementById('newLinkNote').value.trim();
    const tagsInput = document.getElementById('newLinkTags').value.trim();
    const folderId = document.getElementById('newLinkFolder').value;
    
    if (!url || !title) {
      alert('URL and title are required');
      return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    const domain = new URL(url).hostname;
    
    if (this.editingLink) {
      // Update existing link
      this.editingLink.title = title;
      this.editingLink.url = url;
      this.editingLink.domain = domain;
      this.editingLink.note = note;
      this.editingLink.tags = tags;
      
      if (folderId) {
        this.editingLink.folderId = folderId;
      } else {
        delete this.editingLink.folderId;
      }
      
      this.editingLink = null;
    } else {
      // Create new link
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
    }
    
    await this.saveLinks();
    
    this.hideModal();
    this.filterAndRenderLinks();
    this.renderSidebar();
    this.updateStats();
  }
  
  toggleLinkSelection(linkId, selected) {
    if (selected) {
      this.selectedLinks.add(linkId);
    } else {
      this.selectedLinks.delete(linkId);
    }
    
    // Update card appearance
    const card = document.querySelector(`[data-link-id="${linkId}"]`);
    if (card) {
      card.classList.toggle('selected', selected);
    }
    
    // Show/hide move button
    const moveBtn = document.getElementById('moveBtn');
    if (this.selectedLinks.size > 0) {
      moveBtn.style.display = 'inline-flex';
      moveBtn.textContent = `📁 Move ${this.selectedLinks.size} link${this.selectedLinks.size > 1 ? 's' : ''}`;
    } else {
      moveBtn.style.display = 'none';
    }
  }
  
  async saveLinks() {
    await chrome.storage.local.set({ links: this.links, folders: this.folders });
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
    document.getElementById('contentTitle').textContent = folder ? folder.name : 'Folder';
    
    this.filterAndRenderLinks();
  }
  
  showAddFolderModal() {
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('addLinkModal').style.display = 'none';
    document.getElementById('addFolderModal').style.display = 'block';
    document.getElementById('newFolderName').focus();
    
    // Setup color picker
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
      });
    });
  }
  
  async saveNewFolder() {
    const name = document.getElementById('newFolderName').value.trim();
    const description = document.getElementById('newFolderDesc').value.trim();
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
      createdAt: new Date().toISOString(),
      linkCount: 0
    };
    
    this.folders.push(newFolder);
    await this.saveLinks();
    
    this.hideModal();
    this.renderSidebar();
    this.populateFolderDropdowns();
  }
  
  async deleteFolder(folderId) {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const linksInFolder = this.links.filter(link => link.folderId === folderId);
    
    let message = `Delete folder "${folder.name}"?`;
    if (linksInFolder.length > 0) {
      message += `\n\nThis will move ${linksInFolder.length} links back to "No Folder".`;
    }
    
    if (confirm(message)) {
      // Remove folder
      this.folders = this.folders.filter(f => f.id !== folderId);
      
      // Move links back to no folder
      this.links.forEach(link => {
        if (link.folderId === folderId) {
          delete link.folderId;
        }
      });
      
      await this.saveLinks();
      
      // Reset view if we were viewing this folder
      if (this.currentFolder === folderId) {
        this.setActiveFilter('all');
      }
      
      this.renderSidebar();
      this.populateFolderDropdowns();
      this.filterAndRenderLinks();
    }
  }
  
  populateFolderDropdowns() {
    // Populate add link modal folder dropdown
    const newLinkFolder = document.getElementById('newLinkFolder');
    newLinkFolder.innerHTML = '<option value="">No Folder</option>' + 
      this.folders.map(folder => `
        <option value="${folder.id}">${folder.name}</option>
      `).join('');
    
    // Populate move dropdown
    const folderDropdown = document.getElementById('folderDropdown');
    folderDropdown.innerHTML = 
      '<button class="dropdown-item" data-folder-id="">No Folder</button>' +
      this.folders.map(folder => `
        <button class="dropdown-item" data-folder-id="${folder.id}">
          <div class="folder-color" style="background: ${folder.color}; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px;"></div>
          ${folder.name}
        </button>
      `).join('');
    
    // Add move dropdown handlers
    folderDropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        this.moveSelectedLinksToFolder(item.dataset.folderId);
      });
    });
  }
  
  toggleMoveDropdown() {
    const dropdown = document.getElementById('folderDropdown');
    dropdown.classList.toggle('show');
  }
  
  enterSelectionMode() {
    this.isSelecting = true;
    document.getElementById('moveBtn').style.display = 'inline-flex';
    document.querySelectorAll('.link-card').forEach(card => {
      card.classList.add('selecting');
    });
  }
  
  exitSelectionMode() {
    this.isSelecting = false;
    this.selectedLinks.clear();
    document.getElementById('moveBtn').style.display = 'none';
    document.getElementById('folderDropdown').classList.remove('show');
    document.querySelectorAll('.link-card').forEach(card => {
      card.classList.remove('selecting', 'selected');
    });
  }
  
  async moveSelectedLinksToFolder(folderId) {
    if (this.selectedLinks.size === 0) return;
    
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
    
    await this.saveLinks();
    this.exitSelectionMode();
    this.filterAndRenderLinks();
    this.renderSidebar();
  }
  
  exportLinks() {
    const dataStr = JSON.stringify(this.links, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkvault-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    
    // Save theme preference
    chrome.storage.local.set({ theme: newTheme });
    
    // Add animation class
    document.body.classList.add('theme-transitioning');
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
  }
  
  async loadTheme() {
    const result = await chrome.storage.local.get(['theme']);
    const savedTheme = result.theme || 'auto';
    
    if (savedTheme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      document.getElementById('themeToggle').textContent = prefersDark ? '☀️' : '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
  }
  
  async addTestDataManually() {
    console.log('Adding test data manually...');
    
    // Clear existing data
    this.links = [];
    this.folders = [];
    
    // Add test links
    this.links = [
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
        savedAt: new Date(Date.now() - 86400000).toISOString(),
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
        savedAt: new Date(Date.now() - 172800000).toISOString(),
        visitCount: 8
      },
      {
        id: (Date.now() + 3).toString(),
        title: 'Medium - Where good ideas find you',
        url: 'https://medium.com',
        domain: 'medium.com',
        favicon: 'https://medium.com/favicon.ico',
        note: 'Platform for reading and writing articles',
        tags: ['reading', 'articles', 'blog'],
        savedAt: new Date(Date.now() - 259200000).toISOString(),
        visitCount: 3
      }
    ];
    
    // Add test folders
    this.folders = [
      {
        id: 'folder1',
        name: 'Development',
        description: 'Programming and development resources',
        color: '#2563eb',
        createdAt: new Date().toISOString(),
        linkCount: 2
      },
      {
        id: 'folder2',
        name: 'Learning',
        description: 'Educational content and tutorials',
        color: '#059669',
        createdAt: new Date().toISOString(),
        linkCount: 1
      },
      {
        id: 'folder3',
        name: 'Reading',
        description: 'Articles and blog posts',
        color: '#d97706',
        createdAt: new Date().toISOString(),
        linkCount: 1
      }
    ];
    
    // Assign links to folders
    this.links[0].folderId = 'folder1';
    this.links[1].folderId = 'folder1';
    this.links[2].folderId = 'folder2';
    this.links[3].folderId = 'folder3';
    
    // Save and refresh
    await this.saveLinks();
    this.filteredLinks = [...this.links];
    
    // Refresh UI
    this.renderSidebar();
    this.populateFolderDropdowns();
    this.renderLinks();
    this.updateStats();
    
    console.log('Test data added successfully:', this.links.length, 'links,', this.folders.length, 'folders');
  }
  
  handleKeyboardShortcuts(e) {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'k':
          e.preventDefault();
          document.getElementById('searchInput').focus();
          break;
        case 'n':
          e.preventDefault();
          this.showAddLinkModal();
          break;
      }
    }
    
    if (e.key === 'Escape') {
      this.hideModal();
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LinkSaverDashboard();
});