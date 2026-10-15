import React, {ChangeEvent, ElementType, useRef, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import {Box, IconButton, SxProps, Theme, Tooltip} from '@mui/material';
import {varAlpha} from '../../theme/utils';
import {Icon, IconType} from '../Icon';

const DefaultEmptyIcon = () => <Icon icon={IconType.AddAPhoto} />;
const DefaultChangeIcon = () => <Icon icon={IconType.AddAPhoto} />;
const DefaultRemoveIcon = () => <Icon icon={IconType.NoPhotography} />;

export type AvatarFieldProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
  onSelectFiles: (files: File[], changeValue: (value: string) => void) => void;
  allowedFormats?: Record<string, string[]>;
  EmptyIcon?: ElementType;
  ChangeIcon?: ElementType;
  RemoveIcon?: ElementType;
  addLabel?: string;
  removeLabel?: string;
  changeLabel?: string;
  imageLabel?: string;
  size?: number;
  sx?: SxProps<Theme>;
};

export const AvatarField = ({
  onChange,
  value,
  error,
  onSelectFiles,
  allowedFormats = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg'],
    'image/webp': ['.webp'],
  },
  EmptyIcon = DefaultEmptyIcon,
  ChangeIcon = DefaultChangeIcon,
  RemoveIcon = DefaultRemoveIcon,
  addLabel = 'Add avatar',
  removeLabel = 'Remove avatar',
  changeLabel = 'Change avatar',
  imageLabel = 'Avatar',
  size = 150,
  sx,
}: AvatarFieldProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [failed, setFailed] = useState(false);
  // A new value can replace an earlier broken one — re-attempt loading it instead of sticking to
  // the previous failure. Adjusted during render (React's recommended pattern for resetting state
  // on a prop change) rather than an effect, so there's no extra render pass.
  const [trackedValue, setTrackedValue] = useState(value);
  if (value !== trackedValue) {
    setTrackedValue(value);
    setFailed(false);
  }

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  let avatarContent;
  if (value && !failed) {
    avatarContent = <img src={value} alt={imageLabel} onError={() => setFailed(true)} />;
  } else if (value && failed) {
    avatarContent = <Icon icon={IconType.BrokenImage} />;
  } else {
    avatarContent = <EmptyIcon />;
  }

  const changeValue = (value: string) => {
    const hiddenInput = hiddenInputRef.current;
    if (!hiddenInput) return;

    // Set correct values
    hiddenInput.value = value;

    // Emit change event
    const event = new Event('input', {bubbles: true});
    hiddenInput.dispatchEvent(event);
    // @ts-ignore some missing attributes
    onChange(event);
  };

  // `noClick`: the container itself doesn't open the picker on click — the empty state and the
  // "change" hover button open it explicitly via `open()`, so a click on "remove" never also opens
  // it. Drag-and-drop stays wired through `getRootProps`.
  const {getRootProps, getInputProps, open} = useDropzone({
    accept: allowedFormats,
    onDrop: (acceptedFiles) => onSelectFiles(acceptedFiles, changeValue),
    multiple: false,
    noClick: true,
  });

  const onRemoveFiles = () => changeValue('');

  const avatarBodySx: SxProps<Theme> = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    img: {
      objectFit: 'cover',
      width: '100%',
      height: '100%',
      transition: (theme) => theme.transitions.create('filter', {duration: 10}),
      filter: isHovered ? 'blur(4px)' : 'none',
    },
    svg: {
      width: '30%',
      height: '30%',
      fill: (theme) => theme.palette.text.secondary,
    },
  };

  return (
    <Box
      {...getRootProps({className: 'dropzone'})}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        width: size,
        maxWidth: '100%',
        aspectRatio: '1 / 1',
        boxSizing: 'border-box',
        border: (theme) =>
          '1px solid ' + (error ? theme.palette.error.main : theme.palette.divider),
        backgroundColor: (theme) => theme.palette.background.neutral,
        borderRadius: '50%',
        overflow: 'hidden',
        '&:hover': {
          border: (theme) =>
            '1px solid ' + (error ? theme.palette.error.main : theme.palette.text.primary),
        },
        ...sx,
      }}
    >
      {/* The avatar itself. Empty state is one big click target (tooltip `addLabel`) that opens the
          picker; a filled one leaves the actions to the hover buttons and blurs the image directly (a
          plain `filter`, clipped by the circle's `overflow: hidden` — no `backdrop-filter`, which the
          border and the enclosing dialog's stacking context fought with). */}
      {value ? (
        <Box sx={avatarBodySx}>{avatarContent}</Box>
      ) : (
        <Tooltip title={addLabel}>
          <Box onClick={open} sx={{...avatarBodySx, cursor: 'pointer'}}>
            <EmptyIcon />
          </Box>
        </Tooltip>
      )}

      <input {...getInputProps()} />
      <input ref={hiddenInputRef} type="hidden" value={value} />

      {/* Hover actions over a filled avatar: change / remove, on a scrim so the icons read over any
          image. */}
      {isHovered && value && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            backgroundColor: (theme) => varAlpha(theme.palette.background.defaultChannel, 0.5),
          }}
        >
          <Tooltip title={changeLabel}>
            <IconButton onClick={open} aria-label={changeLabel} color={'inherit'}>
              <ChangeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={removeLabel}>
            <IconButton onClick={onRemoveFiles} aria-label={removeLabel} color={'error'}>
              <RemoveIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};
