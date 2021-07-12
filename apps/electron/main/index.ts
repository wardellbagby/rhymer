import { platform } from 'os';
import * as path from 'path';
import { format as formatUrl } from 'url';
import { URL } from 'url';
import { isDevelopment, isUiTest } from '@lyricistant/common/BuildModes';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { FileManager } from '@lyricistant/common/files/FileManager';
import { Logger } from '@lyricistant/common/Logger';
import { Managers } from '@lyricistant/common/Managers';
import { app, BrowserWindow, dialog, Menu, shell } from 'electron';
import debug from 'electron-debug';
import { DIContainer } from '@wessberg/di';
import { createRendererDelegate } from '@electron-delegates/Delegates';
import { createAppMenu } from '@electron-app/app-menu';
import { QuitManager } from '@electron-app/platform/QuitManager';
import { createAppComponent } from '@electron-app/AppComponent';

export let mainWindow: BrowserWindow;
let appComponent: DIContainer;
let rendererDelegate: RendererDelegate;
let logger: Logger;

if (isDevelopment || isUiTest) {
  debug({
    isEnabled: true,
    showDevTools: false,
  });
}

const showLoadingError = (reason: any) => {
  logger.error(
    'Error loading the webpage',
    reason,
    path.join(__dirname, 'index.html')
  );
  mainWindow.destroy();
  dialog.showErrorBox(
    'Error',
    "Sorry, we couldn't load Lyricistant! Please contact the developers!"
  );
  app.quit();
};

const newMenuItemHandler = async () => {
  appComponent.get<FileManager>().onNewFile();
};

const quitHandler = (): void => {
  appComponent.get<QuitManager>().attemptQuit();
};

const undoHandler = (): void => {
  rendererDelegate.send('undo');
};

const redoHandler = (): void => {
  rendererDelegate.send('redo');
};

const preferencesHandler = (): void => {
  rendererDelegate.send('open-prefs');
};

const setMenu = (recentFiles?: string[]): void => {
  const menuTemplate = createAppMenu(
    app.name,
    platform(),
    {
      onFindClicked: (): void => {
        rendererDelegate.send('find');
      },
      onNewClicked: newMenuItemHandler,
      onOpenClicked: async () => {
        await appComponent.get<FileManager>().openFile();
      },
      onOpenRecentClicked: async (filePath) => {
        await appComponent.get<FileManager>().openFile(filePath);
      },
      onPreferencesClicked: preferencesHandler,
      onAboutClicked: () => rendererDelegate.send('open-about'),
      onQuitClicked: quitHandler,
      onRedoClicked: redoHandler,
      onReplaceClicked: (): void => {
        rendererDelegate.send('replace');
      },
      onSaveAsClicked: () => {
        appComponent.get<FileManager>().saveFile(true);
      },
      onSaveClicked: () => {
        appComponent.get<FileManager>().saveFile(false);
      },
      onUndoClicked: undoHandler,
    },
    recentFiles
  );

  const mainMenu: Menu = Menu.buildFromTemplate(menuTemplate);

  Menu.setApplicationMenu(mainMenu);
};

const registerListeners = () => {
  appComponent.get<FileManager>().addOnFileChangedListener((_, recentFiles) => {
    setMenu(recentFiles);
  });
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      nodeIntegration: isUiTest,
      contextIsolation: false,
      enableRemoteModule: isUiTest,
      preload: path.resolve(__dirname, 'preload.js'),
    },
  });
  appComponent = createAppComponent(mainWindow);
  logger = appComponent.get<Logger>();
  rendererDelegate = createRendererDelegate(mainWindow);
  appComponent.get<Managers>().forEach((manager) => manager().register());
  registerListeners();

  logger.info('Platform information', {
    appPlatform: 'Electron',
    version: app.getVersion() ?? 'Error',
    os: platform() ?? 'Error',
    isDevelopment,
  });

  if (process.env.RENDERER_SERVER_PORT) {
    mainWindow
      .loadURL(`http://localhost:${process.env.RENDERER_SERVER_PORT}`)
      .catch(showLoadingError);
  } else {
    mainWindow
      .loadURL(
        formatUrl({
          pathname: path.join(__dirname, 'index.html'),
          protocol: 'file',
          slashes: true,
        })
      )
      .catch(showLoadingError);
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
  mainWindow.on('close', (event) => {
    appComponent.get<QuitManager>().attemptQuit();
    event.preventDefault();
  });
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });
  mainWindow.webContents.on('new-window', (event, urlString) => {
    const url = new URL(urlString);
    if (
      url.host === 'github.com' &&
      url.pathname.startsWith('/wardellbagby/lyricistant')
    ) {
      event.preventDefault();
      shell.openExternal(urlString);
    }
  });
  setMenu();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
