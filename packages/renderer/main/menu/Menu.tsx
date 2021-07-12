import { UiConfig } from '@lyricistant/common/ui/UiConfig';
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
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { downloadApp } from '@lyricistant/renderer/download';
import { platformDelegate } from '@lyricistant/renderer/globals';
import { useEditorText } from '@lyricistant/renderer/editor/EditorTextStore';

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

const useMenuStyles = makeStyles<Theme, { isSmallLayout: boolean }>(
  (theme: Theme) => ({
    menu: {
      backgroundColor: theme.palette.background.paper,
      'padding-top': 'env(safe-area-inset-top)',
      'padding-left': 'env(safe-area-inset-left)',
      'padding-right': 'env(safe-area-inset-right)',
      height: (props) => (props.isSmallLayout ? 'fit-content' : '100%'),
      width: (props) => (props.isSmallLayout ? '100%' : 'fit-content'),
    },
  })
);

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

export const Menu: React.FC = () => {
  const theme = useTheme();
  const classes = useMenuStyles({ isSmallLayout: useSmallLayout() });
  const useHorizontal = useMediaQuery(theme.breakpoints.down('sm'));
  const [uiConfig, setUiConfig] = useState<UiConfig>(null);
  const editorText = useEditorText();
  const history = useHistory();
  const isSmallLayout = useSmallLayout();

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
    <Box
      marginBottom={isSmallLayout ? '8px' : 'inherit'}
      marginRight={isSmallLayout ? 'inherit' : '8px'}
      boxShadow={1}
    >
      <Paper square className={classes.menu} color={theme.palette.primary.main}>
        <Box
          display={'flex'}
          height={isSmallLayout ? 'auto' : '100%'}
          width={isSmallLayout ? '100%' : 'auto'}
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
    </Box>
  );
};
