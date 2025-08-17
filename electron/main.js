const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the Next.js app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// File system operations
ipcMain.handle('save-customers', async (event, customersData) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `customers-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });
    
    if (filePath) {
      await fs.writeFile(filePath, JSON.stringify(customersData, null, 2));
      return { success: true, filePath };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-customers', async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ],
      properties: ['openFile']
    });
    
    if (filePaths.length > 0) {
      const data = await fs.readFile(filePaths[0], 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Auto-save functionality
ipcMain.handle('auto-save-customers', async (event, customersData) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'customers-backup.json');
    await fs.writeFile(filePath, JSON.stringify(customersData, null, 2));
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auto-load-customers', async (event) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'customers-backup.json');
    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
