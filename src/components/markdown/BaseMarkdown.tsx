// components/markdown/BaseMarkdown.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BaseMarkdown = ({ content }: { content: string }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                table: ({ node, ...props }) => (
                    <div className="overflow-x-auto max-w-full my-2">
                        <table {...props} />
                    </div>
                ),
            }}
        >
            {content.replace(/\n{3,}/g, "\n\n")}
        </ReactMarkdown>
    );
};

export default BaseMarkdown;
