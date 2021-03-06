import { TextDecoder, TextEncoder } from 'util';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import { FileManager } from '@lyricistant/common/files/FileManager';
import { Files } from '@lyricistant/common/files/Files';
import { RecentFiles } from '@lyricistant/common/files/RecentFiles';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import { RendererListeners } from '@testing/utilities/Listeners';

use(sinonChai);

describe('File Manager', () => {
  let manager: FileManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let files: StubbedInstance<Files>;
  let recentFiles: StubbedInstance<RecentFiles>;
  let dialogs: StubbedInstance<Dialogs>;
  const rendererListeners = new RendererListeners();

  beforeEach(() => {
    sinon.reset();
    files = stubInterface<Files>({
      openFile: Promise.resolve({
        path: '/path/test',
        name: 'test',
        data: '',
      }),
      saveFile: Promise.resolve({ path: '/path/test2' }),
    });
    recentFiles = stubInterface<RecentFiles>({
      setRecentFiles: undefined,
      getRecentFiles: ['1', '2', '3'],
    });
    dialogs = stubInterface<Dialogs>({
      showDialog: Promise.resolve('cancelled'),
    });
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });

    manager = new FileManager(
      rendererDelegate,
      files,
      recentFiles,
      dialogs,
      stubInterface()
    );
  });

  afterEach(() => {
    rendererListeners.clear();
  });

  it("doesn't save duplicates to recent files", async () => {
    recentFiles.getRecentFiles.returns(['1', '2', '3', '/path/test']);
    manager.register();

    await manager.openFile();

    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test',
      '1',
      '2',
      '3',
    ]);
  });

  it('caps the max recents to 10', async () => {
    recentFiles.getRecentFiles.returns([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    manager.register();

    await manager.openFile();

    expect(recentFiles.setRecentFiles).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
  });

  it("doesn't add to recent files when a file is not opened", async () => {
    recentFiles.getRecentFiles.returns(['1', '2', '3', 'test']);
    files.openFile.returns(undefined);

    manager.register();

    await manager.openFile();

    expect(recentFiles.setRecentFiles).to.have.not.been.called;
  });

  it('asks the renderer if its okay for a new file when asked by platform', async () => {
    manager.register();

    manager.onNewFile();

    expect(rendererDelegate.send).to.have.been.calledWith(
      'is-okay-for-new-file'
    );
  });

  it('asks the renderer if its okay for a new file when asked by renderer', async () => {
    manager.register();

    await rendererListeners.invoke('new-file-attempt');

    expect(rendererDelegate.send).to.have.been.calledWith(
      'is-okay-for-new-file'
    );
  });

  it('shows a dialog when the renderer says new file is not okay', async () => {
    manager.register();

    await rendererListeners.invoke('prompt-save-file-for-new');

    expect(dialogs.showDialog).to.have.been.called;
  });

  it('shows a dialog when the renderer says open file is not okay', async () => {
    manager.register();

    await rendererListeners.invoke('prompt-save-file-for-open', {
      path: 'whitetuxedo.txt',
      type: 'text/plain',
      data: new TextEncoder().encode('This water'),
    });

    expect(dialogs.showDialog).to.have.been.called;
  });

  it('creates a new file when prompt dialog says yes was chosen', async () => {
    dialogs.showDialog.returns(Promise.resolve('yes'));
    manager.register();

    await rendererListeners.invoke('prompt-save-file-for-new');

    expect(dialogs.showDialog).to.have.been.called;
    expect(rendererDelegate.send).to.have.been.calledWith('new-file-created');
  });

  it("does nothing when prompt dialog doesn't say yes was chosen", async () => {
    dialogs.showDialog.returns(Promise.resolve('no'));
    manager.register();

    await rendererListeners.invoke('prompt-save-file-for-new');

    expect(dialogs.showDialog).to.have.been.called;
    expect(rendererDelegate.send).to.have.not.been.called;
  });

  it('creates a new file when the renderer says new file is okay', async () => {
    manager.register();

    await rendererListeners.invoke('okay-for-new-file');

    expect(dialogs.showDialog).to.have.not.been.called;
    expect(rendererDelegate.send).to.have.been.calledWith('new-file-created');
  });

  it('opens the file when prompt dialog says yes was chosen', async () => {
    dialogs.showDialog.returns(Promise.resolve('yes'));
    files.openFile.callsFake((file) =>
      Promise.resolve({
        path: file.path,
        name: file.path,
        data: new TextDecoder().decode(file.data),
      })
    );
    manager.register();

    await rendererListeners.invoke('prompt-save-file-for-open', {
      path: 'whitetuxedo.txt',
      type: 'text/plain',
      data: new TextEncoder().encode('This water'),
    });

    expect(dialogs.showDialog).to.have.been.called;
    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'whitetuxedo.txt',
      'This water'
    );
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      'whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('asks for renderer text when platform requests a file save', async () => {
    manager.register();

    manager.saveFile(false);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'request-editor-text'
    );
  });

  it('saves the file when the renderer returns the editor text', async () => {
    const fileChangeListener: (
      currentFile: string,
      recents: string[]
    ) => void = sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    manager.saveFile(false);

    await rendererListeners.invoke('editor-text', 'Reeboks on; just do it!');

    expect(files.saveFile).to.have.been.calledWith('Reeboks on; just do it!');
    expect(fileChangeListener).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves as the file when the renderer returns the editor text', async () => {
    const fileChangeListener: (
      currentFile: string,
      recents: string[]
    ) => void = sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    manager.saveFile(true);

    await rendererListeners.invoke('editor-text', 'Reeboks on; just do it!');

    expect(files.saveFile).to.have.been.calledWith('Reeboks on; just do it!');
    expect(fileChangeListener).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves a new file when the renderer says to save with no file loaded', async () => {
    const fileChangeListener: (
      currentFile: string,
      recents: string[]
    ) => void = sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    await rendererListeners.invoke(
      'save-file-attempt',
      'Blessings, blessings.'
    );

    expect(files.saveFile).to.have.been.calledWith('Blessings, blessings.');
    expect(fileChangeListener).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves the current file when the renderer says to save with a file loaded', async () => {
    const fileChangeListener: (
      currentFile: string,
      recents: string[]
    ) => void = sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    files.openFile.returns(
      Promise.resolve({
        name: 'whitetuxedo.txt',
        path: '/Desktop/whitetuxedo.txt',
        data: 'This water',
      })
    );
    manager.register();

    await manager.openFile();
    await rendererListeners.invoke(
      'save-file-attempt',
      'Blessings, blessings.'
    );

    expect(files.saveFile).to.have.been.calledWith(
      'Blessings, blessings.',
      '/Desktop/whitetuxedo.txt'
    );
    expect(fileChangeListener).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('updates the current file when the platform returns a new file path', async () => {
    const fileChangeListener: (
      currentFile: string,
      recents: string[]
    ) => void = sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    files.openFile.returns(
      Promise.resolve({
        name: 'whitetuxedo.txt',
        path: '/Desktop/whitetuxedo.txt',
        data: 'This water',
      })
    );
    files.saveFile.returns(
      Promise.resolve({
        name: 'whitetuxedo.txt',
        path: '/Desktop/whitetuxedo2.txt',
      })
    );
    manager.register();

    await manager.openFile();
    await rendererListeners.invoke(
      'save-file-attempt',
      'Blessings, blessings.'
    );
    await rendererListeners.invoke(
      'save-file-attempt',
      'Blessings, blessings.'
    );

    expect(files.saveFile).to.have.been.calledWith(
      'Blessings, blessings.',
      '/Desktop/whitetuxedo2.txt'
    );
    expect(fileChangeListener).to.have.been.called.callCount(3);
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo2.txt',
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('updates the renderer when a file is opened by the platform', async () => {
    files.openFile.returns(
      Promise.resolve({
        name: 'whitetuxedo.txt',
        path: '/Desktop/whitetuxedo.txt',
        data: 'This water',
      })
    );
    const fileChangeListener: (
      currentFile: string,
      recents: string[]
    ) => void = sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await manager.openFile();

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'whitetuxedo.txt',
      'This water'
    );
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).to.have.been.called;
  });

  it('updates the renderer when a file is opened by the platform directly', async () => {
    files.readFile.returns(
      Promise.resolve({
        name: 'whitetuxedo.txt',
        path: '/Desktop/whitetuxedo.txt',
        data: 'This water',
      })
    );
    const fileChangeListener: (
      currentFile: string,
      recents: string[]
    ) => void = sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await manager.openFile('whitetuxedo.txt');

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'whitetuxedo.txt',
      'This water'
    );
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      'whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).to.have.been.called;
  });

  it('updates the renderer when a file is opened by the renderer', async () => {
    files.openFile.returns(
      Promise.resolve({
        name: 'whitetuxedo.txt',
        path: '/Desktop/whitetuxedo.txt',
        data: 'This water',
      })
    );
    const fileChangeListener: (
      currentFile: string,
      recents: string[]
    ) => void = sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await rendererListeners.invoke('open-file-attempt', {
      path: 'whitetuxedo.txt',
      type: 'text/plain',
      data: new TextEncoder().encode('This water'),
    });

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'whitetuxedo.txt',
      'This water'
    );
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).to.have.been.called;
  });
});
