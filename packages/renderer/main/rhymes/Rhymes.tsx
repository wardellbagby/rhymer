import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles, Theme } from '@material-ui/core/styles';
import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { useErrorHandler } from 'react-error-boundary';
import { Components, VirtuosoGrid } from 'react-virtuoso';
import { usePreferences } from '@lyricistant/renderer/preferences/PreferencesStore';
import { isDevelopment } from '@lyricistant/common/BuildModes';
import { useMachine } from '@xstate/react';
import { rhymesMachine } from '@lyricistant/renderer/rhymes/RhymesMachine';
import { LinearProgress, Typography } from '@material-ui/core';
import {
  useSelectedWordPosition,
  useSelectedWords,
  useSelectedWordStore,
} from '@lyricistant/renderer/editor/SelectedWordStore';
import { Rhyme } from './rhyme';

const useRhymeListStyles = makeStyles((theme: Theme) => ({
  root: {
    color: theme.palette.text.disabled,
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  rhyme: {
    'text-align': 'center',
    '&:hover': {
      background: theme.palette.background.paper,
    },
  },
  itemContainer: {
    display: 'flex',
    flex: 'none',
    'align-content': 'stretch',
    [theme.breakpoints.up('xs')]: {
      width: '50%',
      height: '50px',
    },
    [theme.breakpoints.up('md')]: {
      width: '100%',
      height: '80px',
    },
    [theme.breakpoints.up('lg')]: {
      width: '50%',
    },
  },
  listContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    height: '100%',
    width: '100%',
  },
}));

interface RhymesListProps {
  rhymes: Rhyme[];
  onRhymeClicked: (rhyme: Rhyme) => void;
}

const RhymesList = ({ rhymes, onRhymeClicked }: RhymesListProps) => {
  const classes = useRhymeListStyles();

  const Item: Components['Item'] = useMemo(
    () => (props) => <div {...props} className={classes.itemContainer} />,
    [classes.itemContainer]
  );
  const List: Components['List'] = useMemo(
    () =>
      React.forwardRef((props, ref) => (
        <div {...props} className={classes.listContainer} ref={ref} />
      )),
    [classes.listContainer]
  );

  return (
    <VirtuosoGrid
      components={{ Item, List }}
      style={{ width: '100%', height: '100%' }}
      overscan={20}
      totalCount={rhymes.length}
      listClassName={classes.root}
      itemContent={(index) => {
        const rhyme = rhymes[index];

        if (!rhyme) {
          return;
        }

        return renderRhyme(rhyme, classes.rhyme, () => {
          onRhymeClicked(rhyme);
        });
      }}
    />
  );
};

const useLoadingIndicatorStyles = makeStyles<Theme, { display: boolean }>(
  (theme: Theme) => ({
    root: {
      visibility: ({ display }) => (display ? 'visible' : 'hidden'),
    },
    progressBarColor: {
      backgroundColor: theme.palette.text.secondary,
    },
    progressBarBackground: {
      backgroundColor: theme.palette.background.default,
    },
  })
);
const LoadingIndicator = (props: { display: boolean }) => {
  const classes = useLoadingIndicatorStyles(props);
  return (
    <LinearProgress
      className={classes.root}
      classes={{
        colorPrimary: classes.progressBarBackground,
        barColorPrimary: classes.progressBarColor,
      }}
    />
  );
};

const useInactiveHelperTextStyles = makeStyles((theme: Theme) => ({
  root: {
    color: theme.palette.text.disabled,
  },
}));
const HelperText = ({ text }: { text: string }) => {
  const classes = useInactiveHelperTextStyles();

  return (
    <Box
      height={'100%'}
      width={'100%'}
      overflow={'hidden'}
      textOverflow={'ellipsis'}
      p={'16px'}
      display={'flex'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      <Typography className={classes.root} variant={'body1'}>
        {text}
      </Typography>
    </Box>
  );
};

export const Rhymes: React.FC = () => {
  const [state, send] = useMachine(rhymesMachine);

  const selectedWordStore = useSelectedWordStore();
  const handleError = useErrorHandler();
  const selectedWord = useSelectedWords();
  const selectedWordPosition = useSelectedWordPosition();

  const preferences = usePreferences();

  useLayoutEffect(() => {
    if (!selectedWord || !preferences) {
      return;
    }
    send({
      type: 'INPUT',
      input: selectedWord,
      rhymeSource: preferences.rhymeSource,
    });
  }, [selectedWord, preferences]);

  useEffect(() => {
    if (state.matches('error')) {
      handleError(state.context.error);
    }
  }, [handleError, state]);

  const rhymes: Rhyme[] = state.context.rhymes;

  return (
    <Box display={'flex'} flexDirection={'column'}>
      <LoadingIndicator display={state.matches('loading')} />

      {state.matches('inactive') && (
        <HelperText text={'Waiting for lyrics...'} />
      )}

      {state.matches('no-results') && <HelperText text={'No rhymes found'} />}

      {rhymes.length > 0 && (
        <RhymesList
          rhymes={rhymes}
          onRhymeClicked={(rhyme) =>
            selectedWordStore.onWordReplaced({
              originalWord: {
                word: selectedWord,
                from: selectedWordPosition[0],
                to: selectedWordPosition[1],
              },
              newWord: rhyme.word,
            })
          }
        />
      )}
    </Box>
  );
};

function renderRhyme(
  rhyme: Rhyme,
  className: string,
  onClick: () => void
): React.ReactElement {
  return (
    <Box flex={1} width={'100%'} height={'100%'} onClick={onClick}>
      <ListItem
        className={className}
        button
        key={rhyme.word ?? ''}
        style={{ height: '100%' }}
      >
        <ListItemText
          primary={rhyme.word ?? ''}
          primaryTypographyProps={{ align: 'center' }}
          secondary={isDevelopment && rhyme.score}
        />
      </ListItem>
    </Box>
  );
}
