import { useLLMOutput } from "@llm-ui/react";
import { markdownLookBack } from "@llm-ui/markdown";
import BaseMarkdown from "./BaseMarkdown";

export const MarkdownRenderer = ({ text }: { text: string }) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: text,
    blocks: [],
    fallbackBlock: {
      component: ({ blockMatch }: { blockMatch: { output: string } }) => <BaseMarkdown content={blockMatch.output} />,
      lookBack: markdownLookBack(),
    },
    isStreamFinished: true,
  });
  return (
    <>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </>
  );
};
