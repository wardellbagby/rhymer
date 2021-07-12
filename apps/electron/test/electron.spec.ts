import path from 'path';
import os from 'os';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Application, SpectronClient } from 'spectron';
import del from 'del';

use(chaiAsPromised);

describe('Electron launch', () => {
  let app: Application;
  let client: SpectronClient;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.resolve(os.tmpdir(), 'lyricistant-electron-test');
    await del(tempDir, {
      force: true,
    });
    app = new Application({
      path: require.resolve('electron/cli'),
      args: [
        path.resolve('apps/electron/dist/test/main.js'),
        '--no-sandbox',
        '--disable-gpu',
        '--enable-logging',
      ],
      chromeDriverArgs: [`user-data-dir=${tempDir}`],
    });

    await app.start();
    await app.client.waitUntilWindowLoaded();
    client = app.client;
    await client.waitUntil(async () => {
      const elements = await client.$$('#app > *');
      return elements.length > 0;
    });
  });

  afterEach(async () => {
    if (app) {
      app.mainProcess.exit(0);
    }
  });

  it('shows an initial window', () =>
    expect(client.getWindowCount()).to.eventually.equal(1));

  it('has a title of untitled', () =>
    expect(app.browserWindow.getTitle()).to.eventually.equal('Untitled'));

  it('shows the basic components', async () => {
    const components = [
      await client.react$('Editor'),
      await client.react$('Menu'),
      await client.react$('Rhymes'),
    ];

    for (const component of components) {
      await expect(component.waitForDisplayed()).to.eventually.be.true;
    }
  });

  it('allows you to type in the editor', async () => {
    const editorTextArea = await client.$('.cm-content');
    await client.elementSendKeys(editorTextArea.elementId, 'Hello World!');

    await expect(editorTextArea.getText()).to.eventually.equal('Hello World!');
  });
});
