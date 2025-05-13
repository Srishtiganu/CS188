import type { Message } from "ai";
import { User, Bot, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ComponentPropsWithoutRef } from "react";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  // Helper function to render message content
  const renderContent = (content: any) => {
    if (typeof content === "string") {
      return (
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc pl-4 mb-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 mb-2">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            code: (
              props: ComponentPropsWithoutRef<"code"> & { inline?: boolean }
            ) => {
              const { inline, children, ...rest } = props;
              if (inline) {
                return (
                  <code
                    className="px-1 py-0.5 bg-gray-200 rounded text-sm"
                    {...rest}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <pre className="p-2 bg-gray-800 text-white rounded-md overflow-x-auto text-xs my-2">
                  <code className="block" {...rest}>
                    {children}
                  </code>
                </pre>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }

    if (Array.isArray(content)) {
      return content.map((item, index) => {
        if (item.type === "text") {
          return <div key={index}>{renderContent(item.text)}</div>;
        }
        if (item.type === "file") {
          return (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-2 rounded-md mb-2"
            >
              <FileText className="h-4 w-4" />
              <span>Attached file: {item.mimeType}</span>
            </div>
          );
        }
        return null;
      });
    }

    return <p className="text-sm text-gray-500 italic">Empty message</p>;
  };

  return (
    <div
      className={`flex items-start gap-3 mb-4 ${
        message.role === "user" ? "justify-start" : "justify-start"
      }`}
    >
      <div
        className={`flex items-center justify-center h-8 w-8 rounded-full ${
          message.role === "user" ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        {message.role === "user" ? (
          <User className="h-4 w-4 text-blue-600" />
        ) : (
          <Bot className="h-4 w-4 text-gray-600" />
        )}
      </div>
      <div
        className={`max-w-[85%] p-3 rounded-lg ${
          message.role === "user" ? "bg-blue-50" : "bg-gray-50"
        }`}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}
