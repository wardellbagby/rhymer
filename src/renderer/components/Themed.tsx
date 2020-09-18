import { CssBaseline } from '@material-ui/core';
import { Theme, ThemeProvider } from '@material-ui/core/styles';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { platformDelegate } from 'PlatformDelegate';
import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState
} from 'react';
import 'typeface-roboto';
import {
  createLyricistantLanguage,
  createLyricistantTheme
} from '../util/monaco-helpers';
import { createTheme } from '../util/theme';

createLyricistantLanguage();

const defaultTheme = createTheme(null, true);

export const Themed: FunctionComponent<PropsWithChildren<{
  onBackgroundChanged: (background: string) => void;
}>> = ({ onBackgroundChanged, children }) => {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(handleThemeChanges(setTheme, onBackgroundChanged), []);

  return (
    <CssBaseline>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CssBaseline>
  );
};

function handleThemeChanges(
  setTheme: (theme: Theme) => void,
  onBackgroundChanged: (newBackground: string) => void
): () => void {
  return () => {
    const darkModeChangedListener = (
      textSize: number,
      useDarkTheme: boolean
    ) => {
      const appTheme = createTheme(textSize, useDarkTheme);
      setTheme(appTheme);
      monaco.editor.setTheme(createLyricistantTheme(useDarkTheme));
      onBackgroundChanged(appTheme.palette.background.default);
    };
    platformDelegate.on('dark-mode-toggled', darkModeChangedListener);

    return () => {
      platformDelegate.removeListener(
        'dark-mode-toggled',
        darkModeChangedListener
      );
    };
  };
}