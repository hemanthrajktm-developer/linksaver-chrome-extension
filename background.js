// LinkSaver Background Service Worker
class LinkSaverBackground {
  constructor() {
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });
    
    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
    
    // Handle context menu clicks (if we add context menus later)
    chrome.contextMenus?.onClicked?.addListener((info, tab) => {
      this.handleContextMenu(info, tab);
    });
    
    // Handle tab updates for smart suggestions
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
  }
  
  async handleInstallation(details) {
    if (details.reason === 'install') {
      // First time installation
      await this.initializeStorage();
      this.showWelcomeNotification();
    } else if (details.reason === 'update') {
      // Extension update
      await this.migrateData(details.previousVersion);
    }
  }
  
  async initializeStorage() {
    // Initialize with empty links array if not exists
    const result = await chrome.storage.local.get(['links']);
    if (!result.links) {
      await chrome.storage.local.set({ 
        links: [],
        settings: {
          theme: 'auto',
          autoTag: true,
          notifications: true,
          syncEnabled: false
        }
      });
    }
  }
  
  showWelcomeNotification() {
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Welcome to LinkSaver!',
      message: 'Start saving links with Cmd+Shift+S or click the extension icon.'
    });
  }
  
  async handleCommand(command) {
    switch (command) {
      case 'save-current-page':
        await this.saveCurrentPage();
        break;
      case 'open-dashboard':
        await this.openDashboard();
        break;
    }
  }
  
  async saveCurrentPage() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      
      // Create link data
      const linkData = {
        id: Date.now().toString(),
        title: tab.title,
        url: tab.url,
        domain: new URL(tab.url).hostname,
        favicon: tab.favIconUrl,
        note: '',
        tags: this.generateAutoTags(tab.url, tab.title),
        savedAt: new Date().toISOString(),
        visitCount: 0
      };
      
      // Save to storage
      const result = await chrome.storage.local.get(['links']);
      const links = result.links || [];
      links.unshift(linkData);
      
      // Keep only last 1000 links
      if (links.length > 1000) {
        links.splice(1000);
      }
      
      await chrome.storage.local.set({ links });
      
      // Show success notification
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Link Saved!',
        message: `"${tab.title}" has been saved to LinkSaver.`
      });
      
    } catch (error) {
      console.error('Failed to save current page:', error);
      
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Save Failed',
        message: 'Could not save the current page. Please try again.'
      });
    }
  }
  
  generateAutoTags(url, title) {
    const tags = [];
    const domain = new URL(url).hostname;
    const titleLower = title.toLowerCase();
    const urlLower = url.toLowerCase();
    
    // Domain-based tags
    const domainTags = {
      'github.com': ['code', 'development'],
      'youtube.com': ['video', 'learning'],
      'medium.com': ['article', 'reading'],
      'stackoverflow.com': ['code', 'help'],
      'linkedin.com': ['career', 'networking'],
      'twitter.com': ['social', 'news'],
      'reddit.com': ['discussion', 'social'],
      'docs.google.com': ['document', 'work'],
      'notion.so': ['notes', 'productivity'],
      'figma.com': ['design', 'ui']
    };
    
    if (domainTags[domain]) {
      tags.push(...domainTags[domain]);
    }
    
    // Content-based tags
    if (titleLower.includes('tutorial') || titleLower.includes('guide')) {
      tags.push('tutorial');
    }
    
    if (titleLower.includes('job') || titleLower.includes('career')) {
      tags.push('jobs');
    }
    
    if (titleLower.includes('api') || titleLower.includes('docs')) {
      tags.push('documentation');
    }
    
    if (titleLower.includes('news') || domain.includes('news')) {
      tags.push('news');
    }
    
    // Remove duplicates and return
    return [...new Set(tags)];
  }
  
  async openDashboard() {
    const dashboardUrl = chrome.runtime.getURL('dashboard/dashboard.html');
    
    // Check if dashboard is already open
    const tabs = await chrome.tabs.query({ url: dashboardUrl });
    
    if (tabs.length > 0) {
      // Focus existing dashboard tab
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      // Open new dashboard tab
      await chrome.tabs.create({ url: dashboardUrl });
    }
  }
  
  async migrateData(previousVersion) {
    // Handle data migration for future versions
    console.log(`Migrating from version ${previousVersion}`);
    
    // Example migration logic:
    // if (previousVersion < '2.0.0') {
    //   await this.migrateToV2();
    // }
  }
  
  handleTabUpdate(tabId, changeInfo, tab) {
    // Could be used for smart suggestions or auto-categorization
    // For now, we'll keep it simple and not implement this
    if (changeInfo.status === 'complete' && tab.url) {
      // Tab finished loading - could trigger smart suggestions
    }
  }
  
  handleContextMenu(info, tab) {
    // Handle context menu actions if we add them later
    switch (info.menuItemId) {
      case 'save-link':
        this.saveLinkFromContext(info, tab);
        break;
    }
  }
  
  async saveLinkFromContext(info, tab) {
    // Save specific link from context menu
    const linkData = {
      id: Date.now().toString(),
      title: info.selectionText || tab.title,
      url: info.linkUrl || tab.url,
      domain: new URL(info.linkUrl || tab.url).hostname,
      favicon: tab.favIconUrl,
      note: '',
      tags: this.generateAutoTags(info.linkUrl || tab.url, info.selectionText || tab.title),
      savedAt: new Date().toISOString(),
      visitCount: 0
    };
    
    const result = await chrome.storage.local.get(['links']);
    const links = result.links || [];
    links.unshift(linkData);
    
    if (links.length > 1000) {
      links.splice(1000);
    }
    
    await chrome.storage.local.set({ links });
    
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Link Saved!',
      message: `Link has been saved to LinkSaver.`
    });
  }
}

// Initialize background service
new LinkSaverBackground();