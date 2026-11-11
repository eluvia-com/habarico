import React from 'react';
import {Controls, Description, Primary, Stories, Subtitle, Title, useOf} from '@storybook/addon-docs/blocks';

/**
 * Storybook's default autodocs template lists every story a second time under "Stories", the
 * primary one (always the first export — `Playground`, by convention) included: a second, static
 * embed of the exact same story already shown live at the top, minus the Controls panel that made
 * it worth calling "interactive" in the first place. `includePrimary={false}` on `<Stories>` drops
 * that echo, and a story that disables Controls (`parameters.controls.disable`) gets no
 * `<Controls />` table either: without controls it is a props dump with an empty Control column.
 */
export const DocsPage = () => {
  const {csfFile} = useOf('meta', ['meta']);
  const {story: primary} = useOf('story', ['story']);
  const isSingleStory = Object.keys(csfFile.stories).length === 1;
  const hasControls = !primary.parameters.controls?.disable;
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      {isSingleStory && <Description of={'story'} />}
      <Primary />
      {hasControls && <Controls />}
      <Stories includePrimary={false} />
    </>
  );
};
