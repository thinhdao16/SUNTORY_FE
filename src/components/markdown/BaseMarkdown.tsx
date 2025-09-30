import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type BaseMarkdownProps = {
    content: string;
    className?: string;
    escapeHeadingAndLists?: boolean; 
};

const normalize = (raw: string, escapeHeadingAndLists?: boolean) => {
    let s = raw.replace(/\n{3,}/g, "\n\n");
    if (escapeHeadingAndLists) {
        s = s.replace(/^( *)(\d+)\. /gm, "$1$2\\. ");
        s = s.replace(/^(\s*)(#{1,6})\s/gm, (_m, p1, hashes) => {
            const escaped = String(hashes).replace(/#/g, "\\#");
            return `${p1}${escaped} `;
        });
    }
    return s;
};

const BaseMarkdown: React.FC<BaseMarkdownProps> = ({
    content,
    className = "",
    escapeHeadingAndLists = false,
}) => {
    const text = normalize(content, escapeHeadingAndLists);

    return (
        <div className={`markdown-body ${className}`}>
            <ReactMarkdown
                remarkPlugins={[
                    remarkGfm,
                ]}
                components={{
                    h1: ({ node, ...props }) => (
                        <h1 className="text-2xl font-bold leading-snug mt-4 mb-2" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-xl font-semibold leading-snug mt-4 mb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-medium leading-snug mt-3 mb-2" {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                        <h4 className="text-base font-semibold leading-snug mt-3 mb-2" {...props} />
                    ),
                    h5: ({ node, ...props }) => (
                        <h5 className="text-base font-medium leading-snug mt-2 mb-1" {...props} />
                    ),
                    h6: ({ node, ...props }) => (
                        <h6 className="text-sm font-medium uppercase tracking-wide mt-2 mb-1" {...props} />
                    ),

                    p: ({ node, ...props }) => (
                        <p className="text-[15px] leading-7 whitespace-pre-wrap break-words my-2" {...props} />
                    ),
                    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                    del: ({ node, ...props }) => <del className="line-through" {...props} />,
                    br: (props) => <br {...props} />,

                    a: ({ node, ...props }) => (
                        <a
                            className="text-blue-600 hover:underline break-words"
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            {...props}
                        />
                    ),

                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal ml-6 my-2 space-y-1" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc ml-6 my-2 space-y-1" {...props} />
                    ),
                    li: ({ node, ...props }) => <li className="leading-7" {...props} />,

                    blockquote: ({ node, ...props }) => (
                        <blockquote
                            className="border-l-4 pl-3 py-1 my-3 border-gray-300 text-gray-700 italic bg-gray-50 rounded-r"
                            {...props}
                        />
                    ),
                    code: ({ node, className, children, ...props }) => {
                        const isInline = node?.tagName !== 'pre';
                        const lang = /language-(\w+)/.exec(className || "")?.[1];

                        if (isInline) {
                            return (
                                <code
                                    className="px-1 py-0.5 rounded bg-gray-100 text-[13px]"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <pre className="my-3 rounded-xl bg-[#0b0b0b] text-gray-100 overflow-auto">
                                <code className={`block p-3 text-sm ${lang ? `language-${lang}` : ""}`} {...props}>
                                    {children}
                                </code>
                            </pre>
                        );
                    },

                    hr: (props) => <hr className="my-4 border-gray-200" {...props} />,

                    img: ({ node, ...props }) => (
                        <img
                            className="rounded-xl max-w-full h-auto my-2"
                            loading="lazy"
                            {...props}
                        />
                    ),

                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-3 max-w-full">
                            <table className="min-w-[320px] border-collapse w-full text-sm" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-gray-100 text-gray-800" {...props} />
                    ),
                    tbody: ({ node, ...props }) => <tbody {...props} />,
                    tr: ({ node, ...props }) => (
                        <tr className="border-b last:border-0 border-gray-200" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="text-left font-semibold px-3 py-2 align-middle" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-3 py-2 align-top" {...props} />
                    ),
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
};

export default BaseMarkdown;
