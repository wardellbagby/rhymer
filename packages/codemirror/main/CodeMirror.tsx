import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compartment,
  EditorSelection,
  EditorState,
  EditorStateConfig,
} from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { history, historyKeymap } from '@codemirror/history';
import { styled, useTheme } from '@material-ui/core';
import '@fontsource/roboto-mono/latin-400.css';
import { searchKeymap } from '@codemirror/search';
import { editorTheme } from './editorTheme';
import { syllableCounts } from './syllableCounts';
import { WordAtPosition, wordSelection } from './wordSelection';

const EditorContainer = styled('div')({
  height: '100%',
  width: 'calc(100% - env(safe-area-inset-left) - env(safe-area-inset-right))',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
});

export interface WordReplacement {
  originalWord: WordAtPosition;
  newWord: string;
}

export interface CodeMirrorEditorProps {
  onEditorMounted: (view: EditorView) => void;
  onWordSelected?: (word: WordAtPosition) => void;
  wordReplacement?: WordReplacement;
  onDefaultConfigReady?: (state: EditorStateConfig) => void;
  onTextChanged?: (text: string) => void;
}

export function CodeMirrorEditor(props: CodeMirrorEditorProps) {
  const ref = useRef<HTMLDivElement>();
  const [view, setView] = useState<EditorView>(null);
  const appTheme = useTheme();
  const themeCompartment = useMemo(() => new Compartment(), []);
  const defaultConfig = useMemo<EditorStateConfig>(
    () => ({
      extensions: [
        syllableCounts(),
        themeCompartment.of(editorTheme(appTheme)),
        history(),
        wordSelection({
          onWordSelected: props.onWordSelected,
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged || update.state === update.startState) {
            props.onTextChanged(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
        placeholder('Type out some lyrics...'),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      ],
    }),
    [appTheme, props.onTextChanged]
  );
  useEffect(() => {
    if (defaultConfig) {
      props.onDefaultConfigReady?.(defaultConfig);
    }
  }, [props.onDefaultConfigReady, defaultConfig]);
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (!view) {
      const newView = new EditorView({
        parent: ref.current,
      });
      newView.setState(EditorState.create(defaultConfig));
      setView(newView);
    }

    return () => {
      if (!ref.current) {
        view.destroy();
        setView(null);
      }
    };
  }, [view, setView]);
  useEffect(() => {
    if (view) {
      props.onEditorMounted(view);
    }
  }, [view, props.onEditorMounted]);
  useEffect(() => {
    if (!view) {
      return;
    }
    view.dispatch({
      effects: themeCompartment.reconfigure(editorTheme(appTheme)),
    });
  }, [view, appTheme]);
  useEffect(() => {
    if (!view || !props.wordReplacement) {
      return;
    }
    const {
      originalWord: { from, to },
      newWord: insert,
    } = props.wordReplacement;
    const changes = view.state.changes({
      from: Math.max(0, from),
      to: Math.min(to, view.state.doc.length),
      insert,
    });
    const selection = EditorSelection.cursor(
      changes.mapPos(Math.min(to, view.state.doc.length))
    );
    view.dispatch({
      changes,
      selection,
    });
  }, [view, props.wordReplacement, props.onWordSelected]);
  return <EditorContainer ref={ref} />;
}
