/**
 * Electron Main Process
 * PNG Civil Engineering CAD - Desktop Application
 */

import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'PNG Civil CAD',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Create application menu
  const menu = createApplicationMenu();
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window close with unsaved changes
  mainWindow.on('close', (e) => {
    // The renderer will handle checking for unsaved changes
    mainWindow?.webContents.send('app-closing');
  });
}

function createApplicationMenu(): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new-project'),
        },
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: () => handleOpenProject(),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => handleSaveAs(),
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as DXF',
              click: () => handleExport('dxf'),
            },
            {
              label: 'Export as PDF',
              click: () => handleExport('pdf'),
            },
            {
              label: 'Export as PNG Image',
              click: () => handleExport('png'),
            },
          ],
        },
        { type: 'separator' },
        {
          label: 'Print...',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.print(),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow?.webContents.send('menu-undo'),
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          click: () => mainWindow?.webContents.send('menu-redo'),
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          click: () => mainWindow?.webContents.send('menu-cut'),
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          click: () => mainWindow?.webContents.send('menu-copy'),
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          click: () => mainWindow?.webContents.send('menu-paste'),
        },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          click: () => mainWindow?.webContents.send('menu-select-all'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow?.webContents.send('menu-zoom-in'),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('menu-zoom-out'),
        },
        {
          label: 'Zoom to Fit',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('menu-zoom-fit'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Grid',
          accelerator: 'G',
          click: () => mainWindow?.webContents.send('menu-toggle-grid'),
        },
        {
          label: 'Toggle Snap',
          accelerator: 'S',
          click: () => mainWindow?.webContents.send('menu-toggle-snap'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.reload(),
        },
      ],
    },
    {
      label: 'PNG Analysis',
      submenu: [
        {
          label: 'Climate Analysis',
          click: () => mainWindow?.webContents.send('menu-png-climate'),
        },
        {
          label: 'Seismic Design',
          click: () => mainWindow?.webContents.send('menu-png-seismic'),
        },
        {
          label: 'Flood Assessment',
          click: () => mainWindow?.webContents.send('menu-png-flood'),
        },
        { type: 'separator' },
        {
          label: 'Material Database',
          click: () => mainWindow?.webContents.send('menu-png-materials'),
        },
        {
          label: 'Structural Design',
          click: () => mainWindow?.webContents.send('menu-png-structural'),
        },
        { type: 'separator' },
        {
          label: 'Generate Full Report',
          click: () => mainWindow?.webContents.send('menu-png-report'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            require('electron').shell.openExternal(
              'https://github.com/user/png-civil-cad/wiki'
            );
          },
        },
        {
          label: 'PNG Building Standards',
          click: () => {
            require('electron').shell.openExternal(
              'https://www.buildingboard.gov.pg'
            );
          },
        },
        { type: 'separator' },
        {
          label: 'About PNG Civil CAD',
          click: () => showAboutDialog(),
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

async function handleOpenProject() {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open Project',
    filters: [
      { name: 'PNG CAD Projects', extensions: ['pngcad', 'json'] },
      { name: 'DXF Files', extensions: ['dxf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      mainWindow?.webContents.send('file-opened', { filePath, content });
    } catch (error) {
      dialog.showErrorBox('Error', `Failed to open file: ${error}`);
    }
  }
}

async function handleSaveAs() {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save Project As',
    filters: [
      { name: 'PNG CAD Project', extensions: ['pngcad'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  });

  if (!result.canceled && result.filePath) {
    mainWindow?.webContents.send('save-as', { filePath: result.filePath });
  }
}

async function handleExport(format: 'dxf' | 'pdf' | 'png') {
  const extensions: Record<string, string[]> = {
    dxf: ['dxf'],
    pdf: ['pdf'],
    png: ['png'],
  };

  const result = await dialog.showSaveDialog(mainWindow!, {
    title: `Export as ${format.toUpperCase()}`,
    filters: [{ name: format.toUpperCase(), extensions: extensions[format] }],
  });

  if (!result.canceled && result.filePath) {
    mainWindow?.webContents.send('export', { format, filePath: result.filePath });
  }
}

function showAboutDialog() {
  dialog.showMessageBox(mainWindow!, {
    type: 'info',
    title: 'About PNG Civil CAD',
    message: 'PNG Civil CAD',
    detail: `Version: 1.0.0

Civil Engineering Design Software
Specially designed for Papua New Guinea conditions

Features:
- Climate-aware design
- Seismic analysis (Ring of Fire)
- Flood risk assessment
- Local material database
- Offline-first architecture

© 2024 PNG Civil Engineering Team`,
  });
}

// IPC Handlers
ipcMain.handle('save-file', async (_, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('read-file', async (_, { filePath }) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('get-app-path', async () => {
  return app.getPath('userData');
});

// App lifecycle
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});
