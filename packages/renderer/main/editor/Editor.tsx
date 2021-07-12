import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useBeforeunload as useBeforeUnload } from 'react-beforeunload';
import { CodeMirrorEditor } from '@lyricistant/codemirror/CodeMirror';
import { EditorView } from '@codemirror/view';
import { redo, undo, undoDepth } from '@codemirror/history';
import { EditorState, EditorStateConfig } from '@codemirror/state';
import { openSearchPanel } from '@codemirror/search';
import { logger, platformDelegate } from '@lyricistant/renderer/globals';
import { useDocumentListener } from '@lyricistant/renderer/util/useEventListener';
import { toDroppableFile } from './to-droppable-file';
import { useReplacedWords, useSelectedWordStore } from './SelectedWordStore';
import { useEditorTextStore } from './EditorTextStore';

export const Editor: React.FC = () => {
  const [editor, setEditor] = useState<EditorView>(null);
  const [defaultConfig, setDefaultConfig] = useState<EditorStateConfig>(null);
  useDocumentListener(
    'drop',
    async (event) => {
      if (!editor) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (event.dataTransfer?.files?.length > 0) {
        logger.debug('Attempted to drop a file.');
        const file = await toDroppableFile(event.dataTransfer.files.item(0));

        if (undoDepth(editor.state) > 0) {
          platformDelegate.send('prompt-save-file-for-open', file);
          return;
        }

        platformDelegate.send('open-file-attempt', file);
      }
    },
    [editor]
  );
  useDocumentListener(
    'dragover',
    (event) => {
      event.preventDefault();
      return true;
    },
    [editor]
  );

  useEffect(handleEditorEvents(editor, defaultConfig), [editor, defaultConfig]);
  useBeforeUnload(() => {
    if (editor && undoDepth(editor.state) !== 0) {
      return "Are you sure you want to leave? Your changes haven't been saved.";
    }
  });
  const store = useSelectedWordStore();
  const { onEditorText } = useEditorTextStore();
  return (
    <CodeMirrorEditor
      onEditorMounted={setEditor}
      onWordSelected={store.onWordSelected}
      wordReplacement={useReplacedWords()}
      onDefaultConfigReady={setDefaultConfig}
      onTextChanged={onEditorText}
    />
  );
};

function handleEditorEvents(
  editor: EditorView,
  defaultConfig: EditorStateConfig
) {
  const { enqueueSnackbar } = useSnackbar();
  return () => {
    if (!editor) {
      return;
    }

    const onFileSaveEnded = (error: any, path: string) => {
      // Resets the undo stack.
      editor.setState(
        EditorState.create({
          ...defaultConfig,
          doc: editor.state.doc,
        })
      );

      if (path) {
        enqueueSnackbar(`${path} saved`, { variant: 'success' });
      }
    };
    platformDelegate.on('file-save-ended', onFileSaveEnded);

    const onNewFileAttempt = () => {
      if (undoDepth(editor.state) === 0) {
        platformDelegate.send('okay-for-new-file');
      } else {
        platformDelegate.send('prompt-save-file-for-new');
      }
    };
    platformDelegate.on('is-okay-for-new-file', onNewFileAttempt);

    const onQuitAttempt = () => {
      if (undoDepth(editor.state) === 0) {
        platformDelegate.send('okay-for-quit');
      } else {
        platformDelegate.send('prompt-save-file-for-quit');
      }
    };
    platformDelegate.on('is-okay-for-quit-file', onQuitAttempt);

    const onNewFileCreated = () => {
      editor.setState(EditorState.create(defaultConfig));
    };
    platformDelegate.on('new-file-created', onNewFileCreated);

    const onFileOpened = (
      error: Error,
      fileName: string,
      fileContents: string,
      clearHistory: boolean
    ) => {
      if (!error) {
        if (clearHistory) {
          editor.setState(
            EditorState.create({
              ...defaultConfig,
              doc: fileContents,
            })
          );
        } else {
          editor.dispatch({
            changes: {
              from: 0,
              to: editor.state.doc.length,
              insert: fileContents,
            },
          });
        }
      }
    };
    platformDelegate.on('file-opened', onFileOpened);

    const onTextRequested = () => {
      platformDelegate.send('editor-text', editor.state.doc.toString());
    };
    platformDelegate.on('request-editor-text', onTextRequested);

    const onUndo = () => undo(editor);
    platformDelegate.on('undo', onUndo);

    const onRedo = () => redo(editor);
    platformDelegate.on('redo', onRedo);

    const onFind = () => openSearchPanel(editor);
    platformDelegate.on('find', onFind);

    const onReplace = () => openSearchPanel(editor);
    platformDelegate.on('replace', onReplace);

    return () => {
      platformDelegate.removeListener('file-save-ended', onFileSaveEnded);
      platformDelegate.removeListener('is-okay-for-new-file', onNewFileAttempt);
      platformDelegate.removeListener('is-okay-for-quit-file', onQuitAttempt);
      platformDelegate.removeListener('new-file-created', onNewFileCreated);
      platformDelegate.removeListener('file-opened', onFileOpened);
      platformDelegate.removeListener('request-editor-text', onTextRequested);
      platformDelegate.removeListener('undo', onUndo);
      platformDelegate.removeListener('redo', onRedo);
      platformDelegate.removeListener('find', onFind);
      platformDelegate.removeListener('replace', onReplace);
    };
  };
}
