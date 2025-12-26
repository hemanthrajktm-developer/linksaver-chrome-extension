// LinkSaver Popup JavaScript
class LinkSaverPopup {
  constructor() {
    this.currentTab = null;
    this.domainColors = {
      'github.com': '#333',
      'youtube.com': '#FF0000',
      'medium.com': '#00AB6C',
      'stackoverflow.com': '#F48024',
      'linkedin.com': '#0077B5',
      'twitter.com': '#1DA1F2',
      'reddit.com': '#FF4500'
    };
    
    this.domainTags = {
      'github.com': ['code', 'development', 'open-source'],
      'youtube.com': ['video', 'learning', 'entertainment'],
      'medium.com': ['article', 'reading', 'blog'],
      'stackoverflow.com': ['code', 'help', 'programming'],
      'linkedin.com': ['career', 'networking', 'professional'],
      'twitter.com': ['social', 'news', 'updates'],
      'reddit.com': ['discussion', 'community', 'social'],
      'docs.google.com': ['document', 'work', 'collaboration'],
      'notion.so': ['notes', 'productivity', 'workspace'],
      'figma.com': ['design', 'ui', 'collaboration']
    };
    
    this.init();
  }
  
  async init() {
    await this.getCurrentTab();
    this.setupEventListeners();
    this.populateCurrentPage();
    this.loadRecentLinks();
  }
  
  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;
  }
  
  setupEventListeners() {
    // Save button
    document.getElementById('saveBtn').addEventListener('click', () => this.saveCurrentLink());
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    
    // Dashboard button
    document.getElementById('openDashboard').addEventListener('click', () => this.openDashboard());
    
    // View all button
    document.getElementById('viewAll').addEventListener('click', () => this.openDashboard());
    
    // Quick note enter key
    document.getElementById('quickNote').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveCurrentLink();
      }
    });
    
    // Auto-focus on note input
    setTimeout(() => {
      document.getElementById('quickNote').focus();
    }, 300);
  }
  
  populateCurrentPage() {
    if (!this.currentTab) return;
    
    const { title, url, favIconUrl } = this.currentTab;
    const domain = new URL(url).hostname;
    
    // Set page info
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageDomain').textContent = domain;
    
    // Set favicon
    const faviconEl = document.getElementById('pageFavicon');
    if (favIconUrl) {
      faviconEl.src = favIconUrl;
      faviconEl.style.display = 'block';
    } else {
      faviconEl.style.display = 'none';
    }
    
    // Set domain indicator color
    const indicator = document.getElementById('domainIndicator');
    const domainColor = this.domainColors[domain] || '#007AFF';
    indicator.style.backgroundColor = domainColor;
    
    // Generate auto tags
    this.generateAutoTags(domain, title, url);
  }
  
  generateAutoTags(domain, title, url) {
    const tags = new Set();
    
    // Domain-based tags
    if (this.domainTags[domain]) {
      this.domainTags[domain].forEach(tag => tags.add(tag));
    }
    
    // Content-based tags
    const titleLower = title.toLowerCase();
    const urlLower = url.toLowerCase();
    
    // Job-related
    if (titleLower.includes('job') || titleLower.includes('career') || titleLower.includes('hiring')) {
      tags.add('jobs');
    }
    
    // Tutorial/Learning
    if (titleLower.includes('tutorial') || titleLower.includes('guide') || titleLower.includes('how to')) {
      tags.add('tutorial');
    }
    
    // Documentation
    if (titleLower.includes('docs') || titleLower.includes('documentation') || titleLower.includes('api')) {
      tags.add('documentation');
    }
    
    // News
    if (titleLower.includes('news') || domain.includes('news') || domain.includes('techcrunch')) {
      tags.add('news');
    }
    
    // Tools
    if (titleLower.includes('tool') || titleLower.includes('app') || titleLower.includes('software')) {
      tags.add('tools');
    }
    
    this.renderAutoTags(Array.from(tags));
  }
  
  renderAutoTags(tags) {
    const container = document.getElementById('autoTags');
    container.innerHTML = '';
    
    tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = `#${tag}`;
      tagEl.addEventListener('click', () => this.toggleTag(tagEl, tag));
      container.appendChild(tagEl);
    });
  }
  
  toggleTag(tagEl, tag) {
    tagEl.classList.toggle('selected');
    // Add visual feedback
    tagEl.style.transform = 'scale(0.95)';
    setTimeout(() => {
      tagEl.style.transform = '';
    }, 150);
  }
  
  async saveCurrentLink() {
    const saveBtn = document.getElementById('saveBtn');
    const saveText = saveBtn.querySelector('.save-text');
    const saveLoading = saveBtn.querySelector('.save-loading');
    const saveSuccess = saveBtn.querySelector('.save-success');
    
    // Show loading state
    saveBtn.classList.add('saving');
    saveText.style.display = 'none';
    saveLoading.style.display = 'inline-flex';
    
    try {
      const linkData = {
        id: Date.now().toString(),
        title: this.currentTab.title,
        url: this.currentTab.url,
        domain: new URL(this.currentTab.url).hostname,
        favicon: this.currentTab.favIconUrl,
        note: document.getElementById('quickNote').value.trim(),
        tags: this.getSelectedTags(),
        savedAt: new Date().toISOString(),
        visitCount: 0
      };
      
      // Save to storage
      await this.saveLink(linkData);
      
      // Show success state
      saveBtn.classList.remove('saving');
      saveBtn.classList.add('success');
      saveLoading.style.display = 'none';
      saveSuccess.style.display = 'inline-flex';
      
      // Reset after delay
      setTimeout(() => {
        saveBtn.classList.remove('success');
        saveSuccess.style.display = 'none';
        saveText.style.display = 'inline-flex';
        
        // Clear form
        document.getElementById('quickNote').value = '';
        this.clearSelectedTags();
        
        // Refresh recent links
        this.loadRecentLinks();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save link:', error);
      // Show error state
      saveBtn.classList.remove('saving');
      saveLoading.style.display = 'none';
      saveText.style.display = 'inline-flex';
      saveText.textContent = '❌ Failed to save';
      
      setTimeout(() => {
        saveText.textContent = '💾 Save Link';
      }, 2000);
    }
  }
  
  getSelectedTags() {
    const selectedTags = document.querySelectorAll('.tag.selected');
    return Array.from(selectedTags).map(tag => tag.textContent.replace('#', ''));
  }
  
  clearSelectedTags() {
    document.querySelectorAll('.tag.selected').forEach(tag => {
      tag.classList.remove('selected');
    });
  }
  
  async saveLink(linkData) {
    // Get existing links
    const result = await chrome.storage.local.get(['links']);
    const links = result.links || [];
    
    // Add new link to beginning
    links.unshift(linkData);
    
    // Keep only last 1000 links to prevent storage bloat
    if (links.length > 1000) {
      links.splice(1000);
    }
    
    // Save back to storage
    await chrome.storage.local.set({ links });
  }
  
  async loadRecentLinks() {
    const result = await chrome.storage.local.get(['links']);
    const links = result.links || [];
    const recentLinks = links.slice(0, 5);
    
    this.renderRecentLinks(recentLinks);
  }
  
  renderRecentLinks(links) {
    const container = document.getElementById('recentLinks');
    
    if (links.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <p>No saved links yet</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = links.map(link => `
      <a href="${link.url}" class="recent-link" target="_blank">
        <img src="${link.favicon || '../icons/icon16.png'}" alt="" class="favicon">
        <span class="recent-link-title">${link.title}</span>
        <span class="recent-link-time">${this.getTimeAgo(link.savedAt)}</span>
      </a>
    `).join('');
  }
  
  getTimeAgo(dateString) {
    const now = new Date();
    const saved = new Date(dateString);
    const diffMs = now - saved;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }
  
  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html#settings') });
    window.close();
  }
  
  openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
    window.close();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LinkSaverPopup();
});

// Add CSS for selected tags
const style = document.createElement('style');
style.textContent = `
  .tag.selected {
    background: var(--primary) !important;
    color: white !important;
    transform: scale(1.05);
  }
`;
document.head.appendChild(style);