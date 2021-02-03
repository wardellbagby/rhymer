import { UiConfig } from '@common/ui/UiConfig';
import { Box, ButtonBase, Paper, Theme } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {
  AddCircle,
  FolderOpen,
  GetApp,
  Save,
  Settings,
} from '@material-ui/icons';

import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useHistory } from 'react-router-dom';
import { platformDelegate } from '../globals';
import { downloadApp } from '../util/download-app';
import { useEditorText } from '../stores/EditorTextStore';

const useIconStyles = makeStyles((theme: Theme) => ({
  root: {
    width: 56,
    height: 56,
    color: theme.palette.action.active,
    flexShrink: 0,
    display: 'inline-flex',
  },
  icon: {
    width: 24,
    height: 24,
  },
}));

const useMenuStyles = makeStyles((theme: Theme) => ({
  menu: {
    backgroundColor: theme.palette.background.paper,
  },
}));

const MenuIcon: FunctionComponent<{
  onClick?: () => void;
  ariaLabel: string;
}> = ({ onClick, ariaLabel, children }) => {
  const classes = useIconStyles();
  const [debouncedClick] = useDebouncedCallback(onClick, 200);

  return (
    <ButtonBase
      className={classes.root}
      onClick={debouncedClick}
      aria-label={ariaLabel}
    >
      <Box display="flex" alignItems="center" justifyContent="center">
        {React.Children.map(children, (child: React.ReactElement) =>
          React.cloneElement(child, { className: classes.icon })
        )}
      </Box>
    </ButtonBase>
  );
};

export function Menu() {
  const theme = useTheme();
  const classes = useMenuStyles();
  const useHorizontal = useMediaQuery(theme.breakpoints.down('sm'));
  const [uiConfig, setUiConfig] = useState<UiConfig>(null);
  const editorText = useEditorText();
  const history = useHistory();

  const onNewClicked = () => platformDelegate.send('new-file-attempt');
  const onOpenClicked = () => platformDelegate.send('open-file-attempt');
  const onSaveClicked = useCallback(
    () => platformDelegate.send('save-file-attempt', editorText),
    [editorText]
  );

  const onSettingsClicked = () => history.replace('/preferences');
  const onDownloadClicked = () => {
    if (!downloadApp()) {
      history.replace('/download');
    }
  };
  useEffect(() => {
    const onConfigChange = (config: UiConfig) => {
      setUiConfig(config);
    };

    platformDelegate.on('ui-config', onConfigChange);
    platformDelegate.send('request-ui-config');

    return () => {
      platformDelegate.removeListener('ui-config', onConfigChange);
    };
  }, []);

  return (
    <Paper square className={classes.menu} color={theme.palette.primary.main}>
      <Box
        display={'flex'}
        height={'100%'}
        width={'100%'}
        flexDirection={useHorizontal ? 'row' : 'column'}
      >
        <MenuIcon ariaLabel={'New'} onClick={onNewClicked}>
          <AddCircle />
        </MenuIcon>
        {uiConfig?.showOpen && (
          <MenuIcon ariaLabel={'Open'} onClick={onOpenClicked}>
            <FolderOpen />
          </MenuIcon>
        )}
        <MenuIcon ariaLabel={'Save'} onClick={onSaveClicked}>
          <Save />
        </MenuIcon>
        <Box flexGrow={'1'} />
        {uiConfig?.showDownload && (
          <MenuIcon ariaLabel={'Download App'} onClick={onDownloadClicked}>
            <GetApp />
          </MenuIcon>
        )}
        <MenuIcon ariaLabel={'Open Preferences'} onClick={onSettingsClicked}>
          <Settings />
        </MenuIcon>
      </Box>
    </Paper>
  );
}
